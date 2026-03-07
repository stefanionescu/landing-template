#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT, listTrackedShellFiles, parseArgs } from './commons.js';

const SHELLCHECK_DISABLE_REGEX = /^\s*#\s*shellcheck\s+disable=/;
const JUSTIFY_MARKER_REGEX = /\blint:justify\b/i;
const REASON_REGEX = /--\s*reason:\s*\S+/i;
const TICKET_REGEX = /--\s*ticket:\s*[A-Za-z0-9._-]+/i;

/** Returns true if the line contains a lint:justify marker with both a reason and a ticket. */
function hasJustification(line) {
  return JUSTIFY_MARKER_REGEX.test(line) && REASON_REGEX.test(line) && TICKET_REGEX.test(line);
}

/** Checks whether the given line or a nearby preceding comment line has a valid justification. */
function hasAdjacentJustification(lines, lineIndex) {
  if (hasJustification(lines[lineIndex])) {
    return true;
  }

  for (let offset = 1; offset <= 8; offset += 1) {
    const previousIndex = lineIndex - offset;
    if (previousIndex < 0) {
      break;
    }

    const previousLine = lines[previousIndex].trim();
    if (previousLine.length === 0) {
      continue;
    }

    if (JUSTIFY_MARKER_REGEX.test(previousLine)) {
      return hasJustification(previousLine);
    }

    if (previousLine.startsWith('#')) {
      continue;
    }

    return false;
  }

  return false;
}

/** Scans a file's lines for shellcheck disable directives that lack a justification comment. */
function scanFile(relativePath, lines) {
  const violations = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    if (!SHELLCHECK_DISABLE_REGEX.test(lines[lineIndex])) {
      continue;
    }

    if (hasAdjacentJustification(lines, lineIndex)) {
      continue;
    }

    violations.push({
      file: relativePath,
      line: lineIndex + 1,
    });
  }

  return violations;
}

/** Entry point: scans shell files for unjustified shellcheck disable directives and reports violations. */
function main() {
  const { scope } = parseArgs(process.argv.slice(2));
  const shellFiles = listTrackedShellFiles(scope);

  if (shellFiles.length === 0) {
    console.log(`skip (no shell files in scope: ${scope})`);
    return;
  }

  const violations = [];

  for (const relativePath of shellFiles) {
    const absolutePath = path.join(REPO_ROOT, relativePath);
    let content;
    try {
      content = fs.readFileSync(absolutePath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') {
        continue;
      }
      throw err;
    }
    const lines = content.split(/\r?\n/);
    violations.push(...scanFile(relativePath, lines));
  }

  if (violations.length === 0) {
    console.log('ok');
    return;
  }

  console.error('error: shellcheck disable directives missing justification:');
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line}: shellcheck disable requires a nearby "# lint:justify -- reason: <text> -- ticket: <id>" comment.`,
    );
  }
  console.error(`\n${violations.length} violation(s) found.`);
  process.exit(1);
}

main();
