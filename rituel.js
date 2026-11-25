/* Lot 32 : rituel du matin. À la première ouverture de l'app dans la journée (page protégée, compte connecté),
   « La fournée sort du four » : les cartes du jour face cachée, à retourner une à une, le n°1 en dernier.
   Dialogue modal (fond inerte, focus piégé, Échap = Passer). Logique dans jeu.js ; ici, le DOM seulement.
   Ordre avec la visite guidée (visite.js) : tant que le rituel est prévu ou ouvert, Rituel.prevu() vaut vrai
   et l'accueil de Miette attend l'événement « pq:rituel-fin ». */
(function (root) {
  if (typeof module === 'object' && module.exports) return;
  var doc = root.document;
  var ls = root.localStorage;

  var prevu = false;
  var compte = null;
  var premierRendu = true;
  var ui = null;         // { boite, cartes, ordre, retournees }
  var gain = 0;          // points de cuisson gagnés à l'ouverture du rituel (lot 33)

  root.Rituel = { prevu: function () { return prevu; } };

  function lang() { try { return root.__app.state.lang === 'en' ? 'en' : 'fr'; } catch (err) { return 'fr'; } }
  function t() { return Jeu.textes(lang()); }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function annoncer(texte) { if (root.annoncer) root.annoncer(texte); }
  function focus(el) { if (!el) return; try { el.focus({ preventScroll: false }); } catch (err) { el.focus(); } }
  function pageFournee() { return /^\/?fournee(\.html)?\/?$/.test(String(root.location.pathname || '').replace(/^\/+/, '')); }

  // Fin sans rituel affiché (fournée pas prête) ou après fermeture : la visite peut s'ouvrir.
  function finir() {
    prevu = false;
    doc.dispatchEvent(new CustomEvent('pq:rituel-fin'));
  }

  /* ----- Fond inerte, comme visite.js ----- */
  function rendreInerte(oui) {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-rituel-inerte]'), function (el) {
      el.removeAttribute('inert'); el.removeAttribute('data-rituel-inerte');
    });
    if (!oui) return;
    Array.prototype.forEach.call(doc.body.children, function (el) {
      if (el === ui.boite || el.id === 'pq-annonce' || el.id === 'pq-annonce-urgente' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.hasAttribute('inert')) return;
      el.setAttribute('inert', '');
      el.setAttribute('data-rituel-inerte', '');
    });
  }

  var PAIN = '<svg class="pain-dos" viewBox="0 0 72 48" aria-hidden="true" focusable="false"><path d="M6 34C6 20 19 10 36 10s30 10 30 24c0 4-3 7-7 7H13c-4 0-7-3-7-7z" fill="var(--pain-haut)" stroke="var(--pain-bas)" stroke-width="2.5"></path>' +
    '<path d="M22 22l5 7M34 19l5 7M46 22l5 7" stroke="var(--pain-grigne)" stroke-width="3" stroke-linecap="round" fill="none"></path></svg>';

  function dosHtml(i, n) {
    return '<button type="button" class="jeu-dos" data-rituel-dos="' + i + '">' + PAIN +
      '<span class="jeu-dos-num"></span><span class="jeu-dos-aide"></span></button>';
  }

  // Libellés des dos : le n°1 (dernière carte) reste bloqué tant que d'autres cartes sont cachées.
  function majDos() {
    var x = t(), n = ui.ordre.length;
    ui.retournees.forEach(function (r, i) {
      var dos = ui.boite.querySelector('[data-rituel-dos="' + i + '"]');
      if (!dos || r) return;
      var bloque = !Jeu.peutRetourner(ui.retournees, i);
      var vals = { n: i + 1, total: n };
      dos.setAttribute('aria-label', Jeu.remplir(bloque ? x.dernier : x.retourner, vals));
      if (bloque) dos.setAttribute('aria-disabled', 'true'); else dos.removeAttribute('aria-disabled');
      dos.querySelector('.jeu-dos-num').textContent = Jeu.remplir(x.dos, vals);
      dos.querySelector('.jeu-dos-aide').textContent = bloque ? x.dosDernier : x.dosAide;
    });
  }

  function montrer(i) {
    var li = ui.boite.querySelector('[data-rituel-carte="' + i + '"]');
    var trois = li.querySelector('.jeu-carte-3d');
    var dos = li.querySelector('.jeu-dos');
    var face = li.querySelector('.jeu-carte');
    ui.retournees[i] = true;
    trois.setAttribute('data-retournee', '');
    face.removeAttribute('aria-hidden');
    face.removeAttribute('inert');
    dos.setAttribute('aria-hidden', 'true');
    dos.setAttribute('inert', '');
    dos.setAttribute('tabindex', '-1');
  }

  function finTexte() { var x = t(); return x.fini + (gain ? ' ' + Jeu.remplir(x.rituelGain, { n: gain }) : ''); }

  function finAffichee() {
    var x = t();
    var fini = ui.boite.querySelector('.jeu-rituel-fini');
    fini.textContent = finTexte();
    fini.hidden = false;
    ui.boite.querySelector('[data-rituel-act="passer"]').hidden = true;
    ui.boite.querySelector('[data-rituel-act="tout"]').hidden = true;
    var voir = ui.boite.querySelector('[data-rituel-act="voir"]');
    voir.hidden = false;
    focus(voir);
    return x;
  }

  function retourner(i) {
    if (!ui || ui.retournees[i]) return;
    if (!Jeu.peutRetourner(ui.retournees, i)) { annoncer(t().garde); return; }
    montrer(i);
    majDos();
    var n = ui.ordre.length;
    var dire = Jeu.annonce(ui.ordre[i], i + 1, n, lang());
    var j = Jeu.suivante(ui.retournees);
    if (j === -1) { finAffichee(); dire += ' ' + finTexte(); }
    else focus(ui.boite.querySelector('[data-rituel-dos="' + j + '"]'));
    annoncer(dire);
  }

  function toutRetourner() {
    ui.retournees.forEach(function (r, i) { if (!r) montrer(i); });
    finAffichee();
    annoncer(finTexte());
  }

  function fermer(versFournee) {
    if (!ui) return;
    Jeu.marquerRituel(ls, compte, new Date());
    doc.removeEventListener('keydown', clavier, true);
    rendreInerte(false);
    doc.documentElement.classList.remove('jeu-rituel-ouvert');
    if (ui.boite.parentNode) ui.boite.parentNode.removeChild(ui.boite);
    ui = null;
    // « Voir ma fournée » depuis une autre page : la fournée s'ouvre dans la vue choisie,
    // la visite (s'il y a lieu) démarrera là-bas.
    if (versFournee && !pageFournee()) { root.location.href = '/fournee'; return; }
    focus(doc.getElementById('contenu'));
    finir();
  }

  function focusables() {
    return Array.prototype.filter.call(ui.boite.querySelectorAll('button'), function (b) {
      return !b.hidden && !b.hasAttribute('inert') && b.getClientRects().length > 0;
    });
  }

  function clavier(ev) {
    if (!ui) return;
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); fermer(false); return; }
    if (ev.key !== 'Tab') return;
    var f = focusables();
    if (!f.length) return;
    var premier = f[0], dernier = f[f.length - 1];
    var dedans = ui.boite.contains(doc.activeElement);
    if (ev.shiftKey && (doc.activeElement === premier || !dedans)) { ev.preventDefault(); focus(dernier); }
    else if (!ev.shiftKey && (doc.activeElement === dernier || !dedans)) { ev.preventDefault(); focus(premier); }
  }

  function ouvrir(ordre) {
    var x = t();
    var n = ordre.length;
    var boite = doc.createElement('div');
    boite.className = 'jeu-rituel';
    boite.setAttribute('role', 'dialog');
    boite.setAttribute('aria-modal', 'true');
    boite.setAttribute('aria-labelledby', 'jeu-rituel-titre');
    boite.setAttribute('aria-describedby', 'jeu-rituel-intro');
    boite.innerHTML = '<div class="jeu-rituel-cadre">' +
      '<div class="jeu-rituel-tete"><h2 id="jeu-rituel-titre" class="jeu-rituel-titre">' + esc(x.titre) + '</h2>' +
      '<p id="jeu-rituel-intro" class="jeu-rituel-intro">' + esc(x.intro) + '</p></div>' +
      '<ul class="jeu-rituel-grille">' + ordre.map(function (a, i) {
        return '<li data-rituel-carte="' + i + '"><div class="jeu-carte-3d">' + dosHtml(i, n) + Jeu.faceHtml(a, lang()) + '</div></li>';
      }).join('') + '</ul>' +
      '<div class="jeu-rituel-pied"><p class="jeu-rituel-fini" hidden>' + esc(x.fini) + '</p>' +
      '<button type="button" class="jeu-rituel-btn" data-rituel-act="passer">' + esc(x.passer) + '</button>' +
      '<button type="button" class="jeu-rituel-btn" data-rituel-act="tout" data-plein>' + esc(x.toutRetourner) + '</button>' +
      '<button type="button" class="jeu-rituel-btn" data-rituel-act="voir" data-plein hidden>' + esc(x.voir) + '</button></div></div>';
    Array.prototype.forEach.call(boite.querySelectorAll('.jeu-carte'), function (f) {
      f.setAttribute('aria-hidden', 'true');
      f.setAttribute('inert', '');
    });
    boite.addEventListener('click', function (ev) {
      var dos = ev.target.closest && ev.target.closest('[data-rituel-dos]');
      if (dos) { retourner(Number(dos.getAttribute('data-rituel-dos'))); return; }
      var b = ev.target.closest && ev.target.closest('[data-rituel-act]');
      if (!b) return;
      var act = b.getAttribute('data-rituel-act');
      if (act === 'tout') toutRetourner();
      else if (act === 'passer') fermer(false);
      else if (act === 'voir') fermer(true);
    });
    ui = { boite: boite, ordre: ordre, retournees: ordre.map(function () { return false; }) };
    doc.body.appendChild(boite);
    doc.documentElement.classList.add('jeu-rituel-ouvert');
    majDos();
    rendreInerte(true);
    doc.addEventListener('keydown', clavier, true);
    focus(boite.querySelector('[data-rituel-dos="0"]'));
  }

  function nombreDeNews() {
    try { return root.Bento.loadLayout(ls).newsCount; } catch (err) { return 5; }
  }

  function lancer() {
    if (!doc.documentElement.hasAttribute('data-protegee')) return;
    try { compte = Jeu.cleDuCompte(root.Auth.utilisateurCourant()); } catch (err) { compte = null; }
    if (!compte || !Jeu.rituelAFaire(ls, compte, new Date())) return;
    // Visite déjà en cours (passage d'une page à l'autre) : on ne l'interrompt pas.
    try { if (root.Visite && root.Visite.lireEncours(ls, compte)) return; } catch (err) {}
    prevu = true;
    root.Api.chargerFournee().then(function (d) {
      if (!d || d.etat !== 'pret') { finir(); return; }
      var date = root.Store.dateDuJour(new Date());
      var exclus = root.Store.refsIgnorees(root.Store.charger(ls), date);
      var cartes = Jeu.cartesDuJour(d.articles, nombreDeNews(), exclus);
      if (!cartes.length) { finir(); return; }
      // Lot 33 : le rituel ouvre la fournée (cartes vues, levain nourri) et rapporte un peu, une fois par jour.
      var maintenant = new Date();
      Jeu.ouvrirFournee(ls, compte, cartes, maintenant);
      gain = Jeu.gagnerRituel(ls, compte, maintenant).gain;
      ouvrir(Jeu.ordreRetournement(cartes));
    }).catch(function () { finir(); });
  }

  doc.addEventListener('pq:rendu', function () {
    if (!premierRendu) return;
    premierRendu = false;
    lancer();
  });
})(this);
