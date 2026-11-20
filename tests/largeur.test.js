// Lot 22 : largeur bornée des pages connectées sur grand écran.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const css = lire('charte.css');
const PAGES = ['comptoir', 'fournee', 'fournil', 'garde-manger', 'profil'];

test('charte : variable unique --largeur-contenu à 1440 px', () => {
  const m = css.match(/--largeur-contenu:\s*([^;}]+)/g) || [];
  assert.equal(m.length, 1);
  assert.match(m[0], /--largeur-contenu:\s*1440px/);
});

test('charte : le main qui suit le menu est borné et centré', () => {
  assert.match(css, /\[data-nav\]\+main\{[^}]*max-width:var\(--largeur-contenu\)/);
  assert.match(css, /\[data-nav\]\+main\{[^}]*margin-inline:auto/);
});

test('charte : au-dessus de 900 px le menu ne grandit plus (l\'espace libre va aux marges du main)', () => {
  assert.match(css, /@media \(min-width:900px\)\{\[data-nav\]\{flex-grow:0!important\}\}/);
});

test('charte : paragraphes du main bornés à 70ch, sauf encadrés pq-pleine', () => {
  assert.match(css, /\[data-nav\]\+main p:not\(\.pq-pleine\)\{max-width:70ch\}/);
});

test('les 5 pages connectées ont le menu juste avant le main, chacune une fois', () => {
  for (const p of PAGES) {
    const h = lire(p + '.html');
    assert.equal((h.match(/<main[ >]/g) || []).length, 1, p);
    assert.match(h, /<nav data-nav[^>]*><\/nav>\r?\n<main[ >]/, p);
  }
});

test('encadrés en pleine largeur : phrase du comptoir et état vide du fournil', () => {
  assert.match(lire('comptoir.html'), /<p class="pq-pleine" style="margin:0;padding:12px 16px;border-radius:12px;background:var\(--miel\)/);
  assert.match(lire('fournil.html'), /<p class="pq-pleine"[^>]*>\{\{t\.perfVide\}\}<\/p>/);
});

test('comptoir : le graphique garde une hauteur fixe', () => {
  assert.match(lire('comptoir.html'), /class="bars" style="[^"]*height:220px/);
});
