# Page News bento : plan d'implémentation

> **Pour les agents :** sous-skill requis : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans, tâche par tâche. Les étapes sont des cases `- [ ]`.

**Objectif :** transformer `/fournee` en grille bento de 7 tuiles que l'utilisatrice peut masquer, réordonner (boutons et glisser-déposer) et redimensionner (S/M/L), avec des données lues depuis un JSON prêt pour n8n.

**Architecture :** la logique de disposition et de données est pure, sans DOM, dans `bento.js`, testée avec le runner intégré de Node. Le DOM (application de la disposition, glisser-déposer) vit dans `bento-ui.js`. `fournee.html` garde le moteur maison : le template rend les 7 tuiles dans un ordre fixe, puis un nouveau crochet `afterRender` de `boot.js` les replace dans l'ordre et la taille de la disposition.

**Stack :** HTML/CSS/JS sans build, moteur `dc.js` + `boot.js`, `node --test` (Node 24, aucune dépendance npm).

**Spec :** `docs/superpowers/specs/2026-11-16-news-bento-design.md`

## Contraintes globales

- Aucune dépendance ni étape de build pour le site. Les tests utilisent `node:test` et `node:assert` seulement.
- Aucun tiret long dans le code, les textes et les commits.
- Bilingue FR/EN : libellés d'interface dans le dictionnaire `T` de la page, contenus dans le JSON avec des champs `{ fr, en }`.
- Clé `localStorage` : `pq-layout`. Format : `{ "version": 1, "newsCount": 5, "tiles": [ { "id", "size", "visible" } ] }`.
- Identifiants de tuiles, dans l'ordre par défaut : `news`, `top`, `graph`, `stats`, `profile`, `painperdu`, `pantry`.
- Tailles : `S` = 1×1, `M` = 2×1, `L` = 2×2 sur une grille de 4 colonnes. Sous 640 px : 1 colonne, tailles ignorées.
- Nombres de sujets autorisés : 1, 3, 5, 7. Défaut : 5.
- Le badge « Données d'exemple » reste affiché.
- Cibles tactiles d'au moins 44 px, focus visibles, `aria-pressed` sur les boutons bascules, comme le reste du site.
- Commits locaux uniquement, aucun push sans accord de Delio. Chaque message se termine par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

**Écart assumé par rapport à la spec :** tailles par défaut `painperdu` = M et `pantry` = L (au lieu de S et M) pour que la grille par défaut remplisse exactement 4 rangées sans trou : news L, top M, graph M, stats S, profile S, painperdu M, pantry L.

## Points de vigilance (Review Focus)

1. **Disposition enregistrée corrompue ou ancienne** (JSON invalide, id inconnu, tuile absente, taille invalide, doublon) : on retombe sur une disposition valide, jamais une page vide. Testé en tâche 1.
2. **`localStorage` indisponible** (navigation privée, accès qui lève une exception) : la page marche avec la disposition par défaut, la sauvegarde échoue sans casser. Testé en tâche 1.
3. **JSON de données introuvable ou mal formé** : message d'erreur lisible dans la page à la place des tuiles. Le fichier livré est validé en tâche 2, l'échec de chargement est vérifié à la main en tâche 3.
4. **Toutes les tuiles masquées** : en lecture, un message invite à cliquer sur « Personnaliser ». Testé en tâche 1 (`hiddenIds`) et vérifié en tâche 4.
5. **URL de source non http(s)** (contenu venant plus tard de n8n, par exemple `javascript:`) : le lien devient `#`. Testé en tâche 2.

---

### Tâche 1 : logique de disposition

**Fichiers :**
- Créer : `bento.js`
- Créer : `tests/bento-layout.test.js`

**Interfaces :**
- Produit (objet global `Bento` dans le navigateur, `module.exports` sous Node) :
  - `TILE_IDS: string[]`, `SIZES: ['S','M','L']`, `COUNTS: [1,3,5,7]`, `STORAGE_KEY: 'pq-layout'`
  - `defaultLayout(): Layout`
  - `normalizeLayout(raw: unknown): Layout`
  - `moveTile(layout, id, toIndex: number): Layout` (index borné à `[0, n-1]`)
  - `stepTile(layout, id, delta: -1 | 1): Layout`
  - `setSize(layout, id, size): Layout` (taille invalide : disposition inchangée)
  - `setVisible(layout, id, visible: boolean): Layout`
  - `setNewsCount(layout, n): Layout` (valeur hors `COUNTS` : inchangée)
  - `hiddenIds(layout): string[]` (ordre de la disposition)
  - `loadLayout(storage): Layout`, `saveLayout(storage, layout): boolean`
  - Toutes les fonctions renvoient un nouvel objet, sans muter l'entrée.

- [ ] **Étape 1 : écrire les tests qui échouent**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../bento.js');

test('disposition par défaut', () => {
  const l = B.defaultLayout();
  assert.equal(l.version, 1);
  assert.equal(l.newsCount, 5);
  assert.deepEqual(l.tiles.map(t => t.id), ['news','top','graph','stats','profile','painperdu','pantry']);
  assert.deepEqual(l.tiles.map(t => t.size), ['L','M','M','S','S','M','L']);
  assert.ok(l.tiles.every(t => t.visible === true));
});

test('normalizeLayout répare une disposition abîmée', () => {
  const l = B.normalizeLayout({ version: 1, newsCount: 4, tiles: [
    { id: 'pantry', size: 'XL', visible: false },
    { id: 'inconnue', size: 'S', visible: true },
    { id: 'pantry', size: 'S', visible: true },
    { id: 'news', size: 'S', visible: 'oui' }
  ]});
  assert.deepEqual(l.tiles.slice(0, 2), [
    { id: 'pantry', size: 'L', visible: false },
    { id: 'news', size: 'S', visible: true }
  ]);
  assert.deepEqual(l.tiles.slice(2).map(t => t.id), ['top','graph','stats','profile','painperdu']);
  assert.equal(l.newsCount, 5);
});

test('normalizeLayout rejette les entrées non exploitables', () => {
  for (const raw of [null, 'x', 42, { version: 2, tiles: [] }, { version: 1 }]) {
    assert.deepEqual(B.normalizeLayout(raw), B.defaultLayout());
  }
});

test('moveTile et stepTile', () => {
  const l = B.defaultLayout();
  assert.deepEqual(B.moveTile(l, 'pantry', 0).tiles.map(t => t.id).slice(0, 2), ['pantry','news']);
  assert.equal(B.moveTile(l, 'news', 99).tiles.at(-1).id, 'news');
  assert.deepEqual(B.stepTile(l, 'top', -1).tiles.map(t => t.id).slice(0, 2), ['top','news']);
  assert.deepEqual(B.stepTile(l, 'news', -1), l);
  assert.equal(l.tiles[0].id, 'news'); // entrée non mutée
});

test('setSize, setVisible, setNewsCount, hiddenIds', () => {
  const l = B.defaultLayout();
  assert.equal(B.setSize(l, 'stats', 'L').tiles[3].size, 'L');
  assert.deepEqual(B.setSize(l, 'stats', 'XXL'), l);
  const h = B.setVisible(B.setVisible(l, 'graph', false), 'top', false);
  assert.deepEqual(B.hiddenIds(h), ['top','graph']);
  assert.equal(B.setNewsCount(l, 7).newsCount, 7);
  assert.equal(B.setNewsCount(l, 4).newsCount, 5);
});

test('load et save avec un stockage normal', () => {
  const mem = {};
  const storage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
  assert.deepEqual(B.loadLayout(storage), B.defaultLayout());
  const l = B.setNewsCount(B.defaultLayout(), 3);
  assert.equal(B.saveLayout(storage, l), true);
  assert.deepEqual(B.loadLayout(storage), l);
  mem['pq-layout'] = '{pas du json';
  assert.deepEqual(B.loadLayout(storage), B.defaultLayout());
});

test('load et save quand le stockage lève une exception', () => {
  const boom = { getItem() { throw new Error('bloqué'); }, setItem() { throw new Error('bloqué'); } };
  assert.deepEqual(B.loadLayout(boom), B.defaultLayout());
  assert.equal(B.saveLayout(boom, B.defaultLayout()), false);
  assert.deepEqual(B.loadLayout(undefined), B.defaultLayout());
});
```

- [ ] **Étape 2 : lancer, constater l'échec**

Commande : `node --test tests/`
Attendu : FAIL, `Cannot find module '../bento.js'`.

- [ ] **Étape 3 : implémenter `bento.js`**

Enveloppe pour marcher dans le navigateur et sous Node, sans build :

```js
(function (root) {
  var Bento = { /* ... */ };
  if (typeof module === 'object' && module.exports) module.exports = Bento;
  else root.Bento = Bento;
})(this);
```

Règles de `normalizeLayout` : entrée non objet, `version !== 1` ou `tiles` non tableau → `defaultLayout()`. On garde les tuiles dans l'ordre reçu en ignorant les id inconnus et les doublons (première occurrence gagne), taille invalide → taille par défaut de cette tuile, `visible` vaut `true` sauf s'il est exactement `false`. Les tuiles manquantes sont ajoutées à la fin dans l'ordre par défaut, visibles, taille par défaut. `newsCount` hors `COUNTS` → 5. Écrire en ES5 (`var`, `function`) comme le reste du site.

- [ ] **Étape 4 : lancer, constater le succès**

Commande : `node --test tests/`
Attendu : 7 tests, 0 échec.

- [ ] **Étape 5 : commit**

```bash
git add bento.js tests/bento-layout.test.js
git commit -m "feat(news): logique de disposition bento et tests"
```

---

### Tâche 2 : données d'exemple et helpers de contenu

**Fichiers :**
- Créer : `data/fournee.json`
- Modifier : `bento.js` (ajout des helpers ci-dessous)
- Créer : `tests/bento-data.test.js`

**Interfaces :**
- Consomme : module `bento.js` de la tâche 1.
- Produit, dans `Bento` :
  - `totalScore(topic): number` = `durability + propensity + offer` (sur 15)
  - `pickTopics(topics, n): Topic[]` tri par `totalScore` décroissant, stable, puis `n` premiers
  - `topTopic(topics): Topic | null` premier sujet `hot` selon ce tri, sinon le premier tout court, `null` si liste vide
  - `countStates(topics): { hot, knead, stale }`
  - `leftover(topics): Topic | null` premier sujet `stale` qui a un `newAngle`
  - `safeUrl(url): string` renvoie l'URL si elle commence par `http://` ou `https://`, sinon `'#'`
- Produit, format de `data/fournee.json` (contrat futur avec n8n) :

```json
{
  "version": 1,
  "date": "2026-10-30",
  "profile": { "name": "Léa Martin", "role": { "fr": "", "en": "" },
               "axes": [ { "id": 1, "label": { "fr": "", "en": "" } } ],
               "sources": [ "The Decoder" ] },
  "topics": [ { "id": "", "state": "hot|knead|stale", "axis": 1, "source": "", "url": "https://...",
                "title": { "fr": "", "en": "" }, "summary": { "fr": "", "en": "" }, "forYou": { "fr": "", "en": "" },
                "scores": { "durability": 0, "propensity": 0, "offer": 0 },
                "newAngle": { "fr": "", "en": "" } } ],
  "posts": [ { "label": { "fr": "", "en": "" }, "impressions": 0, "state": "hot|knead|stale" } ],
  "pantry": [ { "title": { "fr": "", "en": "" }, "source": "", "savedDaysAgo": 0, "state": "hot|knead|stale" } ]
}
```

`newAngle` n'existe que sur les sujets `stale`. Contenu : reprendre les 3 sujets actuels de `fournee.html` (scores 4/5/4, 4/3/3, 2/2/1), en ajouter 4 dans le même ton pour arriver à 7 (au moins 2 `hot`, 2 `knead`, 2 `stale`). Reprendre les 6 posts du graphe de `index.html` et les 4 articles de `garde-manger.html`. Axes : 1 et 2, libellés à proposer (par exemple « Outils et modèles » et « IA en PME »).

- [ ] **Étape 1 : écrire les tests qui échouent**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const B = require('../bento.js');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'fournee.json'), 'utf8'));
const t = (state, d, p, o, extra) => Object.assign({ state, scores: { durability: d, propensity: p, offer: o } }, extra);

test('helpers de score et de sélection', () => {
  const list = [t('stale', 2, 2, 1, { id: 'a' }), t('knead', 4, 3, 3, { id: 'b' }), t('hot', 4, 5, 4, { id: 'c' }), t('hot', 4, 3, 3, { id: 'd' })];
  assert.equal(B.totalScore(list[2]), 13);
  assert.deepEqual(B.pickTopics(list, 3).map(x => x.id), ['c', 'b', 'd']);
  assert.equal(B.pickTopics(list, 7).length, 4);
  assert.equal(B.topTopic(list).id, 'c');
  assert.equal(B.topTopic([t('knead', 1, 1, 1, { id: 'k' })]).id, 'k');
  assert.equal(B.topTopic([]), null);
  assert.deepEqual(B.countStates(list), { hot: 2, knead: 1, stale: 1 });
  assert.equal(B.leftover(list), null);
  assert.equal(B.leftover([t('stale', 1, 1, 1, { id: 's', newAngle: { fr: 'x', en: 'x' } })]).id, 's');
});

test('safeUrl', () => {
  assert.equal(B.safeUrl('https://the-decoder.com/a'), 'https://the-decoder.com/a');
  assert.equal(B.safeUrl('http://x.org'), 'http://x.org');
  for (const bad of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,x', '', null, undefined, 42]) {
    assert.equal(B.safeUrl(bad), '#');
  }
});

test('data/fournee.json respecte le contrat', () => {
  const both = v => v && typeof v.fr === 'string' && v.fr && typeof v.en === 'string' && v.en;
  const states = ['hot', 'knead', 'stale'];
  assert.equal(data.version, 1);
  assert.match(data.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(data.topics.length, 7);
  assert.equal(new Set(data.topics.map(x => x.id)).size, 7);
  for (const s of data.topics) {
    assert.ok(states.includes(s.state));
    assert.ok([1, 2].includes(s.axis));
    assert.ok(both(s.title) && both(s.summary) && both(s.forYou));
    assert.notEqual(B.safeUrl(s.url), '#');
    for (const k of ['durability', 'propensity', 'offer']) assert.ok(Number.isInteger(s.scores[k]) && s.scores[k] >= 0 && s.scores[k] <= 5);
    if (s.state === 'stale') assert.ok(both(s.newAngle));
  }
  const c = B.countStates(data.topics);
  assert.ok(c.hot >= 2 && c.knead >= 2 && c.stale >= 2);
  assert.equal(data.posts.length, 6);
  for (const p of data.posts) assert.ok(both(p.label) && Number.isInteger(p.impressions) && states.includes(p.state));
  assert.equal(data.pantry.length, 4);
  for (const p of data.pantry) assert.ok(both(p.title) && Number.isInteger(p.savedDaysAgo) && states.includes(p.state));
  assert.ok(both(data.profile.role) && data.profile.axes.length === 2 && data.profile.sources.length >= 3);
});
```

- [ ] **Étape 2 : lancer, constater l'échec**

Commande : `node --test tests/`
Attendu : FAIL, fichier `data/fournee.json` introuvable.

- [ ] **Étape 3 : écrire `data/fournee.json` et ajouter les helpers dans `bento.js`**

- [ ] **Étape 4 : lancer, constater le succès**

Commande : `node --test tests/`
Attendu : 10 tests, 0 échec.

- [ ] **Étape 5 : commit**

```bash
git add bento.js data/fournee.json tests/bento-data.test.js
git commit -m "feat(news): données d'exemple au format n8n et helpers de contenu"
```

---

### Tâche 3 : page News en mode lecture

**Fichiers :**
- Créer : `tools/serve.mjs`, `.claude/launch.json`
- Modifier : `boot.js` (crochet `afterRender`)
- Créer : `bento-ui.js`
- Réécrire : `fournee.html`

**Interfaces :**
- Consomme : `Bento.*` des tâches 1 et 2.
- Produit :
  - `boot.js` : à la fin de `window.__render`, après `document.documentElement.lang = ...`, appeler `c.afterRender(root)` si `typeof c.afterRender === 'function'`. Les autres pages n'ont pas cette méthode et ne changent pas.
  - `BentoUI.applyLayout(root: Element, layout: Layout): void` dans `bento-ui.js` : prend la grille `root.querySelector('[data-bento]')`, et pour chaque tuile de la disposition, dans l'ordre, l'élément `[data-tile="<id>"]` : `appendChild` (l'ordre du DOM suit l'ordre visuel, donc la tabulation aussi), classe `tile tile-<size>`, attribut `hidden` si `visible === false`. Met aussi `aria-pressed` à jour sur les boutons `[data-id][data-size]`.
  - Dans `fournee.html` : `class Component extends DCLogic` avec `state = { lang, editing: false, layout, data: null, loadError: false }`, `layout` initialisé par `Bento.loadLayout(window.localStorage)` dans un `try`. Le constructeur lance `fetch('/data/fournee.json')`, puis `setState({ data })`, ou `setState({ loadError: true })` en cas d'échec réseau ou JSON. `afterRender(root)` appelle `BentoUI.applyLayout(root, this.state.layout)`.
  - `tools/serve.mjs` : serveur statique Node sur le port 4173, sans dépendance, qui imite `cleanUrls` de Vercel (`/` → `index.html`, `/fournee` → `fournee.html`, fichiers réels servis tels quels, sinon `404.html` avec statut 404), types MIME pour html, js, json, css, svg. `.claude/launch.json` : configuration `site`, `node tools/serve.mjs`, port 4173.

Ordre des scripts en bas de page : `/dc.js`, `/bento.js`, `/bento-ui.js`, script de la page, `/boot.js`.

Contenu du template, dans la `main`, sous l'en-tête existant (eyebrow avec la date formatée par `Intl.DateTimeFormat` selon la langue, titre « La fournée du jour », badge MVP, badge données d'exemple) :
- une barre d'outils avec le bouton « Personnaliser » (sans effet dans cette tâche) ;
- `<div data-bento class="bento">` contenant les 7 `<section data-tile="<id>">`, chacune avec un `h2` et le contenu suivant :
  - `news` : cartes des `pickTopics(data.topics, layout.newsCount)` reprenant la carte actuelle (puce d'état, axe, source, titre, résumé, « pour toi », 4 scores dont monétisation `totalScore/15`, liens « Pétrir un post LinkedIn » vers `/fournil` et « Lire la source » vers `safeUrl(url)` avec `target="_blank" rel="noopener"`) ;
  - `top` : le `topTopic` en carte sombre comme sur le comptoir, lien vers `/fournil` ;
  - `graph` : barres d'impressions, hauteur en % du maximum, couleur selon l'état ;
  - `stats` : les 3 compteurs `countStates` avec leur pastille ;
  - `profile` : nom, rôle, 2 axes, sources ;
  - `painperdu` : le `leftover`, son titre et son `newAngle`, ou « Rien de rassis aujourd'hui » ;
  - `pantry` : les 3 premiers articles, état, ancienneté (« aujourd'hui », « hier », « il y a N jours »), lien « Tout le garde-manger » vers `/garde-manger`.
- tant que `data` est nul : un texte « Mise au four… » à la place de la grille ; si `loadError` : « Impossible de charger la fournée. Recharge la page. » avec `role="alert"`.
- si toutes les tuiles sont masquées : « Toutes les tuiles sont masquées. Clique sur Personnaliser pour les remettre. »

Le moteur ne gère pas les `sc-for` imbriqués : chaque liste (sujets, barres, compteurs, axes, garde-manger) est un `sc-for` à plat dans sa tuile.

CSS à ajouter dans le `<style>` de la page :

```css
.bento{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-auto-rows:minmax(180px,auto);grid-auto-flow:dense;gap:16px}
.tile-S{grid-column:span 1;grid-row:span 1}
.tile-M{grid-column:span 2;grid-row:span 1}
.tile-L{grid-column:span 2;grid-row:span 2}
@media (max-width:640px){.bento{grid-template-columns:1fr}.tile-S,.tile-M,.tile-L{grid-column:auto;grid-row:auto}}
```

Le reste du style reste en ligne, dans la charte actuelle (fond `#FFFDF8`, bordure `#E7D6B8`, rayon 18px, Fraunces pour les titres). La nav latérale est reprise telle quelle avec `aria-current="page"` sur « La fournée du jour ».

- [ ] **Étape 1 : écrire `tools/serve.mjs` et `.claude/launch.json`, démarrer avec `preview_start` (`site`)**

Attendu : `/`, `/fournil`, `/garde-manger` s'affichent comme avant, `/inexistant` renvoie la page 404.

- [ ] **Étape 2 : ajouter le crochet dans `boot.js`, recharger `/` et `/fournil`**

Attendu : rendu identique, aucune erreur console, le bouton FR/EN marche toujours.

- [ ] **Étape 3 : écrire `bento-ui.js` (`applyLayout`) et réécrire `fournee.html`**

- [ ] **Étape 4 : vérifier dans le navigateur**

Sur `/fournee` à 1280 px : 7 tuiles, grille pleine sur 4 rangées, 5 sujets dans `news`, aucune erreur console. Bascule EN : tous les textes et contenus passent en anglais. À 375 px (`resize_window` mobile) : une seule colonne, pas de défilement horizontal. Dans la console, `localStorage.setItem('pq-layout', JSON.stringify({version:1,newsCount:1,tiles:[{id:'pantry',size:'S',visible:true}]}))` puis rechargement : 1 sujet, garde-manger en premier et en petit, les 6 autres tuiles derrière. Renommer temporairement l'URL du `fetch` : le message d'erreur s'affiche, puis remettre l'URL. Vider `pq-layout`.

- [ ] **Étape 5 : `node --test tests/`, puis commit**

Attendu : 10 tests, 0 échec.

```bash
git add tools/serve.mjs .claude/launch.json boot.js bento-ui.js fournee.html
git commit -m "feat(news): page fournee en grille bento lue depuis le JSON"
```

---

### Tâche 4 : mode édition (A et C, réordonnancement au bouton)

**Fichiers :**
- Modifier : `fournee.html`
- Modifier : `bento-ui.js` si besoin pour l'état visuel du mode édition

**Interfaces :**
- Consomme : `Bento.stepTile`, `setSize`, `setVisible`, `setNewsCount`, `hiddenIds`, `saveLayout`, `defaultLayout` ; `BentoUI.applyLayout`.
- Produit, dans le `Component` de la page :
  - `updateLayout(layout): void` qui fait `Bento.saveLayout(window.localStorage, layout)` dans un `try` puis `this.setState({ layout })`.
  - Gestionnaires renvoyés par `renderVals` et branchés par `onClick` : `toggleEdit`, `resetLayout`, `tileUp`, `tileDown`, `tileSize`, `tileHide`, `tileShow`, `setCount`. Ils lisent l'id et la valeur sur `e.currentTarget` (`data-id`, `data-size`, `data-count`).
  - `hiddenTiles: [{ id, label }]` pour le tiroir (libellés depuis `T`).

Comportement :
- « Personnaliser » bascule `editing`. Le bouton a `aria-pressed` et devient « Terminer » en mode édition.
- En mode édition, chaque tuile affiche en tête une barre d'outils : poignée de glisser (pour la tâche 5), boutons ↑ et ↓ avec `aria-label` (« Monter la tuile Sujets du jour », etc.), groupe S/M/L en boutons bascules, bouton « Masquer ». La grille prend une bordure pointillée. En lecture, ces barres n'existent pas visuellement (`display:none` via une classe sur la grille).
- La tuile `news` montre en plus en mode édition un groupe 1 / 3 / 5 / 7 sujets.
- Sous la grille en mode édition : le tiroir « Tuiles masquées » avec un bouton « Ajouter » par tuile masquée, ou « Aucune tuile masquée ».
- Bouton « Disposition par défaut » en mode édition : `updateLayout(Bento.defaultLayout())`.
- Chaque re-rendu reconstruit la page : après un clic d'outil, rendre le focus au même bouton dans `afterRender` (retrouver `[data-id="<id>"][data-act="<action>"]`). Si ce bouton n'existe plus (tuile masquée), mettre le focus sur le bouton « Personnaliser ».

- [ ] **Étape 1 : ajouter les outils, le tiroir, les gestionnaires et la restauration du focus dans `fournee.html`**

- [ ] **Étape 2 : vérifier dans le navigateur**

Passer en édition. ↓ sur `news` : elle passe en 2e position. L sur `stats` : elle occupe 2×2. Masquer `graph` : il apparaît dans le tiroir, « Ajouter » le remet à sa place dans l'ordre de la disposition. Choisir 7 : 7 sujets. Recharger : tout est conservé. Faire tout cela au clavier seul (Tab, Entrée) : le focus reste sur le bouton actionné après chaque clic. Masquer les 7 tuiles puis « Terminer » : message d'invitation affiché. « Disposition par défaut » : retour à l'état initial. Aucune erreur console. À 375 px : les outils restent utilisables, cibles de 44 px.

- [ ] **Étape 3 : `node --test tests/`, puis commit**

```bash
git add fournee.html bento-ui.js
git commit -m "feat(news): mode édition (masquer, réordonner, tailles, nombre de sujets)"
```

---

### Tâche 5 : glisser-déposer (B)

**Fichiers :**
- Modifier : `bento-ui.js`
- Modifier : `fournee.html` (branchement et style de la tuile en cours de glisser)

**Interfaces :**
- Consomme : `Bento.moveTile`, `updateLayout` de la tâche 4.
- Produit : `BentoUI.initDrag(options: { isEditing: () => boolean, onDrop: (id: string, toIndex: number) => void }): void`, appelée une seule fois depuis le constructeur du `Component`. Écouteurs délégués sur `document`, car `#root` est reconstruit à chaque rendu.

Algorithme :
- `pointerdown` sur un élément `[data-drag]` quand `isEditing()` est vrai : mémoriser la tuile (`closest('[data-tile]')`), son id et l'ordre de départ, `setPointerCapture`, ajouter la classe `dragging` (opacité réduite, ombre). La poignée a `touch-action:none` pour que le doigt ne fasse pas défiler la page.
- `pointermove` : `document.elementFromPoint(x, y)`, puis `closest('[data-tile]')`. Si c'est une autre tuile visible, insérer la tuile glissée avant elle si le pointeur est dans la moitié haute ou gauche de sa boîte, après sinon. On ne déplace que le DOM, pas l'état.
- `pointerup` : calculer l'index de la tuile parmi toutes les `[data-tile]` de la grille (masquées comprises, pour rester aligné sur la disposition), retirer `dragging`, appeler `onDrop(id, index)`.
- `pointercancel` ou touche Échap pendant le glisser : retirer `dragging` et appeler `window.__render()` pour remettre l'ordre de l'état.

- [ ] **Étape 1 : implémenter `initDrag` et le brancher**

- [ ] **Étape 2 : vérifier dans le navigateur**

À la souris : glisser `pantry` avant `news`, lâcher, l'ordre est conservé après rechargement. Échap en cours de glisser : retour à l'ordre initial. En lecture, la poignée n'existe pas et rien ne se déplace. À 375 px avec l'émulation mobile : glisser une tuile au-dessus d'une autre réordonne la colonne sans faire défiler la page. Les boutons ↑ ↓ marchent toujours. Aucune erreur console.

- [ ] **Étape 3 : `node --test tests/`, puis commit**

```bash
git add bento-ui.js fournee.html
git commit -m "feat(news): glisser-déposer des tuiles à la souris et au doigt"
```

---

### Tâche 6 : vérification finale

- [ ] `node --test tests/` : 10 tests, 0 échec.
- [ ] Parcours complet sur `/fournee` en FR puis EN, desktop puis 375 px, sans erreur console.
- [ ] Non-régression : `/`, `/fournil`, `/garde-manger`, `/inexistant` (404) se comportent comme avant la tâche 3.
- [ ] Capture d'écran du mode lecture et du mode édition pour Delio.
