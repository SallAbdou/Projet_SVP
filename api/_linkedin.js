/* Outils communs des fonctions serveur LinkedIn (api/linkedin/*).
   Même code sur Vercel (fonctions Node) et en local (tools/serve.mjs) : uniquement l'API Node standard.
   Le secret LinkedIn et le jeton d'accès ne quittent jamais le serveur : le jeton vit dans un cookie
   HttpOnly chiffré (AES-256-GCM), illisible par le JavaScript de la page.
   Le préfixe « _ » empêche Vercel d'en faire une route. */
'use strict';
const crypto = require('node:crypto');

const AUTORISATION = 'https://www.linkedin.com/oauth/v2/authorization';
const JETON = 'https://www.linkedin.com/oauth/v2/accessToken';
const REVOCATION = 'https://www.linkedin.com/oauth/v2/revoke';
const API = 'https://api.linkedin.com';
const COOKIE = 'pq_li';
const COOKIE_ETAT = 'pq_li_etat';
const DELAI_MS = 10000;

function env(nom, defaut) {
  const v = process.env[nom];
  return v == null || String(v).trim() === '' ? defaut : String(v).trim();
}

function origine(req) {
  const h = req.headers || {};
  const hote = String(h['x-forwarded-host'] || h.host || 'localhost').split(',')[0].trim();
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(hote);
  const proto = String(h['x-forwarded-proto'] || (local ? 'http' : 'https')).split(',')[0].trim();
  return proto + '://' + hote;
}

function config(req) {
  const id = env('LINKEDIN_CLIENT_ID', '');
  const secret = env('LINKEDIN_CLIENT_SECRET', '');
  const base = origine(req);
  return {
    id, secret, configure: !!(id && secret),
    scopes: env('LINKEDIN_SCOPES', 'openid profile email w_member_social'),
    version: env('LINKEDIN_API_VERSION', '202610'),
    redirection: env('LINKEDIN_REDIRECT_URI', base + '/api/linkedin/callback'),
    securise: base.startsWith('https:')
  };
}

/* ---------- Cookies ---------- */
function lireCookies(req) {
  const out = {};
  String((req.headers || {}).cookie || '').split(';').forEach(function (p) {
    const i = p.indexOf('=');
    if (i > 0) { try { out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); } catch (e) {} }
  });
  return out;
}

function cookie(nom, valeur, opts) {
  const o = opts || {};
  const parts = [nom + '=' + encodeURIComponent(valeur), 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (o.maxAge != null) parts.push('Max-Age=' + Math.max(0, Math.floor(o.maxAge)));
  if (o.securise) parts.push('Secure');
  return parts.join('; ');
}

function cle(cfg) {
  return crypto.createHash('sha256').update(env('LINKEDIN_COOKIE_SECRET', cfg.secret) + '|pq-linkedin').digest();
}

function chiffrer(cfg, obj) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', cle(cfg), iv);
  const data = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), data]).toString('base64url');
}

function dechiffrer(cfg, texte) {
  try {
    const b = Buffer.from(String(texte || ''), 'base64url');
    if (b.length < 29) return null;
    const d = crypto.createDecipheriv('aes-256-gcm', cle(cfg), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'));
  } catch (e) { return null; }
}

function session(req, cfg) {
  const s = dechiffrer(cfg, lireCookies(req)[COOKIE]);
  return s && typeof s.t === 'string' ? s : null;
}

function effacerSession(cfg) { return cookie(COOKIE, '', { maxAge: 0, securise: cfg.securise }); }

/* ---------- Réponses ---------- */
function json(res, code, obj, cookies) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (cookies) res.setHeader('Set-Cookie', cookies);
  res.end(JSON.stringify(obj));
}

function rediriger(res, url, cookies) {
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.setHeader('Cache-Control', 'no-store');
  if (cookies) res.setHeader('Set-Cookie', cookies);
  res.end();
}

function parametres(req) { return new URL(req.url || '/', 'http://x').searchParams; }

// Page de retour après LinkedIn : chemin interne uniquement (pas de « //autre-site »).
function retourSur(v) {
  const s = String(v || '');
  return /^\/(?![\/\\])/.test(s) ? s.slice(0, 400) : '/fournil';
}

function avecParam(chemin, nom, valeur) {
  const u = new URL(chemin, 'http://x');
  u.searchParams.set(nom, valeur);
  return u.pathname + u.search;
}

// Corps JSON d'un POST : déjà lu par Vercel (req.body) ou à lire sur le flux (serveur local).
function lireCorps(req) {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') { try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve(null); } }
    return Promise.resolve(Buffer.isBuffer(req.body) ? (function () { try { return JSON.parse(req.body.toString('utf8')); } catch (e) { return null; } })() : req.body);
  }
  return new Promise(function (ok) {
    let brut = '';
    req.on('data', function (m) { brut += m; if (brut.length > 100000) req.destroy(); });
    req.on('end', function () { try { ok(JSON.parse(brut || 'null')); } catch (e) { ok(null); } });
    req.on('error', function () { ok(null); });
  });
}

// Un POST doit venir du site lui-même (en plus du cookie SameSite=Lax).
function memeOrigine(req) {
  const o = (req.headers || {}).origin;
  return !o || o === origine(req);
}

/* ---------- Appels LinkedIn ---------- */
async function appel(cfg, jeton, chemin, opts) {
  const o = opts || {};
  const entetes = { Authorization: 'Bearer ' + jeton };
  if (o.rest !== false) { entetes['LinkedIn-Version'] = cfg.version; entetes['X-Restli-Protocol-Version'] = '2.0.0'; }
  if (o.corps) entetes['Content-Type'] = 'application/json';
  const res = await fetch(API + chemin, {
    method: o.methode || 'GET', headers: entetes,
    body: o.corps ? JSON.stringify(o.corps) : undefined,
    signal: AbortSignal.timeout(DELAI_MS)
  });
  const texte = await res.text();
  let corps = null;
  try { corps = texte ? JSON.parse(texte) : null; } catch (e) {}
  return { statut: res.status, ok: res.ok, corps, entetes: res.headers };
}

function aScope(s, nom) { return Array.isArray(s.scopes) && s.scopes.indexOf(nom) !== -1; }

function droits(s) {
  return {
    profil: aScope(s, 'profile') || aScope(s, 'openid'),
    email: aScope(s, 'email'),
    publier: aScope(s, 'w_member_social'),
    statsPosts: aScope(s, 'r_member_postAnalytics'),
    abonnes: aScope(s, 'r_member_profileAnalytics')
  };
}

function Expire() { const e = new Error('jeton expiré'); e.expire = true; return e; }

function somme(corps) {
  const el = corps && Array.isArray(corps.elements) ? corps.elements : null;
  if (!el) return null;
  return el.reduce(function (t, e) { return t + (Number(e && e.count) || 0); }, 0);
}

function dateRestli(d) { return '(day:' + d.getUTCDate() + ',month:' + (d.getUTCMonth() + 1) + ',year:' + d.getUTCFullYear() + ')'; }
function plage(jours) {
  const fin = new Date();
  const debut = new Date(fin.getTime() - jours * 864e5);
  return '(start:' + dateRestli(debut) + ',end:' + dateRestli(fin) + ')';
}

const TYPES = { impressions: 'IMPRESSION', membresAtteints: 'MEMBERS_REACHED', reactions: 'REACTION', commentaires: 'COMMENT', republications: 'RESHARE' };

// Une série d'appels : 401 = jeton mort (on remonte), 403 = droit absent, autre échec = erreur.
function verifier(r) {
  if (r.statut === 401) throw Expire();
  return r;
}

async function statsCompte(cfg, s) {
  const out = { posts: { statut: 'sans-acces' }, abonnes: { statut: 'sans-acces' } };
  const d = droits(s);
  const taches = [];
  if (d.statsPosts) {
    const cles = Object.keys(TYPES);
    taches.push(Promise.all(cles.map(function (k) {
      return appel(cfg, s.t, '/rest/memberCreatorPostAnalytics?q=me&queryType=' + TYPES[k] + '&aggregation=TOTAL').then(verifier);
    })).then(function (rs) {
      if (rs.every(function (r) { return !r.ok; })) {
        out.posts = { statut: rs.some(function (r) { return r.statut === 403; }) ? 'sans-acces' : 'erreur', code: rs[0].statut };
        return;
      }
      const totaux = {};
      cles.forEach(function (k, i) { totaux[k] = rs[i].ok ? somme(rs[i].corps) : null; });
      out.posts = { statut: 'ok', totaux, jours: [] };
      return appel(cfg, s.t, '/rest/memberCreatorPostAnalytics?q=me&queryType=IMPRESSION&aggregation=DAILY&dateRange=' + plage(28)).then(verifier).then(function (r) {
        const el = r.ok && r.corps && Array.isArray(r.corps.elements) ? r.corps.elements : [];
        out.posts.jours = el.map(function (e) {
          const st = e && e.dateRange && e.dateRange.start;
          const date = st ? st.year + '-' + String(st.month).padStart(2, '0') + '-' + String(st.day).padStart(2, '0') : '';
          return { date, impressions: Number(e && e.count) || 0 };
        }).filter(function (j) { return j.date; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
      });
    }));
  }
  if (d.abonnes) {
    taches.push(appel(cfg, s.t, '/rest/memberFollowersCount?q=me').then(verifier).then(function (r) {
      const e = r.ok && r.corps && Array.isArray(r.corps.elements) ? r.corps.elements[0] : null;
      out.abonnes = e && typeof e.memberFollowersCount === 'number'
        ? { statut: 'ok', total: e.memberFollowersCount }
        : { statut: r.statut === 403 ? 'sans-acces' : 'erreur', code: r.statut };
    }));
  }
  await Promise.all(taches);
  return out;
}

// Chiffres d'un post publié depuis le fournil (URN connue) ; null si indisponible.
async function statsPost(cfg, s, urn) {
  const type = /^urn:li:ugcPost:/.test(urn) ? 'ugc' : 'share';
  const entite = '(' + type + ':' + encodeURIComponent(urn) + ')';
  const cles = ['impressions', 'reactions', 'commentaires', 'republications'];
  const rs = await Promise.all(cles.map(function (k) {
    return appel(cfg, s.t, '/rest/memberCreatorPostAnalytics?q=entity&entity=' + entite + '&queryType=' + TYPES[k] + '&aggregation=TOTAL').then(verifier);
  }));
  if (!rs.every(function (r) { return r.ok; })) return null;
  const out = {};
  cles.forEach(function (k, i) { out[k] = somme(rs[i].corps) || 0; });
  return out;
}

// Format « little text » de LinkedIn : ces caractères doivent être échappés, sinon le post est tronqué.
function petitTexte(t) { return String(t).replace(/[\\|{}@\[\]()<>#*_~]/g, function (c) { return '\\' + c; }); }

async function publier(cfg, s, texte, visibilite) {
  const r = await appel(cfg, s.t, '/rest/posts', {
    methode: 'POST',
    corps: {
      author: 'urn:li:person:' + s.sub,
      commentary: petitTexte(texte),
      visibility: visibilite === 'CONNECTIONS' ? 'CONNECTIONS' : 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false
    }
  });
  if (r.statut === 401) throw Expire();
  if (!r.ok) {
    const e = new Error('publication refusée (' + r.statut + ')' + (r.corps && r.corps.message ? ' : ' + r.corps.message : ''));
    e.code = r.statut === 403 ? 'droits' : 'linkedin';
    throw e;
  }
  const urn = r.entetes.get('x-restli-id') || r.entetes.get('x-linkedin-id') || '';
  return { urn, url: urn ? 'https://www.linkedin.com/feed/update/' + urn + '/' : 'https://www.linkedin.com/feed/' };
}

module.exports = {
  AUTORISATION, JETON, REVOCATION, COOKIE, COOKIE_ETAT, DELAI_MS,
  config, origine, lireCookies, cookie, chiffrer, dechiffrer, session, effacerSession,
  json, rediriger, parametres, retourSur, avecParam, lireCorps, memeOrigine,
  appel, droits, statsCompte, statsPost, publier
};
