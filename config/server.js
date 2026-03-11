const PORT = 3001;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain',
};

const ERRORS = {
  forbidden: 'Forbidden',
  notFound: 'Not Found',
};

const LOG = {
  serverStart: function (port) {
    return '\n  Server running at http://localhost:' + port + '\n';
  },
  routesHeader: '  Routes:',
  defaultRoute: function () {
    return '    /';
  },
  pageRoute: function (dir) {
    return '    ' + dir;
  },
};

module.exports = { PORT, MIME_TYPES, ERRORS, LOG };
