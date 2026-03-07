// @ts-check

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CONFIG_PATH = path.resolve(__dirname, '../config/language/banned-terms.json');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function loadTermsRegex() {
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  const terms = Array.isArray(parsed.bannedTerms) ? parsed.bannedTerms : [];
  const normalized = terms.map((term) => String(term).trim().toLowerCase()).filter(Boolean);
  if (normalized.length === 0) {
    throw new Error('bannedTerms config is empty');
  }

  const alternation = normalized
    .map(escapeRegex)
    .sort((a, b) => b.length - a.length)
    .join('|');
  const flags = parsed.matching?.caseInsensitive ? 'gi' : 'g';
  return new RegExp(`\\b(?:${alternation})\\b`, flags);
}

const termsRegex = loadTermsRegex();

module.exports = {
  names: ['no-banned-terms'],
  description: 'Disallow banned terms in markdown content',
  tags: ['content', 'wording'],
  function: function noBannedTerms(params, onError) {
    const lines = Array.isArray(params.lines) ? params.lines : [];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      termsRegex.lastIndex = 0;
      const match = termsRegex.exec(line);
      if (!match) {
        continue;
      }

      onError({
        lineNumber: index + 1,
        detail: `banned term "${match[0].toLowerCase()}" is not allowed`,
      });
    }
  },
};
