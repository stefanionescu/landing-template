// Site-wide configuration - shared by build scripts and browser runtime

var config = {
  baseUrl: 'https://example.com',
  name: 'Landing Template',
  orgName: 'Your Company',

  themeColor: '#0f172a',

  og: {
    image: '/assets/images/opengraph.png',
    imageWidth: 1200,
    imageHeight: 630,
    imageType: 'image/png',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
  },

  emails: {
    contact: 'hello@example.com',
    privacy: 'privacy@example.com',
    admin: 'admin@example.com',
  },

  navigation: [
    { label: 'Features', href: '#features' },
    { label: 'Contact', href: '#contact' },
    { label: 'Terms', href: '/terms' },
    { label: 'Privacy', href: '/privacy' },
  ],

  // Shared user-facing copy for HTML templates
  copy: {
    landing: {
      navAriaLabel: 'Primary navigation',
      featuresSectionTitle: 'Built-In Sections',
      contactSectionTitle: 'Need Help?',
      contactTextPrefix: 'Reach out at',
      contactTextSuffix: '.',
      footerOperatedBy: 'This site is operated by {{ORG_NAME}}.',
      footerTermsLabel: 'Terms',
      footerPrivacyLabel: 'Privacy',
    },
    consent: {
      ariaLabel: 'Cookie consent',
      message:
        'We use analytics cookies to improve this site. You can accept or reject optional tracking.',
      rejectLabel: 'Reject all',
      acceptLabel: 'Accept all',
    },
  },

  schema: {
    type: 'WebPage',
    author: {
      type: 'Organization',
      name: 'Your Company',
    },
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}

if (typeof window !== 'undefined') {
  window.LANDING_SITE = config;
}
