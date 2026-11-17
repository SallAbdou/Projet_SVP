/* Adaptateur d'authentification : aujourd'hui simulé dans le navigateur, demain Supabase Auth.
   Le reste du front n'appelle que les six méthodes de la feuille de route (inscrireDepuisQuestionnaire,
   definirMotDePasse, seConnecter, motDePasseOublie, seDeconnecter, utilisateurCourant).
   Logique pure dans Auth.pur (testée sous Node). AUCUN mot de passe n'est jamais stocké :
   seule la règle de saisie est vérifiée. Comptes, session et demande en cours : localStorage « pq-auth ». */
(function (root) {
  var CLE = 'pq-auth';
  var STATUTS = ['a-confirmer', 'actif'];
  var MOTIFS = ['inscription', 'reinitialisation'];
  var DELAI_FOUR_MS = 4000;
  var OUVERTURE_FOUR_MS = 600000;
  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  var COMPTE_DEMO = {
    abonneId: 'demoLea0000000001',
    prenom: 'Léa',
    email: 'lea@demo.painquotidien.fr',
    statut: 'actif',
    profil: {
      metiers: ['Consultant'],
      thematiques: ['Automatisation et agents', 'IA en entreprise', 'LLMs'],
      relation: 'En couple',
      langue: 'Je veux des sources françaises uniquement'
    },
    inscritLe: '2026-10-01T08:00:00.000Z',
    activeLe: '2026-10-01T08:00:00.000Z',
    fourOuvertLe: null
  };

  function estObjet(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function copie(v) { return JSON.parse(JSON.stringify(v)); }
  function cleEmail(email) { return String(email == null ? '' : email).trim().toLowerCase(); }
  function chaines(v) { return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }) : []; }

  function etatInitial() {
    return { version: 1, comptes: [copie(COMPTE_DEMO)], session: null, demande: null };
  }

  function compteValide(c) {
    return estObjet(c) && typeof c.email === 'string' && typeof c.prenom === 'string' &&
      typeof c.abonneId === 'string' && STATUTS.indexOf(c.statut) !== -1 && estObjet(c.profil);
  }

  function normaliser(raw) {
    var e = etatInitial();
    if (!estObjet(raw) || raw.version !== 1) return e;
    var comptes = Array.isArray(raw.comptes) ? raw.comptes.filter(compteValide).map(function (c) {
      return {
        abonneId: c.abonneId, prenom: c.prenom, email: cleEmail(c.email), statut: c.statut,
        profil: { metiers: chaines(c.profil.metiers), thematiques: chaines(c.profil.thematiques), relation: String(c.profil.relation || ''), langue: String(c.profil.langue || '') },
        inscritLe: typeof c.inscritLe === 'string' ? c.inscritLe : null,
        activeLe: typeof c.activeLe === 'string' ? c.activeLe : null,
        fourOuvertLe: typeof c.fourOuvertLe === 'string' ? c.fourOuvertLe : null
      };
    }) : [];
    // Le compte de démo est toujours présent (jamais perdu, même si l'état est abîmé).
    if (!comptes.some(function (c) { return c.email === COMPTE_DEMO.email; })) comptes.unshift(copie(COMPTE_DEMO));
    e.comptes = comptes;
    if (estObjet(raw.session) && typeof raw.session.email === 'string') {
      e.session = { email: cleEmail(raw.session.email), depuis: String(raw.session.depuis || '') };
    }
    if (estObjet(raw.demande) && typeof raw.demande.email === 'string' && MOTIFS.indexOf(raw.demande.motif) !== -1) {
      e.demande = { email: cleEmail(raw.demande.email), motif: raw.demande.motif };
    }
    return e;
  }

  function emailValide(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function reglesMotDePasse(mdp) {
    var s = typeof mdp === 'string' ? mdp : '';
    var r = { longueur: s.length >= 8, majuscule: /[A-Z]/.test(s), chiffre: /[0-9]/.test(s) };
    r.ok = r.longueur && r.majuscule && r.chiffre;
    return r;
  }

  function genererIdentifiant(aleatoire) {
    var s = '';
    for (var i = 0; i < 16; i++) s += ALPHABET.charAt(Math.floor(aleatoire() * ALPHABET.length) % ALPHABET.length);
    return s;
  }

  function compteParEmail(etat, email) {
    var cle = cleEmail(email);
    return etat.comptes.filter(function (c) { return c.email === cle; })[0] || null;
  }

  function res(etat, erreur) { return { etat: etat, erreur: erreur || null }; }

  function inscrire(etat, profil, maintenantIso, identifiant) {
    var p = estObjet(profil) ? profil : {};
    if (!emailValide(p.email)) return res(copie(etat), 'email-invalide');
    var e = copie(etat);
    var email = cleEmail(p.email);
    var existant = compteParEmail(e, email);
    if (existant && existant.statut === 'actif') return res(e, 'email-existant');
    e.comptes = e.comptes.filter(function (c) { return c.email !== email; });
    e.comptes.push({
      abonneId: identifiant, prenom: String(p.prenom || '').trim(), email: email, statut: 'a-confirmer',
      profil: { metiers: chaines(p.metiers), thematiques: chaines(p.thematiques), relation: String(p.relation || ''), langue: String(p.langue || '') },
      inscritLe: maintenantIso, activeLe: null, fourOuvertLe: null
    });
    e.demande = { email: email, motif: 'inscription' };
    return res(e);
  }

  function definirMotDePasse(etat, mdp, maintenantIso) {
    var e = copie(etat);
    var c = e.demande && compteParEmail(e, e.demande.email);
    if (!c) return res(e, 'aucune-demande');
    if (!reglesMotDePasse(mdp).ok) return res(e, 'mot-de-passe-faible');
    c.statut = 'actif';
    if (!c.activeLe) c.activeLe = maintenantIso;
    e.session = { email: c.email, depuis: maintenantIso };
    e.demande = null;
    return res(e);
  }

  function seConnecter(etat, email, mdp, maintenantIso) {
    var e = copie(etat);
    var c = compteParEmail(e, email);
    if (!c || c.statut !== 'actif' || !reglesMotDePasse(mdp).ok) return res(e, 'identifiants');
    e.session = { email: c.email, depuis: maintenantIso };
    return res(e);
  }

  // Jamais d'erreur : on ne révèle pas quels comptes existent. Toute demande précédente est remplacée.
  function motDePasseOublie(etat, email) {
    var e = copie(etat);
    var c = compteParEmail(e, email);
    e.demande = c && c.statut === 'actif' ? { email: c.email, motif: 'reinitialisation' } : null;
    return res(e);
  }

  function seDeconnecter(etat) {
    var e = copie(etat);
    e.session = null;
    return res(e);
  }

  function utilisateurCourant(etat) {
    if (!etat || !etat.session) return null;
    var c = compteParEmail(etat, etat.session.email);
    return c && c.statut === 'actif' ? copie(c) : null;
  }

  // Seuls l'e-mail et le motif sortent (en mode réel, la demande porte aussi les jetons du lien).
  function demandeEnCours(etat) {
    return etat && etat.demande ? { email: etat.demande.email, motif: etat.demande.motif } : null;
  }

  // Les 4 s du four se comptent depuis la première demande de fournée (fourOuvertLe),
  // à défaut depuis l'activation du compte.
  function fourneeAuFour(etat, maintenantIso) {
    var u = utilisateurCourant(etat);
    if (!u || !u.activeLe) return false;
    var ecart = Date.parse(maintenantIso) - Date.parse(u.fourOuvertLe || u.activeLe);
    return ecart >= 0 && ecart < DELAI_FOUR_MS;
  }

  // Première demande de fournée dans les 10 minutes qui suivent l'activation : le four s'ouvre.
  function ouvrirFour(etat, maintenantIso) {
    var e = copie(etat);
    var s = utilisateurCourant(e);
    var c = s && compteParEmail(e, s.email);
    if (!c || !c.activeLe || c.fourOuvertLe) return res(e);
    var ecart = Date.parse(maintenantIso) - Date.parse(c.activeLe);
    if (ecart >= 0 && ecart < OUVERTURE_FOUR_MS) c.fourOuvertLe = maintenantIso;
    return res(e);
  }

  function stockageParDefaut() {
    try { return root.localStorage; } catch (err) { return null; }
  }

  function charger(storage) {
    var st = storage || stockageParDefaut();
    try {
      var raw = st.getItem(CLE);
      return raw == null ? etatInitial() : normaliser(JSON.parse(raw));
    } catch (err) {
      return etatInitial();
    }
  }

  function enregistrer(etat, storage) {
    var st = storage || stockageParDefaut();
    try {
      st.setItem(CLE, JSON.stringify(etat));
      return true;
    } catch (err) {
      return false;
    }
  }

  function aleatoireNavigateur() {
    try {
      var t = new Uint32Array(1);
      root.crypto.getRandomValues(t);
      return t[0] / 4294967296;
    } catch (err) {
      return Math.random();
    }
  }

  // Enveloppe : charge l'état, applique la fonction pure, enregistre, renvoie { ok, erreur }.
  function avecStockage(storage, aleatoire) {
    var hasard = aleatoire || aleatoireNavigateur;
    function maintenant() { return new Date().toISOString(); }
    function appliquer(r) {
      if (!r.erreur) enregistrer(r.etat, storage);
      return { ok: !r.erreur, erreur: r.erreur };
    }
    return {
      inscrireDepuisQuestionnaire: function (profil) { return appliquer(inscrire(charger(storage), profil, maintenant(), genererIdentifiant(hasard))); },
      definirMotDePasse: function (mdp) { return appliquer(definirMotDePasse(charger(storage), mdp, maintenant())); },
      seConnecter: function (email, mdp) { return appliquer(seConnecter(charger(storage), email, mdp, maintenant())); },
      motDePasseOublie: function (email) { return appliquer(motDePasseOublie(charger(storage), email)); },
      seDeconnecter: function () { return appliquer(seDeconnecter(charger(storage))); },
      ouvrirFour: function () { return appliquer(ouvrirFour(charger(storage), maintenant())); },
      utilisateurCourant: function () { return utilisateurCourant(charger(storage)); }
    };
  }

  /* ---------- Mode réel : Supabase Auth par fetch, sans librairie (docs/branchement-back.md) ----------
     Même interface que la démo, mais les méthodes réseau renvoient une promesse de { ok, erreur }.
     État en localStorage « pq-auth-reel » : { session: { access_token, refresh_token, expires_at, user },
     demande: { email, motif, jetons, user } } (demande = lien d'invitation ou de réinitialisation reçu). */
  var CLE_REEL = 'pq-auth-reel';
  var MARGE_S = 60;
  var Cfg = typeof module === 'object' && module.exports ? require('./config.js') : root.Config;

  function base(config) { return String(config.supabaseUrl || '').replace(/\/+$/, '') + '/auth/v1'; }

  function requete(config, chemin, methode, corps, jeton) {
    var h = { apikey: config.supabaseCleAnon, 'Content-Type': 'application/json' };
    if (jeton) h.Authorization = 'Bearer ' + jeton;
    var o = { method: methode, headers: h };
    if (corps !== undefined) o.body = JSON.stringify(corps);
    return { url: base(config) + chemin, options: o };
  }

  function parametres(hash) {
    var p = {};
    String(hash || '').replace(/^#/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      try {
        p[decodeURIComponent(i === -1 ? kv : kv.slice(0, i))] = i === -1 ? '' : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' '));
      } catch (err) {}
    });
    return p;
  }

  // Fragment posé par Supabase après le clic sur un lien d'e-mail (comme le client officiel :
  // access_token, refresh_token, expires_in et token_type requis ; expires_at prioritaire s'il est là).
  function lireFragment(hash, maintenantS) {
    var p = parametres(hash);
    if (p.error || p.error_code) return { erreur: p.error_code || p.error };
    if (!p.access_token || !p.refresh_token || !p.expires_in || !p.token_type) return null;
    var exp = parseInt(p.expires_at, 10);
    if (!(exp > 0)) exp = maintenantS + parseInt(p.expires_in, 10);
    if (!(exp > 0)) return null;
    return { type: p.type || '', jetons: { access_token: p.access_token, refresh_token: p.refresh_token, expires_at: exp } };
  }

  // Charge utile d'un JWT (base64url, UTF-8 pour les prénoms accentués). Aucune vérification de signature :
  // c'est le back (WF3, Supabase) qui vérifie le jeton.
  function decoderJwt(jeton) {
    try {
      var morceaux = String(jeton).split('.');
      if (morceaux.length !== 3) return null;
      var b64 = morceaux[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      var binaire = atob(b64);
      var echappe = '';
      for (var i = 0; i < binaire.length; i++) echappe += '%' + ('0' + binaire.charCodeAt(i).toString(16)).slice(-2);
      var o = JSON.parse(decodeURIComponent(echappe));
      return estObjet(o) ? o : null;
    } catch (err) {
      return null;
    }
  }

  function userDepuisJwt(jeton) {
    var p = decoderJwt(jeton);
    return p && typeof p.email === 'string' ? { email: p.email, user_metadata: estObjet(p.user_metadata) ? p.user_metadata : {} } : null;
  }

  function sessionDepuisReponse(j, maintenantS) {
    if (!estObjet(j) || typeof j.access_token !== 'string' || typeof j.refresh_token !== 'string') return null;
    var exp = typeof j.expires_at === 'number' ? j.expires_at : maintenantS + (typeof j.expires_in === 'number' ? j.expires_in : 0);
    var user = estObjet(j.user) ? j.user : userDepuisJwt(j.access_token);
    return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: exp, user: user };
  }

  // Compte au même format que la démo, lu dans user_metadata (prenom, abonne_id, profil).
  function utilisateurDepuisSession(s) {
    if (!s || !estObjet(s.user)) return null;
    var md = estObjet(s.user.user_metadata) ? s.user.user_metadata : {};
    var p = estObjet(md.profil) ? md.profil : {};
    // app_metadata n'est modifiable que par la clé service_role (n8n) : il fait foi pour abonne_id.
    var app = estObjet(s.user.app_metadata) ? s.user.app_metadata : {};
    return {
      abonneId: String(app.abonne_id || md.abonne_id || ''), prenom: String(md.prenom || ''), email: cleEmail(s.user.email), statut: 'actif',
      profil: { metiers: chaines(p.metiers), thematiques: chaines(p.thematiques), relation: String(p.relation || ''), langue: String(p.langue || '') },
      inscritLe: null, activeLe: null, fourOuvertLe: null
    };
  }

  function expire(jetons, maintenantS, margeS) { return !(jetons.expires_at - (margeS || 0) > maintenantS); }

  function jetonsValides(j) {
    return estObjet(j) && typeof j.access_token === 'string' && typeof j.refresh_token === 'string' && typeof j.expires_at === 'number';
  }

  function chargerReel(storage, maintenantS) {
    var e = { version: 1, comptes: [], session: null, demande: null };
    try {
      var raw = JSON.parse(storage.getItem(CLE_REEL));
      if (!estObjet(raw)) return e;
      if (jetonsValides(raw.session) && estObjet(raw.session.user)) e.session = raw.session;
      var d = raw.demande;
      if (estObjet(d) && typeof d.email === 'string' && MOTIFS.indexOf(d.motif) !== -1 && jetonsValides(d.jetons) && !expire(d.jetons, maintenantS, 0)) e.demande = d;
    } catch (err) {}
    return e;
  }

  function enregistrerReel(etat, storage) {
    try { storage.setItem(CLE_REEL, JSON.stringify({ session: etat.session, demande: etat.demande })); } catch (err) {}
  }

  function avecSupabase(config, deps) {
    var st = deps.storage;
    var maintenant = deps.maintenant;
    function ok() { return { ok: true, erreur: null }; }
    function ko(code) { return { ok: false, erreur: code }; }
    function lire() { return chargerReel(st, maintenant()); }
    function envoyer(chemin, methode, corps, jeton, extra) {
      var r = requete(config, chemin, methode, corps, jeton);
      if (extra) for (var k in extra) r.options[k] = extra[k];
      return Cfg.fetchAvecDelai(deps.fetch, r.url, r.options, config.delaiReseauMs || 8000);
    }
    function json(rep) { return Promise.resolve().then(function () { return rep.json(); }).catch(function () { return null; }); }
    function reseau() { return ko('reseau'); }

    function seConnecter(email, mdp) {
      return envoyer('/token?grant_type=password', 'POST', { email: cleEmail(email), password: String(mdp == null ? '' : mdp) }).then(function (rep) {
        if (rep.status === 400) return ko('identifiants');
        if (!rep.ok) return reseau();
        return json(rep).then(function (j) {
          var s = sessionDepuisReponse(j, maintenant());
          if (!s || !s.user) return reseau();
          var e = lire();
          e.session = s;
          enregistrerReel(e, st);
          return ok();
        });
      }, reseau);
    }

    function definirMotDePasse(mdp) {
      var d = lire().demande;
      if (!d) return Promise.resolve(ko('aucune-demande'));
      if (!reglesMotDePasse(mdp).ok) return Promise.resolve(ko('mot-de-passe-faible'));
      return envoyer('/user', 'PUT', { password: mdp }, d.jetons.access_token).then(function (rep) {
        if (rep.status === 401 || rep.status === 403) {
          var x = lire();
          x.demande = null;
          enregistrerReel(x, st);
          return ko('aucune-demande');
        }
        if (rep.status === 422) return ko('mot-de-passe-faible');
        if (!rep.ok) return reseau();
        return json(rep).then(function (u) {
          var e = lire();
          var user = estObjet(u) && typeof u.email === 'string' ? u : (d.user || userDepuisJwt(d.jetons.access_token));
          e.session = { access_token: d.jetons.access_token, refresh_token: d.jetons.refresh_token, expires_at: d.jetons.expires_at, user: user };
          e.demande = null;
          enregistrerReel(e, st);
          return ok();
        });
      }, reseau);
    }

    // Supabase répond pareil que le compte existe ou non : rien n'est révélé.
    function motDePasseOublie(email) {
      var retour = String(config.siteUrl || '').replace(/\/+$/, '') + '/creer-mot-de-passe';
      return envoyer('/recover?redirect_to=' + encodeURIComponent(retour), 'POST', { email: cleEmail(email) }).then(function (rep) {
        return rep.ok ? ok() : reseau();
      }, reseau);
    }

    // La session locale part tout de suite ; la révocation suit (keepalive : la navigation ne l'annule pas).
    function seDeconnecter() {
      var e = lire();
      var jeton = e.session && e.session.access_token;
      e.session = null;
      enregistrerReel(e, st);
      if (!jeton) return Promise.resolve(ok());
      return envoyer('/logout', 'POST', undefined, jeton, { keepalive: true }).then(ok, ok);
    }

    // Jeton d'accès utilisable (renouvelé s'il expire dans moins de 60 s). null : plus de session.
    // Rejet : panne réseau (la session est gardée).
    function jetonValide() {
      var s = lire().session;
      if (!s) return Promise.resolve(null);
      if (!expire(s, maintenant(), MARGE_S)) return Promise.resolve(s.access_token);
      return envoyer('/token?grant_type=refresh_token', 'POST', { refresh_token: s.refresh_token }).then(function (rep) {
        if (rep.status === 400 || rep.status === 401) {
          var x = lire();
          x.session = null;
          enregistrerReel(x, st);
          return null;
        }
        if (!rep.ok) throw new Error('HTTP ' + rep.status);
        return json(rep).then(function (j) {
          var n = sessionDepuisReponse(j, maintenant());
          if (!n) throw new Error('réponse de renouvellement invalide');
          if (!estObjet(j.user)) n.user = s.user;
          var e = lire();
          e.session = n;
          enregistrerReel(e, st);
          return n.access_token;
        });
      });
    }

    // Lien d'e-mail : invitation ⇒ demande « inscription », récupération ⇒ « reinitialisation »,
    // autre type ⇒ session ouverte. Renvoie le motif, 'session' ou null.
    function accueillirFragment(hash) {
      var f = lireFragment(hash, maintenant());
      if (!f || f.erreur) return null;
      var user = userDepuisJwt(f.jetons.access_token);
      var e = lire();
      if (f.type === 'invite' || f.type === 'recovery') {
        e.demande = { email: user ? cleEmail(user.email) : '', motif: f.type === 'invite' ? 'inscription' : 'reinitialisation', jetons: f.jetons, user: user };
        enregistrerReel(e, st);
        return e.demande.motif;
      }
      if (!user) return null;
      e.session = { access_token: f.jetons.access_token, refresh_token: f.jetons.refresh_token, expires_at: f.jetons.expires_at, user: user };
      enregistrerReel(e, st);
      return 'session';
    }

    return {
      inscrireDepuisQuestionnaire: function () { return ko('questionnaire-tally'); },
      definirMotDePasse: definirMotDePasse,
      seConnecter: seConnecter,
      motDePasseOublie: motDePasseOublie,
      seDeconnecter: seDeconnecter,
      ouvrirFour: function () { return ok(); },
      utilisateurCourant: function () { return utilisateurDepuisSession(lire().session); },
      jetonValide: jetonValide,
      accueillirFragment: accueillirFragment,
      charger: lire
    };
  }

  var navigateur = avecStockage(null);
  var config = root.PQ_CONFIG;
  var reelActif = root.PQ_MODE === 'reel' && !!config;
  var actif = reelActif ? avecSupabase(config, {
    fetch: function (u, o) { return root.fetch(u, o); },
    storage: stockageParDefaut() || { getItem: function () { return null; }, setItem: function () {} },
    maintenant: function () { return Math.floor(Date.now() / 1000); }
  }) : navigateur;

  var Auth = {
    CLE: CLE, COMPTE_DEMO: copie(COMPTE_DEMO),
    etatInitial: etatInitial, normaliser: normaliser,
    emailValide: emailValide, reglesMotDePasse: reglesMotDePasse, genererIdentifiant: genererIdentifiant,
    compteParEmail: compteParEmail, demandeEnCours: demandeEnCours, fourneeAuFour: fourneeAuFour,
    charger: reelActif ? actif.charger : charger, enregistrer: enregistrer, avecStockage: avecStockage,
    pur: {
      inscrire: inscrire, definirMotDePasse: definirMotDePasse, seConnecter: seConnecter,
      motDePasseOublie: motDePasseOublie, seDeconnecter: seDeconnecter, utilisateurCourant: utilisateurCourant, ouvrirFour: ouvrirFour
    },
    reel: {
      CLE: CLE_REEL, base: base, requete: requete, lireFragment: lireFragment, decoderJwt: decoderJwt,
      sessionDepuisReponse: sessionDepuisReponse, utilisateurDepuisSession: utilisateurDepuisSession,
      expire: expire, charger: chargerReel, avecSupabase: avecSupabase
    },
    estReel: reelActif,
    inscrireDepuisQuestionnaire: actif.inscrireDepuisQuestionnaire,
    definirMotDePasse: actif.definirMotDePasse,
    seConnecter: actif.seConnecter,
    motDePasseOublie: actif.motDePasseOublie,
    seDeconnecter: actif.seDeconnecter,
    ouvrirFour: actif.ouvrirFour,
    utilisateurCourant: actif.utilisateurCourant,
    jetonValide: reelActif ? actif.jetonValide : function () { return Promise.resolve(null); }
  };

  if (typeof module === 'object' && module.exports) module.exports = Auth;
  else {
    root.Auth = Auth;
    // Mode réel : retour d'un lien d'e-mail. Le fragment (jetons) est lu, puis effacé de la barre d'adresse.
    var hash = root.location && root.location.hash;
    if (reelActif && hash && lireFragment(hash, 0)) {
      var motif = actif.accueillirFragment(hash);
      try { root.history.replaceState(null, '', root.location.pathname + root.location.search); } catch (err) {}
      var surPage = /^\/creer-mot-de-passe(\.html)?$/.test(root.location.pathname);
      if (!surPage && motif !== 'session') {
        root.__redirige = true;
        root.location.replace('/creer-mot-de-passe');
      }
    }
  }
})(this);
