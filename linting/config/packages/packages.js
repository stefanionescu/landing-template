export const PACKAGE_JSON_LINT_DEFAULT_FILES = Object.freeze(['package.json']);

export const PACKAGE_JSON_LINT_SCRIPTS_OPEN_PATTERN = '"scripts": {';
export const PACKAGE_JSON_LINT_SEPARATOR_PATTERN = /^\s*"---[^"]+---"\s*:\s*"[^"]*"\s*,?\s*$/;
export const PACKAGE_JSON_LINT_DEPENDENCY_KEYS = Object.freeze([
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]);
export const PACKAGE_JSON_LINT_RANGE_PREFIX_PATTERN = /^[\^~><=]+/;
export const PACKAGE_JSON_LINT_FIX_FLAG = '--fix';
export const PACKAGE_JSON_LINT_INDENT_WIDTH = 4;

export const PACKAGE_JSON_LINT_MESSAGES = Object.freeze({
  fileNotFoundPrefix: 'File not found:',
  missingBlankLine: 'Missing blank line before script section separator',
  indentation: 'Incorrect indentation (expected 4-space indent)',
  rangePrefixIntro: 'Range prefix in',
  rangePrefixReplacement: 'use',
  fixedPrefix: 'Fixed:',
  violationsHeader: 'package.json lint violations:\n',
  violationsSuffix: 'violation(s) found. Run with --fix to auto-correct.',
  pass: 'package.json lint rules passed.',
});
