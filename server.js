const http = require('http');
const fs = require('fs');
const path = require('path');

let port = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Normalize URL path
  let filePath = req.url === '/' ? './index.html' : '.' + req.url;
  
  // Prevent directory traversal
  filePath = path.normalize(filePath);
  if (filePath.startsWith('..') || path.isAbsolute(filePath)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.statusCode = 404;
        res.end('File Not Found');
      } else {
        res.statusCode = 500;
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

function startServer() {
  server.listen(port);
}

server.on('listening', () => {
  console.log(`==================================================`);
  console.log(`Kiron Employee Central Dashboard Dev Server Running`);
  console.log(`Local URL: http://localhost:${port}`);
  console.log(`Press Ctrl+C to terminate server`);
  console.log(`==================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} is in use, trying next port...`);
    port++;
    startServer();
  } else {
    console.error('Server error:', err);
  }
});

startServer();
