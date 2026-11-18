/* Adaptateur des retours de personnalisation (« Affine ta fournée », page profil).
   Même principe que auth.js et api.js : logique pure dans Retours.pur (testée sous Node),
   même interface en démo (localStorage « pq-retours », par compte) et en réel (API REST de Supabase).
   Guide : docs/branchement-back.md, section « Retours de personnalisation ». */
(function (root) {
  var CLE = 'pq-retours';
  var MAX = 1000;
  var MAX_PAR_COMPTE = 50;
  var JOUR_MS = 86400000;

  function estObjet(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function copie(v) { return JSON.parse(JSON.stringify(v)); }

  function nettoyer(texte) {
    return String(texte == null ? '' : texte).replace(/\r\n?/g, '\n').trim();
  }

  // null si le texte peut partir, sinon le code d'erreur affiché par la page.
  function valider(texte) {
    var t = nettoyer(texte);
    if (!t) return 'vide';
    if (t.length > MAX) return 'trop-long';
    return null;
  }

  function enregistrement(texte, maintenantIso, abonneId) {
    return { texte: nettoyer(texte), cree_le: maintenantIso, abonne_id: abonneId ? String(abonneId) : null };
  }

  function retourValide(r) { return estObjet(r) && typeof r.texte === 'string' && typeof r.cree_le === 'string'; }

  function derniers(liste, n) {
    if (!Array.isArray(liste)) return [];
    return liste.filter(retourValide).slice().sort(function (a, b) {
      return a.cree_le < b.cree_le ? 1 : a.cree_le > b.cree_le ? -1 : 0;
    }).slice(0, n);
  }

  // Écart en jours civils locaux (minuit à minuit) ; date future ou illisible : aujourd'hui.
  function dateRelative(iso, maintenant, lang) {
    var en = lang === 'en';
    var d = new Date(iso);
    var j = 0;
    if (!isNaN(d.getTime())) {
      var a = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      var b = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
      j = Math.round((b - a) / JOUR_MS);
    }
    if (j <= 0) return en ? 'today' : 'aujourd’hui';
    if (j === 1) return en ? 'yesterday' : 'hier';
    return en ? j + ' days ago' : 'il y a ' + j + ' jours';
  }

  function cleCompte(u) {
    if (!estObjet(u)) return null;
    var e = String(u.email || '').trim().toLowerCase();
    if (e) return e;
    return u.abonneId ? String(u.abonneId) : null;
  }

  /* ---- État démo : { version: 1, comptes: { [cleCompte]: Retour[] } } ---- */
  function normaliser(raw) {
    var e = { version: 1, comptes: {} };
    if (!estObjet(raw) || raw.version !== 1 || !estObjet(raw.comptes)) return e;
    Object.keys(raw.comptes).forEach(function (k) {
      if (Array.isArray(raw.comptes[k])) e.comptes[k] = copie(raw.comptes[k].filter(retourValide));
    });
    return e;
  }

  function ajouter(etat, cle, rec) {
    var e = copie(etat);
    var l = (e.comptes[cle] || []).concat([rec]);
    e.comptes[cle] = derniers(l, MAX_PAR_COMPTE);
    return e;
  }

  function lister(etat, cle) { return etat.comptes[cle] ? copie(etat.comptes[cle]) : []; }

  /* ---- Mode réel : requêtes REST (PostgREST) ---- */
  function base(config) { return String(config.supabaseUrl || '').replace(/\/+$/, '') + '/rest/v1/retours'; }

  function requeteEnvoi(config, jeton, rec) {
    return {
      url: base(config),
      options: {
        method: 'POST',
        headers: { apikey: config.supabaseCleAnon, Authorization: 'Bearer ' + jeton, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ texte: rec.texte, abonne_id: rec.abonne_id })
      }
    };
  }

  function requeteLecture(config, jeton, n) {
    return {
      url: base(config) + '?select=texte,cree_le&order=cree_le.desc&limit=' + n,
      options: { method: 'GET', headers: { apikey: config.supabaseCleAnon, Authorization: 'Bearer ' + jeton } }
    };
  }

  function ok() { return { ok: true, erreur: null }; }
  function ko(code) { return { ok: false, erreur: code }; }
  function pour(liste) { return liste.map(function (r) { return { texte: r.texte, cree_le: r.cree_le }; }); }

  /* ---- Démo : deps = { storage, utilisateur: () => u|null, maintenant: () => iso } ---- */
  function avecStockage(deps) {
    function charger() {
      try { return normaliser(JSON.parse(deps.storage.getItem(CLE))); } catch (err) { return normaliser(null); }
    }
    return {
      envoyerRetour: function (texte) {
        var erreur = valider(texte);
        if (erreur) return Promise.resolve(ko(erreur));
        var u = deps.utilisateur();
        var cle = cleCompte(u);
        if (!cle) return Promise.resolve(ko('session'));
        try { deps.storage.setItem(CLE, JSON.stringify(ajouter(charger(), cle, enregistrement(texte, deps.maintenant(), u.abonneId)))); } catch (err) { return Promise.resolve(ko('reseau')); }
        return Promise.resolve(ok());
      },
      derniersRetours: function (n) {
        var cle = cleCompte(deps.utilisateur());
        return Promise.resolve(cle ? pour(derniers(lister(charger(), cle), n)) : []);
      }
    };
  }

  /* ---- Réel : deps = { fetch, jeton: () => Promise<string|null>, utilisateur: () => u|null } ---- */
  var Cfg = typeof module === 'object' && module.exports ? require('./config.js') : root.Config;

  function avecSupabase(config, deps) {
    var delai = config.delaiReseauMs || 8000;
    function appeler(req) { return Cfg.fetchAvecDelai(deps.fetch, req.url, req.options, delai); }
    return {
      envoyerRetour: function (texte) {
        var erreur = valider(texte);
        if (erreur) return Promise.resolve(ko(erreur));
        var u = deps.utilisateur();
        return Promise.resolve().then(deps.jeton).then(function (jeton) {
          if (!jeton) return ko('session');
          return appeler(requeteEnvoi(config, jeton, enregistrement(texte, '', u && u.abonneId))).then(function (rep) {
            if (rep.status === 401 || rep.status === 403) return ko('session');
            return rep.ok ? ok() : ko('reseau');
          });
        }).catch(function () { return ko('reseau'); });
      },
      // Rejetée en cas de panne : la page affiche « Impossible d'afficher tes retours ».
      derniersRetours: function (n) {
        return Promise.resolve().then(deps.jeton).then(function (jeton) {
          if (!jeton) return [];
          return appeler(requeteLecture(config, jeton, n)).then(function (rep) {
            if (!rep.ok) throw new Error('HTTP ' + rep.status);
            return rep.json();
          }).then(function (l) { return pour(derniers(l, n)); });
        });
      }
    };
  }

  var actif = null;
  if (typeof module !== 'object' || !module.exports) {
    var utilisateur = function () { try { return root.Auth.utilisateurCourant(); } catch (err) { return null; } };
    if (root.PQ_MODE === 'reel' && root.PQ_CONFIG && root.Auth) {
      actif = avecSupabase(root.PQ_CONFIG, { fetch: function (u, o) { return root.fetch(u, o); }, jeton: root.Auth.jetonValide, utilisateur: utilisateur });
    } else {
      var st = null;
      try { st = root.localStorage; } catch (err) {}
      actif = avecStockage({ storage: st || { getItem: function () { return null; }, setItem: function () { throw new Error('stockage'); } }, utilisateur: utilisateur, maintenant: function () { return new Date().toISOString(); } });
    }
  }

  var Retours = {
    avecStockage: avecStockage, avecSupabase: avecSupabase,
    envoyerRetour: actif ? actif.envoyerRetour : null,
    derniersRetours: actif ? actif.derniersRetours : null,
    pur: {
      CLE: CLE, MAX: MAX, nettoyer: nettoyer, valider: valider, enregistrement: enregistrement, derniers: derniers,
      dateRelative: dateRelative, cleCompte: cleCompte, normaliser: normaliser, ajouter: ajouter, lister: lister,
      requeteEnvoi: requeteEnvoi, requeteLecture: requeteLecture
    }
  };

  if (typeof module === 'object' && module.exports) module.exports = Retours;
  else root.Retours = Retours;
})(this);
