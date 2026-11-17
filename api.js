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

  // Juste après l'inscription, WF3 n'a pas encore écrit la sélection : on simule « attente » quelques secondes.
  function chargerFournee() {
    try {
      if (root.Auth && root.Auth.ouvrirFour) root.Auth.ouvrirFour();
      if (root.Auth && root.Auth.fourneeAuFour(root.Auth.charger(), new Date().toISOString())) {
        return Promise.resolve({ etat: 'attente' });
      }
    } catch (err) {}
    return lireJson('/data/fournee.json').then(function (r) {
      if (!estReponseValide(r)) throw new Error('réponse de fournée invalide');
      return r;
    });
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

  var Api = { estReponseValide: estReponseValide, postExempleValide: postExempleValide, chargerFournee: chargerFournee, chargerPosts: chargerPosts };

  if (typeof module === 'object' && module.exports) module.exports = Api;
  else root.Api = Api;
})(this);
