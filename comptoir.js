/* Logique pure du comptoir : posts d'exemple et posts publiés fusionnés, KPI sur 30 jours,
   graphique des derniers posts, phrase d'analyse et bilan.
   Aucun accès au DOM, utilisable dans le navigateur (window.Comptoir) et sous Node (tests). */
(function (root) {
  var JOUR = 86400000;
  var FEUX = ['vert', 'orange', 'rouge'];
  var CHAMPS = ['impressions', 'reactions', 'republications', 'commentaires', 'contacts'];

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

  // Posts dont l'âge est dans [debutJours, finJours[ ; une date future compte comme âge 0, une date illisible est ignorée.
  // Les posts sans chiffres comptent dans « posts » mais pas dans les sommes.
  function totaux(posts, maintenantIso, debutJours, finJours) {
    var maintenant = temps(maintenantIso);
    var r = { posts: 0 };
    CHAMPS.forEach(function (c) { r[c] = 0; });
    liste(posts).forEach(function (p) {
      var t = temps(p.publieLe);
      if (t === null) return;
      var age = Math.max(0, (maintenant - t) / JOUR);
      if (age < debutJours || age >= finJours) return;
      r.posts++;
      if (p.chiffres) CHAMPS.forEach(function (c) { r[c] += Number(p.chiffres[c]) || 0; });
    });
    return r;
  }

  function ecart(actuel, precedent, mode) {
    var valeur;
    if (mode === 'nombre') valeur = Math.abs(actuel - precedent);
    else if (precedent === 0) return { sens: actuel > 0 ? 'nouveau' : 'stable', valeur: 0 };
    else valeur = Math.round(Math.abs(actuel - precedent) / precedent * 100);
    if (valeur === 0) return { sens: 'stable', valeur: 0 };
    return { sens: actuel > precedent ? 'hausse' : 'baisse', valeur: valeur };
  }

  function kpis(posts, maintenantIso) {
    var actuel = totaux(posts, maintenantIso, 0, 30);
    var precedent = totaux(posts, maintenantIso, 30, 60);
    var ecarts = { posts: ecart(actuel.posts, precedent.posts, 'nombre') };
    ['impressions', 'reactions', 'republications', 'contacts'].forEach(function (c) {
      ecarts[c] = ecart(actuel[c], precedent[c], 'pourcent');
    });
    return { actuel: actuel, precedent: precedent, ecarts: ecarts };
  }

  function chiffres(posts) { return liste(posts).filter(function (p) { return !!p.chiffres; }); }

  // posts : triés du plus récent au plus ancien (fusionner) ; barres du plus ancien au plus récent.
  function graphique(posts, n) {
    var choisis = chiffres(posts).slice(0, n || 6).reverse();
    var max = Math.max.apply(null, choisis.map(function (p) { return Number(p.chiffres.impressions) || 0; }).concat([1]));
    return choisis.map(function (p) {
      var imp = Number(p.chiffres.impressions) || 0;
      return { id: p.id, label: p.label, feu: p.feu, impressions: imp, hauteur: Math.round(imp / max * 100) };
    });
  }

  function moyenne(posts) {
    if (!posts.length) return null;
    return posts.reduce(function (s, p) { return s + (Number(p.chiffres.impressions) || 0); }, 0) / posts.length;
  }

  // Impressions moyennes des sujets verts divisées par celles des autres, arrondies à une décimale.
  function analyse(posts) {
    var avec = chiffres(posts);
    var verts = moyenne(avec.filter(function (p) { return p.feu === 'vert'; }));
    var autres = moyenne(avec.filter(function (p) { return p.feu !== 'vert'; }));
    if (verts === null || !autres) return { ratio: null };
    return { ratio: Math.round(verts / autres * 10) / 10 };
  }

  // Phrase d'analyse en trois morceaux (le gabarit échappe tout : le gras est un <strong> du gabarit).
  var PHRASES = {
    fr: { avant: 'Sers-les vite ! Tes posts sur des sujets ', gras: 'tout chaud', apres: ' font en moyenne {r} fois plus d’audience que les autres.' },
    en: { avant: 'Serve them fast! Your posts on ', gras: 'piping hot', apres: ' topics get on average {r} times more reach than the others.' }
  };
  function phraseAnalyse(ratio, lang) {
    if (typeof ratio !== 'number' || isNaN(ratio)) return null;
    var p = PHRASES[lang] || PHRASES.fr;
    var r = String(ratio);
    if (p === PHRASES.fr) r = r.replace('.', ',');
    return { avant: p.avant, gras: p.gras, apres: p.apres.replace('{r}', r) };
  }

  function sansChiffres(posts) {
    return liste(posts).filter(function (p) { return !p.exemple && !p.chiffres; }).length;
  }

  function bilan(posts) {
    return {
      posts: liste(posts).length,
      contacts: chiffres(posts).reduce(function (s, p) { return s + (Number(p.chiffres.contacts) || 0); }, 0)
    };
  }

  var Comptoir = {
    CHAMPS: CHAMPS,
    graphique: graphique, analyse: analyse, phraseAnalyse: phraseAnalyse, sansChiffres: sansChiffres, bilan: bilan,
    libelleCourt: libelleCourt, depuisExemples: depuisExemples, depuisPublies: depuisPublies, fusionner: fusionner,
    totaux: totaux, ecart: ecart, kpis: kpis
  };

  if (typeof module === 'object' && module.exports) module.exports = Comptoir;
  else root.Comptoir = Comptoir;
})(this);
