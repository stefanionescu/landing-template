#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { VALID_SCOPES as PROJECT_SCOPES, SCOPE_PREFIXES } from '../config/projects.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '../..');

export const VALID_SCOPES = new Set(PROJECT_SCOPES);

const HOOK_ENTRYPOINTS = new Set([
  '.githooks/pre-commit',
  '.githooks/pre-push',
  '.githooks/commit-msg',
]);

/**
 * Print a standardized lint failure message and terminate the process.
 *
 * @param message Failure reason shown to stderr.
 */
export function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

/**
 * Parse CLI args and resolve the active lint scope.
 *
 * @param argv Raw CLI arguments (excluding node/bin).
 * @param options Parser options.
 * @param options.defaultScope Scope value to use when no `--scope` is provided.
 * @param options.allowPositional Whether non-flag args should be returned as `positional`.
 * @returns Scope information; includes `positional` entries when enabled.
 */
export function parseArgs(argv, options = {}) {
  const { defaultScope = 'all', allowPositional = false } = options;
  let scope = defaultScope;
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--scope') {
      scope = String(argv[index + 1] || '').trim();
      index += 1;
      continue;
    }
    if (arg.startsWith('--scope=')) {
      scope = arg.slice('--scope='.length).trim();
      continue;
    }
    if (allowPositional) {
      positional.push(arg);
    }
  }

  if (!VALID_SCOPES.has(scope)) {
    fail(`invalid scope "${scope}". expected one of: ${[...VALID_SCOPES].join(', ')}`);
  }

  return allowPositional ? { scope, positional } : { scope };
}

/**
 * Normalize a relative path to POSIX separators.
 *
 * @param relativePath Path relative to repository root.
 * @returns Path using `/` separators.
 */
export function toPosix(relativePath) {
  return relativePath.replaceAll('\\', '/');
}

/**
 * Check whether a path belongs to the selected project scope.
 *
 * @param relativePath Repo-relative path in POSIX format.
 * @param scope Active lint scope (`all`, `api`, `supabase`, etc.).
 * @returns `true` when the path should be included for the scope.
 */
export function inScope(relativePath, scope) {
  if (scope === 'all') {
    return true;
  }
  return relativePath.startsWith(SCOPE_PREFIXES[scope]);
}

function readFirstLine(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const newlineIndex = content.indexOf('\n');
    if (newlineIndex === -1) {
      return content;
    }
    return content.slice(0, newlineIndex);
  } catch {
    return '';
  }
}

function hasShellShebang(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  const firstLine = readFirstLine(absolutePath);
  return /^#!.*\b(?:bash|sh)\b/.test(firstLine);
}

function isShellScriptPath(relativePath, options) {
  const { includeHookEntrypoints = false, includeShebang = false } = options;
  if (includeHookEntrypoints && HOOK_ENTRYPOINTS.has(relativePath)) {
    return true;
  }
  if (relativePath.endsWith('.sh')) {
    return true;
  }
  if (includeShebang) {
    return hasShellShebang(relativePath);
  }
  return false;
}

/**
 * List tracked/untracked shell files that should be linted for a scope.
 *
 * @param scope Active lint scope filter.
 * @param options Shell-file detection options.
 * @param options.includeHookEntrypoints Include `.githooks/*` entrypoints.
 * @param options.includeShebang Include non-`.sh` files with a shell shebang.
 * @returns Matching repository file paths in POSIX format.
 */
export function listTrackedShellFiles(scope, options = {}) {
  const output = execFileSync(
    'git',
    ['-C', REPO_ROOT, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { encoding: 'utf8' },
  );

  return output
    .split('\0')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => toPosix(entry))
    .filter((entry) => fs.existsSync(path.join(REPO_ROOT, entry)))
    .filter((entry) => inScope(entry, scope) && isShellScriptPath(entry, options));
}
