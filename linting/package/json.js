import fs from 'node:fs';
import path from 'node:path';

import {
  PACKAGE_JSON_LINT_DEFAULT_FILES,
  PACKAGE_JSON_LINT_DEPENDENCY_KEYS,
  PACKAGE_JSON_LINT_FIX_FLAG,
  PACKAGE_JSON_LINT_INDENT_WIDTH,
  PACKAGE_JSON_LINT_MESSAGES,
  PACKAGE_JSON_LINT_RANGE_PREFIX_PATTERN,
  PACKAGE_JSON_LINT_SCRIPTS_OPEN_PATTERN,
  PACKAGE_JSON_LINT_SEPARATOR_PATTERN,
} from '../config/packages/index.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const DEFAULT_FILES = PACKAGE_JSON_LINT_DEFAULT_FILES.map((relativeFile) =>
  path.join(ROOT, relativeFile),
);

const fix = process.argv.includes(PACKAGE_JSON_LINT_FIX_FLAG);
const explicitFiles = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const files = explicitFiles.length ? explicitFiles.map((f) => path.resolve(f)) : DEFAULT_FILES;

const relPath = (file) => path.relative(ROOT, file);

const checkBlankLines = (lines, file) => {
  const errors = [];
  let inScripts = false;
  let firstSeparatorSeen = false;
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!inScripts && trimmed === PACKAGE_JSON_LINT_SCRIPTS_OPEN_PATTERN) {
      inScripts = true;
      braceDepth = 1;
      continue;
    }

    if (inScripts) {
      for (const ch of trimmed) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
      }
      if (braceDepth <= 0) {
        inScripts = false;
        firstSeparatorSeen = false;
        continue;
      }

      if (PACKAGE_JSON_LINT_SEPARATOR_PATTERN.test(lines[i])) {
        if (!firstSeparatorSeen) {
          firstSeparatorSeen = true;
          continue;
        }
        const prevLine = i > 0 ? lines[i - 1].trim() : '';
        if (prevLine !== '') {
          errors.push({
            file: relPath(file),
            line: i + 1,
            message: PACKAGE_JSON_LINT_MESSAGES.missingBlankLine,
          });
        }
      }
    }
  }

  return errors;
};

const fixBlankLines = (lines) => {
  let inScripts = false;
  let firstSeparatorSeen = false;
  let braceDepth = 0;
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (!inScripts && trimmed === PACKAGE_JSON_LINT_SCRIPTS_OPEN_PATTERN) {
      inScripts = true;
      braceDepth = 1;
      result.push(lines[i]);
      continue;
    }

    if (inScripts) {
      let localDepth = braceDepth;
      for (const ch of trimmed) {
        if (ch === '{') localDepth++;
        else if (ch === '}') localDepth--;
      }

      if (localDepth <= 0) {
        inScripts = false;
        firstSeparatorSeen = false;
        result.push(lines[i]);
        braceDepth = localDepth;
        continue;
      }
      braceDepth = localDepth;

      if (PACKAGE_JSON_LINT_SEPARATOR_PATTERN.test(lines[i])) {
        if (!firstSeparatorSeen) {
          firstSeparatorSeen = true;
          result.push(lines[i]);
          continue;
        }
        const prevLine = result.length > 0 ? result[result.length - 1].trim() : '';
        if (prevLine !== '') {
          result.push('');
        }
      }
    }

    result.push(lines[i]);
  }

  return result;
};

const checkExactVersions = (lines, file) => {
  const errors = [];
  const parsed = JSON.parse(lines.join('\n'));

  for (const key of PACKAGE_JSON_LINT_DEPENDENCY_KEYS) {
    const deps = parsed[key];
    if (!deps) continue;

    for (const [pkg, version] of Object.entries(deps)) {
      if (PACKAGE_JSON_LINT_RANGE_PREFIX_PATTERN.test(version)) {
        const lineNum = lines.findIndex((l) => l.includes(`"${pkg}"`));
        errors.push({
          file: relPath(file),
          line: lineNum + 1,
          message: `${PACKAGE_JSON_LINT_MESSAGES.rangePrefixIntro} ${key}: "${pkg}": "${version}" ${PACKAGE_JSON_LINT_MESSAGES.rangePrefixReplacement} "${version.replace(PACKAGE_JSON_LINT_RANGE_PREFIX_PATTERN, '')}"`,
        });
      }
    }
  }

  return errors;
};

const fixExactVersions = (lines) => {
  const parsed = JSON.parse(lines.join('\n'));

  for (const key of PACKAGE_JSON_LINT_DEPENDENCY_KEYS) {
    const deps = parsed[key];
    if (!deps) continue;

    for (const [pkg, version] of Object.entries(deps)) {
      if (!PACKAGE_JSON_LINT_RANGE_PREFIX_PATTERN.test(version)) continue;
      const pinned = version.replace(PACKAGE_JSON_LINT_RANGE_PREFIX_PATTERN, '');
      const idx = lines.findIndex((l) => l.includes(`"${pkg}"`) && l.includes(`"${version}"`));
      if (idx !== -1) {
        lines[idx] = lines[idx].replace(`"${version}"`, `"${pinned}"`);
      }
    }
  }

  return lines;
};

const checkIndentation = (lines, file) => {
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^( +)\S/);
    if (match) {
      if (match[1].length % PACKAGE_JSON_LINT_INDENT_WIDTH !== 0) {
        return [
          { file: relPath(file), line: i + 1, message: PACKAGE_JSON_LINT_MESSAGES.indentation },
        ];
      }
      break;
    }
  }
  return [];
};

const fixIndentation = (content) => {
  const parsed = JSON.parse(content);
  return JSON.stringify(parsed, null, PACKAGE_JSON_LINT_INDENT_WIDTH) + '\n';
};

let allErrors = [];

for (const file of files) {
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`${PACKAGE_JSON_LINT_MESSAGES.fileNotFoundPrefix} ${relPath(file)}`);
      process.exitCode = 1;
      continue;
    }
    throw err;
  }

  let lines = content.split('\n');

  if (fix) {
    lines = fixIndentation(lines.join('\n')).split('\n');
    lines = fixBlankLines(lines);
    lines = fixExactVersions(lines);
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log(`${PACKAGE_JSON_LINT_MESSAGES.fixedPrefix} ${relPath(file)}`);
  } else {
    const indentErrors = checkIndentation(lines, file);
    const blankLineErrors = checkBlankLines(lines, file);
    const versionErrors = checkExactVersions(lines, file);
    allErrors.push(...indentErrors, ...blankLineErrors, ...versionErrors);
  }
}

if (!fix) {
  if (allErrors.length) {
    console.error(PACKAGE_JSON_LINT_MESSAGES.violationsHeader);
    for (const err of allErrors) {
      console.error(`  ${err.file}:${err.line} -- ${err.message}`);
    }
    console.error(`\n${allErrors.length} ${PACKAGE_JSON_LINT_MESSAGES.violationsSuffix}`);
    process.exitCode = 1;
  } else {
    console.log(PACKAGE_JSON_LINT_MESSAGES.pass);
  }
}
