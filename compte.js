/* Lot 41 : « Supprimer mon compte » (page Mon profil).
   Démo : le compte sort de « pq-auth » et ses données sortent du navigateur (seules ses entrées dans les
   mémoires par compte ; les mémoires de l'appareil sans clé de compte sont vidées ; la langue reste).
   Réel : le front ne peut pas supprimer un utilisateur Supabase Auth (clé service_role interdite ici) :
   POST vers config.suppressionCompteUrl avec le jeton de session, contrat dans docs/branchement-back.md.
   URL vide : rien n'est effacé, message « bientôt disponible ».
   Dialogue : <dialog> natif créé hors de #root (il survit aux rendus de boot.js), modal, focus gardé dedans,
   Échap ou Annuler le ferment et rendent le focus au bouton du profil. Logique pure testée sous Node. */
(function (root) {
  var CLES_PAR_COMPTE = ['pq-theme', 'pq-animations', 'pq-visite', 'pq-jeu', 'pq-retours'];
  var CLES_APPAREIL = ['pq-store', 'pq-layout', 'pq-layout-perso', 'pq-questionnaire'];
  var CLE_ADIEU = 'pq-adieu';
  var MOTS = { fr: 'SUPPRIMER', en: 'DELETE' };

  var TEXTES = {
    fr: {
      titre: 'Supprimer ton compte ?',
      desc: 'Ton compte et tout ce qui va avec seront supprimés. C’est définitif : impossible de revenir en arrière.',
      quoi: ['ton compte (prénom, e-mail) et ta connexion ;', 'tes préférences du questionnaire ;', 'tes fournées et les articles mis de côté ;',
        'tes brouillons et tes posts publiés ;', 'tes cartes et ta progression du jeu ;', 'tes retours ;', 'ton thème et tes réglages d’affichage.'],
      label: 'Pour confirmer, tape SUPPRIMER', aide: 'En majuscules ou non, sans guillemets.',
      annuler: 'Annuler', confirmer: 'Supprimer définitivement',
      motFaux: 'Tape SUPPRIMER pour confirmer.', enCours: 'Suppression en cours…',
      indisponible: 'La suppression du compte en ligne arrive bientôt. En attendant, écris-nous depuis « Affine ta fournée » sur cette page et on s’en charge. Rien n’a été effacé.',
      session: 'Ta session a expiré : reconnecte-toi puis recommence. Rien n’a été effacé.',
      reseau: 'Suppression impossible pour l’instant (connexion ou serveur). Rien n’a été effacé : réessaie dans un moment.',
      adieu: 'Ton compte a bien été supprimé, ainsi que tes données dans ce navigateur. À bientôt peut-être !'
    },
    en: {
      titre: 'Delete your account?',
      desc: 'Your account and everything that comes with it will be deleted. This cannot be undone.',
      quoi: ['your account (first name, email) and your login;', 'your questionnaire preferences;', 'your batches and saved articles;',
        'your drafts and published posts;', 'your cards and game progress;', 'your feedback;', 'your theme and display settings.'],
      label: 'To confirm, type DELETE', aide: 'Upper or lower case, without quotes.',
      annuler: 'Cancel', confirmer: 'Delete permanently',
      motFaux: 'Type DELETE to confirm.', enCours: 'Deleting…',
      indisponible: 'Online account deletion is coming soon. In the meantime, write to us from “Fine-tune your batch” on this page and we will take care of it. Nothing has been deleted.',
      session: 'Your session has expired: log in again and retry. Nothing has been deleted.',
      reseau: 'Deletion is not possible right now (connection or server). Nothing has been deleted: try again in a moment.',
      adieu: 'Your account has been deleted, along with your data in this browser. Hope to see you again!'
    }
  };

  function langue(l) { return l === 'en' ? 'en' : 'fr'; }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // Même règle que Theme.cleCompte, Jeu.cleDuCompte, Visite… : e-mail en minuscules, sinon abonneId.
  function cleCompte(u) {
    if (!u) return null;
    var email = typeof u.email === 'string' ? u.email.trim().toLowerCase() : '';
    if (email) return email;
    return typeof u.abonneId === 'string' && u.abonneId ? u.abonneId : null;
  }

  function motValide(saisie, lang) {
    return String(saisie == null ? '' : saisie).trim().toUpperCase() === MOTS[langue(lang)];
  }

  // Données du compte u dans ce navigateur (hors « pq-auth », traité à part).
  function effacerDonnees(storage, u) {
    var cles = [cleCompte(u), u && u.abonneId].filter(Boolean);
    CLES_PAR_COMPTE.forEach(function (k) {
      try {
        var raw = JSON.parse(storage.getItem(k));
        if (!raw || !raw.comptes || typeof raw.comptes !== 'object') return;
        var change = false;
        cles.forEach(function (c) { if (Object.prototype.hasOwnProperty.call(raw.comptes, c)) { delete raw.comptes[c]; change = true; } });
        if (change) storage.setItem(k, JSON.stringify(raw));
      } catch (err) {}
    });
    CLES_APPAREIL.forEach(function (k) { try { storage.removeItem(k); } catch (err) {} });
  }

  function ok() { return { ok: true, erreur: null }; }
  function ko(code) { return { ok: false, erreur: code }; }

  // Démo (synchrone). Auth : module auth.js (charger, enregistrer, pur.*).
  function supprimerDemo(storage, Auth) {
    var etat = Auth.charger(storage);
    var u = Auth.pur.utilisateurCourant(etat);
    if (!u) return ko('session');
    var r = Auth.pur.supprimerCompte(etat, u.email);
    if (r.erreur) return ko(r.erreur);
    if (!Auth.enregistrer(r.etat, storage)) return ko('reseau');
    effacerDonnees(storage, u);
    return ok();
  }

  function https(v) { return typeof v === 'string' && /^https:\/\/[^\s/]+/.test(v); }
  function Cfg() { return root.Config || (typeof require === 'function' ? require('./config.js') : null); }

  // Réel (promesse). deps : { fetch, storage, utilisateur(), jeton() → Promise<string|null> }.
  function supprimerReel(config, deps) {
    var url = config && config.suppressionCompteUrl;
    if (!https(url)) return Promise.resolve(ko('indisponible'));
    var u = deps.utilisateur();
    return Promise.resolve().then(deps.jeton).then(function (jeton) {
      if (!jeton) return ko('session');
      var options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jeton },
        body: JSON.stringify({ confirmation: 'SUPPRIMER' })
      };
      return Cfg().fetchAvecDelai(deps.fetch, url, options, config.delaiReseauMs || 8000).then(function (rep) {
        if (rep.status === 401 || rep.status === 403) return ko('session');
        if (!rep.ok) return ko('reseau');
        effacerDonnees(deps.storage, u);
        try { deps.storage.removeItem('pq-auth-reel'); } catch (err) {}
        return ok();
      });
    }).catch(function () { return ko('reseau'); });
  }

  function dialogueHtml(lang) {
    var t = TEXTES[langue(lang)];
    return '<dialog id="pq-suppression" class="pq-suppression" aria-labelledby="pq-suppression-titre" aria-describedby="pq-suppression-desc">' +
      '<h2 id="pq-suppression-titre" class="pq-suppression-titre">' + esc(t.titre) + '</h2>' +
      '<p id="pq-suppression-desc">' + esc(t.desc) + '</p>' +
      '<ul class="pq-suppression-liste">' + t.quoi.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<label for="pq-suppression-mot" class="pq-suppression-label">' + esc(t.label) + '</label>' +
      '<p id="pq-suppression-aide" class="pq-suppression-aide">' + esc(t.aide) + '</p>' +
      '<input id="pq-suppression-mot" type="text" class="pq-suppression-champ" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-describedby="pq-suppression-aide">' +
      '<p id="pq-suppression-erreur" class="pq-suppression-erreur" hidden></p>' +
      '<div class="pq-suppression-actions">' +
      '<button type="button" class="pq-suppression-annuler" data-suppression-annuler autofocus>' + esc(t.annuler) + '</button>' +
      '<button type="button" class="pq-suppression-confirmer" data-suppression-confirmer>' + esc(t.confirmer) + '</button></div>' +
      '<p class="pq-suppression-etat" role="status"></p>' +
      '</dialog>';
  }

  var CSS = '.pq-suppression{width:min(540px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;box-sizing:border-box;padding:24px 26px;border:1.5px solid var(--bord-fort);border-radius:18px;background:var(--creme);color:var(--texte);font-family:\'DM Sans\', -apple-system, \'Segoe UI\', Roboto, sans-serif;font-size:15px;line-height:1.5;box-shadow:var(--ombre-2)}' +
    '.pq-suppression::backdrop{background:var(--voile)}' +
    '.pq-suppression p{margin:0 0 10px}' +
    '.pq-suppression-titre{margin:0 0 10px;font-family:Fraunces, Georgia, serif;font-size:24px;line-height:1.2;color:var(--erreur)}' +
    '.pq-suppression-liste{margin:0 0 16px;padding-left:20px}' +
    '.pq-suppression-label{display:block;font-weight:700}' +
    '.pq-suppression-aide{font-size:14px;color:var(--doux)}' +
    '.pq-suppression-champ{width:100%;box-sizing:border-box;min-height:44px;padding:8px 12px;border:1.5px solid var(--bord-champ);border-radius:12px;background:var(--champ);color:var(--texte);font:inherit;font-weight:700;letter-spacing:.06em}' +
    '.pq-suppression-champ[aria-invalid="true"]{border-color:var(--erreur)}' +
    '.pq-suppression-erreur{margin:8px 0 0!important;color:var(--erreur);font-weight:600;font-size:14px}' +
    '.pq-suppression-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;margin-top:18px}' +
    '.pq-suppression-annuler{min-height:44px;padding:0 18px;border-radius:999px;border:1.5px solid var(--brun);background:var(--creme);color:var(--brun);font:inherit;font-weight:700;cursor:pointer}' +
    '.pq-suppression-annuler:hover{background:var(--sable);color:var(--brun-fonce)}' +
    '.pq-suppression-confirmer{min-height:44px;padding:0 18px;border-radius:999px;border:1.5px solid var(--erreur);background:var(--erreur);color:var(--sur-plein);font:inherit;font-weight:700;cursor:pointer}' +
    '.pq-suppression-confirmer[aria-disabled="true"]{opacity:.7;cursor:progress}' +
    '.pq-suppression button:focus-visible,.pq-suppression-champ:focus-visible{outline:3px solid var(--focus);outline-offset:2px}' +
    '.pq-suppression-etat{margin:12px 0 0!important;font-weight:600}' +
    '.pq-suppression-etat:empty{display:none}' +
    '@media (max-width:480px){.pq-suppression{padding:18px}.pq-suppression-actions{flex-direction:column}.pq-suppression-actions button{width:100%}}';

  var Compte = {
    CLES_PAR_COMPTE: CLES_PAR_COMPTE, CLES_APPAREIL: CLES_APPAREIL, CLE_ADIEU: CLE_ADIEU, MOTS: MOTS, TEXTES: TEXTES,
    cleCompte: cleCompte, motValide: motValide, effacerDonnees: effacerDonnees,
    supprimerDemo: supprimerDemo, supprimerReel: supprimerReel, dialogueHtml: dialogueHtml
  };

  if (typeof module === 'object' && module.exports) { module.exports = Compte; return; }
  root.Compte = Compte;

  /* ---------- Navigateur ---------- */
  var doc = root.document;

  function styler() {
    if (doc.getElementById('pq-suppression-style')) return;
    var s = doc.createElement('style');
    s.id = 'pq-suppression-style';
    s.textContent = CSS;
    doc.head.appendChild(s);
  }

  function supprimer() {
    try { root.sessionStorage.removeItem('pq-mail'); } catch (err) {}
    if (root.PQ_MODE === 'reel') {
      return supprimerReel(root.PQ_CONFIG, {
        fetch: function (u, o) { return root.fetch(u, o); },
        storage: root.localStorage,
        utilisateur: function () { return root.Auth.utilisateurCourant(); },
        jeton: function () { return root.Auth.jetonValide(); }
      });
    }
    return Promise.resolve(supprimerDemo(root.localStorage, root.Auth));
  }

  // o : { lang, retour: sélecteur du bouton qui reprend le focus à la fermeture }.
  function ouvrir(o) {
    var lang = langue(o && o.lang);
    var t = TEXTES[lang];
    var ancien = doc.getElementById('pq-suppression');
    if (ancien) ancien.remove();
    styler();
    doc.body.insertAdjacentHTML('beforeend', dialogueHtml(lang));
    var dlg = doc.getElementById('pq-suppression');
    var champ = dlg.querySelector('#pq-suppression-mot');
    var erreur = dlg.querySelector('#pq-suppression-erreur');
    var etat = dlg.querySelector('.pq-suppression-etat');
    var confirmer = dlg.querySelector('[data-suppression-confirmer]');
    var enCours = false;

    function erreurMot(oui) {
      erreur.hidden = !oui;
      erreur.textContent = oui ? t.motFaux : '';
      if (oui) { champ.setAttribute('aria-invalid', 'true'); champ.setAttribute('aria-describedby', 'pq-suppression-erreur pq-suppression-aide'); }
      else { champ.removeAttribute('aria-invalid'); champ.setAttribute('aria-describedby', 'pq-suppression-aide'); }
    }

    function valider() {
      if (enCours) return;
      if (!motValide(champ.value, lang)) { erreurMot(true); champ.focus(); return; }
      erreurMot(false);
      enCours = true;
      confirmer.setAttribute('aria-disabled', 'true');
      etat.textContent = t.enCours;
      supprimer().then(function (r) {
        if (r.ok) {
          try { root.sessionStorage.setItem(CLE_ADIEU, '1'); } catch (err) {}
          root.location.href = '/';
          return;
        }
        enCours = false;
        confirmer.removeAttribute('aria-disabled');
        etat.textContent = t[r.erreur] || t.reseau;
      });
    }

    dlg.querySelector('[data-suppression-annuler]').addEventListener('click', function () { dlg.close(); });
    confirmer.addEventListener('click', valider);
    champ.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    champ.addEventListener('input', function () { if (!erreur.hidden) erreurMot(false); });
    // Pendant la suppression, Échap ne ferme pas (le résultat doit rester visible).
    dlg.addEventListener('cancel', function (e) { if (enCours) e.preventDefault(); });
    // Focus gardé dans le dialogue (Tab et Maj+Tab bouclent).
    dlg.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(dlg.querySelectorAll('button,input'), function (x) { return !x.disabled; });
      var premier = f[0], dernier = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === premier) { e.preventDefault(); dernier.focus(); }
      else if (!e.shiftKey && doc.activeElement === dernier) { e.preventDefault(); premier.focus(); }
    });
    dlg.addEventListener('close', function () {
      dlg.remove();
      var b = o && o.retour ? doc.querySelector(o.retour) : null;
      if (b) b.focus();
    });
    dlg.showModal();
    // Ordre du DOM : le texte d'abord, mais le focus initial va sur « Annuler » (choix par défaut, sans risque).
    dlg.querySelector('[data-suppression-annuler]').focus();
  }

  Compte.ouvrir = ouvrir;
})(this);
