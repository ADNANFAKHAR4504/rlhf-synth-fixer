const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy' }));
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Product Catalog API', version: '1.0.0' }));
  }
});

const PORT = 80;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
