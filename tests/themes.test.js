const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../charte.js');
const Q = require('../questionnaire.js');
const P = require('../profil.js');

// Lot 37 : couleurs des thématiques reprises des étiquettes du questionnaire Tally, et bouton
// « Aller au fournil » sous le graphique du comptoir.
const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const css = lire('charte.css');

const TEINTES = ['rouge', 'orange', 'jaune', 'vert', 'bleu', 'violet', 'rose', 'gris'];
const ATTENDU = {
  'LLMs': 'rouge', 'Vidéo': 'orange', 'Image': 'jaune', 'Automatisation et agents': 'vert', 'Cybersécurité': 'bleu',
  'Actualité des grandes firmes': 'violet', 'Monétisation': 'rose', 'Finance et spéculation': 'gris',
  'Hardware': 'rouge', 'IA en entreprise': 'orange', 'Ecosystèmes': 'jaune', 'Ingénierie R&D': 'vert'
};

function lireVars(corps) {
  const r = {};
  corps.replace(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})\b/g, (m, nom, hex) => { r[nom] = hex; });
  return r;
}
const BLOCS = {};
css.replace(/([^{}]+)\{([^{}]*)\}/g, (m, sel, corps) => {
  const s = sel.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (s === ':root,[data-theme="bronze"]') BLOCS.bronze = lireVars(corps);
  const t = /^\[data-theme="(\w+)"\]$/.exec(s);
  if (t) BLOCS[t[1]] = lireVars(corps);
  return m;
});
const THEMES = {};
for (const nom of ['bronze', 'classique', 'nuit', 'contraste']) THEMES[nom] = Object.assign({}, BLOCS.bronze, BLOCS[nom] || {});

test('les 12 thématiques du questionnaire vont vers les 8 teintes du Tally, dans l’ordre du cycle', () => {
  assert.deepEqual(Object.keys(ATTENDU), Q.CHOIX.thematiques);
  for (const [nom, teinte] of Object.entries(ATTENDU)) assert.equal(C.teinteTheme(nom), teinte, nom);
  assert.deepEqual(C.TEINTES_THEMES, TEINTES);
  Q.CHOIX.thematiques.forEach((nom, i) => assert.equal(C.teinteTheme(nom), TEINTES[i % 8], nom));
});

test('libellés anglais, accents, casse et espaces donnent la même teinte', () => {
  for (const nom of Q.CHOIX.thematiques) assert.equal(C.teinteTheme(Q.libelle(nom, 'en')), ATTENDU[nom], 'EN ' + nom);
  assert.equal(C.teinteTheme('Écosystèmes'), 'jaune');
  assert.equal(C.teinteTheme('  ecosystemes '), 'jaune');
  assert.equal(C.teinteTheme('llms'), 'rouge');
  assert.equal(C.teinteTheme('AUTOMATISATION  ET AGENTS'), 'vert');
  assert.equal(C.teinteTheme('cybersecurite'), 'bleu');
  assert.equal(C.teinteTheme('Ingenierie r&d'), 'vert');
});

test('thématique inconnue ou absente : gris', () => {
  for (const x of ['Cuisine', '', '   ', null, undefined, 42, 'Axe 3']) assert.equal(C.teinteTheme(x), 'gris', String(x));
});

test('charte.css : une paire fond / texte / bord par teinte dans les 4 thèmes', () => {
  for (const [nom, v] of Object.entries(THEMES)) {
    for (const t of TEINTES) for (const k of ['fond', 'texte', 'bord']) assert.ok(v[`th-${t}-${k}`], `${nom} : --th-${t}-${k} absente`);
  }
  for (const nom of ['nuit', 'contraste']) for (const t of TEINTES) assert.ok(BLOCS[nom][`th-${t}-fond`], `${nom} redéfinit ${t}`);
});

test('texte d’une thématique sur son fond : au moins 4,5:1 dans les 4 thèmes', () => {
  for (const [nom, v] of Object.entries(THEMES)) {
    for (const t of TEINTES) {
      const c = C.contraste(v[`th-${t}-texte`], v[`th-${t}-fond`]);
      assert.ok(c >= 4.5, `${nom} ${t} : ${c.toFixed(2)}`);
    }
  }
});

test('teintes reconnaissables : fond pastel en clair, sombre en Nuit, noir et blanc bordé en Contraste élevé', () => {
  const lum = C.luminance;
  for (const t of TEINTES) {
    assert.ok(lum(THEMES.bronze[`th-${t}-fond`]) > 0.6, 'bronze ' + t);
    assert.ok(lum(THEMES.nuit[`th-${t}-fond`]) < 0.05, 'nuit fond ' + t);
    assert.ok(lum(THEMES.nuit[`th-${t}-texte`]) > 0.45, 'nuit texte ' + t);
    assert.equal(THEMES.contraste[`th-${t}-fond`], '#FFFFFF');
    assert.equal(THEMES.contraste[`th-${t}-texte`], '#000000');
    assert.equal(THEMES.contraste[`th-${t}-bord`], '#000000');
  }
  // Huit fonds clairs tous différents.
  assert.equal(new Set(TEINTES.map(t => THEMES.bronze[`th-${t}-fond`])).size, 8);
});

test('charte.css : puces de thème par variables, gris par défaut, une règle par teinte', () => {
  assert.match(css, /\.puce-theme,\.etiquette-theme\{--t-fond:var\(--th-gris-fond\);--t-texte:var\(--th-gris-texte\);--t-bord:var\(--th-gris-bord\)\}/);
  for (const t of TEINTES) {
    assert.ok(css.includes(`[data-teinte="${t}"]{--t-fond:var(--th-${t}-fond);--t-texte:var(--th-${t}-texte);--t-bord:var(--th-${t}-bord)}`), t);
  }
  for (const sel of ['etiquette-theme', 'puce-theme']) {
    const r = new RegExp('\\n\\.' + sel + '\\{([^}]*)\\}').exec(css);
    assert.ok(r, sel);
    for (const p of ['background:var(--t-fond)', 'color:var(--t-texte)', 'box-shadow:inset 0 0 0 1px var(--t-bord)']) assert.ok(r[1].includes(p), sel + ' ' + p);
  }
  // Les règles par teinte viennent après la valeur grise par défaut (même spécificité).
  assert.ok(css.indexOf('[data-teinte="rouge"]') > css.indexOf('.puce-theme,.etiquette-theme{'));
});

test('fournée : la puce de thème porte la teinte de sa thématique, le nom reste écrit', () => {
  const h = lire('fournee.html');
  assert.match(h, /<span class="etiquette-theme" data-teinte="\{\{s\.teinte\}\}" title="\{\{s\.theme\}\}"><span class="pq-sr">\{\{s\.themeSr\}\}<\/span>\{\{s\.theme\}\}<\/span>/);
  assert.match(h, /s\.teinte = Charte\.teinteTheme\(s\.theme\)/);
  assert.doesNotMatch(h, /\.tile\[data-tile="n1"\] \.etiquette-theme\{background/);
});

test('garde-manger : familles de la collection et cartes en puces colorées', () => {
  const h = lire('garde-manger.html');
  assert.match(h, /<li><span class="puce-theme" data-teinte="\{\{f\.teinte\}\}">\{\{f\.famille\}\}<\/span>/);
  assert.match(h, /<span class="jeu-famille puce-theme" data-teinte="\{\{x\.teinte\}\}">\{\{x\.famille\}\}<\/span>/);
  assert.match(h, /teinte: Charte\.teinteTheme\(fam\.famille\)/);
  assert.match(h, /teinte: Charte\.teinteTheme\(c\.famille\)/);
});

test('Profil.puces : thématiques du profil traduites, avec leur teinte', () => {
  const u = { profil: { thematiques: ['Automatisation et agents', 'IA en entreprise', 'LLMs', 'Inconnue'] } };
  assert.deepEqual(P.puces(u, 'fr', Q.libelle), [
    { label: 'Automatisation et agents', teinte: 'vert' }, { label: 'IA en entreprise', teinte: 'orange' },
    { label: 'LLMs', teinte: 'rouge' }, { label: 'Inconnue', teinte: 'gris' }
  ].map(x => Object.assign(x, {})));
  assert.deepEqual(P.puces(u, 'en', Q.libelle).map(x => x.label).slice(0, 2), ['Automation and agents', 'AI at work']);
  assert.deepEqual(P.puces(null, 'fr', Q.libelle), []);
});

test('profil.html : la ligne Thématiques affiche des puces colorées', () => {
  const h = lire('profil.html');
  assert.match(h, /<sc-for list="\{\{puces\}\}" as="p"[^>]*><li class="puce-theme" data-teinte="\{\{p\.teinte\}\}">\{\{p\.label\}\}<\/li><\/sc-for>/);
  assert.match(h, /Profil\.puces\(u, lang, Questionnaire\.libelle\)/);
  // « themes » désigne déjà la liste des thèmes d'apparence : la ligne a sa propre clé.
  assert.match(h, /<dt>\{\{ligneThemes\.label\}\}<\/dt>/);
  assert.match(h, /ligneThemes: l\.prefs\[1\]/);
});

test('ta fournée type : puces des thématiques colorées', () => {
  const h = lire('ta-fournee-type.html');
  assert.match(h, /<span class="puce-theme" data-teinte="\{\{th\.teinte\}\}"/);
  assert.match(h, /teinte: Charte\.teinteTheme\(x\)/);
  assert.match(h, /<script src="\/charte\.js"><\/script>/);
});

test('comptoir : bouton « Aller au fournil » juste sous la phrase d’analyse du graphique', () => {
  const h = lire('comptoir.html');
  const ins = h.indexOf('{{ins.avant}}');
  const btn = h.indexOf('<a href="/fournil" class="btn-action" data-focus="aller-fournil">{{t.allerFournil}}</a>');
  assert.ok(ins > 0 && btn > ins, 'bouton après la phrase d’analyse');
  assert.ok(h.indexOf('</section>', ins) > btn, 'bouton dans le bloc Tes meilleures fournées');
  assert.match(h, /allerFournil: 'Aller au fournil'/);
  assert.match(h, /allerFournil: 'Go to the kitchen'/);
  const r = /\.btn-action\{([^}]*)\}/.exec(h);
  assert.ok(r);
  for (const p of ['min-height:44px', 'background:var(--braise)', 'color:var(--sur-plein)']) assert.ok(r[1].includes(p), p);
  assert.match(h, /\.btn-action:hover\{background:var\(--braise-fonce\)/);
  assert.match(h, /a:focus-visible\{outline:3px solid/);
});
