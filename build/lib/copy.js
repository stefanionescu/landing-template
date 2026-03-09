var fs = require('fs');
var path = require('path');

var ROOT_DIR = require('./paths').ROOT_DIR;
var DIST_DIR = require('./paths').DIST_DIR;

function cleanDist() {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

function copyToDist(relativePaths) {
  relativePaths.forEach(function (relPath) {
    var src = path.join(ROOT_DIR, relPath);
    var dest = path.join(DIST_DIR, relPath);

    if (!fs.existsSync(src)) {
      return;
    }

    var stat = fs.statSync(src);

    if (stat.isDirectory()) {
      copyDirRecursive(src, dest);
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  });
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  var entries = fs.readdirSync(src, { withFileTypes: true });

  entries.forEach(function (entry) {
    var srcPath = path.join(src, entry.name);
    var destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

module.exports = {
  cleanDist: cleanDist,
  copyToDist: copyToDist,
};
