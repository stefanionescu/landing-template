import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import {
  LICENSE_CHECKER_CONFIG_FILE,
  LICENSE_CHECKER_INIT_OPTIONS,
  LICENSE_DEFAULT_SCOPE,
  LICENSE_ERRORS,
  LICENSE_PARENS_PATTERN,
  LICENSE_REGEX_ESCAPE_PATTERN,
  LICENSE_SCOPE_ENV,
  LICENSE_SPLIT_PATTERN,
  LICENSE_SUCCESS_MESSAGE,
  LICENSE_UNKNOWN,
  LICENSE_WHITESPACE_PATTERN,
  LICENSE_WILDCARD_ESCAPE_PATTERN,
} from '../config/license.js';

const require = createRequire(import.meta.url);
const licenseChecker = require('license-checker');

const rootDir = process.cwd();
const configPath = path.join(rootDir, LICENSE_CHECKER_CONFIG_FILE);
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const allowedPatterns = Array.isArray(config.onlyAllow) ? config.onlyAllow : [];
const scope = process.env[LICENSE_SCOPE_ENV] || LICENSE_DEFAULT_SCOPE;
const excludedPackages = new Set([
  ...(config.excludePackages?.all || []),
  ...(config.excludePackages?.[scope] || []),
]);

if (allowedPatterns.length === 0) {
  console.error(LICENSE_ERRORS.emptyAllowlist);
  process.exit(1);
}

function escapeRegex(value) {
  return value.replace(LICENSE_REGEX_ESCAPE_PATTERN, '\\$&');
}

function buildPatternRegex(pattern) {
  const escaped = escapeRegex(pattern).replace(LICENSE_WILDCARD_ESCAPE_PATTERN, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

const allowRegexes = allowedPatterns.map(buildPatternRegex);

function normalizeLicense(value) {
  return String(value || '').trim();
}

function matchesAllowedPattern(value) {
  return allowRegexes.some((regex) => regex.test(value));
}

function splitExpression(value) {
  const cleaned = value
    .replace(LICENSE_PARENS_PATTERN, ' ')
    .replace(LICENSE_WHITESPACE_PATTERN, ' ')
    .trim();
  if (!cleaned) return [];
  return cleaned
    .split(LICENSE_SPLIT_PATTERN)
    .map((token) => token.trim())
    .filter(Boolean);
}

function isAllowedLicense(value) {
  if (!value) return false;
  if (matchesAllowedPattern(value)) return true;
  const tokens = splitExpression(value);
  return tokens.length > 0 && tokens.every(matchesAllowedPattern);
}

function collectPackages() {
  return new Promise((resolve, reject) => {
    licenseChecker.init(
      {
        start: rootDir,
        ...LICENSE_CHECKER_INIT_OPTIONS,
      },
      (error, packages) => {
        if (error) reject(error);
        else resolve(packages || {});
      },
    );
  });
}

try {
  const packages = await collectPackages();
  const violations = [];

  for (const [name, metadata] of Object.entries(packages)) {
    if (excludedPackages.has(name)) continue;

    const raw = metadata.licenses;
    const licenses = Array.isArray(raw)
      ? raw.map(normalizeLicense).filter(Boolean)
      : [normalizeLicense(raw)].filter(Boolean);

    const isAllowed = licenses.length > 0 && licenses.every(isAllowedLicense);
    if (!isAllowed) {
      violations.push({
        name,
        license: licenses.length > 0 ? licenses.join(' | ') : LICENSE_UNKNOWN,
      });
    }
  }

  if (violations.length > 0) {
    console.error(LICENSE_ERRORS.disallowedHeader);
    for (const violation of violations.sort((a, b) => a.name.localeCompare(b.name))) {
      console.error(`- ${violation.name}: ${violation.license}`);
    }
    process.exit(1);
  }

  console.log(LICENSE_SUCCESS_MESSAGE);
} catch (error) {
  console.error(LICENSE_ERRORS.failedHeader);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
