const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const A = require('../animations.js');
const Store = require('../store.js');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');

function memoire(initial) {
  const d = Object.assign({}, initial);
  return { getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, removeItem: k => { delete d[k]; }, d };
}
const CASSE = { getItem: () => { throw new Error('bloqué'); }, setItem: () => { throw new Error('bloqué'); } };

test('clé pq-animations, deux valeurs on et off', () => {
  assert.equal(A.CLE, 'pq-animations');
  assert.deepEqual(A.VALEURS, ['on', 'off']);
});

test('sans choix enregistré : on, sauf si le système demande de réduire les animations', () => {
  const st = memoire();
  assert.equal(A.lire(st, 'lea@x.fr', false), 'on');
  assert.equal(A.lire(st, 'lea@x.fr', true), 'off');
  assert.equal(A.lire(st, null, true), 'off');
});

test('enregistrer puis lire, par compte ; le choix explicite l’emporte sur le système', () => {
  const st = memoire();
  assert.equal(A.enregistrer(st, 'lea@x.fr', 'off'), true);
  assert.equal(A.enregistrer(st, 'rec2', 'on'), true);
  assert.equal(A.lire(st, 'lea@x.fr', false), 'off');
  assert.equal(A.lire(st, 'rec2', true), 'on');
  assert.equal(A.lire(st, 'autre@x.fr', false), 'on');
  assert.deepEqual(JSON.parse(st.d['pq-animations']), { version: 1, comptes: { 'lea@x.fr': 'off', rec2: 'on' } });
});

test('visiteur non connecté : choix gardé sous un compte anonyme', () => {
  const st = memoire();
  assert.equal(A.enregistrer(st, null, 'off'), true);
  assert.equal(A.lire(st, null, false), 'off');
  assert.equal(A.lire(st, 'lea@x.fr', false), 'on');
});

test('valeur inconnue, données abîmées ou stockage bloqué : retombe sur le défaut', () => {
  assert.equal(A.lire(memoire({ 'pq-animations': '{pas du json' }), 'a', false), 'on');
  assert.equal(A.lire(memoire({ 'pq-animations': JSON.stringify({ version: 1, comptes: { a: 'peut-etre' } }) }), 'a', true), 'off');
  assert.equal(A.lire(CASSE, 'a', false), 'on');
  assert.equal(A.enregistrer(CASSE, 'a', 'off'), false);
  const st = memoire();
  A.enregistrer(st, 'a', 'bof');
  assert.equal(A.lire(st, 'a', true), 'on');
});

test('cleCompte : même règle que le thème', () => {
  assert.equal(A.cleCompte({ email: ' Lea@X.fr ', abonneId: 'r' }), 'lea@x.fr');
  assert.equal(A.cleCompte({ abonneId: 'r' }), 'r');
  assert.equal(A.cleCompte(null), null);
});

test('appliquer pose data-animations sur <html>', () => {
  const attrs = {};
  const doc = { documentElement: { setAttribute: (k, v) => { attrs[k] = v; } } };
  A.appliquer(doc, 'off');
  assert.equal(attrs['data-animations'], 'off');
  A.appliquer(doc, 'n’importe');
  assert.equal(attrs['data-animations'], 'on');
});

test('libellés du bouton Tout chaud : nom accessible qui commence par le texte visible, bulle courte, FR et EN', () => {
  assert.deepEqual(A.libelles('fr', 'on', 'Tout chaud'), { nom: 'Tout chaud, mettre en pause l’animation', bulle: 'Mettre en pause' });
  assert.deepEqual(A.libelles('fr', 'off', 'Tout chaud'), { nom: 'Tout chaud, relancer l’animation', bulle: 'Relancer l’animation' });
  assert.deepEqual(A.libelles('en', 'on', 'Tout chaud'), { nom: 'Tout chaud, pause the animation', bulle: 'Pause' });
  assert.deepEqual(A.libelles('en', 'off', 'Tout chaud'), { nom: 'Tout chaud, resume the animation', bulle: 'Resume the animation' });
});

test('convertible : pas de bouton dans un lien, un bouton, un label ou une zone masquée', () => {
  const el = interdit => ({ closest: sel => (interdit && sel.split(',').map(s => s.trim()).includes(interdit) ? {} : null) });
  assert.equal(A.convertible(el(null)), true);
  for (const s of ['a', 'button', 'label', '[aria-hidden="true"]', '[inert]']) assert.equal(A.convertible(el(s)), false, s);
  assert.equal(A.convertible(null), false);
});

test('?demo=reset efface aussi la préférence d’animations', () => {
  assert.ok(Store.CLES_DEMO.includes('pq-animations'));
});

test('pages protégées : animations.js dans le head, juste après theme.js ; pages publiques à puces : avant boot.js', () => {
  for (const p of ['comptoir.html', 'fournee.html', 'garde-manger.html', 'fournil.html', 'profil.html']) {
    const h = lire(p);
    assert.match(h, /<script src="\/theme\.js"><\/script><script src="\/animations\.js"><\/script>/, p);
    assert.ok(h.indexOf('/animations.js') < h.indexOf('</head>'), p);
  }
  for (const p of ['index.html', 'ta-fournee-type.html', '404.html']) {
    const h = lire(p);
    assert.ok(h.includes('<script src="/animations.js"></script>'), p);
    assert.ok(h.indexOf('/animations.js') < h.indexOf('/boot.js'), p);
  }
});

test('CSS : data-animations="off" coupe toutes les animations ; le choix on passe outre la préférence système', () => {
  const css = lire('charte.css');
  assert.match(css, /html\[data-animations="off"\] \*,html\[data-animations="off"\] \*::before,html\[data-animations="off"\] \*::after\{animation:none!important\}/);
  const fichiers = ['charte.css', 'comptoir.html', 'fournee.html', 'fournil.html', 'garde-manger.html', '404.html', 'parcours.css'];
  for (const f of fichiers) {
    const t = lire(f);
    const blocs = t.match(/@media \(prefers-reduced-motion:\s*reduce\)\s*\{[^{}]*\{/g) || [];
    assert.ok(blocs.length > 0, f);
    for (const b of blocs) assert.match(b, /html:not\(\[data-animations="on"\]\)/, f + ' : ' + b);
  }
  // Vapeur de la 404 : reste visible, fixe (le four du comptoir est traité à part, voir plus bas).
  assert.match(lire('404.html'), /html\[data-animations="off"\] \.vapeur,html\[data-animations="off"\] \.lueur\{opacity:\.8\}/);
  assert.match(lire('comptoir.html'), /html\[data-animations="off"\] \.four-lien,html\[data-animations="off"\] \.four-lien:hover\{transition:none;transform:none\}/);
  assert.match(css, /html\[data-animations="off"\] \.btn-petrir:active\{transform:none\}/);
});

test('fournée : défilement doux vers le halo seulement si les animations sont actives', () => {
  const h = lire('fournee.html');
  assert.match(h, /getAttribute\('data-animations'\) === 'off'/);
});

test('bouton Tout chaud : aspect de puce, cible de 24 px, curseur main, sans pictogramme, bulle stylée', () => {
  const css = lire('charte.css');
  assert.match(css, /button\.puce-chaud\{[^}]*min-height:24px/);
  assert.match(css, /button\.puce-chaud\{[^}]*cursor:pointer/);
  assert.match(css, /button\.puce-chaud\{[^}]*font:inherit/);
  assert.match(css, /button\.puce-chaud:focus-visible\{outline:3px solid var\(--focus\)/);
  // Lot 24 bis : plus de pictogramme pause ou lecture, le bouton garde l'aspect exact d'une puce.
  assert.doesNotMatch(css, /puce-pause/);
  assert.doesNotMatch(lire('animations.js'), /puce-pause/);
  assert.match(css, /#pq-bulle-anim\{/);
});

test('profil : case Animations dans la section Apparence, FR et EN, branchée sur Animations', () => {
  const h = lire('profil.html');
  assert.match(h, /<input id="animations" type="checkbox"[^>]*onChange="\{\{choisirAnimations\}\}" \{\{animCoche\}\}>/);
  assert.ok(h.indexOf('id="animations"') > h.indexOf('id="apparence-t"') && h.indexOf('id="animations"') < h.indexOf('id="retour-t"'));
  assert.match(h, /animLabel: 'Animations activées'/);
  assert.match(h, /animLabel: 'Animations on'/);
  assert.match(h, /Animations\.enregistrer\(/);
  assert.match(h, /Animations\.appliquer\(document/);
});

// Lot 24 bis : le four du comptoir est dessiné par <use>. Ses clones vivent dans un arbre fantôme où <html> n'est
// pas un ancêtre : html[data-animations="off"] * ne les atteint pas. On bascule donc entre deux <svg> du DOM normal.
function symbole(h, id) {
  const m = h.match(new RegExp('<symbol id="' + id + '"[^>]*>([\\s\\S]*?)</symbol>'));
  assert.ok(m, 'symbole ' + id);
  return m[1];
}

test('comptoir : four figé de même dessin que le four animé, sans animation', () => {
  const h = lire('comptoir.html');
  const anime = symbole(h, 'pq-four');
  const fige = symbole(h, 'pq-four-fige');
  assert.match(anime, /class="four-vapeur"/);
  assert.match(anime, /class="four-lueur"/);
  assert.doesNotMatch(fige, /four-vapeur"|four-lueur|animation/);
  const dessin = s => s.replace(/ (class|style)="[^"]*"/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(dessin(fige), dessin(anime));
  assert.match(h, /\.four-vapeur-fixe\{[^}]*opacity:\.8/);
  assert.doesNotMatch(h.match(/\.four-vapeur-fixe\{[^}]*\}/)[0], /animation/);
});

test('comptoir : chaque four existe en version animée et figée, même taille, bascule par data-animations et prefers-reduced-motion', () => {
  const h = lire('comptoir.html');
  const anim = h.match(/<svg class="four-svg four-svg-anime" viewBox="0 0 200 170" aria-hidden="true" focusable="false"><use href="#pq-four"><\/use><\/svg>/g) || [];
  const fixe = h.match(/<svg class="four-svg four-svg-fixe" viewBox="0 0 200 170" aria-hidden="true" focusable="false"><use href="#pq-four-fige"><\/use><\/svg>/g) || [];
  assert.equal(anim.length, 2);
  assert.equal(fixe.length, 2);
  assert.equal((h.match(/<use href="#pq-four"/g) || []).length, 2, 'aucun four animé sans jumeau figé');
  assert.match(h, /\.four-svg-fixe\{display:none\}/);
  assert.ok(h.indexOf('.four-svg-fixe{display:none}') > h.indexOf('.four-svg{'), 'règle placée après .four-svg');
  assert.match(h, /html\[data-animations="off"\] \.four-svg-anime\{display:none\}html\[data-animations="off"\] \.four-svg-fixe\{display:block\}/);
  assert.match(h, /@media \(prefers-reduced-motion:reduce\)\{html:not\(\[data-animations="on"\]\) \.four-svg-anime\{display:none\}html:not\(\[data-animations="on"\]\) \.four-svg-fixe\{display:block\}/);
});

test('aucune animation CSS dans un <symbol> utilisé par <use> hors du comptoir figé', () => {
  for (const f of fs.readdirSync(RACINE).filter(n => n.endsWith('.html') && n !== 'index copy.html')) {
    const h = lire(f);
    if (!/<use /.test(h)) continue;
    assert.equal(f, 'comptoir.html', f + ' : <use> animé à couvrir comme le four du comptoir');
  }
});
