/* Interrupteur du site : mode démo (tout simulé dans le navigateur) ou mode réel (Supabase + n8n).
   Chargé en premier sur toutes les pages. Guide de remplissage : docs/branchement-back.md.
   Ne jamais mettre ici la clé service_role de Supabase : seule la clé publique (anon) va dans le front. */
(function (root) {
  var PQ_CONFIG = {
    mode: 'demo',            // 'demo' ou 'reel'
    supabaseUrl: '',         // ex. https://<projet>.supabase.co
    supabaseCleAnon: '',     // clé publique (anon / publishable)
    webhookFournee: '',      // adresse https du webhook WF3
    suppressionCompteUrl: '', // adresse https qui supprime le compte (lot 41) ; vide : « bientôt disponible »
    tallyUrl: 'https://tally.so/r/RWWqKd',
    siteUrl: 'https://team42svp.vercel.app',
    contactAccessibilite: '', // À COMPLÉTER : adresse e-mail de contact de la déclaration d'accessibilité (/accessibilite)
    delaiReseauMs: 8000
  };

  /* ---- Rien à modifier sous cette ligne ---- */

  function https(v) { return typeof v === 'string' && /^https:\/\/[^\s/]+/.test(v); }

  // Le mode réel n'est pris que si tout ce qu'il faut est rempli ; sinon on reste en démo.
  function modeEffectif(c) {
    if (!c || c.mode !== 'reel') return 'demo';
    var complet = https(c.supabaseUrl) && https(c.webhookFournee) && typeof c.supabaseCleAnon === 'string' && c.supabaseCleAnon !== '';
    return complet ? 'reel' : 'demo';
  }

  // fetch interrompu après ms millisecondes (la promesse est alors rejetée).
  function fetchAvecDelai(fetchFn, url, options, ms) {
    var o = {};
    for (var k in options) if (Object.prototype.hasOwnProperty.call(options, k)) o[k] = options[k];
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    if (ctrl) o.signal = ctrl.signal;
    return new Promise(function (resoudre, rejeter) {
      var minuteur = setTimeout(function () {
        if (ctrl) ctrl.abort();
        rejeter(new Error('delai'));
      }, ms);
      Promise.resolve().then(function () { return fetchFn(url, o); }).then(
        function (r) { clearTimeout(minuteur); resoudre(r); },
        function (e) { clearTimeout(minuteur); rejeter(e); }
      );
    });
  }

  var Config = { DEFAUT: PQ_CONFIG, modeEffectif: modeEffectif, fetchAvecDelai: fetchAvecDelai };

  if (typeof module === 'object' && module.exports) module.exports = Config;
  else {
    root.PQ_CONFIG = PQ_CONFIG;
    root.PQ_MODE = modeEffectif(PQ_CONFIG);
    root.Config = Config;
    if (PQ_CONFIG.mode === 'reel' && root.PQ_MODE !== 'reel' && root.console) {
      root.console.warn('config.js : mode réel demandé mais supabaseUrl, supabaseCleAnon ou webhookFournee manquant (https requis). Le site reste en mode démo.');
    }
    if (root.document) root.document.documentElement.setAttribute('data-mode', root.PQ_MODE);
  }
})(this);
