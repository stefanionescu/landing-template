const http = require('http');
const fs = require('fs');
const path = require('path');
const { PORT, MIME_TYPES, ROUTE_PATTERNS, ERRORS, LOG } = require('./config/server');

const ROOT = path.join(__dirname, 'dist');

function resolveFilePath(urlPath) {
  const cleanPath = urlPath.replace(/\/$/, '') || '/';

  if (cleanPath === '' || cleanPath === '/') {
    return path.join(ROOT, 'pages/landing/default/index.html');
  }

  if (cleanPath === '/terms') {
    return path.join(ROOT, 'pages/legal/terms/index.html');
  }

  if (cleanPath === '/privacy') {
    return path.join(ROOT, 'pages/legal/privacy/index.html');
  }

  const pageMatch = cleanPath.match(ROUTE_PATTERNS.page);
  if (pageMatch) {
    const page = pageMatch[1];
    const pageIndex = path.join(ROOT, 'pages/landing', page, 'index.html');
    if (fs.existsSync(pageIndex)) {
      return pageIndex;
    }
  }

  const pageFileMatch = cleanPath.match(ROUTE_PATTERNS.pageFile);
  if (pageFileMatch) {
    const page = pageFileMatch[1];
    const file = pageFileMatch[2];
    const pageDir = path.join(ROOT, 'pages/landing', page);
    if (fs.existsSync(pageDir)) {
      return path.join(pageDir, file);
    }
  }

  return path.join(ROOT, cleanPath);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = resolveFilePath(urlPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end(ERRORS.forbidden);
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end(ERRORS.notFound);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(LOG.serverStart(PORT));
  console.log(LOG.routesHeader);
  console.log(LOG.defaultRoute());

  const pagesDir = path.join(ROOT, 'pages/landing');
  if (fs.existsSync(pagesDir)) {
    fs.readdirSync(pagesDir).forEach((entry) => {
      const pageDir = path.join(pagesDir, entry);
      if (entry !== 'default' && fs.existsSync(pageDir) && fs.statSync(pageDir).isDirectory()) {
        console.log(LOG.pageRoute(entry));
      }
    });
  }
  console.log('');
});
