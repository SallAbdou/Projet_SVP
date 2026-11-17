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

// Palette lue dans charte.css : chaque couple utilisé atteint son seuil (4,5 texte, 3 contours et barres).
const css = fs.readFileSync(path.join(RACINE, 'charte.css'), 'utf8');
const VARS = {};
css.replace(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g, (m, nom, hex) => { VARS[nom] = hex; });
const v = x => (x.charAt(0) === '#' ? x : VARS[x]);
const COUPLES = [
  ['texte', 'fond', 4.5], ['doux', 'fond', 4.5], ['doux', 'creme', 4.5], ['brun', 'fond', 4.5], ['sur-titre', 'fond', 4.5],
  ['#FFFFFF', 'braise', 4.5], ['#FFFFFF', 'braise-fonce', 4.5], ['chaud-texte', 'croute', 4.5], ['chaud-texte', 'braise-vive', 4.5],
  ['petrir-texte', 'petrir-fond', 4.5], ['rassis-texte', 'rassis-fond', 4.5], ['#FFFFFF', 'source', 4.5], ['#FFFFFF', 'source-fonce', 4.5],
  ['texte', 'croute', 4.5],
  ['braise', 'fond', 3], ['braise', 'sable', 3], ['source', 'creme', 3], ['source', '#E3A54A', 3],
  ['barre-petrir', 'creme', 3], ['barre-rassis', 'creme', 3], ['braise-vive', 'creme', 3]
];
for (const [a, b, seuil] of COUPLES) {
  test(`contraste ${a} sur ${b} >= ${seuil}`, () => {
    assert.ok(v(a) && v(b), `variable absente : ${!v(a) ? a : b}`);
    assert.ok(C.contraste(v(a), v(b)) >= seuil, `${v(a)} / ${v(b)} = ${arrondi(C.contraste(v(a), v(b)))}`);
  });
}

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
  assert.match(css, /\.ampoule\{[^}]*var\(--eclair\)/);
  for (const p of ['fournee.html', 'fournil.html']) {
    const h = fs.readFileSync(path.join(RACINE, p), 'utf8');
    assert.match(h, /<svg class="ampoule"[^>]*aria-hidden="true"[^>]*focusable="false"/, p);
  }
});
