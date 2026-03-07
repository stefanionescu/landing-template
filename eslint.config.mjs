import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';

const sharedGlobals = {
  AbortSignal: 'readonly',
  URL: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  performance: 'readonly',
  requestAnimationFrame: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
};

const browserGlobals = {
  ...sharedGlobals,
  CustomEvent: 'readonly',
  dataLayer: 'writable',
  document: 'readonly',
  gtag: 'readonly',
  localStorage: 'readonly',
  mixpanel: 'readonly',
  navigator: 'readonly',
  sessionStorage: 'readonly',
  window: 'readonly',
};

const nodeGlobals = {
  ...sharedGlobals,
  __dirname: 'readonly',
  __filename: 'readonly',
  Buffer: 'readonly',
  exports: 'readonly',
  global: 'readonly',
  module: 'readonly',
  process: 'readonly',
  require: 'readonly',
};

const universalGlobals = {
  ...browserGlobals,
  ...nodeGlobals,
};

const hardeningRules = {
  eqeqeq: ['error', 'always'],
  curly: ['error', 'all'],
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',
  'no-implicit-coercion': 'error',
  'no-unreachable': 'error',
  'no-unreachable-loop': 'error',
  'no-useless-assignment': 'error',
  'no-useless-catch': 'error',
  'no-constant-binary-expression': 'error',
  'no-self-compare': 'error',
};

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.wrangler/**',
      '.artifacts/**',
      'pages/landing/*/index.html',
      'pages/legal/*/index.html',
      'sitemap.xml',
    ],
  },
  js.configs.recommended,
  {
    files: ['server.js', 'build/**/*.js', 'config/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: universalGlobals,
    },
    rules: {
      ...hardeningRules,
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    files: ['shared/**/*.js', 'pages/landing/*/content.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: browserGlobals,
    },
    rules: {
      ...hardeningRules,
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    files: ['functions/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...sharedGlobals,
        Response: 'readonly',
      },
    },
    rules: {
      ...hardeningRules,
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    files: ['linting/**/*.mjs', 'linting/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: nodeGlobals,
    },
    rules: {
      ...hardeningRules,
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    files: ['linting/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: nodeGlobals,
    },
    rules: {
      ...hardeningRules,
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    files: ['shared/analytics.js'],
    rules: {
      'no-undef': 'off',
    },
  },
  prettierConfig,
];
