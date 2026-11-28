// Serveur de développement, sans dépendance.
// Imite cleanUrls de Vercel : /fournee sert fournee.html, sinon 404.html avec le statut 404.
// Imite aussi les fonctions Vercel : /api/linkedin/login exécute api/linkedin/login.js,
// avec les variables de .env.local (relu à chaque appel : pas besoin de relancer après l'avoir rempli).
// Usage : node tools/serve.mjs [port]
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
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

const require = createRequire(import.meta.url);

function chargerEnv() {
  let texte = '';
  try { texte = readFileSync(join(ROOT, '.env.local'), 'utf8'); } catch { return; }
  for (const ligne of texte.split(/\r?\n/)) {
    const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    process.env[m[1]] = v;
  }
}

// /api/a/b -> api/a/b.js (les fichiers « _outil.js » ne sont pas des routes, comme sur Vercel).
async function fonctionApi(chemin) {
  const nom = chemin.replace(/^\/api\//, '').replace(/\/+$/, '');
  if (!/^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(nom)) return null;
  const fichier = join(ROOT, 'api', nom + '.js');
  return (await isFile(fichier)) ? fichier : null;
}

async function isFile(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

async function resolvePath(urlPath) {
  let clean;
  try { clean = decodeURIComponent(urlPath.split('?')[0]); } catch { return null; }
  // Fichiers cachés (.env.local, .git…) et sources des fonctions serveur : jamais servis.
  if (clean.split('/').some(seg => seg.startsWith('.')) || clean.startsWith('/api/')) return null;
  const abs = normalize(join(ROOT, clean));
  if (abs !== ROOT && !abs.startsWith(ROOT + sep)) return null;
  if (clean === '/' || clean === '') return join(ROOT, 'index.html');
  if (await isFile(abs)) return abs;
  if (await isFile(abs + '.html')) return abs + '.html';
  return null;
}

createServer(async (req, res) => {
  const chemin = (req.url || '/').split('?')[0];
  if (chemin.startsWith('/api/')) {
    const fichier = await fonctionApi(chemin);
    if (fichier) {
      try {
        chargerEnv();
        await require(fichier)(req, res);
      } catch (err) {
        console.error('Erreur dans ' + chemin + ' :', err);
        if (!res.headersSent) { res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' }); res.end('{"erreur":"serveur"}'); }
      }
      return;
    }
  }
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
