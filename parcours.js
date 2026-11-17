/* En-tête commun des écrans du parcours d'entrée (logo, langue, lien de connexion optionnel).
   enteteHtml() est pur et testé ; dans le navigateur, remplit [data-entete] après chaque rendu
   (événement « pq:rendu » de boot.js). Attribut data-connexion : affiche « Se connecter ». */
(function (root) {
  var TEXTES = {
    fr: { langue: 'Langue', accueil: 'Votre pAIn quotidien, accueil', connexion: 'Se connecter' },
    en: { langue: 'Language', accueil: 'Votre pAIn quotidien, home', connexion: 'Log in' }
  };

  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function enteteHtml(o) {
    var lang = o.lang === 'en' ? 'en' : 'fr';
    var t = TEXTES[lang];
    return '<a class="logo" href="/" aria-label="' + esc(t.accueil) + '">' +
      '<span class="logo-icone"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14c0-4.4 3.6-8 8-8s8 3.6 8 8v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path><path d="M9 10l1.5 2M12 9.5l1.5 2M15 10l1.5 2"></path></svg></span>' +
      '<span class="logo-nom" aria-hidden="true">Votre p<span>AI</span>n quotidien</span></a>' +
      '<div class="entete-droite">' +
      (o.connexion ? '<a class="lien" href="/connexion" data-focus="entete-connexion">' + esc(t.connexion) + '</a>' : '') +
      '<div class="langues" role="group" aria-label="' + esc(t.langue) + '">' +
      '<button type="button" data-lang="fr" data-focus="lang-fr" aria-pressed="' + (lang === 'fr') + '">FR</button>' +
      '<button type="button" data-lang="en" data-focus="lang-en" aria-pressed="' + (lang === 'en') + '">EN</button>' +
      '</div></div>';
  }

  function monter(e) {
    var rootEl = e.detail && e.detail.root;
    var el = rootEl && rootEl.querySelector('[data-entete]');
    if (!el) return;
    el.innerHTML = enteteHtml({ lang: e.detail.lang, connexion: el.hasAttribute('data-connexion') });
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

  var Parcours = { enteteHtml: enteteHtml, focaliser: focaliser };
  if (typeof module === 'object' && module.exports) module.exports = Parcours;
  else {
    root.Parcours = Parcours;
    document.addEventListener('pq:rendu', monter);
  }
})(this);
