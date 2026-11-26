// Lot 34 : les cartes se découvrent dans la fournée (face cachée, retournement mémorisé par compte et par jour)
// et la collection de pains du garde-manger (historique des cartes découvertes).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Jeu = require('../jeu.js');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const existe = f => fs.existsSync(path.join(RACINE, f));

function memoire() {
  const m = {};
  return {
    _m: m,
    getItem: k => (Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: k => { delete m[k]; }
  };
}
const CASSE = { getItem() { throw new Error('non'); }, setItem() { throw new Error('non'); } };
const J = s => new Date(s + 'T09:00:00');
const art = (ref, feu, d, p, l, axe) => ({ ref, titre: 'Titre ' + ref, source: 'Src', feu, axe: axe || 'Axe 1', durabilite: d, propension: p, lienOffre: l });

test('points : la découverte du jour rapporte, plus le rituel', () => {
  assert.equal(Jeu.POINTS.decouverte, 10);
  assert.equal(Jeu.POINTS.rituel, undefined);
  for (const f of ['rituelAFaire', 'marquerRituel', 'gagnerRituel', 'lireVue', 'choisirVue', 'ordreRetournement', 'peutRetourner', 'faceHtml', 'ouvrirFournee']) {
    assert.equal(Jeu[f], undefined, f + ' retiré');
  }
});

test('retournement mémorisé par compte et par jour ; un nouveau jour recache les cartes', () => {
  const s = memoire();
  const a = art('a', 'vert', 5, 5, 4), b = art('b', 'orange', 3, 3, 3);
  let c = Jeu.lireCompte(s, 'lea', J('2026-11-24'));
  assert.equal(Jeu.estCachee(c, 'a', '2026-11-24'), true, 'face cachée au départ');
  Jeu.decouvrir(s, 'lea', [a], J('2026-11-24'));
  c = Jeu.lireCompte(s, 'lea', J('2026-11-24'));
  assert.equal(Jeu.estCachee(c, 'a', '2026-11-24'), false, 'retournée, relue comme après un rechargement');
  assert.equal(Jeu.estCachee(c, 'b', '2026-11-24'), true);
  assert.deepEqual(c.decouvertes, { date: '2026-11-24', refs: ['a'] });
  // Lendemain : la même news (ou une autre) revient face cachée.
  c = Jeu.lireCompte(s, 'lea', J('2026-11-25'));
  assert.equal(Jeu.estCachee(c, 'a', '2026-11-25'), true);
  assert.deepEqual(Jeu.decouvertesDuJour(c, '2026-11-25'), []);
  // Autre compte : rien de retourné.
  assert.equal(Jeu.estCachee(Jeu.lireCompte(s, 'tom', J('2026-11-24')), 'a', '2026-11-24'), true);
  // Sans compte ou stockage cassé : pas d'écriture.
  assert.equal(Jeu.decouvrir(s, null, [a], J('2026-11-24')).gain, 0);
  assert.equal(Jeu.decouvrir(CASSE, 'lea', [a], J('2026-11-24')).ok, false);
});

test('découvrir : la carte entre dans la collection avec sa fraîcheur du moment', () => {
  const s = memoire();
  Jeu.decouvrir(s, 'lea', [art('a', 'vert', 5, 5, 4), art('b', 'rouge', 1, 1, 1, 'Axe 2')], J('2026-11-24'));
  let c = Jeu.lireCompte(s, 'lea', J('2026-11-24'));
  assert.deepEqual(c.cartes.a, { titre: 'Titre a', source: 'Src', axe: 'Axe 1', rarete: 'maillard', fraicheur: 'hot', vue: '2026-11-24', cuite: '', gain: 0 });
  assert.equal(c.cartes.b.fraicheur, 'stale');
  // Une news déjà découverte un autre jour garde sa première date et sa fraîcheur d'alors.
  Jeu.decouvrir(s, 'lea', [art('b', 'vert', 1, 1, 1, 'Axe 2')], J('2026-11-26'));
  c = Jeu.lireCompte(s, 'lea', J('2026-11-26'));
  assert.equal(c.cartes.b.vue, '2026-11-24');
  assert.equal(c.cartes.b.fraicheur, 'stale');
  assert.equal(Jeu.estCachee(c, 'b', '2026-11-26'), false);
});

test('points une seule fois par jour, à la première carte ; le levain compte les jours de découverte', () => {
  const s = memoire();
  let r = Jeu.decouvrir(s, 'lea', [art('a', 'vert', 1, 1, 1)], J('2026-11-24'));
  assert.equal(r.gain, 10);
  assert.equal(r.premiere, true);
  r = Jeu.decouvrir(s, 'lea', [art('b', 'vert', 1, 1, 1)], J('2026-11-24'));
  assert.equal(r.gain, 0, 'deuxième carte du jour : rien de plus');
  assert.equal(r.premiere, false);
  r = Jeu.decouvrir(s, 'lea', [art('b', 'vert', 1, 1, 1)], J('2026-11-24'));
  assert.equal(r.gain, 0, 'carte déjà retournée');
  let c = Jeu.lireCompte(s, 'lea', J('2026-11-24'));
  assert.equal(c.points, 10);
  assert.deepEqual(c.levain, { jours: 1, dernier: '2026-11-24' });
  // Jour sans découverte : le levain n'est pas nourri ; le lendemain d'après, il compte un jour de plus.
  Jeu.lireCompte(s, 'lea', J('2026-11-25'));
  c = Jeu.lireCompte(s, 'lea', J('2026-11-25'));
  assert.equal(c.levain.dernier, '2026-11-24');
  Jeu.decouvrir(s, 'lea', [art('c', 'vert', 1, 1, 1)], J('2026-11-26'));
  c = Jeu.lireCompte(s, 'lea', J('2026-11-26'));
  assert.deepEqual(c.levain, { jours: 2, dernier: '2026-11-26' });
  assert.equal(c.points, 20);
});

test('tout retourner : toutes les cartes d’un coup, un seul gain', () => {
  const s = memoire();
  const cartes = [art('a', 'vert', 5, 5, 5), art('b', 'orange', 3, 3, 3), art('c', 'rouge', 1, 1, 1)];
  const r = Jeu.decouvrir(s, 'lea', cartes, J('2026-11-24'));
  assert.equal(r.gain, 10);
  assert.deepEqual(r.refs, ['a', 'b', 'c']);
  const c = Jeu.lireCompte(s, 'lea', J('2026-11-24'));
  assert.deepEqual(cartes.filter(a => Jeu.estCachee(c, a.ref, '2026-11-24')), []);
  assert.equal(Object.keys(c.cartes).length, 3);
});

test('jeu coupé : rien de caché, rien d’enregistré ; les données reviennent quand on recoche', () => {
  const s = memoire();
  Jeu.decouvrir(s, 'lea', [art('a', 'vert', 5, 5, 5)], J('2026-11-24'));
  Jeu.activer(s, 'lea', false);
  let c = Jeu.lireCompte(s, 'lea', J('2026-11-24'));
  assert.equal(Jeu.estCachee(c, 'z', '2026-11-24'), false, 'fournée face visible');
  const r = Jeu.decouvrir(s, 'lea', [art('z', 'vert', 1, 1, 1)], J('2026-11-25'));
  assert.equal(r.gain, 0);
  c = Jeu.lireCompte(s, 'lea', J('2026-11-25'));
  assert.deepEqual(Object.keys(c.cartes), ['a']);
  assert.equal(c.levain.dernier, '2026-11-24');
  Jeu.activer(s, 'lea', true);
  c = Jeu.lireCompte(s, 'lea', J('2026-11-25'));
  assert.equal(c.points, 10);
  assert.equal(Jeu.estCachee(c, 'z', '2026-11-25'), true);
  // Sans compte (null) : jamais de face cachée.
  assert.equal(Jeu.estCachee(Jeu.lireCompte(s, null), 'a', '2026-11-24'), false);
});

test('dos de carte : rang, rareté en toutes lettres, nom accessible, le n°1 à garder pour la fin', () => {
  const d3 = Jeu.dos(art('c', 'vert', 3, 3, 3), 3, 'fr');
  assert.deepEqual(d3, { rarete: 'croute', grignes: 2, rang: 'n°3', rareteNom: 'Croûte', aide: 'Découvrir', label: 'Découvrir la news n°3, rareté Croûte' });
  const d1 = Jeu.dos(art('a', 'vert', 5, 5, 4), 1, 'fr');
  assert.equal(d1.rareteNom, 'Maillard');
  assert.equal(d1.aide, 'À garder pour la fin');
  assert.equal(d1.label, 'Découvrir la news n°1, rareté Maillard, à garder pour la fin');
  assert.equal(Jeu.dos(art('a', 'vert', 3, 3, 3), 2, 'en').label, 'Discover story #2, rarity Crust');
});

test('compteur et annonces : textes FR et EN', () => {
  assert.equal(Jeu.compteDecouvertes(2, 5, 'fr'), '2 cartes sur 5 découvertes');
  assert.equal(Jeu.compteDecouvertes(1, 5, 'fr'), '1 carte sur 5 découverte');
  assert.equal(Jeu.compteDecouvertes(0, 5, 'fr'), 'Aucune carte découverte sur 5');
  assert.equal(Jeu.compteDecouvertes(5, 5, 'fr'), 'Toute la fournée est découverte');
  assert.equal(Jeu.compteDecouvertes(2, 5, 'en'), '2 of 5 cards discovered');
  assert.equal(Jeu.TEXTES.fr.toutRetourner, 'Tout retourner');
  assert.equal(Jeu.messageDecouverte({ gain: 10 }, 'fr'), 'Première carte du jour : +10 points de cuisson.');
  assert.equal(Jeu.messageDecouverte({ gain: 0 }, 'fr'), '');
  assert.match(Jeu.annonce(art('a', 'vert', 4, 4, 3), 3, 5, 'fr'), /^Carte 3 sur 5 : Dorée\./);
});

test('historique de la collection : du plus récent au plus ancien, filtres par rareté et famille', () => {
  const s = memoire();
  Jeu.decouvrir(s, 'lea', [art('a', 'vert', 1, 1, 1, 'Agents'), art('b', 'vert', 5, 5, 5, 'Modèles')], J('2026-11-22'));
  Jeu.decouvrir(s, 'lea', [art('c', 'orange', 3, 3, 3, 'Agents')], J('2026-11-24'));
  Jeu.cuire(s, 'lea', { ref: 'a' }, 'hot', J('2026-11-24'));
  const c = Jeu.lireCompte(s, 'lea', J('2026-11-24'));
  const h = Jeu.historique(c);
  assert.deepEqual(h.cartes.map(x => x.ref), ['c', 'b', 'a'], 'récent d’abord, puis la plus rare le même jour');
  assert.deepEqual(h.cartes[2], { ref: 'a', titre: 'Titre a', source: 'Src', axe: 'Agents', rarete: 'mie', fraicheur: 'hot', vue: '2026-11-22', cuite: '2026-11-24', gain: 60 });
  assert.deepEqual(h.familles, ['Agents', 'Modèles']);
  assert.deepEqual(h.raretes, ['maillard', 'croute', 'mie'], 'raretés présentes, de la plus rare à la plus courante');
  assert.equal(h.total, 3);
  assert.deepEqual(Jeu.historique(c, { rarete: 'maillard' }).cartes.map(x => x.ref), ['b']);
  assert.deepEqual(Jeu.historique(c, { famille: 'Agents' }).cartes.map(x => x.ref), ['c', 'a']);
  assert.deepEqual(Jeu.historique(c, { famille: 'Agents', rarete: 'maillard' }).cartes, []);
  assert.equal(Jeu.historique(c, { famille: 'Agents' }).total, 3, 'le total ignore les filtres');
  assert.deepEqual(Jeu.historique(null).cartes, []);
});

test('données d’exemple de Léa : quelques jours passés, rien de découvert aujourd’hui', () => {
  const c = Jeu.lireCompte(memoire(), Jeu.COMPTE_DEMO, J('2026-11-26'));
  assert.equal(c.exemple, true);
  assert.deepEqual(Jeu.decouvertesDuJour(c, '2026-11-26'), []);
  const h = Jeu.historique(c);
  assert.ok(h.total >= 8, 'au moins 8 cartes');
  assert.ok(h.familles.length >= 3, 'au moins 3 familles');
  const jours = new Set(h.cartes.map(x => x.vue));
  assert.ok(jours.size >= 4, 'sur au moins 4 jours');
  assert.ok(h.cartes.every(x => x.vue < '2026-11-26'), 'toutes passées');
  assert.ok(h.cartes.every(x => ['hot', 'knead', 'stale'].indexOf(x.fraicheur) !== -1), 'fraîcheur renseignée');
  assert.equal(h.cartes.filter(x => x.cuite).length, 2);
  assert.ok(lire('jeu.js').includes('DONNÉES D\'EXEMPLE'), 'marquées comme telles dans le code');
  // Démo : la première carte du jour puis une cuisson Tout chaud Maillard font passer Boulanger.
  assert.equal(Jeu.niveau(c.points).id, 'mitron');
  assert.equal(Jeu.niveau(c.points + Jeu.POINTS.decouverte + Jeu.gainCuisson('hot', 'maillard')).id, 'boulanger');
});

test('compte du lot 33 : rituelPoints du jour compte comme gain déjà pris, champ vue ignoré', () => {
  const s = memoire();
  s.setItem('pq-jeu', JSON.stringify({ version: 1, comptes: { lea: { rituel: '2026-11-24', vue: 'cartes', points: 40, rituelPoints: '2026-11-24', cartes: { x: { titre: 'X', rarete: 'doree', vue: '2026-11-20' } } } } }));
  assert.equal(Jeu.decouvrir(s, 'lea', [art('a', 'vert', 1, 1, 1)], J('2026-11-24')).gain, 0);
  const c = Jeu.lireCompte(s, 'lea', J('2026-11-24'));
  assert.equal(c.points, 40);
  assert.equal(c.cartes.x.fraicheur, '', 'carte du lot 33 sans fraîcheur');
  assert.equal(c.vue, undefined);
  assert.equal(c.rituel, undefined);
});

/* ---------- Branchements des pages ---------- */

test('rituel plein écran retiré partout', () => {
  assert.equal(existe('rituel.js'), false);
  for (const p of ['comptoir.html', 'fournee.html', 'garde-manger.html', 'fournil.html', 'profil.html']) {
    assert.doesNotMatch(lire(p), /rituel\.js/, p);
  }
  assert.doesNotMatch(lire('visite.js'), /pq:rituel-fin|Rituel\./);
  assert.doesNotMatch(lire('charte.css'), /\.jeu-rituel/);
});

test('fournée : dos de carte en bouton, compteur, Tout retourner, plus de vue cartes', () => {
  const h = lire('fournee.html');
  assert.doesNotMatch(h, /data-cartes|vue-cartes|data-act="vue-fournee"/);
  const tuile = h.slice(h.indexOf('<sc-for list="{{slots}}"'), h.indexOf('</sc-for>', h.indexOf('<sc-for list="{{slots}}"')));
  assert.match(tuile, /<button type="button" class="jeu-dos"[^>]*data-act="decouvrir"[^>]*data-id="\{\{s\.id\}\}"[^>]*aria-label="\{\{s\.dosLabel\}\}"/);
  assert.match(tuile, /data-cachee="\{\{s\.cachee\}\}"/);
  assert.match(tuile, /data-rarete="\{\{s\.dosRarete\}\}"/);
  assert.match(tuile, /\{\{s\.dosRang\}\}/);
  assert.match(tuile, /\{\{s\.dosRareteNom\}\}/);
  assert.match(tuile, /<h2 id="tt-\{\{s\.id\}\}" class="news-title" tabindex="-1"/);
  assert.match(h, /data-act="tout-retourner"/);
  assert.match(h, /Jeu\.decouvrir\(/);
  assert.match(h, /Jeu\.estCachee\(/);
  assert.match(h, /window\.annoncer/);
  assert.match(h, /pq:visite-etape/);
  assert.match(h, /\.tile\[data-cachee="true"\] \.tile-body\{display:none\}/);
  assert.match(h, /\.bento\.editing \.jeu-dos\{[^}]*pointer-events:none/);
});

test('retournement sans animation si data-animations="off" ou prefers-reduced-motion', () => {
  const css = lire('charte.css');
  assert.match(css, /html\[data-animations="off"\] \.tile\[data-tourne\],html\[data-animations="off"\] \.tile\[data-revele\]\{animation:none\}/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{html:not\(\[data-animations="on"\]\) \.tile\[data-tourne\],html:not\(\[data-animations="on"\]\) \.tile\[data-revele\]\{animation:none\}\}/);
  assert.match(lire('fournee.html'), /function animationsCoupees\(\)/);
});

test('visite : la fournée découvre le n°1 aux étapes fournée et pétrir', () => {
  const v = lire('visite.js');
  assert.match(v, /pq:visite-etape/);
  const V = require('../visite.js');
  assert.match(V.TEXTES.fr.etapes.fournee.texte, /face cachée/);
  assert.match(V.TEXTES.en.etapes.fournee.texte, /face down/);
});

test('garde-manger : collection de pains, progression par famille puis historique filtrable', () => {
  const h = lire('garde-manger.html');
  assert.equal(Jeu.TEXTES.fr.collection.titre, 'Collection de pains');
  assert.equal(Jeu.TEXTES.en.collection.titre, 'Bread collection');
  assert.match(h, /Jeu\.historique\(/);
  assert.match(h, /<label for="col-rarete"/);
  assert.match(h, /<select id="col-rarete"[^>]*onChange="\{\{filtrerRarete\}\}"/);
  assert.match(h, /<label for="col-famille"/);
  assert.match(h, /<select id="col-famille"[^>]*onChange="\{\{filtrerFamille\}\}"/);
  assert.ok(h.indexOf('data-col-familles') < h.indexOf('data-col-historique'), 'progression au-dessus de l’historique');
  assert.match(h, /\{\{x\.fraicheurNom\}\}/);
  assert.match(h, /\{\{x\.famille\}\}/);
});

test('profil : aide de la case à jour (plus de rituel ni de vue cartes)', () => {
  const h = lire('profil.html');
  assert.doesNotMatch(h, /rituel|vue cartes/i);
  assert.match(h, /face cachée/);
});

test('aucun tiret long dans les fichiers du lot', () => {
  for (const f of ['jeu.js', 'fournee.html', 'garde-manger.html', 'visite.js', 'charte.css', 'profil.html', 'docs/superpowers/specs/2026-11-26-lot34-cartes-fournee-design.md', 'docs/superpowers/plans/2026-11-26-lot34-cartes-fournee.md']) {
    assert.doesNotMatch(lire(f), /—/, f);
  }
});
