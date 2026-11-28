/* Adaptateur des données : aujourd'hui des fichiers locaux, demain le webhook n8n WF3.
   Le reste du front ne connaît que ces fonctions, qui renvoient exactement le format de WF3. */
(function (root) {
  var ETATS = ['pret', 'attente', 'invalide'];
  var FEUX = ['vert', 'orange', 'rouge'];

  function note(v) { return typeof v === 'number' && v % 1 === 0 && v >= 1 && v <= 5; }

  function articleValide(a) {
    return !!a && typeof a === 'object' &&
      typeof a.ref === 'string' && a.ref !== '' &&
      typeof a.rang === 'number' && a.rang % 1 === 0 && a.rang >= 1 &&
      typeof a.titre === 'string' &&
      FEUX.indexOf(a.feu) !== -1 &&
      note(a.durabilite) && note(a.propension) && note(a.lienOffre);
  }

  function estReponseValide(r) {
    if (!r || typeof r !== 'object' || Array.isArray(r) || ETATS.indexOf(r.etat) === -1) return false;
    if (r.etat !== 'pret') return true;
    return typeof r.prenom === 'string' && Array.isArray(r.articles) && r.articles.every(articleValide);
  }

  function lireJson(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  var Cfg = typeof module === 'object' && module.exports ? require('./config.js') : root.Config;

  function marquerExemple(r) { r.source = 'exemple'; return r; }

  // Mode réel : WF3 avec le jeton de session. Lenteur, panne ou réponse invalide : fournée d'exemple
  // marquée source: 'exemple'. Plus de session : { etat: 'invalide' }, sans appeler WF3.
  // deps = { fetch, jeton: () => Promise<string|null>, url, delaiMs, lireExemple: () => Promise }
  function chargerFourneeReelle(deps) {
    function exemple() { return deps.lireExemple().then(marquerExemple); }
    return Promise.resolve().then(deps.jeton).then(function (jeton) {
      if (!jeton) return { etat: 'invalide' };
      var options = { method: 'POST', headers: { Authorization: 'Bearer ' + jeton, 'Content-Type': 'application/json' }, body: '{}' };
      return Cfg.fetchAvecDelai(deps.fetch, deps.url, options, deps.delaiMs).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }).then(function (r) {
        if (!estReponseValide(r)) throw new Error('réponse de fournée invalide');
        return r;
      });
    }).catch(exemple);
  }

  function lireExemple() {
    return lireJson('/data/fournee.json').then(function (r) {
      if (!estReponseValide(r)) throw new Error('réponse de fournée invalide');
      return r;
    });
  }

  // Juste après l'inscription, WF3 n'a pas encore écrit la sélection : on simule « attente » quelques secondes.
  function chargerFournee() {
    if (root.PQ_MODE === 'reel' && root.PQ_CONFIG && root.Auth) {
      return chargerFourneeReelle({
        fetch: function (u, o) { return root.fetch(u, o); },
        jeton: root.Auth.jetonValide,
        url: root.PQ_CONFIG.webhookFournee,
        delaiMs: root.PQ_CONFIG.delaiReseauMs || 8000,
        lireExemple: lireExemple
      });
    }
    try {
      if (root.Auth && root.Auth.ouvrirFour) root.Auth.ouvrirFour();
      if (root.Auth && root.Auth.fourneeAuFour(root.Auth.charger(), new Date().toISOString())) {
        return Promise.resolve({ etat: 'attente' });
      }
    } catch (err) {}
    return lireExemple();
  }

  var CHIFFRES = ['impressions', 'reactions', 'republications', 'commentaires', 'contacts'];
  function entierPositif(v) { return typeof v === 'number' && v % 1 === 0 && v >= 0; }

  // Post de l'historique d'exemple (data/posts.json), daté relativement à aujourd'hui.
  function postExempleValide(p) {
    return !!p && typeof p === 'object' && !Array.isArray(p) &&
      typeof p.ref === 'string' && p.ref !== '' &&
      typeof p.titre === 'string' && typeof p.label === 'string' &&
      FEUX.indexOf(p.feu) !== -1 && entierPositif(p.ilYaJours) &&
      !!p.chiffres && typeof p.chiffres === 'object' &&
      CHIFFRES.every(function (c) { return entierPositif(p.chiffres[c]); });
  }

  // Les posts d'exemple invalides sont écartés, un seul mauvais post ne vide pas le comptoir.
  function chargerPosts() {
    return lireJson('/data/posts.json').then(function (p) {
      if (!Array.isArray(p)) throw new Error('posts invalides');
      return p.filter(postExempleValide);
    });
  }

  /* LinkedIn : les fonctions serveur /api/linkedin/* gardent le jeton (cookie HttpOnly) ;
     la page ne voit que l'état de la connexion, le profil et les chiffres. */
  function reponseJson(res) {
    return res.json().catch(function () { return {}; }).then(function (j) {
      if (!res.ok) { var e = new Error(j.erreur || 'HTTP ' + res.status); e.code = j.erreur || 'reseau'; throw e; }
      return j;
    });
  }

  // Pas de fonction serveur (site statique, autre serveur) : 404, on dit « non configuré ».
  // urns : posts publiés depuis le fournil dont on veut les chiffres.
  function lireLinkedIn(urns) {
    var q = urns && urns.length ? '?posts=' + encodeURIComponent(urns.join(',')) : '';
    return fetch('/api/linkedin/session' + q, { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then(function (res) {
      if (res.status === 404) return { configure: false, connecte: false };
      return reponseJson(res);
    });
  }

  function exempleLinkedIn() { return lireJson('/data/linkedin.json'); }

  function publierLinkedIn(texte, visibilite) {
    return fetch('/api/linkedin/publier', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ texte: texte, visibilite: visibilite })
    }).then(reponseJson);
  }

  function deconnecterLinkedIn() {
    return fetch('/api/linkedin/deconnexion', { method: 'POST', credentials: 'same-origin' }).then(reponseJson);
  }

  var Api = { estReponseValide: estReponseValide, postExempleValide: postExempleValide, chargerFournee: chargerFournee, chargerFourneeReelle: chargerFourneeReelle, chargerPosts: chargerPosts,
    lireLinkedIn: lireLinkedIn, exempleLinkedIn: exempleLinkedIn, publierLinkedIn: publierLinkedIn, deconnecterLinkedIn: deconnecterLinkedIn };

  if (typeof module === 'object' && module.exports) module.exports = Api;
  else root.Api = Api;
})(this);
