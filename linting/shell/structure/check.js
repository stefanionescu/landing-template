#!/usr/bin/env node

import path from 'node:path';

import { PREFIXED_FILES_THRESHOLD } from '../../config/limits.js';
import { IGNORE_PATHS, SINGLE_FILE_FOLDER_ALLOWLIST } from '../../config/paths.js';
import { REPO_ROOT, listTrackedShellFiles, parseArgs } from '../commons.js';
import { analyzeDirectory, getPrefix, readDirectory } from './util.js';

/** Detects directories that contain only a single shell file and no subdirectories. */
function checkSingleFileFolders(shellFiles) {
  const dirShellCounts = new Map();

  for (const relativePath of shellFiles) {
    const dir = path.posix.dirname(relativePath);
    const count = dirShellCounts.get(dir) ?? 0;
    dirShellCounts.set(dir, count + 1);
  }

  const violations = [];
  for (const [dir, shellCount] of dirShellCounts) {
    if (shellCount !== 1) {
      continue;
    }
    if (SINGLE_FILE_FOLDER_ALLOWLIST.includes(dir)) {
      continue;
    }
    const entries = readDirectory(path.join(REPO_ROOT, dir));
    const hasSubdirs = entries.some((e) => e.isDirectory());
    const totalFiles = entries.filter((e) => e.isFile()).length;
    if (hasSubdirs || totalFiles > 1) {
      continue;
    }
    const file = shellFiles.find((f) => path.posix.dirname(f) === dir);
    violations.push({
      file,
      message: `Directory "${dir}/" contains only a single file. Flatten or regroup related code.`,
    });
  }
  return violations;
}

/** Detects directories where multiple files or subdirectories share the same name prefix. */
function checkPrefixedFiles(shellFiles) {
  const violations = [];
  const reportedDirPrefixes = new Set();

  for (const relativePath of shellFiles) {
    const dir = path.posix.dirname(relativePath);
    const dirAbsPath = path.join(REPO_ROOT, dir);
    const { prefixMap } = analyzeDirectory(dirAbsPath, {
      ignorePaths: IGNORE_PATHS,
      skipIndexFiles: false,
    });

    const basename = path.posix.basename(relativePath);
    const baseNoExt = basename.replace(/\.[^.]+$/, '');
    const prefix = getPrefix(baseNoExt);
    if (!prefix) {
      continue;
    }

    const peers = prefixMap.get(prefix) ?? [];
    if (peers.length < PREFIXED_FILES_THRESHOLD) {
      continue;
    }

    const key = `${dir}::${prefix}`;
    if (reportedDirPrefixes.has(key)) {
      continue;
    }
    reportedDirPrefixes.add(key);

    const hasFiles = peers.some((p) => p.type === 'file');
    const hasDirs = peers.some((p) => p.type === 'dir');
    const names = peers.map((p) => (p.type === 'dir' ? `${p.name}/` : p.name)).join(', ');

    let message;
    if (hasFiles && hasDirs) {
      message = `Entries in "${dir}/" share the "${prefix}" stem/prefix (${names}). Resolve the collision by renaming or reorganizing.`;
    } else if (hasDirs) {
      message = `Directories in "${dir}/" share the "${prefix}" prefix (${names}). Resolve the collision by renaming or reorganizing.`;
    } else {
      message = `Files in "${dir}/" share the "${prefix}" prefix (${peers.length} files: ${names}). Group them in a subfolder and rename to remove the prefix.`;
    }

    violations.push({ file: relativePath, message });
  }
  return violations;
}

/** Entry point: checks shell script directory structure for single-file folders and prefix collisions. */
function main() {
  const { scope } = parseArgs(process.argv.slice(2));
  const shellFiles = listTrackedShellFiles(scope);

  if (shellFiles.length === 0) {
    console.log(`skip (no shell files in scope: ${scope})`);
    return;
  }

  const violations = [...checkSingleFileFolders(shellFiles), ...checkPrefixedFiles(shellFiles)];

  if (violations.length === 0) {
    console.log('ok');
    return;
  }

  console.error('error: shell script structure violations:');
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.message}`);
  }
  console.error(`\n${violations.length} violation(s) found.`);
  process.exit(1);
}

main();
