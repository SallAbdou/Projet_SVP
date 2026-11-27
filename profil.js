/* Logique pure de la page Mon profil : lignes libellé / valeur des sections Informations et Préférences.
   Aucun accès au DOM, utilisable dans le navigateur (window.Profil) et sous Node (tests). */
(function (root) {
  // Valeurs du questionnaire (textes du Tally) reformulées pour la page profil.
  var RELATIONS = {
    'Timide': { fr: 'Timide (je découvre l’IA)', en: 'Shy (just discovering AI)' },
    'En couple': { fr: 'En couple (à l’aise avec l’IA)', en: 'In a relationship (comfortable with AI)' },
    'Marié': { fr: 'Marié (l’IA n’a plus de secret)', en: 'Married (AI holds no secrets)' }
  };
  var LANGUES = {
    'Je veux des sources françaises uniquement': { fr: 'Sources françaises uniquement', en: 'French sources only' },
    'Je veux des sources polyglottes avec une traduction française': { fr: 'Sources du monde entier, traduites en français', en: 'Sources from everywhere, translated into French' },
    'English all the way': { fr: 'Tout en anglais', en: 'English all the way' }
  };
  var TEXTES = {
    fr: { prenom: 'Prénom', email: 'E-mail', metier: 'Métier', themes: 'Thématiques', relation: 'Relation avec l’IA', langue: 'Langue des articles', vide: 'Non renseigné' },
    en: { prenom: 'First name', email: 'Email', metier: 'Job', themes: 'Topics', relation: 'Relationship with AI', langue: 'Article language', vide: 'Not set' }
  };

  function liste(v) { return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string' && x; }) : []; }
  function traduire(table, v, lang) { return Object.prototype.hasOwnProperty.call(table, v) ? table[v][lang] : v; }

  // u : utilisateur de Auth.utilisateurCourant() (ou null) ; libelle(valeur, lang) : Questionnaire.libelle.
  function lignes(u, lang, libelle) {
    var l = lang === 'en' ? 'en' : 'fr';
    var t = TEXTES[l];
    var pr = (u && u.profil) || {};
    var lib = function (x) { return libelle ? libelle(x, l) : x; };
    var ligne = function (label, valeur) { return { label: label, valeur: valeur ? String(valeur) : t.vide }; };
    return {
      infos: [ligne(t.prenom, u && u.prenom), ligne(t.email, u && u.email)],
      prefs: [
        ligne(t.metier, liste(pr.metiers).map(lib).join(', ')),
        ligne(t.themes, liste(pr.thematiques).map(lib).join(', ')),
        ligne(t.relation, pr.relation ? traduire(RELATIONS, pr.relation, l) : ''),
        ligne(t.langue, pr.langue ? traduire(LANGUES, pr.langue, l) : '')
      ]
    };
  }

  // Lot 37 : thématiques du profil en puces, libellé traduit et teinte du questionnaire (Charte.teinteTheme,
  // calculée sur la valeur enregistrée). Sous Node, charte.js est chargé à la demande.
  function puces(u, lang, libelle) {
    var l = lang === 'en' ? 'en' : 'fr';
    var Ch = root.Charte || (typeof require === 'function' ? require('./charte.js') : null);
    var pr = (u && u.profil) || {};
    return liste(pr.thematiques).map(function (x) {
      return { label: libelle ? libelle(x, l) : x, teinte: Ch ? Ch.teinteTheme(x) : 'gris' };
    });
  }

  var Profil = { lignes: lignes, puces: puces };
  if (typeof module === 'object' && module.exports) module.exports = Profil;
  else root.Profil = Profil;
})(this);
