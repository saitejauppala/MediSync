import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const buildDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const port = Number(process.env.PORT) || 8080;
if (!fs.existsSync(path.join(buildDirectory, 'index.html'))) {
  throw new Error('Frontend production build is missing. Run npm run build before starting the server.');
}
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const sendFile = (request, response, filePath) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader(
    'Content-Type',
    mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
  );
  response.setHeader(
    'Cache-Control',
    path.basename(filePath) === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
  );
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  fs.createReadStream(filePath).pipe(response);
};

const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Invalid request path');
    return;
  }

  const requestedPath = path.resolve(buildDirectory, `.${pathname}`);
  if (requestedPath !== buildDirectory && !requestedPath.startsWith(`${buildDirectory}${path.sep}`)) {
    response.writeHead(400).end('Invalid request path');
    return;
  }

  fs.stat(requestedPath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(request, response, requestedPath);
      return;
    }
    if (!path.extname(pathname)) {
      sendFile(request, response, path.join(buildDirectory, 'index.html'));
      return;
    }
    response.writeHead(404).end('Not found');
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`MediSync frontend listening on 0.0.0.0:${port}`);
});
