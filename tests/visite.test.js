// Lot 28 : visite guidée d'onboarding, partie logique de visite.js (aucun DOM).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const V = require('../visite.js');
const Store = require('../store.js');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');

function memoire(initial) {
  const d = Object.assign({}, initial);
  return { getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); }, removeItem: k => { delete d[k]; }, d };
}
const CASSE = { getItem: () => { throw new Error('bloqué'); }, setItem: () => { throw new Error('bloqué'); } };
const E = V.ETAPES;
const idx = id => E.findIndex(e => e.id === id);
const tout = () => true;

test('seize étapes sur cinq pages, dans l’ordre du parcours', () => {
  assert.equal(E.length, 16);
  assert.equal(V.CLE, 'pq-visite');
  const pages = E.map(e => e.page).filter((p, i, a) => a.indexOf(p) === i);
  assert.deepEqual(pages, ['comptoir', 'fournee', 'garde-manger', 'fournil', 'profil']);
  assert.equal(E[0].cible, null, 'accueil au centre, toujours affichable');
  for (const e of E.slice(1)) assert.equal(typeof e.cible, 'string', e.id);
  assert.equal(E[idx('menu')].menu, true);
  assert.deepEqual(E.filter(e => e.page === 'fournil').map(e => e.id), ['sujet', 'brouillon']);
  assert.deepEqual(E.filter(e => e.page === 'profil').map(e => e.id), ['preferences', 'apparence', 'retours', 'revoir']);
  assert.ok(E[idx('sujet')].amorce, 'le fournil sans sujet suit un lien Pétrir');
  for (const p of pages) assert.match(V.CHEMINS[p], /^\/[a-z-]+$/);
});

test('textes FR et EN : même forme, une ou deux phrases, aucun tiret long', () => {
  const forme = v => v && typeof v === 'object' ? Object.keys(v).sort().map(k => [k, forme(v[k])]) : typeof v;
  assert.deepEqual(forme(V.TEXTES.fr), forme(V.TEXTES.en));
  for (const l of ['fr', 'en']) {
    for (const e of E) {
      const t = V.TEXTES[l].etapes[e.id];
      assert.ok(t && t.titre && t.texte, l + ' ' + e.id);
      const phrases = t.texte.split(/[.!?](\s|$)/).filter(s => s && s.trim()).length;
      assert.ok(phrases <= 2, l + ' ' + e.id + ' : ' + phrases + ' phrases');
    }
    assert.doesNotMatch(JSON.stringify(V.TEXTES[l]), new RegExp('[' + String.fromCharCode(0x2013, 0x2014) + ']'));
  }
  assert.equal(V.TEXTES.fr.etapes.accueil.texte, 'Bienvenue au fournil ! Je te fais visiter ?');
  assert.match(V.TEXTES.fr.etapes[E[E.length - 1].id].texte, /Tu peux revoir cette visite à tout moment depuis ton profil\./);
  assert.equal(V.TEXTES.fr.ui.compteur, '{n} sur {total}');
  assert.match(V.TEXTES.fr.etapes.sujet.texte, /LinkedIn/);
  assert.match(V.TEXTES.fr.etapes.garde.texte, /de côté/);
  assert.match(V.TEXTES.fr.etapes.four.texte, /Clique sur « Voir ma fournée »/);
});

test('aller : part de l’étape donnée, incluse, étape visible de la même page', () => {
  assert.deepEqual(V.aller(E, 1, 1, 'comptoir', tout), { index: 1 });
  assert.deepEqual(V.aller(E, 0, 1, 'comptoir', tout), { index: 0 });
});

test('suivante : cible masquée sautée, sans blocage', () => {
  const vis = e => e.id !== 'graphique';
  assert.deepEqual(V.aller(E, idx('graphique'), 1, 'comptoir', vis), { index: idx('four') });
  assert.deepEqual(V.aller(E, idx('graphique'), -1, 'comptoir', vis), { index: idx('indicateurs') });
});

test('changement de page : on navigue, l’étape est résolue à l’arrivée', () => {
  assert.deepEqual(V.aller(E, idx('four') + 1, 1, 'comptoir', tout), { naviguer: 'fournee', index: idx('four') + 1 });
  assert.deepEqual(V.aller(E, idx('grille') - 1, -1, 'fournee', tout), { naviguer: 'comptoir', index: idx('four') });
  // Garde-manger vide : arrivée sur la page, sa seule étape est masquée, on file vers le fournil.
  const gm = idx('garde');
  assert.deepEqual(V.aller(E, gm, 1, 'garde-manger', () => false), { naviguer: 'fournil', index: gm + 1 });
  assert.deepEqual(V.aller(E, gm, -1, 'garde-manger', () => false), { naviguer: 'fournee', index: gm - 1 });
});

test('après la dernière étape : fin ; avant la première : on reste au début', () => {
  assert.deepEqual(V.aller(E, E.length, 1, 'profil', tout), { fin: true });
  assert.deepEqual(V.aller(E, E.length - 1, 1, 'profil', () => false), { fin: true });
  assert.deepEqual(V.aller(E, -1, -1, 'comptoir', tout), { index: 0 });
});

test('sautées : recalculées page par page, compteur cohérent', () => {
  let s = V.sauteesPourPage([], E, 'comptoir', e => e.id !== 'graphique');
  assert.deepEqual(s, ['graphique']);
  assert.deepEqual(V.compteur(E, idx('four'), s), { numero: 4, total: 15 });
  assert.deepEqual(V.compteur(E, 0, s), { numero: 1, total: 15 });
  // Retour sur la page : le graphique est revenu, il n'est plus sauté.
  s = V.sauteesPourPage(s.concat(['garde']), E, 'comptoir', tout);
  assert.deepEqual(s, ['garde']);
  assert.deepEqual(V.compteur(E, E.length - 1, s), { numero: 15, total: 15 });
  assert.equal(V.formater('{n} sur {total}', { numero: 3, total: 12 }), '3 sur 12');
});

test('mémoire par compte : vue et reportée', () => {
  const st = memoire();
  assert.deepEqual(V.lireCompte(st, 'lea@x.fr'), { vue: false, reportee: null });
  assert.ok(V.reporter(st, 'lea@x.fr', '2026-11-21T08:00:00Z'));
  assert.deepEqual(V.lireCompte(st, 'lea@x.fr'), { vue: false, reportee: '2026-11-21T08:00:00Z' });
  assert.ok(V.marquerVue(st, 'lea@x.fr'));
  assert.equal(V.lireCompte(st, 'lea@x.fr').vue, true);
  assert.equal(V.lireCompte(st, 'autre@x.fr').vue, false, 'un autre compte ne la voit pas comme vue');
  assert.equal(V.marquerVue(st, null), false);
});

test('mémoire : JSON abîmé ou stockage bloqué, jamais d’exception', () => {
  assert.deepEqual(V.lireCompte(memoire({ 'pq-visite': '{oups' }), 'a'), { vue: false, reportee: null });
  assert.deepEqual(V.lireCompte(memoire({ 'pq-visite': '{"version":2}' }), 'a'), { vue: false, reportee: null });
  assert.deepEqual(V.lireCompte(CASSE, 'a'), { vue: false, reportee: null });
  assert.equal(V.marquerVue(CASSE, 'a'), false);
  assert.equal(V.lireEncours(CASSE, 'a'), null);
});

test('marqueurSession : début de la session de connexion (démo), sinon vide', () => {
  assert.equal(V.marqueurSession(memoire({ 'pq-auth': JSON.stringify({ session: { email: 'a', depuis: 'S1' } }) })), 'S1');
  assert.equal(V.marqueurSession(memoire({ 'pq-auth-reel': JSON.stringify({ session: { user: { last_sign_in_at: 'R1' } } }) })), 'R1');
  assert.equal(V.marqueurSession(memoire()), '');
  assert.equal(V.marqueurSession(CASSE), '');
});

test('doitLancer : jamais vue et pas reportée pour cette connexion', () => {
  assert.equal(V.doitLancer({ vue: false, reportee: null }, 'S1'), true);
  assert.equal(V.doitLancer({ vue: false, reportee: 'S1' }, 'S1'), false, 'Plus tard : pas avant la prochaine connexion');
  assert.equal(V.doitLancer({ vue: false, reportee: 'S1' }, 'S2'), true, 'nouvelle connexion : elle revient');
  assert.equal(V.doitLancer({ vue: true, reportee: null }, 'S2'), false);
});

test('visite en cours : liée au compte, effacée à la fin', () => {
  const st = memoire();
  assert.ok(V.poserEncours(st, 'lea@x.fr', { index: 5, sens: 1, sautees: ['graphique'] }));
  assert.deepEqual(V.lireEncours(st, 'lea@x.fr'), { index: 5, sens: 1, sautees: ['graphique'] });
  assert.equal(V.lireEncours(st, 'autre@x.fr'), null);
  V.poserEncours(st, 'lea@x.fr', { index: 99, sens: 7, sautees: 'x' });
  assert.equal(V.lireEncours(st, 'lea@x.fr'), null, 'index hors liste refusé');
  V.poserEncours(st, 'lea@x.fr', { index: 2, sens: -1, sautees: [] });
  V.effacerEncours(st);
  assert.equal(V.lireEncours(st, 'lea@x.fr'), null);
  // La mémoire « vue » survit à l'effacement de la visite en cours.
  V.marquerVue(st, 'lea@x.fr');
  V.effacerEncours(st);
  assert.equal(V.lireCompte(st, 'lea@x.fr').vue, true);
});

test('?demo=reset remet la visite à zéro (clé dans CLES_DEMO)', () => {
  assert.ok(Store.CLES_DEMO.includes('pq-visite'));
  const st = memoire();
  V.marquerVue(st, 'lea@x.fr');
  Store.reinitialiserDemo(st);
  assert.equal(V.lireCompte(st, 'lea@x.fr').vue, false);
});

test('placer : à droite si la place le permet, sinon gauche, dessous, dessus', () => {
  const vue = { l: 1280, h: 800 };
  const b = { l: 340, h: 220 };
  assert.equal(V.placer({ x: 40, y: 100, l: 200, h: 300 }, b, vue).cote, 'droite');
  assert.equal(V.placer({ x: 900, y: 100, l: 340, h: 300 }, b, vue).cote, 'gauche');
  assert.equal(V.placer({ x: 100, y: 40, l: 1080, h: 200 }, b, vue).cote, 'dessous');
  assert.equal(V.placer({ x: 100, y: 500, l: 1080, h: 260 }, b, vue).cote, 'dessus');
});

test('placer : jamais hors écran, cible géante ou absente', () => {
  const vue = { l: 1280, h: 800 };
  const b = { l: 340, h: 220 };
  const dedans = p => p.x >= 0 && p.y >= 0 && p.x + b.l <= vue.l && p.y + b.h <= vue.h;
  const geante = V.placer({ x: 0, y: -400, l: 1280, h: 2000 }, b, vue);
  assert.equal(geante.cote, 'coin');
  assert.ok(dedans(geante), JSON.stringify(geante));
  const centre = V.placer(null, b, vue);
  assert.equal(centre.cote, 'centre');
  assert.ok(dedans(centre));
  for (const r of [{ x: 1200, y: 780, l: 60, h: 10 }, { x: -50, y: -50, l: 70, h: 70 }, { x: 600, y: 10, l: 20, h: 20 }]) {
    const p = V.placer(r, b, vue);
    assert.ok(dedans(p), JSON.stringify([r, p]));
  }
});

test('étape à faire : le four se clique, la visite reprend à l’étape suivante', () => {
  const four = E[idx('four')];
  assert.equal(four.action, true);
  assert.equal(E.filter(e => e.action).length, 1);
  assert.equal(E[idx('four') + 1].page, 'fournee');
  assert.deepEqual(V.apresAction(E, idx('four'), ['graphique']), { index: idx('four') + 1, sens: 1, sautees: ['graphique'] });
  assert.match(V.TEXTES.fr.ui.aToi, /\S/);
});

test('garde-manger : expliqué même vide (liste ou état vide)', () => {
  const h = lire('garde-manger.html');
  assert.equal((h.match(/data-visite="garde"/g) || []).length, 2);
});

test('pages : chaque cible déclarée existe dans le gabarit de sa page, visite.js chargé avant boot.js', () => {
  for (const e of E.slice(1).filter(e => !e.selecteur)) {
    const h = lire(e.page + '.html');
    assert.ok(h.includes('data-visite="' + e.cible + '"'), e.page + ' : data-visite="' + e.cible + '"');
  }
  for (const p of Object.keys(V.CHEMINS)) {
    const h = lire(p + '.html');
    const iv = h.indexOf('<script src="/visite.js"></script>');
    assert.ok(iv !== -1 && iv < h.indexOf('<script src="/boot.js">'), p);
  }
  assert.match(lire('profil.html'), /data-visite-revoir/);
});
