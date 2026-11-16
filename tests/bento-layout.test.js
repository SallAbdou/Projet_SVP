const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../bento.js');

test('disposition par défaut', () => {
  const l = B.defaultLayout();
  assert.equal(l.version, 1);
  assert.equal(l.newsCount, 5);
  assert.deepEqual(l.tiles.map(t => t.id), ['news', 'top', 'graph', 'pantry', 'stats', 'profile', 'painperdu']);
  assert.deepEqual(l.tiles.map(t => t.size), ['L', 'M', 'M', 'L', 'S', 'S', 'M']);
  assert.ok(l.tiles.every(t => t.visible === true));
});

test('normalizeLayout répare une disposition abîmée', () => {
  const l = B.normalizeLayout({ version: 1, newsCount: 4, tiles: [
    { id: 'pantry', size: 'XL', visible: false },
    { id: 'inconnue', size: 'S', visible: true },
    { id: 'pantry', size: 'S', visible: true },
    { id: 'news', size: 'S', visible: 'oui' }
  ] });
  assert.deepEqual(l.tiles.slice(0, 2), [
    { id: 'pantry', size: 'L', visible: false },
    { id: 'news', size: 'S', visible: true }
  ]);
  assert.deepEqual(l.tiles.slice(2).map(t => t.id), ['top', 'graph', 'stats', 'profile', 'painperdu']);
  assert.equal(l.newsCount, 5);
});

test('normalizeLayout rejette les entrées non exploitables', () => {
  for (const raw of [null, 'x', 42, { version: 2, tiles: [] }, { version: 1 }]) {
    assert.deepEqual(B.normalizeLayout(raw), B.defaultLayout());
  }
});

test('moveTile et stepTile', () => {
  const l = B.defaultLayout();
  assert.deepEqual(B.moveTile(l, 'pantry', 0).tiles.map(t => t.id).slice(0, 2), ['pantry', 'news']);
  assert.equal(B.moveTile(l, 'news', 99).tiles.at(-1).id, 'news');
  assert.deepEqual(B.stepTile(l, 'top', -1).tiles.map(t => t.id).slice(0, 2), ['top', 'news']);
  assert.deepEqual(B.stepTile(l, 'news', -1), l);
  assert.equal(l.tiles[0].id, 'news'); // entrée non mutée
});

test('setSize, setVisible, setNewsCount, hiddenIds', () => {
  const l = B.defaultLayout();
  assert.equal(B.setSize(l, 'stats', 'L').tiles[4].size, 'L');
  assert.deepEqual(B.setSize(l, 'stats', 'XXL'), l);
  const h = B.setVisible(B.setVisible(l, 'graph', false), 'top', false);
  assert.deepEqual(B.hiddenIds(h), ['top', 'graph']);
  assert.equal(B.setNewsCount(l, 7).newsCount, 7);
  assert.equal(B.setNewsCount(l, 4).newsCount, 5);
});

test('load et save avec un stockage normal', () => {
  const mem = {};
  const storage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
  assert.deepEqual(B.loadLayout(storage), B.defaultLayout());
  const l = B.setNewsCount(B.defaultLayout(), 3);
  assert.equal(B.saveLayout(storage, l), true);
  assert.deepEqual(B.loadLayout(storage), l);
  mem['pq-layout'] = '{pas du json';
  assert.deepEqual(B.loadLayout(storage), B.defaultLayout());
});

test('load et save quand le stockage lève une exception', () => {
  const boom = { getItem() { throw new Error('bloqué'); }, setItem() { throw new Error('bloqué'); } };
  assert.deepEqual(B.loadLayout(boom), B.defaultLayout());
  assert.equal(B.saveLayout(boom, B.defaultLayout()), false);
  assert.deepEqual(B.loadLayout(undefined), B.defaultLayout());
});
