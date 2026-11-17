const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../garde-manger.js');

// Dates construites en heure locale pour ne pas dépendre du fuseau de la machine.
const H = 3600 * 1000;
const MAINTENANT = new Date(2026, 10, 17, 12, 0).getTime();
const NOW = new Date(MAINTENANT).toISOString();
function ilYa(heures) { return new Date(MAINTENANT - heures * H).toISOString(); }
function art(ref, feu, savedAt) { return { ref: ref, titre: 'T ' + ref, source: 'S', feu: feu, url: 'https://x.fr', savedAt: savedAt }; }

test('fraicheur : seuils de 24 h (vert) et 48 h (orange)', () => {
  assert.equal(G.fraicheur(art('a', 'vert', ilYa(23)), NOW), 'chaud');
  assert.equal(G.fraicheur(art('a', 'vert', ilYa(24)), NOW), 'enfourner');
  assert.equal(G.fraicheur(art('a', 'vert', ilYa(200)), NOW), 'enfourner');
  assert.equal(G.fraicheur(art('a', 'orange', ilYa(47)), NOW), 'enfourner');
  assert.equal(G.fraicheur(art('a', 'orange', ilYa(48)), NOW), 'rassis');
  assert.equal(G.fraicheur(art('a', 'rouge', ilYa(1)), NOW), 'rassis');
});

test('fraicheur : feu inconnu ou date illisible = rassis, date future = à l\'instant', () => {
  assert.equal(G.fraicheur(art('a', 'bleu', ilYa(1)), NOW), 'rassis');
  assert.equal(G.fraicheur(art('a', 'vert', 'n/a'), NOW), 'rassis');
  assert.equal(G.fraicheur(art('a', 'vert', undefined), NOW), 'rassis');
  assert.equal(G.fraicheur(art('a', 'vert', ilYa(-2)), NOW), 'chaud');
});

test('trier : du plus récent au plus ancien, sans date en dernier, entrée non mutée', () => {
  const liste = [art('b', 'vert', ilYa(30)), art('x', 'vert', 'n/a'), art('a', 'vert', ilYa(1)), art('c', 'rouge', ilYa(100))];
  const avant = JSON.stringify(liste);
  assert.deepEqual(G.trier(liste).map(a => a.ref), ['a', 'b', 'c', 'x']);
  assert.equal(JSON.stringify(liste), avant);
});

test('compter par catégorie', () => {
  const liste = [art('a', 'vert', ilYa(1)), art('b', 'vert', ilYa(2)), art('c', 'orange', ilYa(10)), art('d', 'rouge', ilYa(1))];
  assert.deepEqual(G.compter(liste, NOW), { tout: 4, chaud: 2, enfourner: 1, rassis: 1 });
  assert.deepEqual(G.compter([], NOW), { tout: 0, chaud: 0, enfourner: 0, rassis: 0 });
});

test('filtrer : trie puis garde la catégorie, filtre inconnu = tout', () => {
  const liste = [art('b', 'vert', ilYa(5)), art('c', 'orange', ilYa(10)), art('a', 'vert', ilYa(1))];
  assert.deepEqual(G.filtrer(liste, 'chaud', NOW).map(a => a.ref), ['a', 'b']);
  assert.deepEqual(G.filtrer(liste, 'rassis', NOW), []);
  assert.deepEqual(G.filtrer(liste, 'tout', NOW).map(a => a.ref), ['a', 'b', 'c']);
  assert.deepEqual(G.filtrer(liste, 'bidon', NOW).map(a => a.ref), ['a', 'b', 'c']);
});

test('joursDepuis : jours calendaires locaux', () => {
  const j = (y, m, d, h, mi) => new Date(y, m, d, h, mi).toISOString();
  assert.equal(G.joursDepuis(j(2026, 10, 17, 0, 5), j(2026, 10, 17, 23, 55)), 0);
  assert.equal(G.joursDepuis(j(2026, 10, 16, 23, 55), j(2026, 10, 17, 0, 5)), 1);
  assert.equal(G.joursDepuis(j(2026, 10, 11, 12, 0), NOW), 6);
  assert.equal(G.joursDepuis(j(2026, 10, 20, 12, 0), NOW), 0);
  assert.equal(G.joursDepuis('n/a', NOW), null);
});

test('libelleAnciennete en FR et EN', () => {
  assert.equal(G.libelleAnciennete(0, 'fr'), 'Mis de côté aujourd’hui');
  assert.equal(G.libelleAnciennete(1, 'fr'), 'Mis de côté hier');
  assert.equal(G.libelleAnciennete(2, 'fr'), 'Mis de côté il y a 2 jours');
  assert.equal(G.libelleAnciennete(0, 'en'), 'Saved today');
  assert.equal(G.libelleAnciennete(1, 'en'), 'Saved yesterday');
  assert.equal(G.libelleAnciennete(6, 'en'), 'Saved 6 days ago');
  assert.equal(G.libelleAnciennete(null, 'fr'), '');
});
