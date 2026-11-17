const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../fournil.js');

function art(ref, rang) { return { ref: ref, rang: rang, titre: 'T ' + ref, source: 'S', feu: 'vert', url: 'https://x.fr', resume: 'R', pourToi: 'Pour toi : P' }; }
function sauve(ref, savedAt) { return { ref: ref, titre: 'S ' + ref, source: 'S', feu: 'orange', url: 'https://x.fr', savedAt: savedAt }; }

test('trouverSujet : la fournée passe avant le garde-manger', () => {
  const r = F.trouverSujet('a', [art('a', 1)], [sauve('a', '2026-11-17T08:00:00.000Z')]);
  assert.equal(r.origine, 'fournee');
  assert.equal(r.article.titre, 'T a');
});

test('trouverSujet : sujet seulement mis de côté', () => {
  const r = F.trouverSujet('b', [art('a', 1)], [sauve('b', '2026-11-17T08:00:00.000Z')]);
  assert.equal(r.origine, 'garde-manger');
  assert.equal(r.article.titre, 'S b');
});

test('trouverSujet : ref absente, vide ou non chaîne', () => {
  assert.equal(F.trouverSujet('z', [art('a', 1)], []), null);
  assert.equal(F.trouverSujet('', [art('', 1)], []), null);
  assert.equal(F.trouverSujet(null, [art('a', 1)], []), null);
  assert.equal(F.trouverSujet('a', null, undefined), null);
});

test('listeChoix : news par rang, mis de côté récents d’abord sans doublon', () => {
  const l = F.listeChoix([art('c', 3), art('a', 1), art('b', 2)], [
    sauve('x', '2026-11-15T08:00:00.000Z'), sauve('a', '2026-11-17T08:00:00.000Z'), sauve('y', '2026-11-16T08:00:00.000Z')
  ]);
  assert.deepEqual(l.jour.map((a) => a.ref), ['a', 'b', 'c']);
  assert.deepEqual(l.cotes.map((a) => a.ref), ['y', 'x']);
});

test('listeChoix : entrées invalides', () => {
  assert.deepEqual(F.listeChoix(null, 'x'), { jour: [], cotes: [] });
});

test('checklist : texte vide ou blanc', () => {
  for (const t of ['', '   ', null]) {
    const c = F.checklist(t, 'fr');
    assert.equal(c.accroche || c.chiffre || c.pointDeVue || c.question, false);
    assert.equal(c.longueur, t ? t.length : 0);
    assert.equal(c.max, 3000);
    assert.equal(c.enTrop, 0);
  }
});

test('checklist : accroche de 120 caractères au plus, premier paragraphe', () => {
  assert.equal(F.checklist('a'.repeat(120) + '\n\nsuite', 'fr').accroche, true);
  assert.equal(F.checklist('a'.repeat(121) + '\n\nsuite', 'fr').accroche, false);
  assert.equal(F.checklist('court\nencore\n  \nsuite très longue ' + 'x'.repeat(200), 'fr').accroche, true);
});

test('checklist : chiffre présent', () => {
  assert.equal(F.checklist('3 outils', 'fr').chiffre, true);
  assert.equal(F.checklist('trois outils', 'fr').chiffre, false);
});

test('checklist : point de vue en français', () => {
  for (const t of ['Je pense', 'j’ai vu', "J'ai vu", 'selon mon client', 'mes clients']) assert.equal(F.checklist(t, 'fr').pointDeVue, true, t);
  for (const t of ['jeudi', 'le monde', 'une mesure', 'déjeuner']) assert.equal(F.checklist(t, 'fr').pointDeVue, false, t);
});

test('checklist : point de vue en anglais', () => {
  for (const t of ['I think', "I'm sure", 'my clients', 'My take']) assert.equal(F.checklist(t, 'en').pointDeVue, true, t);
  for (const t of ['i think', 'a myth', 'Iris']) assert.equal(F.checklist(t, 'en').pointDeVue, false, t);
});

test('checklist : question à la fin', () => {
  assert.equal(F.checklist('Et toi ?  \n', 'fr').question, true);
  assert.equal(F.checklist('? fin', 'fr').question, false);
});

test('checklist : longueur et dépassement', () => {
  const c = F.checklist('a'.repeat(3001), 'fr');
  assert.equal(c.longueur, 3001);
  assert.equal(c.enTrop, 1);
  assert.equal(F.checklist('a'.repeat(3000), 'fr').enTrop, 0);
});

test('apercu : texte court inchangé', () => {
  assert.deepEqual(F.apercu('Bonjour'), { texte: 'Bonjour', coupe: false });
});

test('apercu : coupé à la dernière espace avant 210', () => {
  const mots = [];
  while (mots.join(' ').length < 300) mots.push('mot' + mots.length);
  const a = F.apercu(mots.join(' '));
  assert.equal(a.coupe, true);
  assert.ok(a.texte.length <= 210);
  assert.equal(a.texte, a.texte.trim());
  assert.ok(mots.join(' ').startsWith(a.texte + ' '));
});

test('apercu : mot unique coupé net', () => {
  const a = F.apercu('x'.repeat(300));
  assert.equal(a.texte.length, 210);
  assert.equal(a.coupe, true);
});

test('texteModifie : ignore les espaces de bord', () => {
  assert.equal(F.texteModifie('a ', ' a'), false);
  assert.equal(F.texteModifie('a', 'b'), true);
});
