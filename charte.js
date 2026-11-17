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

  var Charte = { luminance: luminance, contraste: contraste, puce: puce, barre: barre };
  if (typeof module === 'object' && module.exports) module.exports = Charte;
  else root.Charte = Charte;
})(this);
