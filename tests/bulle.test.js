const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Bulle = require('../bulle.js');

const ECRAN = { largeur: 1280, hauteur: 800 };
const cible = (left, top, w, h) => ({ left: left, top: top, right: left + w, bottom: top + h, width: w, height: h });

test('placer : sous le nom, alignée à gauche, avec un écart', () => {
  const p = Bulle.placer(cible(100, 200, 80, 20), { largeur: 300, hauteur: 60 }, ECRAN);
  assert.deepEqual(p, { left: 100, top: 228, dessus: false });
});

test('placer : au-dessus quand la place manque en bas', () => {
  const p = Bulle.placer(cible(100, 760, 80, 20), { largeur: 300, hauteur: 60 }, ECRAN);
  assert.deepEqual(p, { left: 100, top: 692, dessus: true });
});

test('placer : ne déborde ni à droite ni à gauche de l’écran', () => {
  assert.equal(Bulle.placer(cible(1200, 100, 60, 20), { largeur: 300, hauteur: 60 }, ECRAN).left, 1280 - 300 - 8);
  assert.equal(Bulle.placer(cible(-30, 100, 60, 20), { largeur: 300, hauteur: 60 }, ECRAN).left, 8);
});

test('placer : écran de téléphone, bulle plus large que la place disponible collée à la marge', () => {
  const p = Bulle.placer(cible(40, 300, 80, 20), { largeur: 359, hauteur: 80 }, { largeur: 375, hauteur: 812 });
  assert.equal(p.left, 8);
});

test('placer : ni dessous ni dessus ne suffisent, reste dans l’écran', () => {
  const p = Bulle.placer(cible(100, 50, 80, 20), { largeur: 300, hauteur: 780 }, ECRAN);
  assert.ok(p.top >= 8 && p.top + 780 <= 800 - 8 || p.top === 8, JSON.stringify(p));
});

test('fournee.html : noms des critères en boutons d’aide reliés à leur bulle', () => {
  const h = fs.readFileSync(path.join(__dirname, '..', 'fournee.html'), 'utf8');
  for (const n of [1, 2, 3]) {
    assert.match(h, new RegExp('<button type="button" class="jauge-aide" aria-describedby="ja' + n + '-\{\{s\.id\}\}">'));
    assert.match(h, new RegExp('<span id="ja' + n + '-\{\{s\.id\}\}" role="tooltip" class="pq-cache">\{\{s\.j' + n + 'Aide\}\}</span>'));
  }
  assert.doesNotMatch(h, /class="jauge-aide"[^>]*title=/);
  assert.match(h, /<div id="pq-bulle" class="bulle" aria-hidden="true" hidden><\/div>/);
  assert.match(h, /<script src="\/bulle\.js"><\/script>/);
  assert.match(h, /s\['j' \+ \(i \+ 1\) \+ 'Aide'\] = t\.aides\[j\.cle\]/);
  assert.match(h, /\.bulle\{[^}]*position:fixed/);
  assert.match(h, /\.bulle\{[^}]*font-family:'DM Sans'/, 'la bulle est hors de #root : police du site à reprendre');
  assert.match(h, /\.jauge-aide:focus-visible\{[^}]*outline/);
});

test('fournee.html : textes d’aide dans les chaînes FR et EN', () => {
  const h = fs.readFileSync(path.join(__dirname, '..', 'fournee.html'), 'utf8');
  const fr = [
    'Le sujet sera-t-il encore valable dans une semaine\u00a0?',
    'Ton client est-il prêt à payer pour être aidé là-dessus\u00a0? Y a-t-il une valeur ajoutée pour lui\u00a0? Est-ce que ça l’instruit\u00a0?',
    'Le sujet mène-t-il à une offre payante, monétisable pour toi via tes posts LinkedIn\u00a0?'
  ];
  assert.ok(h.includes("aides: { durabilite: '" + fr[0] + "', propension: '" + fr[1] + "', lienOffre: '" + fr[2] + "' }"), 'aides FR');
  assert.match(h, /aides: \{ durabilite: 'Will the topic still hold up in a week\?', propension: '[^']+\?', lienOffre: '[^']+LinkedIn posts\?' \}/);
});

test('bulle.js : fermeture par Échap, ouverture au survol, au focus et au doigt', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'bulle.js'), 'utf8');
  for (const ev of ['mouseover', 'mouseout', 'focusin', 'focusout', 'click', 'keydown', 'resize', 'scroll']) {
    assert.ok(js.includes("addEventListener('" + ev + "'"), ev);
  }
  assert.match(js, /'Escape'/);
});

// Lot 24 (1.4.13) : la bulle doit rester ouverte quand la souris passe du bouton à la bulle.
test('resteOuverte : vers le bouton ou la bulle oui, ailleurs non', () => {
  const texte = {}, ailleurs = {};
  const btn = { contains: el => el === btn };
  const bulle = { contains: el => el === bulle || el === texte };
  assert.equal(Bulle.resteOuverte(bulle, btn, bulle), true);
  assert.equal(Bulle.resteOuverte(texte, btn, bulle), true);
  assert.equal(Bulle.resteOuverte(btn, btn, bulle), true);
  assert.equal(Bulle.resteOuverte(ailleurs, btn, bulle), false);
  assert.equal(Bulle.resteOuverte(null, btn, bulle), false);
});

test('bulles survolables : pas de pointer-events:none, pont sur l écart', () => {
  const fournee = fs.readFileSync(path.join(__dirname, '..', 'fournee.html'), 'utf8');
  const regle = fournee.match(/\.bulle\{[^}]*\}/)[0];
  assert.ok(!/pointer-events:none/.test(regle));
  assert.match(fournee, /\.bulle::before\{/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'charte.css'), 'utf8'), /#pq-bulle-anim::before\{/);
});
