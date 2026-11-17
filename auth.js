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

  function demandeEnCours(etat) {
    return etat && etat.demande ? copie(etat.demande) : null;
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

  var navigateur = avecStockage(null);

  var Auth = {
    CLE: CLE, COMPTE_DEMO: copie(COMPTE_DEMO),
    etatInitial: etatInitial, normaliser: normaliser,
    emailValide: emailValide, reglesMotDePasse: reglesMotDePasse, genererIdentifiant: genererIdentifiant,
    compteParEmail: compteParEmail, demandeEnCours: demandeEnCours, fourneeAuFour: fourneeAuFour,
    charger: charger, enregistrer: enregistrer, avecStockage: avecStockage,
    pur: {
      inscrire: inscrire, definirMotDePasse: definirMotDePasse, seConnecter: seConnecter,
      motDePasseOublie: motDePasseOublie, seDeconnecter: seDeconnecter, utilisateurCourant: utilisateurCourant, ouvrirFour: ouvrirFour
    },
    inscrireDepuisQuestionnaire: navigateur.inscrireDepuisQuestionnaire,
    definirMotDePasse: navigateur.definirMotDePasse,
    seConnecter: navigateur.seConnecter,
    motDePasseOublie: navigateur.motDePasseOublie,
    seDeconnecter: navigateur.seDeconnecter,
    ouvrirFour: navigateur.ouvrirFour,
    utilisateurCourant: navigateur.utilisateurCourant
  };

  if (typeof module === 'object' && module.exports) module.exports = Auth;
  else root.Auth = Auth;
})(this);
