// @ts-check

'use strict';

const INLINE_CODE_REGEX = /`[^`\n]*`/g;

function stripInlineCode(line) {
  return line.replace(INLINE_CODE_REGEX, (match) => ' '.repeat(match.length));
}

function firstDoubleHyphenColumn(line) {
  const sanitized = stripInlineCode(line);
  return sanitized.indexOf('--');
}

module.exports = {
  names: ['no-double-hyphen'],
  description: 'Disallow double hyphens in markdown prose',
  tags: ['content', 'wording'],
  parser: 'markdownit',
  function: function noDoubleHyphen(params, onError) {
    const lines = Array.isArray(params.lines) ? params.lines : [];
    const tokens = params.parsers?.markdownit?.tokens || [];
    const checkedLines = new Set();

    for (const token of tokens) {
      if (token.type !== 'inline' || !Array.isArray(token.map) || token.map.length !== 2) {
        continue;
      }

      for (let lineIndex = token.map[0]; lineIndex < token.map[1]; lineIndex += 1) {
        if (checkedLines.has(lineIndex)) {
          continue;
        }
        checkedLines.add(lineIndex);

        const line = lines[lineIndex] ?? '';
        const column = firstDoubleHyphenColumn(line);
        if (column === -1) {
          continue;
        }

        onError({
          lineNumber: lineIndex + 1,
          detail: 'double hyphen "--" is not allowed; use an em dash (—) or rephrase',
          range: [column + 1, 2],
        });
      }
    }
  },
};
