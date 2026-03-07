import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  HTML_COPY_EXCLUDED_FILES,
  HTML_COPY_EXCLUDED_PATTERNS,
  HTML_COPY_LETTER_PATTERN,
  HTML_COPY_MESSAGES,
  HTML_COPY_PAGES_DIR,
  HTML_COPY_PLACEHOLDER_ONLY_PATTERN,
  HTML_COPY_USER_TEXT_ATTRIBUTES,
  HTML_COPY_VALUE_TEXT_TAGS,
} from './config/html/copy.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const violations = [];

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function shouldScan(relativePath) {
  if (HTML_COPY_EXCLUDED_FILES.has(relativePath)) {
    return false;
  }

  return !HTML_COPY_EXCLUDED_PATTERNS.some((pattern) => pattern.test(relativePath));
}

function listRootHtmlFiles() {
  const entries = fs.readdirSync(ROOT, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => entry.name);
}

function listPagesHtmlFiles() {
  const pagesPath = path.join(ROOT, HTML_COPY_PAGES_DIR);
  if (!fs.existsSync(pagesPath)) {
    return [];
  }

  const files = [];
  const stack = [pagesPath];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(toPosix(path.relative(ROOT, absolutePath)));
      }
    }
  }

  return files;
}

function isPlaceholderOnly(value) {
  return HTML_COPY_PLACEHOLDER_ONLY_PATTERN.test(value);
}

function isAllowedUserText(value) {
  if (!HTML_COPY_LETTER_PATTERN.test(value)) {
    return true;
  }
  return isPlaceholderOnly(value);
}

function collapse(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function getLineCol(source, index) {
  const before = source.slice(0, index);
  const line = before.split('\n').length;
  const lastNewline = before.lastIndexOf('\n');
  const column = index - lastNewline;
  return { line, column };
}

function report(relativePath, source, index, kind, value) {
  const { line, column } = getLineCol(source, index);
  const preview = collapse(value).slice(0, 100);
  violations.push({ relativePath, line, column, kind, preview });
}

function maybeReportAttributeViolation(context) {
  const { attrName, attrValue, tagName } = context;
  const shouldCheck =
    HTML_COPY_USER_TEXT_ATTRIBUTES.has(attrName) ||
    (attrName === 'value' && HTML_COPY_VALUE_TEXT_TAGS.has(tagName));

  if (shouldCheck && attrValue.trim() !== '' && !isAllowedUserText(attrValue.trim())) {
    report(
      context.relativePath,
      context.source,
      context.tagStart + context.attrOffset,
      `attr:${attrName}`,
      attrValue,
    );
  }
}

function lintTextNodes(relativePath, source, stripped) {
  const textRegex = />([^<]+)</g;
  let match = textRegex.exec(stripped);

  while (match) {
    const rawText = match[1];
    const textStart = match.index + 1;

    if (rawText.trim() !== '' && !isAllowedUserText(rawText.trim())) {
      report(relativePath, source, textStart, 'text-node', rawText);
    }

    match = textRegex.exec(stripped);
  }
}

function lintAttributes(relativePath, source, stripped) {
  const tagRegex = /<([A-Za-z][\w:-]*)([^<>]*)>/g;
  const attrRegex = /([:@A-Za-z_][:\w.-]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let tagMatch = tagRegex.exec(stripped);

  while (tagMatch) {
    const tagName = tagMatch[1].toLowerCase();
    const attrsChunk = tagMatch[2] || '';
    const tagStart = tagMatch.index;
    let attrMatch = attrRegex.exec(attrsChunk);

    while (attrMatch) {
      maybeReportAttributeViolation({
        relativePath,
        source,
        tagStart,
        attrOffset: attrMatch.index,
        attrName: attrMatch[1].toLowerCase(),
        attrValue: attrMatch[3] ?? attrMatch[4] ?? '',
        tagName,
      });

      attrMatch = attrRegex.exec(attrsChunk);
    }

    tagMatch = tagRegex.exec(stripped);
  }
}

function lintFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  const source = fs.readFileSync(absolutePath, 'utf8');

  const stripped = source
    .replace(/<!--[\s\S]*?-->/g, (match) => ' '.repeat(match.length))
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, (match) => ' '.repeat(match.length));

  lintTextNodes(relativePath, source, stripped);
  lintAttributes(relativePath, source, stripped);
}

const htmlFiles = [...new Set([...listRootHtmlFiles(), ...listPagesHtmlFiles()])].sort();
const filesToScan = htmlFiles.filter((relativePath) => shouldScan(relativePath));

for (const relativePath of filesToScan) {
  lintFile(relativePath);
}

if (violations.length === 0) {
  console.log(HTML_COPY_MESSAGES.clean);
  process.exit(0);
}

console.error(HTML_COPY_MESSAGES.header);
for (const violation of violations) {
  console.error(
    `- ${violation.relativePath}:${violation.line}:${violation.column} [${violation.kind}] "${violation.preview}"`,
  );
}
process.exit(1);
