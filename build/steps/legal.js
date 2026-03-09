var fs = require('fs');
var path = require('path');

var ROOT_DIR = require('../lib/paths').ROOT_DIR;
var DIST_DIR = require('../lib/paths').DIST_DIR;
var site = require(path.join(ROOT_DIR, 'config/site.js'));
var legalConfig = require(path.join(ROOT_DIR, 'config/legal.js'));

var CONTENT_DIR = path.join(ROOT_DIR, 'content');
var TEMPLATE_PATH = path.join(ROOT_DIR, 'pages/legal/template.html');
var OUTPUT_DIR = path.join(DIST_DIR, 'pages/legal');

function build(buildVersion) {
  var template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  var pages = Object.keys(legalConfig);

  var sitemapEntries = [];

  pages.forEach(function (name) {
    var config = legalConfig[name];
    var mdPath = path.join(CONTENT_DIR, name + '.md');
    var outputPath = path.join(OUTPUT_DIR, name, 'index.html');

    var markdown = fs.readFileSync(mdPath, 'utf-8');
    var content = parseMarkdown(markdown);

    content = replacePlaceholders(content);

    var fullUrl = site.baseUrl + config.path;

    var title = escapeHtml(replacePlaceholders(config.title));
    var description = escapeHtml(replacePlaceholders(config.description));
    var canonicalUrl = escapeHtml(fullUrl);

    var html = template
      .replace('{{PAGE_TITLE}}', title)
      .replace('{{META_DESCRIPTION}}', description)
      .replace('{{CANONICAL_URL}}', canonicalUrl)
      .replace(/\{\{THEME_COLOR\}\}/g, site.themeColor)
      .replace(/\{\{BUILD_VERSION\}\}/g, buildVersion)
      .replace('{{CONTENT}}', content);

    var pageDir = path.join(OUTPUT_DIR, name);
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, html);

    sitemapEntries.push({
      url: fullUrl,
      priority: '0.3',
    });
  });

  return sitemapEntries;
}

function parseMarkdown(markdown) {
  var lines = markdown.split('\n');
  var html = [];
  var inList = false;
  var inSection = false;
  var i = 0;

  while (i < lines.length) {
    var line = lines[i];
    var trimmed = line.trim();

    if (trimmed === '') {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      i++;
      continue;
    }

    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      var title = trimmed.substring(2);
      html.push('<h1 class="legal-title">' + escapeHtml(title) + '</h1>');
      i++;
      continue;
    }

    if (trimmed.startsWith('Last updated:')) {
      html.push('<p class="legal-updated">' + escapeHtml(trimmed) + '</p>');
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      if (inList) {
        html.push('</ul>');
        inList = false;
      }
      if (inSection) {
        html.push('</div>');
      }
      var subtitle = trimmed.substring(3);
      html.push('<div class="legal-section">');
      html.push('<h2 class="legal-subtitle">' + escapeHtml(subtitle) + '</h2>');
      inSection = true;
      i++;
      continue;
    }

    if (trimmed.startsWith('- ')) {
      if (!inList) {
        html.push('<ul class="legal-list">');
        inList = true;
      }
      var listContent = trimmed.substring(2);
      html.push('<li>' + parseInline(listContent) + '</li>');
      i++;
      continue;
    }

    if (inList) {
      html.push('</ul>');
      inList = false;
    }

    if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
      html.push('<p class="legal-text legal-bold-line">' + parseInline(trimmed) + '</p>');
    } else {
      html.push('<p class="legal-text">' + parseInline(trimmed) + '</p>');
    }
    i++;
  }

  if (inList) {
    html.push('</ul>');
  }
  if (inSection) {
    html.push('</div>');
  }

  return html.join('\n    ');
}

function parseInline(text) {
  text = escapeHtml(text);
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );

  return text;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replacePlaceholders(text) {
  return text
    .replace(/\{\{ORG_NAME\}\}/g, site.orgName)
    .replace(/\{\{BASE_URL\}\}/g, site.baseUrl)
    .replace(/\{\{ADMIN_EMAIL\}\}/g, site.emails.admin)
    .replace(/\{\{PRIVACY_EMAIL\}\}/g, site.emails.privacy)
    .replace(/\{\{CONTACT_EMAIL\}\}/g, site.emails.contact);
}

module.exports = { build: build };
