export const LICENSE_CHECKER_CONFIG_FILE = '.license-checker.json';
export const LICENSE_SCOPE_ENV = 'LICENSE_SCOPE';
export const LICENSE_DEFAULT_SCOPE = 'landing';

export const LICENSE_CHECKER_INIT_OPTIONS = {
  production: false,
  direct: false,
};

export const LICENSE_SPLIT_PATTERN = /\s+(?:OR|AND)\s+|\/|,\s*/i;
export const LICENSE_REGEX_ESCAPE_PATTERN = /[.*+?^${}()|[\]\\]/g;
export const LICENSE_WILDCARD_ESCAPE_PATTERN = /\\\*/g;
export const LICENSE_PARENS_PATTERN = /[()]/g;
export const LICENSE_WHITESPACE_PATTERN = /\s+/g;

export const LICENSE_ERRORS = {
  emptyAllowlist: 'license-checker: .license-checker.json has no onlyAllow entries',
  disallowedHeader: 'license-checker: disallowed licenses detected',
  failedHeader: 'license-checker: failed to validate licenses',
};

export const LICENSE_SUCCESS_MESSAGE = 'license-checker: all package licenses are allowed';
export const LICENSE_UNKNOWN = 'UNKNOWN';
