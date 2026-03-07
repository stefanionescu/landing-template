#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import { REPO_ROOT, inScope, listTrackedShellFiles, parseArgs, toPosix } from './commons.js';

const SHELL_FUNCTION_DECL_REGEX = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(\)\s*\{/;
const SHELL_TOKEN_REGEX = /(?:^|[;|&(){}\s])([A-Za-z_][A-Za-z0-9_]*)\b/g;
const POSITIONAL_PARAM_REGEX = /(?:^|[^$])\$(?:[1-9]|[@*]|#)|\$\{(?:[1-9]|[@*]|#)(?::[^}]*)?\}/;
const CONTROL_TOKENS = new Set(['&&', '||', '|', ';', ';;', 'then', 'do', 'fi', 'done', ')']);
const LEADING_FLOW_KEYWORD_REGEX = /^(?:if|then|elif|while|until|for|do|time)\s+/;

/** Resolves a path to a repo-relative POSIX path, or returns null if it falls outside the repo. */
function normalizeRepoPath(candidatePath) {
  const absolutePath = path.isAbsolute(candidatePath)
    ? candidatePath
    : path.resolve(REPO_ROOT, candidatePath);
  const relativePath = toPosix(path.relative(REPO_ROOT, absolutePath));
  if (relativePath.startsWith('..')) {
    return null;
  }
  return relativePath;
}

/** Removes shell comments from a line while respecting single- and double-quoted strings. */
function stripComments(line) {
  let result = '';
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escaped = true;
      continue;
    }

    if (!inDouble && char === "'") {
      inSingle = !inSingle;
      result += char;
      continue;
    }

    if (!inSingle && char === '"') {
      inDouble = !inDouble;
      result += char;
      continue;
    }

    if (!inSingle && !inDouble && char === '#') {
      break;
    }

    result += char;
  }

  return result;
}

/** Returns the net count of opening minus closing braces in the text. */
function countBraceDelta(text) {
  let delta = 0;
  for (const char of text) {
    if (char === '{') {
      delta += 1;
    } else if (char === '}') {
      delta -= 1;
    }
  }
  return delta;
}

/** Extracts all function definitions from a file, tracking positional parameter usage and lint exemptions. */
function collectDefinitions(relativePath, lines, targetSet) {
  if (!targetSet.has(relativePath)) {
    return [];
  }

  const allowAllUnused = lines.some((line) => line.includes('lint:allow-unused-functions'));
  const allowAllDeadParams = lines.some((line) => line.includes('lint:allow-dead-parameters'));

  const allowedUnusedNames = new Set();
  const allowedDeadParamNames = new Set();
  for (const line of lines) {
    const unusedMatch = line.match(/lint:allow-unused-function\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (unusedMatch) {
      allowedUnusedNames.add(unusedMatch[1]);
    }

    const deadParamsMatch = line.match(/lint:allow-dead-parameter\s+([A-Za-z_][A-Za-z0-9_]*)/);
    if (deadParamsMatch) {
      allowedDeadParamNames.add(deadParamsMatch[1]);
    }
  }

  const definitions = [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const match = line.match(SHELL_FUNCTION_DECL_REGEX);
    if (!match) {
      continue;
    }

    const functionName = match[1];
    let endLineIndex = lineIndex;
    let braceBalance = countBraceDelta(stripComments(lines[endLineIndex]));
    while (braceBalance > 0 && endLineIndex + 1 < lines.length) {
      endLineIndex += 1;
      braceBalance += countBraceDelta(stripComments(lines[endLineIndex]));
    }
    const functionBody = lines
      .slice(lineIndex, endLineIndex + 1)
      .map((bodyLine) => stripComments(bodyLine))
      .join('\n');

    definitions.push({
      file: relativePath,
      line: lineIndex + 1,
      name: functionName,
      usesPositionalParams: POSITIONAL_PARAM_REGEX.test(functionBody),
      allowUnused: allowAllUnused || allowedUnusedNames.has(functionName),
      allowDeadParameters: allowAllDeadParams || allowedDeadParamNames.has(functionName),
    });

    lineIndex = endLineIndex;
  }

  return definitions;
}

/** Splits text into shell words, respecting single and double quotes and backslash escapes. */
function splitShellWords(text) {
  const words = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      current += char;
      continue;
    }

    if (!inDouble && char === "'") {
      inSingle = !inSingle;
      current += char;
      continue;
    }

    if (!inSingle && char === '"') {
      inDouble = !inDouble;
      current += char;
      continue;
    }

    if (!inSingle && !inDouble && /\s/.test(char)) {
      if (current.length > 0) {
        words.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    words.push(current);
  }

  return words;
}

/** Truncates text at the first shell control operator (&&, ||, |, ;). */
function truncateAtControlOperators(text) {
  const candidates = [
    text.indexOf(' && '),
    text.indexOf(' || '),
    text.indexOf(' | '),
    text.indexOf(';'),
  ].filter((index) => index >= 0);

  if (candidates.length === 0) {
    return text.trim();
  }

  return text.slice(0, Math.min(...candidates)).trim();
}

/** Counts the number of arguments passed to a function call, stopping at control operators. */
function countCallArguments(rawRemainder) {
  const truncated = truncateAtControlOperators(rawRemainder);
  if (!truncated) {
    return 0;
  }

  const words = splitShellWords(truncated);
  if (words.length === 0) {
    return 0;
  }

  let count = 0;
  for (const word of words) {
    const normalized = word.trim();
    if (!normalized) {
      continue;
    }
    if (CONTROL_TOKENS.has(normalized)) {
      break;
    }
    count += 1;
  }

  return count;
}

/** Scans all sources to find the maximum number of arguments each function is called with. */
function collectFunctionCallArgumentStats(sources, functionNames) {
  const callArgumentStats = new Map();

  for (const lines of sources.values()) {
    for (const line of lines) {
      let withoutComments = stripComments(line).trim();
      if (!withoutComments) {
        continue;
      }

      if (SHELL_FUNCTION_DECL_REGEX.test(withoutComments)) {
        continue;
      }

      while (LEADING_FLOW_KEYWORD_REGEX.test(withoutComments)) {
        withoutComments = withoutComments.replace(LEADING_FLOW_KEYWORD_REGEX, '');
      }

      const callMatch = withoutComments.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\b(.*)$/);
      if (!callMatch) {
        continue;
      }

      const functionName = callMatch[1];
      if (!functionNames.has(functionName)) {
        continue;
      }

      if (callMatch[2].trimStart().startsWith('=')) {
        continue;
      }

      const callArgumentCount = countCallArguments(callMatch[2]);
      const currentMax = callArgumentStats.get(functionName) || 0;
      if (callArgumentCount > currentMax) {
        callArgumentStats.set(functionName, callArgumentCount);
      }
    }
  }

  return callArgumentStats;
}

/** Extracts all identifier tokens from non-declaration lines to build a set of referenced names. */
function collectCallTokens(lines) {
  const tokens = [];

  for (const line of lines) {
    if (SHELL_FUNCTION_DECL_REGEX.test(line)) {
      continue;
    }

    const sanitized = stripComments(line);
    SHELL_TOKEN_REGEX.lastIndex = 0;
    let match = SHELL_TOKEN_REGEX.exec(sanitized);
    while (match) {
      const token = match[1];
      if (token) {
        tokens.push(token);
      }
      match = SHELL_TOKEN_REGEX.exec(sanitized);
    }
  }

  return tokens;
}

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

/** Resolves CLI input paths to a set of in-scope repo-relative paths, defaulting to all available sources. */
function resolveTargetFiles(scope, inputPaths, availableSources) {
  if (inputPaths.length === 0) {
    return new Set(availableSources.keys());
  }

  const targets = new Set();
  for (const rawPath of inputPaths) {
    const normalized = normalizeRepoPath(rawPath);
    if (!normalized) {
      continue;
    }
    if (!inScope(normalized, scope)) {
      continue;
    }
    if (!availableSources.has(normalized)) {
      continue;
    }
    targets.add(normalized);
  }

  return targets;
}

/** Entry point: detects unused shell functions and functions called with arguments they never read. */
function main() {
  const { scope, positional } = parseArgs(process.argv.slice(2), {
    allowPositional: true,
  });
  const sources = loadShellSources(scope);

  if (sources.size === 0) {
    console.log(`skip (no shell files in scope: ${scope})`);
    return;
  }

  const targetFiles = resolveTargetFiles(scope, positional, sources);
  if (targetFiles.size === 0) {
    console.log('skip');
    return;
  }

  const allDefinitions = [];
  const tokenSet = new Set();

  for (const [relativePath, lines] of sources.entries()) {
    const definitions = collectDefinitions(relativePath, lines, targetFiles);
    allDefinitions.push(...definitions);

    for (const token of collectCallTokens(lines)) {
      tokenSet.add(token);
    }
  }

  if (allDefinitions.length === 0) {
    console.log('ok');
    return;
  }

  const unusedDefinitions = allDefinitions.filter(
    (definition) => !definition.allowUnused && !tokenSet.has(definition.name),
  );
  const functionNames = new Set(allDefinitions.map((definition) => definition.name));
  const callArgumentStats = collectFunctionCallArgumentStats(sources, functionNames);
  const deadParameterViolations = allDefinitions.filter((definition) => {
    if (definition.allowDeadParameters) {
      return false;
    }
    if (definition.usesPositionalParams) {
      return false;
    }
    const maxCallArgs = callArgumentStats.get(definition.name) || 0;
    return maxCallArgs > 0;
  });

  if (unusedDefinitions.length === 0 && deadParameterViolations.length === 0) {
    console.log('ok');
    return;
  }

  if (unusedDefinitions.length > 0) {
    console.error('error: unused shell functions detected:');
    for (const violation of unusedDefinitions) {
      console.error(
        `- ${violation.file}:${violation.line}: function "${violation.name}" appears unused in scope "${scope}"`,
      );
    }
  }

  if (deadParameterViolations.length > 0) {
    if (unusedDefinitions.length > 0) {
      console.error('');
    }
    console.error('error: dead shell function parameters detected:');
    for (const violation of deadParameterViolations) {
      const maxCallArgs = callArgumentStats.get(violation.name) || 0;
      console.error(
        `- ${violation.file}:${violation.line}: function "${violation.name}" is called with up to ${maxCallArgs} argument(s) but does not use positional parameters`,
      );
    }
  }

  process.exit(1);
}

main();
