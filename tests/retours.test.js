const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../retours.js');
const P = R.pur;

const CFG = { supabaseUrl: 'https://p.supabase.co/', supabaseCleAnon: 'pub', delaiReseauMs: 8000 };

test('nettoyer : espaces de bord retirés, fins de ligne Windows ramenées à \\n', () => {
  assert.equal(P.nettoyer('  a\r\nb  '), 'a\nb');
  assert.equal(P.nettoyer(null), '');
  assert.equal(P.nettoyer(undefined), '');
});

test('valider : vide après nettoyage, plus de 1 000 caractères, ou valide', () => {
  assert.equal(P.MAX, 1000);
  assert.equal(P.valider('   \n \t'), 'vide');
  assert.equal(P.valider(''), 'vide');
  assert.equal(P.valider('x'.repeat(1001)), 'trop-long');
  assert.equal(P.valider(' ' + 'x'.repeat(1000) + ' '), null);
  assert.equal(P.valider('Plus de PME'), null);
});

test('enregistrement : texte nettoyé, date et abonné', () => {
  assert.deepEqual(P.enregistrement(' Plus de PME ', '2026-11-18T10:00:00.000Z', 'demoLea0000000001'),
    { texte: 'Plus de PME', cree_le: '2026-11-18T10:00:00.000Z', abonne_id: 'demoLea0000000001' });
  assert.equal(P.enregistrement('a', 'x', undefined).abonne_id, null);
});

test('derniers : invalides écartés, tri décroissant, n gardés', () => {
  const l = [
    { texte: 'b', cree_le: '2026-11-02T00:00:00.000Z' },
    { texte: 'd', cree_le: '2026-11-04T00:00:00.000Z' },
    { texte: 1, cree_le: '2026-11-09T00:00:00.000Z' },
    { texte: 'a', cree_le: '2026-11-01T00:00:00.000Z' },
    { texte: 'c', cree_le: '2026-11-03T00:00:00.000Z' }
  ];
  assert.deepEqual(P.derniers(l, 3).map(r => r.texte), ['d', 'c', 'b']);
  assert.deepEqual(P.derniers(null, 3), []);
});

test('dateRelative en jours civils locaux, FR et EN', () => {
  const m = new Date(2026, 10, 18, 9);
  const iso = (j, h) => new Date(2026, 10, j, h).toISOString();
  assert.equal(P.dateRelative(iso(18, 1), m, 'fr'), 'aujourd’hui');
  assert.equal(P.dateRelative(iso(18, 1), m, 'en'), 'today');
  assert.equal(P.dateRelative(iso(17, 23), m, 'fr'), 'hier');
  assert.equal(P.dateRelative(iso(17, 23), m, 'en'), 'yesterday');
  assert.equal(P.dateRelative(iso(13, 12), m, 'fr'), 'il y a 5 jours');
  assert.equal(P.dateRelative(iso(13, 12), m, 'en'), '5 days ago');
  assert.equal(P.dateRelative(iso(20, 12), m, 'fr'), 'aujourd’hui');
  assert.equal(P.dateRelative('nimporte', m, 'fr'), 'aujourd’hui');
});

test('cleCompte : e-mail en minuscules, sinon abonneId, sinon null', () => {
  assert.equal(P.cleCompte({ email: 'Lea@X.fr', abonneId: 'a' }), 'lea@x.fr');
  assert.equal(P.cleCompte({ email: '', abonneId: 'a' }), 'a');
  assert.equal(P.cleCompte(null), null);
  assert.equal(P.cleCompte({}), null);
});

test('état démo : normaliser résiste aux données abîmées', () => {
  assert.deepEqual(P.normaliser('nimporte'), { version: 1, comptes: {} });
  assert.deepEqual(P.normaliser({ version: 2, comptes: { a: [] } }), { version: 1, comptes: {} });
  assert.deepEqual(P.normaliser({ version: 1, comptes: { a: [{ texte: 1 }, { texte: 'ok', cree_le: 'x' }], b: 'z' } }),
    { version: 1, comptes: { a: [{ texte: 'ok', cree_le: 'x' }] } });
});

test('état démo : ajouter garde 50 retours par compte, lister par compte', () => {
  let e = P.normaliser(null);
  for (let i = 0; i < 55; i++) e = P.ajouter(e, 'a', { texte: 't' + i, cree_le: new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString(), abonne_id: null });
  assert.equal(P.lister(e, 'a').length, 50);
  assert.equal(P.derniers(P.lister(e, 'a'), 1)[0].texte, 't54');
  assert.deepEqual(P.lister(e, 'b'), []);
});

test('requeteEnvoi : POST REST Supabase, en-têtes exacts, sans user_id ni cree_le', () => {
  const r = P.requeteEnvoi(CFG, 'jwt', { texte: 'Plus de PME', cree_le: 'x', abonne_id: 'a1' });
  assert.equal(r.url, 'https://p.supabase.co/rest/v1/retours');
  assert.equal(r.options.method, 'POST');
  assert.deepEqual(r.options.headers, { apikey: 'pub', Authorization: 'Bearer jwt', 'Content-Type': 'application/json', Prefer: 'return=minimal' });
  assert.deepEqual(JSON.parse(r.options.body), { texte: 'Plus de PME', abonne_id: 'a1' });
});

test('requeteLecture : GET des n derniers, en-têtes apikey et Authorization', () => {
  const r = P.requeteLecture(CFG, 'jwt', 3);
  assert.equal(r.url, 'https://p.supabase.co/rest/v1/retours?select=texte,cree_le&order=cree_le.desc&limit=3');
  assert.equal(r.options.method, 'GET');
  assert.deepEqual(r.options.headers, { apikey: 'pub', Authorization: 'Bearer jwt' });
});

/* ---- Enveloppes : démo (stockage) et réel (fetch simulé) ---- */
function memoire() {
  const m = {};
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, m };
}
const LEA = { email: 'lea@demo.painquotidien.fr', abonneId: 'demoLea0000000001' };
const TOM = { email: 'tom@x.fr', abonneId: 't1' };

test('démo : envoi valide enregistré puis relu', async () => {
  const st = memoire();
  const d = R.avecStockage({ storage: st, utilisateur: () => LEA, maintenant: () => '2026-11-18T10:00:00.000Z' });
  assert.deepEqual(await d.envoyerRetour('  Plus de PME  '), { ok: true, erreur: null });
  assert.deepEqual(await d.derniersRetours(3), [{ texte: 'Plus de PME', cree_le: '2026-11-18T10:00:00.000Z' }]);
  assert.ok(st.getItem('pq-retours').includes('demoLea0000000001'));
});

test('démo : texte vide refusé, rien enregistré', async () => {
  const st = memoire();
  const d = R.avecStockage({ storage: st, utilisateur: () => LEA, maintenant: () => 'x' });
  assert.deepEqual(await d.envoyerRetour('   '), { ok: false, erreur: 'vide' });
  assert.deepEqual(await d.envoyerRetour('x'.repeat(1001)), { ok: false, erreur: 'trop-long' });
  assert.equal(st.getItem('pq-retours'), null);
});

test('démo : sans utilisateur connecté, erreur session et liste vide', async () => {
  const d = R.avecStockage({ storage: memoire(), utilisateur: () => null, maintenant: () => 'x' });
  assert.deepEqual(await d.envoyerRetour('ok'), { ok: false, erreur: 'session' });
  assert.deepEqual(await d.derniersRetours(3), []);
});

test('démo : chaque compte ne voit que ses retours', async () => {
  const st = memoire();
  let u = LEA;
  const d = R.avecStockage({ storage: st, utilisateur: () => u, maintenant: () => '2026-11-18T10:00:00.000Z' });
  await d.envoyerRetour('de Léa');
  u = TOM;
  await d.envoyerRetour('de Tom');
  assert.deepEqual((await d.derniersRetours(3)).map(r => r.texte), ['de Tom']);
  u = LEA;
  assert.deepEqual((await d.derniersRetours(3)).map(r => r.texte), ['de Léa']);
});

test('démo : données abîmées dans pq-retours, on repart proprement', async () => {
  const st = memoire();
  st.setItem('pq-retours', '{pas du json');
  const d = R.avecStockage({ storage: st, utilisateur: () => LEA, maintenant: () => '2026-11-18T10:00:00.000Z' });
  assert.deepEqual(await d.derniersRetours(3), []);
  assert.equal((await d.envoyerRetour('ok')).ok, true);
});

function reponse(status, corps) { return { status, ok: status >= 200 && status < 300, json: () => Promise.resolve(corps) }; }
function reel(fetchFn, jeton, config) {
  return R.avecSupabase(config || CFG, { fetch: fetchFn, jeton: () => Promise.resolve(jeton === undefined ? 'jwt' : jeton), utilisateur: () => LEA });
}

test('réel : 201 accepté, requête REST conforme', async () => {
  const appels = [];
  const r = reel((u, o) => { appels.push([u, o]); return Promise.resolve(reponse(201)); });
  assert.deepEqual(await r.envoyerRetour(' Plus de PME '), { ok: true, erreur: null });
  assert.equal(appels.length, 1);
  assert.equal(appels[0][0], 'https://p.supabase.co/rest/v1/retours');
  assert.equal(appels[0][1].headers.Authorization, 'Bearer jwt');
  assert.deepEqual(JSON.parse(appels[0][1].body), { texte: 'Plus de PME', abonne_id: 'demoLea0000000001' });
});

test('réel : 401 ou 403 donne session, 500 ou panne donne reseau', async () => {
  assert.equal((await reel(() => Promise.resolve(reponse(401))).envoyerRetour('a')).erreur, 'session');
  assert.equal((await reel(() => Promise.resolve(reponse(403))).envoyerRetour('a')).erreur, 'session');
  assert.equal((await reel(() => Promise.resolve(reponse(500))).envoyerRetour('a')).erreur, 'reseau');
  assert.equal((await reel(() => Promise.reject(new TypeError('Failed to fetch'))).envoyerRetour('a')).erreur, 'reseau');
});

test('réel : pas de jeton, jeton en panne ou texte vide, sans appel réseau', async () => {
  let n = 0;
  const f = () => { n++; return Promise.resolve(reponse(201)); };
  assert.deepEqual(await reel(f, null).envoyerRetour('a'), { ok: false, erreur: 'session' });
  assert.deepEqual(await reel(f).envoyerRetour('  '), { ok: false, erreur: 'vide' });
  const panne = R.avecSupabase(CFG, { fetch: f, jeton: () => Promise.reject(new Error('x')), utilisateur: () => LEA });
  assert.deepEqual(await panne.envoyerRetour('a'), { ok: false, erreur: 'reseau' });
  assert.equal(n, 0);
});

test('réel : délai dépassé donne reseau', async () => {
  const r = reel(() => new Promise(() => {}), 'jwt', Object.assign({}, CFG, { delaiReseauMs: 20 }));
  assert.deepEqual(await r.envoyerRetour('a'), { ok: false, erreur: 'reseau' });
});

test('réel : lecture des derniers retours, panne rejetée', async () => {
  const lus = [];
  const ok = reel((u) => { lus.push(u); return Promise.resolve(reponse(200, [{ texte: 'a', cree_le: '2026-11-18T10:00:00+00:00' }])); });
  assert.deepEqual(await ok.derniersRetours(3), [{ texte: 'a', cree_le: '2026-11-18T10:00:00+00:00' }]);
  assert.ok(lus[0].endsWith('limit=3'));
  await assert.rejects(reel(() => Promise.resolve(reponse(500))).derniersRetours(3));
  assert.deepEqual(await reel(() => Promise.resolve(reponse(200)), null).derniersRetours(3), []);
});
