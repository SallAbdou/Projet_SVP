const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../charte.js');
const Boot = require('../boot.js');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const PAGES = fs.readdirSync(RACINE).filter(f => f.endsWith('.html') && !f.includes(' copy'));

test('16 pages couvertes', () => {
  assert.equal(PAGES.length, 16);
});

test('chaque page : le lien d’évitement est le premier élément de <body>, donc le premier focusable', () => {
  for (const p of PAGES) {
    const h = lire(p);
    const apres = h.slice(h.indexOf('<body>') + '<body>'.length);
    assert.match(apres, /^\s*<a class="pq-evitement" href="#contenu">Aller au contenu<\/a>/, p);
  }
});

test('chaque page : un seul main, cible du lien (id contenu, focusable par script)', () => {
  for (const p of PAGES) {
    const h = lire(p);
    const mains = h.match(/<main\b[^>]*>/g) || [];
    assert.equal(mains.length, 1, p);
    assert.match(mains[0], /^<main id="contenu" tabindex="-1"[ >]/, p);
  }
});

test('lien d’évitement : masqué hors écran, visible au focus, couleurs du thème', () => {
  const css = lire('charte.css');
  assert.match(css, /\.pq-evitement\{[^}]*position:absolute/);
  assert.match(css, /\.pq-evitement\{[^}]*transform:translateY\(-200%\)/);
  assert.match(css, /\.pq-evitement:focus\{[^}]*transform:none/);
  assert.match(css, /\.pq-evitement\{[^}]*background:var\(--texte\);color:var\(--fond\)/);
  assert.match(css, /#contenu:focus\{outline:none\}/);
});

test('lien d’évitement traduit après chaque rendu', () => {
  assert.equal(Boot.texteEvitement('fr'), 'Aller au contenu');
  assert.equal(Boot.texteEvitement('en'), 'Skip to content');
  assert.equal(Boot.texteEvitement('de'), 'Aller au contenu');
  assert.match(lire('boot.js'), /querySelector\('\.pq-evitement'\)/);
});

test('focus non masqué : scroll-padding-top de la hauteur de la barre collante, sur mobile', () => {
  assert.match(lire('charte.css'), /--pq-barre-nav:\s*72px/);
  const nav = lire('nav.js');
  const mobile = nav.slice(nav.indexOf('@media (max-width:899.98px){'));
  assert.match(mobile, /html\{scroll-padding-top:var\(--pq-barre-nav\)\}/);
});

// Thème Nuit : contour des éléments à fond plein imposé, au moins 3:1 contre les fonds où ils sont posés.
const css = lire('charte.css');
function bloc(sel) {
  const i = css.indexOf(sel + '{');
  return css.slice(i, css.indexOf('}', i));
}
const vars = corps => { const r = {}; corps.replace(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g, (m, n, h) => { r[n] = h; }); return r; };
const BRONZE = vars(bloc(':root,[data-theme="bronze"]'));
const NUIT = Object.assign({}, BRONZE, vars(bloc('[data-theme="nuit"]')));

test('Nuit : constat de départ, les fonds pleins imposés se détachent mal sur certains fonds', () => {
  assert.ok(C.contraste(NUIT['linkedin-fond'], NUIT.sable) < 3);
  assert.ok(C.contraste(NUIT['petrir-btn-survol'], NUIT.miel) < 3);
  assert.ok(C.contraste(NUIT['rassis-fond'], NUIT.fond) < 3);
  assert.ok(C.contraste(NUIT['lire-survol'], NUIT.fond) < 3);
});

test('Nuit : --contour-plein atteint 3:1 contre fond, creme, sable, miel et panneau, et n’existe qu’en Nuit', () => {
  assert.ok(NUIT['contour-plein'], 'variable absente du bloc Nuit');
  for (const f of ['fond', 'creme', 'sable', 'miel', 'panneau']) {
    const c = C.contraste(NUIT['contour-plein'], NUIT[f]);
    assert.ok(c >= 3, `contour-plein sur ${f} = ${c.toFixed(2)}`);
  }
  assert.equal(BRONZE['contour-plein'], undefined);
});

test('Nuit : contour sur Pétrir, LinkedIn, Rassis et Lire la source, sans écraser le focus clavier', () => {
  const regle = css.match(/\[data-theme="nuit"\] :is\(([^)]*)\):not\(:focus-visible\)\{outline:1\.5px solid var\(--contour-plein\)[^}]*\}/);
  assert.ok(regle, 'règle de contour Nuit absente');
  for (const s of ['.btn-petrir', '.fo-btn-linkedin', '.puce-rassis', '.gm-source', '.act[data-act="read"]']) assert.ok(regle[1].includes(s), s);
});

test('Nuit : couleurs imposées inchangées', () => {
  const nuit = vars(bloc('[data-theme="nuit"]'));
  for (const k of ['petrir-btn-fond', 'linkedin-fond', 'rassis-fond', 'lire-fond']) assert.equal(nuit[k], undefined, k);
});

test('barre mobile vraiment collante : body ne devient pas un conteneur de défilement (overflow-x:clip, pas hidden)', () => {
  for (const f of [...PAGES, 'parcours.css']) {
    const t = lire(f);
    assert.doesNotMatch(t, /html,\s*body\{overflow-x:hidden\}/, f);
    assert.doesNotMatch(t, /body\{[^}]*overflow-x:hidden/, f);
  }
  for (const p of ['comptoir.html', 'fournee.html', 'fournil.html', 'garde-manger.html', 'profil.html']) {
    assert.match(lire(p), /html\{overflow-x:hidden\}body\{overflow-x:clip\}/, p);
  }
});

// Lot 24 : #root est recréé à chaque frappe et Chrome ne donne pas la position du curseur d'un
// champ type="email" ; le curseur revenait au début et l'adresse s'écrivait à l'envers.
// Les champs e-mail sont donc en type="text" avec le clavier e-mail et l'autocomplétion.
test('champs e-mail : type text, clavier e-mail, autocomplétion (saisie à l endroit)', () => {
  PAGES.forEach(f => {
    const html = lire(f);
    assert.ok(!/<input[^>]*type="email"/.test(html), f + ' : type="email" interdit');
    (html.match(/<input[^>]*id="email"[^>]*>/g) || []).forEach(i => {
      assert.ok(/type="text"/.test(i), f + ' : type text');
      assert.ok(/inputmode="email"/.test(i), f + ' : inputmode email');
      assert.ok(/autocomplete="(email|username)"/.test(i), f + ' : autocomplete');
      assert.ok(/spellcheck="false"/.test(i) && /autocapitalize="none"/.test(i), f + ' : ni correcteur ni majuscule');
    });
  });
});

// Lot 24 (M3) : la bordure est le seul repère d'un champ (fond du champ proche de celui de la carte) ;
// --bord-fort ne tient pas 3:1, --bord-champ si (1.4.11).
test('bordures des champs en --bord-champ (contraste non textuel 3:1)', () => {
  assert.match(lire('parcours.css'), /\.champ input\[type=text\][^{]*\{[^}]*border:1\.5px solid var\(--bord-champ\)/);
  const fournil = lire('fournil.html');
  assert.match(fournil, /\.fo-select\{[^}]*var\(--bord-champ\)/);
  assert.match(fournil, /<textarea id="brouillon"[^>]*var\(--bord-champ\)/);
});

// Lot 24 (N3) : le bouton de pause « Tout chaud » vit dans l'aperçu ; un role="img" masquerait
// ses enfants, d'où un bouton focalisable mais muet (axe : nested-interactive).
test('aperçu de ta fournée type : groupe nommé, décor masqué, pas de role img', () => {
  const html = lire('ta-fournee-type.html');
  assert.match(html, /<div class="mini-bento" role="group" aria-label="\{\{apercuLabel\}\}">/);
  assert.match(html, /<span class="mini-rang" aria-hidden="true">/);
  assert.match(html, /<span class="mini-ligne" aria-hidden="true">/);
});

// Lot 24 (N6, 1.4.1) : l'état de chaque barre (Tout chaud, À pétrir, Rassis) est écrit sous la barre,
// pas seulement porté par sa couleur.
test('comptoir : état écrit sous chaque barre du graphique', () => {
  const html = lire('comptoir.html');
  assert.match(html, /\{\{b\.label\}\}[\s\S]{0,200}\{\{b\.etat\}\}/);
  assert.match(html, /etat: t\.etats\[b\.feu\]/);
});

// Lot 24 (N7, 3.3.4) : effacer les données demande une confirmation explicite.
test('confidentialité : effacement en deux temps, confirmation et annulation', () => {
  const html = lire('confidentialite.html');
  assert.match(html, /data-focus="effacer-oui"/);
  assert.match(html, /data-focus="effacer-annuler"/);
  assert.match(html, /confirmerOui: 'Oui, tout effacer'/);
  assert.match(html, /confirmerOui: 'Yes, erase everything'/);
  assert.ok(!/Un clic suffit/.test(html));
});

// Lot 24 (m1, 3.3.3) : champs vides à la connexion, message qui dit quoi corriger, sur le bon champ.
test('connexion : messages distincts pour e-mail ou mot de passe vides', () => {
  const html = lire('connexion.html');
  assert.match(html, /emailVide: 'Indique ton e-mail\.'/);
  assert.match(html, /mdpVide: 'Indique ton mot de passe\.'/);
  assert.match(html, /<input id="email"[^>]*aria-invalid="\{\{invalideEmail\}\}"/);
  assert.match(html, /<input id="mdp"[^>]*aria-invalid="\{\{invalideMdp\}\}"/);
});

// Lot 24 (m2) : les cases de consentement en erreur portent aria-invalid et un liseré visible.
test('questionnaire : cases de consentement marquées en erreur', () => {
  const html = lire('questionnaire.html');
  assert.match(html, /<input id="newsletter"[^>]*aria-invalid="\{\{inv\.newsletter\}\}"/);
  assert.match(html, /<input id="rgpd"[^>]*aria-invalid="\{\{inv\.rgpd\}\}"/);
  assert.match(lire('parcours.css'), /\.choix label:has\(input\[aria-invalid="true"\]\)\{[^}]*var\(--erreur\)/);
});

// Lot 24 (m5, 2.4.2) : la 404 dit dans son titre que la page n'existe pas ; la cuisson est un décor.
test('404 : titre explicite, barre de cuisson décorative', () => {
  const html = lire('404.html');
  assert.match(html, /<title>Page introuvable · Votre pAIn quotidien<\/title>/);
  assert.match(html, /content="Page not found · Votre pAIn quotidien"/);
  assert.ok(!/role="progressbar"/.test(html));
});

// Lot 24 (m6, 2.4.11) : le lanceur fixe du chat ne recouvre pas l'élément qui reçoit le focus.
test('accueil : marge de défilement sous le lanceur du chat', () => {
  assert.match(lire('parcours.css'), /html:has\(\.chat-lanceur\)\{scroll-padding-bottom:\d+px\}/);
});

// Lot 24 (m7, A2) : compteur relié au brouillon ; plus d'aside imbriqué dans main (axe).
test('fournil : compteur relié au brouillon, colonne sans aside', () => {
  const html = lire('fournil.html');
  assert.match(html, /<span id="compteur-brouillon"/);
  assert.match(html, /<textarea id="brouillon"[^>]*aria-describedby="compteur-brouillon"/);
  assert.ok(!/<aside/.test(html));
});
