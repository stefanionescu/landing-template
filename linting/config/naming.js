// Forbidden helpers/utils naming patterns
export const FORBIDDEN_SUFFIXES = [
  '_helpers',
  '_utils',
  '-helpers',
  '-utils',
  'Helper',
  'Helpers',
  'Util',
  'Utils',
];
export const FORBIDDEN_PREFIXES = [
  'helpers_',
  'utils_',
  'helpers-',
  'utils-',
  'Helper',
  'Helpers',
  'Util',
  'Utils',
];
export const FORBIDDEN_EXACT = ['helpers', 'utils', 'Helper', 'Helpers', 'Util', 'Utils'];

// Single-field wrapper type names to disallow
export const SINGLE_FIELD_WRAPPER_NAMES = ['data', 'value'];

// Kebab-case segment regex
export const KEBAB_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Test file regex patterns
export const TEST_FILE_RE = /\.test\.[jt]sx?$/;
export const CODE_FILE_RE = /\.[jt]sx?$/;
