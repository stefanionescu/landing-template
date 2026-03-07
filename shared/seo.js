(function () {
  var site = window.LANDING_SITE;
  var page = window.LANDING_PAGE;

  if (!site || !page) {
    console.warn('SEO: missing LANDING_SITE or LANDING_PAGE config');
    return;
  }

  var fullUrl = site.baseUrl + page.path;
  var pageTitle = page.title || site.name;
  var pageDescription = page.description || '';
  var ogImage = site.baseUrl + ((site.og && site.og.image) || '/assets/images/opengraph.png');

  function setMeta(selector, content) {
    var el = document.querySelector(selector);
    if (el) {
      el.setAttribute('content', content);
    }
  }

  document.title = pageTitle;

  setMeta('meta[name="description"]', pageDescription);
  setMeta('meta[property="og:title"]', pageTitle);
  setMeta('meta[property="og:description"]', pageDescription);
  setMeta('meta[property="og:type"]', (site.og && site.og.type) || 'website');
  setMeta('meta[property="og:url"]', fullUrl);
  setMeta('meta[property="og:image"]', ogImage);
  setMeta('meta[property="og:image:width"]', (site.og && site.og.imageWidth) || 1200);
  setMeta('meta[property="og:image:height"]', (site.og && site.og.imageHeight) || 630);
  setMeta('meta[property="og:image:type"]', (site.og && site.og.imageType) || 'image/png');
  setMeta(
    'meta[name="twitter:card"]',
    (site.twitter && site.twitter.card) || 'summary_large_image',
  );
  setMeta('meta[property="twitter:title"]', pageTitle);
  setMeta('meta[property="twitter:description"]', pageDescription);
  setMeta('meta[property="twitter:image"]', ogImage);
  setMeta('meta[name="theme-color"]', site.themeColor || '#0f172a');

  var canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute('href', fullUrl);
  }

  var schema = {
    '@context': 'https://schema.org',
    '@type': (site.schema && site.schema.type) || 'WebPage',
    name: pageTitle,
    description: pageDescription,
    url: fullUrl,
    image: ogImage,
    author: {
      '@type': (site.schema && site.schema.author && site.schema.author.type) || 'Organization',
      name: (site.schema && site.schema.author && site.schema.author.name) || site.orgName,
    },
  };

  var existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) {
    existing.remove();
  }

  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
})();
