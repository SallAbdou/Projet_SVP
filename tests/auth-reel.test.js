const test = require('node:test');
const assert = require('node:assert/strict');
const A = require('../auth.js');
const R = A.reel;

const CONFIG = { mode: 'reel', supabaseUrl: 'https://abc.supabase.co/', supabaseCleAnon: 'cle-pub', webhookFournee: 'https://n8n.exemple.fr/webhook/file', tallyUrl: 'https://tally.so/r/RWWqKd', siteUrl: 'https://team42svp.vercel.app', delaiReseauMs: 1000 };
const T0 = 1800000000;
const META = { prenom: 'Léa', abonne_id: 'recAbonne1', profil: { metiers: ['Consultant'], thematiques: ['LLMs'], relation: 'En couple', langue: 'Français' } };
const USER = { id: 'u1', email: 'lea@exemple.fr', user_metadata: META };

function jwt(charge) { return 'e30.' + Buffer.from(JSON.stringify(charge)).toString('base64url') + '.sig'; }
const JETON_A = jwt({ email: 'lea@exemple.fr', user_metadata: META });
const JETON_B = jwt({ email: 'lea@exemple.fr', user_metadata: META, n: 2 });
const FRAGMENT_INVITE = '#access_token=' + JETON_A + '&token_type=bearer&expires_in=3600&refresh_token=R1&type=invite';

function memoire() {
  const m = {};
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, _m: m };
}
function reponse(status, corps) { return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(corps) }; }
// fetch simulé : renvoie les réponses prévues dans l'ordre et garde chaque appel.
function faux(...suite) {
  const appels = [];
  const f = (url, options) => {
    appels.push({ url, options, corps: options.body ? JSON.parse(options.body) : undefined });
    const r = suite.shift();
    if (r instanceof Error) return Promise.reject(r);
    return Promise.resolve(r);
  };
  f.appels = appels;
  return f;
}
function adaptateur(fetch, horloge) {
  const h = horloge || { t: T0 };
  const storage = memoire();
  const a = R.avecSupabase(CONFIG, { fetch, storage, maintenant: () => h.t });
  return { a, storage, h };
}
const SESSION_OK = { access_token: JETON_A, token_type: 'bearer', expires_in: 3600, refresh_token: 'R1', user: USER };

test('base : barre finale retirée, chemin /auth/v1', () => {
  assert.equal(R.base(CONFIG), 'https://abc.supabase.co/auth/v1');
});

test('lireFragment : invitation, réinitialisation, expires_at prioritaire', () => {
  assert.deepEqual(R.lireFragment(FRAGMENT_INVITE, T0), { type: 'invite', jetons: { access_token: JETON_A, refresh_token: 'R1', expires_at: T0 + 3600 } });
  const rec = R.lireFragment('#access_token=X&token_type=bearer&expires_in=3600&expires_at=1800000999&refresh_token=R2&type=recovery', T0);
  assert.deepEqual(rec, { type: 'recovery', jetons: { access_token: 'X', refresh_token: 'R2', expires_at: 1800000999 } });
});

test('lireFragment : fragment vide ou incomplet ⇒ null, fragment d’erreur ⇒ { erreur }', () => {
  assert.equal(R.lireFragment('', T0), null);
  assert.equal(R.lireFragment('#ancre', T0), null);
  assert.equal(R.lireFragment('#access_token=X&token_type=bearer&expires_in=3600&type=invite', T0), null);
  assert.deepEqual(R.lireFragment('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired', T0), { erreur: 'otp_expired' });
});

test('decoderJwt : charge utile UTF-8 (prénom accentué), jeton abîmé ⇒ null', () => {
  assert.equal(R.decoderJwt(JETON_A).user_metadata.prenom, 'Léa');
  assert.equal(R.decoderJwt('pas-un-jeton'), null);
  assert.equal(R.decoderJwt('a.%%%.b'), null);
});

test('utilisateurDepuisSession : même forme que le compte de démo', () => {
  assert.deepEqual(R.utilisateurDepuisSession({ user: USER }), {
    abonneId: 'recAbonne1', prenom: 'Léa', email: 'lea@exemple.fr', statut: 'actif',
    profil: { metiers: ['Consultant'], thematiques: ['LLMs'], relation: 'En couple', langue: 'Français' },
    inscritLe: null, activeLe: null, fourOuvertLe: null
  });
  assert.deepEqual(R.utilisateurDepuisSession({ user: { email: 'x@y.fr' } }).profil, { metiers: [], thematiques: [], relation: '', langue: '' });
  assert.equal(R.utilisateurDepuisSession(null), null);
});

test('utilisateurDepuisSession : abonne_id de app_metadata prioritaire (non modifiable par l’utilisateur)', () => {
  const u = Object.assign({}, USER, { app_metadata: { abonne_id: 'recSur' } });
  assert.equal(R.utilisateurDepuisSession({ user: u }).abonneId, 'recSur');
});

test('seConnecter : requête exacte, session gardée sous pq-auth-reel', async () => {
  const f = faux(reponse(200, SESSION_OK));
  const { a, storage } = adaptateur(f);
  assert.deepEqual(await a.seConnecter(' Lea@Exemple.fr ', 'Croissant8'), { ok: true, erreur: null });
  const c = f.appels[0];
  assert.equal(c.url, 'https://abc.supabase.co/auth/v1/token?grant_type=password');
  assert.equal(c.options.method, 'POST');
  assert.equal(c.options.headers.apikey, 'cle-pub');
  assert.equal(c.options.headers['Content-Type'], 'application/json');
  assert.deepEqual(c.corps, { email: 'lea@exemple.fr', password: 'Croissant8' });
  assert.equal(a.utilisateurCourant().prenom, 'Léa');
  assert.equal(a.utilisateurCourant().abonneId, 'recAbonne1');
  assert.ok(storage.getItem('pq-auth-reel'));
  assert.equal(storage.getItem('pq-auth'), null);
});

test('seConnecter : sans user dans la réponse, le jeton donne l’utilisateur', async () => {
  const { a } = adaptateur(faux(reponse(200, Object.assign({}, SESSION_OK, { user: undefined }))));
  await a.seConnecter('lea@exemple.fr', 'Croissant8');
  assert.equal(a.utilisateurCourant().prenom, 'Léa');
});

test('seConnecter : 400 ⇒ identifiants, panne ou 500 ⇒ reseau', async () => {
  let { a } = adaptateur(faux(reponse(400, { error: 'invalid_grant' })));
  assert.deepEqual(await a.seConnecter('lea@exemple.fr', 'Mauvais99'), { ok: false, erreur: 'identifiants' });
  assert.equal(a.utilisateurCourant(), null);
  ({ a } = adaptateur(faux(new TypeError('Failed to fetch'))));
  assert.deepEqual(await a.seConnecter('lea@exemple.fr', 'Croissant8'), { ok: false, erreur: 'reseau' });
  ({ a } = adaptateur(faux(reponse(500, {}))));
  assert.deepEqual(await a.seConnecter('lea@exemple.fr', 'Croissant8'), { ok: false, erreur: 'reseau' });
});

test('lien d’invitation puis choix du mot de passe : session ouverte', async () => {
  const f = faux(reponse(200, USER));
  const { a } = adaptateur(f);
  assert.equal(a.accueillirFragment(FRAGMENT_INVITE), 'inscription');
  assert.deepEqual(A.demandeEnCours(a.charger()), { email: 'lea@exemple.fr', motif: 'inscription' });
  assert.equal(a.utilisateurCourant(), null);
  assert.deepEqual(await a.definirMotDePasse('Croissant8'), { ok: true, erreur: null });
  const c = f.appels[0];
  assert.equal(c.url, 'https://abc.supabase.co/auth/v1/user');
  assert.equal(c.options.method, 'PUT');
  assert.equal(c.options.headers.Authorization, 'Bearer ' + JETON_A);
  assert.deepEqual(c.corps, { password: 'Croissant8' });
  assert.equal(a.utilisateurCourant().prenom, 'Léa');
  assert.equal(A.demandeEnCours(a.charger()), null);
});

test('lien de réinitialisation : motif reinitialisation', () => {
  const { a } = adaptateur(faux());
  assert.equal(a.accueillirFragment(FRAGMENT_INVITE.replace('type=invite', 'type=recovery')), 'reinitialisation');
  assert.equal(A.demandeEnCours(a.charger()).motif, 'reinitialisation');
});

test('fragment d’erreur ou absent : aucune demande', () => {
  const { a } = adaptateur(faux());
  assert.equal(a.accueillirFragment('#error=access_denied&error_code=otp_expired'), null);
  assert.equal(a.accueillirFragment(''), null);
  assert.equal(A.demandeEnCours(a.charger()), null);
});

test('definirMotDePasse : 401 ⇒ aucune-demande (demande effacée), 422 ⇒ faible, règles locales sans réseau', async () => {
  let f = faux(reponse(401, {}));
  let { a } = adaptateur(f);
  a.accueillirFragment(FRAGMENT_INVITE);
  assert.deepEqual(await a.definirMotDePasse('Croissant8'), { ok: false, erreur: 'aucune-demande' });
  assert.equal(A.demandeEnCours(a.charger()), null);
  ({ a } = adaptateur(faux(reponse(422, { error_code: 'weak_password' }))));
  a.accueillirFragment(FRAGMENT_INVITE);
  assert.deepEqual(await a.definirMotDePasse('Croissant8'), { ok: false, erreur: 'mot-de-passe-faible' });
  assert.ok(A.demandeEnCours(a.charger()));
  f = faux();
  ({ a } = adaptateur(f));
  assert.deepEqual(await a.definirMotDePasse('Croissant8'), { ok: false, erreur: 'aucune-demande' });
  a.accueillirFragment(FRAGMENT_INVITE);
  assert.deepEqual(await a.definirMotDePasse('faible'), { ok: false, erreur: 'mot-de-passe-faible' });
  assert.equal(f.appels.length, 0);
});

test('demande expirée : ignorée à la lecture', () => {
  const h = { t: T0 };
  const { a } = adaptateur(faux(), h);
  a.accueillirFragment(FRAGMENT_INVITE);
  h.t = T0 + 3601;
  assert.equal(A.demandeEnCours(a.charger()), null);
});

test('jetonValide : jeton frais sans réseau, sinon renouvelé', async () => {
  const h = { t: T0 };
  const f = faux(reponse(200, SESSION_OK), reponse(200, { access_token: JETON_B, token_type: 'bearer', expires_in: 3600, refresh_token: 'R2', user: USER }));
  const { a } = adaptateur(f, h);
  await a.seConnecter('lea@exemple.fr', 'Croissant8');
  assert.equal(await a.jetonValide(), JETON_A);
  assert.equal(f.appels.length, 1);
  h.t = T0 + 3580;
  assert.equal(await a.jetonValide(), JETON_B);
  assert.equal(f.appels[1].url, 'https://abc.supabase.co/auth/v1/token?grant_type=refresh_token');
  assert.deepEqual(f.appels[1].corps, { refresh_token: 'R1' });
  assert.equal(await a.jetonValide(), JETON_B);
  assert.equal(f.appels.length, 2);
});

test('jetonValide : renouvellement refusé ⇒ null et session effacée ; panne ⇒ rejet ; sans session ⇒ null', async () => {
  let h = { t: T0 };
  let { a } = adaptateur(faux(reponse(200, SESSION_OK), reponse(400, { error: 'invalid_grant' })), h);
  await a.seConnecter('lea@exemple.fr', 'Croissant8');
  h.t = T0 + 4000;
  assert.equal(await a.jetonValide(), null);
  assert.equal(a.utilisateurCourant(), null);
  ({ a } = adaptateur(faux(reponse(200, SESSION_OK), new TypeError('Failed to fetch')), h = { t: T0 }));
  await a.seConnecter('lea@exemple.fr', 'Croissant8');
  h.t = T0 + 4000;
  await assert.rejects(a.jetonValide());
  assert.ok(a.utilisateurCourant());
  ({ a } = adaptateur(faux()));
  assert.equal(await a.jetonValide(), null);
});

test('seDeconnecter : session effacée tout de suite, logout envoyé avec keepalive', async () => {
  const f = faux(reponse(200, SESSION_OK), reponse(204, null));
  const { a } = adaptateur(f);
  await a.seConnecter('lea@exemple.fr', 'Croissant8');
  const p = a.seDeconnecter();
  assert.equal(a.utilisateurCourant(), null);
  assert.deepEqual(await p, { ok: true, erreur: null });
  assert.equal(f.appels[1].url, 'https://abc.supabase.co/auth/v1/logout');
  assert.equal(f.appels[1].options.method, 'POST');
  assert.equal(f.appels[1].options.headers.Authorization, 'Bearer ' + JETON_A);
  assert.equal(f.appels[1].options.keepalive, true);
});

test('motDePasseOublie : redirect_to vers /creer-mot-de-passe, panne ⇒ reseau', async () => {
  const f = faux(reponse(200, {}));
  let { a } = adaptateur(f);
  assert.deepEqual(await a.motDePasseOublie('lea@exemple.fr'), { ok: true, erreur: null });
  assert.equal(f.appels[0].url, 'https://abc.supabase.co/auth/v1/recover?redirect_to=https%3A%2F%2Fteam42svp.vercel.app%2Fcreer-mot-de-passe');
  assert.deepEqual(f.appels[0].corps, { email: 'lea@exemple.fr' });
  ({ a } = adaptateur(faux(new TypeError('Failed to fetch'))));
  assert.deepEqual(await a.motDePasseOublie('lea@exemple.fr'), { ok: false, erreur: 'reseau' });
});

test('mode réel : questionnaire local refusé, four sans effet, charger sans planter', () => {
  const { a } = adaptateur(faux());
  assert.deepEqual(a.inscrireDepuisQuestionnaire({}), { ok: false, erreur: 'questionnaire-tally' });
  assert.deepEqual(a.ouvrirFour(), { ok: true, erreur: null });
  assert.equal(A.compteParEmail(a.charger(), 'lea@exemple.fr'), null);
});

test('démo : jetonValide vaut null, demandeEnCours ne renvoie que e-mail et motif', async () => {
  assert.equal(await A.jetonValide(), null);
  assert.deepEqual(A.demandeEnCours({ demande: { email: 'a@b.fr', motif: 'inscription', jetons: { access_token: 'x' } } }), { email: 'a@b.fr', motif: 'inscription' });
});
