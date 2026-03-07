import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_PATTERN = /\$\{[A-Z_]+:-[^}]+\}/;
const EMPTY_DEFAULT_PATTERN = /\$\{[A-Z_]+-\}/;

function findConfigDefault(line) {
  if (line.trimStart().startsWith('#')) {
    return null;
  }
  if (EMPTY_DEFAULT_PATTERN.test(line) && !DEFAULT_PATTERN.test(line)) {
    return null;
  }
  return line.match(DEFAULT_PATTERN);
}

/**
 * Find shell config-default expansions used outside approved config files.
 *
 * @param files Shell files to scan line-by-line.
 * @param options Scanner dependencies and allowlist options.
 * @param options.allowedConfigFiles Absolute file paths allowed to contain defaults.
 * @param options.toRelativePath Converts absolute paths to repo-relative paths for reports.
 * @returns Validation errors with file, line, and message for each violation.
 */
export function checkConfigDefaults(files, options) {
  const { allowedConfigFiles = [], toRelativePath } = options;
  const allowed = new Set(allowedConfigFiles.map((file) => path.resolve(file)));
  const errors = [];

  for (const file of files) {
    if (allowed.has(path.resolve(file))) {
      continue;
    }

    const lines = fs.readFileSync(file, 'utf8').split('\n');
    for (let index = 0; index < lines.length; index += 1) {
      const match = findConfigDefault(lines[index]);
      if (!match) {
        continue;
      }

      errors.push({
        file: toRelativePath(file),
        line: index + 1,
        message: `Config default outside config.sh: ${match[0]}`,
      });
    }
  }

  return errors;
}
