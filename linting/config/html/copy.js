export const HTML_COPY_PAGES_DIR = 'pages';

export const HTML_COPY_EXCLUDED_FILES = new Set(['404.html']);
export const HTML_COPY_EXCLUDED_PATTERNS = [
  /^pages\/landing\/[^/]+\/index\.html$/,
  /^pages\/legal\/[^/]+\/index\.html$/,
];

export const HTML_COPY_USER_TEXT_ATTRIBUTES = new Set([
  'alt',
  'aria-description',
  'aria-label',
  'placeholder',
  'title',
]);

export const HTML_COPY_VALUE_TEXT_TAGS = new Set(['button', 'input', 'option']);

export const HTML_COPY_PLACEHOLDER_ONLY_PATTERN = /^\s*\{\{[A-Z0-9_]+\}\}\s*$/;
export const HTML_COPY_LETTER_PATTERN = /[A-Za-z]/;

export const HTML_COPY_MESSAGES = {
  clean: 'HTML copy lint: no hardcoded user-facing text found.',
  header: 'HTML copy lint: hardcoded user-facing text detected:',
};
