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
  assert.match(h, /<span class="etiquette-source">\{\{s\.source\}\}<\/span>\r?\n<span class="etiquette-theme"><span class="pq-sr">\{\{s\.themeSr\}\}<\/span>\{\{s\.theme\}\}<\/span>/);
  assert.match(h, /s\.theme = c\.axe \|\| '';/);
  assert.match(h, /theme: '', themeSr: ''/, 'valeurs vides tant que la case est vide');
  assert.match(h, /themeSr: 'Thème : '/);
  assert.match(h, /themeSr: 'Topic: '/);
});

// Même forme que les autres puces, couleur neutre lisible AA dans les quatre thèmes et sur le n°1 doré.
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

test('charte.css : .etiquette-theme a la forme des puces, couleur neutre, texte tronqué', () => {
  const r = /\.etiquette-theme\{([^}]*)\}/.exec(css);
  assert.ok(r, 'règle .etiquette-theme absente');
  for (const p of ['font-size:12px', 'font-weight:700', 'line-height:1.5', 'padding:3px 10px', 'border-radius:999px',
    'white-space:nowrap', 'text-overflow:ellipsis', 'background:var(--sable)', 'color:var(--texte-2)', 'box-shadow:inset 0 0 0 1px var(--bord-fort)', 'max-width:']) assert.ok(r[1].includes(p), p);
  assert.match(css, /\.etiquette-theme:empty\{display:none\}|\.etiquette-theme:not\(:has\(/);
  for (const [nom, v] of Object.entries(THEMES)) {
    const c = C.contraste(v['texte-2'], v.sable);
    assert.ok(c >= 4.5, nom + ' : texte-2 sur sable = ' + c.toFixed(2));
  }
  // Tuile n°1 dorée : --texte-2 y devient or-texte-2 mais --sable reste celle du thème (sombre en Nuit),
  // d'où un fond --creme (redéfini en or-surface) sur cette tuile.
  const h = lire('fournee.html');
  assert.match(h, /\.tile\[data-tile="n1"\] \.etiquette-theme\{background:var\(--creme\)\}/);
  for (const [nom, v] of Object.entries(THEMES)) {
    const c = C.contraste(v['or-texte-2'], v['or-surface']);
    assert.ok(c >= 4.5, nom + ' : puce de thème sur le n°1 = ' + c.toFixed(2));
  }
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
