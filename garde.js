/* Garde des pages de l'application (comptoir, fournée, fournil, garde-manger, profil).
   Chargé dans le <head>, après store.js, demo.js et auth.js : sans session, renvoie vers
   /connexion?retour=… . retourSur() empêche toute redirection hors du site (testé sous Node). */
(function (root) {
  var DEFAUT = '/fournee';

  // Seuls les chemins internes sont acceptés : « / » suivi d'autre chose que « / » ou « \ », aucun « \ »,
  // et aucun espace ni caractère de contrôle (le navigateur retire tabulations et retours à la ligne :
  // « /\t/pirate.fr » deviendrait « //pirate.fr »).
  function retourSur(valeur) {
    if (typeof valeur !== 'string' || valeur.charAt(0) !== '/') return DEFAUT;
    if (/[\s\u0000-\u001f\u007f]/.test(valeur)) return DEFAUT;
    if (valeur.charAt(1) === '/' || valeur.indexOf('\\') !== -1) return DEFAUT;
    return valeur;
  }

  function adresseConnexion(pathname, search) {
    return '/connexion?retour=' + encodeURIComponent(String(pathname || '') + String(search || ''));
  }

  var Garde = { retourSur: retourSur, adresseConnexion: adresseConnexion };

  if (typeof module === 'object' && module.exports) module.exports = Garde;
  else {
    root.Garde = Garde;
    if (root.document && root.document.documentElement.hasAttribute('data-protegee') && !(root.Auth && root.Auth.utilisateurCourant())) {
      root.__redirige = true;
      root.location.replace(adresseConnexion(root.location.pathname, root.location.search));
    }
  }
})(this);
