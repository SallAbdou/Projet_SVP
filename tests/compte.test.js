// Lot 41 : « Supprimer mon compte » (profil). Démo : compte et données du compte effacés du navigateur ;
// réel : appel au point d'entrée du back (config.suppressionCompteUrl), rien d'effacé s'il est vide.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Auth = require('../auth.js');
const Store = require('../store.js');
const Compte = require('../compte.js');
const P = require('../parcours.js');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');

function memoire(init) {
  const m = new Map(Object.entries(init || {}));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    m
  };
}
const LEA = 'lea@demo.painquotidien.fr';
const SAM = 'sam@exemple.fr';
const parCompte = comptes => JSON.stringify({ version: 1, comptes });

// Léa connectée, Sam a aussi un compte et des réglages dans ce navigateur.
function navigateurLea() {
  const etat = Auth.etatInitial();
  etat.comptes.push({ abonneId: 'samId00000000001', prenom: 'Sam', email: SAM, statut: 'actif', profil: { metiers: [], thematiques: [], relation: '', langue: '' }, inscritLe: null, activeLe: null, fourOuvertLe: null });
  etat.session = { email: LEA, depuis: '2026-11-27T08:00:00.000Z' };
  return memoire({
    'pq-auth': JSON.stringify(etat),
    'pq-theme': parCompte({ [LEA]: 'nuit', [SAM]: 'contraste' }),
    'pq-animations': parCompte({ [LEA]: 'off', [SAM]: 'on', '*': 'off' }),
    'pq-visite': parCompte({ [LEA]: { vue: true, reportee: '' }, [SAM]: { vue: false, reportee: '' } }),
    'pq-jeu': parCompte({ [LEA]: { actif: true }, [SAM]: { actif: false } }),
    'pq-retours': parCompte({ [LEA]: [{ texte: 'plus de PME' }], [SAM]: [{ texte: 'moins de hardware' }] }),
    'pq-store': '{"version":1,"sauves":[{"ref":"a"}]}',
    'pq-layout': '{}', 'pq-layout-perso': '{}', 'pq-questionnaire': '{}',
    'pq-lang': 'en'
  });
}

test('Auth.pur.supprimerCompte : compte retiré, session et demande fermées', () => {
  const s = navigateurLea();
  const etat = Auth.charger(s);
  etat.demande = { email: LEA, motif: 'reinitialisation' };
  const r = Auth.pur.supprimerCompte(etat, LEA);
  assert.equal(r.erreur, null);
  assert.equal(Auth.compteParEmail(r.etat, LEA), null);
  assert.ok(Auth.compteParEmail(r.etat, SAM));
  assert.equal(r.etat.session, null);
  assert.equal(r.etat.demande, null);
  assert.equal(Auth.pur.supprimerCompte(r.etat, 'inconnu@x.fr').erreur, 'aucun-compte');
});

test('compte de démo supprimé : normaliser ne le recrée pas, reconnexion impossible', () => {
  const r = Auth.pur.supprimerCompte(Auth.etatInitial(), LEA);
  assert.equal(r.etat.demoSupprime, true);
  const relu = Auth.normaliser(JSON.parse(JSON.stringify(r.etat)));
  assert.equal(Auth.compteParEmail(relu, LEA), null);
  assert.equal(Auth.pur.seConnecter(relu, LEA, 'Motdepasse1', '2026-11-27T09:00:00.000Z').erreur, 'identifiants');
  // Sans la marque, le compte de démo revient toujours (comportement d'avant).
  assert.ok(Auth.compteParEmail(Auth.normaliser({ version: 1, comptes: [] }), LEA));
});

test('supprimerDemo : seules les données du compte partent, les autres comptes et la langue restent', () => {
  const s = navigateurLea();
  const r = Compte.supprimerDemo(s, Auth);
  assert.deepEqual(r, { ok: true, erreur: null });
  const json = k => JSON.parse(s.getItem(k));
  assert.deepEqual(json('pq-theme').comptes, { [SAM]: 'contraste' });
  assert.deepEqual(json('pq-animations').comptes, { [SAM]: 'on', '*': 'off' });
  assert.deepEqual(Object.keys(json('pq-visite').comptes), [SAM]);
  assert.deepEqual(Object.keys(json('pq-jeu').comptes), [SAM]);
  assert.deepEqual(Object.keys(json('pq-retours').comptes), [SAM]);
  for (const k of ['pq-store', 'pq-layout', 'pq-layout-perso', 'pq-questionnaire']) assert.equal(s.getItem(k), null, k);
  assert.equal(s.getItem('pq-lang'), 'en');
  const auth = Auth.charger(s);
  assert.equal(auth.session, null);
  assert.equal(Auth.compteParEmail(auth, LEA), null);
  assert.ok(Auth.compteParEmail(auth, SAM));
});

test('supprimerDemo sans session : erreur, rien n’est effacé', () => {
  const s = navigateurLea();
  const etat = Auth.charger(s);
  etat.session = null;
  Auth.enregistrer(etat, s);
  const avant = new Map(s.m);
  assert.deepEqual(Compte.supprimerDemo(s, Auth), { ok: false, erreur: 'session' });
  assert.deepEqual(s.m, avant);
});

test('?demo=reset rend le compte de Léa après sa suppression', () => {
  const s = navigateurLea();
  Compte.supprimerDemo(s, Auth);
  Store.reinitialiserDemo(s);
  const etat = Auth.charger(s);
  assert.ok(Auth.compteParEmail(etat, LEA));
  assert.equal(Auth.pur.seConnecter(etat, LEA, 'Motdepasse1', '2026-11-27T09:00:00.000Z').erreur, null);
});

test('mot de confirmation : SUPPRIMER en français, DELETE en anglais, casse et espaces tolérés', () => {
  assert.equal(Compte.motValide('SUPPRIMER', 'fr'), true);
  assert.equal(Compte.motValide('  supprimer ', 'fr'), true);
  assert.equal(Compte.motValide('SUPPRIME', 'fr'), false);
  assert.equal(Compte.motValide('', 'fr'), false);
  assert.equal(Compte.motValide('delete', 'en'), true);
  assert.equal(Compte.motValide('SUPPRIMER', 'en'), false);
});

// ---- Mode réel ----
function depsReel(reponse) {
  const appels = [];
  const s = navigateurLea();
  s.setItem('pq-auth-reel', '{"session":{}}');
  return {
    appels, s,
    deps: {
      storage: s,
      utilisateur: () => ({ email: LEA }),
      jeton: () => Promise.resolve('jeton-123'),
      fetch: (url, o) => { appels.push({ url, o }); return typeof reponse === 'function' ? reponse() : Promise.resolve(reponse); }
    }
  };
}

test('réel sans URL : « indisponible », aucun appel, rien d’effacé', async () => {
  const { appels, s, deps } = depsReel({ ok: true, status: 204 });
  const avant = new Map(s.m);
  for (const url of ['', 'http://pas-https.fr/x', undefined]) {
    assert.deepEqual(await Compte.supprimerReel({ suppressionCompteUrl: url }, deps), { ok: false, erreur: 'indisponible' });
  }
  assert.equal(appels.length, 0);
  assert.deepEqual(s.m, avant);
});

test('réel : POST avec le jeton de session, puis données locales et session effacées', async () => {
  const { appels, s, deps } = depsReel({ ok: true, status: 204 });
  const r = await Compte.supprimerReel({ suppressionCompteUrl: 'https://n8n.exemple.fr/webhook/suppression', delaiReseauMs: 1000 }, deps);
  assert.deepEqual(r, { ok: true, erreur: null });
  assert.equal(appels.length, 1);
  assert.equal(appels[0].url, 'https://n8n.exemple.fr/webhook/suppression');
  assert.equal(appels[0].o.method, 'POST');
  assert.equal(appels[0].o.headers.Authorization, 'Bearer jeton-123');
  assert.deepEqual(JSON.parse(appels[0].o.body), { confirmation: 'SUPPRIMER' });
  assert.equal(s.getItem('pq-auth-reel'), null);
  assert.equal(s.getItem('pq-store'), null);
  assert.deepEqual(JSON.parse(s.getItem('pq-theme')).comptes, { [SAM]: 'contraste' });
});

test('réel : 401 ⇒ « session », panne ⇒ « reseau », sans jeton ⇒ « session » ; rien d’effacé', async () => {
  const cas = [
    [{ ok: false, status: 401 }, 'session'],
    [{ ok: false, status: 500 }, 'reseau'],
    [() => Promise.reject(new Error('hors ligne')), 'reseau']
  ];
  const config = { suppressionCompteUrl: 'https://n8n.exemple.fr/webhook/suppression', delaiReseauMs: 1000 };
  for (const [rep, code] of cas) {
    const { s, deps } = depsReel(rep);
    const avant = new Map(s.m);
    assert.deepEqual(await Compte.supprimerReel(config, deps), { ok: false, erreur: code });
    assert.deepEqual(s.m, avant);
  }
  const { appels, deps } = depsReel({ ok: true, status: 204 });
  deps.jeton = () => Promise.resolve(null);
  assert.deepEqual(await Compte.supprimerReel(config, deps), { ok: false, erreur: 'session' });
  assert.equal(appels.length, 0);
});

test('config.js : suppressionCompteUrl prévu, vide par défaut, sans rendre le mode réel obligatoire', () => {
  const C = require('../config.js');
  assert.equal(C.DEFAUT.suppressionCompteUrl, '');
  assert.match(lire('docs/branchement-back.md'), /suppressionCompteUrl/);
});

// ---- Dialogue ----
test('dialogue : modal nommé et décrit, liste de ce qui part, irréversible, champ étiqueté, Annuler en premier', () => {
  for (const lang of ['fr', 'en']) {
    const h = Compte.dialogueHtml(lang);
    assert.match(h, /^<dialog id="pq-suppression" class="pq-suppression" aria-labelledby="pq-suppression-titre" aria-describedby="pq-suppression-desc">/);
    assert.match(h, /<h2 id="pq-suppression-titre"/);
    assert.match(h, /id="pq-suppression-desc"/);
    assert.equal((h.match(/<li>/g) || []).length, 7, lang);
    assert.match(h, /<label for="pq-suppression-mot"/);
    assert.match(h, /<input id="pq-suppression-mot" type="text"[^>]*autocomplete="off"[^>]*aria-describedby="pq-suppression-aide"/);
    assert.ok(h.indexOf('data-suppression-annuler') < h.indexOf('data-suppression-confirmer'));
    assert.match(h, /<button type="button" class="pq-suppression-annuler" data-suppression-annuler autofocus>/);
    assert.match(h, /<p id="pq-suppression-erreur" class="pq-suppression-erreur" hidden><\/p>/);
    assert.match(h, /<p class="pq-suppression-etat" role="status"><\/p>/);
  }
  const fr = Compte.dialogueHtml('fr');
  for (const x of ['Supprimer ton compte ?', 'définitif', 'SUPPRIMER', 'Supprimer définitivement', 'Annuler', 'fournées', 'posts', 'cartes', 'retours', 'préférences']) assert.ok(fr.includes(x), x);
  const en = Compte.dialogueHtml('en');
  for (const x of ['Delete your account?', 'cannot be undone', 'DELETE', 'Delete permanently', 'Cancel']) assert.ok(en.includes(x), x);
});

test('dialogue : textes des erreurs et du mode réel sans URL, FR et EN', () => {
  for (const lang of ['fr', 'en']) {
    const t = Compte.TEXTES[lang];
    for (const k of ['motFaux', 'indisponible', 'session', 'reseau', 'adieu', 'enCours']) assert.ok(t[k], lang + ' ' + k);
  }
  assert.match(Compte.TEXTES.fr.indisponible, /bientôt/);
  assert.match(Compte.TEXTES.fr.indisponible, /écris-nous/);
  assert.match(Compte.TEXTES.fr.indisponible, /Rien n’a été effacé/);
});

test('message d’au revoir sur l’accueil : role="status", FR et EN', () => {
  assert.equal(P.adieuHtml('fr'), '<p class="adieu" role="status">' + Compte.TEXTES.fr.adieu + '</p>');
  assert.ok(P.adieuHtml('en').includes(Compte.TEXTES.en.adieu));
  assert.match(lire('parcours.css'), /\.adieu\{/);
});

// ---- Profil ----
test('profil : section « Zone sensible » en bas, bouton danger 44 px, compte.js chargé', () => {
  const h = lire('profil.html');
  assert.match(h, /<section aria-labelledby="danger-t" class="pf-carte pf-zone-danger">\s*<h2 id="danger-t" class="pf-titre">\{\{t\.dangerT\}\}<\/h2>/);
  assert.match(h, /<button type="button" class="pf-btn pf-danger" data-focus="supprimer-compte" aria-haspopup="dialog" onClick="\{\{supprimerCompte\}\}">\{\{t\.supprimer\}\}<\/button>/);
  assert.ok(h.indexOf('danger-t') > h.indexOf('profil-logout'), 'zone sensible après « Se déconnecter »');
  assert.match(h, /\.pf-danger\{[^}]*min-height:44px[^}]*border-color:var\(--erreur\)[^}]*color:var\(--erreur\)/);
  assert.match(h, /<script src="\/compte\.js"><\/script>/);
  assert.match(h, /dangerT: 'Zone sensible'/);
  assert.match(h, /dangerT: 'Danger zone'/);
});

// Contraste AA du rouge --erreur : texte sur la carte, et texte --sur-plein sur le bouton plein du dialogue.
function lum(hex) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
test('bouton danger et bouton de confirmation : contraste AA dans les 4 thèmes', () => {
  const css = lire('charte.css');
  const blocs = {};
  css.replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, corps) => {
    const s = sel.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const nom = s === ':root,[data-theme="bronze"]' ? 'bronze' : (/^\[data-theme="(\w+)"\]$/.exec(s) || [])[1];
    if (nom) { blocs[nom] = blocs[nom] || {}; corps.replace(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g, (x, k, v) => { blocs[nom][k] = v; }); }
    return m;
  });
  for (const nom of ['bronze', 'classique', 'nuit', 'contraste']) {
    const v = Object.assign({}, blocs.bronze, blocs[nom]);
    assert.ok(ratio(v.erreur, v.creme) >= 4.5, nom + ' erreur/creme');
    assert.ok(ratio(v['sur-plein'], v.erreur) >= 4.5, nom + ' sur-plein/erreur');
  }
  assert.match(lire('compte.js'), /\.pq-suppression-confirmer\{[^}]*min-height:44px[^}]*background:var\(--erreur\)[^}]*color:var\(--sur-plein\)/);
});

test('confidentialité : la suppression du compte depuis Mon profil est expliquée, FR et EN', () => {
  const h = lire('confidentialite.html');
  assert.match(h, /Supprimer mon compte/);
  assert.match(h, /Delete my account/);
});
