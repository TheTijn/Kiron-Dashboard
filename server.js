const http = require('http');
const fs = require('fs');
const path = require('path');

let port = process.env.PORT || 3000;
const isProduction = !!process.env.PORT;

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

  // Safely parse URL to strip query parameters and hash values
  let pathname = '/';
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    pathname = parsedUrl.pathname;
  } catch (err) {
    pathname = req.url.split('?')[0];
  }

  // Normalize URL path to map to static files
  let filePath = pathname === '/' ? './index.html' : '.' + pathname;
  
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
  server.listen(port, () => {
    console.log(`==================================================`);
    console.log(`Kiron Employee Central Dashboard Server Running`);
    console.log(`Environment: ${isProduction ? 'Production (Hostinger)' : 'Development'}`);
    console.log(`Listening on Port: ${port}`);
    console.log(`Local URL: http://localhost:${port}`);
    console.log(`==================================================`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    if (isProduction) {
      console.error(`CRITICAL: Port ${port} is already in use in production environment!`);
      process.exit(1);
    } else {
      console.log(`Port ${port} is in use locally, trying next port...`);
      port++;
      startServer();
    }
  } else {
    console.error('Server error:', err);
  }
});

startServer();
