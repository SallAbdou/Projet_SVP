/* Lot 32 : cartes à collectionner (jeu personnel, sans classement ni achat). Logique pure, testée sous Node.
   Chaque news de la fournée devient une carte dont la rareté vient du score de monétisation sur 15.
   Mémoire en localStorage « pq-jeu » = { version: 1, comptes: { [clé]: { rituel: 'AAAA-MM-JJ', vue } } },
   clé de compte comme visite.js et theme.js. La partie navigateur du rituel vit dans rituel.js. */
(function (root) {
  var CLE = 'pq-jeu';
  var VUES = ['fournee', 'cartes'];

  // Seuils de rareté sur le total /15, du plus rare au plus courant : la première atteinte l'emporte.
  // grignes : repère visuel en plus du mot (jamais la couleur seule).
  var RARETES = [
    { id: 'maillard', min: 13, grignes: 4 },
    { id: 'doree', min: 11, grignes: 3 },
    { id: 'croute', min: 9, grignes: 2 },
    { id: 'mie', min: 0, grignes: 1 }
  ];
  var CRITERES = ['durabilite', 'propension', 'lienOffre'];
  // Feu tricolore de n8n vers les états de fraîcheur de la boulangerie (comme fournee.html).
  var FEU = { vert: 'hot', orange: 'knead', rouge: 'stale' };
  var PUCE = { hot: 'puce puce-chaud', knead: 'puce puce-petrir', stale: 'puce puce-rassis' };

  var TEXTES = {
    fr: {
      titre: 'La fournée sort du four',
      intro: 'Retourne tes cartes une à une : le n°1 arrive en dernier.',
      retourner: 'Retourner la carte {n} sur {total}',
      dernier: 'Carte {n} sur {total} : le n°1, à retourner en dernier',
      garde: 'Le n°1 vient en dernier : retourne d’abord les autres cartes.',
      dos: 'Carte {n}', dosAide: 'Retourner', dosDernier: 'Le n°1, en dernier',
      toutRetourner: 'Tout retourner', passer: 'Passer', voir: 'Voir ma fournée',
      fini: 'Toute la fournée est sortie du four.',
      annonce: 'Carte {n} sur {total} : {rarete}. {titre}. {fraicheur}, {source}, {famille}. {money}.',
      money: 'Monétisation {m}/15', sur5: '{v}/5',
      raretes: { maillard: 'Maillard', doree: 'Dorée', croute: 'Croûte', mie: 'Mie' },
      fraicheur: { hot: 'Tout chaud', knead: 'À pétrir', stale: 'Rassis' },
      jauges: { durabilite: 'Durabilité', propension: 'Propension', lienOffre: 'Lien offre' },
      vue: { groupe: 'Affichage de la fournée', fournee: 'Vue fournée', cartes: 'Vue cartes' }
    },
    en: {
      titre: 'The batch is out of the oven',
      intro: 'Turn your cards over one by one: number 1 comes last.',
      retourner: 'Turn over card {n} of {total}',
      dernier: 'Card {n} of {total}: number 1, to turn over last',
      garde: 'Number 1 comes last: turn over the other cards first.',
      dos: 'Card {n}', dosAide: 'Turn over', dosDernier: 'Number 1, last',
      toutRetourner: 'Turn them all over', passer: 'Skip', voir: 'See my batch',
      fini: 'The whole batch is out of the oven.',
      annonce: 'Card {n} of {total}: {rarete}. {titre}. {fraicheur}, {source}, {famille}. {money}.',
      money: 'Monetisation {m}/15', sur5: '{v}/5',
      raretes: { maillard: 'Maillard', doree: 'Golden', croute: 'Crust', mie: 'Crumb' },
      fraicheur: { hot: 'Piping hot', knead: 'Needs kneading', stale: 'Gone stale' },
      jauges: { durabilite: 'Shelf life', propension: 'Shareability', lienOffre: 'Offer fit' },
      vue: { groupe: 'Batch display', fournee: 'Batch view', cartes: 'Card view' }
    }
  };

  function estObjet(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function textes(lang) { return TEXTES[lang === 'en' ? 'en' : 'fr']; }
  function remplir(s, vals) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return vals[k] == null ? m : vals[k]; }); }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ---------- Cartes ---------- */

  // Trois critères notés de 0 à 5 (bornés), comme Bento.jauges.
  function notes(article) {
    var a = article || {};
    return CRITERES.map(function (cle) {
      var v = Number(a[cle]);
      v = isFinite(v) ? Math.min(5, Math.max(0, v)) : 0;
      return { cle: cle, valeur: v, pct: Math.round(v * 20) };
    });
  }

  function rarete(article) {
    var total = notes(article).reduce(function (s, n) { return s + n.valeur; }, 0);
    for (var i = 0; i < RARETES.length; i++) {
      if (total >= RARETES[i].min) return { id: RARETES[i].id, grignes: RARETES[i].grignes, total: total };
    }
    return { id: 'mie', grignes: 1, total: total };
  }

  // Articles du jour non écartés, triés par rang, au plus n (nombre de news réglé dans la fournée).
  function cartesDuJour(articles, n, exclus) {
    var sans = exclus || [];
    return (articles || [])
      .filter(function (a) { return sans.indexOf(a.ref) === -1; })
      .sort(function (a, b) { return a.rang - b.rang; })
      .slice(0, n);
  }

  // Ordre du rituel : du dernier rang au n°1, qui arrive en dernier.
  function ordreRetournement(cartes) { return (cartes || []).slice().reverse(); }

  // retournees : un booléen par carte, dans l'ordre de retournement. La dernière (le n°1) attend les autres.
  function peutRetourner(retournees, i) {
    if (retournees[i]) return false;
    if (i !== retournees.length - 1) return true;
    return retournees.slice(0, -1).every(Boolean);
  }

  // Prochaine carte à proposer : la première encore cachée, ou -1 quand tout est retourné.
  function suivante(retournees) { return retournees.indexOf(false); }

  function fraicheur(article) { return FEU[(article || {}).feu] || ''; }

  // Face d'une carte (rituel) : HTML échappé, sans action. La vue cartes de fournee.html reprend
  // les mêmes classes dans son gabarit, avec les actions.
  function grignesSvg(n) {
    var traits = '';
    for (var i = 0; i < n; i++) traits += '<path d="M' + (3 + i * 7) + ' 12l4-8"></path>';
    return '<svg class="jeu-grignes" viewBox="0 0 30 16" aria-hidden="true" focusable="false">' + traits + '</svg>';
  }

  function faceHtml(article, lang) {
    var a = article || {};
    var t = textes(lang);
    var r = rarete(a);
    var f = fraicheur(a);
    var jauges = notes(a).map(function (n) {
      return '<div class="jeu-jauge"><span class="jeu-jauge-nom">' + esc(t.jauges[n.cle]) + '</span>' +
        '<span class="jeu-piste" aria-hidden="true"><span class="jeu-plein" style="width:' + n.pct + '%"></span></span>' +
        '<span class="jeu-jauge-val">' + esc(remplir(t.sur5, { v: n.valeur })) + '</span></div>';
    }).join('');
    return '<div class="jeu-carte" data-rarete="' + r.id + '">' +
      '<div class="jeu-tete"><span class="jeu-rarete">' + grignesSvg(r.grignes) + '<span>' + esc(t.raretes[r.id]) + '</span></span>' +
      (f ? '<span class="' + PUCE[f] + '">' + esc(t.fraicheur[f]) + '</span>' : '') + '</div>' +
      '<h3 class="jeu-titre">' + esc(a.titre) + '</h3>' +
      '<div class="jeu-meta"><span class="etiquette-source">' + esc(a.source) + '</span><span class="jeu-famille">' + esc(a.axe) + '</span></div>' +
      '<div class="jeu-jauges"><p class="jeu-total">' + esc(remplir(t.money, { m: r.total })) + '</p>' + jauges + '</div>' +
      '</div>';
  }

  function annonce(article, n, total, lang) {
    var a = article || {};
    var t = textes(lang);
    var r = rarete(a);
    var f = fraicheur(a);
    return remplir(t.annonce, {
      n: n, total: total, rarete: t.raretes[r.id], titre: a.titre || '', fraicheur: f ? t.fraicheur[f] : '',
      source: a.source || '', famille: a.axe || '', money: remplir(t.money, { m: r.total })
    });
  }

  /* ---------- Mémoire par compte ---------- */

  function cleDuCompte(u) {
    if (!u) return null;
    var email = typeof u.email === 'string' ? u.email.trim().toLowerCase() : '';
    if (email) return email;
    return typeof u.abonneId === 'string' && u.abonneId ? u.abonneId : null;
  }

  function dateDuJour(d) {
    function deux(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate());
  }

  function etat(storage) {
    try {
      var raw = JSON.parse(storage.getItem(CLE));
      if (raw && raw.version === 1 && estObjet(raw.comptes)) return { version: 1, comptes: raw.comptes };
    } catch (err) {}
    return { version: 1, comptes: {} };
  }

  function lireCompte(storage, cle) {
    var c = cle ? etat(storage).comptes[cle] : null;
    if (!estObjet(c)) return { rituel: '', vue: 'fournee' };
    return { rituel: typeof c.rituel === 'string' ? c.rituel : '', vue: VUES.indexOf(c.vue) !== -1 ? c.vue : 'fournee' };
  }

  function modifierCompte(storage, cle, champs) {
    if (!cle) return false;
    var e = etat(storage);
    var c = lireCompte(storage, cle);
    Object.keys(champs).forEach(function (k) { c[k] = champs[k]; });
    e.comptes[cle] = c;
    try { storage.setItem(CLE, JSON.stringify(e)); return true; } catch (err) { return false; }
  }

  function rituelAFaire(storage, cle, maintenant) {
    if (!cle) return false;
    return lireCompte(storage, cle).rituel !== dateDuJour(maintenant);
  }
  function marquerRituel(storage, cle, maintenant) { return modifierCompte(storage, cle, { rituel: dateDuJour(maintenant) }); }
  function lireVue(storage, cle) { return lireCompte(storage, cle).vue; }
  function choisirVue(storage, cle, vue) {
    if (VUES.indexOf(vue) === -1) return false;
    return modifierCompte(storage, cle, { vue: vue });
  }

  var Jeu = {
    CLE: CLE, RARETES: RARETES, TEXTES: TEXTES, PUCE: PUCE,
    rarete: rarete, notes: notes, fraicheur: fraicheur, cartesDuJour: cartesDuJour,
    ordreRetournement: ordreRetournement, peutRetourner: peutRetourner, suivante: suivante,
    faceHtml: faceHtml, annonce: annonce, remplir: remplir, textes: textes,
    cleDuCompte: cleDuCompte, rituelAFaire: rituelAFaire, marquerRituel: marquerRituel,
    lireVue: lireVue, choisirVue: choisirVue
  };

  if (typeof module === 'object' && module.exports) module.exports = Jeu;
  else root.Jeu = Jeu;
})(this);
