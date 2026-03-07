// Shared code file extensions (used by 4+ rules)
export const CODE_EXTENSIONS = ['.js', '.cjs', '.mjs', '.ts', '.tsx'];

// Export/barrel file extensions
export const EXPORT_FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Allowed filename suffixes before extension
export const ALLOWED_FILENAME_SUFFIXES = ['.test', '.config', '.d'];

// Directory scopes for rules
export const DEFAULT_SCOPE = ['src', 'tests', 'config', 'types'];
export const PREFIXED_FILES_SCOPE = ['src', 'tests', 'config'];

// Path alias mapping
export const ALIAS_ROOTS = [
  { segment: 'src', aliasPrefix: '@/' },
  { segment: 'tests', aliasPrefix: '@tests/' },
  { segment: 'config', aliasPrefix: '@config/' },
  { segment: 'types', aliasPrefix: '@app-types/' },
];

// Internal import prefixes
export const INTERNAL_PREFIXES = ['./', '../', '@/'];

// JS-only file globs
export const JS_FILES = ['**/*.js', '**/*.cjs', '**/*.mjs'];

// Paths to ignore
export const IGNORE_PATHS = ['node_modules', 'dist', 'coverage'];

// Directories exempt from the single-file-folder rule (relative to repo root)
export const SINGLE_FILE_FOLDER_ALLOWLIST = [
  'linting/lizard',
  'linting/package',
  'linting/semgrep',
  'linting/security/gitleaks',
  'linting/security/osv',
];

// Test directory exclusions (dirs where helper files are allowed)
export const TEST_HELPER_EXCLUDED_DIRS = [
  '/tests/helpers/',
  '/tests/vitest/',
  '/tests/lifecycle/',
  '/tests/mocks/',
];

// Registry file suffixes
export const REGISTRY_SUFFIXES = ['/registry.ts', '/registry.tsx'];

// Disallowed helper barrel import paths
export const DISALLOWED_HELPER_BARRELS = [
  '@tests/helpers',
  '@tests/helpers/index',
  '@tests/helpers/index.js',
  '@/tests/helpers',
  '@/tests/helpers/index',
  '@/tests/helpers/index.js',
];
