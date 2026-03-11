const http = require('http');
const fs = require('fs');
const path = require('path');
const { PORT, MIME_TYPES, ERRORS, LOG } = require('./config/server');

const ROOT = path.join(__dirname, 'dist');

function resolveFilePath(urlPath) {
  const safePath = path.resolve(ROOT, '.' + urlPath);

  if (safePath !== ROOT && !safePath.startsWith(ROOT + path.sep)) {
    return null;
  }

  try {
    const stats = fs.statSync(safePath);
    if (stats.isDirectory()) {
      return path.join(safePath, 'index.html');
    }
    if (stats.isFile()) {
      return safePath;
    }
  } catch (_error) {
    // Fall through to the directory-index lookup below.
  }

  if (path.extname(safePath) !== '') {
    return safePath;
  }

  return path.join(safePath, 'index.html');
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = resolveFilePath(urlPath);

  if (!filePath) {
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

  listRoutes(ROOT).forEach((route) => {
    if (route !== '/') {
      console.log(LOG.pageRoute(route));
    }
  });
  console.log('');
});

function listRoutes(startDir) {
  const routes = [];
  const stack = [{ dir: startDir, route: '/' }];

  while (stack.length > 0) {
    const current = stack.pop();
    const indexPath = path.join(current.dir, 'index.html');
    if (fs.existsSync(indexPath)) {
      routes.push(current.route);
    }

    fs.readdirSync(current.dir, { withFileTypes: true }).forEach((entry) => {
      if (!entry.isDirectory()) {
        return;
      }

      const childRoute =
        current.route === '/' ? '/' + entry.name : current.route + '/' + entry.name;
      stack.push({
        dir: path.join(current.dir, entry.name),
        route: childRoute,
      });
    });
  }

  routes.sort();
  return routes;
}
