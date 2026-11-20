/* État partagé entre les pages : articles mis de côté, sujets ignorés, brouillons, posts publiés.
   Logique pure (aucun accès au DOM), sauvegardée en localStorage sous la clé pq-store.
   Utilisable dans le navigateur (window.Store) et sous Node (tests). */
(function (root) {
  var CLE = 'pq-store';
  var CLES_DEMO = ['pq-store', 'pq-layout', 'pq-lang', 'pq-auth', 'pq-questionnaire', 'pq-retours', 'pq-theme', 'pq-animations'];
  var CHAMPS_CHIFFRES = ['impressions', 'reactions', 'republications', 'commentaires', 'contacts'];

  function estObjet(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function copie(v) { return JSON.parse(JSON.stringify(v)); }

  function etatInitial() {
    return { version: 1, sauves: [], ignores: { date: '', refs: [] }, brouillons: {}, publies: [] };
  }

  function normaliserEtat(raw) {
    var e = etatInitial();
    if (!estObjet(raw) || raw.version !== 1) return e;
    if (Array.isArray(raw.sauves)) e.sauves = raw.sauves.filter(function (s) { return estObjet(s) && typeof s.ref === 'string'; });
    if (estObjet(raw.ignores) && typeof raw.ignores.date === 'string' && Array.isArray(raw.ignores.refs)) {
      e.ignores = { date: raw.ignores.date, refs: raw.ignores.refs.filter(function (r) { return typeof r === 'string'; }) };
    }
    if (estObjet(raw.brouillons)) {
      Object.keys(raw.brouillons).forEach(function (k) {
        if (typeof raw.brouillons[k] === 'string') e.brouillons[k] = raw.brouillons[k];
      });
    }
    if (Array.isArray(raw.publies)) e.publies = raw.publies.filter(function (p) { return estObjet(p) && typeof p.id === 'string'; });
    return copie(e);
  }

  function charger(storage) {
    try {
      var raw = storage.getItem(CLE);
      return raw == null ? etatInitial() : normaliserEtat(JSON.parse(raw));
    } catch (err) {
      return etatInitial();
    }
  }

  function enregistrer(storage, etat) {
    try {
      storage.setItem(CLE, JSON.stringify(etat));
      return true;
    } catch (err) {
      return false;
    }
  }

  function estDeCote(etat, ref) {
    return etat.sauves.some(function (s) { return s.ref === ref; });
  }

  function mettreDeCote(etat, article, maintenantIso) {
    var e = copie(etat);
    if (estDeCote(e, article.ref)) return e;
    e.sauves.push({ ref: article.ref, titre: article.titre, source: article.source, feu: article.feu, url: article.url, savedAt: maintenantIso });
    return e;
  }

  function retirer(etat, ref) {
    var e = copie(etat);
    e.sauves = e.sauves.filter(function (s) { return s.ref !== ref; });
    return e;
  }

  // Annule un « Retirer » : remet l'article tel qu'il était (même savedAt, donc même place et même fraîcheur).
  function remettre(etat, sauve) {
    var e = copie(etat);
    if (!estObjet(sauve) || typeof sauve.ref !== 'string' || estDeCote(e, sauve.ref)) return e;
    e.sauves.push(copie(sauve));
    return e;
  }

  // Un sujet ignoré ne l'est que pour la fournée du jour : changer de date repart de zéro.
  function ignorer(etat, ref, dateFournee) {
    var e = copie(etat);
    if (e.ignores.date !== dateFournee) e.ignores = { date: dateFournee, refs: [] };
    if (e.ignores.refs.indexOf(ref) === -1) e.ignores.refs.push(ref);
    return e;
  }

  function refsIgnorees(etat, dateFournee) {
    return etat.ignores.date === dateFournee ? etat.ignores.refs.slice() : [];
  }

  // Annule un « Ignorer » de la fournée du jour ; sans effet sur une autre date.
  function desIgnorer(etat, ref, dateFournee) {
    var e = copie(etat);
    if (e.ignores.date === dateFournee) e.ignores.refs = e.ignores.refs.filter(function (r) { return r !== ref; });
    return e;
  }

  // Date de la fournée en heure locale (WF3 n'en renvoie pas) : YYYY-MM-DD.
  function dateDuJour(d) {
    function deux(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate());
  }

  function enregistrerBrouillon(etat, ref, texte) {
    var e = copie(etat);
    e.brouillons[ref] = String(texte);
    return e;
  }

  function publier(etat, article, maintenantIso) {
    var e = copie(etat);
    e.publies.push({ id: article.ref + '-' + maintenantIso, ref: article.ref, titre: article.titre, publieLe: maintenantIso, chiffres: null });
    return e;
  }

  function saisirChiffres(etat, id, chiffres) {
    var e = copie(etat);
    var post = e.publies.filter(function (p) { return p.id === id; })[0];
    if (!post || !estObjet(chiffres)) return e;
    var propres = {};
    for (var i = 0; i < CHAMPS_CHIFFRES.length; i++) {
      var v = chiffres[CHAMPS_CHIFFRES[i]];
      if (!(typeof v === 'number' && Number.isInteger(v) && v >= 0)) return e;
      propres[CHAMPS_CHIFFRES[i]] = v;
    }
    post.chiffres = propres;
    return e;
  }

  function reinitialiserDemo(storage) {
    CLES_DEMO.forEach(function (k) {
      try { storage.removeItem(k); } catch (err) {}
    });
  }

  // Renvoie la nouvelle chaîne de recherche sans demo=reset, ou null si le paramètre est absent.
  function retirerParamDemo(search) {
    var parts = String(search || '').replace(/^\?/, '').split('&').filter(Boolean);
    var reste = parts.filter(function (p) { return p !== 'demo=reset'; });
    if (reste.length === parts.length) return null;
    return reste.length ? '?' + reste.join('&') : '';
  }

  var Store = {
    CLE: CLE, CLES_DEMO: CLES_DEMO,
    etatInitial: etatInitial, normaliserEtat: normaliserEtat, charger: charger, enregistrer: enregistrer,
    mettreDeCote: mettreDeCote, estDeCote: estDeCote, retirer: retirer, remettre: remettre,
    ignorer: ignorer, refsIgnorees: refsIgnorees, desIgnorer: desIgnorer, dateDuJour: dateDuJour,
    enregistrerBrouillon: enregistrerBrouillon,
    publier: publier, saisirChiffres: saisirChiffres,
    reinitialiserDemo: reinitialiserDemo, retirerParamDemo: retirerParamDemo
  };

  if (typeof module === 'object' && module.exports) module.exports = Store;
  else root.Store = Store;
})(this);
