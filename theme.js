/* Thème de couleur choisi dans « Mon profil » : Bronze (défaut), Boulangerie classique, Nuit, Contraste élevé.
   Mémorisé par compte en localStorage « pq-theme » = { version: 1, comptes: { [e-mail ou abonneId]: nom } }.
   Chargé dans le <head> des pages protégées, après auth.js et garde.js : pose data-theme sur <html>
   avant le premier rendu (aucun flash). Les couleurs vivent dans charte.css. Logique pure testée sous Node. */
(function (root) {
  var CLE = 'pq-theme';
  var THEMES = ['bronze', 'classique', 'nuit', 'contraste'];
  var DEFAUT = 'bronze';

  function normaliser(nom) { return THEMES.indexOf(nom) !== -1 ? nom : DEFAUT; }

  // Même règle que Retours.pur.cleCompte : e-mail en minuscules, sinon abonneId, sinon null.
  function cleCompte(u) {
    if (!u) return null;
    var email = typeof u.email === 'string' ? u.email.trim().toLowerCase() : '';
    if (email) return email;
    return typeof u.abonneId === 'string' && u.abonneId ? u.abonneId : null;
  }

  function etat(storage) {
    try {
      var raw = JSON.parse(storage.getItem(CLE));
      if (raw && raw.version === 1 && raw.comptes && typeof raw.comptes === 'object' && !Array.isArray(raw.comptes)) return raw;
    } catch (err) {}
    return { version: 1, comptes: {} };
  }

  function lire(storage, cle) {
    if (!cle) return DEFAUT;
    var comptes = etat(storage).comptes;
    return Object.prototype.hasOwnProperty.call(comptes, cle) ? normaliser(comptes[cle]) : DEFAUT;
  }

  function enregistrer(storage, cle, nom) {
    if (!cle) return false;
    try {
      var e = etat(storage);
      e.comptes[cle] = normaliser(nom);
      storage.setItem(CLE, JSON.stringify(e));
      return true;
    } catch (err) {
      return false;
    }
  }

  function appliquer(doc, nom) { doc.documentElement.setAttribute('data-theme', normaliser(nom)); }

  var Theme = { CLE: CLE, THEMES: THEMES, DEFAUT: DEFAUT, normaliser: normaliser, cleCompte: cleCompte, lire: lire, enregistrer: enregistrer, appliquer: appliquer };

  if (typeof module === 'object' && module.exports) module.exports = Theme;
  else {
    root.Theme = Theme;
    try {
      var u = root.Auth && root.Auth.utilisateurCourant();
      appliquer(root.document, lire(root.localStorage, cleCompte(u)));
    } catch (err) {}
  }
})(this);
