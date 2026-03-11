export const LINKS_HOST = '127.0.0.1';
export const LINKS_DEFAULT_MODE = 'internal';
export const LINKS_SUPPORTED_MODES = ['internal', 'external'];
export const LINKS_USAGE = 'Usage: node linting/links/check.mjs <internal|external>';

export const LINKS_VARIANT_ROOT = 'dist';
export const LINKS_SEED_ROUTES = ['/', '/terms', '/privacy'];

export const LINKS_SERVER_CMD = 'bun';
export const LINKS_SERVER_ARGS = ['server.js'];
export const LINKS_RUNNER_CMD = 'bunx';
export const LINKS_BUILD_CMD = 'node';
export const LINKS_BUILD_ARGS = ['build/index.js'];

export const LINKS_TOOL = 'linkinator';
export const LINKS_BASE_ARGS = [
  '--recurse',
  '--check-css',
  '--check-fragments',
  '--redirects',
  'error',
  '--timeout',
  '15000',
  '--concurrency',
  '25',
  '--retry-errors',
  '--retry-errors-count',
  '2',
  '--verbosity',
  'error',
  '--skip',
  '^mailto:',
  '--skip',
  '^tel:',
  '--skip',
  '^sms:',
];

export const LINKS_EXTERNAL_STATUS_OVERRIDES = ['403:warn', '429:warn'];
export const LINKS_EXTERNAL_SKIP_PATTERNS = ['^https://example\\.com(?:/.*)?$'];

export const LINKS_READY_TIMEOUT_MS = 15000;
export const LINKS_READY_REQUEST_TIMEOUT_MS = 2000;
export const LINKS_READY_POLL_INTERVAL_MS = 250;
export const LINKS_SERVER_SHUTDOWN_WAIT_MS = 1000;

export const LINKS_READY_MIN_STATUS = 200;
export const LINKS_READY_MAX_STATUS = 500;

export const LINKS_ERROR_PREFIX = 'link check failed:';
export const LINKS_LOCALHOST_SCHEME = 'http';
