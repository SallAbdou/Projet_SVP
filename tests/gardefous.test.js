// Lot 25 : garde-fous automatiques d'accessibilité (WCAG 2.2 AA), sans dépendance.
// Lecture du HTML source de TOUTES les pages (sauf « index copy.html ») et des chaînes HTML des scripts.
// Les gabarits du moteur maison (dc.js) contiennent des valeurs {{...}} : une valeur dynamique n'est jamais
// signalée comme manquante, mais elle doit pouvoir être résolue (ex. un id dynamique a son label for dynamique).
// Toute exception est listée ici avec sa justification.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const PAGES = fs.readdirSync(RACINE).filter(f => f.endsWith('.html') && f !== 'index copy.html').sort();
const SCRIPTS = fs.readdirSync(RACINE).filter(f => f.endsWith('.js')).sort();
const FEUILLES = ['charte.css', 'parcours.css'];
const DYN = /\{\{[^}]*\}\}/;

// Balisage seul : sans commentaires, ni code de <script> ni <style>. Les gabarits de dc.js
// (<script type="text/plain" id="tpl">) sont du balisage : on les garde.
function balisage(h) {
  return h.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<script\b(?![^>]*type="text\/plain")[^>]*>)[\s\S]*?<\/script>/g, '$1</script>')
    .replace(/(<style\b[^>]*>)[\s\S]*?<\/style>/g, '$1</style>');
}
const PAGE = {};
for (const p of PAGES) { const brut = lire(p); PAGE[p] = { brut, html: balisage(brut) }; }
const balises = (h, nom) => h.match(new RegExp('<' + nom + '\\b[^>]*>', 'g')) || [];
const attr = (tag, nom) => { const m = new RegExp('\\s' + nom + '="([^"]*)"', 'i').exec(tag); return m ? m[1] : null; };

// Chaînes HTML écrites dans les scripts (nav.js, parcours.js…) : mêmes règles que les pages.
const JS = {};
for (const f of SCRIPTS) JS[f] = lire(f);

test('lot 25 : toutes les pages sont couvertes', () => {
  assert.ok(PAGES.length >= 16, PAGES.join(', '));
  assert.ok(!PAGES.includes('index copy.html'));
});

test('<html lang> présent et non vide', () => {
  for (const p of PAGES) {
    const tag = balises(PAGE[p].html, 'html')[0];
    assert.ok(tag, p);
    assert.match(attr(tag, 'lang') || '', /^(fr|en)$/, p);
  }
});

test('<title> présent et non vide', () => {
  for (const p of PAGES) {
    const m = /<title>([^<]*)<\/title>/.exec(PAGE[p].brut);
    assert.ok(m && m[1].trim(), p);
  }
});

test('meta viewport : largeur de l’appareil, zoom jamais bloqué (user-scalable, maximum-scale >= 2)', () => {
  for (const p of PAGES) {
    const tag = balises(PAGE[p].html, 'meta').find(t => attr(t, 'name') === 'viewport');
    assert.ok(tag, p + ' : meta viewport absente');
    const c = (attr(tag, 'content') || '').toLowerCase();
    assert.match(c, /width=device-width/, p);
    assert.doesNotMatch(c, /user-scalable\s*=\s*(no|0)/, p);
    const max = /maximum-scale\s*=\s*([\d.]+)/.exec(c);
    if (max) assert.ok(parseFloat(max[1]) >= 2, p + ' : maximum-scale ' + max[1]);
  }
});

test('lien d’évitement : premier lien de la page, avant le contenu, cible existante', () => {
  for (const p of PAGES) {
    const h = PAGE[p].html;
    const corps = h.slice(h.indexOf('<body'));
    const premier = /<(a|button|input|select|textarea)\b[^>]*>/.exec(corps);
    assert.ok(premier && premier[1] === 'a', p + ' : le premier focusable doit être le lien d’évitement');
    const cible = (attr(premier[0], 'href') || '').replace(/^#/, '');
    assert.ok(cible && !DYN.test(cible), p);
    const i = corps.indexOf('id="' + cible + '"');
    assert.ok(i > premier.index, p + ' : cible #' + cible + ' absente ou placée avant le lien');
  }
});

// Gabarits à plusieurs états : un h1 par état, un seul visible à la fois (section masquée par style="{{vue.x}}").
const H1_ETATS = {
  'questionnaire.html': 'six étapes, une seule affichée à la fois',
  'creer-mot-de-passe.html': 'lien périmé ou formulaire, jamais les deux'
};
test('un seul h1 par gabarit (états exclusifs documentés)', () => {
  for (const p of PAGES) {
    const h = PAGE[p].html;
    const h1 = [];
    h.replace(/<h1\b/g, (m, i) => { h1.push(i); return m; });
    if (!H1_ETATS[p]) { assert.equal(h1.length, 1, p); continue; }
    assert.ok(h1.length > 1, p + ' : exception devenue inutile, la retirer');
    const vues = h1.map(i => {
      const sec = h.lastIndexOf('<section', i);
      const tag = /<section\b[^>]*>/.exec(h.slice(sec))[0];
      const vue = /style="\{\{(vue\.\w+)\}\}"/.exec(tag);
      assert.ok(sec !== -1 && vue, p + ' : h1 hors d’une section d’état');
      return vue[1];
    });
    assert.equal(new Set(vues).size, vues.length, p + ' : deux h1 dans le même état');
  }
});

test('pas d’id en double dans le source statique', () => {
  for (const p of PAGES) {
    const vus = {};
    for (const m of PAGE[p].html.match(/\sid="[^"]*"/g) || []) {
      const id = m.slice(5, -1);
      if (DYN.test(id)) continue;
      assert.ok(!vus[id], p + ' : id en double « ' + id + ' »');
      vus[id] = true;
    }
  }
});

test('toutes les <img> ont un attribut alt', () => {
  for (const [nom, h] of Object.entries(Object.assign({}, ...PAGES.map(p => ({ [p]: PAGE[p].html })), JS))) {
    for (const t of balises(h, 'img')) assert.match(t, /\salt=/, nom + ' : ' + t);
  }
});

function verifierSvg(nom, t) {
  if (/aria-hidden="true"/.test(t)) return;
  assert.match(t, /role="img"/, nom + ' : svg ni décoratif ni nommé : ' + t.slice(0, 120));
  assert.match(t, /aria-label(ledby)?="[^"]+"/, nom + ' : svg role="img" sans nom : ' + t.slice(0, 120));
}
test('svg : décoratif (aria-hidden="true") ou image nommée (role="img" et aria-label)', () => {
  for (const p of PAGES) for (const t of balises(PAGE[p].html, 'svg')) verifierSvg(p, t);
  for (const [f, src] of Object.entries(JS)) {
    for (const t of src.match(/<svg\b[^>]*>/g) || []) verifierSvg(f, t.replace(/'\s*\+[^+]*\+\s*'/g, ''));
  }
});

test('champs de saisie : label associé, label englobant ou aria-label', () => {
  for (const p of PAGES) {
    const h = PAGE[p].html;
    const re = /<(input|select|textarea)\b[^>]*>/g;
    let m;
    while ((m = re.exec(h))) {
      const t = m[0];
      if (/type="(hidden|submit|button|reset|image)"/.test(t)) continue;
      if (/\saria-label(ledby)?="[^"]+"/.test(t)) continue;
      const id = attr(t, 'id');
      if (id && h.includes('for="' + id + '"')) continue;
      const avant = h.slice(0, m.index);
      const englobant = avant.lastIndexOf('<label') > avant.lastIndexOf('</label>');
      assert.ok(englobant, p + ' : champ sans étiquette : ' + t.slice(0, 120));
    }
  }
});

test('aucun tabindex positif (statique ou calculé)', () => {
  for (const p of PAGES) {
    for (const m of PAGE[p].html.match(/tabindex="[^"]*"/g) || []) {
      const v = m.slice(10, -1);
      if (DYN.test(v)) continue;
      assert.ok(parseInt(v, 10) <= 0, p + ' : ' + m);
    }
    // Valeurs calculées dans les scripts de la page : 0 ou -1 seulement.
    for (const m of PAGE[p].brut.match(/tabindex\s*:[^,}\n]*/g) || []) assert.doesNotMatch(m, /'[1-9]|"[1-9]|:\s*[1-9]/, p + ' : ' + m);
  }
  for (const [f, src] of Object.entries(JS)) assert.doesNotMatch(src, /tabindex="[1-9]|\.tabIndex\s*=\s*[1-9]/, f);
});

test('boutons : attribut type explicite', () => {
  for (const p of PAGES) for (const t of balises(PAGE[p].html, 'button')) assert.match(t, /\stype="(button|submit|reset)"/, p + ' : ' + t.slice(0, 100));
  for (const [f, src] of Object.entries(JS)) {
    for (const t of src.match(/<button\b[^>]*>/g) || []) assert.match(t, /\stype="(button|submit|reset)"/, f + ' : ' + t.slice(0, 100));
  }
});

test('liens target="_blank" : rel noopener et « nouvel onglet » / « new tab » annoncé', () => {
  for (const p of PAGES) {
    for (const t of balises(PAGE[p].html, 'a').filter(t => /target="_blank"/.test(t))) {
      assert.match(t, /rel="[^"]*noopener/, p + ' : ' + t.slice(0, 120));
      const nom = attr(t, 'aria-label');
      assert.ok(nom, p + ' : lien nouvel onglet sans aria-label : ' + t.slice(0, 120));
      if (DYN.test(nom)) {
        // Libellé calculé : les deux langues de la page doivent prévenir de l'ouverture.
        assert.match(PAGE[p].brut, /nouvel onglet/, p);
        assert.match(PAGE[p].brut, /new tab/, p);
      } else assert.match(nom, /nouvel onglet|new tab/, p + ' : ' + nom);
    }
  }
  for (const [f, src] of Object.entries(JS)) assert.doesNotMatch(src, /target="_blank"/, f + ' : lien nouvel onglet généré par script, à couvrir');
});

// Règles CSS (feuilles, <style> des pages, styles en ligne des scripts exclus : pas d'outline dedans).
function regles(css) {
  const out = [];
  const propre = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(propre))) out.push({ sel: m[1].trim(), corps: m[2] });
  return out;
}
const CSS = {};
for (const f of FEUILLES) CSS[f] = lire(f);
for (const p of PAGES) CSS[p] = (PAGE[p].brut.match(/<style\b[^>]*>[\s\S]*?<\/style>/g) || []).map(s => s.replace(/<\/?style\b[^>]*>/g, '')).join('\n');
const TOUTES = Object.values(CSS).flatMap(regles);

// #contenu est le <main tabindex="-1"> cible du lien d'évitement : il reçoit le focus par script, jamais par Tab ;
// ce n'est pas un composant d'interface (WCAG 2.4.7 ne s'y applique pas) et un cadre autour de toute la page gênerait.
const OUTLINE_EXCEPTIONS = { '#contenu:focus': 'cible du lien d’évitement, non atteignable au clavier' };
test('outline:none ou outline:0 seulement avec un remplacement :focus-visible', () => {
  assert.ok(JS['nav.js'] !== undefined);
  for (const [src, css] of Object.entries(CSS)) {
    for (const r of regles(css).filter(r => /(^|;)\s*outline\s*:\s*(none|0)\s*(;|!|$)/.test(r.corps))) {
      for (const sel of r.sel.split(',').map(s => s.trim())) {
        if (OUTLINE_EXCEPTIONS[sel]) continue;
        const base = sel.replace(/:focus(-visible|-within)?(:not\([^)]*\))?/g, '');
        const ok = TOUTES.some(x => x.sel.split(',').some(s => s.trim() === base + ':focus-visible') && /outline\s*:\s*(?!none|0)|box-shadow/.test(x.corps));
        assert.ok(ok, src + ' : ' + sel + ' retire le contour sans :focus-visible de remplacement');
      }
    }
  }
  for (const [f, src] of Object.entries(JS)) assert.doesNotMatch(src, /outline\s*:\s*(none|0)/, f);
});

test('animations infinies : coupées par data-animations="off" et sous prefers-reduced-motion', () => {
  const charte = CSS['charte.css'];
  assert.match(charte, /html\[data-animations="off"\] \*,html\[data-animations="off"\] \*::before,html\[data-animations="off"\] \*::after\{animation:none!important\}/);
  const reduits = {};
  for (const [src, css] of Object.entries(CSS)) {
    const blocs = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/@media \(prefers-reduced-motion:\s*reduce\)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g) || [];
    reduits[src] = blocs.flatMap(b => regles(b.replace(/^@media[^{]*\{/, '').replace(/\}$/, '')));
  }
  let vues = 0;
  for (const [src, css] of Object.entries(CSS)) {
    for (const r of regles(css).filter(r => /animation\s*:[^;]*\binfinite\b|animation-iteration-count\s*:\s*infinite/.test(r.corps))) {
      for (const sel of r.sel.split(',').map(s => s.trim()).filter(s => !s.startsWith('@'))) {
        vues++;
        const classe = (/\.([\w-]+)/.exec(sel) || [])[1];
        // Dessin servi par <use> (four du comptoir) : html[data-animations] n'atteint pas l'arbre fantôme,
        // le gabarit bascule vers un jumeau figé de même taille (tests/animations.test.js).
        if (classe && new RegExp('<symbol\\b[\\s\\S]*?class="' + classe + '"[\\s\\S]*?</symbol>').test(PAGE[src] ? PAGE[src].brut : '')) {
          assert.match(css, /html\[data-animations="off"\] \.four-svg-anime\{display:none\}/, src + ' : ' + sel);
          assert.match(css, /html:not\(\[data-animations="on"\]\) \.four-svg-anime\{display:none\}/, src + ' : ' + sel);
          continue;
        }
        // Sinon : la feuille qui l'anime le coupe aussi sous prefers-reduced-motion (le choix « on » du profil passe outre).
        const coupe = (reduits[src] || []).some(x => /animation\s*:\s*none/.test(x.corps) && x.sel.split(',').some(s => s.trim() === 'html:not([data-animations="on"]) ' + sel));
        assert.ok(coupe, src + ' : animation infinie « ' + sel + ' » non coupée sous prefers-reduced-motion');
        // Et la page qui l'anime charge la charte (règle data-animations="off").
        if (PAGE[src]) assert.match(PAGE[src].brut, /<link rel="stylesheet" href="\/charte\.css">/, src);
      }
    }
  }
  assert.ok(vues >= 6, 'détection des animations infinies cassée : ' + vues);
});
