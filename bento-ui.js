/* Partie DOM de la page News bento : applique la disposition aux tuiles rendues par boot.js. */
(function (root) {
  var SIZE_CLASSES = ['tile-S', 'tile-M', 'tile-L'];

  // Replace les tuiles dans l'ordre de la disposition (l'ordre du DOM suit l'ordre visuel,
  // donc la tabulation aussi), applique la taille et la visibilité, synchronise les boutons bascules.
  // available : nombre de sujets du jour, les emplacements sans sujet restent cachés.
  function applyLayout(rootEl, layout, available) {
    var grid = rootEl && rootEl.querySelector('[data-bento]');
    if (!grid || !layout) return;
    var sizes = {};
    layout.tiles.forEach(function (t) {
      sizes[t.id] = t.size;
      var el = grid.querySelector('[data-tile="' + t.id + '"]');
      if (!el) return;
      SIZE_CLASSES.forEach(function (c) { el.classList.remove(c); });
      el.classList.add('tile', 'tile-' + t.size);
      el.hidden = !root.Bento.isShown(layout, t.id, available);
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

    // Appui long au doigt en attente : { tile, pointerId, x, y, timer }.
    var attente = null;
    var APPUI_LONG = 400, TOLERANCE = 10;
    function annulerAttente() { if (attente) { clearTimeout(attente.timer); attente = null; } }

    function commencer(tile, pointerId) {
      drag = { tile: tile, id: tile.getAttribute('data-tile'), grid: tile.parentNode, handle: tile, pointerId: pointerId, startIndex: tilesOf(tile.parentNode).indexOf(tile), last: 0 };
      try { tile.setPointerCapture(pointerId); } catch (err) {}
      tile.classList.add('dragging');
      document.documentElement.classList.add('is-dragging');
    }

    // Le bloc s'attrape par n'importe quel endroit hors bouton (règle dans Bento.departGlisser).
    document.addEventListener('pointerdown', function (e) {
      var cible = e.target.closest ? e.target : null;
      var tile = cible && cible.closest('[data-tile]');
      var mode = root.Bento.departGlisser({
        edition: opts.isEditing(), surTuile: !!(tile && tile.closest('[data-bento]')),
        surPoignee: !!(cible && cible.closest('[data-drag]')),
        surControle: !!(cible && cible.closest('button, a, input, select, textarea, label')),
        typePointeur: e.pointerType, bouton: e.button
      });
      if (!mode || drag) return;
      if (mode === 'immediat') { e.preventDefault(); commencer(tile, e.pointerId); return; }
      annulerAttente();
      attente = { tile: tile, pointerId: e.pointerId, x: e.clientX, y: e.clientY };
      attente.timer = setTimeout(function () {
        var a = attente;
        attente = null;
        if (a && document.contains(a.tile)) commencer(a.tile, a.pointerId);
      }, APPUI_LONG);
    });

    // Une fois le glisser commencé au doigt, la page ne défile plus ; l'appui long n'ouvre pas de menu.
    document.addEventListener('touchmove', function (e) { if (drag) e.preventDefault(); }, { passive: false });
    document.addEventListener('contextmenu', function (e) { if (drag || attente) e.preventDefault(); });

    document.addEventListener('pointermove', function (e) {
      if (attente && e.pointerId === attente.pointerId && Math.abs(e.clientX - attente.x) + Math.abs(e.clientY - attente.y) > TOLERANCE) annulerAttente();
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

    document.addEventListener('pointerup', function (e) { annulerAttente(); if (drag && e.pointerId === drag.pointerId) end(false); });
    document.addEventListener('pointercancel', function (e) { annulerAttente(); if (drag && e.pointerId === drag.pointerId) end(true); });
    document.addEventListener('keydown', function (e) { if (drag && e.key === 'Escape') end(true); });
  }

  // Message bref en bas d'écran. el est une zone aria-live statique, hors de #root (qui est
  // remplacé à chaque rendu) : on ne réécrit son contenu que si vue.cle change, pour n'annoncer
  // chaque message qu'une fois. vue = { cle, texte, annuler } ou null pour effacer.
  function toast(el, vue, onUndo) {
    if (!el) return;
    var cle = vue ? String(vue.cle) : '';
    if (el.getAttribute('data-cle') === cle) return;
    el.setAttribute('data-cle', cle);
    el.innerHTML = '';
    if (!vue) return;
    var box = document.createElement('div');
    box.className = 'toast-box';
    var texte = document.createElement('span');
    texte.id = 'pq-toast-texte';
    texte.textContent = vue.texte;
    box.appendChild(texte);
    if (vue.annuler) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-toast-undo', '');
      b.setAttribute('aria-describedby', 'pq-toast-texte');
      b.textContent = vue.annuler;
      b.addEventListener('click', onUndo);
      box.appendChild(b);
    }
    el.appendChild(box);
  }

  // Accessibilité du message (liaison unique sur la zone statique) : délai suspendu tant que le
  // focus ou la souris est dedans (WCAG 2.2.1, survol ajouté au lot 24), repris quand les deux
  // sont sortis ; Échap ferme le message. f = { pause(), reprise(), echap() }.
  function suivreToast(el, f) {
    if (!el || el.__suivi) return;
    el.__suivi = true;
    var focus = false, survol = false;
    el.addEventListener('focusin', function () { focus = true; f.pause(); });
    el.addEventListener('focusout', function (e) {
      if (e.relatedTarget && el.contains(e.relatedTarget)) return;
      focus = false;
      if (!survol) f.reprise();
    });
    el.addEventListener('mouseenter', function () { survol = true; f.pause(); });
    el.addEventListener('mouseleave', function () { survol = false; if (!focus) f.reprise(); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); f.echap(); } });
  }

  // Miniature schématique d'une disposition (cartes « Mise en page ») : un rectangle par bloc
  // affiché, placé comme dans la grille de 4 colonnes ; n°1 doré, graphique brun.
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var MINI_COULEURS = { n1: ['var(--or-milieu)', 'var(--cuivre)'], graph: ['var(--brun)', 'var(--brun)'] };
  function miniature(el, layout) {
    if (!el || !layout) return;
    var blocs = root.Bento.placer(layout, null, 4);
    var rangees = 1;
    blocs.forEach(function (b) { rangees = Math.max(rangees, b.row + b.h); });
    var U = 10, G = 1.2;
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + (4 * U) + ' ' + (rangees * U));
    svg.setAttribute('focusable', 'false');
    blocs.forEach(function (b) {
      var c = MINI_COULEURS[b.id] || ['var(--creme)', 'var(--bord-fort)'];
      var r = document.createElementNS(SVG_NS, 'rect');
      r.setAttribute('x', b.col * U + G / 2);
      r.setAttribute('y', b.row * U + G / 2);
      r.setAttribute('width', b.w * U - G);
      r.setAttribute('height', b.h * U - G);
      r.setAttribute('rx', 1.6);
      r.style.fill = c[0];
      r.style.stroke = c[1];
      r.setAttribute('stroke-width', 0.5);
      svg.appendChild(r);
    });
    el.innerHTML = '';
    el.appendChild(svg);
  }

  root.BentoUI = { applyLayout: applyLayout, initDrag: initDrag, toast: toast, suivreToast: suivreToast, miniature: miniature };
})(this);
