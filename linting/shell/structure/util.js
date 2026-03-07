import fs from 'node:fs';

import {
  STRUCTURE_DIRECTORY_CACHE_SEPARATOR,
  STRUCTURE_PREFIX_DELIMITERS,
  STRUCTURE_SKIP_HIDDEN_DIRECTORIES,
  STRUCTURE_SKIP_INDEX_BASENAME,
} from '../../config/structure.js';

const directoryCache = new Map();

/** Derive a grouping prefix from a file or directory base name. */
export function getPrefix(baseNoExt) {
  const cutIndexes = STRUCTURE_PREFIX_DELIMITERS.map((delimiter) =>
    baseNoExt.indexOf(delimiter),
  ).filter((idx) => idx >= 0);

  if (cutIndexes.length === 0) {
    return baseNoExt;
  }

  return baseNoExt.slice(0, Math.min(...cutIndexes));
}

/** Read directory entries and tolerate missing or unreadable paths. */
export function readDirectory(dirAbsPath) {
  try {
    return fs.readdirSync(dirAbsPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

/** Analyze one directory and group files/directories by derived prefix. */
export function analyzeDirectory(dirAbsPath, options = {}) {
  const { ignorePaths = [], skipIndexFiles = false } = options;
  const cacheKey = `${dirAbsPath}${STRUCTURE_DIRECTORY_CACHE_SEPARATOR}${ignorePaths.join(',')}${STRUCTURE_DIRECTORY_CACHE_SEPARATOR}${skipIndexFiles ? '1' : '0'}`;

  if (directoryCache.has(cacheKey)) {
    return directoryCache.get(cacheKey);
  }

  const prefixMap = new Map();
  const entries = readDirectory(dirAbsPath);

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignorePaths.includes(entry.name)) {
        continue;
      }
      if (STRUCTURE_SKIP_HIDDEN_DIRECTORIES && entry.name.startsWith('.')) {
        continue;
      }

      const prefix = getPrefix(entry.name);
      if (!prefix) {
        continue;
      }

      const list = prefixMap.get(prefix) ?? [];
      list.push({ name: entry.name, type: 'dir' });
      prefixMap.set(prefix, list);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const baseNoExt = entry.name.replace(/\.[^.]+$/, '');
    if (skipIndexFiles && baseNoExt === STRUCTURE_SKIP_INDEX_BASENAME) {
      continue;
    }

    const prefix = getPrefix(baseNoExt);
    if (!prefix) {
      continue;
    }

    const list = prefixMap.get(prefix) ?? [];
    list.push({ name: skipIndexFiles ? baseNoExt : entry.name, type: 'file' });
    prefixMap.set(prefix, list);
  }

  const result = { prefixMap };
  directoryCache.set(cacheKey, result);
  return result;
}
