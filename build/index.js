var copy = require('./lib/copy');
var landing = require('./steps/landing');
var legal = require('./steps/legal');
var sitemap = require('./steps/sitemap');

var BUILD_VERSION = Date.now().toString();

copy.cleanDist();
copy.copyToDist([
  'styles.css',
  'robots.txt',
  'favicon.ico',
  'site.webmanifest',
  '_headers',
  '_redirects',
  '404.html',
  'assets',
  'shared',
  'config',
]);

var landingPages = landing.build(BUILD_VERSION);
var legalPages = legal.build(BUILD_VERSION);
sitemap.build([].concat(landingPages, legalPages));
