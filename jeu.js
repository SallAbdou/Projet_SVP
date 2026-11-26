/* Lot 32 : cartes à collectionner (jeu personnel, sans classement ni achat). Logique pure, testée sous Node.
   Chaque news de la fournée devient une carte dont la rareté vient du score de monétisation sur 15.
   Mémoire en localStorage « pq-jeu » = { version: 1, comptes: { [clé]: { rituel: 'AAAA-MM-JJ', vue, ...lot 33 } } },
   lot 33 : actif, points, rituelPoints, levain, cartes vues et cuites (voir la spec 2026-11-25-lot33-progression-design.md).
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
      vue: { groupe: 'Affichage de la fournée', fournee: 'Vue fournée', cartes: 'Vue cartes' },
      // Lot 33 : progression personnelle.
      cuite: 'Cuite',
      niveaux: { apprenti: 'Apprenti', mitron: 'Mitron', boulanger: 'Boulanger', maitre: 'Maître artisan' },
      points: '{n} points de cuisson', suite: '{n} points avant {niveau}', sommet: 'Niveau le plus haut atteint',
      cuisson: 'Carte cuite : +{gain} points de cuisson.', nouveauNiveau: 'Nouveau niveau : {niveau}.',
      dejaCuite: 'Cette carte était déjà cuite.', rituelGain: 'Rituel du jour : +{n} points de cuisson.',
      levain: {
        un: 'Ton levain : 1 jour', plusieurs: 'Ton levain : {n} jours', vide: 'Ton levain attend ta première fournée',
        nourri: 'Nourri aujourd’hui.', aNourrir: 'Ouvre ta fournée du jour pour le nourrir.',
        endormi: 'Il s’est endormi. Il se réveillera à ta prochaine fournée, en gardant une bonne partie de sa force.',
        etatEndormi: 'Endormi'
      },
      encart: { titre: 'Ta progression', niveau: 'Niveau {niveau}', voir: 'Voir ma collection' },
      collection: {
        onglets: 'Rubriques du garde-manger', cote: 'Mis de côté', titre: 'Ma collection',
        intro: 'Chaque carte vue dans ta fournée rejoint ta collection. Elle cuit quand tu publies son post.',
        total: '{v} cartes vues, dont {c} cuites', vide: 'Ta collection est vide. Ouvre ta fournée du jour : ses cartes viendront s’y ranger.',
        autres: 'Autres', vueLe: 'Vue le {d}', cuiteLe: 'Cuite le {d}', exemple: 'Collection d’exemple pour la démo.',
        carte1: '1 carte', carteN: '{n} cartes', cuites0: 'aucune cuite pour l’instant', cuites1: 'dont 1 cuite', cuitesN: 'dont {c} cuites',
        serie: '{famille} : {cartes}, {cuites}'
      }
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
      vue: { groupe: 'Batch display', fournee: 'Batch view', cartes: 'Card view' },
      cuite: 'Baked',
      niveaux: { apprenti: 'Apprentice', mitron: 'Baker’s helper', boulanger: 'Baker', maitre: 'Master baker' },
      points: '{n} baking points', suite: '{n} points to {niveau}', sommet: 'Highest level reached',
      cuisson: 'Card baked: +{gain} baking points.', nouveauNiveau: 'New level: {niveau}.',
      dejaCuite: 'This card was already baked.', rituelGain: 'Morning ritual: +{n} baking points.',
      levain: {
        un: 'Your starter: 1 day', plusieurs: 'Your starter: {n} days', vide: 'Your starter is waiting for your first batch',
        nourri: 'Fed today.', aNourrir: 'Open today’s batch to feed it.',
        endormi: 'It fell asleep. It will wake up with your next batch, keeping a good part of its strength.',
        etatEndormi: 'Asleep'
      },
      encart: { titre: 'Your progress', niveau: 'Level: {niveau}', voir: 'See my collection' },
      collection: {
        onglets: 'Pantry sections', cote: 'Saved', titre: 'My collection',
        intro: 'Every card seen in your batch joins your collection. It gets baked when you post about it.',
        total: '{v} cards seen, {c} baked', vide: 'Your collection is empty. Open today’s batch: its cards will be filed here.',
        autres: 'Other', vueLe: 'Seen on {d}', cuiteLe: 'Baked on {d}', exemple: 'Sample collection for the demo.',
        carte1: '1 card', carteN: '{n} cards', cuites0: 'none baked yet', cuites1: '1 baked', cuitesN: '{c} baked',
        serie: '{famille}: {cartes}, {cuites}'
      }
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

  // Lot 33 : règles de progression, chacune dans une constante unique.
  // Points de cuisson : selon la fraîcheur au moment de la cuisson, plus un petit bonus de rareté.
  var POINTS = {
    cuisson: { hot: 60, knead: 40, stale: 15 },
    bonus: { maillard: 15, doree: 10, croute: 5, mie: 0 },
    rituel: 10
  };
  var NIVEAUX = [
    { id: 'apprenti', min: 0 },
    { id: 'mitron', min: 100 },
    { id: 'boulanger', min: 250 },
    { id: 'maitre', min: 600 }
  ];
  // Le levain s'endort après « sommeil » jours manqués d'affilée ; au réveil il garde cette part de ses jours.
  var LEVAIN = { sommeil: 2, garde: 0.5 };
  var GARDE_VERS_FRAICHEUR = { chaud: 'hot', enfourner: 'knead', rassis: 'stale' };
  var IDS_RARETE = RARETES.map(function (r) { return r.id; });

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

  // Écart en jours entre deux dates AAAA-MM-JJ (NaN si l'une est illisible).
  function ecartJours(de, a) {
    function jour(s) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
      return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000 : NaN;
    }
    return jour(a) - jour(de);
  }
  function decaler(d, jours) { var x = new Date(d.getTime()); x.setDate(x.getDate() + jours); return dateDuJour(x); }

  /* DONNÉES D'EXEMPLE (démo jury) : progression plausible de Léa, le compte de démo, tant qu'elle n'a pas
     d'entrée « pq-jeu ». Rien de réel : cartes inventées (refs « exLea… ») et deux cartes de la fournée de démo
     vues la veille. Mitron à 185 points : le rituel du jour puis une cuisson Tout chaud Maillard la font passer
     Boulanger. ?demo=reset efface pq-jeu et ces données repartent à neuf. */
  var COMPTE_DEMO = 'lea@demo.painquotidien.fr';
  function exempleLea(maintenant) {
    var j = function (n) { return decaler(maintenant, -n); };
    var carte = function (titre, source, axe, rarete, vue, cuite, gain) {
      return { titre: titre, source: source, axe: axe, rarete: rarete, vue: vue, cuite: cuite || '', gain: gain || 0 };
    };
    return {
      rituel: '', vue: 'fournee', actif: true, exemple: true,
      points: 185, rituelPoints: j(1),
      levain: { jours: 4, dernier: j(1) },
      cartes: {
        exLea01: carte('Un agent IA prend les rendez-vous d’un cabinet de kinés', 'The Decoder', 'Axe 2', 'maillard', j(4), j(4), 75),
        exLea02: carte('Transcrire ses réunions : cinq outils comparés', 'Hugging Face Blog', 'Axe 1', 'doree', j(3), j(3), 70),
        exLea03: carte('Ce que l’AI Act change pour les TPE', 'MIT Technology Review', 'Axe 2', 'mie', j(3)),
        exLea04: carte('Un petit modèle tourne sur un ordinateur portable', 'Mistral AI', 'Axe 1', 'croute', j(2)),
        recDemo06: carte('Les marchés réagissent aux résultats d’un géant des puces', 'TechCrunch AI', 'Axe 2', 'mie', j(1)),
        recDemo07: carte('Le RGPD face aux modèles de langage', 'The Verge', 'Axe 2', 'mie', j(1))
      }
    };
  }

  function etat(storage) {
    try {
      var raw = JSON.parse(storage.getItem(CLE));
      if (raw && raw.version === 1 && estObjet(raw.comptes)) return { version: 1, comptes: raw.comptes };
    } catch (err) {}
    return { version: 1, comptes: {} };
  }

  function chaine(v) { return typeof v === 'string' ? v : ''; }
  function entier(v) { return typeof v === 'number' && isFinite(v) && v > 0 ? Math.floor(v) : 0; }

  function normaliserCarte(c) {
    if (!estObjet(c)) return null;
    return {
      titre: chaine(c.titre), source: chaine(c.source), axe: chaine(c.axe),
      rarete: IDS_RARETE.indexOf(c.rarete) !== -1 ? c.rarete : 'mie',
      vue: chaine(c.vue), cuite: chaine(c.cuite), gain: entier(c.gain)
    };
  }

  // Compte complet et propre. Un compte du lot 32 ({ rituel, vue }) reste valide.
  function normaliser(c) {
    var o = estObjet(c) ? c : {};
    var lev = estObjet(o.levain) ? o.levain : {};
    var r = {
      rituel: chaine(o.rituel), vue: VUES.indexOf(o.vue) !== -1 ? o.vue : 'fournee',
      actif: o.actif !== false, points: entier(o.points), rituelPoints: chaine(o.rituelPoints),
      levain: { jours: entier(lev.jours), dernier: chaine(lev.dernier) }, cartes: {}
    };
    if (estObjet(o.cartes)) {
      Object.keys(o.cartes).forEach(function (ref) { var n = normaliserCarte(o.cartes[ref]); if (n) r.cartes[ref] = n; });
    }
    if (o.exemple === true) r.exemple = true;
    return r;
  }

  function lireCompte(storage, cle, maintenant) {
    if (!cle) return normaliser(null);
    var c = etat(storage).comptes[cle];
    if (!estObjet(c) && cle === COMPTE_DEMO) c = exempleLea(maintenant || new Date());
    return normaliser(c);
  }

  function ecrire(storage, cle, compte) {
    if (!cle) return false;
    var e = etat(storage);
    e.comptes[cle] = compte;
    try { storage.setItem(CLE, JSON.stringify(e)); return true; } catch (err) { return false; }
  }

  function modifierCompte(storage, cle, champs, maintenant) {
    if (!cle) return false;
    var c = lireCompte(storage, cle, maintenant);
    Object.keys(champs).forEach(function (k) { c[k] = champs[k]; });
    return ecrire(storage, cle, c);
  }

  function estActif(storage, cle) { return lireCompte(storage, cle).actif; }
  function activer(storage, cle, oui) { return modifierCompte(storage, cle, { actif: !!oui }); }

  function rituelAFaire(storage, cle, maintenant) {
    if (!cle) return false;
    var c = lireCompte(storage, cle, maintenant);
    return c.actif && c.rituel !== dateDuJour(maintenant);
  }
  function marquerRituel(storage, cle, maintenant) { return modifierCompte(storage, cle, { rituel: dateDuJour(maintenant) }, maintenant); }
  // Jeu coupé : retour à la vue fournée (le choix mémorisé est gardé pour plus tard).
  function lireVue(storage, cle) { var c = lireCompte(storage, cle); return c.actif ? c.vue : 'fournee'; }
  function choisirVue(storage, cle, vue) {
    if (VUES.indexOf(vue) === -1) return false;
    return modifierCompte(storage, cle, { vue: vue });
  }

  /* ---------- Progression (lot 33) ---------- */

  function niveau(points) {
    var p = entier(Number(points));
    var i = NIVEAUX.length - 1;
    while (i > 0 && p < NIVEAUX[i].min) i--;
    var suivant = NIVEAUX[i + 1] || null;
    return {
      id: NIVEAUX[i].id, index: i, points: p, min: NIVEAUX[i].min,
      suivant: suivant ? suivant.id : null, reste: suivant ? suivant.min - p : 0,
      pct: suivant ? Math.round((p - NIVEAUX[i].min) * 100 / (suivant.min - NIVEAUX[i].min)) : 100
    };
  }

  function gainCuisson(fraicheurCuite, idRarete) {
    var base = POINTS.cuisson[fraicheurCuite] || POINTS.cuisson.knead;
    return base + (POINTS.bonus[idRarete] || 0);
  }

  // Fraîcheur au moment de la cuisson : feu de la news (fournée) ou catégorie du garde-manger.
  function fraicheurCuisson(article, origine, categorieGarde) {
    if (origine === 'garde-manger') return GARDE_VERS_FRAICHEUR[categorieGarde] || 'knead';
    return fraicheur(article) || 'knead';
  }

  function etatLevain(levain, date) {
    var l = estObjet(levain) ? levain : {};
    var jours = entier(l.jours);
    var ecart = ecartJours(l.dernier, date);
    return { jours: jours, endormi: jours > 0 && ecart > LEVAIN.sommeil, nourriAujourdhui: jours > 0 && ecart === 0 };
  }

  // Une ouverture de fournée par jour nourrit le levain ; endormi, il se réveille en gardant une part de ses jours.
  function nourrirLevain(levain, date) {
    var l = estObjet(levain) ? levain : {};
    var jours = entier(l.jours);
    var ecart = ecartJours(l.dernier, date);
    if (!jours || !(ecart >= 0)) return { jours: jours ? jours + 1 : 1, dernier: date };
    if (ecart === 0) return { jours: jours, dernier: l.dernier };
    if (ecart <= LEVAIN.sommeil) return { jours: jours + 1, dernier: date };
    return { jours: Math.ceil(jours * LEVAIN.garde) + 1, dernier: date };
  }

  function aDesNotes(a) { return CRITERES.some(function (k) { return a[k] != null && isFinite(Number(a[k])); }); }

  function nouvelleCarte(a, date) {
    return { titre: chaine(a.titre), source: chaine(a.source), axe: chaine(a.axe), rarete: aDesNotes(a) ? rarete(a).id : 'mie', vue: date, cuite: '', gain: 0 };
  }

  // Ouverture de la fournée (page ou rituel) : cartes du jour vues, levain nourri. Rien si le jeu est coupé.
  function ouvrirFournee(storage, cle, cartes, maintenant) {
    if (!cle) return false;
    var c = lireCompte(storage, cle, maintenant);
    if (!c.actif) return false;
    var date = dateDuJour(maintenant);
    (cartes || []).forEach(function (a) {
      if (a && typeof a.ref === 'string' && a.ref && !c.cartes[a.ref]) c.cartes[a.ref] = nouvelleCarte(a, date);
    });
    c.levain = nourrirLevain(c.levain, date);
    return ecrire(storage, cle, c);
  }

  function gagner(storage, cle, c, gain) {
    var avant = niveau(c.points);
    c.points += gain;
    var apres = niveau(c.points);
    ecrire(storage, cle, c);
    return { gain: gain, dejaCuite: false, avant: avant.id, apres: apres.id, monte: apres.index > avant.index, points: c.points };
  }

  function rien(c) {
    var n = niveau(c.points).id;
    return { gain: 0, dejaCuite: false, avant: n, apres: n, monte: false, points: c.points };
  }

  function gagnerRituel(storage, cle, maintenant) {
    var c = lireCompte(storage, cle, maintenant);
    var date = dateDuJour(maintenant);
    if (!cle || !c.actif || c.rituelPoints === date) return rien(c);
    c.rituelPoints = date;
    return gagner(storage, cle, c, POINTS.rituel);
  }

  // Publication confirmée au fournil : la carte de même ref cuit, une seule fois.
  function cuire(storage, cle, article, fraicheurCuite, maintenant) {
    var c = lireCompte(storage, cle, maintenant);
    var a = article || {};
    if (!cle || !c.actif || typeof a.ref !== 'string' || !a.ref) return rien(c);
    var date = dateDuJour(maintenant);
    var carte = c.cartes[a.ref] || nouvelleCarte(a, date);
    if (carte.cuite) { var r = rien(c); r.dejaCuite = true; return r; }
    carte.cuite = date;
    carte.gain = gainCuisson(fraicheurCuite, carte.rarete);
    c.cartes[a.ref] = carte;
    return gagner(storage, cle, c, carte.gain);
  }

  function estCuite(compte, ref) { return !!(compte && compte.cartes && compte.cartes[ref] && compte.cartes[ref].cuite); }

  // Collection par famille (axe de l'article) : cuites d'abord, puis de la plus rare à la plus courante.
  function collection(compte, lang) {
    var t = textes(lang);
    var cartes = (compte && compte.cartes) || {};
    var parFamille = {};
    var total = { vues: 0, cuites: 0 };
    Object.keys(cartes).forEach(function (ref) {
      var c = cartes[ref];
      var f = c.axe || t.collection.autres;
      (parFamille[f] = parFamille[f] || []).push({ ref: ref, titre: c.titre, source: c.source, axe: c.axe, rarete: c.rarete, vue: c.vue, cuite: c.cuite, gain: c.gain });
      total.vues++;
      if (c.cuite) total.cuites++;
    });
    var familles = Object.keys(parFamille).sort(function (a, b) { return a.localeCompare(b, 'fr'); }).map(function (f) {
      var liste = parFamille[f].sort(function (x, y) {
        return (!!y.cuite - !!x.cuite) || (IDS_RARETE.indexOf(x.rarete) - IDS_RARETE.indexOf(y.rarete)) || x.titre.localeCompare(y.titre, 'fr');
      });
      return { famille: f, cartes: liste, cuites: liste.filter(function (x) { return x.cuite; }).length };
    });
    return { total: total, familles: familles };
  }

  function libelleSerie(famille, n, cuites, lang) {
    var t = textes(lang).collection;
    return remplir(t.serie, {
      famille: famille,
      cartes: n === 1 ? t.carte1 : remplir(t.carteN, { n: n }),
      cuites: cuites === 0 ? t.cuites0 : cuites === 1 ? t.cuites1 : remplir(t.cuitesN, { c: cuites })
    });
  }

  // Textes de l'encart du comptoir : tout est dit en clair (la barre n'est qu'un repère visuel).
  function resume(compte, date, lang) {
    var t = textes(lang);
    var c = normaliser(compte);
    var n = niveau(c.points);
    var l = etatLevain(c.levain, date);
    var col = collection(c, lang);
    return {
      niveau: t.niveaux[n.id], idNiveau: n.id, pct: n.pct,
      points: remplir(t.points, { n: n.points }),
      suite: n.suivant ? remplir(t.suite, { n: n.reste, niveau: t.niveaux[n.suivant] }) : t.sommet,
      levain: l.jours === 0 ? t.levain.vide : l.jours === 1 ? t.levain.un : remplir(t.levain.plusieurs, { n: l.jours }),
      endormi: l.endormi,
      levainEtat: l.endormi ? t.levain.endormi : l.nourriAujourdhui ? t.levain.nourri : t.levain.aNourrir,
      vues: col.total.vues, cuites: col.total.cuites
    };
  }

  function messageCuisson(r, lang) {
    if (!r) return '';
    var t = textes(lang);
    if (r.dejaCuite) return t.dejaCuite;
    if (!r.gain) return '';
    return remplir(t.cuisson, { gain: r.gain }) + (r.monte ? ' ' + remplir(t.nouveauNiveau, { niveau: t.niveaux[r.apres] }) : '');
  }

  var Jeu = {
    CLE: CLE, RARETES: RARETES, TEXTES: TEXTES, PUCE: PUCE,
    POINTS: POINTS, NIVEAUX: NIVEAUX, LEVAIN: LEVAIN, COMPTE_DEMO: COMPTE_DEMO,
    rarete: rarete, notes: notes, fraicheur: fraicheur, cartesDuJour: cartesDuJour,
    ordreRetournement: ordreRetournement, peutRetourner: peutRetourner, suivante: suivante,
    faceHtml: faceHtml, annonce: annonce, remplir: remplir, textes: textes,
    cleDuCompte: cleDuCompte, dateDuJour: dateDuJour, rituelAFaire: rituelAFaire, marquerRituel: marquerRituel,
    lireVue: lireVue, choisirVue: choisirVue,
    lireCompte: lireCompte, estActif: estActif, activer: activer, exempleLea: exempleLea,
    niveau: niveau, gainCuisson: gainCuisson, fraicheurCuisson: fraicheurCuisson,
    etatLevain: etatLevain, nourrirLevain: nourrirLevain, ouvrirFournee: ouvrirFournee,
    gagnerRituel: gagnerRituel, cuire: cuire, estCuite: estCuite,
    collection: collection, libelleSerie: libelleSerie, resume: resume, messageCuisson: messageCuisson
  };

  if (typeof module === 'object' && module.exports) module.exports = Jeu;
  else root.Jeu = Jeu;
})(this);
