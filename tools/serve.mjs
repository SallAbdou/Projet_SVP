// Serveur statique de développement, sans dépendance.
// Imite cleanUrls de Vercel : /fournee sert fournee.html, sinon 404.html avec le statut 404.
// Usage : node tools/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT || process.argv[2] || 4174);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml'
};

async function isFile(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

async function resolvePath(urlPath) {
  let clean;
  try { clean = decodeURIComponent(urlPath.split('?')[0]); } catch { return null; }
  const abs = normalize(join(ROOT, clean));
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) return null;
  if (clean === '/' || clean === '') return join(ROOT, 'index.html');
  if (await isFile(abs)) return abs;
  if (await isFile(abs + '.html')) return abs + '.html';
  return null;
}

createServer(async (req, res) => {
  const file = await resolvePath(req.url || '/');
  const target = file || join(ROOT, '404.html');
  try {
    const body = await readFile(target);
    res.writeHead(file ? 200 : 404, { 'Content-Type': TYPES[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Erreur serveur');
  }
}).listen(PORT, () => console.log(`Site servi sur http://localhost:${PORT}`));
