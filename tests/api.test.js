const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const A = require('../api.js');
const lire = f => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', f), 'utf8'));
const ok = { ref: 'r1', rang: 1, titre: 'T', url: 'https://x.fr', source: 'S', feu: 'vert', raisonFeu: '', axe: 'Axe 1', resume: '', pourToi: '', durabilite: 4, propension: 5, lienOffre: 4 };

test('estReponseValide', () => {
  assert.equal(A.estReponseValide({ etat: 'pret', prenom: 'Léa', articles: [ok] }), true);
  assert.equal(A.estReponseValide({ etat: 'attente' }), true);
  assert.equal(A.estReponseValide({ etat: 'invalide' }), true);
  for (const r of [null, [], {}, { etat: 'fini' }, { etat: 'pret', prenom: 'L' },
    { etat: 'pret', prenom: 'L', articles: [Object.assign({}, ok, { feu: 'bleu' })] },
    { etat: 'pret', prenom: 'L', articles: [Object.assign({}, ok, { durabilite: 6 })] },
    { etat: 'pret', prenom: 'L', articles: [Object.assign({}, ok, { rang: 0 })] }]) {
    assert.equal(A.estReponseValide(r), false, JSON.stringify(r));
  }
});

test('les fichiers de démo respectent le contrat', () => {
  const f = lire('fournee.json');
  assert.equal(A.estReponseValide(f), true);
  assert.equal(f.articles.length, 7);
  assert.deepEqual(f.articles.map(a => a.rang), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(new Set(f.articles.map(a => a.ref)).size, 7);
  for (const a of f.articles) {
    assert.ok(/^https:\/\//.test(a.url), a.ref);
    assert.ok(['Axe 1', 'Axe 2'].includes(a.axe), a.ref);
    assert.ok(a.resume && a.raisonFeu && a.pourToi.startsWith('Pour toi :'), a.ref);
  }
});

const ex = { ref: 'h1', titre: 'Titre', label: 'Court', feu: 'vert', ilYaJours: 3, chiffres: { impressions: 10, reactions: 1, republications: 0, commentaires: 2, contacts: 0 } };
const avec = (champ, v) => Object.assign({}, ex, { [champ]: v });
const chiffresAvec = (champ, v) => avec('chiffres', Object.assign({}, ex.chiffres, { [champ]: v }));

test('postExempleValide', () => {
  assert.equal(A.postExempleValide(ex), true);
  for (const p of [null, [], avec('feu', 'bleu'), avec('ilYaJours', -1), avec('ilYaJours', 1.5), avec('ref', ''),
    avec('label', 3), avec('chiffres', null), chiffresAvec('contacts', -1), chiffresAvec('reactions', 2.5), chiffresAvec('impressions', undefined)]) {
    assert.equal(A.postExempleValide(p), false, JSON.stringify(p));
  }
});

test('l historique d exemple donne les chiffres de la maquette', () => {
  const C = require('../comptoir.js');
  const posts = lire('posts.json');
  assert.equal(posts.length, 10);
  assert.ok(posts.every(A.postExempleValide));
  assert.equal(new Set(posts.map(p => p.ref)).size, 10);
  assert.ok(posts.every(p => p.ilYaJours >= 0 && p.ilYaJours <= 59));
  const k = C.kpis(C.depuisExemples(posts, '2026-11-17T10:00:00.000Z'), '2026-11-17T10:00:00.000Z');
  assert.deepEqual([k.actuel.posts, k.actuel.impressions, k.actuel.reactions, k.actuel.republications], [6, 4820, 312, 27]);
  assert.deepEqual(k.ecarts.posts, { sens: 'hausse', valeur: 2 });
  assert.deepEqual(k.ecarts.impressions, { sens: 'hausse', valeur: 38 });
  assert.deepEqual(k.ecarts.reactions, { sens: 'hausse', valeur: 21 });
  assert.deepEqual(k.ecarts.republications, { sens: 'stable', valeur: 0 });
});

// ---------- Mode réel : WF3 avec le jeton de session ----------
const EXEMPLE = { etat: 'pret', prenom: 'Léa', articles: [ok] };
function rep(status, corps) { return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(corps) }; }
function deps(fetch, jeton) {
  const appels = [];
  return {
    appels,
    fetch: (url, o) => { appels.push({ url, o }); return fetch(url, o); },
    jeton: jeton || (() => Promise.resolve('JETON')),
    url: 'https://n8n.exemple.fr/webhook/file', delaiMs: 30,
    lireExemple: () => Promise.resolve(JSON.parse(JSON.stringify(EXEMPLE)))
  };
}

test('fournée réelle : POST avec Bearer et corps {}, réponse WF3 telle quelle', async () => {
  const wf3 = { etat: 'pret', prenom: 'Sam', articles: [ok] };
  const d = deps(() => Promise.resolve(rep(200, wf3)));
  assert.deepEqual(await A.chargerFourneeReelle(d), wf3);
  assert.equal(d.appels[0].url, 'https://n8n.exemple.fr/webhook/file');
  assert.equal(d.appels[0].o.method, 'POST');
  assert.equal(d.appels[0].o.headers.Authorization, 'Bearer JETON');
  assert.equal(d.appels[0].o.headers['Content-Type'], 'application/json');
  assert.equal(d.appels[0].o.body, '{}');
});

test('fournée réelle : attente renvoyée telle quelle', async () => {
  assert.deepEqual(await A.chargerFourneeReelle(deps(() => Promise.resolve(rep(200, { etat: 'attente' })))), { etat: 'attente' });
});

test('fournée réelle : 500, réponse invalide, panne, délai, jeton en panne ⇒ exemple marqué', async () => {
  const cas = [
    deps(() => Promise.resolve(rep(500, {}))),
    deps(() => Promise.resolve(rep(200, { etat: 'fini' }))),
    deps(() => Promise.reject(new TypeError('Failed to fetch'))),
    deps((u, o) => new Promise((res, rej) => o.signal.addEventListener('abort', () => rej(new Error('abort'))))),
    deps(() => Promise.resolve(rep(200, EXEMPLE)), () => Promise.reject(new Error('réseau')))
  ];
  for (const d of cas) {
    const r = await A.chargerFourneeReelle(d);
    assert.equal(r.source, 'exemple');
    assert.equal(r.etat, 'pret');
    assert.equal(r.prenom, 'Léa');
  }
});

test('fournée réelle : plus de session ⇒ invalide, sans appel à WF3', async () => {
  const d = deps(() => Promise.resolve(rep(200, EXEMPLE)), () => Promise.resolve(null));
  assert.deepEqual(await A.chargerFourneeReelle(d), { etat: 'invalide' });
  assert.equal(d.appels.length, 0);
});
