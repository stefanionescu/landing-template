var fs = require('fs');
var path = require('path');

var DIST_DIR = require('../lib/paths').DIST_DIR;

function build(entries) {
  var today = new Date().toISOString().split('T')[0];
  var sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  entries.forEach(function (entry) {
    sitemap += '  <url>\n';
    sitemap += '    <loc>' + entry.url + '</loc>\n';
    sitemap += '    <lastmod>' + today + '</lastmod>\n';
    sitemap += '    <priority>' + entry.priority + '</priority>\n';
    sitemap += '  </url>\n';
  });

  sitemap += '</urlset>\n';

  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemap);
}

module.exports = { build: build };
