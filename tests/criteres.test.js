// Lot 35 : critères de monétisation renommés (Durabilité, Intérêt business, Pertinence), nouvelles bulles,
// puce de thème (axe de l'article) dans la rangée d'étiquettes des tuiles de la fournée.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const C = require('../charte.js');

// Fichiers servis : pages, scripts et feuilles de style de la racine, hors copies de travail.
const SERVIS = fs.readdirSync(RACINE).filter(f => /\.(html|js|css)$/.test(f) && !/ copy\./.test(f));

const FR = { durabilite: 'Durabilité', propension: 'Intérêt business', lienOffre: 'Pertinence' };
const EN = { durabilite: 'Durability', propension: 'Business interest', lienOffre: 'Relevance' };
const AIDES_FR = {
  durabilite: 'Le sujet sera-t-il encore valable dans une semaine ?',
  propension: 'Le sujet touche-t-il un problème pour lequel une entreprise paie ?',
  lienOffre: 'Le sujet est-il lié à ton ou tes métiers et à ta ou tes thématiques ?'
};
const AIDES_EN = {
  durabilite: 'Will the topic still hold up in a week?',
  propension: 'Does the topic touch on a problem a business pays to solve?',
  lienOffre: 'Is the topic linked to your line or lines of work and to your topic or topics?'
};
const obj = o => '{ durabilite: \'' + o.durabilite + '\', propension: \'' + o.propension + '\', lienOffre: \'' + o.lienOffre + '\' }';

test('fournee.html : libellés et bulles des trois critères renommés, FR et EN', () => {
  const h = lire('fournee.html');
  assert.ok(h.includes('jauges: ' + obj(FR)), 'jauges FR');
  assert.ok(h.includes('jauges: ' + obj(EN)), 'jauges EN');
  assert.ok(h.includes('aides: ' + obj(AIDES_FR)), 'aides FR');
  assert.ok(h.includes('aides: ' + obj(AIDES_EN)), 'aides EN');
});

test('jeu.js : cartes et collection reprennent les nouveaux libellés', () => {
  const Jeu = require('../jeu.js');
  assert.deepEqual(Jeu.TEXTES.fr.jauges, FR);
  assert.deepEqual(Jeu.TEXTES.en.jauges, EN);
});

test('accueil : la FAQ du score décrit les trois critères renommés', () => {
  const h = lire('index.html');
  assert.match(h, /\['score', 'Comment est calculé le score sur 15 \?', '[^']*durabilité[^']*intérêt business[^']*pertinence[^']*'\]/);
  assert.match(h, /\['score', 'How is the score out of 15 worked out\?', '[^']*durability[^']*business interest[^']*relevance[^']*'\]/);
});

test('aucun ancien libellé de critère dans les fichiers servis', () => {
  const anciens = [/Propension/, /\bsa propension\b/, /Lien offre/, /lien avec ton offre/, /Dur[ée]e de vie/i,
    /Shelf life/, /Shareability/, /Offer fit/, /how long the topic stays relevant/, /likely it is to be shared/, /fits your offer/,
    /Ton client est-il prêt à payer/, /mène-t-il à une offre payante/, /Is your client ready to pay/, /lead to a paid offer/];
  assert.ok(SERVIS.length > 20, SERVIS.join(', '));
  for (const f of SERVIS) {
    const t = lire(f);
    for (const re of anciens) assert.doesNotMatch(t, re, f + ' contient ' + re);
  }
});

test('noms de champs de données inchangés (contrat WF3)', () => {
  const api = lire('api.js');
  assert.match(api, /note\(a\.durabilite\) && note\(a\.propension\) && note\(a\.lienOffre\)/);
  assert.match(lire('bento.js'), /var CRITERES = \['durabilite', 'propension', 'lienOffre'\];/);
  assert.match(lire('jeu.js'), /var CRITERES = \['durabilite', 'propension', 'lienOffre'\];/);
});

test('branchement-back : note pour le prompt de notation de lienOffre', () => {
  const d = lire('docs/branchement-back.md');
  assert.match(d, /lienOffre[^\n]*pertinence par rapport au métier et aux thématiques de l’utilisateur/);
  assert.match(d, /prompt de notation/);
  assert.match(d, /n8n/);
});

test('fournee.html : puce de thème (axe) dans la rangée d’étiquettes, après la source', () => {
  const h = lire('fournee.html');
  assert.match(h, /<span class="etiquette-source">\{\{s\.source\}\}<\/span>\r?\n<span class="etiquette-theme" data-teinte="{{s.teinte}}" title="\{\{s\.theme\}\}"><span class="pq-sr">\{\{s\.themeSr\}\}<\/span>\{\{s\.theme\}\}<\/span>/);
  assert.match(h, /s\.theme = Jeu\.theme\(c\.axe, thematiques\);/);
  assert.match(h, /var thematiques = thematiquesCourantes\(\);/);
  assert.match(h, /function thematiquesCourantes\(\) \{ try \{ var u = Auth\.utilisateurCourant\(\); return u && u\.profil \? u\.profil\.thematiques : \[\]; \} catch \(e\) \{ return \[\]; \} \}/);
  assert.match(h, /Jeu\.annonce\(a, k, self\.affichees\(\)\.length, lang, thematiquesCourantes\(\)\)/);
  assert.match(h, /theme: '', teinte: 'gris', themeSr: ''/, 'valeurs vides tant que la case est vide');
  assert.match(h, /themeSr: 'Thème : '/);
  assert.match(h, /themeSr: 'Topic: '/);
});

// Même forme que les autres puces, couleur de la thématique (lot 37) lisible AA dans les quatre thèmes.
const css = lire('charte.css');
function bloc(sel) { const i = css.indexOf(sel + '{'); return css.slice(i, css.indexOf('}', i)); }
const vars = corps => { const r = {}; corps.replace(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g, (m, n, h) => { r[n] = h; }); return r; };
const BRONZE = vars(bloc(':root,[data-theme="bronze"]'));
const THEMES = {
  bronze: BRONZE,
  classique: Object.assign({}, BRONZE, vars(bloc('[data-theme="classique"]'))),
  nuit: Object.assign({}, BRONZE, vars(bloc('[data-theme="nuit"]'))),
  contraste: Object.assign({}, BRONZE, vars(bloc('[data-theme="contraste"]')))
};

// Lot 37 : la couleur neutre est remplacée par la teinte de la thématique (contrastes dans tests/themes.test.js).
test('charte.css : .etiquette-theme a la forme des puces, couleur de sa thématique, texte tronqué', () => {
  const r = /\n\.etiquette-theme\{([^}]*)\}/.exec(css);
  assert.ok(r, 'règle .etiquette-theme absente');
  for (const p of ['font-size:12px', 'font-weight:700', 'line-height:1.5', 'padding:3px 10px', 'border-radius:999px',
    'white-space:nowrap', 'text-overflow:ellipsis', 'background:var(--t-fond)', 'color:var(--t-texte)', 'box-shadow:inset 0 0 0 1px var(--t-bord)', 'max-width:']) assert.ok(r[1].includes(p), p);
  assert.match(css, /\.etiquette-theme:empty\{display:none\}|\.etiquette-theme:not\(:has\(/);
  // Grand écran : la puce rétrécit sur la ligne au lieu de passer dessous (sinon toute la rangée de la grille
  // grandit et la fournée ne tient plus à 1280x800). Mobile : elle passe à la ligne entière.
  for (const p of ['flex:1 1 0', 'min-width:4.5em', 'max-width:max-content']) assert.ok(r[1].includes(p), p);
  assert.match(css, /@media \(max-width:640px\)\{\.etiquette-theme\{flex:0 1 auto;max-width:100%\}\}/);
  // Tuile n°1 dorée : les variables --th-* ne sont pas redéfinies par la tuile, la puce garde fond et
  // texte de sa teinte (plus de fond --creme forcé).
  const h = lire('fournee.html');
  assert.doesNotMatch(h, /\.tile\[data-tile="n1"\] \.etiquette-theme\{background/);
});

test('Pétrir : repos blanc sur orange foncé, survol noir sur orange vif, contrastes AA', () => {
  for (const nom of ['bronze', 'classique', 'nuit']) {
    const v = THEMES[nom];
    const repos = C.contraste(v['petrir-btn-texte'], v['petrir-btn-fond']);
    const survol = C.contraste(v['petrir-btn-survol-texte'], v['petrir-btn-survol']);
    assert.ok(repos >= 4.5, nom + ' repos = ' + repos.toFixed(2));
    assert.ok(survol >= 7, nom + ' survol = ' + survol.toFixed(2));
    assert.equal(v['petrir-btn-texte'], '#FFFFFF', nom);
    assert.ok(C.luminance(v['petrir-btn-survol-texte']) < 0.01, nom + ' texte de survol noir');
    assert.equal(v['petrir-pain'], v['petrir-btn-texte'], nom + ' pain blanc au repos');
    assert.equal(v['petrir-pain-survol'], v['petrir-btn-survol-texte'], nom + ' pain noir au survol');
    assert.equal(v['petrir-grigne'], v['petrir-btn-fond'], nom + ' grigne couleur du fond');
    assert.equal(v['petrir-grigne-survol'], v['petrir-btn-survol'], nom + ' grigne couleur du survol');
  }
  assert.equal(BRONZE['petrir-btn-fond'], '#C2560B');
  assert.equal(BRONZE['petrir-btn-survol'], '#F27016');
  // Contraste élevé garde ses valeurs.
  const c = vars(bloc('[data-theme="contraste"]'));
  assert.equal(c['petrir-btn-fond'], '#EEBE7C');
  assert.equal(c['petrir-btn-survol'], '#FBE7C0');
});

// Correction du lot 35 : l'axe WF3 (« Axe N ») est traduit en thématique du profil, jamais montré tel quel.
const Jeu = require('../jeu.js');
const TH = ['Automatisation et agents', 'IA en entreprise', 'LLMs'];

test('Jeu.theme : « Axe N » devient la N-ième thématique du profil, un nom de thème passe tel quel', () => {
  assert.equal(Jeu.theme('Axe 1', TH), 'Automatisation et agents');
  assert.equal(Jeu.theme('Axe 2', TH), 'IA en entreprise');
  assert.equal(Jeu.theme(' axe 3 ', TH), 'LLMs');
  assert.equal(Jeu.theme('AXE  2', TH), 'IA en entreprise');
  assert.equal(Jeu.theme('Axe 4', TH), '', 'hors liste : pas de puce');
  assert.equal(Jeu.theme('Axe 0', TH), '');
  assert.equal(Jeu.theme('Axe 1', []), '', 'profil sans thématique');
  assert.equal(Jeu.theme('Axe 1', null), '', 'pas de profil');
  assert.equal(Jeu.theme('Axe 1'), '');
  assert.equal(Jeu.theme('Cybersécurité', TH), 'Cybersécurité', 'déjà un nom de thème');
  assert.equal(Jeu.theme('  LLMs ', null), 'LLMs');
  assert.equal(Jeu.theme('', TH), '');
  assert.equal(Jeu.theme(null, TH), '');
  assert.equal(Jeu.theme(42, TH), '');
});

const artJ = (ref, axe) => ({ ref, rang: 1, titre: 'Titre ' + ref, source: 'Src', feu: 'vert', axe, durabilite: 4, propension: 4, lienOffre: 3 });

test('annonce : thématique du profil, et rien plutôt que « Axe N »', () => {
  assert.equal(Jeu.annonce(artJ('a', 'Axe 2'), 1, 5, 'fr', TH), 'Carte 1 sur 5 : Dorée. Titre a. Tout chaud, Src, IA en entreprise. Monétisation 11/15.');
  assert.equal(Jeu.annonce(artJ('a', 'Axe 2'), 1, 5, 'fr'), 'Carte 1 sur 5 : Dorée. Titre a. Tout chaud, Src. Monétisation 11/15.');
  assert.equal(Jeu.annonce(artJ('a', 'Axe 1'), 1, 5, 'en', TH), 'Card 1 of 5: Golden. Titre a. Piping hot, Src, Automatisation et agents. Monetisation 11/15.');
});

function memoire() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; }

test('collection et historique : familles nommées par la thématique du profil', () => {
  const s = memoire();
  const J = new Date(2026, 10, 24, 9);
  Jeu.decouvrir(s, 'x', [artJ('a', 'Axe 1'), artJ('b', 'Axe 3'), artJ('c', 'Axe 1'), artJ('d', 'Axe 9'), artJ('e', 'Vidéo')], J);
  const compte = Jeu.lireCompte(s, 'x', J);
  const col = Jeu.collection(compte, 'fr', TH);
  assert.deepEqual(col.familles.map(f => [f.famille, f.cartes.length]), [['Automatisation et agents', 2], ['Autres', 1], ['LLMs', 1], ['Vidéo', 1]]);
  assert.deepEqual(Jeu.collection(compte, 'fr').familles.map(f => f.famille), ['Autres', 'Vidéo'], 'sans profil, « Axe N » va dans Autres');
  const h = Jeu.historique(compte, {}, TH);
  assert.deepEqual(h.familles, ['Automatisation et agents', 'LLMs', 'Vidéo']);
  assert.deepEqual(Jeu.historique(compte, { famille: 'Automatisation et agents' }, TH).cartes.map(c => c.ref).sort(), ['a', 'c']);
  const carteD = h.cartes.filter(c => c.ref === 'd')[0];
  assert.equal(carteD.famille, '', 'Axe 9 hors liste : pas de famille');
  assert.equal(h.cartes.filter(c => c.ref === 'b')[0].famille, 'LLMs');
  for (const f of h.familles) assert.doesNotMatch(f, /^Axe \d/);
});

test('garde-manger : collection et historique passent les thématiques du profil, carte nommée par sa famille', () => {
  const h = lire('garde-manger.html');
  assert.match(h, /Jeu\.collection\(compte, lang, thematiques\)/);
  assert.match(h, /Jeu\.historique\(compte, \{ rarete: st\.colRarete, famille: st\.colFamille \}, thematiques\)/);
  assert.match(h, /Jeu\.historique\(compte, \{ rarete: colRarete, famille: colFamille \}, thematiques\)/);
  assert.match(h, /famille: c\.famille \|\| j\.collection\.autres/);
  assert.doesNotMatch(h, /c\.axe/);
});

test('branchement-back : convention retenue pour l’axe (thématique ou « Axe N » traduit par le front)', () => {
  const d = lire('docs/branchement-back.md');
  assert.match(d, /Convention retenue/);
  assert.match(d, /« Axe N »[^\n]*N-ième thématique du profil/);
  assert.match(d, /nom de la thématique/);
});
