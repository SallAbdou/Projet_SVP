/* Charte graphique : logique pure (contraste WCAG, classe de puce et couleur de barre par état).
   Les couleurs elles-mêmes vivent dans charte.css. */
(function (root) {
  // Luminance relative WCAG 2 d'une couleur #RRGGBB.
  function luminance(hex) {
    var h = String(hex).replace('#', '');
    function canal(i) {
      var c = parseInt(h.substr(i, 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);
  }

  function contraste(a, b) {
    var x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }

  // Noms d'état rencontrés dans le code : feu de n8n (vert, orange, rouge), fournée (hot, knead, stale),
  // garde-manger (chaud, enfourner, rassis). Seul l'affichage dépend de cette table.
  var FAMILLE = {
    vert: 'chaud', hot: 'chaud', chaud: 'chaud',
    orange: 'petrir', knead: 'petrir', enfourner: 'petrir',
    rouge: 'rassis', stale: 'rassis', rassis: 'rassis'
  };

  function famille(etat) { return Object.prototype.hasOwnProperty.call(FAMILLE, etat) ? FAMILLE[etat] : ''; }
  function puce(etat) { var f = famille(etat); return f ? 'puce puce-' + f : ''; }
  function barre(etat) { var f = famille(etat); return f ? 'var(--barre-' + f + ')' : ''; }

  // Rassis est gris clair dans les graphiques : un contour plus sombre le détache du fond (3:1).
  function contourBarre(etat) { return famille(etat) === 'rassis' ? 'inset 0 0 0 2px var(--barre-rassis-contour)' : ''; }

  // Lot 37 : teinte de chaque thématique, reprise des étiquettes du questionnaire Tally. Le cycle des
  // 12 thématiques passe par 8 teintes (variables --th-<teinte>-fond / -texte / -bord de charte.css).
  // Clés normalisées (sans accents, minuscules, espaces réduits) ; libellés anglais (Questionnaire.LIBELLES_EN)
  // acceptés aussi. Thématique inconnue : gris. Le nom reste toujours écrit à côté de la couleur.
  var TEINTES_THEMES = ['rouge', 'orange', 'jaune', 'vert', 'bleu', 'violet', 'rose', 'gris'];
  var THEMES = [
    ['LLMs'], ['Vidéo', 'Video'], ['Image'], ['Automatisation et agents', 'Automation and agents'],
    ['Cybersécurité', 'Cybersecurity'], ['Actualité des grandes firmes', 'Big tech news'],
    ['Monétisation', 'Monetisation', 'Monetization'], ['Finance et spéculation', 'Finance and speculation'],
    ['Hardware'], ['IA en entreprise', 'AI at work'], ['Ecosystèmes', 'Ecosystems'], ['Ingénierie R&D', 'R&D engineering']
  ];
  var ACCENTS = { 'à': 'a', 'â': 'a', 'ä': 'a', 'ç': 'c', 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'î': 'i', 'ï': 'i', 'ô': 'o', 'ö': 'o', 'ù': 'u', 'û': 'u', 'ü': 'u', 'ÿ': 'y', 'œ': 'oe' };
  function cleTheme(nom) {
    return String(nom).toLowerCase().replace(/[àâäçéèêëîïôöùûüÿœ]/g, function (c) { return ACCENTS[c]; }).replace(/\s+/g, ' ').trim();
  }
  var TEINTE_PAR_THEME = {};
  THEMES.forEach(function (noms, i) {
    noms.forEach(function (n) { TEINTE_PAR_THEME[cleTheme(n)] = TEINTES_THEMES[i % TEINTES_THEMES.length]; });
  });
  function teinteTheme(nom) {
    if (typeof nom !== 'string') return 'gris';
    var k = cleTheme(nom);
    return Object.prototype.hasOwnProperty.call(TEINTE_PAR_THEME, k) ? TEINTE_PAR_THEME[k] : 'gris';
  }

  var Charte = { luminance: luminance, contraste: contraste, puce: puce, barre: barre, contourBarre: contourBarre,
    TEINTES_THEMES: TEINTES_THEMES, teinteTheme: teinteTheme };
  if (typeof module === 'object' && module.exports) module.exports = Charte;
  else root.Charte = Charte;
})(this);
