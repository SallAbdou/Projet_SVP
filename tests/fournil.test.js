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

const ECRITS = require('../data/brouillons.json');
const ART = { ref: 'recX', rang: 3, titre: 'Un modèle open source rivalise avec les leaders', source: 'Blog', feu: 'orange', resume: 'Les performances se rapprochent des modèles fermés.', pourToi: 'Pour toi : parle du coût d’un projet client.' };

test('brouillonGenerique : structure pour chaque ton et langue', () => {
  for (const ton of F.TONS) for (const langue of F.LANGUES) {
    const t = F.brouillonGenerique(ART, ton, langue, 0);
    assert.ok(t.includes(ART.titre), ton + langue + ' titre');
    assert.ok(t.includes(ART.resume), ton + langue + ' résumé');
    assert.ok(t.includes('arle du coût d’un projet client.'), ton + langue + ' pour toi');
    assert.ok(!t.includes('Pour toi :'), ton + langue + ' préfixe retiré');
    assert.equal(t.split('\n').filter((l) => l.startsWith('→ ')).length, 3, ton + langue + ' puces');
    assert.ok(t.trim().endsWith('?'), ton + langue + ' question');
    const c = F.checklist(t, langue);
    assert.equal(c.pointDeVue, true, ton + langue + ' point de vue');
    assert.equal(c.chiffre, false, ton + langue + ' aucun chiffre inventé');
  }
});

test('brouillonGenerique : trois variantes qui tournent, tons distincts', () => {
  const v = [0, 1, 2, 3].map((n) => F.brouillonGenerique(ART, 'expert', 'fr', n));
  assert.equal(new Set(v.slice(0, 3)).size, 3);
  assert.equal(v[3], v[0]);
  assert.notEqual(F.brouillonGenerique(ART, 'retour', 'fr', 0), v[0]);
  assert.notEqual(F.brouillonGenerique(ART, 'provoc', 'fr', 0), v[0]);
});

test('brouillonGenerique : article sans résumé ni pour toi', () => {
  const t = F.brouillonGenerique({ ref: 'y', titre: 'Titre seul' }, 'provoc', 'en', 1);
  assert.ok(!/undefined|null/.test(t));
  assert.ok(t.includes('Titre seul'));
  assert.equal(t.split('\n').filter((l) => l.startsWith('→ ')).length, 3);
});

test('brouillons.json : 3 tons et 2 langues pour recDemo01 et recDemo02, checklist au vert', () => {
  for (const ref of ['recDemo01', 'recDemo02']) for (const ton of F.TONS) for (const langue of F.LANGUES) {
    const t = ECRITS[ref][ton][langue];
    assert.equal(typeof t, 'string', ref + ton + langue);
    const c = F.checklist(t, langue);
    const nom = ref + ' ' + ton + ' ' + langue;
    assert.ok(c.accroche, nom + ' accroche');
    assert.ok(c.chiffre, nom + ' chiffre');
    assert.ok(c.pointDeVue, nom + ' point de vue');
    assert.ok(c.question, nom + ' question');
    assert.equal(c.enTrop, 0, nom + ' longueur');
  }
});

test('proposerVariante : texte écrit puis variantes générées', () => {
  const a = { ref: 'recDemo01', titre: 'T', resume: 'R', pourToi: 'Pour toi : P' };
  assert.equal(F.nbVariantes('recDemo01', ECRITS), 4);
  assert.equal(F.nbVariantes('autre', ECRITS), 3);
  assert.equal(F.proposerVariante(a, 'provoc', 'en', 0, ECRITS), ECRITS.recDemo01.provoc.en);
  assert.equal(F.proposerVariante(a, 'provoc', 'en', 1, ECRITS), F.brouillonGenerique(a, 'provoc', 'en', 0));
  assert.equal(F.proposerVariante(a, 'provoc', 'en', 4, ECRITS), ECRITS.recDemo01.provoc.en);
  assert.equal(F.proposerVariante(ART, 'retour', 'fr', 4, ECRITS), F.brouillonGenerique(ART, 'retour', 'fr', 1));
  assert.equal(F.proposerVariante(ART, 'inconnu', 'de', 0, null), F.brouillonGenerique(ART, 'expert', 'fr', 0));
});

const Store = require('../store.js');

test('validerChiffres : saisie complète acceptée', () => {
  const r = F.validerChiffres({ impressions: '1 240', reactions: '52', republications: 7, commentaires: '0', contacts: '007' });
  assert.deepEqual(r.erreurs, {});
  assert.deepEqual(r.chiffres, { impressions: 1240, reactions: 52, republications: 7, commentaires: 0, contacts: 7 });
  assert.equal(F.validerChiffres({ impressions: '1 240', reactions: '1 000', republications: 0, commentaires: 0, contacts: 0 }).chiffres.reactions, 1000);
});

test('validerChiffres : champ vide = requis, valeur invalide = entier', () => {
  for (const v of ['12.5', '-3', '1e3', 'abc', '99999999999999999', 2.5, -1]) {
    const r = F.validerChiffres({ impressions: v, reactions: '1', republications: '1', commentaires: '1', contacts: '1' });
    assert.equal(r.chiffres, null, String(v));
    assert.deepEqual(r.erreurs, { impressions: 'entier' }, String(v));
  }
  assert.deepEqual(F.validerChiffres({ impressions: '  ', reactions: '1', republications: '1', commentaires: '1', contacts: '1' }).erreurs, { impressions: 'requis' });
});

test('validerChiffres : saisie absente', () => {
  const r = F.validerChiffres(null);
  assert.equal(r.chiffres, null);
  assert.deepEqual(Object.keys(r.erreurs), F.CHAMPS);
  assert.ok(Object.values(r.erreurs).every((e) => e === 'requis'));
});

test('validerChiffres : résultat accepté par Store.saisirChiffres', () => {
  let e = Store.publier(Store.etatInitial(), { ref: 'a', titre: 'T' }, '2026-11-17T10:00:00.000Z');
  const id = e.publies[0].id;
  e = Store.saisirChiffres(e, id, F.validerChiffres({ impressions: '10', reactions: '2', republications: '1', commentaires: '0', contacts: '1' }).chiffres);
  assert.equal(e.publies[0].chiffres.impressions, 10);
});

test('retrouverVariante : retrouve ton, langue et rang d’un brouillon non modifié', () => {
  const a = { ref: 'recDemo01', titre: 'T', resume: 'R', pourToi: 'Pour toi : P' };
  assert.deepEqual(F.retrouverVariante(a, ECRITS.recDemo01.retour.en + '\n', ECRITS), { ton: 'retour', langue: 'en', n: 0 });
  assert.deepEqual(F.retrouverVariante(ART, F.brouillonGenerique(ART, 'provoc', 'fr', 2), ECRITS), { ton: 'provoc', langue: 'fr', n: 2 });
  assert.equal(F.retrouverVariante(ART, 'Texte réécrit', ECRITS), null);
});
