/* Logique pure du garde-manger : fraîcheur, tri, filtres et ancienneté des articles mis de côté.
   Aucun accès au DOM, utilisable dans le navigateur (window.GardeManger) et sous Node (tests). */
(function (root) {
  var H = 3600 * 1000;
  var CATEGORIES = ['chaud', 'enfourner', 'rassis'];
  var FILTRES = ['tout'].concat(CATEGORIES);
  var LIBELLES = {
    fr: ['Mis de côté aujourd’hui', 'Mis de côté hier', 'Mis de côté il y a {n} jours'],
    en: ['Saved today', 'Saved yesterday', 'Saved {n} days ago']
  };

  function temps(iso) {
    var t = typeof iso === 'string' ? Date.parse(iso) : NaN;
    return isNaN(t) ? null : t;
  }

  // Heures écoulées depuis savedAt (0 si la date est dans le futur), null si illisible.
  function heuresDepuis(savedAt, maintenantIso) {
    var t = temps(savedAt);
    if (t === null) return null;
    return Math.max(0, temps(maintenantIso) - t) / H;
  }

  function fraicheur(article, maintenantIso) {
    var h = heuresDepuis(article && article.savedAt, maintenantIso);
    if (h === null) return 'rassis';
    if (article.feu === 'vert') return h < 24 ? 'chaud' : 'enfourner';
    if (article.feu === 'orange' && h < 48) return 'enfourner';
    return 'rassis';
  }

  // Plus récent d'abord ; dates illisibles en dernier ; ordre d'origine conservé à égalité.
  function trier(sauves) {
    return (sauves || []).map(function (a, i) { return { a: a, i: i, t: temps(a && a.savedAt) }; })
      .sort(function (x, y) {
        if (x.t === null || y.t === null) return x.t === y.t ? x.i - y.i : (x.t === null ? 1 : -1);
        return y.t - x.t || x.i - y.i;
      })
      .map(function (x) { return x.a; });
  }

  function compter(sauves, maintenantIso) {
    var c = { tout: 0, chaud: 0, enfourner: 0, rassis: 0 };
    (sauves || []).forEach(function (a) { c.tout++; c[fraicheur(a, maintenantIso)]++; });
    return c;
  }

  function filtrer(sauves, filtre, maintenantIso) {
    var tries = trier(sauves);
    if (CATEGORIES.indexOf(filtre) === -1) return tries;
    return tries.filter(function (a) { return fraicheur(a, maintenantIso) === filtre; });
  }

  // Jours calendaires (heure locale) entre savedAt et maintenant ; arrondi pour absorber les changements d'heure.
  function joursDepuis(savedAt, maintenantIso) {
    var t = temps(savedAt);
    if (t === null) return null;
    function minuit(ms) { var d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
    return Math.max(0, Math.round((minuit(temps(maintenantIso)) - minuit(t)) / (24 * H)));
  }

  function libelleAnciennete(jours, lang) {
    if (jours === null || jours === undefined) return '';
    var l = LIBELLES[lang === 'en' ? 'en' : 'fr'];
    return jours === 0 ? l[0] : jours === 1 ? l[1] : l[2].replace('{n}', jours);
  }

  var GardeManger = {
    CATEGORIES: CATEGORIES, FILTRES: FILTRES,
    fraicheur: fraicheur, trier: trier, compter: compter, filtrer: filtrer,
    joursDepuis: joursDepuis, libelleAnciennete: libelleAnciennete
  };

  if (typeof module === 'object' && module.exports) module.exports = GardeManger;
  else root.GardeManger = GardeManger;
})(this);
