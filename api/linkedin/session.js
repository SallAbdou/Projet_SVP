/* GET /api/linkedin/session[?posts=urn1,urn2] : état de la connexion, profil, droits accordés,
   statistiques du compte et, si demandé, chiffres des posts publiés depuis le fournil.
   Ne renvoie jamais le jeton. */
'use strict';
const L = require('../_linkedin.js');

module.exports = async function (req, res) {
  const cfg = L.config(req);
  if (!cfg.configure) return L.json(res, 200, { configure: false, connecte: false });
  const s = L.session(req, cfg);
  if (!s) return L.json(res, 200, { configure: true, connecte: false });
  if (s.exp && s.exp <= Date.now()) return L.json(res, 200, { configure: true, connecte: false, expire: true }, [L.effacerSession(cfg)]);

  const d = L.droits(s);
  const out = {
    configure: true, connecte: true,
    profil: { prenom: s.prenom, nom: s.nom, nomComplet: s.nomComplet, photo: s.photo, email: s.email, emailVerifie: s.emailVerifie, locale: s.locale },
    depuis: new Date(s.depuis || Date.now()).toISOString(),
    expireLe: new Date(s.exp).toISOString(),
    scopes: s.scopes, droits: d,
    statistiques: { posts: { statut: 'sans-acces' }, abonnes: { statut: 'sans-acces' } },
    parPost: {}
  };
  try {
    out.statistiques = await L.statsCompte(cfg, s);
    const urns = String(L.parametres(req).get('posts') || '').split(',').map(function (x) { return x.trim(); })
      .filter(function (x) { return /^urn:li:(share|ugcPost):\d+$/.test(x); }).slice(0, 5);
    if (d.statsPosts && urns.length) {
      const chiffres = await Promise.all(urns.map(function (u) { return L.statsPost(cfg, s, u).catch(function (e) { if (e.expire) throw e; return null; }); }));
      urns.forEach(function (u, i) { if (chiffres[i]) out.parPost[u] = chiffres[i]; });
    }
  } catch (err) {
    if (err.expire) return L.json(res, 200, { configure: true, connecte: false, expire: true }, [L.effacerSession(cfg)]);
    console.error('[linkedin] statistiques :', err.message);
    out.statistiques = { posts: { statut: 'erreur' }, abonnes: { statut: 'erreur' } };
  }
  L.json(res, 200, out);
};
