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
