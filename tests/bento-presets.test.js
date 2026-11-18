const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../bento.js');

const ids = l => l.tiles.map(t => t.id);
const RANGEES = { concentree: 2, equilibree: 3, informative: 3, graphique: 2 };
const RANGEES_AVEC_GRAPHIQUE = { concentree: 3, equilibree: 4, informative: 4 };

// Vérifie que les blocs affichés remplissent la grille de 4 colonnes sans trou ; renvoie le nombre de rangées.
function sansTrou(l, nom) {
  const cases = {};
  let maxRow = 0;
  for (const b of B.placer(l, Infinity, 4)) {
    assert.ok(b.col >= 0 && b.col + b.w <= 4, nom + ' déborde');
    for (let r = b.row; r < b.row + b.h; r++) for (let c = b.col; c < b.col + b.w; c++) {
      assert.ok(!cases[r + ',' + c], nom + ' chevauchement en ' + r + ',' + c);
      cases[r + ',' + c] = b.id;
    }
    maxRow = Math.max(maxRow, b.row + b.h);
  }
  assert.equal(Object.keys(cases).length, maxRow * 4, nom + ' a un trou');
  return maxRow;
}

test('quatre préréglages, dans l’ordre, valides pour normalizeLayout', () => {
  assert.deepEqual(B.PRESETS.map(p => p.id), ['concentree', 'equilibree', 'informative', 'graphique']);
  assert.equal(B.PRESET_PERSO, 'personnalisee');
  for (const p of B.PRESETS) {
    const l = B.appliquerPreset(B.defaultLayout(), p.id);
    assert.deepEqual(B.normalizeLayout(l), l, p.id);
    assert.equal(l.tiles.length, 8, p.id);
  }
});

test('nombre de news et emplacements affichés de chaque préréglage', () => {
  const shown = id => {
    const l = B.appliquerPreset(B.defaultLayout(), id);
    return [l.newsCount, l.tiles.filter(t => B.isShown(l, t.id)).map(t => t.id + t.size).join(' ')];
  };
  assert.deepEqual(shown('concentree'), [3, 'n1L n2M n3M']);
  assert.deepEqual(shown('equilibree'), [5, 'n1L n2M n3M n4M n5M']);
  assert.deepEqual(shown('informative'), [7, 'n1L n2M n3M n4S n5S n6S n7S']);
  assert.deepEqual(shown('graphique'), [3, 'graphL n1M n2S n3S']);
  assert.deepEqual(B.PRESETS.map(p => p.graphique), [false, false, false, true]);
});

test('placer : chaque préréglage remplit la grille de 4 colonnes sans trou', () => {
  for (const p of B.PRESETS) assert.equal(sansTrou(B.appliquerPreset(B.defaultLayout(), p.id), p.id), RANGEES[p.id], p.id + ' rangées');
});

test('afficher le graphique dans un préréglage qui le masque reste sans trou', () => {
  for (const id of Object.keys(RANGEES_AVEC_GRAPHIQUE)) {
    const l = B.basculerGraphique(B.appliquerPreset(B.defaultLayout(), id));
    assert.equal(sansTrou(l, id), RANGEES_AVEC_GRAPHIQUE[id], id + ' rangées');
    assert.equal(B.placer(l, Infinity, 4)[0].id, 'graph', id + ' : graphique en tête');
  }
});

test('graphique et préréglages : afficher ou masquer donne personnalisee, Graphique en avant l’affiche', () => {
  for (const p of B.PRESETS) assert.equal(B.presetCourant(B.basculerGraphique(B.appliquerPreset(B.defaultLayout(), p.id))), 'personnalisee', p.id);
  assert.equal(B.appliquerPreset(B.defaultLayout(), 'graphique').graphique, true);
  assert.equal(B.appliquerPreset(B.basculerGraphique(B.defaultLayout()), 'equilibree').graphique, false);
});

test('migration v2 : les anciennes mises en page prédéfinies deviennent les nouvelles', () => {
  const v2 = (newsCount, shown) => {
    const tiles = shown.split(' ').map(s => ({ id: s.slice(0, -1), size: s.slice(-1) }));
    for (const id of ['n1', 'n2', 'n3', 'graph', 'n4', 'n5', 'n6', 'n7']) if (!tiles.some(t => t.id === id)) tiles.push({ id, size: 'S' });
    return { version: 2, newsCount, tiles };
  };
  const anciennes = {
    concentree: v2(3, 'n1L n2S n3S graphM'),
    equilibree: v2(5, 'n1L n2M n3M graphM n4S n5S'),
    informative: v2(7, 'n1M n2M n3M graphM n4S n5S n6S n7S'),
    graphique: v2(3, 'graphL n1M n2S n3S')
  };
  for (const id of Object.keys(anciennes)) {
    assert.deepEqual(B.normalizeLayout(anciennes[id]), B.appliquerPreset(B.defaultLayout(), id), id);
  }
  const autre = v2(3, 'n2M n1L graphS n3S');
  const m = B.normalizeLayout(autre);
  assert.equal(m.version, 3);
  assert.equal(m.graphique, false);
  assert.equal(m.newsCount, 3);
  assert.deepEqual(m.tiles.slice(0, 4), [{ id: 'n2', size: 'M' }, { id: 'n1', size: 'L' }, { id: 'graph', size: 'S' }, { id: 'n3', size: 'S' }]);
});

test('placer : placement dense, tailles et sujets disponibles', () => {
  const l = B.defaultLayout();
  assert.deepEqual(B.placer(l, Infinity, 4).slice(0, 3), [
    { id: 'n1', col: 0, row: 0, w: 2, h: 2 },
    { id: 'n2', col: 2, row: 0, w: 2, h: 1 },
    { id: 'n3', col: 2, row: 1, w: 2, h: 1 }
  ]);
  assert.deepEqual(B.placer(l, 2, 4).map(b => b.id), ['n1', 'n2']);
  assert.deepEqual(B.placer(B.basculerGraphique(l), 2, 4).map(b => b.id), ['graph', 'n1', 'n2']);
  assert.deepEqual(B.placer(l, Infinity, 1)[0], { id: 'n1', col: 0, row: 0, w: 1, h: 2 });
});

test('appliquerPreset : équilibrée est la disposition par défaut, id inconnu sans effet', () => {
  assert.deepEqual(B.appliquerPreset(B.setNewsCount(B.defaultLayout(), 7), 'equilibree'), B.defaultLayout());
  const l = B.setSize(B.defaultLayout(), 'n4', 'L');
  const avant = JSON.stringify(l);
  assert.deepEqual(B.appliquerPreset(l, 'inconnu'), l);
  assert.notEqual(B.appliquerPreset(l, 'inconnu'), l);
  B.appliquerPreset(l, 'concentree');
  assert.equal(JSON.stringify(l), avant);
});

test('presetCourant reconnaît chaque préréglage', () => {
  assert.equal(B.presetCourant(B.defaultLayout()), 'equilibree');
  for (const p of B.PRESETS) assert.equal(B.presetCourant(B.appliquerPreset(B.defaultLayout(), p.id)), p.id);
});

test('presetCourant renvoie personnalisee après toute modification manuelle', () => {
  for (const p of B.PRESETS) {
    const l = B.appliquerPreset(B.defaultLayout(), p.id);
    // 1 news ne correspond à aucun préréglage (concentrée passée à 5 news est exactement équilibrée).
    const autreCompte = 1;
    const modifs = [
      B.moveTile(l, l.tiles[1].id, 0),
      B.stepTile(l, l.tiles[0].id, 1),
      B.setSize(l, l.tiles[0].id, l.tiles[0].size === 'S' ? 'M' : 'S'),
      B.setNewsCount(l, autreCompte)
    ];
    for (const m of modifs) assert.equal(B.presetCourant(m), 'personnalisee', p.id + ' ' + ids(m).join());
  }
});

test('choisirMiseEnPage garde la disposition personnalisée récupérable', () => {
  const perso = B.setSize(B.moveTile(B.defaultLayout(), 'graph', 0), 'n2', 'S');
  let r = B.choisirMiseEnPage(perso, null, 'concentree');
  assert.deepEqual(r.layout, B.appliquerPreset(perso, 'concentree'));
  assert.deepEqual(r.perso, perso);
  r = B.choisirMiseEnPage(r.layout, r.perso, 'informative');
  assert.equal(B.presetCourant(r.layout), 'informative');
  assert.deepEqual(r.perso, perso, 'un préréglage n’écrase pas la disposition personnalisée');
  r = B.choisirMiseEnPage(r.layout, r.perso, 'personnalisee');
  assert.deepEqual(r.layout, perso);
  assert.deepEqual(r.perso, perso);
});

test('choisirMiseEnPage : personnalisee sans disposition enregistrée ne change rien', () => {
  const l = B.appliquerPreset(B.defaultLayout(), 'graphique');
  const r = B.choisirMiseEnPage(l, null, 'personnalisee');
  assert.deepEqual(r.layout, l);
  assert.equal(r.perso, null);
});

test('loadPerso et savePerso', () => {
  const mem = {};
  const storage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
  assert.equal(B.PERSO_KEY, 'pq-layout-perso');
  assert.equal(B.loadPerso(storage), null);
  const l = B.setSize(B.defaultLayout(), 'n5', 'L');
  assert.equal(B.savePerso(storage, l), true);
  assert.deepEqual(B.loadPerso(storage), l);
  const ancienne = { version: 2, newsCount: 3, tiles: [{ id: 'n3', size: 'L' }] };
  mem['pq-layout-perso'] = JSON.stringify(ancienne);
  assert.deepEqual(B.loadPerso(storage), B.normalizeLayout(ancienne));
  assert.equal(B.loadPerso(storage).version, 3);
  mem['pq-layout-perso'] = '{cassé';
  assert.equal(B.loadPerso(storage), null);
  mem['pq-layout-perso'] = '{"version":1}';
  assert.equal(B.loadPerso(storage), null);
  const boom = { getItem() { throw new Error('bloqué'); }, setItem() { throw new Error('bloqué'); } };
  assert.equal(B.loadPerso(boom), null);
  assert.equal(B.savePerso(boom, l), false);
});
