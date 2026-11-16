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

  // Glisser-déposer des tuiles par leur poignée [data-drag], à la souris et au doigt.
  // Pendant le glisser on ne déplace que le DOM ; l'état n'est mis à jour qu'au lâcher via onDrop.
  // Écouteurs délégués sur document : #root est reconstruit à chaque rendu.
  var dragInit = false;
  function initDrag(opts) {
    if (dragInit) return;
    dragInit = true;
    var drag = null;
    var MOVE_DELAY = 120;

    function tilesOf(grid) {
      return Array.prototype.filter.call(grid.children, function (el) { return el.hasAttribute('data-tile'); });
    }

    function end(cancelled) {
      var d = drag;
      drag = null;
      if (!d) return;
      d.tile.classList.remove('dragging');
      document.documentElement.classList.remove('is-dragging');
      try { d.handle.releasePointerCapture(d.pointerId); } catch (e) {}
      if (cancelled) { window.__render(); return; }
      var index = tilesOf(d.grid).indexOf(d.tile);
      if (index !== d.startIndex) opts.onDrop(d.id, index);
    }

    document.addEventListener('pointerdown', function (e) {
      var handle = e.target.closest && e.target.closest('[data-drag]');
      if (!handle || !opts.isEditing() || (e.pointerType === 'mouse' && e.button !== 0)) return;
      var tile = handle.closest('[data-tile]');
      if (!tile) return;
      e.preventDefault();
      drag = { tile: tile, id: tile.getAttribute('data-tile'), grid: tile.parentNode, handle: handle, pointerId: e.pointerId, startIndex: tilesOf(tile.parentNode).indexOf(tile), last: 0 };
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      tile.classList.add('dragging');
      document.documentElement.classList.add('is-dragging');
    });

    document.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.pointerId) return;
      e.preventDefault();
      var now = Date.now();
      if (now - drag.last < MOVE_DELAY) return;
      var hit = document.elementFromPoint(e.clientX, e.clientY);
      var over = hit && hit.closest('[data-tile]');
      if (!over || over === drag.tile || over.hidden || over.parentNode !== drag.grid) return;
      var r = over.getBoundingClientRect();
      // Moitié haute-gauche de la tuile survolée (coupée en diagonale) : on se place avant, sinon après.
      var before = (e.clientX - r.left) / r.width + (e.clientY - r.top) / r.height < 1;
      var ref = before ? over : over.nextSibling;
      if (ref === drag.tile || (before && drag.tile.nextSibling === over)) return;
      drag.grid.insertBefore(drag.tile, ref);
      drag.last = now;
    });

    document.addEventListener('pointerup', function (e) { if (drag && e.pointerId === drag.pointerId) end(false); });
    document.addEventListener('pointercancel', function (e) { if (drag && e.pointerId === drag.pointerId) end(true); });
    document.addEventListener('keydown', function (e) { if (drag && e.key === 'Escape') end(true); });
  }

  root.BentoUI = { applyLayout: applyLayout, initDrag: initDrag };
})(this);
