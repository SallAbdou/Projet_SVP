const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../bento.js');

const ids = l => l.tiles.map(t => t.id);
const withOrder = (order, newsCount) => B.normalizeLayout({ version: 2, newsCount, tiles: order.map(id => ({ id, size: 'S' })) });

test('disposition par défaut en emplacements', () => {
  const l = B.defaultLayout();
  assert.equal(l.version, 2);
  assert.equal(l.newsCount, 5);
  assert.deepEqual(ids(l), ['n1', 'n2', 'n3', 'graph', 'n4', 'n5', 'n6', 'n7']);
  assert.deepEqual(l.tiles.map(t => t.size), ['L', 'M', 'M', 'M', 'S', 'S', 'S', 'S']);
  assert.ok(l.tiles.every(t => Object.keys(t).join() === 'id,size'));
});

test('normalizeLayout répare une disposition abîmée', () => {
  const l = B.normalizeLayout({ version: 2, newsCount: 4, tiles: [
    { id: 'graph', size: 'XL' },
    { id: 'inconnue', size: 'S' },
    { id: 'graph', size: 'S' },
    { id: 'n7', size: 'L', visible: false }
  ] });
  assert.deepEqual(l.tiles.slice(0, 2), [{ id: 'graph', size: 'M' }, { id: 'n7', size: 'L' }]);
  assert.deepEqual(ids(l).slice(2), ['n1', 'n2', 'n3', 'n4', 'n5', 'n6']);
  assert.equal(l.newsCount, 5);
});

test('normalizeLayout rejette les entrées non exploitables, dont la version 1', () => {
  const v1 = { version: 1, newsCount: 3, tiles: [{ id: 'news', size: 'L', visible: true }] };
  for (const raw of [null, 'x', 42, v1, { version: 2 }, { version: 3, tiles: [] }]) {
    assert.deepEqual(B.normalizeLayout(raw), B.defaultLayout());
  }
});

test('rankOf', () => {
  assert.equal(B.rankOf('n3'), 3);
  assert.equal(B.rankOf('n7'), 7);
  assert.equal(B.rankOf('graph'), null);
});

test('isShown selon le nombre choisi et les sujets disponibles', () => {
  const l = B.setNewsCount(B.defaultLayout(), 3);
  assert.equal(B.isShown(l, 'n3'), true);
  assert.equal(B.isShown(l, 'n4'), false);
  assert.equal(B.isShown(l, 'graph'), true);
  assert.equal(B.isShown(l, 'n3', 2), false);
  assert.equal(B.isShown(l, 'graph', 0), true);
});

test('stepTile saute les emplacements cachés', () => {
  const l = B.setNewsCount(B.defaultLayout(), 3);
  assert.deepEqual(ids(B.stepTile(l, 'graph', -1)).slice(0, 4), ['n1', 'n2', 'graph', 'n3']);
  assert.deepEqual(ids(B.stepTile(l, 'n3', 1)).slice(0, 4), ['n1', 'n2', 'graph', 'n3']);
  const gap = withOrder(['n1', 'n4', 'n5', 'n2', 'n3', 'graph', 'n6', 'n7'], 3);
  const down = ids(B.stepTile(gap, 'n1', 1));
  assert.ok(down.indexOf('n2') < down.indexOf('n1'));
  assert.equal(down.indexOf('n1'), down.indexOf('n2') + 1);
  const up = ids(B.stepTile(gap, 'n2', -1));
  assert.equal(up.indexOf('n2'), up.indexOf('n1') - 1);
  assert.deepEqual(B.stepTile(l, 'n1', -1), l);
  assert.deepEqual(B.stepTile(l, 'graph', 1), l, 'graph est le dernier affiché avec 3 news');
  const few = ids(B.stepTile(B.defaultLayout(), 'graph', -1, 2));
  assert.deepEqual(few.slice(0, 3), ['n1', 'graph', 'n2'], 'n3 caché faute de sujet');
});

test('moveTile, setSize, setNewsCount sans muter l’entrée', () => {
  const l = B.defaultLayout();
  assert.deepEqual(ids(B.moveTile(l, 'graph', 0)).slice(0, 2), ['graph', 'n1']);
  assert.equal(ids(B.moveTile(l, 'n1', 99)).at(-1), 'n1');
  assert.equal(B.setSize(l, 'n4', 'L').tiles[4].size, 'L');
  assert.deepEqual(B.setSize(l, 'n4', 'XXL'), l);
  assert.equal(B.setNewsCount(l, 7).newsCount, 7);
  assert.equal(B.setNewsCount(l, 4).newsCount, 5);
  assert.equal(l.tiles[0].id, 'n1');
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
