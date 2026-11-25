// Lot 32 : cartes à collectionner (logique pure de jeu.js) et branchements statiques du rituel.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Jeu = require('../jeu.js');
const Store = require('../store.js');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');

function stockage(init) {
  const m = Object.assign({}, init || {});
  return {
    getItem: k => (Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: k => { delete m[k]; },
    _m: m
  };
}
const CASSE = { getItem() { throw new Error('non'); }, setItem() { throw new Error('non'); } };
const art = (rang, d, p, l, extra) => Object.assign({ ref: 'r' + rang, rang, titre: 'T' + rang, source: 'S', feu: 'vert', axe: 'Axe 1', url: 'https://ex.fr', durabilite: d, propension: p, lienOffre: l }, extra || {});

test('rareté : seuils de la constante unique, bornes comprises', () => {
  assert.deepEqual(Jeu.RARETES.map(r => [r.id, r.min]), [['maillard', 13], ['doree', 11], ['croute', 9], ['mie', 0]]);
  const cas = { 15: 'maillard', 13: 'maillard', 12: 'doree', 11: 'doree', 10: 'croute', 9: 'croute', 8: 'mie', 0: 'mie' };
  for (const [total, id] of Object.entries(cas)) {
    const t = Number(total);
    const a = { durabilite: Math.min(5, t), propension: Math.min(5, Math.max(0, t - 5)), lienOffre: Math.max(0, t - 10) };
    assert.equal(Jeu.rarete(a).id, id, 'total ' + t);
    assert.equal(Jeu.rarete(a).total, t);
  }
  assert.equal(Jeu.rarete({}).id, 'mie');
  assert.equal(Jeu.rarete({ durabilite: 9, propension: 9, lienOffre: 9 }).total, 15, 'notes bornées à 5');
  assert.deepEqual(Jeu.RARETES.map(r => r.grignes), [4, 3, 2, 1]);
});

test('cartes du jour : rang, news écartées, nombre réglé', () => {
  const articles = [art(3, 3, 3, 3), art(1, 5, 4, 4), art(2, 4, 4, 4), art(4, 1, 1, 1), art(5, 1, 1, 1), art(6, 1, 1, 1)];
  assert.deepEqual(Jeu.cartesDuJour(articles, 5, []).map(a => a.rang), [1, 2, 3, 4, 5]);
  assert.deepEqual(Jeu.cartesDuJour(articles, 5, ['r2']).map(a => a.rang), [1, 3, 4, 5, 6]);
  assert.deepEqual(Jeu.cartesDuJour(articles, 7, []).map(a => a.rang), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(Jeu.cartesDuJour(null, 5, null), []);
  assert.equal(articles[0].rang, 3, 'liste reçue non modifiée');
});

test('ordre de retournement : du dernier rang au n°1, le n°1 en dernier', () => {
  const c = Jeu.cartesDuJour([art(1, 5, 5, 5), art(2, 1, 1, 1), art(3, 1, 1, 1)], 5, []);
  assert.deepEqual(Jeu.ordreRetournement(c).map(a => a.rang), [3, 2, 1]);
  assert.deepEqual(Jeu.ordreRetournement([]), []);
});

test('le n°1 (dernière carte) ne se retourne qu’après toutes les autres', () => {
  assert.equal(Jeu.peutRetourner([false, false, false], 0), true);
  assert.equal(Jeu.peutRetourner([false, false, false], 2), false);
  assert.equal(Jeu.peutRetourner([true, false, false], 2), false);
  assert.equal(Jeu.peutRetourner([true, true, false], 2), true);
  assert.equal(Jeu.peutRetourner([true, true, false], 0), false, 'déjà retournée');
  assert.equal(Jeu.peutRetourner([false], 0), true, 'une seule carte');
  assert.equal(Jeu.suivante([true, false, false]), 1);
  assert.equal(Jeu.suivante([true, true, false]), 2);
  assert.equal(Jeu.suivante([true, true, true]), -1);
});

test('clé de compte : e-mail en minuscules, sinon abonneId', () => {
  assert.equal(Jeu.cleDuCompte({ email: ' Lea@Exemple.fr ' }), 'lea@exemple.fr');
  assert.equal(Jeu.cleDuCompte({ abonneId: 'ab1' }), 'ab1');
  assert.equal(Jeu.cleDuCompte(null), null);
});

test('rituel vu une fois par jour et par compte, date injectable', () => {
  const s = stockage();
  const lundi = new Date(2026, 10, 23, 7, 0), soir = new Date(2026, 10, 23, 23, 50), mardi = new Date(2026, 10, 24, 0, 5);
  assert.equal(Jeu.rituelAFaire(s, 'lea', lundi), true);
  assert.equal(Jeu.marquerRituel(s, 'lea', lundi), true);
  assert.equal(Jeu.rituelAFaire(s, 'lea', soir), false);
  assert.equal(Jeu.rituelAFaire(s, 'lea', mardi), true);
  assert.equal(Jeu.rituelAFaire(s, 'tom', lundi), true, 'autre compte');
  assert.equal(JSON.parse(s._m['pq-jeu']).comptes.lea.rituel, '2026-11-23');
  assert.equal(Jeu.rituelAFaire(s, null, lundi), false, 'sans compte, pas de rituel');
  assert.equal(Jeu.rituelAFaire(CASSE, 'lea', lundi), true);
  assert.equal(Jeu.marquerRituel(CASSE, 'lea', lundi), false);
  assert.equal(Jeu.rituelAFaire(stockage({ 'pq-jeu': '{pas du json' }), 'lea', lundi), true);
});

test('vue mémorisée par compte, vue fournée par défaut', () => {
  const s = stockage();
  assert.equal(Jeu.lireVue(s, 'lea'), 'fournee');
  assert.equal(Jeu.choisirVue(s, 'lea', 'cartes'), true);
  assert.equal(Jeu.lireVue(s, 'lea'), 'cartes');
  assert.equal(Jeu.lireVue(s, 'tom'), 'fournee');
  assert.equal(Jeu.choisirVue(s, 'lea', 'autre'), false);
  assert.equal(Jeu.lireVue(s, 'lea'), 'cartes');
  Jeu.marquerRituel(s, 'lea', new Date(2026, 10, 23));
  assert.equal(Jeu.lireVue(s, 'lea'), 'cartes', 'le rituel ne touche pas à la vue');
  assert.equal(Jeu.lireVue(CASSE, 'lea'), 'fournee');
  assert.equal(Jeu.lireVue(stockage({ 'pq-jeu': '{"version":1,"comptes":{"lea":{"vue":42}}}' }), 'lea'), 'fournee');
});

test('textes FR et EN de même forme, sans tiret long', () => {
  const cles = o => Object.keys(o).sort().flatMap(k => (o[k] && typeof o[k] === 'object' ? cles(o[k]).map(x => k + '.' + x) : [k]));
  assert.deepEqual(cles(Jeu.TEXTES.fr), cles(Jeu.TEXTES.en));
  assert.doesNotMatch(JSON.stringify(Jeu.TEXTES), /—/);
  assert.doesNotMatch(lire('jeu.js') + lire('rituel.js'), /—/);
  assert.equal(Jeu.TEXTES.fr.raretes.maillard, 'Maillard');
  assert.equal(Jeu.TEXTES.fr.titre, 'La fournée sort du four');
  for (const id of ['mie', 'croute', 'doree', 'maillard']) assert.ok(Jeu.TEXTES.en.raretes[id]);
});

test('face de carte : rareté en toutes lettres, fraîcheur, famille, trois jauges chiffrées, texte échappé', () => {
  const a = art(1, 5, 4, 4, { titre: 'Un <b>titre</b> & co', source: 'Le "Monde"', feu: 'orange', axe: 'Axe 2' });
  const h = Jeu.faceHtml(a, 'fr');
  assert.match(h, /data-rarete="maillard"/);
  assert.match(h, />Maillard</);
  assert.match(h, /Un &lt;b&gt;titre&lt;\/b&gt; &amp; co/);
  assert.match(h, /Le &quot;Monde&quot;/);
  assert.match(h, /puce puce-petrir/);
  assert.match(h, />À pétrir</);
  assert.match(h, /Axe 2/);
  assert.match(h, /Monétisation 13\/15/);
  for (const v of ['5/5', '4/5']) assert.ok(h.includes('>' + v + '<'), v);
  assert.match(h, /Durabilité/); assert.match(h, /Propension/); assert.match(h, /Lien offre/);
  assert.match(Jeu.faceHtml(a, 'en'), /Shelf life/);
  assert.doesNotMatch(h, /<button|<a\b/, 'pas d’action dans la face du rituel');
});

test('annonce d’une carte retournée', () => {
  const a = art(2, 4, 4, 3, { titre: 'Titre', source: 'Src', feu: 'vert' });
  assert.equal(Jeu.annonce(a, 3, 5, 'fr'), 'Carte 3 sur 5 : Dorée. Titre. Tout chaud, Src, Axe 1. Monétisation 11/15.');
  assert.match(Jeu.annonce(a, 3, 5, 'en'), /^Card 3 of 5: /);
});

test('?demo=reset efface aussi pq-jeu', () => {
  assert.ok(Store.CLES_DEMO.includes('pq-jeu'));
  assert.equal(Jeu.CLE, 'pq-jeu');
});

test('rituel chargé sur les cinq pages protégées, avant visite.js, avec ses dépendances', () => {
  for (const p of ['comptoir.html', 'fournee.html', 'garde-manger.html', 'fournil.html', 'profil.html']) {
    const scripts = (lire(p).match(/<script src="[^"]+"/g) || []).map(s => s.slice(13, -1));
    const i = n => scripts.indexOf(n);
    for (const dep of ['/store.js', '/api.js', '/bento.js', '/charte.js', '/jeu.js', '/rituel.js']) assert.ok(i(dep) !== -1, p + ' : ' + dep);
    assert.equal(scripts.filter(s => s === '/jeu.js').length, 1, p);
    assert.ok(i('/jeu.js') < i('/rituel.js') && i('/rituel.js') < i('/visite.js') && i('/visite.js') < i('/boot.js'), p);
  }
});

test('visite : l’accueil attend la fin du rituel', () => {
  assert.match(lire('visite.js'), /pq:rituel-fin/);
  assert.match(lire('rituel.js'), /pq:rituel-fin/);
});

test('retournement sans animation si data-animations="off" ou prefers-reduced-motion', () => {
  const css = lire('charte.css');
  assert.match(css, /html\[data-animations="off"\] \.jeu-carte-3d\{transition:none\}/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{html:not\(\[data-animations="on"\]\) \.jeu-carte-3d\{transition:none\}\}/);
});

test('fournée : bascule de vue à aria-pressed et cartes avec les actions existantes', () => {
  const h = lire('fournee.html');
  assert.match(h, /data-act="vue-fournee"[^>]*aria-pressed="\{\{vueFourneePressed\}\}"/);
  assert.match(h, /data-act="vue-cartes"[^>]*aria-pressed="\{\{vueCartesPressed\}\}"/);
  const grille = h.slice(h.indexOf('data-cartes'), h.indexOf('</sc-for>', h.indexOf('data-cartes')));
  for (const act of ['knead', 'save', 'skip', 'read']) assert.match(grille, new RegExp('data-act="' + act + '"'), act);
  assert.match(grille, /data-rarete="\{\{c\.rarete\}\}"/);
  assert.match(grille, /data-visite="grille"/);
  assert.match(lire('visite.js'), /\[data-cartes\] \[data-id="n1"\] a\[data-act="knead"\]/);
});
