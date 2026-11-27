// Lot 32 : cartes à collectionner (logique pure de jeu.js). Le rituel et la vue cartes ont été retirés au lot 34
// (tests/decouverte.test.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Jeu = require('../jeu.js');
const Store = require('../store.js');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');

function stockage(init) {
  const m = Object.assign({}, init || {});
  return {
    getItem: k => (Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: k => { delete m[k]; },
    _m: m
  };
}
const CASSE = { getItem() { throw new Error('non'); }, setItem() { throw new Error('non'); } };
const art = (rang, d, p, l, extra) => Object.assign({ ref: 'r' + rang, rang, titre: 'T' + rang, source: 'S', feu: 'vert', axe: 'Axe 1', url: 'https://ex.fr', durabilite: d, propension: p, lienOffre: l }, extra || {});

test('rareté : seuils de la constante unique, bornes comprises', () => {
  assert.deepEqual(Jeu.RARETES.map(r => [r.id, r.min]), [['maillard', 13], ['doree', 11], ['croute', 9], ['mie', 0]]);
  const cas = { 15: 'maillard', 13: 'maillard', 12: 'doree', 11: 'doree', 10: 'croute', 9: 'croute', 8: 'mie', 0: 'mie' };
  for (const [total, id] of Object.entries(cas)) {
    const t = Number(total);
    const a = { durabilite: Math.min(5, t), propension: Math.min(5, Math.max(0, t - 5)), lienOffre: Math.max(0, t - 10) };
    assert.equal(Jeu.rarete(a).id, id, 'total ' + t);
    assert.equal(Jeu.rarete(a).total, t);
  }
  assert.equal(Jeu.rarete({}).id, 'mie');
  assert.equal(Jeu.rarete({ durabilite: 9, propension: 9, lienOffre: 9 }).total, 15, 'notes bornées à 5');
  assert.deepEqual(Jeu.RARETES.map(r => r.grignes), [4, 3, 2, 1]);
});

test('cartes du jour : rang, news écartées, nombre réglé', () => {
  const articles = [art(3, 3, 3, 3), art(1, 5, 4, 4), art(2, 4, 4, 4), art(4, 1, 1, 1), art(5, 1, 1, 1), art(6, 1, 1, 1)];
  assert.deepEqual(Jeu.cartesDuJour(articles, 5, []).map(a => a.rang), [1, 2, 3, 4, 5]);
  assert.deepEqual(Jeu.cartesDuJour(articles, 5, ['r2']).map(a => a.rang), [1, 3, 4, 5, 6]);
  assert.deepEqual(Jeu.cartesDuJour(articles, 7, []).map(a => a.rang), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(Jeu.cartesDuJour(null, 5, null), []);
  assert.equal(articles[0].rang, 3, 'liste reçue non modifiée');
});

test('clé de compte : e-mail en minuscules, sinon abonneId', () => {
  assert.equal(Jeu.cleDuCompte({ email: ' Lea@Exemple.fr ' }), 'lea@exemple.fr');
  assert.equal(Jeu.cleDuCompte({ abonneId: 'ab1' }), 'ab1');
  assert.equal(Jeu.cleDuCompte(null), null);
});

test('textes FR et EN de même forme, sans tiret long', () => {
  const cles = o => Object.keys(o).sort().flatMap(k => (o[k] && typeof o[k] === 'object' ? cles(o[k]).map(x => k + '.' + x) : [k]));
  assert.deepEqual(cles(Jeu.TEXTES.fr), cles(Jeu.TEXTES.en));
  assert.doesNotMatch(JSON.stringify(Jeu.TEXTES), /—/);
  assert.doesNotMatch(lire('jeu.js'), /—/);
  assert.equal(Jeu.TEXTES.fr.raretes.maillard, 'Maillard');
  assert.equal(Jeu.TEXTES.fr.toutRetourner, 'Tout retourner');
  for (const id of ['mie', 'croute', 'doree', 'maillard']) assert.ok(Jeu.TEXTES.en.raretes[id]);
});

test('annonce d’une carte retournée', () => {
  const a = art(2, 4, 4, 3, { titre: 'Titre', source: 'Src', feu: 'vert' });
  // Lot 35 : sans profil, « Axe 1 » n'est pas lu (voir tests/criteres.test.js pour la thématique).
  assert.equal(Jeu.annonce(a, 3, 5, 'fr'), 'Carte 3 sur 5 : Dorée. Titre. Tout chaud, Src. Monétisation 11/15.');
  assert.equal(Jeu.annonce(a, 3, 5, 'fr', ['LLMs']), 'Carte 3 sur 5 : Dorée. Titre. Tout chaud, Src, LLMs. Monétisation 11/15.');
  assert.match(Jeu.annonce(a, 3, 5, 'en'), /^Card 3 of 5: /);
});

test('?demo=reset efface aussi pq-jeu', () => {
  assert.ok(Store.CLES_DEMO.includes('pq-jeu'));
  assert.equal(Jeu.CLE, 'pq-jeu');
});

