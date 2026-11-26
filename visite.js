/* Lots 28 et 29 : visite guidée d'onboarding. Miette guide, un projecteur éclaire un élément à la fois,
   la visite traverse cinq pages (comptoir, fournée, garde-manger, fournil, profil).
   Logique pure (étapes, suivant/précédent, sauts, compteur, mémoire, placement) testée sous Node ;
   partie DOM dans le navigateur, reprise après chaque « pq:rendu » de boot.js.
   Mémoire en localStorage « pq-visite » = { version: 1, comptes: { [clé]: { vue, reportee } },
   encours: { compte, index, sens, sautees } | null }, clé de compte comme theme.js. */
(function (root) {
  var CLE = 'pq-visite';

  var CHEMINS = { comptoir: '/comptoir', fournee: '/fournee', 'garde-manger': '/garde-manger', fournil: '/fournil', profil: '/profil' };

  // cible : valeur de data-visite sur la page, ou sélecteur propre (selecteur) quand la cible vient d'une liste.
  // Lot 29 : une fenêtre d'accueil hors compteur, puis huit étapes au plus.
  var ETAPES = [
    { id: 'accueil', page: 'comptoir', cible: null, accueil: true },
    // Lot 30 : sur desktop, le projecteur entoure le seul bloc de liens (pas la marque ni la langue).
    { id: 'menu', page: 'comptoir', cible: 'menu', selecteur: '[data-visite="menu"] [data-nav-liens]', menu: true },
    // avec : seconde cible éclairée avec la première (un seul projecteur englobant les deux).
    { id: 'comptoir', page: 'comptoir', cible: 'indicateurs', avec: 'graphique' },
    // action : étape à faire (cliquer sur la cible) ; lot 30 : « Suivant » fait le même clic.
    { id: 'four', page: 'comptoir', cible: 'four', action: true },
    { id: 'fournee', page: 'fournee', cible: 'grille' },
    // Deuxième étape à faire : « Pétrir un post » du n°1 ouvre le fournil sur cette news.
    { id: 'petrir', page: 'fournee', cible: 'petrir', selecteur: '[data-bento] [data-tile="n1"] a[data-act="knead"], [data-cartes] [data-id="n1"] a[data-act="knead"]', action: true },
    // amorce : sans sujet choisi (étape Pétrir sautée), le fournil montre la liste de choix ; la visite suit
    // alors le premier lien « Pétrir » (une fois, sans ?ref= déjà présent) pour montrer un vrai brouillon.
    { id: 'fournil', page: 'fournil', cible: 'brouillon', amorce: 'section[aria-labelledby="choix-t"] a.btn-petrir' },
    // Garde-manger : data-visite="garde" sur la liste et sur l'état vide, il est expliqué dans les deux cas.
    { id: 'garde', page: 'garde-manger', cible: 'garde' },
    // Profil : la carte « Revoir la visite » ; le texte résume les autres cartes.
    { id: 'profil', page: 'profil', cible: 'profil' }
  ];

  var TEXTES = {
    fr: {
      ui: {
        compteur: '{n} sur {total}', suivant: 'Suivant', precedent: 'Précédent', passer: 'Passer la visite',
        terminer: 'Terminer', parti: 'C’est parti', plusTard: 'Plus tard'
      },
      etapes: {
        accueil: { titre: 'Salut, moi c’est Miette', texte: 'Je te fais découvrir l’application ?' },
        menu: { titre: 'Au menu', texte: 'Tous les outils de ta boulangerie réunis : du comptoir à ton profil.' },
        comptoir: { titre: 'Tes chiffres du matin', texte: 'Impressions, réactions, contacts : un coup d’œil suffit pour savoir si ta pâte lève. En dessous : ton graphique montre tes posts qui ont le mieux levé.' },
        four: { titre: 'Le four', texte: 'La news n°1 du jour t’attend au chaud. Ouvre le four avec « Suivant » ou d’un clic sur « Voir ma fournée ».' },
        fournee: { titre: 'La fournée du jour', texte: 'Tes articles du jour, étiquetés Tout chaud, À pétrir ou Rassis, avec le n°1 tout doré et ses jauges. Le bouton « Personnaliser » arrange ta vitrine à ta façon.' },
        petrir: { titre: 'À toi de pétrir', texte: 'Sur chaque news, tu peux lire la source, la mettre de côté ou l’écarter. Avec « Suivant » ou d’un clic sur « Pétrir un post », l’IA te prépare un brouillon au fournil.' },
        fournil: { titre: 'Le fournil, ton atelier à posts', texte: 'L’IA a créé un premier brouillon LinkedIn avec ton sujet : choisis le ton, retouche le texte, puis clique sur « Valider et publier sur LinkedIn » quand il te plaît.' },
        garde: { titre: 'Le garde-manger', texte: 'Une news mise de côté depuis la fournée t’attend ici, au frais. Tu la pétris quand tu as le temps.' },
        profil: { titre: 'Ton profil', texte: 'Tes préférences choisissent ta fournée, l’apparence règle thèmes et animations, et la boîte à retours nous aide à mieux viser. Tu peux revoir cette visite à tout moment depuis ton profil.' }
      }
    },
    en: {
      ui: {
        compteur: '{n} of {total}', suivant: 'Next', precedent: 'Back', passer: 'Skip the tour',
        terminer: 'Finish', parti: 'Let’s go', plusTard: 'Later'
      },
      etapes: {
        accueil: { titre: 'Hi, I’m Miette', texte: 'Shall I show you around the app?' },
        menu: { titre: 'On the menu', texte: 'All your bakery tools in one place: from the counter to your profile.' },
        comptoir: { titre: 'Your morning numbers', texte: 'Impressions, reactions, contacts: one glance tells you whether your dough is rising. Below: your chart shows the posts that rose the best.' },
        four: { titre: 'The oven', texte: 'Today’s top story is waiting, still warm. Open the oven with “Next” or a click on “See my batch”.' },
        fournee: { titre: 'Today’s batch', texte: 'Your articles of the day, labelled Piping hot, Needs kneading or Gone stale, with the golden number 1 and its gauges. The “Customise” button arranges your shop window your way.' },
        petrir: { titre: 'Your turn to knead', texte: 'On every story, you can read the source, save it for later or skip it. With “Next” or a click on “Knead a post”, the AI prepares a draft in the kitchen.' },
        fournil: { titre: 'The kitchen, your post workshop', texte: 'The AI created a first LinkedIn draft from your topic: pick the tone, edit the text, then click “Confirm and post to LinkedIn” when you like it.' },
        garde: { titre: 'The pantry', texte: 'A story saved from your batch waits here, kept cool. Knead it whenever you have time.' },
        profil: { titre: 'Your profile', texte: 'Your preferences pick your batch, appearance sets themes and animations, and the feedback box helps us aim better. You can replay this tour anytime from your profile.' }
      }
    }
  };

  function estObjet(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }

  /* ---------- Parcours ---------- */

  // Part de « depart » dans le sens donné : étape affichable de la page, page à ouvrir, ou fin.
  // passees : étapes franchies parce que leur cible est absente, pour le compteur.
  function aller(etapes, depart, sens, page, visible) {
    var j = depart;
    var s = sens < 0 ? -1 : 1;
    var passees = [];
    for (;;) {
      if (j >= etapes.length) return { fin: true, passees: passees };
      if (j < 0) { j = 0; s = 1; continue; }
      var e = etapes[j];
      if (e.page !== page) return { naviguer: e.page, index: j, passees: passees };
      if (visible(e)) return { index: j, passees: passees };
      passees.push(e.id);
      j += s;
    }
  }

  // Étapes sautées : seules celles réellement franchies comptent, l'étape montrée en sort. On ne mesure
  // jamais toute une page d'avance : ses données peuvent arriver après (bug « 6 sur 13 » au retour).
  function noterSauts(sautees, passees, montree) {
    var r = [];
    (sautees || []).concat(passees || []).forEach(function (id) {
      if (id !== montree && r.indexOf(id) === -1) r.push(id);
    });
    return r;
  }

  // L'accueil n'est pas compté : « 1 sur 8 » est la première vraie étape.
  function compteur(etapes, index, sautees) {
    var garde = function (e) { return !e.accueil && (sautees || []).indexOf(e.id) === -1; };
    return { numero: etapes.slice(0, index + 1).filter(garde).length, total: etapes.filter(garde).length };
  }

  // Étape à faire (clic sur la cible) : la page suivante reprendra à l'étape d'après.
  function apresAction(etapes, index, sautees) {
    return { index: Math.min(index + 1, etapes.length - 1), sens: 1, sautees: (sautees || []).slice() };
  }

  // Boutons de la bulle dans l'ordre du DOM, qui est aussi l'ordre visuel et l'ordre du focus :
  // le lien discret à gauche (ou au-dessus sur mobile), puis Précédent et l'action principale à droite.
  // Lot 30 : les étapes à faire ont aussi leur bouton Suivant.
  function boutons(e, o) {
    if (e.accueil) return ['plustard', 'suivant'];
    var r = ['passer'];
    // Première étape comptée : pas de retour vers la fenêtre d'accueil.
    if (o.numero > 1) r.push('precedent');
    r.push(o.dernier ? 'terminer' : 'suivant');
    return r;
  }

  // Lot 30 : halo clair autour de la cible (jeton de charte.css par thème) et opacité du voile.
  // Le halo garde au moins 3:1 contre le voile posé sur la surface la plus claire (tests/visite.test.js).
  var HALO = { bronze: 'or-haut', classique: 'or-haut', nuit: 'panneau-or', contraste: 'creme' };
  var VOILE = { bronze: 0.62, classique: 0.62, nuit: 0.74, contraste: 0.74 };

  // Typographie française à l'affichage : « et » restent collés au mot, : ; ? ! à la fin du mot qui précède.
  function insecables(s) {
    return String(s).replace(/« /g, '« ').replace(/ ([»:;?!])/g, ' $1');
  }

  // Lot 31 : progression sur une baguette. Une grigne par étape comptée (en % de la largeur, marges
  // pour que Miette ne déborde pas), Miette posée sur la grigne courante, mie dorée jusqu'à elle.
  function piste(numero, total) {
    var n = Math.max(1, total | 0);
    var k = Math.min(Math.max(1, numero | 0), n);
    var MARGE = 7;
    var grignes = [];
    for (var i = 0; i < n; i++) grignes.push(n === 1 ? 50 : Math.round((MARGE + i * (100 - 2 * MARGE) / (n - 1)) * 100) / 100);
    return { grignes: grignes, miette: grignes[k - 1], doree: grignes[k - 1] };
  }

  function formater(modele, c) { return modele.replace('{n}', c.numero).replace('{total}', c.total); }

  /* ---------- Mémoire ---------- */

  function etat(storage) {
    try {
      var raw = JSON.parse(storage.getItem(CLE));
      if (raw && raw.version === 1 && estObjet(raw.comptes)) return { version: 1, comptes: raw.comptes, encours: estObjet(raw.encours) ? raw.encours : null };
    } catch (err) {}
    return { version: 1, comptes: {}, encours: null };
  }

  function ecrire(storage, e) {
    try { storage.setItem(CLE, JSON.stringify(e)); return true; } catch (err) { return false; }
  }

  function lireCompte(storage, cle) {
    var c = cle ? etat(storage).comptes[cle] : null;
    if (!estObjet(c)) return { vue: false, reportee: null };
    return { vue: c.vue === true, reportee: typeof c.reportee === 'string' ? c.reportee : null };
  }

  function modifierCompte(storage, cle, champs) {
    if (!cle) return false;
    var e = etat(storage);
    var c = lireCompte(storage, cle);
    Object.keys(champs).forEach(function (k) { c[k] = champs[k]; });
    e.comptes[cle] = c;
    return ecrire(storage, e);
  }

  function marquerVue(storage, cle) { return modifierCompte(storage, cle, { vue: true }); }
  // « Plus tard » : rien n'est marqué comme vu, la visite revient à la prochaine connexion.
  function reporter(storage, cle, marqueur) { return modifierCompte(storage, cle, { reportee: String(marqueur || '') }); }

  function doitLancer(c, marqueur) { return !c.vue && c.reportee !== String(marqueur || ''); }

  function encoursValide(v) {
    return estObjet(v) && typeof v.index === 'number' && Math.floor(v.index) === v.index && v.index >= 0 && v.index < ETAPES.length &&
      (v.sens === 1 || v.sens === -1) && Array.isArray(v.sautees) && v.sautees.every(function (s) { return typeof s === 'string'; });
  }

  function poserEncours(storage, cle, v) {
    if (!cle) return false;
    var e = etat(storage);
    e.encours = { compte: cle, index: v.index, sens: v.sens, sautees: v.sautees };
    return ecrire(storage, e);
  }

  function lireEncours(storage, cle) {
    var v = etat(storage).encours;
    if (!cle || !v || v.compte !== cle || !encoursValide(v)) return null;
    return { index: v.index, sens: v.sens, sautees: v.sautees.slice() };
  }

  function effacerEncours(storage) {
    var e = etat(storage);
    if (!e.encours) return true;
    e.encours = null;
    return ecrire(storage, e);
  }

  // Repère de la session de connexion : la visite reportée revient quand il change.
  function marqueurSession(storage) {
    try {
      var a = JSON.parse(storage.getItem('pq-auth'));
      if (a && a.session && a.session.depuis) return String(a.session.depuis);
    } catch (err) {}
    try {
      var r = JSON.parse(storage.getItem('pq-auth-reel'));
      if (r && r.session && r.session.user && r.session.user.last_sign_in_at) return String(r.session.user.last_sign_in_at);
    } catch (err) {}
    return '';
  }

  /* ---------- Placement de la bulle (desktop) ---------- */

  var MARGE = 16, ECART = 14;
  function borner(v, min, max) { return Math.max(min, Math.min(v, max)); }

  // r : boîte de la cible (x, y, l, h) dans la fenêtre, ou null ; b : taille de la bulle ; vue : fenêtre.
  function placer(r, b, vue) {
    var maxX = Math.max(MARGE, vue.l - MARGE - b.l), maxY = Math.max(MARGE, vue.h - MARGE - b.h);
    if (!r) return { x: borner((vue.l - b.l) / 2, MARGE, maxX), y: borner((vue.h - b.h) / 2, MARGE, maxY), cote: 'centre' };
    var cotes = [
      { cote: 'droite', ok: r.x + r.l + ECART + b.l <= vue.l - MARGE, x: r.x + r.l + ECART, y: r.y },
      { cote: 'gauche', ok: r.x - ECART - b.l >= MARGE, x: r.x - ECART - b.l, y: r.y },
      { cote: 'dessous', ok: r.y + r.h + ECART + b.h <= vue.h - MARGE, x: r.x, y: r.y + r.h + ECART },
      { cote: 'dessus', ok: r.y - ECART - b.h >= MARGE, x: r.x, y: r.y - ECART - b.h }
    ];
    for (var i = 0; i < cotes.length; i++) {
      if (cotes[i].ok) return { x: borner(cotes[i].x, MARGE, maxX), y: borner(cotes[i].y, MARGE, maxY), cote: cotes[i].cote };
    }
    // Cible plus grande que l'écran : la bulle se pose dans le coin bas droit, par-dessus.
    return { x: maxX, y: maxY, cote: 'coin' };
  }

  var Visite = {
    CLE: CLE, CHEMINS: CHEMINS, ETAPES: ETAPES, TEXTES: TEXTES,
    HALO: HALO, VOILE: VOILE, boutons: boutons, insecables: insecables, piste: piste,
    aller: aller, apresAction: apresAction, noterSauts: noterSauts, compteur: compteur, formater: formater,
    lireCompte: lireCompte, marquerVue: marquerVue, reporter: reporter, doitLancer: doitLancer,
    poserEncours: poserEncours, lireEncours: lireEncours, effacerEncours: effacerEncours,
    marqueurSession: marqueurSession, placer: placer
  };

  if (typeof module === 'object' && module.exports) { module.exports = Visite; return; }
  root.Visite = Visite;

  /* ---------- Navigateur ---------- */

  var doc = root.document;
  var ls = root.localStorage;
  var MOBILE = '(max-width: 899.98px)';
  var CLE_FOURNIL = 'pq-visite-fournil';

  // Miette, dessin d'Abdou (index.html) repris tel quel ; décoratif dans la bulle.
  var MIETTE = '<svg class="miette" viewBox="0 0 120 120" aria-hidden="true" focusable="false">' +
    '<path class="miette-membre" d="M14 76c-9-3-13-12-9-20M106 82c6 3 9 8 8 13M44 100v8M76 100v8"></path>' +
    '<path class="miette-mie" d="M14 78c0-30 20-52 46-52s46 22 46 52c0 14-10 22-24 22H38c-14 0-24-8-24-22z"></path>' +
    '<path class="miette-grigne" d="M40 42l8 12M58 36l8 12M76 42l8 12"></path>' +
    '<circle class="miette-trait" cx="48" cy="74" r="4.5"></circle><circle class="miette-trait" cx="72" cy="74" r="4.5"></circle>' +
    '<path class="miette-sourire" d="M52 84q8 7 16 0"></path>' +
    '<circle class="miette-joue" cx="39" cy="84" r="5"></circle><circle class="miette-joue" cx="81" cy="84" r="5"></circle></svg>';

  var CSS =
    '.pq-visite-voile{position:fixed;inset:0;z-index:1000;background:transparent}' +
    '.pq-visite-voile[data-plein]{background:var(--pq-voile)}' +
    // Voile teinté de la charte (--ombre-teinte de chaque thème), un peu plus dense que celui des modales,
    // et halo clair du lot 30 (HALO, VOILE).
    Object.keys(HALO).map(function (th) {
      return (th === 'bronze' ? ':root,' : '') + '[data-theme="' + th + '"]{--pq-halo:var(--' + HALO[th] + ');' +
        '--pq-voile:color-mix(in srgb,var(--ombre-teinte) ' + Math.round(VOILE[th] * 100) + '%,transparent)}';
    }).join('') +
    // Liseré braise contre la cible, anneau clair plein autour, puis le voile. Pas de flou : un dégradé
    // éclaircirait le voile au bord de l'anneau et casserait le 3:1.
    '.pq-visite-trou{position:fixed;z-index:1001;border-radius:14px;pointer-events:none;box-shadow:0 0 0 8px var(--pq-halo),0 0 0 200vmax var(--pq-voile);outline:3px solid var(--braise);outline-offset:0;' +
    'transition:left .22s ease,top .22s ease,width .22s ease,height .22s ease}' +
    '.pq-visite-trou[hidden]{display:none}' +
    '.pq-visite-bulle{position:fixed;z-index:1002;box-sizing:border-box;width:min(400px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;' +
    'padding:18px 18px 14px;border-radius:18px;background:var(--creme);color:var(--texte);border:1.5px solid var(--bord-fort);box-shadow:var(--ombre-3);' +
    'font-family:"DM Sans", system-ui, sans-serif;display:flex;flex-direction:column;gap:8px;transition:opacity .18s ease}' +
    '.pq-visite-bulle[data-cache]{opacity:0}' +
    '.pq-visite-tete{display:flex;align-items:center;gap:10px}' +
    '.pq-visite-bulle .miette{display:block;width:52px;height:auto;flex:none;overflow:visible}' +
    '.pq-visite-bulle[data-accueil] .pq-visite-tete{flex-direction:column;align-items:center;text-align:center}' +
    // Accueil (lot 29) : petite fenêtre sans compteur, plus étroite que les bulles d'étape.
    '.pq-visite-bulle[data-accueil]{width:min(300px,calc(100vw - 32px));padding:16px 16px 12px;gap:6px}' +
    '.pq-visite-bulle[data-accueil] .miette{width:72px}' +
    '.pq-visite-bulle[data-accueil] .pq-visite-titre{font-size:18px}' +
    '.pq-visite-bulle .miette-membre{fill:none;stroke:var(--pain-bas);stroke-width:5;stroke-linecap:round}' +
    '.pq-visite-bulle .miette-mie{fill:var(--pain-haut);stroke:var(--pain-bas);stroke-width:3}' +
    '.pq-visite-bulle .miette-grigne{fill:none;stroke:var(--pain-grigne);stroke-width:5;stroke-linecap:round}' +
    '.pq-visite-bulle .miette-trait{fill:var(--pain-texte)}' +
    '.pq-visite-bulle .miette-sourire{fill:none;stroke:var(--pain-texte);stroke-width:3;stroke-linecap:round}' +
    '.pq-visite-bulle .miette-joue{fill:color-mix(in srgb,var(--braise-vive) 45%,transparent)}' +
    '.pq-visite-compteur{margin:0;font-size:13px;font-weight:700;color:var(--texte-2)}' +
    // Lot 31 : baguette de progression. Pâte claire à venir, croûte dorée parcourue, Miette posée dessus.
    '.pq-visite-piste{position:relative;flex:1 1 auto;min-width:0;height:50px}' +
    '.pq-visite-baguette{position:absolute;left:0;right:0;bottom:2px;height:14px;border-radius:999px;overflow:hidden;' +
    'background:var(--or-haut);border:1.5px solid var(--pain-bas);box-sizing:border-box}' +
    '.pq-visite-doree{position:absolute;left:0;top:0;bottom:0;background:var(--pain-bas);border-radius:999px 0 0 999px;transition:width .45s ease}' +
    '.pq-visite-grigne{position:absolute;top:2px;width:4px;height:7px;margin-left:-2px;border-radius:2px;transform:skewX(-25deg);background:var(--pain-bas);opacity:.45}' +
    '.pq-visite-grigne[data-faite],.pq-visite-grigne[data-courante]{background:var(--pain-grigne);opacity:1}' +
    '.pq-visite-pas{position:absolute;bottom:10px;width:38px;margin-left:-19px;transition:left .45s cubic-bezier(.3,1.4,.6,1)}' +
    '.pq-visite-bulle .pq-visite-pas .miette{width:38px}' +
    '.pq-visite-titre{margin:0;font-family:Fraunces, Georgia, serif;font-size:20px;line-height:1.2;font-weight:800;color:var(--texte)}' +
    '.pq-visite-bulle[data-accueil] .pq-visite-titre,.pq-visite-bulle[data-accueil] .pq-visite-texte{text-align:center}' +
    '.pq-visite-texte{margin:0;font-size:15px;line-height:1.45;color:var(--texte)}' +
    // Une rangée : lien discret à gauche, Précédent et Suivant groupés à droite. Si la place manque (mobile),
    // le groupe passe dessous d'un seul tenant et le lien reste au-dessus.
    '.pq-visite-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin-top:6px}' +
    '.pq-visite-groupe{display:flex;flex-wrap:nowrap;gap:8px;margin-left:auto}' +
    '.pq-visite-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:0 16px;border-radius:999px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;' +
    'border:1.5px solid var(--brun);background:transparent;color:var(--brun-fonce)}' +
    '.pq-visite-btn[data-plein]{border-color:var(--braise);background:var(--braise);color:var(--sur-plein)}' +
    '.pq-visite-lien{display:inline-flex;align-items:center;min-height:44px;padding:0 4px;border:0;background:none;font:inherit;font-size:14px;font-weight:600;color:var(--brun);text-decoration:underline;cursor:pointer;white-space:nowrap}' +
    '.pq-visite-voile[data-action]{pointer-events:none}' +
    '.pq-visite-bulle button:focus-visible{outline:3px solid var(--braise);outline-offset:2px}' +
    '[data-theme="contraste"] .pq-visite-bulle{border-width:2px;border-color:var(--texte)}' +
    // Mobile : la bulle devient une feuille fixée en bas de l'écran.
    '@media ' + MOBILE + '{.pq-visite-bulle{left:0!important;right:0;top:auto!important;bottom:0;width:auto;max-height:55vh;border-radius:18px 18px 0 0;border-bottom:0;' +
    'padding:16px 16px calc(12px + env(safe-area-inset-bottom,0px))}.pq-visite-bulle .miette{width:44px}.pq-visite-bulle[data-accueil] .miette{width:60px}}' +
    // Aucune transition si les animations sont coupées (profil) ou si le système demande moins de mouvement.
    'html[data-animations="off"] .pq-visite-trou,html[data-animations="off"] .pq-visite-bulle,html[data-animations="off"] .pq-visite-pas,html[data-animations="off"] .pq-visite-doree{transition:none}' +
    '@media (prefers-reduced-motion:reduce){html:not([data-animations="on"]) .pq-visite-trou,html:not([data-animations="on"]) .pq-visite-bulle,' +
    'html:not([data-animations="on"]) .pq-visite-pas,html:not([data-animations="on"]) .pq-visite-doree{transition:none}}';

  var actif = false;     // visite affichée sur cette page
  var courant = null;    // { index, sens, sautees }
  var compte = null;
  var elems = null;      // { voile, trou, bulle }
  var dejaOuverte = false;
  var menuOuvert = false;
  var cadre = 0;
  var premierRendu = true;
  var derniereMiette = null; // position de Miette sur la baguette dans la bulle affichée (lot 31)

  function lang() { try { return root.__app.state.lang === 'en' ? 'en' : 'fr'; } catch (err) { return 'fr'; } }
  function t() { return TEXTES[lang()]; }
  function mobile() { return !!(root.matchMedia && root.matchMedia(MOBILE).matches); }

  function pageCourante() {
    var p = String(root.location.pathname || '').replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
    return Object.prototype.hasOwnProperty.call(CHEMINS, p) ? p : null;
  }

  function utilisateur() { try { return root.Auth.utilisateurCourant(); } catch (err) { return null; } }
  function cleDuCompte(u) {
    if (!u) return null;
    var email = typeof u.email === 'string' ? u.email.trim().toLowerCase() : '';
    if (email) return email;
    return typeof u.abonneId === 'string' && u.abonneId ? u.abonneId : null;
  }

  function selecteur(e) { return e.selecteur || '[data-visite="' + e.cible + '"]'; }

  function boiteVisible(el) {
    if (!el || !el.getClientRects().length) return false;
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    return root.getComputedStyle(el).visibility !== 'hidden';
  }

  function elementCible(e) {
    if (!e.cible) return null;
    if (e.menu && mobile()) return doc.getElementById('pq-nav-panneau');
    var liste = doc.querySelectorAll(selecteur(e));
    for (var i = 0; i < liste.length; i++) if (boiteVisible(liste[i])) return liste[i];
    return null;
  }

  function visible(e) {
    if (!e.cible) return true;
    // Le panneau du menu mobile est fermé tant que l'étape n'est pas affichée : on juge le bouton Menu.
    if (e.menu && mobile()) return boiteVisible(doc.querySelector('[data-nav-menu]'));
    return !!elementCible(e);
  }

  function ouvrirMenu(etat) {
    if (menuOuvert === etat) return;
    menuOuvert = etat;
    try { root.Nav.ouvrirMenu(etat); } catch (err) {}
  }

  /* ----- Fond inerte : Tab ne quitte jamais la bulle ----- */
  function aGarder(el) {
    if (elems && (el === elems.voile || el === elems.trou || el === elems.bulle)) return true;
    return el.id === 'pq-annonce' || el.id === 'pq-annonce-urgente' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE';
  }
  function marquer(el) {
    if (aGarder(el) || el.hasAttribute('inert')) return;
    el.setAttribute('inert', '');
    el.setAttribute('data-visite-inerte', '');
  }
  // sauf : cible d'une étape à faire. Seul le chemin qui y mène reste actif, ses voisins deviennent inertes
  // à chaque niveau ; la cible se clique et se tabule, le reste de la page non.
  function rendreInerte(oui, sauf) {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-visite-inerte]'), function (el) {
      el.removeAttribute('inert'); el.removeAttribute('data-visite-inerte');
    });
    if (!oui) return;
    if (!sauf) { Array.prototype.forEach.call(doc.body.children, marquer); return; }
    for (var n = sauf; n && n.parentElement && n !== doc.body; n = n.parentElement) {
      Array.prototype.forEach.call(n.parentElement.children, function (frere) { if (frere !== n) marquer(frere); });
    }
  }

  function creer() {
    if (elems) return;
    var voile = doc.createElement('div');
    voile.className = 'pq-visite-voile';
    var trou = doc.createElement('div');
    trou.className = 'pq-visite-trou';
    trou.setAttribute('aria-hidden', 'true');
    var bulle = doc.createElement('div');
    bulle.className = 'pq-visite-bulle';
    bulle.setAttribute('role', 'dialog');
    bulle.setAttribute('aria-modal', 'true');
    bulle.setAttribute('aria-labelledby', 'pq-visite-titre');
    bulle.setAttribute('aria-describedby', 'pq-visite-texte');
    // Les clics dans la bulle ne remontent pas : nav.js fermerait le menu mobile ouvert par l'étape.
    bulle.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var b = ev.target.closest ? ev.target.closest('[data-visite-act]') : null;
      if (b) agir(b.getAttribute('data-visite-act'));
    });
    doc.body.appendChild(voile);
    doc.body.appendChild(trou);
    doc.body.appendChild(bulle);
    elems = { voile: voile, trou: trou, bulle: bulle };
    doc.addEventListener('keydown', clavier, true);
    doc.addEventListener('click', clicCible, true);
    root.addEventListener('resize', planifier);
    root.addEventListener('scroll', planifier, true);
  }

  function detruire() {
    if (!elems) return;
    doc.removeEventListener('keydown', clavier, true);
    doc.removeEventListener('click', clicCible, true);
    root.removeEventListener('resize', planifier);
    root.removeEventListener('scroll', planifier, true);
    rendreInerte(false);
    ['voile', 'trou', 'bulle'].forEach(function (k) { if (elems[k].parentNode) elems[k].parentNode.removeChild(elems[k]); });
    elems = null;
  }

  function etapeAFaire() { return actif && courant && ETAPES[courant.index].action === true; }

  function clicCible(ev) {
    if (!etapeAFaire()) return;
    var el = elementCible(ETAPES[courant.index]);
    if (!el || !el.contains(ev.target)) return;
    // Le lien suit son cours (navigation normale) ; la page ouverte reprend à l'étape d'après.
    poserEncours(ls, compte, apresAction(ETAPES, courant.index, courant.sautees));
  }

  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function bouton(act, texte, plein) {
    return '<button type="button" class="pq-visite-btn" data-visite-act="' + act + '"' + (plein ? ' data-plein' : '') + '>' + esc(texte) + '</button>';
  }

  function remplir() {
    var e = ETAPES[courant.index];
    var x = t();
    var c = compteur(ETAPES, courant.index, courant.sautees);
    var accueil = e.accueil === true;
    var liste = boutons(e, { numero: c.numero, dernier: courant.index === ETAPES.length - 1 });
    var libelles = { plustard: x.ui.plusTard, passer: x.ui.passer, precedent: x.ui.precedent, suivant: accueil ? x.ui.parti : x.ui.suivant, terminer: x.ui.terminer };
    var actions = '<button type="button" class="pq-visite-lien" data-visite-act="' + liste[0] + '">' + esc(libelles[liste[0]]) + '</button>' +
      '<div class="pq-visite-groupe">' + liste.slice(1).map(function (a) { return bouton(a, libelles[a], a !== 'precedent'); }).join('') + '</div>';
    var b = elems.bulle;
    if (accueil) b.setAttribute('data-accueil', ''); else b.removeAttribute('data-accueil');
    // Étape à faire : la cible, hors de la bulle, reste cliquable et tabulable ; le reste de la page reste inerte.
    b.setAttribute('aria-modal', e.action ? 'false' : 'true');
    // Lot 31 : aux étapes, la petite Miette part de la grigne quittée (même bulle, ou étape d'avant
    // si l'on arrive d'une autre page) puis glisse vers la grigne courante.
    var p = accueil ? null : piste(c.numero, c.total);
    var depart = p && (derniereMiette != null ? derniereMiette : piste(c.numero - (courant.sens || 1), c.total).miette);
    derniereMiette = p ? p.miette : null;
    b.innerHTML = '<div class="pq-visite-tete">' + (accueil ? MIETTE : htmlPiste(p, depart) +
      '<p class="pq-visite-compteur">' + esc(formater(x.ui.compteur, c)) + '</p>') + '</div>' +
      '<h2 id="pq-visite-titre" class="pq-visite-titre">' + esc(insecables(x.etapes[e.id].titre)) + '</h2>' +
      '<p id="pq-visite-texte" class="pq-visite-texte">' + esc(insecables(x.etapes[e.id].texte)) + '</p>' +
      '<div class="pq-visite-actions">' + actions + '</div>';
    if (p && depart !== p.miette) glisser(b, p);
    return { c: c, e: e, x: x };
  }

  // Baguette décorative (le compteur texte dit la même chose) : grignes faites, courante, à venir.
  function htmlPiste(p, depart) {
    return '<div class="pq-visite-piste" aria-hidden="true"><div class="pq-visite-baguette">' +
      '<span class="pq-visite-doree" style="width:' + depart + '%"></span>' +
      p.grignes.map(function (g) {
        var etat = g < p.miette ? ' data-faite' : g === p.miette ? ' data-courante' : '';
        return '<i class="pq-visite-grigne" style="left:' + g + '%"' + etat + '></i>';
      }).join('') +
      '</div><span class="pq-visite-pas" style="left:' + depart + '%">' + MIETTE + '</span></div>';
  }

  // Deux images plus tard, la position de départ est peinte : la transition CSS fait le trajet.
  function glisser(b, p) {
    var raf = root.requestAnimationFrame || function (f) { return setTimeout(f, 16); };
    raf(function () {
      raf(function () {
        var pas = b.querySelector('.pq-visite-pas');
        var doree = b.querySelector('.pq-visite-doree');
        if (pas) pas.style.left = p.miette + '%';
        if (doree) doree.style.width = p.doree + '%';
      });
    });
  }

  // Boîte de la cible, agrandie à la cible « avec » de l'étape quand elle est affichée.
  function rectDe(el) {
    var r = el.getBoundingClientRect();
    var e = courant ? ETAPES[courant.index] : null;
    var a = e && e.avec ? doc.querySelector('[data-visite="' + e.avec + '"]') : null;
    if (!a || !boiteVisible(a)) return r;
    var s = a.getBoundingClientRect();
    var g = Math.min(r.left, s.left), h = Math.min(r.top, s.top), d = Math.max(r.right, s.right), b = Math.max(r.bottom, s.bottom);
    return { left: g, top: h, right: d, bottom: b, width: d - g, height: b - h };
  }

  function boiteDe(el) {
    var r = rectDe(el);
    var box = { x: r.left, y: r.top, l: r.width, h: r.height };
    if (ETAPES[courant.index].menu && mobile()) {
      // Menu mobile : la barre et son panneau ouvert ne font qu'une zone éclairée.
      var nav = doc.querySelector('[data-nav]');
      if (nav) {
        var n = nav.getBoundingClientRect();
        var bas = Math.max(r.bottom, n.bottom);
        box = { x: Math.min(r.left, n.left), y: Math.min(r.top, n.top), l: Math.max(r.right, n.right) - Math.min(r.left, n.left), h: bas - Math.min(r.top, n.top) };
      }
    }
    return box;
  }

  function positionner() {
    cadre = 0;
    if (!actif || !elems) return;
    var e = ETAPES[courant.index];
    var el = elementCible(e);
    var vue = { l: doc.documentElement.clientWidth, h: root.innerHeight };
    var b = elems.bulle;
    var r = null;
    if (el) {
      var box = boiteDe(el);
      var pad = 6;
      r = { x: box.x - pad, y: box.y - pad, l: box.l + 2 * pad, h: box.h + 2 * pad };
      elems.trou.hidden = false;
      elems.voile.removeAttribute('data-plein');
      elems.trou.style.left = r.x + 'px';
      elems.trou.style.top = r.y + 'px';
      elems.trou.style.width = r.l + 'px';
      elems.trou.style.height = r.h + 'px';
    } else {
      elems.trou.hidden = true;
      elems.voile.setAttribute('data-plein', '');
    }
    if (mobile()) { b.style.left = ''; b.style.top = ''; return; }
    var p = placer(r, { l: b.offsetWidth, h: b.offsetHeight }, vue);
    b.style.left = Math.round(p.x) + 'px';
    b.style.top = Math.round(p.y) + 'px';
    b.setAttribute('data-cote', p.cote);
  }

  function planifier() {
    if (cadre) return;
    cadre = (root.requestAnimationFrame || function (f) { return setTimeout(f, 16); })(positionner);
  }

  function amenerEnVue(el) {
    if (!el) return;
    var r = rectDe(el);
    var barre = mobile() ? (parseFloat(root.getComputedStyle(doc.documentElement).scrollPaddingTop) || 0) : 0;
    var bas = mobile() && elems ? root.innerHeight - elems.bulle.offsetHeight : root.innerHeight;
    if (!mobile() && elems) {
      // Desktop, cible large sans place sur les côtés : si cible et bulle tiennent l'une sous l'autre,
      // on remonte la cible pour que la bulle se pose dessous au lieu de la recouvrir.
      var bl = elems.bulle.offsetWidth, bh = elems.bulle.offsetHeight, vl = doc.documentElement.clientWidth;
      var cotes = r.right + ECART + bl <= vl - MARGE || r.left - ECART - bl >= MARGE;
      var empile = r.height + ECART + bh + 2 * MARGE <= root.innerHeight;
      if (!cotes && empile) {
        if (r.top >= MARGE && r.bottom + ECART + bh <= root.innerHeight - MARGE) return;
        if (r.top - ECART - bh >= MARGE && r.bottom <= root.innerHeight) return;
        root.scrollBy(0, r.top - 2 * MARGE);
        return;
      }
    }
    if (r.top >= barre && r.bottom <= bas) return;
    // Cible englobante qui tient à l'écran : on la remonte en haut plutôt que de centrer sa première partie.
    if (ETAPES[courant.index].avec && r.height <= bas - barre - 2 * MARGE) { root.scrollBy(0, r.top - barre - MARGE); return; }
    // Défilement instantané : un défilement doux est interrompu par les rendus de boot.js (qui remettent
    // la position d'avant) et le projecteur suit de toute façon. Mobile : en haut, sous la barre collante
    // (scroll-padding-top du lot 23), au-dessus de la feuille.
    try { el.scrollIntoView({ block: mobile() ? 'start' : 'center' }); } catch (err) { el.scrollIntoView(); }
  }

  function afficher() {
    creer();
    actif = true;
    var e = ETAPES[courant.index];
    ouvrirMenu(!!(e.menu && mobile()));
    courant.sautees = noterSauts(courant.sautees, [], e.id);
    // Fournil ouvert sur un sujet : on garde son adresse pour y revenir avec Précédent.
    if (pageCourante() === 'fournil' && /[?&]ref=/.test(root.location.search)) {
      try { root.sessionStorage.setItem(CLE_FOURNIL, root.location.pathname + root.location.search); } catch (err) {}
    }
    var r = remplir();
    var el = elementCible(e);
    var aFaire = !!(e.action && el);
    rendreInerte(true, aFaire ? el : null);
    if (aFaire) elems.voile.setAttribute('data-action', ''); else elems.voile.removeAttribute('data-action');
    if (e.menu && mobile()) root.scrollTo(0, 0); else amenerEnVue(el);
    positionner();
    // Lot 30 : le focus va toujours sur le bouton principal, y compris aux étapes à faire.
    focusPrincipal();
    // Bulle déjà ouverte : le focus reste dans le même dialogue, on annonce l'étape.
    if (dejaOuverte && root.annoncer) root.annoncer((r.e.accueil ? '' : formater(r.x.ui.compteur, r.c) + '. ') + r.x.etapes[r.e.id].titre + '. ' + r.x.etapes[r.e.id].texte);
    dejaOuverte = true;
  }

  function focusPrincipal() {
    var f = elems && elems.bulle.querySelector('[data-visite-act="suivant"],[data-visite-act="terminer"]');
    if (!f) return;
    try { f.focus({ preventScroll: true }); } catch (err) { f.focus(); }
  }

  function fermer(focusSur) {
    actif = false;
    dejaOuverte = false;
    derniereMiette = null;
    ouvrirMenu(false);
    detruire();
    effacerEncours(ls);
    var cible = focusSur || doc.getElementById('contenu');
    if (cible) { try { cible.focus({ preventScroll: true }); } catch (err) { cible.focus(); } }
  }

  // Applique le résultat de aller() : étape sur la page, page suivante, ou fin de la visite.
  function suivre(res, sens) {
    if (res.fin) { marquerVue(ls, compte); fermer(doc.querySelector('[data-visite-revoir]')); return; }
    courant.sautees = noterSauts(courant.sautees, res.passees, res.naviguer ? null : ETAPES[res.index].id);
    if (res.naviguer) {
      poserEncours(ls, compte, { index: res.index, sens: sens, sautees: courant.sautees });
      ouvrirMenu(false);
      var url = CHEMINS[res.naviguer];
      if (res.naviguer === 'fournil') { try { url = root.sessionStorage.getItem(CLE_FOURNIL) || url; } catch (err) {} }
      root.location.href = url;
      return;
    }
    courant.index = res.index;
    courant.sens = sens;
    poserEncours(ls, compte, courant);
    afficher();
  }

  function agir(act) {
    if (!actif) return;
    var page = pageCourante();
    var e = ETAPES[courant.index];
    var cible = e.action ? elementCible(e) : null;
    // Étape à faire : Suivant clique la cible (lien du four, « Pétrir un post ») ; clicCible note la reprise.
    if (act === 'suivant' && cible) { cible.click(); return; }
    if (act === 'suivant') { if (ETAPES[courant.index].menu) ouvrirMenu(false); suivre(aller(ETAPES, courant.index + 1, 1, page, visible), 1); }
    else if (act === 'precedent') { if (ETAPES[courant.index].menu) ouvrirMenu(false); suivre(aller(ETAPES, courant.index - 1, -1, page, visible), -1); }
    else if (act === 'terminer') { marquerVue(ls, compte); fermer(doc.querySelector('[data-visite-revoir]')); }
    else if (act === 'passer') { marquerVue(ls, compte); fermer(); }
    else if (act === 'plustard') { reporter(ls, compte, marqueurSession(ls)); fermer(); }
  }

  function clavier(ev) {
    if (!actif || !elems) return;
    if (ev.key === 'Escape') {
      ev.preventDefault(); ev.stopPropagation();
      // Échap quitte la visite comme « Passer » ; sur l'accueil, comme « Plus tard ».
      agir(ETAPES[courant.index].accueil ? 'plustard' : 'passer');
      return;
    }
    if (ev.key !== 'Tab') return;
    var f = Array.prototype.slice.call(elems.bulle.querySelectorAll('button'));
    var el = etapeAFaire() ? elementCible(ETAPES[courant.index]) : null;
    if (el) f.unshift(el);
    if (!f.length) return;
    var premier = f[0], dernier = f[f.length - 1];
    var dedans = elems.bulle.contains(doc.activeElement) || (!!el && el === doc.activeElement);
    if (ev.shiftKey && (doc.activeElement === premier || !dedans)) { ev.preventDefault(); dernier.focus(); }
    else if (!ev.shiftKey && (doc.activeElement === dernier || !dedans)) { ev.preventDefault(); premier.focus(); }
  }

  // Arrivée sur une page pendant la visite : on attend que ses cibles soient rendues (données chargées),
  // au plus ATTENTE ms, puis on reprend dans le sens du parcours en sautant les cibles absentes.
  var ATTENTE = 1500;
  function reprendre(enc) {
    var page = pageCourante();
    var debut = Date.now();
    courant = enc;
    (function essai() {
      var e = ETAPES[courant.index];
      var occupe = !!doc.querySelector('#root [aria-busy="true"]');
      var pret = e.page !== page || (visible(e) && !occupe) || Date.now() - debut > ATTENTE;
      if (!pret) { setTimeout(essai, 120); return; }
      if (e.page === page && e.amorce && !visible(e) && !/[?&]ref=/.test(root.location.search)) {
        var lien = doc.querySelector(e.amorce);
        if (lien && boiteVisible(lien) && lien.getAttribute('href')) {
          poserEncours(ls, compte, courant);
          root.location.href = lien.getAttribute('href');
          return;
        }
      }
      suivre(aller(ETAPES, courant.index, courant.sens, page, visible), courant.sens);
    })();
  }

  function lancer() {
    var page = pageCourante();
    var u = utilisateur();
    compte = cleDuCompte(u);
    if (!page || !compte) return;
    var enc = lireEncours(ls, compte);
    if (enc && ETAPES[enc.index].page === page) { reprendre(enc); return; }
    if (enc) effacerEncours(ls);
    // Lot 32 : le rituel du matin passe d'abord, l'accueil attend sa fin (jamais les deux en même temps).
    if (root.Rituel && root.Rituel.prevu()) {
      doc.addEventListener('pq:rituel-fin', function apres() { doc.removeEventListener('pq:rituel-fin', apres); lancer(); });
      return;
    }
    // Première connexion : l'accueil de Miette (sans cible) s'ouvre sur la page d'arrivée
    // (la connexion mène à la fournée) ; « C'est parti » emmène ensuite au comptoir.
    if (doitLancer(lireCompte(ls, compte), marqueurSession(ls))) {
      courant = { index: 0, sens: 1, sautees: [] };
      afficher();
    }
  }

  // Bouton « Revoir la visite » (profil) : la visite repart de l'accueil, sur le comptoir.
  function revoir() {
    compte = cleDuCompte(utilisateur());
    if (!compte) return;
    poserEncours(ls, compte, { index: 0, sens: 1, sautees: [] });
    root.location.href = CHEMINS.comptoir;
  }
  Visite.revoir = revoir;

  var style = doc.createElement('style');
  style.textContent = CSS;
  doc.head.appendChild(style);

  doc.addEventListener('pq:rendu', function (ev) {
    var r = ev.detail && ev.detail.root;
    var btn = r && r.querySelector('[data-visite-revoir]');
    if (btn) btn.addEventListener('click', revoir);
    if (actif) {
      // boot.js remet le défilement d'avant le rendu : on ramène la cible en vue juste après.
      setTimeout(function () {
        if (!actif) return;
        var e = ETAPES[courant.index];
        if (!(e.menu && mobile())) amenerEnVue(elementCible(e));
        if (e.action) {
          var el = elementCible(e);
          rendreInerte(true, el);
          if (doc.activeElement === doc.body) focusPrincipal();
        }
        planifier();
      }, 0);
      return;
    }
    if (!premierRendu) return;
    premierRendu = false;
    // Après afterRender et la restauration du focus de boot.js.
    setTimeout(function () { lancer(); }, 0);
  });
})(this);
