/* POST /api/linkedin/publier { texte, visibilite: 'PUBLIC' | 'CONNECTIONS' } :
   publie vraiment le post sur le profil LinkedIn connecté (droit w_member_social). */
'use strict';
const L = require('../_linkedin.js');

module.exports = async function (req, res) {
  const cfg = L.config(req);
  if (req.method !== 'POST') return L.json(res, 405, { erreur: 'methode' });
  if (!L.memeOrigine(req)) return L.json(res, 403, { erreur: 'origine' });
  if (!cfg.configure) return L.json(res, 503, { erreur: 'non-configure' });
  const s = L.session(req, cfg);
  if (!s || (s.exp && s.exp <= Date.now())) return L.json(res, 401, { erreur: 'expire' }, [L.effacerSession(cfg)]);
  if (!L.droits(s).publier || !s.sub) return L.json(res, 403, { erreur: 'droits' });

  const corps = await L.lireCorps(req);
  const texte = corps && typeof corps.texte === 'string' ? corps.texte.trim() : '';
  if (!texte || texte.length > 3000) return L.json(res, 400, { erreur: 'texte' });

  try {
    const r = await L.publier(cfg, s, texte, corps.visibilite);
    L.json(res, 201, r);
  } catch (err) {
    if (err.expire) return L.json(res, 401, { erreur: 'expire' }, [L.effacerSession(cfg)]);
    console.error('[linkedin] publication :', err.message);
    L.json(res, 502, { erreur: err.code || 'linkedin' });
  }
};
