window.ANALYTICS_DEFAULTS = {
  mixpanel: {
    cdnUrl: 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js',
    persistence: 'localStorage',
    recordSessionsPercent: 100,
    recordMaskTextSelector: '',
    debug: false,
    trackPageview: true,
    scrollDepths: [25, 50, 75, 100],
  },
  ga: {
    cdnUrl: 'https://www.googletagmanager.com/gtag/js',
  },
};

window.ANALYTICS_CONFIG = Object.assign(
  {
    mixpanel: null,
    ga: null,
  },
  window.ANALYTICS_CONFIG || {},
);
