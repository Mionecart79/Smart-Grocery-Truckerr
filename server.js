const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  const fullPath = path.join(__dirname, reqPath);
  if (!fs.existsSync(fullPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(fullPath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Smart Grocery Truckerr running at http://localhost:${PORT}`);
});
