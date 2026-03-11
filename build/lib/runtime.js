var path = require('path');

var ROOT_DIR = require('./paths').ROOT_DIR;

function getAnalyticsConfig() {
  var configPath = path.join(ROOT_DIR, 'config/analytics.js');
  delete require.cache[require.resolve(configPath)];
  return require(configPath);
}

function serializeForInlineScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildAnalyticsBootstrap() {
  return 'window.ANALYTICS_CONFIG = ' + serializeForInlineScript(getAnalyticsConfig());
}

module.exports.buildAnalyticsBootstrap = buildAnalyticsBootstrap;
