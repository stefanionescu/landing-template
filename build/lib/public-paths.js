var path = require('path');

var DIST_DIR = require('./paths').DIST_DIR;

function normalizePublicPath(rawPath, sourceLabel) {
  if (typeof rawPath !== 'string') {
    throw new Error(sourceLabel + ' must define path as a string.');
  }

  var publicPath = rawPath.trim();
  if (publicPath === '') {
    throw new Error(sourceLabel + ' must define a non-empty path.');
  }

  if (!publicPath.startsWith('/')) {
    throw new Error(sourceLabel + ' path must start with "/".');
  }

  if (publicPath !== '/' && publicPath.endsWith('/')) {
    publicPath = publicPath.slice(0, -1);
  }

  if (/\/{2,}/.test(publicPath)) {
    throw new Error(sourceLabel + ' path cannot contain duplicate slashes.');
  }

  var segments = publicPath === '/' ? [] : publicPath.slice(1).split('/');
  segments.forEach(function (segment) {
    if (segment === '' || segment === '.' || segment === '..') {
      throw new Error(sourceLabel + ' path contains an invalid segment.');
    }
  });

  return publicPath;
}

function claimPublicPath(occupiedPaths, publicPath, sourceLabel) {
  if (occupiedPaths.has(publicPath)) {
    throw new Error(sourceLabel + ' path conflicts with an existing page: ' + publicPath);
  }

  occupiedPaths.add(publicPath);
}

function getOutputDir(publicPath) {
  if (publicPath === '/') {
    return DIST_DIR;
  }

  return path.join.apply(path, [DIST_DIR].concat(publicPath.slice(1).split('/')));
}

function getOutputHtmlPath(publicPath) {
  return path.join(getOutputDir(publicPath), 'index.html');
}

module.exports.claimPublicPath = claimPublicPath;
module.exports.getOutputDir = getOutputDir;
module.exports.getOutputHtmlPath = getOutputHtmlPath;
module.exports.normalizePublicPath = normalizePublicPath;
