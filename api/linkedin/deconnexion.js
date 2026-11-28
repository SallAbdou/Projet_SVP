/* POST /api/linkedin/deconnexion : révoque le jeton chez LinkedIn (au mieux) et efface le cookie. */
'use strict';
const L = require('../_linkedin.js');

module.exports = async function (req, res) {
  const cfg = L.config(req);
  if (req.method !== 'POST') return L.json(res, 405, { erreur: 'methode' });
  if (!L.memeOrigine(req)) return L.json(res, 403, { erreur: 'origine' });
  const s = cfg.configure ? L.session(req, cfg) : null;
  if (s) {
    try {
      await fetch(L.REVOCATION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: cfg.id, client_secret: cfg.secret, token: s.t }),
        signal: AbortSignal.timeout(L.DELAI_MS)
      });
    } catch (e) { console.warn('[linkedin] révocation :', e.message); }
  }
  L.json(res, 200, { ok: true }, [L.effacerSession(cfg)]);
};
