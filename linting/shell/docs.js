#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT, listTrackedShellFiles, parseArgs } from './commons.js';

const SHELL_FUNCTION_DECL_REGEX = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(\)\s*\{/;
const DOC_COMMENT_REGEX = /^#\s+\S+\s+[\u2014\-\u2013:]\s+\S/;
const SHELLCHECK_REGEX = /^\s*#\s*shellcheck\b/;
const FILE_EXEMPT_REGEX = /lint:allow-undocumented-functions/;
const FUNC_EXEMPT_REGEX = /lint:allow-undocumented-function\s+([A-Za-z_][A-Za-z0-9_]*)/;

/** Reads all tracked shell files for the given scope and returns a map of relative paths to line arrays. */
function loadShellSources(scope) {
  const scopedShellFiles = listTrackedShellFiles(scope, {
    includeHookEntrypoints: true,
    includeShebang: true,
  });

  const sources = new Map();
  for (const relativePath of scopedShellFiles) {
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
    sources.set(relativePath, content.split(/\r?\n/));
  }

  return sources;
}

/** Finds shell functions in a file that lack a required doc comment above their declaration. */
function collectViolations(relativePath, lines) {
  const fileExempt = lines.some((line) => FILE_EXEMPT_REGEX.test(line));
  if (fileExempt) {
    return [];
  }

  const exemptedFunctions = new Set();
  for (const line of lines) {
    const match = line.match(FUNC_EXEMPT_REGEX);
    if (match) {
      exemptedFunctions.add(match[1]);
    }
  }

  const violations = [];

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(SHELL_FUNCTION_DECL_REGEX);
    if (!match) {
      continue;
    }

    const functionName = match[1];

    if (functionName === 'main') {
      continue;
    }

    if (exemptedFunctions.has(functionName)) {
      continue;
    }

    let found = false;
    let j = i - 1;
    while (j >= 0) {
      const trimmed = lines[j].trim();
      if (SHELLCHECK_REGEX.test(trimmed)) {
        j -= 1;
        continue;
      }
      if (trimmed === '' || !trimmed.startsWith('#')) {
        break;
      }
      if (DOC_COMMENT_REGEX.test(trimmed)) {
        found = true;
        break;
      }
      j -= 1;
    }
    if (!found) {
      violations.push({ file: relativePath, line: i + 1, name: functionName });
    }
  }

  return violations;
}

/** Entry point: checks all in-scope shell functions for missing doc comments and reports violations. */
function main() {
  const { scope } = parseArgs(process.argv.slice(2));
  const sources = loadShellSources(scope);

  if (sources.size === 0) {
    console.log(`skip (no shell files in scope: ${scope})`);
    return;
  }

  const allViolations = [];
  for (const [relativePath, lines] of sources.entries()) {
    allViolations.push(...collectViolations(relativePath, lines));
  }

  if (allViolations.length === 0) {
    console.log('ok');
    return;
  }

  console.error('error: undocumented shell functions detected:');
  for (const violation of allViolations) {
    console.error(
      `- ${violation.file}:${violation.line}: function "${violation.name}" missing doc comment (expected: # ${violation.name} — description)`,
    );
  }
  process.exit(1);
}

main();
