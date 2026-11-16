/* Logique pure de la page News bento : disposition des emplacements et helpers de contenu.
   Aucun accès au DOM, utilisable dans le navigateur (window.Bento) et sous Node (tests).
   L'utilisatrice arrange des emplacements : n1 reçoit la news la mieux notée du jour, n2 la suivante, etc. */
(function (root) {
  // Ordre par défaut choisi pour qu'avec 5 news la grille de 4 colonnes se remplisse sans trou.
  var TILE_IDS = ['n1', 'n2', 'n3', 'graph', 'n4', 'n5', 'n6', 'n7'];
  var DEFAULT_SIZES = { n1: 'L', n2: 'M', n3: 'M', graph: 'M', n4: 'S', n5: 'S', n6: 'S', n7: 'S' };
  var SIZES = ['S', 'M', 'L'];
  var COUNTS = [1, 3, 5, 7];
  var DEFAULT_COUNT = 5;
  var VERSION = 2;
  var STORAGE_KEY = 'pq-layout';

  function has(list, v) { return list.indexOf(v) !== -1; }

  function copy(layout) {
    return {
      version: VERSION,
      newsCount: layout.newsCount,
      tiles: layout.tiles.map(function (t) { return { id: t.id, size: t.size }; })
    };
  }

  function defaultLayout() {
    return {
      version: VERSION,
      newsCount: DEFAULT_COUNT,
      tiles: TILE_IDS.map(function (id) { return { id: id, size: DEFAULT_SIZES[id] }; })
    };
  }

  function normalizeLayout(raw) {
    if (!raw || typeof raw !== 'object' || raw.version !== VERSION || !Array.isArray(raw.tiles)) return defaultLayout();
    var seen = {};
    var tiles = [];
    raw.tiles.forEach(function (t) {
      if (!t || typeof t !== 'object' || !has(TILE_IDS, t.id) || seen[t.id]) return;
      seen[t.id] = true;
      tiles.push({ id: t.id, size: has(SIZES, t.size) ? t.size : DEFAULT_SIZES[t.id] });
    });
    TILE_IDS.forEach(function (id) {
      if (!seen[id]) tiles.push({ id: id, size: DEFAULT_SIZES[id] });
    });
    return { version: VERSION, newsCount: has(COUNTS, raw.newsCount) ? raw.newsCount : DEFAULT_COUNT, tiles: tiles };
  }

  function rankOf(id) {
    var m = /^n(\d)$/.exec(id);
    return m ? Number(m[1]) : null;
  }

  // graph est toujours affiché ; nK l'est si K <= nombre choisi et si la fournée a au moins K sujets.
  function isShown(layout, id, available) {
    var k = rankOf(id);
    if (k === null) return true;
    var max = available == null ? Infinity : available;
    return k <= layout.newsCount && k <= max;
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

  // Passe juste devant (delta -1) ou juste après (delta 1) le plus proche emplacement affiché,
  // en sautant les emplacements cachés pour que chaque clic ait un effet visible.
  function stepTile(layout, id, delta, available) {
    var from = indexOf(layout, id);
    if (from === -1) return copy(layout);
    var dir = delta < 0 ? -1 : 1;
    for (var i = from + dir; i >= 0 && i < layout.tiles.length; i += dir) {
      if (!isShown(layout, layout.tiles[i].id, available)) continue;
      // moveTile retire d'abord la tuile : vers le bas, l'index cible i devient « juste après » la voisine.
      return moveTile(layout, id, i);
    }
    return copy(layout);
  }

  function setSize(layout, id, size) {
    var next = copy(layout);
    var i = indexOf(next, id);
    if (has(SIZES, size) && i !== -1) next.tiles[i].size = size;
    return next;
  }

  function setNewsCount(layout, n) {
    var next = copy(layout);
    if (has(COUNTS, n)) next.newsCount = n;
    return next;
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

  // Vérifie la forme minimale du JSON de données avant le rendu (données venant plus tard de n8n).
  function isValidData(d) {
    if (!d || typeof d !== 'object' || Array.isArray(d)) return false;
    if (typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return false;
    if (!Array.isArray(d.topics) || !Array.isArray(d.posts) || !Array.isArray(d.pantry)) return false;
    var p = d.profile;
    return !!p && typeof p === 'object' && Array.isArray(p.axes) && Array.isArray(p.sources);
  }

  function safeUrl(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : '#';
  }

  var Bento = {
    TILE_IDS: TILE_IDS, SIZES: SIZES, COUNTS: COUNTS, STORAGE_KEY: STORAGE_KEY,
    defaultLayout: defaultLayout, normalizeLayout: normalizeLayout,
    moveTile: moveTile, stepTile: stepTile, setSize: setSize, rankOf: rankOf, isShown: isShown,
    setNewsCount: setNewsCount, loadLayout: loadLayout, saveLayout: saveLayout,
    totalScore: totalScore, pickTopics: pickTopics, topTopic: topTopic, countStates: countStates,
    leftover: leftover, safeUrl: safeUrl, isValidData: isValidData
  };

  if (typeof module === 'object' && module.exports) module.exports = Bento;
  else root.Bento = Bento;
})(this);
