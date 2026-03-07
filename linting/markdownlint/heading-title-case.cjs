// @ts-check

'use strict';

const path = require('node:path');

const DEFAULT_LOWERCASE_WORDS = require(
  path.resolve(__dirname, '../config/language/lowercase-words.json'),
);

function tokenize(text) {
  const tokens = [];
  const regex = /(`[^`]+`)|(\s+)|([^\s`]+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'code', value: match[1] });
    } else if (match[2]) {
      tokens.push({ type: 'separator', value: match[2] });
    } else {
      tokens.push({ type: 'word', value: match[3] });
    }
  }
  return tokens;
}

function isPath(word) {
  return word.startsWith('/');
}

function isAllCaps(word) {
  const letters = word.replace(/[^a-zA-Z]/g, '');
  return letters.length > 1 && letters === letters.toUpperCase();
}

function isMixedCaseBrand(word) {
  const letters = word.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 2) return false;
  const firstLetter = letters[0];
  if (firstLetter !== firstLetter.toLowerCase()) return false;
  return letters.slice(1) !== letters.slice(1).toLowerCase();
}

function capitalizeFirst(word) {
  const leadingPunct = /^([("'[]*)(.*)/;
  const match = word.match(leadingPunct);
  if (!match) return word;
  const prefix = match[1];
  const rest = match[2];
  if (!rest) return word;
  return prefix + rest[0].toUpperCase() + rest.slice(1);
}

function lowercaseFirst(word) {
  const leadingPunct = /^([("'[]*)(.*)/;
  const match = word.match(leadingPunct);
  if (!match) return word;
  const prefix = match[1];
  const rest = match[2];
  if (!rest) return word;
  return prefix + rest[0].toLowerCase() + rest.slice(1);
}

function titleCaseSegment(segment, shouldCapitalize) {
  if (shouldCapitalize) {
    return capitalizeFirst(segment);
  }
  return lowercaseFirst(segment);
}

function titleCaseWord(word, shouldCapitalize) {
  if (word.includes('-')) {
    return word
      .split('-')
      .map((seg) => {
        if (isAllCaps(seg) || isMixedCaseBrand(seg)) return seg;
        return titleCaseSegment(seg, shouldCapitalize);
      })
      .join('-');
  }
  return titleCaseSegment(word, shouldCapitalize);
}

function applyTitleCase(tokens, lowercaseWords) {
  const wordTokenIndices = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'word') {
      wordTokenIndices.push(i);
    }
  }

  if (wordTokenIndices.length === 0) return tokens;

  const firstWordIdx = wordTokenIndices[0];
  const lastWordIdx = wordTokenIndices[wordTokenIndices.length - 1];

  return tokens.map((token, i) => {
    if (token.type !== 'word') return token;

    const word = token.value;

    if (isAllCaps(word) || isMixedCaseBrand(word) || isPath(word)) {
      return token;
    }

    const isFirst = i === firstWordIdx;
    const isLast = i === lastWordIdx;
    const stripped = word.replace(/^[("'[]*/, '').toLowerCase();

    if (!isFirst && !isLast && lowercaseWords.includes(stripped)) {
      return { ...token, value: titleCaseWord(word, false) };
    }

    return { ...token, value: titleCaseWord(word, true) };
  });
}

module.exports = {
  names: ['heading-title-case'],
  description: 'Headings should use title case',
  tags: ['headings'],
  parser: 'markdownit',
  function: function headingTitleCase(params, onError) {
    const config = params.config || {};
    const lowercaseWords = config.lowercase_words || DEFAULT_LOWERCASE_WORDS;

    for (const token of params.parsers.markdownit.tokens) {
      if (token.type !== 'heading_open') continue;

      const line = token.line;
      const headingMatch = line.match(/^(#{1,6}\s+)(.+)$/);
      if (!headingMatch) continue;

      const prefix = headingMatch[1];
      const headingText = headingMatch[2];

      const tokens = tokenize(headingText);
      const corrected = applyTitleCase(tokens, lowercaseWords);
      const correctedText = corrected.map((t) => t.value).join('');

      if (correctedText !== headingText) {
        onError({
          lineNumber: token.lineNumber,
          detail: `Expected: "${prefix}${correctedText}"`,
          fixInfo: {
            lineNumber: token.lineNumber,
            deleteCount: line.length,
            insertText: `${prefix}${correctedText}`,
          },
        });
      }
    }
  },
};
