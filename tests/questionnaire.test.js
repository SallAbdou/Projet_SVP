const test = require('node:test');
const assert = require('node:assert/strict');
const Q = require('../questionnaire.js');

const complet = {
  prenom: 'Sam', email: 'sam@exemple.fr', metiers: ['Formateur'], thematiques: ['LLMs', 'Vidéo'],
  relation: 'Marié', langue: 'English all the way', newsletter: true, rgpd: true
};
const avec = o => Object.assign({}, complet, o);

test('choix repris du Tally', () => {
  assert.deepEqual(Q.CHOIX.metiers, ['Entrepreneur', 'Consultant', 'Influenceur', 'Formateur', 'Étudiant', 'Autre']);
  assert.equal(Q.CHOIX.thematiques.length, 12);
  assert.ok(Q.CHOIX.thematiques.includes('Automatisation et agents') && Q.CHOIX.thematiques.includes('Ingénierie R&D'));
  assert.deepEqual(Q.CHOIX.relations, ['Timide', 'En couple', 'Marié']);
  assert.deepEqual(Q.CHOIX.langues, ['Je veux des sources françaises uniquement', 'Je veux des sources polyglottes avec une traduction française', 'English all the way']);
  assert.equal(Q.NB_ETAPES, 6);
});

test('un questionnaire complet passe toutes les étapes', () => {
  for (let n = 1; n <= 6; n++) assert.deepEqual(Q.etapeValide(n, complet), { ok: true, erreurs: {} }, 'étape ' + n);
});

test('étape 1 : prénom et e-mail', () => {
  assert.deepEqual(Q.etapeValide(1, avec({ prenom: '  ', email: '' })).erreurs, { prenom: 'requis', email: 'requis' });
  assert.deepEqual(Q.etapeValide(1, avec({ email: 'sam@exemple' })).erreurs, { email: 'invalide' });
});

test('étapes 2 et 3 : au moins un choix connu', () => {
  assert.deepEqual(Q.etapeValide(2, avec({ metiers: [] })).erreurs, { metiers: 'requis' });
  assert.deepEqual(Q.etapeValide(2, avec({ metiers: ['Boulanger'] })).erreurs, { metiers: 'inconnu' });
  assert.deepEqual(Q.etapeValide(3, avec({ thematiques: [] })).erreurs, { thematiques: 'requis' });
  assert.deepEqual(Q.etapeValide(3, avec({ thematiques: ['LLMs', 'Pâtisserie'] })).erreurs, { thematiques: 'inconnu' });
});

test('étapes 4 et 5 : un choix connu', () => {
  assert.deepEqual(Q.etapeValide(4, avec({ relation: '' })).erreurs, { relation: 'requis' });
  assert.deepEqual(Q.etapeValide(4, avec({ relation: 'Divorcé' })).erreurs, { relation: 'inconnu' });
  assert.deepEqual(Q.etapeValide(5, avec({ langue: '' })).erreurs, { langue: 'requis' });
  assert.deepEqual(Q.etapeValide(5, avec({ langue: 'Klingon' })).erreurs, { langue: 'inconnu' });
});

test('étape 6 : les deux consentements', () => {
  assert.deepEqual(Q.etapeValide(6, avec({ newsletter: false, rgpd: false })).erreurs, { newsletter: 'requis', rgpd: 'requis' });
  assert.deepEqual(Q.etapeValide(6, avec({ rgpd: false })).erreurs, { rgpd: 'requis' });
});

test('étape hors bornes', () => {
  assert.equal(Q.etapeValide(0, complet).ok, false);
  assert.equal(Q.etapeValide(7, complet).ok, false);
});

test('nombreDeNews', () => {
  assert.equal(Q.nombreDeNews('Timide'), 3);
  assert.equal(Q.nombreDeNews('En couple'), 5);
  assert.equal(Q.nombreDeNews('Marié'), 7);
  assert.equal(Q.nombreDeNews(''), 5);
});

test('profilDepuis garde ce qu\'attend auth.js', () => {
  assert.deepEqual(Q.profilDepuis(avec({ prenom: ' Sam ', email: ' sam@exemple.fr ' })), {
    prenom: 'Sam', email: 'sam@exemple.fr', metiers: ['Formateur'], thematiques: ['LLMs', 'Vidéo'], relation: 'Marié', langue: 'English all the way'
  });
});

test('brouillon : aller-retour, valeurs abîmées et stockage cassé', () => {
  const mem = {};
  const st = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
  assert.equal(Q.CLE_BROUILLON, 'pq-questionnaire');
  assert.deepEqual(Q.chargerBrouillon(st), { etape: 1, reponses: Q.reponsesVides() });
  const b = { etape: 4, reponses: complet };
  assert.equal(Q.enregistrerBrouillon(st, b), true);
  assert.deepEqual(Q.chargerBrouillon(st), b);
  mem['pq-questionnaire'] = JSON.stringify({ etape: 42, reponses: { prenom: 3, metiers: 'x', thematiques: ['LLMs', 7], newsletter: 'oui' } });
  assert.deepEqual(Q.chargerBrouillon(st), { etape: 1, reponses: Object.assign(Q.reponsesVides(), { thematiques: ['LLMs'] }) });
  mem['pq-questionnaire'] = '{cassé';
  assert.deepEqual(Q.chargerBrouillon(st), { etape: 1, reponses: Q.reponsesVides() });
  Q.effacerBrouillon(st);
  assert.ok(!('pq-questionnaire' in mem));
  const boom = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  assert.deepEqual(Q.chargerBrouillon(boom), { etape: 1, reponses: Q.reponsesVides() });
  assert.equal(Q.enregistrerBrouillon(boom, b), false);
  assert.doesNotThrow(() => Q.effacerBrouillon(boom));
});

test('libellés anglais des choix du Tally', () => {
  assert.equal(Q.libelle('Vidéo', 'en'), 'Video');
  assert.equal(Q.libelle('Vidéo', 'fr'), 'Vidéo');
  assert.equal(Q.libelle('Inconnu', 'en'), 'Inconnu');
  assert.equal(Q.libelle('LLMs', 'en'), 'LLMs');
  for (const cle of ['metiers', 'thematiques', 'relations', 'langues']) {
    for (const v of Q.CHOIX[cle]) assert.equal(typeof Q.LIBELLES_EN[v], 'string', v);
  }
});
