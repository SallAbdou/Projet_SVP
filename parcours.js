/* En-tête commun des écrans du parcours d'entrée (logo, langue, lien de connexion optionnel).
   enteteHtml() est pur et testé ; dans le navigateur, remplit [data-entete] après chaque rendu
   (événement « pq:rendu » de boot.js). Attribut data-connexion : affiche « Se connecter ».
   piedHtml() remplit de même [data-pied] : liens Confidentialité et Accessibilité (lot 26). */
(function (root) {
  var TEXTES = {
    fr: { langue: 'Langue', accueil: 'Votre pAIn quotidien, accueil', connexion: 'Se connecter', confidentialite: 'Confidentialité', accessibilite: 'Accessibilité' },
    en: { langue: 'Language', accueil: 'Votre pAIn quotidien, home', connexion: 'Log in', confidentialite: 'Privacy', accessibilite: 'Accessibility' }
  };

  var LIENS_PIED = [{ id: 'confidentialite', href: '/confidentialite' }, { id: 'accessibilite', href: '/accessibilite' }];

  // Liens du pied de page ; o.chemin (location.pathname) marque la page courante (aria-current).
  function piedHtml(o) {
    var t = TEXTES[o.lang === 'en' ? 'en' : 'fr'];
    var chemin = String(o.chemin || '').replace(/\.html$/, '').replace(/\/+$/, '');
    return LIENS_PIED.map(function (l) {
      return '<a href="' + l.href + '"' + (chemin === l.href ? ' aria-current="page"' : '') + '>' + esc(t[l.id]) + '</a>';
    }).join('');
  }

  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function enteteHtml(o) {
    var lang = o.lang === 'en' ? 'en' : 'fr';
    var t = TEXTES[lang];
    return '<a class="logo" href="/" aria-label="' + esc(t.accueil) + '">' +
      '<span class="logo-icone"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14c0-4.4 3.6-8 8-8s8 3.6 8 8v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path><path d="M9 10l1.5 2M12 9.5l1.5 2M15 10l1.5 2"></path></svg></span>' +
      '<span class="logo-nom" aria-hidden="true">Votre p<span>AI</span>n quotidien</span></a>' +
      '<div class="entete-droite">' +
      (o.qr ? '<button type="button" class="entete-qr" data-qr-ouvrir aria-haspopup="dialog" data-focus="entete-qr">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h1M20 14h1"></path></svg>' +
        '<span class="entete-qr-texte">QR code</span></button>' : '') +
      (o.connexion ? '<a class="lien" href="/connexion" data-focus="entete-connexion">' + esc(t.connexion) + '</a>' : '') +
      '<div class="langues" role="group" aria-label="' + esc(t.langue) + '">' +
      '<button type="button" data-lang="fr" data-focus="lang-fr" aria-pressed="' + (lang === 'fr') + '">FR</button>' +
      '<button type="button" data-lang="en" data-focus="lang-en" aria-pressed="' + (lang === 'en') + '">EN</button>' +
      '</div></div>';
  }

  function monter(e) {
    var rootEl = e.detail && e.detail.root;
    var pied = rootEl && rootEl.querySelector('[data-pied]');
    if (pied) pied.innerHTML = piedHtml({ lang: e.detail.lang, chemin: root.location && root.location.pathname });
    var el = rootEl && rootEl.querySelector('[data-entete]');
    if (!el) return;
    el.innerHTML = enteteHtml({ lang: e.detail.lang, connexion: el.hasAttribute('data-connexion'), qr: el.hasAttribute('data-qr') });
    var qr = el.querySelector('[data-qr-ouvrir]');
    if (qr) qr.addEventListener('click', function () { if (root.__app && root.__app.ouvrirQr) root.__app.ouvrirQr(); });
    el.querySelectorAll('[data-lang]').forEach(function (b) {
      b.addEventListener('click', function () { root.__app.setState({ lang: b.getAttribute('data-lang') }); });
    });
  }

  // Focus déplacé par une page (champ en erreur, titre d'étape) : curseur placé en fin de saisie.
  function focaliser(el) {
    if (!el) return;
    el.focus();
    try { if (typeof el.value === 'string' && el.setSelectionRange) el.setSelectionRange(el.value.length, el.value.length); } catch (err) {}
  }

  function focalisables(el) {
    return Array.prototype.filter.call(el.querySelectorAll('a[href],button'), function (x) { return x.offsetParent !== null; });
  }

  // Fenêtre modale (onKeydown de la boîte) : Tab et Maj+Tab bouclent dans la boîte, Échap ferme.
  function clavierModale(e, fermer) {
    if (e.key === 'Escape') { e.preventDefault(); fermer(); return; }
    if (e.key !== 'Tab') return;
    var els = focalisables(e.currentTarget);
    if (!els.length) return;
    var premier = els[0], dernier = els[els.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  }

  var Parcours = { enteteHtml: enteteHtml, piedHtml: piedHtml, focaliser: focaliser, focalisables: focalisables, clavierModale: clavierModale };
  if (typeof module === 'object' && module.exports) module.exports = Parcours;
  else {
    root.Parcours = Parcours;
    document.addEventListener('pq:rendu', monter);
  }
})(this);
