/* Nav latérale commune à toutes les pages de l'application.
   Nav.html() produit le contenu (logique pure, testée) ; dans le navigateur, nav.js remplit
   l'élément [data-nav data-page="…"] après chaque rendu (événement « pq:rendu » de boot.js). */
(function (root) {
  var TEXTES = {
    fr: {
      tagline: 'On pétrit l’actu IA pour toi.', langLabel: 'Langue', role: 'Consultante IA · solopreneuse',
      liens: { comptoir: 'Le comptoir', fournee: 'La fournée du jour', fournil: 'Le fournil', 'garde-manger': 'Le garde-manger', profil: 'Mon profil' },
      compteur: ['article mis de côté', 'articles mis de côté'], logout: 'Se déconnecter', menu: 'Menu'
    },
    en: {
      tagline: 'We knead the AI news for you.', langLabel: 'Language', role: 'AI consultant · solopreneur',
      liens: { comptoir: 'The counter', fournee: 'Today’s batch', fournil: 'The kitchen', 'garde-manger': 'The pantry', profil: 'My profile' },
      compteur: ['saved article', 'saved articles'], logout: 'Log out', menu: 'Menu'
    }
  };

  var PAGES = [
    { id: 'comptoir', href: '/comptoir', icone: '<path d="M3 10h18v10H3z"></path><path d="M5 10l2-5h10l2 5"></path>' },
    { id: 'fournee', href: '/fournee', icone: '<path d="M4 7h16M4 12h16M4 17h10"></path>' },
    { id: 'fournil', href: '/fournil', icone: '<rect x="3" y="4" width="18" height="16" rx="3"></rect><rect x="7" y="9" width="10" height="7" rx="2"></rect>' },
    { id: 'garde-manger', href: '/garde-manger', icone: '<path d="M6 3h12v18l-6-4-6 4z"></path>' },
    { id: 'profil', href: '/profil', icone: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"></path>' }
  ];

  var LIEN = 'display:flex;align-items:center;gap:10px;min-height:44px;padding:0 12px;border-radius:10px;color:#4A3324;text-decoration:none';
  var LIEN_ACTIF = 'display:flex;align-items:center;gap:10px;min-height:44px;padding:0 12px;border-radius:10px;background:#FFFDF8;color:#5E3412;font-weight:700;text-decoration:none;box-shadow:inset 3px 0 0 var(--braise),inset 0 0 0 1px #E7D6B8';
  var LANG_ON = 'min-height:44px;min-width:52px;padding:0 14px;border-radius:999px;border:0;background:var(--braise);color:#FFFFFF;font:inherit;font-weight:700;cursor:pointer';
  var LANG_OFF = 'min-height:44px;min-width:52px;padding:0 14px;border-radius:999px;border:0;background:transparent;color:#5E3412;font:inherit;font-weight:600;cursor:pointer';

  var DECO = 'min-height:44px;padding:0 14px;border-radius:10px;border:1px solid #D9C29C;background:transparent;color:#5E3412;font:inherit;font-weight:600;cursor:pointer;align-self:flex-start';

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
    var role = o.role != null ? o.role : t.role;
    return '<div class="pq-nav"' + (o.ouvert ? ' data-ouvert' : '') + '>' +
      '<div class="pq-nav-tete">' +
      '<div style="display:flex;flex-direction:column;gap:6px;min-width:0">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<span class="pq-nav-logo" style="width:38px;height:38px;border-radius:12px;background:var(--braise);color:#FFFFFF;display:inline-flex;align-items:center;justify-content:center;flex:none">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14c0-4.4 3.6-8 8-8s8 3.6 8 8v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"></path><path d="M9 10l1.5 2M12 9.5l1.5 2M15 10l1.5 2"></path></svg></span>' +
      '<span class="pq-nav-nom" style="font-family:Fraunces, Georgia, serif;font-weight:800;font-size:20px;line-height:1.1">Votre p<span style="color:var(--braise)">AI</span>n quotidien</span></div>' +
      '<span class="pq-nav-tagline" style="font-size:13px;color:#6B5443">' + esc(t.tagline) + '</span></div>' +
      '<span class="pq-nav-prenom">' + esc(prenom) + '</span>' +
      '<button type="button" class="pq-nav-menu" data-nav-menu data-focus="nav-menu" aria-expanded="' + !!o.ouvert + '" aria-controls="pq-nav-panneau">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>' + esc(t.menu) + '</button>' +
      '</div>' +
      '<div id="pq-nav-panneau" class="pq-nav-panneau">' +
      '<div style="display:flex;flex-direction:column;gap:4px">' + liens + '</div>' +
      '<div style="margin-top:auto;display:flex;flex-direction:column;gap:14px">' +
      '<div role="group" aria-label="' + esc(t.langLabel) + '" style="display:flex;gap:4px;padding:4px;border-radius:999px;background:#E9D8BA;align-self:flex-start">' +
      '<button type="button" data-lang="fr" data-focus="lang-fr" aria-pressed="' + fr + '" style="' + (fr ? LANG_ON : LANG_OFF) + '">FR</button>' +
      '<button type="button" data-lang="en" data-focus="lang-en" aria-pressed="' + !fr + '" style="' + (fr ? LANG_OFF : LANG_ON) + '">EN</button></div>' +
      '<div style="border-top:1px solid #E7D6B8;padding-top:14px;display:flex;align-items:center;gap:10px">' +
      '<span aria-hidden="true" style="width:36px;height:36px;border-radius:50%;background:#8A4F1C;color:#FFFDF8;display:inline-flex;align-items:center;justify-content:center;font-weight:700">' + esc(prenom.charAt(0)) + '</span>' +
      '<div style="display:flex;flex-direction:column"><span style="font-weight:700;font-size:14px">' + esc(prenom) + '</span><span style="font-size:12px;color:#6B5443">' + esc(role) + '</span></div></div>' +
      '<button type="button" data-logout data-focus="logout" style="' + DECO + '">' + esc(t.logout) + '</button></div></div></div>';
  }

  // Sous 900 px, la nav latérale devient une barre en haut avec un bouton Menu (modèle disclosure).
  var CSS = '.pq-nav{display:flex;flex-direction:column;gap:26px;flex:1 1 auto}' +
    '.pq-nav-tete{display:flex;align-items:center;gap:10px}' +
    '.pq-nav-menu,.pq-nav-prenom{display:none}' +
    '.pq-nav-panneau{display:flex;flex-direction:column;gap:26px;flex:1 1 auto}' +
    '[data-nav] a:focus-visible,[data-nav] button:focus-visible{outline:3px solid var(--braise);outline-offset:2px}' +
    '@media (max-width:899.98px){' +
    '[data-nav]{position:sticky;top:0;z-index:40;flex:1 1 100%!important;padding:10px 16px!important;border-right:0!important;border-bottom:1px solid #E7D6B8;gap:0!important}' +
    '.pq-nav{gap:0;position:relative}' +
    '.pq-nav-tagline{display:none}' +
    '.pq-nav-logo{width:32px!important;height:32px!important}' +
    '.pq-nav-nom{font-size:15px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.pq-nav-tete>div:first-child,.pq-nav-tete>div:first-child>div{min-width:0}' +
    '.pq-nav-nom span{color:#8A4F1C!important}' +
    '.pq-nav-prenom{display:block;margin-left:auto;flex:0 1 auto;max-width:30%;font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}' +
    '.pq-nav-menu{display:inline-flex;align-items:center;gap:6px;flex:none;min-height:44px;padding:0 14px;border-radius:999px;border:1px solid #D9C29C;background:#FFFDF8;color:#5E3412;font:inherit;font-weight:700;cursor:pointer}' +
    '.pq-nav-panneau{display:none;position:absolute;left:-16px;right:-16px;top:calc(100% + 10px);padding:16px;background:#F3E6CF;border-bottom:1px solid #E7D6B8;box-shadow:0 14px 24px rgba(46,29,18,.18);max-height:calc(100vh - 64px);overflow:auto;gap:18px}' +
    '.pq-nav[data-ouvert] .pq-nav-panneau{display:flex}}';

  var ouvert = false;

  function navCourante() { return document.querySelector('[data-nav]'); }

  function basculer(etat, rendreFocus) {
    ouvert = etat;
    var nav = navCourante();
    if (!nav) return;
    var boite = nav.querySelector('.pq-nav');
    var bouton = nav.querySelector('[data-nav-menu]');
    if (boite) { if (etat) boite.setAttribute('data-ouvert', ''); else boite.removeAttribute('data-ouvert'); }
    if (bouton) {
      bouton.setAttribute('aria-expanded', String(etat));
      if (rendreFocus) bouton.focus();
    }
  }

  function monter(e) {
    var rootEl = e.detail && e.detail.root;
    var nav = rootEl && rootEl.querySelector('[data-nav]');
    if (!nav) return;
    var compteur = 0;
    try { compteur = root.Store.charger(window.localStorage).sauves.length; } catch (err) {}
    var u = null;
    try { u = root.Auth.utilisateurCourant(); } catch (err) {}
    nav.innerHTML = html({
      page: nav.getAttribute('data-page'), lang: e.detail.lang, compteurGardeManger: compteur,
      prenom: u ? u.prenom : '', role: u ? u.profil.metiers.join(', ') : '', ouvert: ouvert
    });
    nav.querySelector('[data-nav-menu]').addEventListener('click', function () { basculer(!ouvert, false); });
    nav.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && ouvert) { ev.preventDefault(); basculer(false, true); }
    });
    nav.addEventListener('focusout', function (ev) {
      if (ouvert && ev.relatedTarget && !nav.contains(ev.relatedTarget)) basculer(false, false);
    });
    nav.querySelectorAll('[data-lang]').forEach(function (b) {
      b.addEventListener('click', function () { root.__app.setState({ lang: b.getAttribute('data-lang') }); });
    });
    var sortie = nav.querySelector('[data-logout]');
    if (sortie) sortie.addEventListener('click', function () {
      try { root.Auth.seDeconnecter(); } catch (err) {}
      root.location.href = '/';
    });
  }

  var Nav = { html: html };
  if (typeof module === 'object' && module.exports) module.exports = Nav;
  else {
    root.Nav = Nav;
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    document.addEventListener('pq:rendu', monter);
    // Clic hors de la nav : le panneau se ferme.
    document.addEventListener('click', function (ev) {
      var nav = navCourante();
      // Cible retirée du document par un rendu (bouton de langue) : ce n'est pas un clic extérieur.
      if (ouvert && nav && document.contains(ev.target) && !nav.contains(ev.target)) basculer(false, false);
    });
  }
})(this);
