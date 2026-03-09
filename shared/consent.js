(function () {
  'use strict';

  var CONSENT_KEY = 'landing_template_consent';
  var CONSENT_VERSION = 1;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500,
  });

  function getConsent() {
    try {
      var stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) return null;
      var parsed = JSON.parse(stored);
      if (parsed.version !== CONSENT_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function saveConsent(accepted) {
    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({
          version: CONSENT_VERSION,
          accepted: accepted,
          timestamp: Date.now(),
        }),
      );
    } catch {
      console.warn('[Consent] Could not save preference');
    }
  }

  function applyGoogleConsent(accepted) {
    var state = accepted ? 'granted' : 'denied';
    gtag('consent', 'update', {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    });
  }

  function getConsentCopy() {
    var siteConfig = window.LANDING_SITE;
    var copy = siteConfig && siteConfig.copy && siteConfig.copy.consent;
    return copy || {};
  }

  function showBanner() {
    if (document.getElementById('consent-banner')) return;

    var copy = getConsentCopy();
    var ariaLabel = copy.ariaLabel || 'Cookie consent';
    var message =
      copy.message ||
      'We use analytics cookies to improve this site. You can accept or reject optional tracking.';
    var rejectLabel = copy.rejectLabel || 'Reject all';
    var acceptLabel = copy.acceptLabel || 'Accept all';

    var banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', ariaLabel);
    banner.innerHTML =
      '<div class="consent-content">' +
      '<p class="consent-text">' +
      message +
      '</p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="consent-btn consent-btn-reject">' +
      rejectLabel +
      '</button>' +
      '<button type="button" class="consent-btn consent-btn-accept">' +
      acceptLabel +
      '</button>' +
      '</div>' +
      '</div>';

    if (!document.getElementById('consent-styles')) {
      var style = document.createElement('style');
      style.id = 'consent-styles';
      style.textContent =
        '.consent-banner { position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; padding: 16px; animation: consent-slide-up 0.3s ease-out; }' +
        '.consent-content { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 18px; box-shadow: 0 12px 36px rgba(2, 6, 23, 0.22); display: flex; flex-direction: column; gap: 14px; }' +
        '.consent-text { margin: 0; font-size: 14px; line-height: 1.5; color: #334155; }' +
        '.consent-actions { display: flex; gap: 10px; }' +
        '.consent-btn { flex: 1; border: 0; border-radius: 10px; padding: 11px 14px; cursor: pointer; font-size: 14px; font-weight: 600; }' +
        '.consent-btn-reject { background: #e2e8f0; color: #1e293b; }' +
        '.consent-btn-accept { background: var(--color-accent, #ea580c); color: #fff; }' +
        '@keyframes consent-slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }' +
        '@keyframes consent-slide-down { to { transform: translateY(100%); opacity: 0; } }' +
        '@media (max-width: 540px) { .consent-banner { padding: 10px; } .consent-actions { flex-direction: column; } }';
      document.head.appendChild(style);
    }

    document.body.appendChild(banner);

    banner.querySelector('.consent-btn-accept').addEventListener('click', function () {
      handleConsent(true);
    });

    banner.querySelector('.consent-btn-reject').addEventListener('click', function () {
      handleConsent(false);
    });
  }

  function hideBanner() {
    var banner = document.getElementById('consent-banner');
    if (banner) {
      banner.style.animation = 'consent-slide-down 0.2s ease-in forwards';
      setTimeout(function () {
        if (banner.parentNode) {
          banner.parentNode.removeChild(banner);
        }
      }, 200);
    }
  }

  function handleConsent(accepted) {
    saveConsent(accepted);
    applyGoogleConsent(accepted);
    hideBanner();

    window.dispatchEvent(
      new CustomEvent('consentUpdated', {
        detail: { accepted: accepted },
      }),
    );

    if (accepted && window.initAnalyticsWithConsent) {
      window.initAnalyticsWithConsent();
    }
  }

  function init() {
    var consent = getConsent();

    if (consent !== null) {
      applyGoogleConsent(consent.accepted);
      window.landingConsentGiven = consent.accepted;
    } else {
      window.landingConsentGiven = false;
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBanner);
      } else {
        showBanner();
      }
    }
  }

  window.LandingConsent = {
    getConsent: getConsent,
    hasConsent: function () {
      var consent = getConsent();
      return consent !== null && consent.accepted === true;
    },
    showBanner: showBanner,
    reset: function () {
      localStorage.removeItem(CONSENT_KEY);
      window.landingConsentGiven = false;
      showBanner();
    },
  };

  init();
})();
