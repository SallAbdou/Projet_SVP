const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Lot 39 : Miette fait coucou sur l'accueil (survol, appui sur écran tactile), immobile si les animations sont coupées.
const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const html = lire('index.html');
const css = lire('parcours.css');
const grande = html.match(/<svg class="miette miette-grande"[\s\S]*?<\/svg>/)[0];

test('grande Miette : bras gauche, bras droit et jambes en trois tracés de même style que l’ancien tracé unique', () => {
  const membres = grande.match(/<path class="miette-membre[^"]*" d="[^"]*"><\/path>/g) || [];
  assert.deepEqual(membres, [
    '<path class="miette-membre miette-bras miette-bras-g" d="M14 76c-9-3-13-12-9-20"></path>',
    '<path class="miette-membre miette-bras miette-bras-d" d="M106 82c6 3 9 8 8 13"></path>',
    '<path class="miette-membre" d="M44 100v8M76 100v8"></path>'
  ]);
  assert.ok(grande.indexOf('miette-bras-d') < grande.indexOf('miette-mie'), 'membres dessinés derrière le corps');
  assert.match(grande, /role="img" aria-label="\{\{t\.mietteAlt\}\}"/);
});

test('petites Miette du chat : pas de bras, donc rien qui bouge', () => {
  const tetes = html.match(/<span class="chat-tete">[\s\S]*?<\/span>/g) || [];
  assert.ok(tetes.length >= 2);
  for (const t of tetes) assert.doesNotMatch(t, /miette-membre|miette-bras/);
});

test('CSS : chaque bras pivote autour de son épaule, au survol et avec la classe miette-coucou', () => {
  assert.match(css, /\.miette-bras\{transform-box:view-box\}/);
  assert.match(css, /\.miette-bras-g\{transform-origin:14px 76px\}/);
  assert.match(css, /\.miette-bras-d\{transform-origin:106px 82px\}/);
  assert.match(css, /\.miette-accueil:hover \.miette-bras-g,\.miette-coucou \.miette-bras-g\{animation:miette-coucou-g [^}]+\}/);
  assert.match(css, /\.miette-accueil:hover \.miette-bras-d,\.miette-coucou \.miette-bras-d\{animation:miette-coucou-d [^}]+\}/);
  for (const nom of ['miette-coucou-g', 'miette-coucou-d']) {
    const k = css.match(new RegExp('@keyframes ' + nom + '\\{([\\s\\S]*?\\})\\}'));
    assert.ok(k, nom);
    const angles = (k[1].match(/rotate\((-?\d+)deg\)/g) || []).map(a => Math.abs(parseInt(a.slice(7), 10)));
    assert.ok(angles.length >= 3, nom + ' : plusieurs allers-retours');
    assert.ok(Math.max(...angles) <= 25, nom + ' : petit angle');
    assert.match(k[1], /0%,100%\{transform:none\}/, nom + ' : part et revient au repos');
  }
});

test('CSS : Miette immobile avec prefers-reduced-motion (sauf choix on) ; data-animations="off" coupé par la règle générale', () => {
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{html:not\(\[data-animations="on"\]\) \.miette-accueil \.miette-bras\{animation:none\}\}/);
  assert.match(lire('charte.css'), /html\[data-animations="off"\] \*,html\[data-animations="off"\] \*::before,html\[data-animations="off"\] \*::after\{animation:none!important\}/);
});

function brancherCoucou() {
  const source = html.match(/function brancherCoucou\(root\) \{[\s\S]*?\n\}/);
  assert.ok(source, 'brancherCoucou dans index.html');
  return vm.runInNewContext('(' + source[0] + ')');
}

function fausseMiette() {
  const ecoute = {};
  const classes = new Set();
  const el = {
    ecoute, classes,
    addEventListener: (t, f) => { (ecoute[t] = ecoute[t] || []).push(f); },
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) },
    tirer: (t, e) => (ecoute[t] || []).forEach(f => f(e || {}))
  };
  return { el, root: { querySelector: s => (s === '.miette-accueil' ? el : null) } };
}

test('appui ou survol : classe miette-coucou posée, retirée à la fin du geste du bras droit', () => {
  const brancher = brancherCoucou();
  const { el, root } = fausseMiette();
  brancher(root);
  el.tirer('click');
  assert.ok(el.classes.has('miette-coucou'));
  el.tirer('animationend', { animationName: 'miette-coucou-g' });
  assert.ok(el.classes.has('miette-coucou'), 'attend la fin du dernier bras');
  el.tirer('animationend', { animationName: 'miette-coucou-d' });
  assert.ok(!el.classes.has('miette-coucou'));
  el.tirer('mouseenter');
  assert.ok(el.classes.has('miette-coucou'), 'le geste finit même si la souris part');
  // Aucun gestionnaire qui bloquerait le défilement tactile.
  assert.ok(!el.ecoute.touchstart && !el.ecoute.touchmove && !el.ecoute.pointerdown);
});

test('brancherCoucou : sans Miette dans la page, ne fait rien ; appelée après chaque rendu', () => {
  const brancher = brancherCoucou();
  assert.doesNotThrow(() => brancher({ querySelector: () => null }));
  assert.match(html, /afterRender\(root\) \{[\s\S]*?brancherCoucou\(root\);[\s\S]*?\n\}/);
  // Miette reste décorative : pas de bouton, pas de tabindex ajouté.
  assert.match(html, /<div class="miette-accueil">/);
});
