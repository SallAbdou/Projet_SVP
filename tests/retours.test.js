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
