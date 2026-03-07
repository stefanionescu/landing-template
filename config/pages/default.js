var config = {
  title: 'Landing Template | Ship Faster',
  description:
    'A production-ready starter for static landing pages with SEO, analytics hooks, legal pages, and strict linting.',
  path: '/',
  published: true,

  heroEyebrow: 'Static-first marketing stack',
  heroTitle: 'Launch your next landing page in hours',
  heroDescription:
    'Reuse this structure for product launches, waitlists, feature pages, and campaign microsites.',

  primaryCtaLabel: 'Get Started',
  primaryCtaUrl: '#get-started',
  secondaryCtaLabel: 'View Features',
  secondaryCtaUrl: '#features',

  features: [
    {
      title: 'Template-Driven Pages',
      description:
        'Define page metadata and sections in config files, then generate HTML with one build command.',
    },
    {
      title: 'SEO and Analytics Ready',
      description:
        'Shared utilities handle metadata, schema markup, consent, and optional GA/Mixpanel bootstrapping.',
    },
    {
      title: 'Production Guardrails',
      description:
        'Comes with linting, quality checks, security scans, and git hooks for reliable deployments.',
    },
  ],
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}

if (typeof window !== 'undefined') {
  window.LANDING_PAGE = config;
}
