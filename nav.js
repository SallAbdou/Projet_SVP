/* Nav latérale commune à toutes les pages de l'application.
   Nav.html() produit le contenu (logique pure, testée) ; dans le navigateur, nav.js remplit
   l'élément [data-nav data-page="…"] après chaque rendu (événement « pq:rendu » de boot.js). */
(function (root) {
  var TEXTES = {
    fr: {
      tagline: 'On pétrit l’actu IA pour toi.', langLabel: 'Langue', role: 'Consultante IA · solopreneuse',
      liens: { comptoir: 'Le comptoir', fournee: 'La fournée du jour', fournil: 'Le fournil', 'garde-manger': 'Le garde-manger', profil: 'Mon profil' },
      compteur: ['article mis de côté', 'articles mis de côté']
    },
    en: {
      tagline: 'We knead the AI news for you.', langLabel: 'Language', role: 'AI consultant · solopreneur',
      liens: { comptoir: 'The counter', fournee: 'Today’s batch', fournil: 'The kitchen', 'garde-manger': 'The pantry', profil: 'My profile' },
      compteur: ['saved article', 'saved articles']
    }
  };

  var PAGES = [
    { id: 'comptoir', href: '/', icone: '<path d="M3 10h18v10H3z"></path><path d="M5 10l2-5h10l2 5"></path>' },
    { id: 'fournee', href: '/fournee', icone: '<path d="M4 7h16M4 12h16M4 17h10"></path>' },
    { id: 'fournil', href: '/fournil', icone: '<rect x="3" y="4" width="18" height="16" rx="3"></rect><rect x="7" y="9" width="10" height="7" rx="2"></rect>' },
    { id: 'garde-manger', href: '/garde-manger', icone: '<path d="M6 3h12v18l-6-4-6 4z"></path>' },
    { id: 'profil', href: '/profil', icone: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"></path>' }
  ];

  var LIEN = 'display:flex;align-items:center;gap:10px;min-height:44px;padding:0 12px;border-radius:10px;color:#4A3324;text-decoration:none';
  var LIEN_ACTIF = 'display:flex;align-items:center;gap:10px;min-height:44px;padding:0 12px;border-radius:10px;background:#FFFDF8;color:#5E3412;font-weight:700;text-decoration:none;box-shadow:inset 0 0 0 1px #E7D6B8';
  var LANG_ON = 'min-height:44px;min-width:52px;padding:0 14px;border-radius:999px;border:0;background:#8A4F1C;color:#FFFDF8;font:inherit;font-weight:700;cursor:pointer';
  var LANG_OFF = 'min-height:44px;min-width:52px;padding:0 14px;border-radius:999px;border:0;background:transparent;color:#5E3412;font:inherit;font-weight:600;cursor:pointer';

  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function html(o) {
    var t = TEXTES[o.lang === 'en' ? 'en' : 'fr'];
    var liens = PAGES.map(function (p) {
      var actif = p.id === o.page;
      var compteur = p.id === 'garde-manger' && o.compteurGardeManger > 0
        ? '<span data-compteur aria-label="' + esc(o.compteurGardeManger + ' ' + t.compteur[o.compteurGardeManger > 1 ? 1 : 0]) + '" style="margin-left:auto;font-size:12px;font-weight:700;padding:1px 8px;border-radius:999px;background:#E9D2A9;color:#5E3412">' + o.compteurGardeManger + '</span>'
        : '';
      return '<a href="' + p.href + '"' + (actif ? ' aria-current="page"' : '') + ' style="' + (actif ? LIEN_ACTIF : LIEN) + '">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p.icone + '</svg>' +
        esc(t.liens[p.id]) + compteur + '</a>';
    }).join('');
    var fr = o.lang !== 'en';
    var prenom = o.prenom || '';
    return '<div style="display:flex;flex-direction:column;gap:6px">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<span style="width:38px;height:38px;border-radius:12px;background:#8A4F1C;color:#FBF5EA;display:inline-flex;align-items:center;justify-content:center">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14c0-4.4 3.6-8 8-8s8 3.6 8 8v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path><path d="M9 10l1.5 2M12 9.5l1.5 2M15 10l1.5 2"></path></svg></span>' +
      '<span style="font-family:Fraunces, Georgia, serif;font-weight:800;font-size:20px;line-height:1.1">Votre p<span style="color:#B5651D">AI</span>n quotidien</span></div>' +
      '<span style="font-size:13px;color:#6B5443">' + esc(t.tagline) + '</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:4px">' + liens + '</div>' +
      '<div style="margin-top:auto;display:flex;flex-direction:column;gap:14px">' +
      '<div role="group" aria-label="' + esc(t.langLabel) + '" style="display:flex;gap:4px;padding:4px;border-radius:999px;background:#E9D8BA;align-self:flex-start">' +
      '<button type="button" data-lang="fr" data-focus="lang-fr" aria-pressed="' + fr + '" style="' + (fr ? LANG_ON : LANG_OFF) + '">FR</button>' +
      '<button type="button" data-lang="en" data-focus="lang-en" aria-pressed="' + !fr + '" style="' + (fr ? LANG_OFF : LANG_ON) + '">EN</button></div>' +
      '<div style="border-top:1px solid #E7D6B8;padding-top:14px;display:flex;align-items:center;gap:10px">' +
      '<span aria-hidden="true" style="width:36px;height:36px;border-radius:50%;background:#B5651D;color:#FFFDF8;display:inline-flex;align-items:center;justify-content:center;font-weight:700">' + esc(prenom.charAt(0)) + '</span>' +
      '<div style="display:flex;flex-direction:column"><span style="font-weight:700;font-size:14px">' + esc(prenom) + '</span><span style="font-size:12px;color:#6B5443">' + esc(t.role) + '</span></div></div></div>';
  }

  function monter(e) {
    var rootEl = e.detail && e.detail.root;
    var nav = rootEl && rootEl.querySelector('[data-nav]');
    if (!nav) return;
    var compteur = 0;
    try { compteur = root.Store.charger(window.localStorage).sauves.length; } catch (err) {}
    nav.innerHTML = html({ page: nav.getAttribute('data-page'), lang: e.detail.lang, compteurGardeManger: compteur, prenom: 'Léa' });
    nav.querySelectorAll('[data-lang]').forEach(function (b) {
      b.addEventListener('click', function () { root.__app.setState({ lang: b.getAttribute('data-lang') }); });
    });
  }

  var Nav = { html: html };
  if (typeof module === 'object' && module.exports) module.exports = Nav;
  else {
    root.Nav = Nav;
    document.addEventListener('pq:rendu', monter);
  }
})(this);
