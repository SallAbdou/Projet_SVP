const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const T = require('../theme.js');
const Store = require('../store.js');

const RACINE = path.join(__dirname, '..');

function memoire(initial) {
  const d = Object.assign({}, initial);
  return { getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, removeItem: k => { delete d[k]; }, d };
}
const CASSE = { getItem: () => { throw new Error('bloqué'); }, setItem: () => { throw new Error('bloqué'); } };

test('quatre thèmes, Bronze par défaut, clé pq-theme', () => {
  assert.deepEqual(T.THEMES, ['bronze', 'classique', 'nuit', 'contraste']);
  assert.equal(T.DEFAUT, 'bronze');
  assert.equal(T.CLE, 'pq-theme');
});

test('normaliser : nom inconnu ou absent donne bronze', () => {
  for (const n of T.THEMES) assert.equal(T.normaliser(n), n);
  for (const n of ['rose', '', null, undefined, 42, 'NUIT']) assert.equal(T.normaliser(n), 'bronze', String(n));
});

test('cleCompte : e-mail en minuscules, sinon abonneId, sinon null', () => {
  assert.equal(T.cleCompte({ email: ' Lea@X.fr ', abonneId: 'rec1' }), 'lea@x.fr');
  assert.equal(T.cleCompte({ abonneId: 'rec1' }), 'rec1');
  assert.equal(T.cleCompte({ email: '' }), null);
  assert.equal(T.cleCompte(null), null);
  assert.equal(T.cleCompte(undefined), null);
});

test('enregistrer puis lire, par compte, deux comptes indépendants', () => {
  const st = memoire();
  assert.equal(T.lire(st, 'lea@x.fr'), 'bronze');
  assert.equal(T.enregistrer(st, 'lea@x.fr', 'nuit'), true);
  assert.equal(T.enregistrer(st, 'rec2', 'contraste'), true);
  assert.equal(T.lire(st, 'lea@x.fr'), 'nuit');
  assert.equal(T.lire(st, 'rec2'), 'contraste');
  assert.equal(T.lire(st, 'autre@x.fr'), 'bronze');
  assert.deepEqual(JSON.parse(st.d['pq-theme']), { version: 1, comptes: { 'lea@x.fr': 'nuit', rec2: 'contraste' } });
});

test('enregistrer refuse un compte absent et ramène un nom inconnu à bronze', () => {
  const st = memoire();
  assert.equal(T.enregistrer(st, null, 'nuit'), false);
  assert.equal(st.d['pq-theme'], undefined);
  assert.equal(T.enregistrer(st, 'a', 'rose'), true);
  assert.equal(T.lire(st, 'a'), 'bronze');
});

test('lire : stockage illisible ou inattendu donne bronze sans erreur', () => {
  for (const brut of ['{', 'null', '[]', '{"version":2,"comptes":{"a":"nuit"}}', '{"version":1,"comptes":{"a":"rose"}}', '{"version":1,"comptes":[]}']) {
    assert.equal(T.lire(memoire({ 'pq-theme': brut }), 'a'), 'bronze', brut);
  }
  assert.equal(T.lire(CASSE, 'a'), 'bronze');
  assert.equal(T.lire(memoire(), null), 'bronze');
});

test('enregistrer : stockage indisponible renvoie false sans lever', () => {
  assert.equal(T.enregistrer(CASSE, 'a', 'nuit'), false);
});

test('enregistrer repart de zéro si le contenu existant est cassé', () => {
  const st = memoire({ 'pq-theme': '{' });
  assert.equal(T.enregistrer(st, 'a', 'nuit'), true);
  assert.equal(T.lire(st, 'a'), 'nuit');
});

test('appliquer pose data-theme sur la racine du document', () => {
  const attrs = {};
  const doc = { documentElement: { setAttribute: (k, v) => { attrs[k] = v; } } };
  T.appliquer(doc, 'nuit');
  assert.equal(attrs['data-theme'], 'nuit');
  T.appliquer(doc, 'rose');
  assert.equal(attrs['data-theme'], 'bronze');
});

test('?demo=reset efface aussi le thème', () => {
  assert.ok(Store.CLES_DEMO.includes('pq-theme'));
});

test('les pages protégées chargent /theme.js dans le head, juste après /garde.js', () => {
  for (const p of ['comptoir.html', 'fournee.html', 'garde-manger.html', 'fournil.html', 'profil.html']) {
    const h = fs.readFileSync(path.join(RACINE, p), 'utf8');
    assert.match(h, /<script src="\/garde\.js"><\/script><script src="\/theme\.js"><\/script>/, p);
    assert.ok(h.indexOf('/theme.js') < h.indexOf('</head>'), p + ' : theme.js hors du head');
  }
});
