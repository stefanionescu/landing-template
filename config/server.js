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

const ROUTE_PATTERNS = {
  page: /^\/([a-zA-Z0-9_-]+)$/,
  pageFile: /^\/([a-zA-Z0-9_-]+)\/(.+)$/,
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
    return '    /         → default page';
  },
  pageRoute: function (dir) {
    return '    /' + dir + '  → landing page';
  },
};

module.exports = { PORT, MIME_TYPES, ROUTE_PATTERNS, ERRORS, LOG };
