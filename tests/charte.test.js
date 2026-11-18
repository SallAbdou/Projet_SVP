const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../charte.js');

const RACINE = path.join(__dirname, '..');
const arrondi = n => Math.round(n * 100) / 100;

test('contraste noir sur blanc = 21, couleur sur elle-même = 1', () => {
  assert.equal(arrondi(C.contraste('#000000', '#FFFFFF')), 21);
  assert.equal(C.contraste('#C2410C', '#C2410C'), 1);
});

test('contraste symétrique et valeur connue (blanc sur braise)', () => {
  assert.equal(C.contraste('#FFFFFF', '#C2410C'), C.contraste('#C2410C', '#FFFFFF'));
  assert.equal(arrondi(C.contraste('#FFFFFF', '#C2410C')), 5.18);
});

test('luminance accepte les minuscules et le # absent', () => {
  assert.equal(C.luminance('ffffff'), 1);
  assert.equal(C.luminance('#c2410c'), C.luminance('#C2410C'));
});

test('puce : tous les noms d\'état mènent à la bonne classe', () => {
  for (const e of ['vert', 'hot', 'chaud']) assert.equal(C.puce(e), 'puce puce-chaud', e);
  for (const e of ['orange', 'knead', 'enfourner']) assert.equal(C.puce(e), 'puce puce-petrir', e);
  for (const e of ['rouge', 'stale', 'rassis']) assert.equal(C.puce(e), 'puce puce-rassis', e);
});

test('puce et barre : état inconnu ou absent donnent une chaîne vide', () => {
  for (const e of ['inconnu', undefined, null, '']) {
    assert.equal(C.puce(e), '');
    assert.equal(C.barre(e), '');
  }
});

test('barre : variable CSS de la charte selon l\'état', () => {
  assert.equal(C.barre('vert'), 'var(--barre-chaud)');
  assert.equal(C.barre('knead'), 'var(--barre-petrir)');
  assert.equal(C.barre('rassis'), 'var(--barre-rassis)');
});

test('contourBarre : contour gris pour Rassis seulement', () => {
  for (const e of ['rouge', 'stale', 'rassis']) assert.equal(C.contourBarre(e), 'inset 0 0 0 2px var(--barre-rassis-contour)', e);
  for (const e of ['vert', 'hot', 'chaud', 'orange', 'knead', 'enfourner', 'inconnu', undefined, null, '']) assert.equal(C.contourBarre(e), '', String(e));
});

// Palette lue dans charte.css : un bloc par défaut (Bronze) et un bloc par thème. Pour chaque thème,
// chaque couple utilisé atteint son seuil (4,5 texte, 3 contours, barres et focus).
const css = fs.readFileSync(path.join(RACINE, 'charte.css'), 'utf8');
function lireVars(corps) {
  const r = {};
  corps.replace(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g, (m, nom, hex) => { r[nom] = hex; });
  return r;
}
const BLOCS = {};
css.replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, corps) => {
  const s = sel.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (s === ':root,[data-theme="bronze"]') BLOCS.bronze = lireVars(corps);
  const t = /^\[data-theme="(\w+)"\]$/.exec(s);
  if (t) BLOCS[t[1]] = lireVars(corps);
  return m;
});
const VARS = BLOCS.bronze || {};
const THEMES = {};
for (const nom of ['bronze', 'classique', 'nuit', 'contraste']) THEMES[nom] = Object.assign({}, VARS, BLOCS[nom] || {});

const TEXTE = [
  ['texte', 'fond'], ['texte', 'creme'], ['texte', 'sable'], ['texte', 'miel'], ['texte', 'champ'],
  ['texte-2', 'fond'], ['texte-2', 'creme'], ['texte-2', 'miel'],
  ['doux', 'fond'], ['doux', 'creme'], ['doux', 'sable'], ['doux', 'miel'],
  ['brun', 'fond'], ['brun', 'creme'], ['brun', 'sable'], ['brun-fonce', 'creme'], ['brun-fonce', 'miel'], ['brun-fonce', 'sable'],
  ['sur-titre', 'fond'], ['braise', 'fond'], ['braise', 'creme'],
  ['sur-plein', 'braise'], ['sur-plein', 'braise-fonce'], ['sur-plein', 'brun'], ['sur-plein', 'brun-fonce'],
  ['sur-plein', 'source'], ['sur-plein', 'source-fonce'],
  ['etiquette-texte', 'etiquette-fond'],
  ['chaud-texte', 'croute'], ['chaud-texte', 'braise-vive'], ['petrir-texte', 'petrir-fond'], ['rassis-texte', 'rassis-fond'],
  ['sur-clair', 'croute'], ['sur-clair', 'or-haut'], ['sur-clair', 'or-bas'], ['sur-clair', 'petrir-fond'],
  ['pain-texte', 'pain-haut'], ['pain-texte', 'pain-bas'], ['pain-texte', 'pain-grigne'],
  ['erreur', 'creme'], ['erreur', 'erreur-fond'], ['ok', 'creme'], ['ok', 'ok-fond'],
  ['sur-plein', 'cuivre'], ['panneau-texte', 'panneau'], ['panneau-doux', 'panneau'], ['panneau-or', 'panneau'],
  ['or-texte', 'or-haut'], ['or-texte', 'or-milieu'], ['or-texte', 'or-bas'], ['or-texte', 'or-surface'],
  ['or-texte-2', 'or-haut'], ['or-texte-2', 'or-bas'], ['or-texte-2', 'or-surface'], ['or-brun', 'or-surface'], ['or-brun', 'or-haut'],
  ['or-surface', 'or-brun'], ['or-sur-plein', 'or-source'], ['or-sur-plein', 'or-source-fonce'],
  ['sur-clair', 'or-milieu'], ['sur-clair', 'pain-haut'], ['brun-fonce', 'miel'], ['sur-clair', 'panneau-or']
];
const GRAPHIQUE = [
  ['braise', 'sable'], ['source', 'creme'], ['barre-petrir', 'creme'], ['barre-rassis-contour', 'creme'],
  ['braise-vive', 'creme'], ['bord-champ', 'champ'], ['focus', 'fond'], ['focus', 'creme'], ['focus', 'sable'], ['cuivre', 'creme'],
  ['pain-bas', 'creme'], ['pain-bas', 'fond'], ['or-source', 'or-bas'], ['or-bord', 'or-haut'],
  ['source', 'fond']
];
for (const [nom, vars] of Object.entries(THEMES)) {
  const v = x => (x.charAt(0) === '#' ? x : vars[x]);
  const verifier = (a, b, seuil) => {
    assert.ok(v(a) && v(b), `${nom} : variable absente ${!v(a) ? a : b}`);
    const c = C.contraste(v(a), v(b));
    assert.ok(c >= seuil, `${nom} : ${a} ${v(a)} sur ${b} ${v(b)} = ${arrondi(c)} < ${seuil}`);
  };
  test(`thème ${nom} : textes >= 4,5:1`, () => { for (const [a, b] of TEXTE) verifier(a, b, 4.5); });
  test(`thème ${nom} : contours, barres et focus >= 3:1`, () => { for (const [a, b] of GRAPHIQUE) verifier(a, b, 3); });
}

test('Bronze, Nuit et la source du Contraste élevé suivent les rampes OKLCH de tools/palette-oklch.js', () => {
  const P = require('../tools/palette-oklch.js');
  assert.equal(P.hex(1, 0, 0), '#FFFFFF');
  assert.equal(P.hex(0, 0, 0), '#000000');
  for (const t of ['bronze', 'nuit', 'contraste']) {
    for (const [k, h] of Object.entries(P[t])) assert.equal((BLOCS[t] || {})[k], h, `${t} --${k}`);
  }
});

test('quatre thèmes déclarés, Bronze par défaut sur :root', () => {
  assert.ok(Object.keys(BLOCS.bronze || {}).length > 30, 'bloc :root,[data-theme="bronze"] absent');
  for (const nom of ['classique', 'nuit', 'contraste']) assert.ok(BLOCS[nom], nom);
});

test('Boulangerie classique reprend la palette d’avant le lot 13', () => {
  const c = THEMES.classique;
  assert.equal(c.fond, '#FBF5EA'); assert.equal(c.creme, '#FFFDF8'); assert.equal(c.texte, '#2E1D12');
  assert.equal(c.doux, '#6B5443'); assert.equal(c.brun, '#8A4F1C'); assert.equal(c['brun-fonce'], '#5E3412');
  assert.equal(c.braise, '#C2410C');
});

test('Contraste élevé : texte courant à 7:1 au moins', () => {
  const c = THEMES.contraste;
  for (const [a, b] of [['texte', 'fond'], ['texte', 'creme'], ['doux', 'fond'], ['doux', 'creme'], ['brun', 'creme']]) {
    assert.ok(C.contraste(c[a], c[b]) >= 7, `${a} / ${b} = ${arrondi(C.contraste(c[a], c[b]))}`);
  }
});

test('Nuit : fond sombre, texte clair', () => {
  assert.ok(C.luminance(THEMES.nuit.fond) < 0.02, THEMES.nuit.fond);
  assert.ok(C.luminance(THEMES.nuit.texte) > 0.7, THEMES.nuit.texte);
});

test('états reconnaissables : mêmes puces dans tous les thèmes', () => {
  for (const nom of Object.keys(THEMES)) {
    assert.equal(THEMES[nom]['petrir-fond'], VARS['petrir-fond'], nom);
    assert.equal(THEMES[nom]['rassis-fond'], VARS['rassis-fond'], nom);
    assert.equal(THEMES[nom].croute, VARS.croute, nom);
  }
});

test('Rassis en gris chaud clair dans les graphiques, plus de noir', () => {
  assert.ok(C.luminance(VARS['barre-rassis']) > 0.5, VARS['barre-rassis']);
});

// Teinte approximative en degrés (HSV), suffisante pour distinguer vert, bronze et prune.
function teinte(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
const rvb = hex => [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16));

test('« Lire la source » en vert-de-gris (patine du bronze) dans tous les thèmes, loin de la braise', () => {
  for (const [nom, t] of Object.entries(THEMES)) {
    for (const k of ['source', 'source-fonce']) {
      const h = teinte(t[k]);
      assert.ok(h >= 150 && h <= 200, `${nom} ${k} ${t[k]} teinte ${Math.round(h)}`);
    }
    assert.ok(Math.abs(teinte(t.source) - teinte(t.braise)) > 100, nom);
  }
});

test('un seul accent d’action : braise, doré et focus du thème Bronze sont la même teinte bronze cuivrée', () => {
  assert.equal(VARS.braise, VARS.dore);
  assert.equal(VARS.braise, VARS.focus);
  const h = teinte(VARS.braise);
  assert.ok(h >= 15 && h <= 35, `braise teinte ${Math.round(h)}`);
});

test('accents adoucis : ni orange fluo ni jaune fluo', () => {
  const sat = hex => { const v = rvb(hex); return (Math.max(...v) - Math.min(...v)) / Math.max(...v); };
  for (const k of ['braise-vive', 'croute', 'eclair', 'barre-petrir']) assert.ok(sat(VARS[k]) < 0.82, `${k} ${VARS[k]} saturation ${sat(VARS[k]).toFixed(2)}`);
});

test('Rassis froid et éteint, sans noir ni blanc purs', () => {
  const f = VARS['rassis-fond'], t = VARS['rassis-texte'];
  assert.ok(C.luminance(f) > 0.03 && C.luminance(f) < 0.1, f);
  assert.notEqual(t.toUpperCase(), '#FFFFFF');
  const [r, , b] = rvb(f);
  assert.ok(b >= r, 'Rassis doit tirer vers le froid : ' + f);
});

test('profondeur : fond de page en léger dégradé et ombres teintées brun, unis en contraste élevé', () => {
  assert.match(css, /:root,\[data-theme="bronze"\]\{[^}]*--fond-page:[^;}]*gradient/);
  assert.match(css, /\[data-theme="contraste"\]\{[^}]*--fond-page:var\(--fond\)/);
  for (const n of ['ombre-1', 'ombre-2', 'ombre-3']) assert.match(css, new RegExp('--' + n + ':[^;}]*var\\(--ombre-teinte\\)'));
  const [r, g, b] = rvb(VARS['ombre-teinte']);
  assert.ok(r > g && g > b, 'ombre brune attendue : ' + VARS['ombre-teinte']);
  for (const p of ['comptoir.html', 'fournee.html', 'fournil.html', 'garde-manger.html', 'profil.html']) {
    assert.match(fs.readFileSync(path.join(RACINE, p), 'utf8'), /body\{margin:0;background:var\(--fond-page\)/, p);
  }
  assert.match(fs.readFileSync(path.join(RACINE, 'parcours.css'), 'utf8'), /body\{[^}]*background:var\(--fond-page\)/);
});

test('bouton Pétrir en pastille dorée : fond uni sous le texte, petit pain décoratif, appui, focus, sans animation si réduit', () => {
  assert.match(css, /\.btn-petrir\{[^}]*border-radius:999px/);
  assert.match(css, /\.btn-petrir\{[^}]*background:var\(--pain-haut\)/);
  assert.match(css, /\.btn-petrir\{[^}]*border:1\.5px solid var\(--pain-bas\)/);
  assert.match(css, /\.btn-petrir\{[^}]*color:var\(--pain-texte\)/);
  assert.match(css, /\.btn-petrir\{[^}]*min-height:44px/);
  assert.doesNotMatch(css, /\.btn-petrir::before/);
  assert.doesNotMatch(css, /\.btn-petrir\{[^}]*gradient/);
  assert.match(css, /\.btn-petrir \.pain-ico\{[^}]*width:/);
  const gabarits = { 'comptoir.html': 1, 'fournee.html': 1, 'fournil.html': 2, 'garde-manger.html': 1 };
  for (const [p, n] of Object.entries(gabarits)) {
    const h = fs.readFileSync(path.join(RACINE, p), 'utf8');
    const boutons = h.match(/<a [^>]*class="btn-petrir[^"]*"[^>]*>[\s\S]*?<\/a>/g) || [];
    assert.equal(boutons.length, n, p);
    for (const b of boutons) assert.match(b, /^<a [^>]*><svg class="pain-ico"[^>]*aria-hidden="true"[^>]*focusable="false"/, p);
  }
  assert.match(css, /\.btn-petrir:active\{[^}]*transform/);
  assert.match(css, /\.btn-petrir:focus-visible\{[^}]*outline:3px solid var\(--focus\)/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\.btn-petrir/);
});

test('texte masqué visuellement et étiquette de source dans la charte', () => {
  assert.match(css, /\.pq-sr\{[^}]*clip/);
  assert.match(css, /\.pq-cache\{display:none!important\}/);
  assert.match(css, /\.etiquette-source\{[^}]*var\(--etiquette-fond\)[^}]*var\(--etiquette-texte\)/);
});

test('animation Tout chaud coupée sous prefers-reduced-motion', () => {
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\.puce-chaud/);
});

test('chaque page charge /charte.css avant toute autre feuille de style', () => {
  const pages = fs.readdirSync(RACINE).filter(f => f.endsWith('.html'));
  assert.ok(pages.length >= 16);
  for (const p of pages) {
    const h = fs.readFileSync(path.join(RACINE, p), 'utf8');
    const i = h.indexOf('href="/charte.css"');
    assert.ok(i > 0, p + ' ne charge pas charte.css');
    const autres = [h.indexOf('href="/parcours.css"'), h.indexOf('<style')].filter(x => x >= 0);
    for (const x of autres) assert.ok(i < x, p + ' charge charte.css trop tard');
  }
});

test('ampoule « éclair de génie » : couleur et classes dans la charte, décorative devant chaque Pour toi', () => {
  assert.match(css, /--eclair:\s*#[0-9A-Fa-f]{6}/);
  assert.match(css, /\.pour-toi\{/);
  assert.match(css, /\.ampoule\{[^}]*width:26px;height:26px[^}]*var\(--croute\)/);
  assert.match(css, /\.pour-toi\{[^}]*font-size:17px/);
  assert.match(css, /\.pour-toi>span\{[^}]*var\(--brun-fonce\)[^}]*font-weight:600/);
  for (const p of ['fournee.html', 'fournil.html']) {
    const h = fs.readFileSync(path.join(RACINE, p), 'utf8');
    assert.match(h, /<svg class="ampoule"[^>]*aria-hidden="true"[^>]*focusable="false"/, p);
    // La charte décide de la taille : aucune taille en ligne sur la ligne « Pour toi ».
    assert.doesNotMatch(h, /class="[^"]*pour-toi"[^>]*font-size/, p);
    assert.doesNotMatch(h, /pourToiStyle: a\.pourToi \? 'font-size/, p);
  }
});

test('n°1 doré : ses variables locales restent lisibles sur le doré dans tous les thèmes', () => {
  const h = fs.readFileSync(path.join(RACINE, 'fournee.html'), 'utf8');
  const regle = /\.tile\[data-tile="n1"\]\{([^}]*)\}/.exec(h);
  assert.ok(regle, 'règle du n°1 absente');
  const loc = {};
  regle[1].replace(/--([\w-]+):var\(--([\w-]+)\)/g, (m, nom, ref) => { loc[nom] = VARS[ref]; });
  assert.doesNotMatch(regle[1], /#[0-9A-Fa-f]{3,8}\b|rgba?\(/, 'n°1 sans couleur en dur');
  assert.match(regle[1], /color:var\(--sur-clair\)/);
  for (const nom of ['texte', 'texte-2', 'doux', 'brun', 'brun-fonce', 'creme', 'sur-plein', 'source', 'source-fonce']) {
    assert.ok(loc[nom], 'variable locale du n°1 absente : ' + nom);
  }
  for (const nom of ['texte', 'texte-2', 'doux', 'brun', 'brun-fonce']) {
    for (const fond of [VARS['or-haut'], VARS['or-milieu'], VARS['or-bas'], loc.creme]) {
      assert.ok(C.contraste(loc[nom], fond) >= 4.5, `${nom} ${loc[nom]} sur ${fond} = ${arrondi(C.contraste(loc[nom], fond))}`);
    }
  }
  // « Lire la source » garde sa patine foncée sur le doré, même en Nuit.
  for (const fond of [loc.source, loc['source-fonce']]) assert.ok(C.contraste(loc['sur-plein'], fond) >= 4.5, fond);
  assert.ok(C.contraste(loc.source, VARS['or-bas']) >= 3);
});

test('Rassis se détache du fond clair (Bronze et classique) ; en Nuit son liseré le délimite', () => {
  for (const nom of ['bronze', 'classique']) {
    for (const fond of ['fond', 'creme']) assert.ok(C.contraste(THEMES[nom]['rassis-fond'], THEMES[nom][fond]) >= 3, nom + ' ' + fond);
  }
  assert.match(css, /\.puce-rassis\{box-shadow:inset 0 0 0 1px color-mix\(in srgb,var\(--rassis-texte\)/);
});
