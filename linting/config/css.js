export const CSS_DEAD_CSS_FILES = ['styles.css'];
export const CSS_DEAD_CONTENT_FILES = [
  '404.html',
  'pages/landing/template.html',
  'pages/legal/template.html',
  'build/**/*.js',
  'shared/**/*.js',
  'config/**/*.js',
];

export const CSS_DEAD_SAFELIST_STANDARD = [];

export const CSS_DEAD_MESSAGES = {
  clean: 'PurgeCSS: no dead selectors found.',
  header: 'PurgeCSS: possible dead selectors detected:',
};
