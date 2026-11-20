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

  // Titre de l'onglet : version anglaise si elle existe (meta pq-titre-en), sinon le titre français.
  function titrePage(lang, fr, en) { return lang === 'en' && en ? en : fr; }

  // Lien d'évitement (posé en dur avant #root, hors du rendu) : texte suivant la langue.
  function texteEvitement(lang) { return lang === 'en' ? 'Skip to content' : 'Aller au contenu'; }

  // Annonces (lot 24) : #root est recréé à chaque rendu, donc ses role="status" et role="alert"
  // sont des nœuds neufs que les lecteurs d'écran annoncent mal (ou à chaque frappe pour les alertes).
  // On relève leur texte après chaque rendu et on ne dit, dans une zone persistante hors de #root,
  // que ce qui vient d'apparaître ou a changé. avant et apres : { cle: { texte, urgent, visible } }.
  function aAnnoncer(avant, apres) {
    var r = { poli: [], urgent: [] };
    if (!avant) return r;
    Object.keys(apres).forEach(function (k) {
      var n = apres[k], a = avant[k];
      var texte = (n.texte || '').trim();
      if (!texte || !n.visible || (a && a.visible && (a.texte || '').trim() === texte)) return;
      (n.urgent ? r.urgent : r.poli).push(texte);
    });
    return r;
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { esc: esc, remplirGabarit: remplirGabarit, titrePage: titrePage, texteEvitement: texteEvitement, aAnnoncer: aAnnoncer };
    return;
  }

  var tpl = document.getElementById('tpl').textContent;
  var c = new Component({});
  try { var l = localStorage.getItem('pq-lang'); if (l === 'fr' || l === 'en') c.state.lang = l; } catch (e) {}
  window.__app = c;
  var titreFr = document.title;
  var metaEn = document.querySelector('meta[name="pq-titre-en"]');

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

  // Zones d'annonce persistantes, créées une fois avant le premier rendu, hors de #root.
  var CACHE = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0';
  function zone(id, vive) {
    var z = document.getElementById(id);
    if (!z) {
      z = document.createElement('div');
      z.id = id;
      z.setAttribute('aria-live', vive);
      z.setAttribute('aria-atomic', 'true');
      z.setAttribute('style', CACHE);
      document.body.appendChild(z);
    }
    return z;
  }
  var zonePolie = zone('pq-annonce', 'polite');
  var zoneUrgente = zone('pq-annonce-urgente', 'assertive');
  var minuteurs = {};
  // On vide puis on écrit un instant après : un même message répété est de nouveau lu.
  window.annoncer = function (texte, urgent) {
    var z = urgent ? zoneUrgente : zonePolie;
    clearTimeout(minuteurs[z.id]);
    z.textContent = '';
    minuteurs[z.id] = setTimeout(function () { z.textContent = texte; }, 60);
  };
  var etatsAnnonces = null;
  function releverAnnonces(root) {
    var etats = {};
    root.querySelectorAll('[role="status"],[role="alert"],[aria-live],[data-annonce]').forEach(function (el, i) {
      var urgent = el.getAttribute('role') === 'alert' || el.getAttribute('aria-live') === 'assertive';
      etats[el.id || i] = { texte: el.textContent, urgent: urgent, visible: el.getClientRects().length > 0 };
      // Le relais remplace la région recréée : on retire son rôle pour ne rien dire deux fois.
      el.removeAttribute('role');
      el.removeAttribute('aria-live');
    });
    var dire = aAnnoncer(etatsAnnonces, etats);
    etatsAnnonces = etats;
    if (dire.urgent.length) window.annoncer(dire.urgent.join(' '), true);
    if (dire.poli.length) window.annoncer(dire.poli.join(' '));
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
    document.title = titrePage(lang, titreFr, metaEn && metaEn.getAttribute('content'));
    var evitement = document.querySelector('.pq-evitement');
    if (evitement) evitement.textContent = texteEvitement(lang);
    document.dispatchEvent(new CustomEvent('pq:rendu', { detail: { root: root, lang: lang } }));
    if (typeof c.afterRender === 'function') c.afterRender(root);
    restaurer(etat, root);
    releverAnnonces(root);
  };

  window.__render();
})();
