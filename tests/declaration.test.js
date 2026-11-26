// Lot 26 : déclaration d'accessibilité (/accessibilite) et lien vers elle sur toutes les pages concernées.
// Les garde-fous du lot 25 (tests/gardefous.test.js) parcourent déjà la nouvelle page.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Parcours = require('../parcours.js');
const Nav = require('../nav.js');
const Config = require('../config.js');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8').replace(/\r\n/g, '\n');
const PAGES = fs.readdirSync(RACINE).filter(f => f.endsWith('.html') && f !== 'index copy.html');

// Pages sans pied de page, avec leur justification.
const SANS_PIED = {
  'qr.html': 'support de présentation imprimable, plein écran, sans en-tête ; limite écrite dans la déclaration',
  'index.html': 'pied de page propre à l’accueil, lien écrit en dur (vérifié plus bas)'
};

test('la page /accessibilite existe, en FR et en EN, avec un seul h1', () => {
  const h = lire('accessibilite.html');
  assert.match(h, /<html lang="fr">/);
  assert.match(h, /<meta name="pq-titre-en" content="Accessibility · /);
  assert.equal((h.match(/<h1\b/g) || []).length, 1);
  assert.match(h, /statut: 'Partiellement conforme'/);
  assert.match(h, /statut: 'Partially compliant'/);
  assert.match(h, /WCAG 2\.2/);
});

test('déclaration : mêmes textes en français et en anglais', () => {
  const h = lire('accessibilite.html');
  const src = /\nvar T = (\{[\s\S]*?\n\});\n/.exec(h);
  assert.ok(src, 'objet T introuvable');
  const T = new Function('return ' + src[1])();
  const forme = v => Array.isArray(v) ? v.map(forme) : (v && typeof v === 'object') ? Object.keys(v).sort().map(k => [k, forme(v[k])]) : typeof v;
  assert.deepEqual(forme(T.fr), forme(T.en));
});

test('déclaration : aucun taux de conformité inventé', () => {
  const h = lire('accessibilite.html');
  assert.doesNotMatch(h, /\d+\s?%\s*(des critères|de conformité|conforme|of (the )?criteria|compliant)/i);
});

test('contact : emplacement à compléter dans config.js, jamais d’adresse inventée', () => {
  assert.equal(Config.DEFAUT.contactAccessibilite, '');
  assert.match(lire('config.js'), /contactAccessibilite: '',\s*\/\/ À COMPLÉTER/);
  assert.doesNotMatch(lire('accessibilite.html'), /mailto:[^'"{]/);
});

test('pied commun : liens Confidentialité et Accessibilité, page courante marquée', () => {
  const fr = Parcours.piedHtml({ lang: 'fr', chemin: '/accessibilite' });
  assert.match(fr, /<a href="\/confidentialite">Confidentialité<\/a>/);
  assert.match(fr, /<a href="\/accessibilite" aria-current="page">Accessibilité<\/a>/);
  const en = Parcours.piedHtml({ lang: 'en', chemin: '/confidentialite.html' });
  assert.match(en, /<a href="\/confidentialite" aria-current="page">Privacy<\/a>/);
  assert.match(en, /<a href="\/accessibilite">Accessibility<\/a>/);
  assert.doesNotMatch(Parcours.piedHtml({ lang: 'fr', chemin: '/' }), /aria-current/);
});

test('toutes les pages publiques ont le pied commun (ou un lien en dur)', () => {
  const publiques = PAGES.filter(p => !/data-nav\b/.test(lire(p)));
  assert.ok(publiques.length >= 11, publiques.join(', '));
  for (const p of publiques) {
    const h = lire(p);
    if (SANS_PIED[p]) continue;
    assert.match(h, /<(footer|span)\b[^>]*\sdata-pied\b/, p + ' : pied commun absent');
    assert.match(h, /<script src="\/parcours\.js"><\/script>/, p + ' : parcours.js non chargé');
  }
});

// Lot 36 : sur l'accueil, Confidentialité et Accessibilité deviennent deux boutons secondaires encadrés dans le pied.
test('accueil : Confidentialité et Accessibilité en encadrés côte à côte dans le pied', () => {
  const h = lire('index.html');
  const pied = h.match(/<footer class="pied pied-lanceur">[\s\S]*?<\/footer>/)[0];
  const groupe = pied.match(/<div class="pied-encadres">([\s\S]*?)<\/div>/);
  assert.ok(groupe, 'groupe .pied-encadres absent du pied');
  assert.match(groupe[1], /<a class="bouton-secondaire" href="\/confidentialite">\{\{t\.confidentialite\}\}<\/a>/);
  assert.match(groupe[1], /<a class="bouton-secondaire" href="\/accessibilite">\{\{t\.accessibilite\}\}<\/a>/);
  // Plus de lien simple en double dans le pied.
  assert.equal((pied.match(/href="\/accessibilite"/g) || []).length, 1);
  assert.equal((pied.match(/href="\/confidentialite"/g) || []).length, 1);
});

test('encadrés du pied : 44 px mini, côte à côte, empilés sur mobile', () => {
  const css = lire('parcours.css');
  assert.match(css, /\.pied-encadres\{[^}]*display:flex[^}]*\}/);
  assert.match(css, /\.pied-encadres \.bouton-secondaire\{[^}]*min-height:44px[^}]*\}/);
  const mobile = css.match(/@media \(max-width:640px\)\{[\s\S]*?\n\}/)[0];
  assert.match(mobile, /\.pied-encadres\{[^}]*flex-direction:column[^}]*\}/);
});

// Lot 36 : choix de l'utilisateur, plus de lien Accessibilité dans la nav des pages connectées ;
// la déclaration reste joignable depuis le profil (section Apparence).
test('pages connectées : plus de lien Accessibilité dans la nav, FR et EN', () => {
  const connectees = PAGES.filter(p => /data-nav\b/.test(lire(p)));
  assert.ok(connectees.length >= 5, connectees.join(', '));
  for (const p of connectees) assert.match(lire(p), /<script src="\/nav\.js"><\/script>/, p);
  for (const lang of ['fr', 'en']) {
    for (const page of ['comptoir', 'fournee', 'fournil', 'garde-manger', 'profil']) {
      assert.doesNotMatch(Nav.html({ lang, page, prenom: 'Léa' }), /\/accessibilite/, lang + ' ' + page);
    }
  }
});

test('profil : lien vers la déclaration dans la section Apparence, FR et EN', () => {
  const h = lire('profil.html');
  const section = h.match(/<section aria-labelledby="apparence-t"[\s\S]*?<\/section>/)[0];
  assert.match(section, /<a class="pf-lien" href="\/accessibilite">\{\{t\.accessibiliteLien\}\}<\/a>/);
  assert.match(h, /accessibiliteLien: 'Lire la déclaration d’accessibilité'/);
  assert.match(h, /accessibiliteLien: 'Read the accessibility statement'/);
  assert.match(h, /\.pf-lien\{[^}]*min-height:44px[^}]*\}/);
});
