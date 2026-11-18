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

test('profil.html : zone Affine ta fournée accessible, branchée sur retours.js', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const h = fs.readFileSync(path.join(__dirname, '..', 'profil.html'), 'utf8');
  assert.ok(h.indexOf('src="/retours.js"') > h.indexOf('src="/auth.js"'), 'retours.js chargé après auth.js');
  assert.match(h, /<label for="retour-texte"/);
  assert.match(h, /<textarea id="retour-texte"[^>]*aria-describedby="\{\{retourDecrit\}\}"/);
  assert.match(h, /<textarea id="retour-texte"[^>]*onInput="\{\{saisirRetour\}\}"/);
  assert.match(h, /<form[^>]*onSubmit="\{\{envoyerRetour\}\}"/);
  assert.match(h, /role="status"/);
  for (const s of ['Affine ta fournée', 'Envoyer mon retour', 'Tes derniers retours', 'Fine-tune your batch', 'Send my feedback', 'Your latest feedback'])
    assert.ok(h.includes(s), s);
  assert.ok(!h.includes('maxlength'), 'pas de maxlength : le dépassement doit pouvoir être expliqué');
});

test('profil.html (lot 15) : plus d’intro sous Apparence, nouvelle intro des retours en FR et EN', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const h = fs.readFileSync(path.join(__dirname, '..', 'profil.html'), 'utf8');
  assert.doesNotMatch(h, /apparenceIntro/);
  assert.doesNotMatch(h, /Choisis les couleurs du site/);
  assert.doesNotMatch(h, /Dis-nous ce que tu veux voir/);
  assert.match(h, /retourIntro: 'Si jamais ce que tu vois ne te convient pas, dis-nous comment l’améliorer !'/);
  assert.match(h, /retourIntro: 'If what you see doesn’t suit you, tell us how to make it better!'/);
});
