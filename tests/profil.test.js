const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../profil.js');
const Q = require('../questionnaire.js');

const lea = {
  prenom: 'Léa', email: 'lea@demo.painquotidien.fr',
  profil: {
    metiers: ['Consultant'],
    thematiques: ['Automatisation et agents', 'IA en entreprise', 'LLMs'],
    relation: 'En couple',
    langue: 'Je veux des sources françaises uniquement'
  }
};
const paires = l => l.map(x => [x.label, x.valeur]);

test('lignes FR : informations puis préférences, libellé / valeur', () => {
  const l = P.lignes(lea, 'fr', Q.libelle);
  assert.deepEqual(paires(l.infos), [['Prénom', 'Léa'], ['E-mail', 'lea@demo.painquotidien.fr']]);
  assert.deepEqual(paires(l.prefs), [
    ['Métier', 'Consultant'],
    ['Thématiques', 'Automatisation et agents, IA en entreprise, LLMs'],
    ['Relation avec l’IA', 'En couple (à l’aise avec l’IA)'],
    ['Langue des articles', 'Sources françaises uniquement']
  ]);
});

test('lignes EN : libellés et valeurs traduits', () => {
  const l = P.lignes(lea, 'en', Q.libelle);
  assert.deepEqual(paires(l.infos), [['First name', 'Léa'], ['Email', 'lea@demo.painquotidien.fr']]);
  assert.deepEqual(l.prefs.map(x => x.label), ['Job', 'Topics', 'Relationship with AI', 'Article language']);
  assert.equal(l.prefs[0].valeur, Q.libelle('Consultant', 'en'));
  assert.equal(l.prefs[2].valeur, 'In a relationship (comfortable with AI)');
  assert.equal(l.prefs[3].valeur, 'French sources only');
});

test('valeurs absentes : « Non renseigné » / « Not set »', () => {
  for (const u of [null, undefined, {}, { prenom: '', email: '', profil: { metiers: [], thematiques: [], relation: '', langue: '' } }]) {
    const fr = P.lignes(u, 'fr', Q.libelle);
    assert.ok(fr.infos.concat(fr.prefs).every(x => x.valeur === 'Non renseigné'), JSON.stringify(u));
    assert.ok(P.lignes(u, 'en', Q.libelle).prefs.every(x => x.valeur === 'Not set'));
  }
});

test('valeur inconnue du questionnaire : affichée telle quelle', () => {
  const u = { prenom: 'Sam', email: 's@x.fr', profil: { metiers: ['Boulanger'], thematiques: [], relation: 'Compliqué', langue: 'Autre' } };
  const l = P.lignes(u, 'fr', Q.libelle);
  assert.equal(l.prefs[0].valeur, 'Boulanger');
  assert.equal(l.prefs[2].valeur, 'Compliqué');
  assert.equal(l.prefs[3].valeur, 'Autre');
});
