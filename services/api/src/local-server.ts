import http from 'node:http';
import { handler as health } from './handlers/health.js';

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    const out = await health({} as any, {} as any, () => {});
    res.writeHead(out.statusCode || 200, out.headers as any);
    res.end(out.body);
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(7071, () => console.log('Local API listening on http://localhost:7071'));
