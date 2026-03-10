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

  function showBanner() {
    var banner = document.getElementById('consent-banner');
    if (!banner) return;
    banner.removeAttribute('hidden');
  }

  function hideBanner() {
    var banner = document.getElementById('consent-banner');
    if (!banner) return;
    banner.classList.add('consent-slide-down');
    banner.addEventListener(
      'animationend',
      function () {
        banner.setAttribute('hidden', '');
        banner.classList.remove('consent-slide-down');
      },
      { once: true },
    );
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

      function attachListeners() {
        var banner = document.getElementById('consent-banner');
        if (!banner) return;

        var acceptBtn = banner.querySelector('.consent-btn-accept');
        var rejectBtn = banner.querySelector('.consent-btn-reject');

        if (acceptBtn) {
          acceptBtn.addEventListener('click', function () {
            handleConsent(true);
          });
        }

        if (rejectBtn) {
          rejectBtn.addEventListener('click', function () {
            handleConsent(false);
          });
        }

        showBanner();
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachListeners);
      } else {
        attachListeners();
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
