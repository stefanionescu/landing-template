(function () {
  'use strict';

  var config = window.ANALYTICS_CONFIG || {};
  var mpOverrides = config.mixpanelOptions || {};

  var analyticsInitialized = false;

  function detectVariant() {
    var pathname = window.location.pathname.replace(/^\/|\/$/g, '');
    return pathname || 'default';
  }

  var variant = config.variant || detectVariant();

  function initMixpanel(token) {
    var cdnUrl = mpOverrides.cdnUrl || config.mixpanelCdnUrl;

    (function (f, b) {
      if (!b.__SV) {
        var e, g, i, h;
        window.mixpanel = b;
        b._i = [];
        b.init = function (e, f, c) {
          function g(a, d) {
            var b = d.split('.');
            if (b.length === 2) {
              a = a[b[0]];
              d = b[1];
            }
            a[d] = function () {
              a.push([d].concat(Array.prototype.slice.call(arguments, 0)));
            };
          }
          var a = b;
          if (typeof c !== 'undefined') {
            a = b[c] = [];
          } else {
            c = 'mixpanel';
          }
          a.people = a.people || [];
          a.toString = function (a) {
            var d = 'mixpanel';
            if (c !== 'mixpanel') d += '.' + c;
            if (!a) d += ' (stub)';
            return d;
          };
          a.people.toString = function () {
            return a.toString(1) + '.people (stub)';
          };
          i =
            'disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset init people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove'.split(
              ' ',
            );
          for (h = 0; h < i.length; h++) g(a, i[h]);
          var j = 'set set_once union unset remove delete'.split(' ');
          a.get_group = function () {
            function b(c) {
              d[c] = function () {
                call2_args = arguments;
                call2 = [c].concat(Array.prototype.slice.call(call2_args, 0));
                a.push([e, call2]);
              };
            }
            var d = {};
            var e = ['get_group'].concat(Array.prototype.slice.call(arguments, 0));
            for (var c = 0; c < j.length; c++) b(j[c]);
            return d;
          };
          b._i.push([e, f, c]);
        };
        b.__SV = 1.2;
        e = f.createElement('script');
        e.type = 'text/javascript';
        e.async = true;
        e.src = cdnUrl;
        g = f.getElementsByTagName('script')[0];
        g.parentNode.insertBefore(e, g);
      }
    })(document, window.mixpanel || []);

    var debug = mpOverrides.debug !== undefined ? mpOverrides.debug : config.mixpanelDebug;
    var trackPageview =
      mpOverrides.trackPageview !== undefined
        ? mpOverrides.trackPageview
        : config.mixpanelTrackPageview;
    var persistence = mpOverrides.persistence || config.mixpanelPersistence;
    var recordSessionsPercent =
      mpOverrides.recordSessionsPercent !== undefined
        ? mpOverrides.recordSessionsPercent
        : config.mixpanelRecordSessionsPercent;
    var recordMaskTextSelector =
      mpOverrides.recordMaskTextSelector !== undefined
        ? mpOverrides.recordMaskTextSelector
        : config.mixpanelRecordMaskTextSelector;

    mixpanel.init(token, {
      debug: debug,
      track_pageview: trackPageview,
      persistence: persistence,
      record_sessions_percent: recordSessionsPercent,
      record_mask_text_selector: recordMaskTextSelector,
    });

    mixpanel.register({
      landing_page_variant: variant,
    });

    mixpanel.track('Landing Page View', {
      variant: variant,
      url: window.location.href,
      referrer: document.referrer,
    });

    var scrollDepths = mpOverrides.scrollDepths || config.mixpanelScrollDepths;
    var trackedDepths = {};

    function getScrollPercent() {
      var h = document.documentElement;
      var b = document.body;
      var st = 'scrollTop';
      var sh = 'scrollHeight';
      return Math.round(((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 100);
    }

    window.addEventListener(
      'scroll',
      function () {
        var percent = getScrollPercent();
        scrollDepths.forEach(function (depth) {
          if (percent >= depth && !trackedDepths[depth]) {
            trackedDepths[depth] = true;
            mixpanel.track('Scroll Depth', {
              depth: depth,
              variant: variant,
            });
          }
        });
      },
      { passive: true },
    );
  }

  function initGA(measurementId) {
    var script = document.createElement('script');
    script.async = true;
    script.src = config.gaCdnUrl + '?id=' + measurementId;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', measurementId, {
      custom_map: {
        dimension1: 'landing_variant',
      },
    });

    gtag('set', 'user_properties', {
      landing_variant: variant,
    });
  }

  window.Analytics = {
    track: function (eventName, properties) {
      properties = properties || {};
      properties.variant = variant;

      if (window.mixpanel && typeof mixpanel.track === 'function') {
        mixpanel.track(eventName, properties);
      }

      if (window.gtag) {
        gtag('event', eventName, properties);
      }
    },

    trackCTA: function (ctaName, destination) {
      this.track('CTA Click', {
        cta_name: ctaName,
        destination: destination,
      });
    },

    trackVideo: function (action, currentTime) {
      this.track('Video Interaction', {
        action: action,
        video_time: currentTime,
      });
    },
  };

  function initAllAnalytics() {
    if (analyticsInitialized) return;
    analyticsInitialized = true;

    if (config.mixpanel) {
      initMixpanel(config.mixpanel);
    }

    if (config.ga) {
      initGA(config.ga);
    }
  }

  window.initAnalyticsWithConsent = initAllAnalytics;

  if (window.LandingConsent && window.LandingConsent.hasConsent()) {
    initAllAnalytics();
  } else if (window.landingConsentGiven === true) {
    initAllAnalytics();
  }

  window.addEventListener('consentUpdated', function (e) {
    if (e.detail && e.detail.accepted) {
      initAllAnalytics();
    } else if (window.mixpanel && typeof mixpanel.opt_out_tracking === 'function') {
      mixpanel.opt_out_tracking();
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-track-cta]').forEach(function (el) {
      el.addEventListener('click', function () {
        var ctaName = el.getAttribute('data-track-cta') || el.textContent.trim();
        var destination = el.getAttribute('href') || '';
        window.Analytics.trackCTA(ctaName, destination);
      });
    });
  });
})();
