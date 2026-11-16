/* Partie DOM de la page News bento : applique la disposition aux tuiles rendues par boot.js. */
(function (root) {
  var SIZE_CLASSES = ['tile-S', 'tile-M', 'tile-L'];

  // Replace les tuiles dans l'ordre de la disposition (l'ordre du DOM suit l'ordre visuel,
  // donc la tabulation aussi), applique la taille et la visibilité, synchronise les boutons bascules.
  function applyLayout(rootEl, layout) {
    var grid = rootEl && rootEl.querySelector('[data-bento]');
    if (!grid || !layout) return;
    var sizes = {};
    layout.tiles.forEach(function (t) {
      sizes[t.id] = t.size;
      var el = grid.querySelector('[data-tile="' + t.id + '"]');
      if (!el) return;
      SIZE_CLASSES.forEach(function (c) { el.classList.remove(c); });
      el.classList.add('tile', 'tile-' + t.size);
      el.hidden = !t.visible;
      grid.appendChild(el);
    });
    rootEl.querySelectorAll('[data-id][data-size]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(sizes[b.getAttribute('data-id')] === b.getAttribute('data-size')));
    });
    rootEl.querySelectorAll('[data-count]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(Number(b.getAttribute('data-count')) === layout.newsCount));
    });
  }

  root.BentoUI = { applyLayout: applyLayout };
})(this);
