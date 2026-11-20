/* Bulles d'aide des critères de monétisation (lot 16).
   Chaque bouton .jauge-aide est relié par aria-describedby à un span caché qui porte le texte
   (lu par les lecteurs d'écran). Les tuiles coupent leur contenu : la bulle visible est un seul
   élément #pq-bulle en position fixe, rempli et placé ici, bornée aux bords de l'écran.
   Ouverture au survol, au focus clavier et d'un appui au doigt ; fermeture avec Échap,
   en sortant, en touchant ailleurs, au défilement ou au redimensionnement.
   Bulle.placer est pur (testé sous Node) ; le reste ne touche au DOM que dans le navigateur. */
(function (root) {
  var MARGE = 8, ECART = 8;

  // cible : rectangle du bouton ; bulle : { largeur, hauteur } ; ecran : { largeur, hauteur }.
  // Renvoie la position (left, top) en pixels écran et si la bulle passe au-dessus du nom.
  function placer(cible, bulle, ecran) {
    var maxLeft = ecran.largeur - bulle.largeur - MARGE;
    var left = Math.max(MARGE, Math.min(cible.left, maxLeft));
    var dessous = cible.bottom + ECART;
    var dessus = cible.top - ECART - bulle.hauteur;
    if (dessous + bulle.hauteur <= ecran.hauteur - MARGE) return { left: left, top: dessous, dessus: false };
    if (dessus >= MARGE) return { left: left, top: dessus, dessus: true };
    var top = Math.max(MARGE, Math.min(dessous, ecran.hauteur - MARGE - bulle.hauteur));
    return { left: left, top: top, dessus: false };
  }

  // Lot 24 (1.4.13) : la bulle reste ouverte si la souris va vers le bouton ou vers la bulle.
  function resteOuverte(vers, btn, bulle) {
    return !!vers && ((btn && btn.contains(vers)) || (bulle && bulle.contains(vers)));
  }

  var Bulle = { placer: placer, resteOuverte: resteOuverte };

  function brancher(doc, win) {
    var courant = null, mode = '';

    function bulleEl() { return doc.getElementById('pq-bulle'); }
    function bouton(el) { return el && el.closest ? el.closest('.jauge-aide') : null; }

    function ouvrir(btn, par) {
      var b = bulleEl();
      var texte = doc.getElementById(btn.getAttribute('aria-describedby'));
      if (!b || !texte) return;
      b.textContent = texte.textContent;
      b.hidden = false;
      var r = btn.getBoundingClientRect();
      var p = placer(r, { largeur: b.offsetWidth, hauteur: b.offsetHeight },
        { largeur: doc.documentElement.clientWidth, hauteur: win.innerHeight });
      b.style.left = p.left + 'px';
      b.style.top = p.top + 'px';
      b.setAttribute('data-cote', p.dessus ? 'dessus' : 'dessous');
      courant = btn; mode = par;
    }

    function fermer() {
      var b = bulleEl();
      if (b) b.hidden = true;
      courant = null; mode = '';
    }

    doc.addEventListener('mouseover', function (e) {
      var btn = bouton(e.target);
      if (btn && btn !== courant) ouvrir(btn, 'survol');
    });
    doc.addEventListener('mouseout', function (e) {
      var btn = bouton(e.target);
      var b = bulleEl();
      // Sortie de la bulle survolée : on ferme sauf si l'on revient sur son bouton.
      if (!btn && courant && mode === 'survol' && b && b.contains(e.target)) {
        if (!resteOuverte(e.relatedTarget, courant, b)) fermer();
        return;
      }
      if (!btn || btn !== courant || mode !== 'survol') return;
      if (resteOuverte(e.relatedTarget, btn, b)) return;
      fermer();
    });
    doc.addEventListener('focusin', function (e) {
      var btn = bouton(e.target);
      if (btn) ouvrir(btn, 'focus');
    });
    doc.addEventListener('focusout', function (e) {
      if (bouton(e.target) === courant) fermer();
    });
    // Appui au doigt ou clic : bascule ; un appui ailleurs referme.
    doc.addEventListener('click', function (e) {
      var btn = bouton(e.target);
      var b = bulleEl();
      if (!btn && b && b.contains(e.target)) return;
      if (!btn) { if (courant) fermer(); return; }
      if (btn === courant && mode === 'clic') fermer();
      else ouvrir(btn, 'clic');
    });
    doc.addEventListener('keydown', function (e) {
      if (courant && (e.key === 'Escape' || e.key === 'Esc')) fermer();
    });
    win.addEventListener('resize', function () { if (courant) fermer(); });
    win.addEventListener('scroll', function () { if (courant) fermer(); }, true);
  }

  if (typeof module === 'object' && module.exports) module.exports = Bulle;
  else {
    root.Bulle = Bulle;
    if (root.document) brancher(root.document, root);
  }
})(this);
