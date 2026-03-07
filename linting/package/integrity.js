import fs from 'node:fs';
import path from 'node:path';

import {
  INTEGRITY_ERROR_HEADER,
  INTEGRITY_EXTERNAL_PATH_PATTERN,
  INTEGRITY_FAVICON_SUBSTRINGS,
  INTEGRITY_HTML_SCAN_ROOTS,
  INTEGRITY_HTML_SCAN_SEED_FILES,
  INTEGRITY_HTML_SUFFIX,
  INTEGRITY_PACKAGE_FILE,
  INTEGRITY_PACKAGE_INDENT_MARKER,
  INTEGRITY_PACKAGE_MANAGER,
  INTEGRITY_REQUIRED_FAVICON_FILE,
  INTEGRITY_REQUIRED_FILES,
  INTEGRITY_REQUIRED_OVERRIDE_KEYS,
  INTEGRITY_REQUIRED_SCRIPT_SECTIONS,
  INTEGRITY_REQUIRED_SCRIPTS,
  INTEGRITY_SUCCESS_MESSAGE,
  INTEGRITY_WEB_MANIFEST_FILE,
  INTEGRITY_WEB_MANIFEST_ICON_KEY,
  INTEGRITY_WEB_MANIFEST_ICON_SRC_KEY,
} from '../config/integrity.js';
import { NODE_VERSION } from '../config/projects.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const PACKAGE_FILE = path.join(ROOT, INTEGRITY_PACKAGE_FILE);

const errors = [];

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function listHtmlFiles(relativeDir) {
  const start = path.join(ROOT, relativeDir);
  if (!fs.existsSync(start)) {
    return [];
  }

  const htmlFiles = [];
  const stack = [start];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith(INTEGRITY_HTML_SUFFIX)) {
        htmlFiles.push(path.relative(ROOT, absolutePath));
      }
    }
  }

  return htmlFiles;
}

function cleanWebPath(rawPath) {
  return rawPath.split('#')[0].split('?')[0];
}

function hasFaviconReference(html) {
  const normalized = html.toLowerCase();
  return INTEGRITY_FAVICON_SUBSTRINGS.some((value) => normalized.includes(value));
}

for (const relativePath of INTEGRITY_REQUIRED_FILES) {
  if (!fileExists(relativePath)) {
    errors.push(`missing required file: ${relativePath}`);
  }
}

const htmlFiles = [
  ...INTEGRITY_HTML_SCAN_SEED_FILES,
  ...INTEGRITY_HTML_SCAN_ROOTS.flatMap((relativeDir) => listHtmlFiles(relativeDir)),
];
let faviconReferenced = false;

for (const relativePath of htmlFiles) {
  if (!fileExists(relativePath)) {
    continue;
  }

  const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  if (hasFaviconReference(content)) {
    faviconReferenced = true;
    break;
  }
}

if (faviconReferenced && !fileExists(INTEGRITY_REQUIRED_FAVICON_FILE)) {
  errors.push(
    `${INTEGRITY_REQUIRED_FAVICON_FILE} must exist at repo root when HTML files declare favicon links`,
  );
}

const webManifestPath = path.join(ROOT, INTEGRITY_WEB_MANIFEST_FILE);
if (fs.existsSync(webManifestPath)) {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(webManifestPath, 'utf8'));
  } catch (err) {
    errors.push(`${INTEGRITY_WEB_MANIFEST_FILE} is not valid JSON: ${err.message}`);
    manifest = null;
  }

  if (manifest && Array.isArray(manifest[INTEGRITY_WEB_MANIFEST_ICON_KEY])) {
    for (const icon of manifest[INTEGRITY_WEB_MANIFEST_ICON_KEY]) {
      if (
        !icon ||
        typeof icon[INTEGRITY_WEB_MANIFEST_ICON_SRC_KEY] !== 'string' ||
        icon[INTEGRITY_WEB_MANIFEST_ICON_SRC_KEY].trim() === ''
      ) {
        errors.push(`${INTEGRITY_WEB_MANIFEST_FILE} icons entries must define a non-empty "src"`);
        continue;
      }

      const src = cleanWebPath(icon[INTEGRITY_WEB_MANIFEST_ICON_SRC_KEY].trim());
      if (INTEGRITY_EXTERNAL_PATH_PATTERN.test(src)) {
        continue;
      }

      const absoluteIconPath = src.startsWith('/')
        ? path.join(ROOT, src.slice(1))
        : path.resolve(path.dirname(webManifestPath), src);

      if (!fs.existsSync(absoluteIconPath)) {
        errors.push(
          `${INTEGRITY_WEB_MANIFEST_FILE} icon path does not exist: ${icon[INTEGRITY_WEB_MANIFEST_ICON_SRC_KEY]}`,
        );
      }
    }
  }
}

const rawPackage = fs.readFileSync(PACKAGE_FILE, 'utf8');
const pkg = JSON.parse(rawPackage);
const scripts = pkg.scripts || {};

for (const sectionName of INTEGRITY_REQUIRED_SCRIPT_SECTIONS) {
  if (!(sectionName in scripts)) {
    errors.push(`package.json scripts missing section delimiter: ${sectionName}`);
  }
}

for (const scriptName of INTEGRITY_REQUIRED_SCRIPTS) {
  if (!(scriptName in scripts)) {
    errors.push(`package.json scripts missing required script: ${scriptName}`);
  }
}

if (pkg.private !== true) {
  errors.push('package.json must set "private": true');
}

if (pkg.engines?.node !== NODE_VERSION) {
  errors.push(`package.json engines.node must be "${NODE_VERSION}"`);
}

if (pkg.packageManager !== INTEGRITY_PACKAGE_MANAGER) {
  errors.push(`package.json packageManager must be "${INTEGRITY_PACKAGE_MANAGER}"`);
}

if (!pkg.overrides || typeof pkg.overrides !== 'object') {
  errors.push('package.json must define overrides');
} else {
  for (const overrideKey of INTEGRITY_REQUIRED_OVERRIDE_KEYS) {
    if (!(overrideKey in pkg.overrides)) {
      errors.push(`package.json overrides missing "${overrideKey}"`);
    }
  }
}

if (!rawPackage.includes(INTEGRITY_PACKAGE_INDENT_MARKER)) {
  errors.push('package.json should use 4-space indentation');
}

if (errors.length > 0) {
  console.error(INTEGRITY_ERROR_HEADER);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(INTEGRITY_SUCCESS_MESSAGE);
