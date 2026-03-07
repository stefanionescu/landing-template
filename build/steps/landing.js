var fs = require('fs');
var path = require('path');

var ROOT_DIR = path.join(__dirname, '../..');
var site = require(path.join(ROOT_DIR, 'config/site.js'));

var LANDING_DIR = path.join(ROOT_DIR, 'pages/landing');
var PAGES_CONFIG_DIR = path.join(ROOT_DIR, 'config/pages');
var TEMPLATE_PATH = path.join(LANDING_DIR, 'template.html');
var SEO_MARKER = /<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->/;
var LANDING_COPY_REQUIRED_KEYS = [
  'navAriaLabel',
  'featuresSectionTitle',
  'contactSectionTitle',
  'contactTextPrefix',
  'contactTextSuffix',
  'footerOperatedBy',
  'footerTermsLabel',
  'footerPrivacyLabel',
];

function build(buildVersion) {
  var template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  var landingCopy = getLandingCopy();
  var resolvedCopy = resolveLandingCopy(landingCopy);

  var pageConfigs = fs.readdirSync(PAGES_CONFIG_DIR).filter(function (file) {
    return file.endsWith('.js');
  });

  var sitemapEntries = [];

  pageConfigs.forEach(function (file) {
    var slug = file.replace('.js', '');
    var configPath = path.join(PAGES_CONFIG_DIR, file);
    var htmlPath = path.join(LANDING_DIR, slug, 'index.html');

    delete require.cache[require.resolve(configPath)];
    var page = require(configPath);

    var outputDir = path.join(LANDING_DIR, slug);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    var fullUrl = site.baseUrl + page.path;

    var html = template
      .replace('{{CONFIG_PATH}}', '/config/pages/' + slug + '.js')
      .replace('{{SITE_NAME}}', escapeHtml(site.name || 'Landing Template'))
      .replace(/\{\{NAV_ARIA_LABEL\}\}/g, escapeHtml(resolvedCopy.navAriaLabel))
      .replace('{{HERO_EYEBROW}}', escapeHtml(page.heroEyebrow || 'Static website template'))
      .replace(
        '{{HERO_TITLE}}',
        escapeHtml(page.heroTitle || page.title || site.name || 'Landing Page'),
      )
      .replace(
        '{{HERO_DESCRIPTION}}',
        escapeHtml(
          page.heroDescription ||
            page.description ||
            'Edit config/pages/*.js to customize this page.',
        ),
      )
      .replace('{{PRIMARY_CTA_LABEL}}', escapeHtml(page.primaryCtaLabel || 'Get Started'))
      .replace('{{PRIMARY_CTA_URL}}', escapeAttr(page.primaryCtaUrl || '#'))
      .replace('{{SECONDARY_CTA_LABEL}}', escapeHtml(page.secondaryCtaLabel || 'Learn More'))
      .replace('{{SECONDARY_CTA_URL}}', escapeAttr(page.secondaryCtaUrl || '#features'))
      .replace(/\{\{FEATURES_SECTION_TITLE\}\}/g, escapeHtml(resolvedCopy.featuresSectionTitle))
      .replace(/\{\{CONTACT_SECTION_TITLE\}\}/g, escapeHtml(resolvedCopy.contactSectionTitle))
      .replace(/\{\{CONTACT_TEXT_PREFIX\}\}/g, escapeHtml(resolvedCopy.contactTextPrefix))
      .replace(/\{\{CONTACT_TEXT_SUFFIX\}\}/g, escapeHtml(resolvedCopy.contactTextSuffix))
      .replace(
        '{{CONTACT_EMAIL}}',
        escapeHtml((site.emails && site.emails.contact) || 'hello@example.com'),
      )
      .replace(/\{\{FOOTER_OPERATED_BY\}\}/g, escapeHtml(resolvedCopy.footerOperatedBy))
      .replace(/\{\{FOOTER_TERMS_LABEL\}\}/g, escapeHtml(resolvedCopy.footerTermsLabel))
      .replace(/\{\{FOOTER_PRIVACY_LABEL\}\}/g, escapeHtml(resolvedCopy.footerPrivacyLabel))
      .replace('{{NAV_LINKS}}', buildNavLinks(page))
      .replace('{{FEATURE_CARDS}}', buildFeatureCards(page))
      .replace(/\{\{BUILD_VERSION\}\}/g, buildVersion);

    var seoBlock = buildSeoBlock(page, fullUrl);
    html = html.replace(SEO_MARKER, '<!-- SEO:START -->\n' + seoBlock + '\n    <!-- SEO:END -->');

    fs.writeFileSync(htmlPath, html);

    if (page.published !== false) {
      sitemapEntries.push({
        url: fullUrl,
        priority: slug === 'default' ? '1.0' : '0.8',
      });
    }
  });

  return sitemapEntries;
}

function getLandingCopy() {
  var landingCopy = site.copy && site.copy.landing ? site.copy.landing : null;
  if (!landingCopy || typeof landingCopy !== 'object') {
    throw new Error('config/site.js must define copy.landing for HTML template text placeholders.');
  }

  var missing = LANDING_COPY_REQUIRED_KEYS.filter(function (key) {
    return typeof landingCopy[key] !== 'string' || landingCopy[key].trim() === '';
  });
  if (missing.length > 0) {
    throw new Error('config/site.js copy.landing is missing required keys: ' + missing.join(', '));
  }

  return landingCopy;
}

function resolveLandingCopy(landingCopy) {
  return {
    navAriaLabel: landingCopy.navAriaLabel,
    featuresSectionTitle: landingCopy.featuresSectionTitle,
    contactSectionTitle: landingCopy.contactSectionTitle,
    contactTextPrefix: landingCopy.contactTextPrefix,
    contactTextSuffix: landingCopy.contactTextSuffix,
    footerOperatedBy: landingCopy.footerOperatedBy.replace(/\{\{ORG_NAME\}\}/g, site.orgName),
    footerTermsLabel: landingCopy.footerTermsLabel,
    footerPrivacyLabel: landingCopy.footerPrivacyLabel,
  };
}

function buildNavLinks(page) {
  var links = page.navigation || site.navigation || [];
  if (!Array.isArray(links) || links.length === 0) {
    return '<a class="site-nav-link" href="#features">Features</a>';
  }

  return links
    .map(function (link) {
      return (
        '<a class="site-nav-link" href="' +
        escapeAttr(link.href || '#') +
        '">' +
        escapeHtml(link.label || 'Link') +
        '</a>'
      );
    })
    .join('\n            ');
}

function buildFeatureCards(page) {
  var defaults = [
    {
      title: 'Replaceable Sections',
      description:
        'Use the existing sections as-is or replace them with your own marketing content blocks.',
    },
    {
      title: 'Shared Utilities',
      description:
        'The template includes optional shared scripts for SEO, analytics, consent, and motion helpers.',
    },
    {
      title: 'Strong Tooling',
      description: 'Keep formatting, linting, and security checks aligned from the first commit.',
    },
  ];

  var features =
    Array.isArray(page.features) && page.features.length > 0 ? page.features : defaults;

  return features
    .map(function (feature) {
      return (
        '<article class="feature-card">\n' +
        '              <h3 class="feature-title">' +
        escapeHtml(feature.title || 'Feature') +
        '</h3>\n' +
        '              <p class="feature-description">' +
        escapeHtml(feature.description || '') +
        '</p>\n' +
        '            </article>'
      );
    })
    .join('\n');
}

function buildSeoBlock(page, fullUrl) {
  var title = page.title || site.name || 'Landing Page';
  var description = page.description || '';
  var ogImagePath = (site.og && site.og.image) || '/assets/images/opengraph.png';
  var ogImage = site.baseUrl + ogImagePath;
  var schemaType = (site.schema && site.schema.type) || 'WebPage';
  var authorType = (site.schema && site.schema.author && site.schema.author.type) || 'Organization';
  var authorName =
    (site.schema && site.schema.author && site.schema.author.name) ||
    site.orgName ||
    'Your Company';

  var jsonLd = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: title,
    description: description,
    url: fullUrl,
    image: ogImage,
    author: {
      '@type': authorType,
      name: authorName,
    },
  };

  var jsonLdLines = JSON.stringify(jsonLd, null, 2)
    .split('\n')
    .map(function (line) {
      return '    ' + line;
    })
    .join('\n');

  return [
    '    <title>' + escapeHtml(title) + '</title>',
    '    <meta name="description" content="' + escapeAttr(description) + '">',
    '    <meta property="og:title" content="' + escapeAttr(title) + '">',
    '    <meta property="og:description" content="' + escapeAttr(description) + '">',
    '    <meta property="og:type" content="' +
      escapeAttr((site.og && site.og.type) || 'website') +
      '">',
    '    <meta property="og:url" content="' + escapeAttr(fullUrl) + '">',
    '    <meta property="og:image" content="' + escapeAttr(ogImage) + '">',
    '    <meta property="og:image:width" content="' +
      escapeAttr((site.og && site.og.imageWidth) || '1200') +
      '">',
    '    <meta property="og:image:height" content="' +
      escapeAttr((site.og && site.og.imageHeight) || '630') +
      '">',
    '    <meta property="og:image:type" content="' +
      escapeAttr((site.og && site.og.imageType) || 'image/png') +
      '">',
    '    <meta name="twitter:card" content="' +
      escapeAttr((site.twitter && site.twitter.card) || 'summary_large_image') +
      '">',
    '    <meta property="twitter:title" content="' + escapeAttr(title) + '">',
    '    <meta property="twitter:description" content="' + escapeAttr(description) + '">',
    '    <meta property="twitter:image" content="' + escapeAttr(ogImage) + '">',
    '    <link rel="canonical" href="' + escapeAttr(fullUrl) + '">',
    '    <meta name="theme-color" content="' + escapeAttr(site.themeColor || '#0f172a') + '">',
    '    <script type="application/ld+json">',
    jsonLdLines,
    '    </script>',
  ].join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

module.exports = { build: build };
