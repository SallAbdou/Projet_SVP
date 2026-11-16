/* Logique pure de la page News bento : disposition des tuiles et helpers de contenu.
   Aucun accès au DOM, utilisable dans le navigateur (window.Bento) et sous Node (tests). */
(function (root) {
  // Ordre par défaut choisi pour que la grille de 4 colonnes se remplisse sans trou.
  var TILE_IDS = ['news', 'top', 'graph', 'pantry', 'stats', 'profile', 'painperdu'];
  var DEFAULT_SIZES = { news: 'L', top: 'M', graph: 'M', stats: 'S', profile: 'S', painperdu: 'M', pantry: 'L' };
  var SIZES = ['S', 'M', 'L'];
  var COUNTS = [1, 3, 5, 7];
  var DEFAULT_COUNT = 5;
  var STORAGE_KEY = 'pq-layout';

  function has(list, v) { return list.indexOf(v) !== -1; }

  function copy(layout) {
    return {
      version: 1,
      newsCount: layout.newsCount,
      tiles: layout.tiles.map(function (t) { return { id: t.id, size: t.size, visible: t.visible }; })
    };
  }

  function defaultLayout() {
    return {
      version: 1,
      newsCount: DEFAULT_COUNT,
      tiles: TILE_IDS.map(function (id) { return { id: id, size: DEFAULT_SIZES[id], visible: true }; })
    };
  }

  function normalizeLayout(raw) {
    if (!raw || typeof raw !== 'object' || raw.version !== 1 || !Array.isArray(raw.tiles)) return defaultLayout();
    var seen = {};
    var tiles = [];
    raw.tiles.forEach(function (t) {
      if (!t || typeof t !== 'object' || !has(TILE_IDS, t.id) || seen[t.id]) return;
      seen[t.id] = true;
      tiles.push({ id: t.id, size: has(SIZES, t.size) ? t.size : DEFAULT_SIZES[t.id], visible: t.visible !== false });
    });
    TILE_IDS.forEach(function (id) {
      if (!seen[id]) tiles.push({ id: id, size: DEFAULT_SIZES[id], visible: true });
    });
    return { version: 1, newsCount: has(COUNTS, raw.newsCount) ? raw.newsCount : DEFAULT_COUNT, tiles: tiles };
  }

  function indexOf(layout, id) {
    for (var i = 0; i < layout.tiles.length; i++) if (layout.tiles[i].id === id) return i;
    return -1;
  }

  function moveTile(layout, id, toIndex) {
    var next = copy(layout);
    var from = indexOf(next, id);
    if (from === -1) return next;
    var tile = next.tiles.splice(from, 1)[0];
    var to = Math.max(0, Math.min(next.tiles.length, Math.floor(Number(toIndex) || 0)));
    next.tiles.splice(to, 0, tile);
    return next;
  }

  function stepTile(layout, id, delta) {
    var from = indexOf(layout, id);
    if (from === -1) return copy(layout);
    return moveTile(layout, id, from + (delta < 0 ? -1 : 1));
  }

  function patchTile(layout, id, key, value) {
    var next = copy(layout);
    var i = indexOf(next, id);
    if (i !== -1) next.tiles[i][key] = value;
    return next;
  }

  function setSize(layout, id, size) {
    return has(SIZES, size) ? patchTile(layout, id, 'size', size) : copy(layout);
  }

  function setVisible(layout, id, visible) {
    return patchTile(layout, id, 'visible', visible !== false);
  }

  function setNewsCount(layout, n) {
    var next = copy(layout);
    if (has(COUNTS, n)) next.newsCount = n;
    return next;
  }

  function hiddenIds(layout) {
    return layout.tiles.filter(function (t) { return !t.visible; }).map(function (t) { return t.id; });
  }

  function loadLayout(storage) {
    try {
      var raw = storage.getItem(STORAGE_KEY);
      return raw == null ? defaultLayout() : normalizeLayout(JSON.parse(raw));
    } catch (e) {
      return defaultLayout();
    }
  }

  function saveLayout(storage, layout) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(layout));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* Helpers de contenu */

  function totalScore(topic) {
    var sc = (topic && topic.scores) || {};
    return (sc.durability || 0) + (sc.propensity || 0) + (sc.offer || 0);
  }

  function sortedByScore(topics) {
    return (topics || [])
      .map(function (t, i) { return { t: t, i: i, s: totalScore(t) }; })
      .sort(function (a, b) { return b.s - a.s || a.i - b.i; })
      .map(function (x) { return x.t; });
  }

  function pickTopics(topics, n) {
    return sortedByScore(topics).slice(0, n);
  }

  function topTopic(topics) {
    var list = sortedByScore(topics);
    for (var i = 0; i < list.length; i++) if (list[i].state === 'hot') return list[i];
    return list.length ? list[0] : null;
  }

  function countStates(topics) {
    var c = { hot: 0, knead: 0, stale: 0 };
    (topics || []).forEach(function (t) { if (c.hasOwnProperty(t.state)) c[t.state]++; });
    return c;
  }

  function leftover(topics) {
    var list = topics || [];
    for (var i = 0; i < list.length; i++) if (list[i].state === 'stale' && list[i].newAngle) return list[i];
    return null;
  }

  function safeUrl(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : '#';
  }

  var Bento = {
    TILE_IDS: TILE_IDS, SIZES: SIZES, COUNTS: COUNTS, STORAGE_KEY: STORAGE_KEY,
    defaultLayout: defaultLayout, normalizeLayout: normalizeLayout,
    moveTile: moveTile, stepTile: stepTile, setSize: setSize, setVisible: setVisible,
    setNewsCount: setNewsCount, hiddenIds: hiddenIds, loadLayout: loadLayout, saveLayout: saveLayout,
    totalScore: totalScore, pickTopics: pickTopics, topTopic: topTopic, countStates: countStates,
    leftover: leftover, safeUrl: safeUrl
  };

  if (typeof module === 'object' && module.exports) module.exports = Bento;
  else root.Bento = Bento;
})(this);
