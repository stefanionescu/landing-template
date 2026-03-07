#!/usr/bin/env node

import path from 'node:path';

import { listTrackedShellFiles, parseArgs } from './commons.js';
import { FORBIDDEN_EXACT, FORBIDDEN_SUFFIXES, FORBIDDEN_PREFIXES } from '../config/naming.js';

/** Returns an error message if the file stem matches a forbidden name, suffix, or prefix; null otherwise. */
function checkBasename(stem) {
  if (FORBIDDEN_EXACT.includes(stem)) {
    return `Filename "${stem}.sh" uses a forbidden generic name. Rename to describe its specific purpose.`;
  }
  for (const suffix of FORBIDDEN_SUFFIXES) {
    if (stem.endsWith(suffix)) {
      return `Filename "${stem}.sh" uses a forbidden suffix "${suffix}". Rename to describe its specific purpose.`;
    }
  }
  for (const prefix of FORBIDDEN_PREFIXES) {
    if (stem.startsWith(prefix)) {
      return `Filename "${stem}.sh" uses a forbidden prefix "${prefix}". Rename to describe its specific purpose.`;
    }
  }
  return null;
}

/** Returns an error message if the parent directory name is a forbidden generic name; null otherwise. */
function checkParentDir(dirName) {
  if (FORBIDDEN_EXACT.includes(dirName)) {
    return `Parent directory "${dirName}/" uses a forbidden generic name. Rename to describe its specific purpose.`;
  }
  return null;
}

/** Entry point: checks shell script filenames and parent directories against naming rules. */
function main() {
  const { scope } = parseArgs(process.argv.slice(2));
  const shellFiles = listTrackedShellFiles(scope);

  if (shellFiles.length === 0) {
    console.log(`skip (no shell files in scope: ${scope})`);
    return;
  }

  const violations = [];

  for (const relativePath of shellFiles) {
    const basename = path.posix.basename(relativePath);
    const stem = basename.replace(/\.sh$/, '');
    const parentDir = path.posix.basename(path.posix.dirname(relativePath));

    const basenameError = checkBasename(stem);
    if (basenameError) {
      violations.push({ file: relativePath, message: basenameError });
    }

    const parentError = checkParentDir(parentDir);
    if (parentError) {
      violations.push({ file: relativePath, message: parentError });
    }
  }

  if (violations.length === 0) {
    console.log('ok');
    return;
  }

  console.error('error: shell script naming violations:');
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.message}`);
  }
  console.error(`\n${violations.length} violation(s) found.`);
  process.exit(1);
}

main();
