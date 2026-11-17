/* Moteur de rendu maison : remplit #root à partir du template #tpl et de Component.renderVals().
   À chaque rendu : branche les événements, émet « pq:rendu » (utilisé par nav.js), appelle
   afterRender de la page, puis restaure le focus, la sélection et le défilement. */
(function () {
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function get(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  // Valeur insérée par une liste : accolades encodées (affichage identique) pour que le second
  // passage ne réinterprète jamais un « {{...}} » venu des données (titre d'article, par exemple).
  function escListe(v) { return esc(v).replace(/\{/g, '&#123;').replace(/\}/g, '&#125;'); }

  // Remplit le gabarit : listes sc-for (non imbriquées), événements onX="{{fn}}", puis valeurs.
  function remplirGabarit(tpl, v) {
    var s = tpl.replace(/<sc-for list="\{\{([\w.]+)\}\}" as="(\w+)"[^>]*>([\s\S]*?)<\/sc-for>/g, function (m, list, as, inner) {
      return (get(v, list) || []).map(function (it) {
        var sc = {}; sc[as] = it;
        return inner.replace(/\{\{([\w.]+)\}\}/g, function (mm, p) { return p.split('.')[0] === as ? escListe(get(sc, p)) : mm; });
      }).join('');
    });
    s = s.replace(/on([A-Z][a-z]+)="\{\{(\w+)\}\}"/g, function (m, ev, fn) { return 'data-ev="' + ev.toLowerCase() + ':' + fn + '"'; });
    return s.replace(/\{\{([\w.]+)\}\}/g, function (m, p) { return esc(get(v, p)); });
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { esc: esc, remplirGabarit: remplirGabarit };
    return;
  }

  var tpl = document.getElementById('tpl').textContent;
  var c = new Component({});
  try { var l = localStorage.getItem('pq-lang'); if (l === 'fr' || l === 'en') c.state.lang = l; } catch (e) {}
  window.__app = c;

  // Repère stable de l'élément actif, pour le retrouver après le remplacement de #root.
  function repere(el, root) {
    if (!el || el === document.body || !root.contains(el)) return null;
    if (el.id) return '#' + el.id;
    if (el.getAttribute('data-focus')) return '[data-focus="' + el.getAttribute('data-focus') + '"]';
    if (el.getAttribute('data-act')) {
      return '[data-act="' + el.getAttribute('data-act') + '"]' + (el.getAttribute('data-id') ? '[data-id="' + el.getAttribute('data-id') + '"]' : '');
    }
    var meme = root.getElementsByTagName(el.tagName);
    return { tag: el.tagName, index: Array.prototype.indexOf.call(meme, el) };
  }

  function retrouver(rep, root) {
    if (!rep) return null;
    if (typeof rep === 'string') return root.querySelector(rep);
    return root.getElementsByTagName(rep.tag)[rep.index] || null;
  }

  function memoriser(root) {
    var el = document.activeElement;
    var m = { rep: repere(el, root), x: window.scrollX, y: window.scrollY, debut: null, fin: null };
    try {
      if (m.rep && typeof el.selectionStart === 'number') { m.debut = el.selectionStart; m.fin = el.selectionEnd; }
    } catch (e) {}
    return m;
  }

  function restaurer(m, root) {
    // Si afterRender a déjà placé le focus quelque part, on le respecte.
    var actif = document.activeElement;
    if (m.rep && (!actif || actif === document.body)) {
      var el = retrouver(m.rep, root);
      if (el) {
        try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
        try { if (m.debut !== null) el.setSelectionRange(m.debut, m.fin); } catch (e) {}
      }
    }
    window.scrollTo(m.x, m.y);
  }

  window.__render = function () {
    var v = c.renderVals();
    var s = remplirGabarit(tpl, v);

    var root = document.getElementById('root');
    var etat = memoriser(root);
    root.innerHTML = s;
    root.querySelectorAll('[data-ev]').forEach(function (el) {
      var x = el.getAttribute('data-ev').split(':');
      el.addEventListener(x[0], function (e) { if (x[0] === 'submit') e.preventDefault(); v[x[1]](e); });
    });
    var lang = c.state.lang || 'fr';
    document.documentElement.lang = lang;
    document.dispatchEvent(new CustomEvent('pq:rendu', { detail: { root: root, lang: lang } }));
    if (typeof c.afterRender === 'function') c.afterRender(root);
    restaurer(etat, root);
  };

  window.__render();
})();
