/* GET /api/linkedin/login?retour=/fournil : envoie vers l'écran d'autorisation LinkedIn (OAuth 2.0). */
'use strict';
const crypto = require('node:crypto');
const L = require('../_linkedin.js');

module.exports = function (req, res) {
  const cfg = L.config(req);
  const retour = L.retourSur(L.parametres(req).get('retour'));
  if (!cfg.configure) return L.rediriger(res, L.avecParam(retour, 'linkedin', 'non-configure'));
  const etat = crypto.randomBytes(16).toString('hex');
  const u = new URL(L.AUTORISATION);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', cfg.id);
  u.searchParams.set('redirect_uri', cfg.redirection);
  u.searchParams.set('state', etat);
  u.searchParams.set('scope', cfg.scopes);
  L.rediriger(res, u.toString(), [L.cookie(L.COOKIE_ETAT, L.chiffrer(cfg, { etat, retour }), { maxAge: 600, securise: cfg.securise })]);
};
