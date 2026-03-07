import fs from 'node:fs';

const FUNC_OPEN_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*\s*\(\)\s*\{/;
const SSH_MATCH_REGEX = /run_ssh\s+(["'])/;
const CLOSING_QUOTE_REGEX = /["']\s*$/;

/** Updates the function nesting depth based on function openings and closing braces. */
function updateFuncDepth(trimmed, depth) {
  let result = depth;
  if (FUNC_OPEN_REGEX.test(trimmed)) {
    result += 1;
  }
  if (trimmed === '}' && result > 0) {
    result -= 1;
  }
  return result;
}

/** Returns true if the trimmed line ends with a closing quote or is a standalone quote character. */
function isClosingQuoteLine(trimmed) {
  return CLOSING_QUOTE_REGEX.test(trimmed) || trimmed === '"' || trimmed === "'";
}

/** Counts occurrences of a quote character in text that are not preceded by a backslash. */
function countUnescapedQuotes(text, quoteChar) {
  let count = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === quoteChar && (index === 0 || text[index - 1] !== '\\')) {
      count += 1;
    }
  }
  return count;
}

/** Returns true if the line starts a multi-line run_ssh block (opening quote is not closed on the same line). */
function isMultiLineSshStart(trimmed) {
  const sshMatch = trimmed.match(SSH_MATCH_REGEX);
  if (!sshMatch) {
    return false;
  }

  const matchPos = trimmed.indexOf(sshMatch[0]);
  const afterRunSsh = trimmed.slice(matchPos + sshMatch[0].length);
  const quoteCount = countUnescapedQuotes(afterRunSsh, sshMatch[1]);
  return quoteCount % 2 === 0;
}

/** Scans a file for multi-line run_ssh blocks that appear outside named functions and returns violations. */
function checkFileForSshBlocks(file, toRelativePath) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const errors = [];
  const state = { funcDepth: 0, sshBlockStart: -1, sshBlockLines: 0, inSshBlock: false };

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trimStart();
    state.funcDepth = updateFuncDepth(trimmed, state.funcDepth);

    if (state.inSshBlock) {
      state.sshBlockLines += 1;
      if (isClosingQuoteLine(trimmed)) {
        if (state.sshBlockLines >= 3 && state.funcDepth === 0) {
          errors.push({
            file: toRelativePath(file),
            line: state.sshBlockStart + 1,
            message: `Multi-line run_ssh block (${state.sshBlockLines} lines) outside a named function`,
          });
        }
        state.inSshBlock = false;
        state.sshBlockLines = 0;
      }
      continue;
    }

    if (!isMultiLineSshStart(trimmed)) {
      continue;
    }

    state.inSshBlock = true;
    state.sshBlockStart = index;
    state.sshBlockLines = 1;
  }

  return errors;
}

/**
 * Detect multi-line `run_ssh` blocks declared outside named shell functions.
 *
 * @param files Shell files to inspect.
 * @param options Rule options and path helpers.
 * @param options.exemptPathPrefixes Path prefixes excluded from this check.
 * @param options.toRelativePath Converts absolute paths to repo-relative paths for reports.
 * @returns Violations describing each unsupported top-level multi-line SSH block.
 */
export function checkUnnamedSshBlocks(files, options) {
  const { exemptPathPrefixes = [], toRelativePath } = options;
  const nonExemptFiles = files.filter(
    (file) => !exemptPathPrefixes.some((prefix) => file.startsWith(prefix)),
  );
  return nonExemptFiles.flatMap((file) => checkFileForSshBlocks(file, toRelativePath));
}
