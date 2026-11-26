/* Lots 32 à 34 : cartes à collectionner (jeu personnel, sans classement ni achat). Logique pure, testée sous Node.
   Chaque news de la fournée devient une carte dont la rareté vient du score de monétisation sur 15.
   Lot 34 : les cartes se découvrent dans la fournée elle-même (face cachée, un clic les retourne), plus de rituel
   plein écran ni de vue cartes. Mémoire en localStorage « pq-jeu » = { version: 1, comptes: { [clé]: compte } },
   compte = { actif, points, pointsJour, levain, decouvertes: { date, refs }, cartes } (voir les specs des lots 33
   et 34). Clé de compte comme visite.js et theme.js. La partie navigateur vit dans fournee.html. */
(function (root) {
  var CLE = 'pq-jeu';

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
      // Lot 34 : dos des cartes dans la fournée.
      intro: 'Tes news arrivent face cachée : clique sur une carte pour la découvrir. Garde le n°1 pour la fin.',
      rang: 'n°{n}', dosAide: 'Découvrir', dosDernier: 'À garder pour la fin',
      dosLabel: 'Découvrir la news n°{n}, rareté {rarete}', dosLabelDernier: 'Découvrir la news n°{n}, rareté {rarete}, à garder pour la fin',
      toutRetourner: 'Tout retourner',
      compte: { aucune: 'Aucune carte découverte sur {total}', une: '1 carte sur {total} découverte', plusieurs: '{n} cartes sur {total} découvertes', toutes: 'Toute la fournée est découverte' },
      decouverteGain: 'Première carte du jour : +{n} points de cuisson.',
      annonce: 'Carte {n} sur {total} : {rarete}. {titre}. {fraicheur}, {source}, {famille}. {money}.',
      money: 'Monétisation {m}/15', sur5: '{v}/5',
      raretes: { maillard: 'Maillard', doree: 'Dorée', croute: 'Croûte', mie: 'Mie' },
      fraicheur: { hot: 'Tout chaud', knead: 'À pétrir', stale: 'Rassis' },
      jauges: { durabilite: 'Durabilité', propension: 'Intérêt business', lienOffre: 'Pertinence' },
      // Lot 33 : progression personnelle.
      cuite: 'Cuite',
      niveaux: { apprenti: 'Apprenti', mitron: 'Mitron', boulanger: 'Boulanger', maitre: 'Maître artisan' },
      points: '{n} points de cuisson', suite: '{n} points avant {niveau}', sommet: 'Niveau le plus haut atteint',
      cuisson: 'Carte cuite : +{gain} points de cuisson.', nouveauNiveau: 'Nouveau niveau : {niveau}.',
      dejaCuite: 'Cette carte était déjà cuite.',
      levain: {
        un: 'Ton levain : 1 jour', plusieurs: 'Ton levain : {n} jours', vide: 'Ton levain attend ta première fournée',
        nourri: 'Nourri aujourd’hui.', aNourrir: 'Découvre une carte de ta fournée du jour pour le nourrir.',
        endormi: 'Il s’est endormi. Il se réveillera à ta prochaine fournée, en gardant une bonne partie de sa force.',
        etatEndormi: 'Endormi'
      },
      encart: { titre: 'Ta progression', niveau: 'Niveau {niveau}', voir: 'Voir ma collection' },
      collection: {
        onglets: 'Rubriques du garde-manger', cote: 'Mis de côté', titre: 'Collection de pains',
        intro: 'Chaque carte découverte dans ta fournée rejoint ta collection. Elle cuit quand tu publies son post.',
        total: '{v} cartes découvertes, dont {c} cuites', vide: 'Ta collection est vide. Découvre les cartes de ta fournée du jour : elles viendront s’y ranger.',
        autres: 'Autres', vueLe: 'Découverte le {d}', cuiteLe: 'cuite le {d}', exemple: 'Collection d’exemple pour la démo.',
        carte1: '1 carte', carteN: '{n} cartes', cuites0: 'aucune cuite pour l’instant', cuites1: 'dont 1 cuite', cuitesN: 'dont {c} cuites',
        serie: '{famille} : {cartes}, {cuites}',
        familles: 'Par famille', historique: 'Historique des cartes',
        filtreRarete: 'Rareté', filtreFamille: 'Famille', toutes: 'Toutes',
        affichees: '{n} cartes affichées', affichee1: '{n} carte affichée', aucune: 'Aucune carte pour ces filtres.'
      }
    },
    en: {
      intro: 'Your stories arrive face down: click a card to discover it. Keep number 1 for last.',
      rang: '#{n}', dosAide: 'Discover', dosDernier: 'Keep it for last',
      dosLabel: 'Discover story #{n}, rarity {rarete}', dosLabelDernier: 'Discover story #{n}, rarity {rarete}, keep it for last',
      toutRetourner: 'Turn them all over',
      compte: { aucune: 'No card discovered out of {total}', une: '1 of {total} cards discovered', plusieurs: '{n} of {total} cards discovered', toutes: 'The whole batch is discovered' },
      decouverteGain: 'First card of the day: +{n} baking points.',
      annonce: 'Card {n} of {total}: {rarete}. {titre}. {fraicheur}, {source}, {famille}. {money}.',
      money: 'Monetisation {m}/15', sur5: '{v}/5',
      raretes: { maillard: 'Maillard', doree: 'Golden', croute: 'Crust', mie: 'Crumb' },
      fraicheur: { hot: 'Piping hot', knead: 'Needs kneading', stale: 'Gone stale' },
      jauges: { durabilite: 'Durability', propension: 'Business interest', lienOffre: 'Relevance' },
      cuite: 'Baked',
      niveaux: { apprenti: 'Apprentice', mitron: 'Baker’s helper', boulanger: 'Baker', maitre: 'Master baker' },
      points: '{n} baking points', suite: '{n} points to {niveau}', sommet: 'Highest level reached',
      cuisson: 'Card baked: +{gain} baking points.', nouveauNiveau: 'New level: {niveau}.',
      dejaCuite: 'This card was already baked.',
      levain: {
        un: 'Your starter: 1 day', plusieurs: 'Your starter: {n} days', vide: 'Your starter is waiting for your first batch',
        nourri: 'Fed today.', aNourrir: 'Discover a card from today’s batch to feed it.',
        endormi: 'It fell asleep. It will wake up with your next batch, keeping a good part of its strength.',
        etatEndormi: 'Asleep'
      },
      encart: { titre: 'Your progress', niveau: 'Level: {niveau}', voir: 'See my collection' },
      collection: {
        onglets: 'Pantry sections', cote: 'Saved', titre: 'Bread collection',
        intro: 'Every card discovered in your batch joins your collection. It gets baked when you post about it.',
        total: '{v} cards discovered, {c} baked', vide: 'Your collection is empty. Discover the cards of today’s batch: they will be filed here.',
        autres: 'Other', vueLe: 'Discovered on {d}', cuiteLe: 'baked on {d}', exemple: 'Sample collection for the demo.',
        carte1: '1 card', carteN: '{n} cards', cuites0: 'none baked yet', cuites1: '1 baked', cuitesN: '{c} baked',
        serie: '{famille}: {cartes}, {cuites}',
        familles: 'By family', historique: 'Card history',
        filtreRarete: 'Rarity', filtreFamille: 'Family', toutes: 'All',
        affichees: '{n} cards shown', affichee1: '{n} card shown', aucune: 'No card for these filters.'
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

  function fraicheur(article) { return FEU[(article || {}).feu] || ''; }

  // Annonce d'une carte qui vient d'être découverte (lecteur d'écran) : tout est dit en clair.
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

  // Lot 34 : dos d'une carte face cachée dans la fournée. Rang et rareté écrits pour donner envie ;
  // le n°1 se garde pour la fin (ordre suggéré, jamais imposé).
  function dos(article, rang, lang) {
    var t = textes(lang);
    var r = rarete(article);
    var vals = { n: rang, rarete: t.raretes[r.id] };
    return {
      rarete: r.id, grignes: r.grignes, rang: remplir(t.rang, { n: rang }), rareteNom: t.raretes[r.id],
      aide: rang === 1 ? t.dosDernier : t.dosAide,
      label: remplir(rang === 1 ? t.dosLabelDernier : t.dosLabel, vals)
    };
  }

  function compteDecouvertes(n, total, lang) {
    var t = textes(lang).compte;
    var vals = { n: n, total: total };
    if (total > 0 && n >= total) return t.toutes;
    return remplir(n === 0 ? t.aucune : n === 1 ? t.une : t.plusieurs, vals);
  }

  /* ---------- Mémoire par compte ---------- */

  // Lot 33 : règles de progression, chacune dans une constante unique.
  // Points de cuisson : selon la fraîcheur au moment de la cuisson, plus un petit bonus de rareté.
  // Lot 34 : decouverte remplace le gain du rituel, une fois par jour à la première carte découverte.
  var POINTS = {
    cuisson: { hot: 60, knead: 40, stale: 15 },
    bonus: { maillard: 15, doree: 10, croute: 5, mie: 0 },
    decouverte: 10
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
  var FRAICHEURS = ['hot', 'knead', 'stale'];

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
     d'entrée « pq-jeu ». Rien de réel : cartes inventées (refs « exLea… ») découvertes ces cinq derniers jours,
     et deux cartes de la fournée de démo découvertes la veille. Aucune carte découverte aujourd'hui : la fournée
     du jour s'ouvre face cachée. Mitron à 185 points : la première carte du jour puis une cuisson Tout chaud
     Maillard la font passer Boulanger. ?demo=reset efface pq-jeu et ces données repartent à neuf. */
  var COMPTE_DEMO = 'lea@demo.painquotidien.fr';
  function exempleLea(maintenant) {
    var j = function (n) { return decaler(maintenant, -n); };
    var carte = function (titre, source, axe, rarete, fraicheur, vue, cuite, gain) {
      return { titre: titre, source: source, axe: axe, rarete: rarete, fraicheur: fraicheur, vue: vue, cuite: cuite || '', gain: gain || 0 };
    };
    return {
      actif: true, exemple: true,
      points: 185, pointsJour: j(1),
      levain: { jours: 4, dernier: j(1) },
      decouvertes: { date: j(1), refs: ['recDemo06', 'recDemo07'] },
      cartes: {
        exLea01: carte('Un agent IA prend les rendez-vous d’un cabinet de kinés', 'The Decoder', 'Axe 2', 'maillard', 'hot', j(5), j(4), 75),
        exLea05: carte('Facturer un audit IA : trois formules testées', 'Les Echos', 'Axe 3', 'croute', 'knead', j(5)),
        exLea02: carte('Transcrire ses réunions : cinq outils comparés', 'Hugging Face Blog', 'Axe 1', 'doree', 'hot', j(4), j(3), 70),
        exLea03: carte('Ce que l’AI Act change pour les TPE', 'MIT Technology Review', 'Axe 2', 'mie', 'stale', j(3)),
        exLea06: carte('Un chatbot de devis pour artisans', 'Maddyness', 'Axe 3', 'doree', 'knead', j(3)),
        exLea04: carte('Un petit modèle tourne sur un ordinateur portable', 'Mistral AI', 'Axe 1', 'croute', 'knead', j(2)),
        recDemo06: carte('Les marchés réagissent aux résultats d’un géant des puces', 'TechCrunch AI', 'Axe 2', 'mie', 'stale', j(1)),
        recDemo07: carte('Le RGPD face aux modèles de langage', 'The Verge', 'Axe 2', 'mie', 'stale', j(1))
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
      fraicheur: FRAICHEURS.indexOf(c.fraicheur) !== -1 ? c.fraicheur : '',
      vue: chaine(c.vue), cuite: chaine(c.cuite), gain: entier(c.gain)
    };
  }

  // Compte complet et propre. Un compte des lots 32 et 33 reste valide : rituel et vue ne sont plus lus,
  // rituelPoints (dernier jour où le rituel a rapporté) vaut pointsJour.
  function normaliser(c) {
    var o = estObjet(c) ? c : {};
    var lev = estObjet(o.levain) ? o.levain : {};
    var dec = estObjet(o.decouvertes) ? o.decouvertes : {};
    var r = {
      actif: o.actif !== false, points: entier(o.points), pointsJour: chaine(o.pointsJour) || chaine(o.rituelPoints),
      levain: { jours: entier(lev.jours), dernier: chaine(lev.dernier) },
      decouvertes: { date: chaine(dec.date), refs: Array.isArray(dec.refs) ? dec.refs.filter(function (x) { return typeof x === 'string' && x; }) : [] },
      cartes: {}
    };
    if (estObjet(o.cartes)) {
      Object.keys(o.cartes).forEach(function (ref) { var n = normaliserCarte(o.cartes[ref]); if (n) r.cartes[ref] = n; });
    }
    if (o.exemple === true) r.exemple = true;
    return r;
  }

  function lireCompte(storage, cle, maintenant) {
    if (!cle) return normaliser({ actif: false });
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

  /* ---------- Découverte des cartes (lot 34) ---------- */

  // Refs retournées le jour donné : une autre date vaut une liste vide (chaque jour, la fournée revient face cachée).
  function decouvertesDuJour(compte, date) {
    var d = compte && compte.decouvertes;
    return d && d.date === date ? d.refs.slice() : [];
  }

  // Face cachée : jeu actif sur un compte connu et carte pas encore retournée aujourd'hui.
  // Sans compte, lireCompte rend un jeu coupé : on ne cache rien.
  function estCachee(compte, ref, date) {
    if (!compte || !compte.actif) return false;
    return decouvertesDuJour(compte, date).indexOf(ref) === -1;
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

  // Un jour de découverte nourrit le levain ; endormi, il se réveille en gardant une part de ses jours.
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
    return { titre: chaine(a.titre), source: chaine(a.source), axe: chaine(a.axe), rarete: aDesNotes(a) ? rarete(a).id : 'mie', fraicheur: fraicheur(a), vue: date, cuite: '', gain: 0 };
  }

  function niveauDe(c) { return niveau(c.points).id; }

  // Lot 34 : découvrir une ou plusieurs cartes du jour (clic sur le dos, ou « Tout retourner »).
  // Chaque carte rejoint la collection (date et fraîcheur du moment, gardées si elle y était déjà) ;
  // le premier jour de découverte nourrit le levain et rapporte POINTS.decouverte, une seule fois par jour.
  // Rien si le jeu est coupé ou sans compte. ok : écriture réussie.
  function decouvrir(storage, cle, articles, maintenant) {
    var c = lireCompte(storage, cle, maintenant);
    var n = niveauDe(c);
    var r = { ok: false, gain: 0, premiere: false, refs: [], avant: n, apres: n, monte: false, points: c.points };
    if (!cle || !c.actif) return r;
    var date = dateDuJour(maintenant);
    var refs = decouvertesDuJour(c, date);
    (articles || []).forEach(function (a) {
      if (!a || typeof a.ref !== 'string' || !a.ref || refs.indexOf(a.ref) !== -1) return;
      refs.push(a.ref);
      r.refs.push(a.ref);
      if (!c.cartes[a.ref]) c.cartes[a.ref] = nouvelleCarte(a, date);
    });
    c.decouvertes = { date: date, refs: refs };
    if (r.refs.length) {
      c.levain = nourrirLevain(c.levain, date);
      if (c.pointsJour !== date) {
        c.pointsJour = date;
        c.points += POINTS.decouverte;
        r.gain = POINTS.decouverte;
        r.premiere = true;
      }
    }
    r.ok = ecrire(storage, cle, c);
    r.points = c.points;
    r.apres = niveauDe(c);
    r.monte = niveau(c.points).index > niveau(c.points - r.gain).index;
    return r;
  }

  function messageDecouverte(r, lang) {
    if (!r || !r.gain) return '';
    var t = textes(lang);
    return remplir(t.decouverteGain, { n: r.gain }) + (r.monte ? ' ' + remplir(t.nouveauNiveau, { niveau: t.niveaux[r.apres] }) : '');
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

  function copieCarte(ref, c) {
    return { ref: ref, titre: c.titre, source: c.source, axe: c.axe, rarete: c.rarete, fraicheur: c.fraicheur, vue: c.vue, cuite: c.cuite, gain: c.gain };
  }
  function ordreRarete(x, y) { return IDS_RARETE.indexOf(x.rarete) - IDS_RARETE.indexOf(y.rarete); }

  // Collection par famille (axe de l'article) : cuites d'abord, puis de la plus rare à la plus courante.
  function collection(compte, lang) {
    var t = textes(lang);
    var cartes = (compte && compte.cartes) || {};
    var parFamille = {};
    var total = { vues: 0, cuites: 0 };
    Object.keys(cartes).forEach(function (ref) {
      var c = cartes[ref];
      var f = c.axe || t.collection.autres;
      (parFamille[f] = parFamille[f] || []).push(copieCarte(ref, c));
      total.vues++;
      if (c.cuite) total.cuites++;
    });
    var familles = Object.keys(parFamille).sort(function (a, b) { return a.localeCompare(b, 'fr'); }).map(function (f) {
      var liste = parFamille[f].sort(function (x, y) {
        return (!!y.cuite - !!x.cuite) || ordreRarete(x, y) || x.titre.localeCompare(y.titre, 'fr');
      });
      return { famille: f, cartes: liste, cuites: liste.filter(function (x) { return x.cuite; }).length };
    });
    return { total: total, familles: familles };
  }

  // Lot 34 : historique de la collection de pains, toutes journées confondues, du plus récent au plus
  // ancien (la plus rare d'abord le même jour). filtres : { rarete, famille } facultatifs. familles et
  // raretes listent les valeurs présentes (options des filtres) ; total ignore les filtres.
  function historique(compte, filtres) {
    var f = filtres || {};
    var cartes = (compte && compte.cartes) || {};
    var toutes = Object.keys(cartes).map(function (ref) { return copieCarte(ref, cartes[ref]); });
    toutes.sort(function (x, y) {
      return (x.vue < y.vue ? 1 : x.vue > y.vue ? -1 : 0) || ordreRarete(x, y) || x.titre.localeCompare(y.titre, 'fr');
    });
    var familles = [];
    var raretes = [];
    toutes.forEach(function (c) {
      if (c.axe && familles.indexOf(c.axe) === -1) familles.push(c.axe);
      if (raretes.indexOf(c.rarete) === -1) raretes.push(c.rarete);
    });
    familles.sort(function (a, b) { return a.localeCompare(b, 'fr'); });
    raretes.sort(function (a, b) { return IDS_RARETE.indexOf(a) - IDS_RARETE.indexOf(b); });
    return {
      total: toutes.length, familles: familles, raretes: raretes,
      cartes: toutes.filter(function (c) { return (!f.rarete || c.rarete === f.rarete) && (!f.famille || c.axe === f.famille); })
    };
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
    CLE: CLE, RARETES: RARETES, TEXTES: TEXTES, PUCE: PUCE, FEU: FEU,
    POINTS: POINTS, NIVEAUX: NIVEAUX, LEVAIN: LEVAIN, COMPTE_DEMO: COMPTE_DEMO,
    rarete: rarete, notes: notes, fraicheur: fraicheur, cartesDuJour: cartesDuJour,
    annonce: annonce, dos: dos, compteDecouvertes: compteDecouvertes, remplir: remplir, textes: textes,
    cleDuCompte: cleDuCompte, dateDuJour: dateDuJour,
    lireCompte: lireCompte, estActif: estActif, activer: activer, exempleLea: exempleLea,
    decouvertesDuJour: decouvertesDuJour, estCachee: estCachee, decouvrir: decouvrir, messageDecouverte: messageDecouverte,
    niveau: niveau, gainCuisson: gainCuisson, fraicheurCuisson: fraicheurCuisson,
    etatLevain: etatLevain, nourrirLevain: nourrirLevain,
    cuire: cuire, estCuite: estCuite,
    collection: collection, historique: historique, libelleSerie: libelleSerie, resume: resume, messageCuisson: messageCuisson
  };

  if (typeof module === 'object' && module.exports) module.exports = Jeu;
  else root.Jeu = Jeu;
})(this);
