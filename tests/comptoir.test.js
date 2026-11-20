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

test('totaux et kpis découpent les fenêtres de 30 jours', () => {
  const posts = [
    post('j0', 0, chiffres(100, 1)), post('j29', 29, chiffres(200)), post('j30', 30, chiffres(50, 2)),
    post('j59', 59, chiffres(50)), post('j60', 60, chiffres(999)),
    post('futur', -2, chiffres(10)), post('sans', 2, null), post('illisible', 'pas une date', chiffres(7))
  ];
  const k = C.kpis(posts, MAINTENANT);
  assert.equal(k.actuel.posts, 4);
  assert.equal(k.actuel.impressions, 310);
  assert.equal(k.actuel.contacts, 1);
  assert.equal(k.precedent.posts, 2);
  assert.equal(k.precedent.impressions, 100);
  assert.equal(k.precedent.contacts, 2);
  assert.deepEqual(k.ecarts.posts, { sens: 'hausse', valeur: 2 });
  assert.deepEqual(k.ecarts.impressions, { sens: 'hausse', valeur: 210 });
  assert.deepEqual(k.ecarts.contacts, { sens: 'baisse', valeur: 50 });
  assert.deepEqual(C.totaux([], MAINTENANT, 0, 30), { posts: 0, impressions: 0, reactions: 0, republications: 0, commentaires: 0, contacts: 0 });
});

test('ecart en nombre ou en pourcentage, stable et nouveau', () => {
  assert.deepEqual(C.ecart(6, 4, 'nombre'), { sens: 'hausse', valeur: 2 });
  assert.deepEqual(C.ecart(3, 4, 'nombre'), { sens: 'baisse', valeur: 1 });
  assert.deepEqual(C.ecart(4, 4, 'nombre'), { sens: 'stable', valeur: 0 });
  assert.deepEqual(C.ecart(4820, 3493, 'pourcent'), { sens: 'hausse', valeur: 38 });
  assert.deepEqual(C.ecart(27, 27, 'pourcent'), { sens: 'stable', valeur: 0 });
  assert.deepEqual(C.ecart(1001, 1000, 'pourcent'), { sens: 'stable', valeur: 0 });
  assert.deepEqual(C.ecart(5, 0, 'pourcent'), { sens: 'nouveau', valeur: 0 });
  assert.deepEqual(C.ecart(0, 0, 'pourcent'), { sens: 'stable', valeur: 0 });
  assert.deepEqual(C.ecart(80, 100, 'pourcent'), { sens: 'baisse', valeur: 20 });
});

test('graphique prend les 6 derniers posts chiffrés, du plus ancien au plus récent', () => {
  const posts = C.fusionner([
    post('p1', 1, chiffres(400)), post('p2', 2, null), post('p3', 3, chiffres(800)), post('p4', 4, chiffres(200)),
    post('p5', 5, chiffres(100)), post('p6', 6, chiffres(600)), post('p7', 7, chiffres(300)), post('p8', 8, chiffres(900))
  ], []);
  const g = C.graphique(posts);
  assert.deepEqual(g.map(b => b.id), ['p7', 'p6', 'p5', 'p4', 'p3', 'p1']);
  assert.deepEqual(g.map(b => b.hauteur), [38, 75, 13, 25, 100, 50]);
  assert.deepEqual(Object.keys(g[0]).sort(), ['feu', 'hauteur', 'id', 'impressions', 'label']);
  assert.equal(C.graphique(posts, 2).length, 2);
  assert.deepEqual(C.graphique([post('z', 1, chiffres(0))]).map(b => b.hauteur), [0]);
  assert.deepEqual(C.graphique([]), []);
});

test('analyse : chaudGagne seulement si la moyenne des verts dépasse celle des autres', () => {
  const verts = [post('v1', 1, chiffres(1000), 'vert'), post('v2', 2, chiffres(1200), 'vert')];
  assert.deepEqual(C.analyse(verts.concat([post('o', 3, chiffres(600)), post('s', 4, null)])), { chaudGagne: true });
  assert.deepEqual(C.analyse(verts), { chaudGagne: false });
  assert.deepEqual(C.analyse([post('o', 3, chiffres(600))]), { chaudGagne: false });
  assert.deepEqual(C.analyse(verts.concat([post('o', 3, chiffres(0))])), { chaudGagne: true });
  assert.deepEqual(C.analyse([post('v', 1, chiffres(500), 'vert'), post('o', 3, chiffres(600))]), { chaudGagne: false });
  assert.deepEqual(C.analyse([post('v', 1, chiffres(600), 'vert'), post('o', 3, chiffres(600))]), { chaudGagne: false });
  assert.deepEqual(C.analyse([]), { chaudGagne: false });
});

test('sansChiffres ne compte que les posts publiés en attente', () => {
  const ex = Object.assign(post('e', 1, null), { exemple: true });
  assert.equal(C.sansChiffres([ex, post('a', 1, null), post('b', 2, null), post('c', 3)]), 2);
  assert.equal(C.sansChiffres(undefined), 0);
});

test('bilan additionne tout l historique', () => {
  assert.deepEqual(C.bilan([post('a', 1, chiffres(1, 2)), post('b', 90, chiffres(1, 3)), post('c', 2, null)]), { posts: 3, contacts: 5 });
  assert.deepEqual(C.bilan([]), { posts: 0, contacts: 0 });
});

test('phraseAnalyse FR : appel à l’action, gras, sans ratio', () => {
  assert.deepEqual(C.phraseAnalyse(true, 'fr'), {
    avant: 'Tes posts sur des sujets ', gras: 'tout chaud',
    apres: ' font plus d’audience que les autres : sers-les vite.'
  });
});

test('phraseAnalyse EN, et null si les sujets chauds ne gagnent pas', () => {
  assert.deepEqual(C.phraseAnalyse(true, 'en'), {
    avant: 'Your posts on ', gras: 'piping hot',
    apres: ' topics get more reach than the others, so serve them fast.'
  });
  for (const v of [false, null, undefined, 1.8]) assert.equal(C.phraseAnalyse(v, 'fr'), null, String(v));
});
