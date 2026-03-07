#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT, listTrackedShellFiles, parseArgs } from './commons.js';
import { checkFileLengthLimit, checkFunctionLengthLimit } from './parsers.mjs';
import { SHELL_MAX_FILE_LINES, SHELL_MAX_FUNCTION_LINES } from '../config/limits.js';

const { scope } = parseArgs(process.argv.slice(2), { defaultScope: 'linting' });
const shellFiles = listTrackedShellFiles(scope);

if (shellFiles.length === 0) {
  console.log(`skip (no shell files in scope: ${scope})`);
  process.exit(0);
}

const relPath = (file) => path.relative(REPO_ROOT, file);

const errors = [];
for (const relativePath of shellFiles) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  let source;
  try {
    source = fs.readFileSync(absolutePath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'EISDIR') {
      continue;
    }
    throw err;
  }
  errors.push(...checkFileLengthLimit(absolutePath, source, SHELL_MAX_FILE_LINES, relPath));
  errors.push(...checkFunctionLengthLimit(absolutePath, source, SHELL_MAX_FUNCTION_LINES, relPath));
}

if (errors.length) {
  console.error('Shell script length violations:\n');
  for (const err of errors) {
    console.error(`  ${err.file}:${err.line} — ${err.message}`);
  }
  console.error(`\n${errors.length} violation(s) found.`);
  process.exitCode = 1;
} else {
  console.log('ok');
}
