const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../bento.js');

const ids = l => l.tiles.map(t => t.id);
const RANGEES = { concentree: 2, equilibree: 3, informative: 3, graphique: 2 };

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
  assert.deepEqual(shown('concentree'), [3, 'n1L n2S n3S graphM']);
  assert.deepEqual(shown('equilibree'), [5, 'n1L n2M n3M graphM n4S n5S']);
  assert.deepEqual(shown('informative'), [7, 'n1M n2M n3M graphM n4S n5S n6S n7S']);
  assert.deepEqual(shown('graphique'), [3, 'graphL n1M n2S n3S']);
});

test('placer : chaque préréglage remplit la grille de 4 colonnes sans trou', () => {
  for (const p of B.PRESETS) {
    const l = B.appliquerPreset(B.defaultLayout(), p.id);
    const cases = {};
    let maxRow = 0;
    for (const b of B.placer(l, Infinity, 4)) {
      assert.ok(b.col >= 0 && b.col + b.w <= 4, p.id + ' déborde');
      for (let r = b.row; r < b.row + b.h; r++) for (let c = b.col; c < b.col + b.w; c++) {
        assert.ok(!cases[r + ',' + c], p.id + ' chevauchement en ' + r + ',' + c);
        cases[r + ',' + c] = b.id;
      }
      maxRow = Math.max(maxRow, b.row + b.h);
    }
    assert.equal(maxRow, RANGEES[p.id], p.id + ' rangées');
    assert.equal(Object.keys(cases).length, maxRow * 4, p.id + ' a un trou');
  }
});

test('placer : placement dense, tailles et sujets disponibles', () => {
  const l = B.defaultLayout();
  assert.deepEqual(B.placer(l, Infinity, 4).slice(0, 3), [
    { id: 'n1', col: 0, row: 0, w: 2, h: 2 },
    { id: 'n2', col: 2, row: 0, w: 2, h: 1 },
    { id: 'n3', col: 2, row: 1, w: 2, h: 1 }
  ]);
  assert.deepEqual(B.placer(l, 2, 4).map(b => b.id), ['n1', 'n2', 'graph']);
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
    const autreCompte = l.newsCount === 5 ? 7 : 5;
    const modifs = [
      B.moveTile(l, l.tiles[1].id, 0),
      B.stepTile(l, l.tiles[0].id, 1),
      B.setSize(l, l.tiles[0].id, l.tiles[0].size === 'S' ? 'M' : 'S'),
      B.setNewsCount(l, autreCompte)
    ];
    for (const m of modifs) assert.equal(B.presetCourant(m), 'personnalisee', p.id + ' ' + ids(m).join());
  }
});
