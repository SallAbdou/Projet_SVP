// Lot 33 : progression personnelle (cartes cuites, points de cuisson, niveaux, levain, collection, désactivation).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Jeu = require('../jeu.js');
const Auth = require('../auth.js');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');

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

test('constantes uniques : points, niveaux, levain', () => {
  assert.deepEqual(Jeu.POINTS.cuisson, { hot: 60, knead: 40, stale: 15 });
  assert.deepEqual(Jeu.POINTS.bonus, { maillard: 15, doree: 10, croute: 5, mie: 0 });
  assert.equal(Jeu.POINTS.rituel, 10);
  assert.deepEqual(Jeu.NIVEAUX.map(n => [n.id, n.min]), [['apprenti', 0], ['mitron', 100], ['boulanger', 250], ['maitre', 600]]);
  assert.deepEqual(Jeu.LEVAIN, { sommeil: 2, garde: 0.5 });
});

test('gain de cuisson : fraîcheur au moment de la cuisson puis bonus de rareté', () => {
  assert.equal(Jeu.gainCuisson('hot', 'maillard'), 75);
  assert.equal(Jeu.gainCuisson('knead', 'croute'), 45);
  assert.equal(Jeu.gainCuisson('stale', 'mie'), 15);
  assert.equal(Jeu.gainCuisson('', 'doree'), 50, 'fraîcheur inconnue : comme À pétrir');
  assert.ok(Jeu.gainCuisson('hot', 'mie') > Jeu.gainCuisson('knead', 'mie'));
  assert.ok(Jeu.gainCuisson('knead', 'mie') > Jeu.gainCuisson('stale', 'mie'));
});

test('niveau : seuils, points restants et barre vers le niveau suivant', () => {
  assert.deepEqual(Jeu.niveau(0), { id: 'apprenti', index: 0, points: 0, min: 0, suivant: 'mitron', reste: 100, pct: 0 });
  assert.deepEqual(Jeu.niveau(160), { id: 'mitron', index: 1, points: 160, min: 100, suivant: 'boulanger', reste: 90, pct: 40 });
  assert.equal(Jeu.niveau(249).id, 'mitron');
  assert.equal(Jeu.niveau(250).id, 'boulanger');
  assert.deepEqual(Jeu.niveau(900), { id: 'maitre', index: 3, points: 900, min: 600, suivant: null, reste: 0, pct: 100 });
  assert.equal(Jeu.niveau(-5).id, 'apprenti');
  assert.equal(Jeu.niveau('x').points, 0);
});

test('levain : un jour de plus par jour d’ouverture, rien de plus le même jour', () => {
  let l = Jeu.nourrirLevain(null, '2026-11-20');
  assert.deepEqual(l, { jours: 1, dernier: '2026-11-20' });
  l = Jeu.nourrirLevain(l, '2026-11-20');
  assert.deepEqual(l, { jours: 1, dernier: '2026-11-20' });
  l = Jeu.nourrirLevain(l, '2026-11-21');
  assert.equal(l.jours, 2);
  l = Jeu.nourrirLevain(l, '2026-11-23'); // un seul jour manqué : il ne dort pas
  assert.equal(l.jours, 3);
});

test('levain : s’endort après 2 jours manqués d’affilée, se réveille en gardant la moitié', () => {
  const l = { jours: 9, dernier: '2026-11-20' };
  assert.deepEqual(Jeu.etatLevain(l, '2026-11-21'), { jours: 9, endormi: false, nourriAujourdhui: false });
  assert.deepEqual(Jeu.etatLevain(l, '2026-11-22'), { jours: 9, endormi: false, nourriAujourdhui: false });
  assert.deepEqual(Jeu.etatLevain(l, '2026-11-23'), { jours: 9, endormi: true, nourriAujourdhui: false });
  assert.deepEqual(Jeu.etatLevain(l, '2026-11-20'), { jours: 9, endormi: false, nourriAujourdhui: true });
  const reveil = Jeu.nourrirLevain(l, '2026-11-30');
  assert.deepEqual(reveil, { jours: 6, dernier: '2026-11-30' }, 'moitié de 9 arrondie au-dessus, plus le jour même');
  assert.equal(Jeu.nourrirLevain({ jours: 1, dernier: '2026-01-01' }, '2026-11-30').jours, 2, 'jamais de retour à zéro');
  assert.deepEqual(Jeu.etatLevain(null, '2026-11-30'), { jours: 0, endormi: false, nourriAujourdhui: false });
  // Passage de mois et d'année
  assert.equal(Jeu.nourrirLevain({ jours: 3, dernier: '2026-12-31' }, '2027-01-01').jours, 4);
});

test('ouvrir la fournée : levain nourri et cartes du jour vues, une fois', () => {
  const s = memoire();
  const cartes = [art('a', 'vert', 5, 5, 4), art('b', 'rouge', 1, 1, 1, 'Axe 2')];
  Jeu.ouvrirFournee(s, 'lea', cartes, J('2026-11-24'));
  let c = Jeu.lireCompte(s, 'lea', J('2026-11-24'));
  assert.deepEqual(c.levain, { jours: 1, dernier: '2026-11-24' });
  assert.deepEqual(Object.keys(c.cartes).sort(), ['a', 'b']);
  assert.deepEqual(c.cartes.a, { titre: 'Titre a', source: 'Src', axe: 'Axe 1', rarete: 'maillard', vue: '2026-11-24', cuite: '', gain: 0 });
  Jeu.ouvrirFournee(s, 'lea', cartes, J('2026-11-25'));
  c = Jeu.lireCompte(s, 'lea', J('2026-11-25'));
  assert.equal(c.cartes.a.vue, '2026-11-24', 'la première vue est gardée');
  assert.equal(c.levain.jours, 2);
  assert.equal(c.points, 0, 'ouvrir la fournée ne rapporte pas de points');
});

test('rituel du matin : petit gain une seule fois par jour', () => {
  const s = memoire();
  assert.equal(Jeu.gagnerRituel(s, 'lea', J('2026-11-24')).gain, 10);
  assert.equal(Jeu.gagnerRituel(s, 'lea', J('2026-11-24')).gain, 0);
  assert.equal(Jeu.gagnerRituel(s, 'lea', J('2026-11-25')).gain, 10);
  assert.equal(Jeu.lireCompte(s, 'lea', J('2026-11-25')).points, 20);
  assert.equal(Jeu.gagnerRituel(s, null, J('2026-11-25')).gain, 0);
});

test('cuisson : une carte ne cuit qu’une fois, gain pondéré, passage de niveau signalé', () => {
  const s = memoire();
  const a = art('a', 'vert', 5, 5, 4);
  Jeu.ouvrirFournee(s, 'lea', [a], J('2026-11-24'));
  let r = Jeu.cuire(s, 'lea', a, 'hot', J('2026-11-24'));
  assert.deepEqual(r, { gain: 75, dejaCuite: false, avant: 'apprenti', apres: 'apprenti', monte: false, points: 75 });
  assert.equal(Jeu.estCuite(Jeu.lireCompte(s, 'lea', J('2026-11-24')), 'a'), true);
  r = Jeu.cuire(s, 'lea', a, 'hot', J('2026-11-25'));
  assert.equal(r.gain, 0);
  assert.equal(r.dejaCuite, true);
  // Carte jamais vue (sujet du garde-manger sans notes) : ajoutée et cuite, rareté Mie
  r = Jeu.cuire(s, 'lea', { ref: 'z', titre: 'Z', source: 'S', feu: 'orange' }, 'knead', J('2026-11-25'));
  assert.equal(r.gain, 40);
  assert.equal(r.monte, true);
  assert.equal(r.apres, 'mitron');
  const c = Jeu.lireCompte(s, 'lea', J('2026-11-25'));
  assert.equal(c.cartes.z.rarete, 'mie');
  assert.equal(c.cartes.z.cuite, '2026-11-25');
  assert.equal(c.cartes.z.gain, 40);
  assert.equal(c.cartes.a.cuite, '2026-11-24');
  assert.equal(c.points, 115);
});

test('cuisson : la rareté de la carte déjà vue l’emporte sur un article sans notes', () => {
  const s = memoire();
  Jeu.ouvrirFournee(s, 'lea', [art('a', 'vert', 5, 4, 4)], J('2026-11-24'));
  const r = Jeu.cuire(s, 'lea', { ref: 'a', titre: 'Titre a' }, 'stale', J('2026-11-27'));
  assert.equal(r.gain, 15 + 15);
});

test('fraîcheur de cuisson : feu de la fournée ou catégorie du garde-manger', () => {
  assert.equal(Jeu.fraicheurCuisson({ feu: 'vert' }, 'fournee'), 'hot');
  assert.equal(Jeu.fraicheurCuisson({ feu: 'rouge' }, 'fournee'), 'stale');
  assert.equal(Jeu.fraicheurCuisson({}, 'garde-manger', 'chaud'), 'hot');
  assert.equal(Jeu.fraicheurCuisson({}, 'garde-manger', 'enfourner'), 'knead');
  assert.equal(Jeu.fraicheurCuisson({}, 'garde-manger', 'rassis'), 'stale');
  assert.equal(Jeu.fraicheurCuisson({}, 'fournee'), 'knead');
});

test('jeu désactivé : aucun gain ni carte enregistrée, données conservées et rendues', () => {
  const s = memoire();
  const a = art('a', 'vert', 5, 5, 4);
  Jeu.ouvrirFournee(s, 'lea', [a], J('2026-11-24'));
  Jeu.cuire(s, 'lea', a, 'hot', J('2026-11-24'));
  assert.equal(Jeu.estActif(s, 'lea'), true, 'activé par défaut');
  assert.equal(Jeu.activer(s, 'lea', false), true);
  assert.equal(Jeu.estActif(s, 'lea'), false);
  assert.equal(Jeu.rituelAFaire(s, 'lea', J('2026-11-25')), false, 'pas de rituel');
  assert.equal(Jeu.lireVue(s, 'lea'), 'fournee', 'retour à la vue fournée');
  Jeu.ouvrirFournee(s, 'lea', [art('b', 'vert', 1, 1, 1)], J('2026-11-25'));
  assert.equal(Jeu.cuire(s, 'lea', art('b', 'vert', 1, 1, 1), 'hot', J('2026-11-25')).gain, 0);
  assert.equal(Jeu.gagnerRituel(s, 'lea', J('2026-11-25')).gain, 0);
  let c = Jeu.lireCompte(s, 'lea', J('2026-11-25'));
  assert.equal(c.points, 75);
  assert.deepEqual(Object.keys(c.cartes), ['a']);
  assert.equal(c.levain.dernier, '2026-11-24');
  Jeu.activer(s, 'lea', true);
  c = Jeu.lireCompte(s, 'lea', J('2026-11-25'));
  assert.equal(c.points, 75);
  assert.equal(c.cartes.a.cuite, '2026-11-24');
  assert.equal(Jeu.estActif(s, 'other'), true);
  assert.equal(Jeu.estActif(CASSE, 'lea'), true);
  assert.equal(Jeu.activer(CASSE, 'lea', false), false);
});

test('compte du lot 32 ({ rituel, vue }) relu sans perte', () => {
  const s = memoire();
  s.setItem('pq-jeu', JSON.stringify({ version: 1, comptes: { lea: { rituel: '2026-11-24', vue: 'cartes' } } }));
  const c = Jeu.lireCompte(s, 'lea', J('2026-11-25'));
  assert.equal(c.rituel, '2026-11-24');
  assert.equal(c.vue, 'cartes');
  assert.equal(c.actif, true);
  assert.equal(c.points, 0);
  assert.deepEqual(c.cartes, {});
  assert.deepEqual(c.levain, { jours: 0, dernier: '' });
});

test('données abîmées : valeurs par défaut, cartes invalides écartées', () => {
  const s = memoire();
  s.setItem('pq-jeu', JSON.stringify({ version: 1, comptes: { lea: { points: -4, levain: 'x', cartes: { a: 3, b: { titre: 'B', rarete: 'zz' } } } } }));
  const c = Jeu.lireCompte(s, 'lea', J('2026-11-25'));
  assert.equal(c.points, 0);
  assert.deepEqual(c.levain, { jours: 0, dernier: '' });
  assert.deepEqual(Object.keys(c.cartes), ['b']);
  assert.equal(c.cartes.b.rarete, 'mie');
  assert.equal(c.cartes.b.cuite, '');
});

test('collection : par famille, progression par série, cuites d’abord', () => {
  const s = memoire();
  Jeu.ouvrirFournee(s, 'lea', [art('a', 'vert', 2, 2, 2, 'Agents IA'), art('b', 'vert', 5, 5, 5, 'Agents IA'), art('c', 'rouge', 3, 3, 3, 'Modèles'), art('d', 'vert', 4, 4, 4, 'Agents IA')], J('2026-11-24'));
  Jeu.cuire(s, 'lea', { ref: 'a' }, 'hot', J('2026-11-24'));
  const col = Jeu.collection(Jeu.lireCompte(s, 'lea', J('2026-11-24')));
  assert.deepEqual(col.total, { vues: 4, cuites: 1 });
  assert.deepEqual(col.familles.map(f => [f.famille, f.cartes.length, f.cuites]), [['Agents IA', 3, 1], ['Modèles', 1, 0]]);
  assert.deepEqual(col.familles[0].cartes.map(c => c.ref), ['a', 'b', 'd'], 'cuites, puis de la plus rare à la plus courante');
  assert.equal(Jeu.libelleSerie('Agents IA', 3, 1, 'fr'), 'Agents IA : 3 cartes, dont 1 cuite');
  assert.equal(Jeu.libelleSerie('Modèles', 1, 0, 'fr'), 'Modèles : 1 carte, aucune cuite pour l’instant');
  assert.equal(Jeu.libelleSerie('Agents', 4, 2, 'en'), 'Agents: 4 cards, 2 baked');
  assert.deepEqual(Jeu.collection(Jeu.lireCompte(memoire(), 'x', J('2026-11-24'))), { total: { vues: 0, cuites: 0 }, familles: [] });
  // Carte sans famille : rangée sous « Autres »
  const s2 = memoire();
  Jeu.ouvrirFournee(s2, 'x', [{ ref: 'q', titre: 'Q', feu: 'vert' }], J('2026-11-24'));
  assert.equal(Jeu.collection(Jeu.lireCompte(s2, 'x', J('2026-11-24')), 'en').familles[0].famille, 'Other');
});

test('données d’exemple de Léa : compte démo sans entrée, plausibles, marquées', () => {
  assert.equal(Jeu.COMPTE_DEMO, Auth.COMPTE_DEMO.email);
  const s = memoire();
  const c = Jeu.lireCompte(s, Jeu.COMPTE_DEMO, J('2026-11-25'));
  assert.equal(c.exemple, true);
  assert.equal(Jeu.niveau(c.points).id, 'mitron');
  assert.equal(c.levain.dernier, '2026-11-24', 'nourri la veille : la visite du jour le fait grandir');
  assert.ok(c.levain.jours >= 3);
  const col = Jeu.collection(c);
  assert.ok(col.total.vues >= 5);
  assert.ok(col.total.cuites >= 1 && col.total.cuites <= 2);
  assert.ok(col.familles.length >= 2);
  assert.equal(c.rituel, '', 'le rituel du lot 32 reste à faire');
  assert.ok(Jeu.niveau(c.points + Jeu.POINTS.rituel + Jeu.gainCuisson('hot', 'maillard')).id === 'boulanger', 'démo : le rituel puis une cuisson font passer Boulanger');
  // Autre compte : rien
  assert.deepEqual(Jeu.lireCompte(s, 'autre@x.fr', J('2026-11-25')).cartes, {});
  // Une fois écrit, l'exemple est conservé tel quel (une visite le fait grandir)
  Jeu.ouvrirFournee(s, Jeu.COMPTE_DEMO, [], J('2026-11-25'));
  const apres = Jeu.lireCompte(s, Jeu.COMPTE_DEMO, J('2026-11-25'));
  assert.equal(apres.levain.jours, c.levain.jours + 1);
  assert.equal(apres.points, c.points);
  // ?demo=reset : pq-jeu effacé, l'exemple revient à neuf
  require('../store.js').reinitialiserDemo(s);
  assert.equal(s.getItem('pq-jeu'), null);
  assert.equal(Jeu.lireCompte(s, Jeu.COMPTE_DEMO, J('2026-11-25')).levain.jours, c.levain.jours);
});

test('résumé de progression pour le comptoir : texte complet lisible', () => {
  const s = memoire();
  const r = Jeu.resume(Jeu.lireCompte(s, Jeu.COMPTE_DEMO, J('2026-11-25')), '2026-11-25', 'fr');
  assert.equal(r.niveau, 'Mitron');
  assert.equal(r.points, '185 points de cuisson');
  assert.equal(r.suite, '65 points avant Boulanger');
  assert.equal(r.pct, 57);
  assert.match(r.levain, /4 jours/);
  assert.equal(r.endormi, false);
  const dort = Jeu.resume({ points: 900, levain: { jours: 5, dernier: '2026-11-01' }, cartes: {} }, '2026-11-25', 'en');
  assert.equal(dort.endormi, true);
  assert.equal(dort.suite, 'Highest level reached');
  assert.doesNotMatch(JSON.stringify(dort), /—/);
  assert.equal(Jeu.resume({ points: 0, levain: { jours: 1, dernier: '2026-11-25' }, cartes: {} }, '2026-11-25', 'fr').levain, 'Ton levain : 1 jour');
});

test('textes FR et EN de même forme, sans tiret long', () => {
  const cles = o => Object.keys(o).sort().map(k => (o[k] && typeof o[k] === 'object' ? k + ':' + cles(o[k]).join(',') : k));
  assert.deepEqual(cles(Jeu.TEXTES.fr), cles(Jeu.TEXTES.en));
  assert.doesNotMatch(JSON.stringify(Jeu.TEXTES), /—/);
  assert.equal(Jeu.TEXTES.fr.niveaux.maitre, 'Maître artisan');
  assert.equal(Jeu.TEXTES.fr.cuite, 'Cuite');
});

test('message de cuisson : gain puis passage de niveau, sobre', () => {
  assert.equal(Jeu.messageCuisson({ gain: 55, monte: false, apres: 'mitron' }, 'fr'), 'Carte cuite : +55 points de cuisson.');
  assert.equal(Jeu.messageCuisson({ gain: 75, monte: true, apres: 'boulanger' }, 'fr'), 'Carte cuite : +75 points de cuisson. Nouveau niveau : Boulanger.');
  assert.equal(Jeu.messageCuisson({ gain: 0, dejaCuite: true }, 'fr'), 'Cette carte était déjà cuite.');
  assert.equal(Jeu.messageCuisson(null, 'fr'), '');
  assert.equal(Jeu.messageCuisson({ gain: 40, monte: true, apres: 'maitre' }, 'en'), 'Card baked: +40 baking points. New level: Master baker.');
});

/* ---------- Branchements des pages ---------- */

test('fournil : la confirmation de publication cuit la carte et l’annonce', () => {
  const h = lire('fournil.html');
  const conf = h.slice(h.indexOf('confirmerPublication() {'), h.indexOf('enregistrerChiffres(form)'));
  assert.match(conf, /Jeu\.cuire\(/);
  assert.match(conf, /Jeu\.fraicheurCuisson\(/);
  assert.match(conf, /this\.annoncer\('publie', cuisson\)/);
  assert.match(h, /texte: T\[lang\]\[toast\.cle\] \+ \(toast\.cuisson && Jeu\.messageCuisson\(/);
  assert.match(h, /<div id="pq-toast" role="status"/);
});

test('fournée : cartes vues à l’ouverture, carte cuite marquée en texte, bascule masquée si jeu coupé', () => {
  const h = lire('fournee.html');
  assert.match(h, /Jeu\.ouvrirFournee\(/);
  assert.match(h, /data-cuite="\{\{c\.cuite\}\}"/);
  assert.match(h, /class="jeu-cuite"[^>]*>[^<]*<svg[^>]*aria-hidden="true"[\s\S]*?\{\{j\.cuite\}\}/);
  assert.match(h, /var jeuActif = !!cleCompte\(\) && compteJeu\.actif;/);
  assert.match(h, /basculeStyle: ready && jeuActif \?/);
});

test('rituel : rien si le jeu est coupé (rituelAFaire), petit gain à l’ouverture', () => {
  const r = lire('rituel.js');
  assert.match(r, /Jeu\.gagnerRituel\(/);
  assert.match(r, /Jeu\.ouvrirFournee\(/);
});

test('comptoir : encart levain et niveau, texte lisible, barre décorative', () => {
  const h = lire('comptoir.html');
  assert.match(h, /data-jeu-encart/);
  assert.match(h, /aria-labelledby="jeu-encart-t"/);
  assert.match(h, /class="jeu-barre" aria-hidden="true"/);
  assert.match(h, /Jeu\.resume\(/);
  assert.match(h, /\/garde-manger\?onglet=collection/);
});

test('garde-manger : onglets accessibles et collection', () => {
  const h = lire('garde-manger.html');
  assert.match(h, /role="tablist"/);
  assert.equal((h.match(/role="tab"/g) || []).length, 2);
  assert.equal((h.match(/role="tabpanel"/g) || []).length, 2);
  assert.match(h, /aria-selected="\{\{/);
  assert.match(h, /aria-controls="gm-panneau-/);
  assert.match(h, /onKeydown="\{\{clavierOnglets\}\}"/);
  assert.match(h, /Jeu\.collection\(/);
  assert.match(h, /data-visite="garde"/);
  assert.match(h, /<script src="\/jeu\.js"><\/script>[\s\S]*<script src="\/boot\.js">/);
});

test('profil : case « Jeu des cartes activé » mémorisée par compte', () => {
  const h = lire('profil.html');
  assert.match(h, /<input id="jeu-actif" type="checkbox"[^>]*onChange="\{\{choisirJeu\}\}"/);
  assert.match(h, /<label for="jeu-actif"/);
  assert.match(h, /Jeu\.activer\(/);
  assert.match(h, /jeuLabel: 'Jeu des cartes activé'/);
  assert.match(h, /jeuLabel: 'Card game on'/);
  assert.match(h, /<script src="\/jeu\.js"><\/script>/);
});

test('carte cuite : traitement visuel distinct, pas seulement la couleur ; barre sans animation si coupée', () => {
  const css = lire('charte.css');
  assert.match(css, /\.jeu-carte\[data-cuite="true"\]/);
  assert.match(css, /\.jeu-cuite\{/);
  assert.match(css, /html\[data-animations="off"\] \.jeu-barre-plein\{[^}]*animation:none/);
  assert.match(css, /prefers-reduced-motion:reduce\)\{html:not\(\[data-animations="on"\]\) \.jeu-barre-plein\{[^}]*animation:none/);
});

test('note pour le back : schéma Supabase indicatif de la progression', () => {
  const d = lire('docs/branchement-back.md');
  assert.match(d, /create table[^;]*jeu_progression/i);
  assert.match(d, /create table[^;]*jeu_cartes/i);
});
