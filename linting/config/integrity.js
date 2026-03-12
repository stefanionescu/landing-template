export const INTEGRITY_PACKAGE_FILE = 'package.json';
export const INTEGRITY_REQUIRED_FILES = [
  '404.html',
  'linting/config/html/generated.json',
  'linting/config/html/templates.json',
  'linting/config/tooling.env',
  '.githooks/pre-commit',
  '.githooks/pre-push',
  '.githooks/commit-msg',
  '.jscpd/bash.json',
  'knip.json',
  'linting/bin/common.sh',
  'linting/bin/github.sh',
  'linting/bin/lizard.sh',
  'linting/bin/python.sh',
  'linting/bin/semgrep.sh',
  'linting/bin/shellcheck.sh',
  'linting/bin/shfmt.sh',
  'linting/install/bootstrap.sh',
  'linting/install/common.sh',
  'linting/install/github.sh',
  'linting/install/python.sh',
  'linting/links/check.mjs',
  'linting/html-copy.mjs',
  'linting/config/html/copy.js',
  'linting/semgrep/run.sh',
  'linting/lizard/run.sh',
  'linting/security/install.sh',
  'linting/security/gitleaks/run.sh',
  'linting/security/osv/run.sh',
  'linting/config/security/common.env',
  'linting/config/security/gitleaks/gitleaks.env',
  'linting/config/security/gitleaks/baseline.json',
  'linting/config/security/osv.env',
  'linting/config/semgrep.sh',
  'linting/config/security/tool-versions.env',
];

export const INTEGRITY_REQUIRED_SCRIPT_SECTIONS = [
  '---SETUP---',
  '---BUILD---',
  '---LINT---',
  '---LINT:SH---',
  '---SECURITY---',
  '---FORMAT---',
];

export const INTEGRITY_REQUIRED_SCRIPTS = [
  'setup:tooling',
  'setup:hooks',
  'lint',
  'lint:fix',
  'lint:code',
  'lint:analysis',
  'lint:knip',
  'lint:complexity',
  'lint:content',
  'lint:config',
  'lint:rules',
  'lint:hooks',
  'lint:sh',
  'lint:sh:check',
  'lint:sh:format',
  'lint:sh:semgrep',
  'lint:sh:dead',
  'lint:sh:length',
  'lint:sh:justify',
  'lint:sh:docs',
  'lint:sh:naming',
  'lint:sh:structure',
  'lint:pkg',
  'lint:sanity',
  'lint:semgrep',
  'lint:semgrep:hooks',
  'lint:html:hint',
  'lint:html:validate',
  'lint:html:validate:templates',
  'lint:html:validate:generated',
  'lint:html:copy',
  'lint:links',
  'lint:links:external',
  'lint:license',
  'security:gitleaks',
  'security:osv',
  'format',
  'format:check',
  'security:scan',
];

export const INTEGRITY_REQUIRED_OVERRIDE_KEYS = ['@eslint/plugin-kit', 'minimatch', 'tar'];
export const INTEGRITY_PACKAGE_MANAGER = 'bun@1.2.7';
export const INTEGRITY_PACKAGE_INDENT_MARKER = '\n    "scripts": {\n';

export const INTEGRITY_HTML_SCAN_ROOTS = ['pages'];
export const INTEGRITY_HTML_SCAN_SEED_FILES = ['404.html'];
export const INTEGRITY_HTML_SUFFIX = '.html';

export const INTEGRITY_FAVICON_SUBSTRINGS = [
  'rel="icon"',
  "rel='icon'",
  'rel="apple-touch-icon"',
  "rel='apple-touch-icon'",
  'favicon.ico',
  'favicon.png',
  'favicon.svg',
];
export const INTEGRITY_REQUIRED_FAVICON_FILE = 'favicon.ico';

export const INTEGRITY_WEB_MANIFEST_FILE = 'site.webmanifest';
export const INTEGRITY_WEB_MANIFEST_ICON_KEY = 'icons';
export const INTEGRITY_WEB_MANIFEST_ICON_SRC_KEY = 'src';
export const INTEGRITY_EXTERNAL_PATH_PATTERN = /^(https?:|data:)/i;

export const INTEGRITY_ERROR_HEADER = 'lint config integrity check failed:';
export const INTEGRITY_SUCCESS_MESSAGE = 'lint config integrity check passed.';
