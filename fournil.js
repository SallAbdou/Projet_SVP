/* Logique pure du fournil : choix du sujet, checklist du post, aperçu dans le fil,
   variantes de brouillon et validation des chiffres reportés.
   Aucun accès au DOM, utilisable dans le navigateur (window.Fournil) et sous Node (tests). */
(function (root) {
  var MAX = 3000;
  var ACCROCHE_MAX = 120;
  var APERCU_MAX = 210;
  var LETTRE = 'a-zà-öø-ÿ';
  var PDV_FR_MOT = new RegExp('(^|[^' + LETTRE + '])(je|mon|mes)(?![' + LETTRE + '])', 'i');
  var PDV_FR_ELISION = new RegExp('(^|[^' + LETTRE + '])j[\'’]', 'i');

  function liste(v) { return Array.isArray(v) ? v : []; }
  function texteDe(v) { return typeof v === 'string' ? v : ''; }

  function trouverSujet(ref, articles, sauves) {
    if (typeof ref !== 'string' || ref === '') return null;
    var a = liste(articles).filter(function (x) { return x && x.ref === ref; })[0];
    if (a) return { article: a, origine: 'fournee' };
    var s = liste(sauves).filter(function (x) { return x && x.ref === ref; })[0];
    return s ? { article: s, origine: 'garde-manger' } : null;
  }

  function listeChoix(articles, sauves) {
    var jour = liste(articles).filter(Boolean).slice().sort(function (a, b) { return a.rang - b.rang; });
    var refs = jour.map(function (a) { return a.ref; });
    var cotes = liste(sauves).filter(function (s) { return s && refs.indexOf(s.ref) === -1; }).slice()
      .sort(function (a, b) { return String(b.savedAt || '').localeCompare(String(a.savedAt || '')); });
    return { jour: jour, cotes: cotes };
  }

  function pointDeVue(t, langue) {
    if (langue === 'en') return /\bI\b/.test(t) || /\bmy\b/i.test(t);
    return PDV_FR_MOT.test(t) || PDV_FR_ELISION.test(t);
  }

  function checklist(texte, langue) {
    var t = texteDe(texte);
    var net = t.trim();
    var premier = net.split(/\n[ \t]*\n/)[0].trim();
    return {
      accroche: premier.length > 0 && premier.length <= ACCROCHE_MAX,
      chiffre: /\d/.test(t),
      pointDeVue: pointDeVue(t, langue),
      question: /\?$/.test(net),
      longueur: t.length,
      max: MAX,
      enTrop: Math.max(0, t.length - MAX)
    };
  }

  function apercu(texte, limite) {
    var t = texteDe(texte).trim();
    var max = limite || APERCU_MAX;
    if (t.length <= max) return { texte: t, coupe: false };
    var debut = t.slice(0, max + 1);
    var esp = Math.max(debut.lastIndexOf(' '), debut.lastIndexOf('\n'));
    var coupe = esp >= max - 60 ? t.slice(0, esp) : t.slice(0, max);
    return { texte: coupe.trim(), coupe: true };
  }

  function texteModifie(texte, propose) {
    return texteDe(texte).trim() !== texteDe(propose).trim();
  }

  var Fournil = {
    MAX: MAX, trouverSujet: trouverSujet, listeChoix: listeChoix, checklist: checklist,
    apercu: apercu, texteModifie: texteModifie
  };

  if (typeof module === 'object' && module.exports) module.exports = Fournil;
  else root.Fournil = Fournil;
})(this);
