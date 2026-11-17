const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../auth.js');
const P = A.pur;
const T0 = '2026-11-17T09:00:00.000Z';
const plus = s => new Date(Date.parse(T0) + s * 1000).toISOString();
const profil = { prenom: 'Sam', email: 'sam@exemple.fr', metiers: ['Formateur'], thematiques: ['LLMs'], relation: 'Timide', langue: 'English all the way' };
const fixe = () => 0.5;
const ID = 'abcdefghijklmnop';

function inscrit() { return P.inscrire(A.etatInitial(), profil, T0, ID).etat; }
function actif() { return P.definirMotDePasse(inscrit(), 'Croissant8', T0).etat; }

test('état initial : compte de démo actif, pas de session', () => {
  const e = A.etatInitial();
  assert.equal(e.version, 1);
  assert.deepEqual(e.comptes, [A.COMPTE_DEMO]);
  assert.equal(e.session, null);
  assert.equal(e.demande, null);
  assert.equal(A.COMPTE_DEMO.email, 'lea@demo.painquotidien.fr');
  assert.equal(A.COMPTE_DEMO.prenom, 'Léa');
  assert.equal(A.COMPTE_DEMO.statut, 'actif');
  assert.equal(A.COMPTE_DEMO.abonneId, 'demoLea0000000001');
  assert.deepEqual(A.COMPTE_DEMO.profil, { metiers: ['Consultant'], thematiques: ['Automatisation et agents', 'IA en entreprise', 'LLMs'], relation: 'En couple', langue: 'Je veux des sources françaises uniquement' });
  assert.equal(A.CLE, 'pq-auth');
});

test('reglesMotDePasse', () => {
  assert.deepEqual(A.reglesMotDePasse('abc'), { longueur: false, majuscule: false, chiffre: false, ok: false });
  assert.deepEqual(A.reglesMotDePasse('Croissant8'), { longueur: true, majuscule: true, chiffre: true, ok: true });
  assert.equal(A.reglesMotDePasse('croissant8').ok, false);
  assert.equal(A.reglesMotDePasse('Croissant').ok, false);
  assert.equal(A.reglesMotDePasse(null).ok, false);
});

test('emailValide', () => {
  assert.equal(A.emailValide('a@b.fr'), true);
  for (const m of ['a b@c.fr', 'ab.fr', '', 'a@b', null]) assert.equal(A.emailValide(m), false, String(m));
});

test('genererIdentifiant', () => {
  assert.match(A.genererIdentifiant(fixe), /^[A-Za-z0-9]{16}$/);
  let i = 0;
  const suite = () => (i++ % 62) / 62;
  assert.equal(new Set(A.genererIdentifiant(suite)).size, 16);
});

test('inscrire puis definirMotDePasse ouvre la session', () => {
  const r1 = P.inscrire(A.etatInitial(), profil, T0, ID);
  assert.equal(r1.erreur, null);
  assert.deepEqual(r1.etat.demande, { email: 'sam@exemple.fr', motif: 'inscription' });
  const c = A.compteParEmail(r1.etat, 'SAM@exemple.fr');
  assert.equal(c.statut, 'a-confirmer');
  assert.equal(c.abonneId, ID);
  assert.equal(c.inscritLe, T0);
  assert.deepEqual(c.profil, { metiers: ['Formateur'], thematiques: ['LLMs'], relation: 'Timide', langue: 'English all the way' });
  const r2 = P.definirMotDePasse(r1.etat, 'Croissant8', T0);
  assert.equal(r2.erreur, null);
  assert.deepEqual(r2.etat.session, { email: 'sam@exemple.fr', depuis: T0 });
  assert.equal(r2.etat.demande, null);
  const u = P.utilisateurCourant(r2.etat);
  assert.equal(u.statut, 'actif');
  assert.equal(u.activeLe, T0);
  assert.equal(u.prenom, 'Sam');
});

test('inscrire refuse un e-mail actif existant ou invalide', () => {
  const e0 = A.etatInitial();
  const r = P.inscrire(e0, Object.assign({}, profil, { email: 'LEA@demo.painquotidien.fr' }), T0, ID);
  assert.equal(r.erreur, 'email-existant');
  assert.deepEqual(r.etat.comptes, e0.comptes);
  assert.equal(P.inscrire(e0, Object.assign({}, profil, { email: 'pas-un-email' }), T0, ID).erreur, 'email-invalide');
});

test('inscrire remplace un compte encore à confirmer', () => {
  const e = P.inscrire(inscrit(), Object.assign({}, profil, { prenom: 'Samuel' }), plus(60), 'zzzzzzzzzzzzzzzz').etat;
  const sams = e.comptes.filter(c => c.email === 'sam@exemple.fr');
  assert.equal(sams.length, 1);
  assert.equal(sams[0].prenom, 'Samuel');
});

test('definirMotDePasse : sans demande ou trop faible', () => {
  assert.equal(P.definirMotDePasse(A.etatInitial(), 'Croissant8', T0).erreur, 'aucune-demande');
  const r = P.definirMotDePasse(inscrit(), 'faible', T0);
  assert.equal(r.erreur, 'mot-de-passe-faible');
  assert.deepEqual(r.etat.demande, { email: 'sam@exemple.fr', motif: 'inscription' });
  assert.equal(r.etat.session, null);
});

test('seConnecter', () => {
  const r = P.seConnecter(A.etatInitial(), 'Lea@demo.painquotidien.fr', 'Croissant8', T0);
  assert.equal(r.erreur, null);
  assert.equal(P.utilisateurCourant(r.etat).prenom, 'Léa');
  assert.equal(P.seConnecter(A.etatInitial(), 'inconnu@x.fr', 'Croissant8', T0).erreur, 'identifiants');
  assert.equal(P.seConnecter(inscrit(), 'sam@exemple.fr', 'Croissant8', T0).erreur, 'identifiants');
  assert.equal(P.seConnecter(A.etatInitial(), 'lea@demo.painquotidien.fr', 'faible', T0).erreur, 'identifiants');
  assert.equal(P.seConnecter(A.etatInitial(), 'inconnu@x.fr', 'Croissant8', T0).etat.session, null);
});

test('motDePasseOublie ne révèle rien', () => {
  const r = P.motDePasseOublie(A.etatInitial(), 'inconnu@x.fr');
  assert.equal(r.erreur, null);
  assert.equal(r.etat.demande, null);
  const r2 = P.motDePasseOublie(A.etatInitial(), 'lea@demo.painquotidien.fr');
  assert.equal(r2.erreur, null);
  assert.deepEqual(r2.etat.demande, { email: 'lea@demo.painquotidien.fr', motif: 'reinitialisation' });
  assert.deepEqual(A.demandeEnCours(r2.etat), r2.etat.demande);
  const r3 = P.definirMotDePasse(r2.etat, 'Croissant8', T0);
  assert.equal(P.utilisateurCourant(r3.etat).activeLe, A.COMPTE_DEMO.activeLe);
});

test('seDeconnecter et utilisateurCourant', () => {
  const e = P.seDeconnecter(actif()).etat;
  assert.equal(e.session, null);
  assert.equal(P.utilisateurCourant(e), null);
  assert.equal(P.utilisateurCourant(A.etatInitial()), null);
  assert.equal(A.demandeEnCours(A.etatInitial()), null);
});

test('fourneeAuFour', () => {
  assert.equal(A.fourneeAuFour(actif(), plus(3)), true);
  assert.equal(A.fourneeAuFour(actif(), plus(5)), false);
  const lea = P.seConnecter(A.etatInitial(), 'lea@demo.painquotidien.fr', 'Croissant8', T0).etat;
  assert.equal(A.fourneeAuFour(lea, T0), false);
  assert.equal(A.fourneeAuFour(A.etatInitial(), T0), false);
});

test('normaliser', () => {
  assert.deepEqual(A.normaliser('x'), A.etatInitial());
  assert.deepEqual(A.normaliser({ version: 2, comptes: [], session: null, demande: null }), A.etatInitial());
  assert.deepEqual(A.normaliser({ version: 1, comptes: [], session: null, demande: null }).comptes, [A.COMPTE_DEMO]);
  const e = actif();
  assert.deepEqual(A.normaliser(JSON.parse(JSON.stringify(e))), e);
  const sale = A.normaliser({ version: 1, comptes: [null, 3, { email: 7 }], session: 'x', demande: { email: 'a@b.fr', motif: 'autre' } });
  assert.deepEqual(sale, A.etatInitial());
});

test('aucun mot de passe dans l\'état', () => {
  const e = P.seConnecter(P.seDeconnecter(actif()).etat, 'sam@exemple.fr', 'Secret99Pain', T0).etat;
  const s = JSON.stringify(e) + JSON.stringify(actif());
  assert.ok(!s.includes('Croissant8'));
  assert.ok(!s.includes('Secret99Pain'));
});

test('les fonctions ne mutent pas leur entrée', () => {
  const e0 = A.etatInitial();
  P.inscrire(e0, profil, T0, ID);
  P.seConnecter(e0, 'lea@demo.painquotidien.fr', 'Croissant8', T0);
  P.motDePasseOublie(e0, 'lea@demo.painquotidien.fr');
  assert.deepEqual(e0, A.etatInitial());
});

test('charger et enregistrer, y compris stockage cassé', () => {
  const mem = {};
  const st = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
  assert.deepEqual(A.charger(st), A.etatInitial());
  const e = actif();
  assert.equal(A.enregistrer(e, st), true);
  assert.deepEqual(A.charger(st), e);
  mem['pq-auth'] = '{cassé';
  assert.deepEqual(A.charger(st), A.etatInitial());
  const boom = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.deepEqual(A.charger(boom), A.etatInitial());
  assert.equal(A.enregistrer(e, boom), false);
});

test('enveloppe : les six méthodes chargent, appliquent et enregistrent', () => {
  const mem = {};
  const st = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
  const env = A.avecStockage(st, fixe);
  assert.deepEqual(env.seConnecter('inconnu@x.fr', 'Croissant8'), { ok: false, erreur: 'identifiants' });
  assert.deepEqual(env.inscrireDepuisQuestionnaire(profil), { ok: true, erreur: null });
  assert.equal(A.charger(st).demande.email, 'sam@exemple.fr');
  assert.deepEqual(env.definirMotDePasse('Croissant8'), { ok: true, erreur: null });
  assert.equal(env.utilisateurCourant().prenom, 'Sam');
  assert.match(env.utilisateurCourant().abonneId, /^[A-Za-z0-9]{16}$/);
  assert.deepEqual(env.seDeconnecter(), { ok: true, erreur: null });
  assert.equal(env.utilisateurCourant(), null);
  assert.deepEqual(env.motDePasseOublie('inconnu@x.fr'), { ok: true, erreur: null });
  assert.ok(!JSON.stringify(mem).includes('Croissant8'));
});
