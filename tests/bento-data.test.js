const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../bento.js');

test('totalScore sur les champs de WF3', () => {
  assert.equal(B.totalScore({ durabilite: 4, propension: 5, lienOffre: 4 }), 13);
  assert.equal(B.totalScore({}), 0);
});

test('pickTopics trie par rang et respecte n', () => {
  const list = [{ ref: 'c', rang: 3 }, { ref: 'a', rang: 1 }, { ref: 'b', rang: 2 }];
  assert.deepEqual(B.pickTopics(list, 3).map(x => x.ref), ['a', 'b', 'c']);
  assert.deepEqual(B.pickTopics(list, 2).map(x => x.ref), ['a', 'b']);
  assert.equal(B.pickTopics(list, 7).length, 3);
  assert.equal(list[0].ref, 'c', 'entrée non mutée');
});

test('safeUrl', () => {
  assert.equal(B.safeUrl('https://the-decoder.com/a'), 'https://the-decoder.com/a');
  assert.equal(B.safeUrl('http://x.org'), 'http://x.org');
  for (const bad of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,x', '', null, undefined, 42]) {
    assert.equal(B.safeUrl(bad), '#');
  }
});

test('pickTopics exclut les refs ignorées et comble le trou', () => {
  const list = [{ ref: 'c', rang: 3 }, { ref: 'a', rang: 1 }, { ref: 'b', rang: 2 }, { ref: 'd', rang: 4 }];
  assert.deepEqual(B.pickTopics(list, 2, ['a']).map(x => x.ref), ['b', 'c']);
  assert.deepEqual(B.pickTopics(list, 3, ['b', 'd']).map(x => x.ref), ['a', 'c']);
  assert.deepEqual(B.pickTopics(list, 3, ['a', 'b', 'c', 'd']), []);
  assert.deepEqual(B.pickTopics(list, 2).map(x => x.ref), ['a', 'b']);
});

test('lienFournil encode la ref', () => {
  assert.equal(B.lienFournil('recDemo01'), '/fournil?ref=recDemo01');
  assert.equal(B.lienFournil('a&b c'), '/fournil?ref=a%26b%20c');
});

test('montreRaison : le n°1 doré ne commente pas sa couleur, les autres oui', () => {
  assert.equal(B.montreRaison('n1'), false);
  for (const id of ['n2', 'n3', 'n4', 'n5', 'n6', 'n7']) assert.equal(B.montreRaison(id), true, id);
});

test('jauges : trois critères de 0 à 5 avec pourcentage de remplissage, total sur 15', () => {
  const j = B.jauges({ durabilite: 4, propension: 5, lienOffre: 4 });
  assert.deepEqual(j.criteres.map(c => [c.cle, c.valeur, c.pct]), [['durabilite', 4, 80], ['propension', 5, 100], ['lienOffre', 4, 80]]);
  assert.equal(j.total, 13);
  assert.equal(j.max, 15);
  assert.equal(j.totalPct, 87);
});

test('jauges : valeurs absentes, négatives, trop grandes ou non numériques bornées entre 0 et 5', () => {
  const j = B.jauges({ durabilite: -2, propension: 9, lienOffre: 'x' });
  assert.deepEqual(j.criteres.map(c => [c.valeur, c.pct]), [[0, 0], [5, 100], [0, 0]]);
  assert.equal(j.total, 5);
  const v = B.jauges();
  assert.equal(v.total, 0);
  assert.deepEqual(v.criteres.map(c => c.pct), [0, 0, 0]);
  assert.equal(B.jauges({ durabilite: 2.5 }).criteres[0].pct, 50);
});

test('rangees : nombre de rangées occupées par la grille affichée', () => {
  const d = B.defaultLayout();
  assert.equal(B.rangees(d, 7, 4), 3);
  assert.equal(B.rangees(B.basculerGraphique(d), 7, 4), 4);
  assert.equal(B.rangees(B.appliquerPreset(d, 'informative'), 7, 4), 3);
  assert.equal(B.rangees(B.appliquerPreset(d, 'concentree'), 7, 4), 2);
  assert.equal(B.rangees(d, 0, 4), 0);
  assert.equal(B.rangees(d, 7, 2), 6);
});

test('fournee.html : jauges de monétisation accessibles à la place de la ligne de détail', () => {
  const h = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'fournee.html'), 'utf8');
  assert.doesNotMatch(h, /scoreLine|score-detail|Durabilité \{d\}\/5/);
  const bloc = /<div class="only-L jauges" role="group" aria-labelledby="jt-\{\{s\.id\}\}">([\s\S]*?)<\/div>\r?\n<p class="score">/.exec(h);
  assert.ok(bloc, 'bloc de jauges absent ou mal placé');
  assert.match(bloc[1], /<p id="jt-\{\{s\.id\}\}" class="jauges-total">\{\{s\.money\}\}<\/p>/);
  for (const n of [1, 2, 3]) {
    assert.match(bloc[1], new RegExp('<span class="jauge-nom"><button type="button" class="jauge-aide" aria-describedby="ja' + n + '-\{\{s\.id\}\}">\{\{s\.j' + n + 'Nom\}\}</button><span id="ja' + n + '-\{\{s\.id\}\}" role="tooltip" class="pq-cache">\{\{s\.j' + n + 'Aide\}\}</span></span><span class="jauge-piste" aria-hidden="true"><span class="jauge-plein" style="\{\{s\.j' + n + 'Style\}\}"></span></span><span class="jauge-val">\{\{s\.j' + n + 'Val\}\}</span>'));
  }
  assert.match(h, /\.jauge-plein\{[^}]*background:var\(--brun\)/);
  assert.match(h, /jauges: \{ durabilite: 'Durabilité', propension: 'Propension', lienOffre: 'Lien offre' \}/);
  assert.match(h, /jauges: \{ durabilite: 'Shelf life', propension: 'Shareability', lienOffre: 'Offer fit' \}/);
});

test('fournee.html : mode sans défilement réservé aux grilles de 3 rangées, sans couper le contenu', () => {
  const h = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'fournee.html'), 'utf8');
  assert.match(h, /<main class="\{\{mainClass\}\}"/);
  assert.match(h, /mainClass: ready && !st\.editing && available > 0 && Bento\.rangees\(layout, available, 4\) <= 3 \? 'fournee-tient' : ''/);
  assert.match(h, /@media \(min-width:1101px\) and \(min-height:700px\)\{\r?\nmain\.fournee-tient\{min-height:100vh/);
  assert.match(h, /main\.fournee-tient \.bento\{[^}]*grid-auto-rows:minmax\(min-content,1fr\)/);
  assert.match(h, /main\.fournee-tient \.news-title[^{]*\{[^}]*-webkit-line-clamp:2/);
});

test('fournee.html : le résumé s’affiche en entier, jamais tronqué (lot 20)', () => {
  const h = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'fournee.html'), 'utf8');
  const style = h.split('<style').slice(1).map(b => b.slice(0, b.indexOf('</style>'))).join(' ');
  // Aucune règle ne pose de line-clamp ni d'ellipse sur .resume.
  const regles = style.match(/[^{}]+\{[^{}]*\}/g) || [];
  regles.filter(r => /\.resume\b/.test(r.split('{')[0])).forEach(r => {
    assert.doesNotMatch(r, /line-clamp|text-overflow|overflow:hidden/, r.trim());
  });
  assert.match(style, /\.news-title[^{]*\{[^}]*-webkit-line-clamp:2/);
});
