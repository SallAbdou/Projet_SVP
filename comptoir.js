/* Logique pure du comptoir : posts d'exemple et posts publiés fusionnés, KPI sur 30 jours,
   graphique des derniers posts, phrase d'analyse et bilan.
   Aucun accès au DOM, utilisable dans le navigateur (window.Comptoir) et sous Node (tests). */
(function (root) {
  var JOUR = 86400000;
  var FEUX = ['vert', 'orange', 'rouge'];

  function liste(v) { return Array.isArray(v) ? v : []; }
  function temps(iso) {
    var t = typeof iso === 'string' ? Date.parse(iso) : NaN;
    return isNaN(t) ? null : t;
  }

  // Titre coupé à max caractères au plus (points de suspension compris), à la dernière espace si possible.
  function libelleCourt(titre, max) {
    var t = String(titre || '').trim();
    var m = max || 22;
    if (t.length <= m) return t;
    var s = t.slice(0, m - 1);
    var i = s.lastIndexOf(' ');
    if (i > 0) s = s.slice(0, i);
    return s.replace(/\s+$/, '') + '…';
  }

  function depuisExemples(exemples, maintenantIso) {
    var maintenant = temps(maintenantIso);
    return liste(exemples).map(function (e) {
      return {
        id: 'exemple-' + e.ref, ref: e.ref, titre: e.titre, label: e.label, feu: e.feu,
        publieLe: new Date(maintenant - e.ilYaJours * JOUR).toISOString(),
        chiffres: e.chiffres, exemple: true
      };
    });
  }

  function feuDe(ref, articles, sauves) {
    var sources = [liste(articles), liste(sauves)];
    for (var i = 0; i < sources.length; i++) {
      var a = sources[i].filter(function (x) { return x && x.ref === ref; })[0];
      if (a && FEUX.indexOf(a.feu) !== -1) return a.feu;
    }
    return 'orange';
  }

  function depuisPublies(publies, articles, sauves) {
    return liste(publies).map(function (p) {
      return {
        id: p.id, ref: p.ref, titre: p.titre, label: libelleCourt(p.titre), feu: feuDe(p.ref, articles, sauves),
        publieLe: p.publieLe, chiffres: p.chiffres || null, exemple: false
      };
    });
  }

  // Plus récent d'abord ; dates illisibles en dernier ; ordre d'origine conservé à égalité.
  function fusionner(postsA, postsB) {
    return liste(postsA).concat(liste(postsB))
      .map(function (p, i) { return { p: p, i: i, t: temps(p.publieLe) }; })
      .sort(function (x, y) {
        if (x.t === null || y.t === null) return x.t === y.t ? x.i - y.i : (x.t === null ? 1 : -1);
        return y.t - x.t || x.i - y.i;
      })
      .map(function (x) { return x.p; });
  }

  var Comptoir = {
    libelleCourt: libelleCourt, depuisExemples: depuisExemples, depuisPublies: depuisPublies, fusionner: fusionner
  };

  if (typeof module === 'object' && module.exports) module.exports = Comptoir;
  else root.Comptoir = Comptoir;
})(this);
