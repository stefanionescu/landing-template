// Valid project scopes and their path prefixes.
export const VALID_SCOPES = ['all', 'landing', 'hooks', 'linting'];
export const SCOPE_PREFIXES = {
  all: '',
  landing: '',
  hooks: '.githooks/',
  linting: 'linting/',
};

// Node.js version constraint.
export const NODE_VERSION = '>=20.0.0 <21.0.0';

// Identifier regex for banned-terms and shell scanners.
export const IDENTIFIER_REGEX = /[A-Za-z_][A-Za-z0-9_]*/g;
