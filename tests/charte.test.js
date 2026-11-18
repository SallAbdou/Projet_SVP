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
  ['sur-plein', 'cuivre'], ['panneau-texte', 'panneau'], ['panneau-doux', 'panneau'], ['#F2C77A', 'panneau']
];
const GRAPHIQUE = [
  ['braise', 'sable'], ['source', 'creme'], ['barre-petrir', 'creme'], ['barre-rassis-contour', 'creme'],
  ['braise-vive', 'creme'], ['bord-champ', 'champ'], ['focus', 'fond'], ['focus', 'creme'], ['focus', 'sable'], ['cuivre', 'creme'],
  ['pain-bas', 'creme'], ['pain-bas', 'fond']
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

test('quatre thèmes déclarés, Bronze par défaut sur :root', () => {
  assert.ok(Object.keys(BLOCS.bronze || {}).length > 30, 'bloc :root,[data-theme="bronze"] absent');
  for (const nom of ['classique', 'nuit', 'contraste']) assert.ok(BLOCS[nom], nom);
});

test('Boulangerie classique reprend la palette d’avant le lot 13', () => {
  const c = THEMES.classique;
  assert.equal(c.fond, '#FBF5EA'); assert.equal(c.creme, '#FFFDF8'); assert.equal(c.texte, '#2E1D12');
  assert.equal(c.doux, '#6B5443'); assert.equal(c.brun, '#8A4F1C'); assert.equal(c['brun-fonce'], '#5E3412');
  assert.equal(c.braise, '#C2410C'); assert.equal(c.source, '#6E2A5E');
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

test('« Lire la source » en prune, distinct de la braise', () => {
  assert.equal(VARS.source, '#6E2A5E');
  assert.equal(VARS['source-fonce'], '#521F46');
});

test('bouton Pétrir en forme de pain : croûte, grignes, appui, focus, sans animation si réduit', () => {
  assert.match(css, /\.btn-petrir\{[^}]*var\(--pain-haut\)[^}]*var\(--pain-bas\)/);
  assert.match(css, /\.btn-petrir\{[^}]*color:var\(--pain-texte\)/);
  assert.match(css, /\.btn-petrir\{[^}]*min-height:44px/);
  assert.match(css, /\.btn-petrir::before\{[^}]*var\(--pain-grigne\)/);
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
  const loc = lireVars(regle[1]);
  assert.match(regle[1], /color:var\(--sur-clair\)/);
  for (const nom of ['texte', 'texte-2', 'doux', 'brun', 'brun-fonce']) {
    for (const fond of [VARS['or-haut'], VARS['or-bas'], loc.creme]) {
      assert.ok(C.contraste(loc[nom], fond) >= 4.5, `${nom} ${loc[nom]} sur ${fond} = ${arrondi(C.contraste(loc[nom], fond))}`);
    }
  }
  // « Lire la source » garde son prune foncé sur le doré, même en Nuit.
  for (const fond of [loc.source, loc['source-fonce']]) assert.ok(C.contraste(loc['sur-plein'], fond) >= 4.5, fond);
  assert.ok(C.contraste(loc.source, VARS['or-bas']) >= 3);
});
