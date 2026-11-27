/* GET /api/linkedin/callback : retour de LinkedIn. Échange le code contre un jeton (avec le secret,
   côté serveur), lit le profil OpenID, pose le cookie de session chiffré et revient sur la page. */
'use strict';
const L = require('../_linkedin.js');

function issue(erreur) {
  if (erreur === 'user_cancelled_login' || erreur === 'user_cancelled_authorize') return 'annule';
  if (erreur === 'unauthorized_scope_error') return 'scope';
  return 'refuse';
}

module.exports = async function (req, res) {
  const cfg = L.config(req);
  const p = L.parametres(req);
  const e = L.dechiffrer(cfg, L.lireCookies(req)[L.COOKIE_ETAT]);
  const retour = e ? L.retourSur(e.retour) : '/fournil';
  const efface = L.cookie(L.COOKIE_ETAT, '', { maxAge: 0, securise: cfg.securise });
  const vers = function (code, cookies) { L.rediriger(res, L.avecParam(retour, 'linkedin', code), cookies || [efface]); };

  if (!cfg.configure) return vers('non-configure');
  if (p.get('error')) {
    console.warn('[linkedin] autorisation refusée :', p.get('error'), p.get('error_description') || '');
    return vers(issue(p.get('error')));
  }
  if (!e || !p.get('code') || p.get('state') !== e.etat) return vers('erreur');

  try {
    const r = await fetch(L.JETON, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code: p.get('code'), redirect_uri: cfg.redirection, client_id: cfg.id, client_secret: cfg.secret }),
      signal: AbortSignal.timeout(L.DELAI_MS)
    });
    const j = await r.json().catch(function () { return null; });
    if (!r.ok || !j || !j.access_token) throw new Error('échange du code : HTTP ' + r.status + ' ' + ((j && (j.error_description || j.error)) || ''));

    const scopes = String(j.scope || cfg.scopes).split(/[\s,]+/).filter(Boolean);
    const exp = Date.now() + (Number(j.expires_in) || 3600) * 1000;
    let profil = {};
    if (scopes.indexOf('openid') !== -1 || scopes.indexOf('profile') !== -1) {
      const u = await L.appel(cfg, j.access_token, '/v2/userinfo', { rest: false });
      if (u.ok && u.corps) profil = u.corps;
    }
    const locale = profil.locale && typeof profil.locale === 'object' ? [profil.locale.language, profil.locale.country].filter(Boolean).join('-') : String(profil.locale || '');
    const s = {
      t: j.access_token, exp, depuis: Date.now(), scopes,
      sub: profil.sub || '', prenom: profil.given_name || '', nom: profil.family_name || '', nomComplet: profil.name || '',
      photo: profil.picture || '', email: profil.email || '', emailVerifie: !!profil.email_verified, locale
    };
    const maxAge = Math.max(60, (exp - Date.now()) / 1000);
    vers('ok', [efface, L.cookie(L.COOKIE, L.chiffrer(cfg, s), { maxAge, securise: cfg.securise })]);
  } catch (err) {
    console.error('[linkedin] callback :', err.message);
    vers('erreur');
  }
};
