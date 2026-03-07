var landing = require('./steps/landing');
var legal = require('./steps/legal');
var sitemap = require('./steps/sitemap');

var BUILD_VERSION = Date.now().toString();

var landingPages = landing.build(BUILD_VERSION);
var legalPages = legal.build(BUILD_VERSION);
sitemap.build([].concat(landingPages, legalPages));
