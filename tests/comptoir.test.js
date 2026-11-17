const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../comptoir.js');

const MAINTENANT = '2026-11-17T10:00:00.000Z';
const JOUR = 86400000;
const chiffres = (impressions, contacts) => ({ impressions, reactions: 1, republications: 1, commentaires: 1, contacts: contacts || 0 });
const ilYa = j => new Date(Date.parse(MAINTENANT) - j * JOUR).toISOString();
const post = (id, j, c, feu) => ({ id, ref: id, titre: id, label: id, feu: feu || 'orange', publieLe: typeof j === 'number' ? ilYa(j) : j, chiffres: c === undefined ? chiffres(100) : c, exemple: false });

test('libelleCourt garde les titres courts et coupe proprement les longs', () => {
  assert.equal(C.libelleCourt('Agents en PME'), 'Agents en PME');
  const long = C.libelleCourt('Les agents IA gèrent désormais la facturation');
  assert.equal(long, 'Les agents IA gèrent…');
  assert.ok(long.length <= 23);
  assert.equal(C.libelleCourt('a'.repeat(30)), 'a'.repeat(21) + '…');
  assert.equal(C.libelleCourt('', 22), '');
});

test('depuisExemples date chaque post par rapport à maintenant', () => {
  const [p] = C.depuisExemples([{ ref: 'h1', titre: 'Titre', label: 'L', feu: 'vert', ilYaJours: 3, chiffres: chiffres(10) }], MAINTENANT);
  assert.deepEqual(p, { id: 'exemple-h1', ref: 'h1', titre: 'Titre', label: 'L', feu: 'vert', publieLe: '2026-11-14T10:00:00.000Z', chiffres: chiffres(10), exemple: true });
  assert.deepEqual(C.depuisExemples(null, MAINTENANT), []);
});

test('depuisPublies retrouve le feu dans la fournée, puis le garde-manger, sinon orange', () => {
  const publies = [
    { id: 'a-1', ref: 'a', titre: 'Sujet A', publieLe: ilYa(1), chiffres: null },
    { id: 'b-1', ref: 'b', titre: 'Sujet B', publieLe: ilYa(2), chiffres: chiffres(5) },
    { id: 'c-1', ref: 'c', titre: 'Sujet C', publieLe: ilYa(3), chiffres: null }
  ];
  const posts = C.depuisPublies(publies, [{ ref: 'a', feu: 'vert' }, { ref: 'b', feu: 'rouge' }], [{ ref: 'b', feu: 'vert' }, { ref: 'c', feu: 'rouge' }]);
  assert.deepEqual(posts.map(p => p.feu), ['vert', 'rouge', 'rouge']);
  assert.deepEqual(C.depuisPublies([publies[0]], [], []).map(p => p.feu), ['orange']);
  assert.equal(posts[0].chiffres, null);
  assert.equal(posts[0].exemple, false);
  assert.equal(posts[0].label, 'Sujet A');
  assert.equal(posts[1].id, 'b-1');
  assert.deepEqual(C.depuisPublies(undefined, undefined, undefined), []);
});

test('fusionner trie du plus récent au plus ancien', () => {
  const a = [post('x', 5), post('y', 1)];
  const b = [post('z', 3)];
  assert.deepEqual(C.fusionner(a, b).map(p => p.id), ['y', 'z', 'x']);
});
