/* Animations décoratives (lot 23, WCAG 2.2.2) : un seul état « on » ou « off » partagé par la case « Animations »
   du profil et par le bouton pause des étiquettes « Tout chaud ».
   Mémorisé par compte en localStorage « pq-animations » = { version: 1, comptes: { [e-mail, abonneId ou *]: 'on'|'off' } }
   (* : visiteur non connecté). Sans choix enregistré : coupées si le système demande de réduire les animations.
   Appliqué tôt par data-animations sur <html> (head des pages protégées, avant boot.js sur les pages publiques) ;
   charte.css coupe tout sous data-animations="off".
   Après chaque rendu (pq:rendu), chaque span.puce-chaud devient un vrai bouton de même aspect, sauf dans un lien,
   un bouton, un label ou une zone masquée (pas d'interactif imbriqué). Bulle au survol et au focus clavier.
   Logique pure testée sous Node ; le reste ne touche au DOM que dans le navigateur. */
(function (root) {
  var CLE = 'pq-animations';
  var VALEURS = ['on', 'off'];
  var ANONYME = '*';
  var TEXTES = {
    fr: { on: { suite: 'mettre en pause l’animation', bulle: 'Mettre en pause' }, off: { suite: 'relancer l’animation', bulle: 'Relancer l’animation' } },
    en: { on: { suite: 'pause the animation', bulle: 'Pause' }, off: { suite: 'resume the animation', bulle: 'Resume the animation' } }
  };

  function valide(v) { return VALEURS.indexOf(v) !== -1; }
  function normaliser(v) { return valide(v) ? v : 'on'; }

  // Même règle que Theme.cleCompte : e-mail en minuscules, sinon abonneId, sinon null.
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

  function lire(storage, cle, reduit) {
    var comptes = etat(storage).comptes;
    var k = cle || ANONYME;
    if (Object.prototype.hasOwnProperty.call(comptes, k) && valide(comptes[k])) return comptes[k];
    return reduit ? 'off' : 'on';
  }

  function enregistrer(storage, cle, v) {
    try {
      var e = etat(storage);
      e.comptes[cle || ANONYME] = normaliser(v);
      storage.setItem(CLE, JSON.stringify(e));
      return true;
    } catch (err) {
      return false;
    }
  }

  function appliquer(doc, v) { doc.documentElement.setAttribute('data-animations', normaliser(v)); }

  // Nom accessible (commence par le texte visible, WCAG 2.5.3) et texte de la bulle.
  function libelles(lang, v, texte) {
    var t = TEXTES[lang === 'en' ? 'en' : 'fr'][normaliser(v)];
    return { nom: texte + ', ' + t.suite, bulle: t.bulle };
  }

  function convertible(el) {
    return !!el && !el.closest('a, button, label, [aria-hidden="true"], [inert]');
  }

  var Animations = {
    CLE: CLE, VALEURS: VALEURS, cleCompte: cleCompte, lire: lire, enregistrer: enregistrer,
    appliquer: appliquer, libelles: libelles, convertible: convertible
  };

  if (typeof module === 'object' && module.exports) { module.exports = Animations; return; }
  root.Animations = Animations;

  var doc = root.document;
  function stockage() { try { return root.localStorage; } catch (e) { return null; } }
  function cle() { try { return cleCompte(root.Auth && root.Auth.utilisateurCourant()); } catch (e) { return null; } }
  function reduit() { try { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
  function courant() { return normaliser(doc.documentElement.getAttribute('data-animations')); }

  // État lu tout de suite : aucune animation ne démarre avant d'être coupée.
  try { appliquer(doc, lire(stockage(), cle(), reduit())); } catch (e) { appliquer(doc, reduit() ? 'off' : 'on'); }

  function langue() { return doc.documentElement.lang === 'en' ? 'en' : 'fr'; }

  function etiqueter(btn) {
    var l = libelles(langue(), courant(), btn.getAttribute('data-texte'));
    btn.setAttribute('aria-label', l.nom);
    btn.setAttribute('data-bulle', l.bulle);
  }

  function convertir(conteneur) {
    var puces = conteneur.querySelectorAll('span.puce-chaud');
    Array.prototype.forEach.call(puces, function (span) {
      if (!convertible(span)) return;
      var btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = span.className;
      btn.setAttribute('data-anim-pause', '');
      btn.setAttribute('data-texte', span.textContent.trim());
      btn.appendChild(doc.createTextNode(span.textContent));
      span.parentNode.replaceChild(btn, span);
      etiqueter(btn);
    });
  }

  function tousLesBoutons() { return doc.querySelectorAll('[data-anim-pause]'); }

  // Bascule partagée avec la case du profil : enregistre, applique, met à jour les boutons de la page.
  function choisir(v) {
    v = normaliser(v);
    var st = stockage();
    if (st) enregistrer(st, cle(), v);
    appliquer(doc, v);
    Array.prototype.forEach.call(tousLesBoutons(), etiqueter);
    try { doc.dispatchEvent(new CustomEvent('pq:animations', { detail: { valeur: v } })); } catch (e) {}
  }
  Animations.choisir = choisir;

  // Bulle : un seul élément fixe, placé sous le bouton (ou au-dessus faute de place), borné aux bords de l'écran.
  var bulleCible = null;
  function bulleEl() {
    var b = doc.getElementById('pq-bulle-anim');
    if (!b) {
      b = doc.createElement('div');
      b.id = 'pq-bulle-anim';
      b.setAttribute('aria-hidden', 'true');
      b.hidden = true;
      b.addEventListener('mouseleave', function (e) { if (!(e.relatedTarget && bulleCible && bulleCible.contains(e.relatedTarget))) fermer(); });
      doc.body.appendChild(b);
    }
    return b;
  }
  function ouvrir(btn) {
    var b = bulleEl();
    b.textContent = btn.getAttribute('data-bulle');
    b.hidden = false;
    var r = btn.getBoundingClientRect();
    var larg = doc.documentElement.clientWidth, haut = root.innerHeight;
    var left = Math.max(8, Math.min(r.left, larg - b.offsetWidth - 8));
    var top = r.bottom + 6;
    var dessus = top + b.offsetHeight > haut - 8 && r.top - 6 - b.offsetHeight >= 8;
    if (dessus) top = r.top - 6 - b.offsetHeight;
    // Côté de la bulle : place le pont invisible (::before) qui couvre l'écart avec le bouton (lot 24).
    b.setAttribute('data-cote', dessus ? 'dessus' : 'dessous');
    b.style.left = left + 'px';
    b.style.top = top + 'px';
    bulleCible = btn;
  }
  function fermer() {
    var b = doc.getElementById('pq-bulle-anim');
    if (b) b.hidden = true;
    bulleCible = null;
  }
  function bouton(el) { return el && el.closest ? el.closest('[data-anim-pause]') : null; }

  doc.addEventListener('click', function (e) {
    var btn = bouton(e.target);
    if (!btn) return;
    choisir(courant() === 'on' ? 'off' : 'on');
    if (bulleCible === btn) ouvrir(btn);
  });
  doc.addEventListener('mouseover', function (e) { var btn = bouton(e.target); if (btn && btn !== bulleCible) ouvrir(btn); });
  doc.addEventListener('mouseout', function (e) {
    var btn = bouton(e.target);
    // Focus clavier : la bulle reste tant que le bouton garde le focus ; après un clic souris, elle suit la souris.
    var clavier = false;
    try { clavier = doc.activeElement === btn && btn.matches(':focus-visible'); } catch (err) {}
    if (!btn || btn !== bulleCible || clavier) return;
    var vers = e.relatedTarget;
    if (vers && (btn.contains(vers) || vers.id === 'pq-bulle-anim')) return;
    fermer();
  });
  doc.addEventListener('focusin', function (e) { var btn = bouton(e.target); if (btn) ouvrir(btn); });
  doc.addEventListener('focusout', function (e) { if (bouton(e.target) && bouton(e.target) === bulleCible) fermer(); });
  doc.addEventListener('keydown', function (e) { if (bulleCible && (e.key === 'Escape' || e.key === 'Esc')) fermer(); });
  root.addEventListener('resize', function () { if (bulleCible) fermer(); });
  root.addEventListener('scroll', function () { if (bulleCible) fermer(); }, true);

  // Après chaque rendu de boot.js (avant la restauration du focus), puis pour le contenu statique.
  doc.addEventListener('pq:rendu', function (e) {
    fermer();
    convertir((e.detail && e.detail.root) || doc);
  });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { convertir(doc); });
  else if (doc.body) convertir(doc);
})(this);
