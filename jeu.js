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
      jauges: { durabilite: 'Durabilité', propension: 'Propension', lienOffre: 'Lien offre' },
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
      },
      // Lot 35 : titres par thématique (épicènes). Libellés courts des thématiques dans Jeu.THEMATIQUES.
      paliers: { novice: 'Novice', analyste: 'Analyste', specialiste: 'Spécialiste', stratege: 'Stratège', visionnaire: 'Visionnaire' },
      lecture: 'Lecture : +{n} points en {thematiques}.', lectureSans: 'Lecture : +{n} points de cuisson.',
      nouveauTitre: 'Nouveau titre : {titre}.', et: ' et ',
      vitrine: {
        ptsTheme: '{n} points', ptsTheme1: '1 point', suite: '{n} points avant {palier}', sommet: 'Palier le plus haut atteint',
        cuites0: 'Aucune carte cuite pour l’instant', cuites1: '1 carte cuite', cuitesN: '{n} cartes cuites', depuis: 'Obtenu le {d}',
        sansPoints: 'Pas encore de points en : {liste}.', affiche: 'Titre affiché : {titre}.', aucunAffiche: 'Aucun titre affiché : ton métier reste sous ton prénom.'
      },
      // Brouillon d'annonce d'un titre, proposé au fournil : à relire comme tout texte généré.
      annonceTitre: {
        expert: 'Nouveau titre sur Votre pAIn quotidien : {titre}.\n\nIl ne se gagne pas en un jour : il récompense des posts publiés sur {thematique} quand le sujet était encore chaud, et des sources vraiment lues.\n\nCe que j’en retiens :\n→ suivre un sujet de près vaut mieux qu’en survoler dix\n→ publier tôt compte plus que publier beaucoup\n→ le score est personnel, sans classement\n\nEt vous, quel sujet suivez-vous de près en ce moment ?',
        retour: 'Je viens d’obtenir le titre {titre} sur Votre pAIn quotidien.\n\nDerrière le badge : des news lues chaque matin, et des posts publiés sur {thematique} quand le sujet était encore chaud.\n\nCe que j’ai appris en chemin :\n→ l’habitude compte plus que l’outil\n→ un seul sujet à la fois suffit\n→ écrire tôt oblige à prendre position\n\nEt vous, comment suivez-vous l’actu IA ?',
        provoc: 'Un titre sur LinkedIn ne prouve rien. Le mien dit {titre}.\n\nIl ne récompense pas une audience : il récompense la régularité sur {thematique}, et des sources lues avant d’écrire.\n\nMon avis :\n→ l’expertise se construit en public\n→ la régularité bat le talent\n→ le badge compte moins que les posts derrière\n\nVous êtes d’accord, ou c’est un badge de plus ?'
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
      jauges: { durabilite: 'Shelf life', propension: 'Shareability', lienOffre: 'Offer fit' },
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
      },
      paliers: { novice: 'Novice', analyste: 'Analyst', specialiste: 'Specialist', stratege: 'Strategist', visionnaire: 'Visionary' },
      lecture: 'Reading: +{n} points in {thematiques}.', lectureSans: 'Reading: +{n} baking points.',
      nouveauTitre: 'New title: {titre}.', et: ' and ',
      vitrine: {
        ptsTheme: '{n} points', ptsTheme1: '1 point', suite: '{n} points to {palier}', sommet: 'Highest tier reached',
        cuites0: 'No card baked yet', cuites1: '1 card baked', cuitesN: '{n} cards baked', depuis: 'Earned on {d}',
        sansPoints: 'No points yet in: {liste}.', affiche: 'Title shown: {titre}.', aucunAffiche: 'No title shown: your job stays under your name.'
      },
      annonceTitre: {
        expert: 'New title on Votre pAIn quotidien: {titre}.\n\nIt does not come in a day. It rewards posts published on {thematique} while the topic was still hot, and sources actually read.\n\nMy takeaway:\n→ following one topic closely beats skimming ten\n→ posting early matters more than posting a lot\n→ the score is personal, no ranking\n\nWhich topic are you following closely right now?',
        retour: 'I just earned the {titre} title on Votre pAIn quotidien.\n\nBehind the badge: news read every morning, and posts published on {thematique} when the topic was still warm.\n\nWhat I learned along the way:\n→ the habit matters more than the tool\n→ one topic at a time is enough\n→ writing early forces me to take a stand\n\nHow do you keep up with AI news?',
        provoc: 'A title on LinkedIn proves nothing. Mine says {titre}.\n\nIt does not reward an audience: it rewards regularity on {thematique}, and sources read before writing.\n\nMy point:\n→ expertise is built in public\n→ consistency beats talent\n→ the badge matters less than the posts behind it\n\nDo you agree, or is it just one more badge?'
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
    decouverte: 10,
    // Lot 35 : « Lire la source » d'une carte découverte, une fois par article, LECTURES_PAR_JOUR par jour au plus.
    lecture: 5
  };
  var LECTURES_PAR_JOUR = 3;
  // Lot 35 : paliers de titre, sur les points cumulés dans une thématique. Le palier 1 ne s'affiche pas.
  var PALIERS = [
    { id: 'novice', min: 0 },
    { id: 'analyste', min: 50 },
    { id: 'specialiste', min: 150 },
    { id: 'stratege', min: 400 },
    { id: 'visionnaire', min: 1000 }
  ];
  // Les 12 thématiques du questionnaire (libellé exact), libellé court FR et EN, identifiant stable.
  var THEMATIQUES = [
    { id: 'llms', libelle: 'LLMs', fr: 'LLMs', en: 'LLMs' },
    { id: 'video', libelle: 'Vidéo', fr: 'Vidéo', en: 'Video' },
    { id: 'image', libelle: 'Image', fr: 'Image', en: 'Image' },
    { id: 'automatisation', libelle: 'Automatisation et agents', fr: 'Automatisation', en: 'Automation' },
    { id: 'cybersecurite', libelle: 'Cybersécurité', fr: 'Cybersécurité', en: 'Cybersecurity' },
    { id: 'grandes-firmes', libelle: 'Actualité des grandes firmes', fr: 'Grandes firmes', en: 'Big Tech' },
    { id: 'monetisation', libelle: 'Monétisation', fr: 'Monétisation', en: 'Monetisation' },
    { id: 'finance', libelle: 'Finance et spéculation', fr: 'Finance', en: 'Finance' },
    { id: 'hardware', libelle: 'Hardware', fr: 'Hardware', en: 'Hardware' },
    { id: 'ia-entreprise', libelle: 'IA en entreprise', fr: 'IA en entreprise', en: 'AI at work' },
    { id: 'ecosystemes', libelle: 'Ecosystèmes', fr: 'Écosystèmes', en: 'Ecosystems' },
    { id: 'rd', libelle: 'Ingénierie R&D', fr: 'R&D', en: 'R&D' }
  ];
  var PAR_ID = Object.create(null);
  var PAR_NOM = Object.create(null);
  THEMATIQUES.forEach(function (t) { PAR_ID[t.id] = t; PAR_NOM[t.id] = t; PAR_NOM[t.libelle] = t; });

  // Liste propre de thématiques : libellés exacts du questionnaire (ou identifiants), sans doublon, 3 au plus.
  // Tout le reste est ignoré.
  function thematiquesValides(v) {
    var r = [];
    (Array.isArray(v) ? v : []).forEach(function (x) {
      var t = typeof x === 'string' ? PAR_NOM[x.trim()] : null;
      if (t && r.indexOf(t.libelle) === -1 && r.length < 3) r.push(t.libelle);
    });
    return r;
  }
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
    var carte = function (titre, source, axe, rarete, fraicheur, vue, cuite, gain, thematiques) {
      return { titre: titre, source: source, axe: axe, rarete: rarete, fraicheur: fraicheur, vue: vue, cuite: cuite || '', gain: gain || 0, thematiques: thematiques };
    };
    var AUTO = 'Automatisation et agents', IAE = 'IA en entreprise';
    // Lot 35 : thématiques sur les 8 cartes et 2 lectures. Automatisation 150 (Spécialiste, titre affiché),
    // IA en entreprise 80 (Analyste), LLMs 70 (Analyste). Publier le n°1 de la fournée de démo (+75 en
    // Automatisation et IA en entreprise) fait passer IA en entreprise Spécialiste, en direct.
    return {
      actif: true, exemple: true,
      points: 185, pointsJour: j(1),
      levain: { jours: 4, dernier: j(1) },
      decouvertes: { date: j(1), refs: ['recDemo06', 'recDemo07'] },
      cartes: {
        exLea01: carte('Un agent IA prend les rendez-vous d’un cabinet de kinés', 'The Decoder', 'Axe 2', 'maillard', 'hot', j(5), j(4), 75, [AUTO, IAE]),
        exLea05: carte('Facturer un audit IA : trois formules testées', 'Les Echos', 'Axe 3', 'croute', 'knead', j(5), '', 0, ['Monétisation', IAE]),
        exLea02: carte('Transcrire ses réunions : cinq outils comparés', 'Hugging Face Blog', 'Axe 1', 'doree', 'hot', j(4), j(3), 70, [AUTO, 'LLMs']),
        exLea03: carte('Ce que l’AI Act change pour les TPE', 'MIT Technology Review', 'Axe 2', 'mie', 'stale', j(3), '', 0, [IAE, 'Cybersécurité']),
        exLea06: carte('Un chatbot de devis pour artisans', 'Maddyness', 'Axe 3', 'doree', 'knead', j(3), '', 0, [AUTO, 'Monétisation']),
        exLea04: carte('Un petit modèle tourne sur un ordinateur portable', 'Mistral AI', 'Axe 1', 'croute', 'knead', j(2), '', 0, ['LLMs', 'Hardware']),
        recDemo06: carte('Les marchés réagissent aux résultats d’un géant des puces', 'TechCrunch AI', 'Axe 2', 'mie', 'stale', j(1), '', 0, ['Hardware', 'Finance et spéculation']),
        recDemo07: carte('Le RGPD face aux modèles de langage', 'The Verge', 'Axe 2', 'mie', 'stale', j(1), '', 0, ['LLMs', 'Cybersécurité'])
      },
      lectures: {
        exLea05: { jour: j(5), thematiques: ['Monétisation', IAE] },
        exLea06: { jour: j(3), thematiques: [AUTO, 'Monétisation'] }
      },
      titres: { 'ia-entreprise': { palier: 2, depuis: j(4) }, automatisation: { palier: 3, depuis: j(3) }, llms: { palier: 2, depuis: j(3) } },
      titreAffiche: 'automatisation'
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

  // Lot 35 : thematiques n'est posé que s'il y en a (une carte du lot 34 garde exactement sa forme).
  function avecThematiques(o, liste) {
    var th = thematiquesValides(liste);
    if (th.length) o.thematiques = th;
    return o;
  }

  function normaliserCarte(c) {
    if (!estObjet(c)) return null;
    return avecThematiques({
      titre: chaine(c.titre), source: chaine(c.source), axe: chaine(c.axe),
      rarete: IDS_RARETE.indexOf(c.rarete) !== -1 ? c.rarete : 'mie',
      fraicheur: FRAICHEURS.indexOf(c.fraicheur) !== -1 ? c.fraicheur : '',
      vue: chaine(c.vue), cuite: chaine(c.cuite), gain: entier(c.gain)
    }, c.thematiques);
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
    // Lot 35 : lectures comptées, titres obtenus (plus haut palier et sa date), titre affiché sous le prénom.
    r.lectures = {};
    if (estObjet(o.lectures)) {
      Object.keys(o.lectures).forEach(function (ref) {
        var l = o.lectures[ref];
        if (estObjet(l) && chaine(l.jour)) r.lectures[ref] = { jour: l.jour, thematiques: thematiquesValides(l.thematiques) };
      });
    }
    r.titres = {};
    if (estObjet(o.titres)) {
      Object.keys(o.titres).forEach(function (id) {
        var t = o.titres[id];
        var p = estObjet(t) ? Math.min(entier(t.palier), PALIERS.length) : 0;
        if (PAR_ID[id] && p >= 2) r.titres[id] = { palier: p, depuis: chaine(t.depuis) };
      });
    }
    r.titreAffiche = typeof o.titreAffiche === 'string' && PAR_ID[o.titreAffiche] ? o.titreAffiche : '';
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
    return avecThematiques({ titre: chaine(a.titre), source: chaine(a.source), axe: chaine(a.axe), rarete: aDesNotes(a) ? rarete(a).id : 'mie', fraicheur: fraicheur(a), vue: date, cuite: '', gain: 0 }, a.thematiques);
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
    return { gain: 0, dejaCuite: false, avant: n, apres: n, monte: false, points: c.points, nouveauxTitres: [] };
  }

  // Carte connue sans thématique (lot 34) : elle prend celles de l'article, s'il en a.
  function completerThematiques(carte, a) {
    if (!carte.thematiques) avecThematiques(carte, a.thematiques);
    return carte.thematiques || [];
  }

  // Publication confirmée au fournil : la carte de même ref cuit, une seule fois.
  // Lot 35 : le gain est aussi crédité à chaque thématique de la carte ; nouveauxTitres liste les paliers franchis.
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
    var nouveaux = majTitres(c, date, completerThematiques(carte, a));
    var g = gagner(storage, cle, c, carte.gain);
    g.nouveauxTitres = nouveaux;
    return g;
  }

  /* ---------- Titres par thématique (lot 35) ---------- */

  // Points par thématique, jamais stockés : recalculés depuis les cartes cuites (gain) et les lectures.
  function pointsParThematique(compte) {
    var p = {};
    THEMATIQUES.forEach(function (t) { p[t.id] = 0; });
    var c = estObjet(compte) ? compte : {};
    function crediter(liste, n) { thematiquesValides(liste).forEach(function (l) { p[PAR_NOM[l].id] += n; }); }
    var cartes = estObjet(c.cartes) ? c.cartes : {};
    Object.keys(cartes).forEach(function (ref) {
      var k = cartes[ref];
      if (estObjet(k) && k.cuite) crediter(k.thematiques, entier(k.gain));
    });
    var lectures = estObjet(c.lectures) ? c.lectures : {};
    Object.keys(lectures).forEach(function (ref) { if (estObjet(lectures[ref])) crediter(lectures[ref].thematiques, POINTS.lecture); });
    return p;
  }

  // Palier atteint pour un nombre de points ; minimum : palier déjà obtenu (un titre ne se perd jamais).
  function palier(points, minimum) {
    var p = entier(Number(points));
    var i = PALIERS.length - 1;
    while (i > 0 && p < PALIERS[i].min) i--;
    i = Math.max(i, Math.min(entier(minimum), PALIERS.length) - 1);
    var s = PALIERS[i + 1] || null;
    var pct = s ? Math.round(Math.max(0, p - PALIERS[i].min) * 100 / (s.min - PALIERS[i].min)) : 100;
    return { palier: i + 1, id: PALIERS[i].id, points: p, suivant: s ? s.id : null, reste: s ? Math.max(0, s.min - p) : 0, pct: Math.min(100, pct) };
  }

  // Enregistre la date du premier passage de chaque palier ; renvoie ceux des thématiques concernées.
  function majTitres(c, date, concernees) {
    var pts = pointsParThematique(c);
    var nouveaux = [];
    THEMATIQUES.forEach(function (t) {
      var avant = c.titres[t.id] ? c.titres[t.id].palier : 1;
      var n = palier(pts[t.id]).palier;
      if (n <= avant) return;
      c.titres[t.id] = { palier: n, depuis: date };
      if (concernees.indexOf(t.libelle) !== -1) nouveaux.push({ thematique: t.id, palier: n });
    });
    return nouveaux;
  }

  function nomTitre(id, n, lang) {
    var t = PAR_ID[id];
    if (!t || !(n >= 2)) return '';
    var x = textes(lang);
    return x.paliers[PALIERS[Math.min(n, PALIERS.length) - 1].id] + ' · ' + t[lang === 'en' ? 'en' : 'fr'];
  }

  function nomsThematiques(liste, lang) {
    var noms = thematiquesValides(liste).map(function (l) { return PAR_NOM[l][lang === 'en' ? 'en' : 'fr']; });
    if (noms.length < 2) return noms.join('');
    return noms.slice(0, -1).join(', ') + textes(lang).et + noms[noms.length - 1];
  }

  // Les 12 thématiques avec leur palier, dans l'ordre du questionnaire. titre : vide sous Analyste.
  function titres(compte, lang) {
    var c = normaliser(compte);
    var pts = pointsParThematique(c);
    var x = textes(lang);
    return THEMATIQUES.map(function (t) {
      var obtenu = c.titres[t.id];
      var pa = palier(pts[t.id], obtenu ? obtenu.palier : 1);
      var cuites = Object.keys(c.cartes).filter(function (ref) {
        var k = c.cartes[ref];
        return k.cuite && (k.thematiques || []).indexOf(t.libelle) !== -1;
      }).length;
      return {
        id: t.id, libelle: t.libelle, nom: t[lang === 'en' ? 'en' : 'fr'], points: pts[t.id],
        palier: pa.palier, idPalier: pa.id, nomPalier: x.paliers[pa.id], titre: nomTitre(t.id, pa.palier, lang), obtenu: pa.palier >= 2,
        suivant: pa.suivant, nomSuivant: pa.suivant ? x.paliers[pa.suivant] : '', reste: pa.reste, pct: pa.pct,
        cuites: cuites, depuis: obtenu ? obtenu.depuis : '', slug: pa.palier >= 2 ? slugTitre(t.id, pa.palier) : ''
      };
    });
  }

  function lecturesDuJour(c, date) {
    return Object.keys(c.lectures).filter(function (ref) { return c.lectures[ref].jour === date; }).length;
  }

  // « Lire la source » : carte découverte, jeu actif, une fois par article, LECTURES_PAR_JOUR par jour au plus.
  // Ajoute POINTS.lecture au total et les crédite aux thématiques de l'article (ou, à défaut, de sa carte).
  // raison : 'coupe', 'inconnue' (carte pas découverte), 'dejaLue', 'plafond' quand rien n'est compté.
  function lire(storage, cle, article, maintenant) {
    var c = lireCompte(storage, cle, maintenant);
    var a = article || {};
    var n = niveauDe(c);
    var r = { ok: false, gain: 0, raison: '', thematiques: [], nouveauxTitres: [], avant: n, apres: n, monte: false, points: c.points };
    if (!cle || !c.actif) { r.raison = 'coupe'; return r; }
    var carte = typeof a.ref === 'string' && a.ref && Object.prototype.hasOwnProperty.call(c.cartes, a.ref) ? c.cartes[a.ref] : null;
    if (!carte) { r.raison = 'inconnue'; return r; }
    if (c.lectures[a.ref]) { r.raison = 'dejaLue'; return r; }
    var date = dateDuJour(maintenant);
    if (lecturesDuJour(c, date) >= LECTURES_PAR_JOUR) { r.raison = 'plafond'; return r; }
    var th = thematiquesValides(a.thematiques);
    if (!th.length) th = (carte.thematiques || []).slice();
    completerThematiques(carte, a);
    c.lectures[a.ref] = { jour: date, thematiques: th };
    r.thematiques = th;
    r.nouveauxTitres = majTitres(c, date, th);
    var avant = niveau(c.points);
    c.points += POINTS.lecture;
    var apres = niveau(c.points);
    r.ok = ecrire(storage, cle, c);
    r.gain = POINTS.lecture;
    r.points = c.points;
    r.apres = apres.id;
    r.monte = apres.index > avant.index;
    return r;
  }

  function messageTitres(r, lang) {
    var t = textes(lang);
    return ((r && r.nouveauxTitres) || []).map(function (x) { return ' ' + remplir(t.nouveauTitre, { titre: nomTitre(x.thematique, x.palier, lang) }); }).join('');
  }

  function messageLecture(r, lang) {
    if (!r || !r.gain) return '';
    var t = textes(lang);
    var noms = nomsThematiques(r.thematiques, lang);
    return remplir(noms ? t.lecture : t.lectureSans, { n: r.gain, thematiques: noms }) +
      (r.monte ? ' ' + remplir(t.nouveauNiveau, { niveau: t.niveaux[r.apres] }) : '') + messageTitres(r, lang);
  }

  // Titre affiché sous le prénom, choisi dans la vitrine : un titre obtenu (Analyste au moins), ou '' (le métier).
  function choisirTitre(storage, cle, id, maintenant) {
    if (!cle) return false;
    var c = lireCompte(storage, cle, maintenant);
    var v = typeof id === 'string' ? id : '';
    if (v && !titres(c).some(function (t) { return t.id === v && t.obtenu; })) return false;
    c.titreAffiche = v;
    return ecrire(storage, cle, c);
  }

  function titreAffiche(compte, lang) {
    if (!compte || compte.actif === false || !compte.titreAffiche) return '';
    var t = titres(compte, lang).filter(function (x) { return x.id === compte.titreAffiche; })[0];
    return t && t.obtenu ? t.titre : '';
  }

  /* ---------- Partage (phase 1 : pages statiques génériques /titres/<thematique>-<palier>) ---------- */

  function slugTitre(id, n) { return PAR_ID[id] && n >= 2 && n <= PALIERS.length ? id + '-' + PALIERS[n - 1].id : ''; }

  function lireSlug(slug) {
    var s = typeof slug === 'string' ? slug : '';
    for (var i = 1; i < PALIERS.length; i++) {
      var fin = '-' + PALIERS[i].id;
      if (s.length > fin.length && s.slice(-fin.length) === fin && PAR_ID[s.slice(0, -fin.length)]) return { thematique: s.slice(0, -fin.length), palier: i + 1 };
    }
    return null;
  }

  // 12 thématiques × 4 paliers partageables (Analyste à Visionnaire).
  function pagesTitres() {
    var r = [];
    THEMATIQUES.forEach(function (t) {
      for (var n = 2; n <= PALIERS.length; n++) r.push({ slug: slugTitre(t.id, n), thematique: t.id, palier: n });
    });
    return r;
  }

  function lienPartage(slug, base) {
    var url = String(base || '').replace(/\/+$/, '') + '/titres/' + slug;
    return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
  }

  // Sujet du fournil pour « Rédiger l'annonce » : seulement un titre obtenu, jeu actif.
  function sujetTitre(compte, slug, lang) {
    var s = lireSlug(slug);
    if (!s || !compte || compte.actif === false) return null;
    var t = titres(compte, lang).filter(function (x) { return x.id === s.thematique; })[0];
    if (!t || t.palier < s.palier) return null;
    return { ref: 'titre-' + slug, titre: nomTitre(s.thematique, s.palier, lang), source: 'Votre pAIn quotidien', annonceTitre: slug };
  }

  // Brouillon d'annonce, dans la langue du post. Ton inconnu : expert.
  function annonceTitre(slug, ton, langue) {
    var s = lireSlug(slug);
    if (!s) return '';
    var gab = textes(langue).annonceTitre;
    return remplir(gab[ton] || gab.expert, { titre: nomTitre(s.thematique, s.palier, langue), thematique: PAR_ID[s.thematique][langue === 'en' ? 'en' : 'fr'] });
  }

  function estCuite(compte, ref) { return !!(compte && compte.cartes && compte.cartes[ref] && compte.cartes[ref].cuite); }

  function copieCarte(ref, c) {
    return avecThematiques({ ref: ref, titre: c.titre, source: c.source, axe: c.axe, rarete: c.rarete, fraicheur: c.fraicheur, vue: c.vue, cuite: c.cuite, gain: c.gain }, c.thematiques);
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
    return remplir(t.cuisson, { gain: r.gain }) + (r.monte ? ' ' + remplir(t.nouveauNiveau, { niveau: t.niveaux[r.apres] }) : '') + messageTitres(r, lang);
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
    collection: collection, historique: historique, libelleSerie: libelleSerie, resume: resume, messageCuisson: messageCuisson,
    // Lot 35 : titres par thématique et vitrine.
    THEMATIQUES: THEMATIQUES, PALIERS: PALIERS, LECTURES_PAR_JOUR: LECTURES_PAR_JOUR,
    thematiquesValides: thematiquesValides, pointsParThematique: pointsParThematique, palier: palier, titres: titres,
    nomTitre: nomTitre, nomsThematiques: nomsThematiques, lire: lire, messageLecture: messageLecture,
    choisirTitre: choisirTitre, titreAffiche: titreAffiche,
    slugTitre: slugTitre, lireSlug: lireSlug, pagesTitres: pagesTitres, lienPartage: lienPartage,
    sujetTitre: sujetTitre, annonceTitre: annonceTitre
  };

  if (typeof module === 'object' && module.exports) module.exports = Jeu;
  else root.Jeu = Jeu;
})(this);
