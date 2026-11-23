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
  assert.match(lire('index.html'), /<a href="\/accessibilite">\{\{t\.accessibilite\}\}<\/a>/);
});

test('pages connectées : lien Accessibilité dans la nav, FR et EN', () => {
  const connectees = PAGES.filter(p => /data-nav\b/.test(lire(p)));
  assert.ok(connectees.length >= 5, connectees.join(', '));
  for (const p of connectees) assert.match(lire(p), /<script src="\/nav\.js"><\/script>/, p);
  assert.match(Nav.html({ lang: 'fr', page: 'comptoir', prenom: 'Léa' }), /<a href="\/accessibilite"[^>]*>Accessibilité<\/a>/);
  assert.match(Nav.html({ lang: 'en', page: 'comptoir', prenom: 'Léa' }), /<a href="\/accessibilite"[^>]*>Accessibility<\/a>/);
});
