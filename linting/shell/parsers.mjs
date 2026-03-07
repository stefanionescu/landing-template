import fs from 'node:fs';
import path from 'node:path';

/**
 * Recursively collects shell script files under a directory.
 *
 * @param dir The directory to scan.
 * @returns The list of discovered `.sh` file paths.
 */
export const collectShellFiles = (dir) => {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectShellFiles(full));
    } else if (entry.name.endsWith('.sh')) {
      results.push(full);
    }
  }
  return results;
};

/**
 * Counts lines in a source string.
 *
 * @param source The source text.
 * @returns The total line count.
 */
export const countLines = (source) => {
  if (source.length === 0) return 0;
  return source.split('\n').length;
};

/**
 * Converts a string index offset to a 1-based line number.
 *
 * @param source The source text.
 * @param index The character offset.
 * @returns The corresponding 1-based line number.
 */
export const lineForIndex = (source, index) => {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor++) {
    if (source[cursor] === '\n') line++;
  }
  return line;
};

/**
 * Extracts shell function ranges from source text.
 *
 * @param source The source text.
 * @returns A list of function names with start/end line metadata.
 */
export const collectShellFunctions = (source) => {
  const functions = [];
  const pattern = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(\)\s*\{/gm;
  let match = pattern.exec(source);

  while (match) {
    const startIndex = match.index;
    const bodyStartIndex = startIndex + match[0].length;
    let depth = 1;
    let endIndex = bodyStartIndex;

    while (endIndex < source.length && depth > 0) {
      if (source[endIndex] === '{') depth++;
      else if (source[endIndex] === '}') depth--;
      endIndex++;
    }

    functions.push({
      name: match[1],
      startLine: lineForIndex(source, startIndex),
      endLine: lineForIndex(source, endIndex),
    });
    match = pattern.exec(source);
  }

  return functions;
};

/**
 * Checks whether a shell file exceeds the configured max line count.
 *
 * @param file The absolute file path being checked.
 * @param source The shell source text.
 * @param maxLines The maximum allowed lines per file.
 * @param relPathFn The function that converts absolute paths to report-relative paths.
 * @returns Collected lint errors for file-length violations.
 */
export const checkFileLengthLimit = (file, source, maxLines, relPathFn) => {
  const errors = [];
  const totalLines = countLines(source);
  if (totalLines > maxLines) {
    errors.push({
      file: relPathFn(file),
      line: 1,
      message: `File exceeds max length (${totalLines} > ${maxLines})`,
    });
  }
  return errors;
};

/**
 * Checks whether any shell function exceeds the configured max line count.
 *
 * @param file The absolute file path being checked.
 * @param source The shell source text.
 * @param maxLines The maximum allowed lines per function.
 * @param relPathFn The function that converts absolute paths to report-relative paths.
 * @returns Collected lint errors for function-length violations.
 */
export const checkFunctionLengthLimit = (file, source, maxLines, relPathFn) => {
  const errors = [];
  for (const fn of collectShellFunctions(source)) {
    const fnLines = fn.endLine - fn.startLine + 1;
    if (fnLines > maxLines) {
      errors.push({
        file: relPathFn(file),
        line: fn.startLine,
        message: `Function ${fn.name} exceeds max length (${fnLines} > ${maxLines})`,
      });
    }
  }
  return errors;
};
