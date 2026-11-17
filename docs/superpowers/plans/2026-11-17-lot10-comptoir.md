# Lot 10 · Retours sur le comptoir : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** appliquer les six retours sur `/comptoir` (en-tête, KPI, graphique, phrase d'analyse, four cliquable vers `/fournee#n1`) et l'ampoule devant « Pour toi ».

**Architecture:** site statique sans build ; logique pure en ES5 (`comptoir.js`, `bento.js`) testée avec `node --test` ; gabarits `#tpl` rendus par `dc.js` + `boot.js` (valeurs échappées, donc le gras passe par des morceaux de phrase). Styles partagés dans `charte.css`.

**Tech Stack:** HTML, CSS, JavaScript ES5, SVG en ligne, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-17-lot10-comptoir-design.md`

## Global Constraints

- Jamais de tiret long (code, textes, commits).
- Textes exacts du design (FR et EN), apostrophes typographiques `’` comme dans le reste des pages.
- Toute animation coupée sous `@media (prefers-reduced-motion:reduce)`.
- SVG décoratifs : `aria-hidden="true"` et `focusable="false"`.
- Commits terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` ; rien n'est poussé.
- Tests : `node --test "tests/*.test.js"` entièrement vert après chaque tâche.

## Review Focus

- Ratio entier (2) : « 2 fois », pas « 2,0 fois » (test dans la tâche 1).
- Ancre `#n1` alors que n1 est masqué par la mise en page : premier bloc visible (test tâche 3).
- Ancre sans rapport (`#haut`, vide, `#n9`) : rien ne se passe (test tâche 3).
- Re-rendu pendant le halo (message bref, clic) : le halo ne disparaît pas avant 2 s (vérif navigateur tâche 3).
- Fournée encore en attente au moment du clic depuis le comptoir : le four chauffe sans lien (vérif navigateur tâche 2).

---

### Task 1: Textes du comptoir, graphique allégé, phrase d'analyse

**Files:**
- Modify: `comptoir.js` (ajout `phraseAnalyse`)
- Modify: `comptoir.html` (gabarit en-tête, KPI, graphique, phrase ; dictionnaire `T`)
- Test: `tests/comptoir.test.js`

**Interfaces:**
- Produces: `Comptoir.phraseAnalyse(ratio: number|null, lang: 'fr'|'en') -> { avant: string, gras: string, apres: string } | null`

- [ ] **Step 1: tests qui échouent** dans `tests/comptoir.test.js` :

```js
test('phraseAnalyse FR : appel à l’action, gras, virgule décimale', () => {
  assert.deepEqual(C.phraseAnalyse(1.8, 'fr'), {
    avant: 'Sers-les vite ! Tes posts sur des sujets ', gras: 'tout chaud',
    apres: ' font en moyenne 1,8 fois plus d’audience que les autres.'
  });
  assert.equal(C.phraseAnalyse(2, 'fr').apres, ' font en moyenne 2 fois plus d’audience que les autres.');
});
test('phraseAnalyse EN et ratio absent', () => {
  assert.deepEqual(C.phraseAnalyse(1.8, 'en'), {
    avant: 'Serve them fast! Your posts on ', gras: 'piping hot',
    apres: ' topics get on average 1.8 times more reach than the others.'
  });
  assert.equal(C.phraseAnalyse(null, 'fr'), null);
});
```

- [ ] **Step 2:** `node --test tests/comptoir.test.js` : FAIL (`phraseAnalyse is not a function`).
- [ ] **Step 3:** implémenter `phraseAnalyse` (langue inconnue = FR ; `String(ratio)` puis `.` remplacé par `,` en FR) et l'exporter.
- [ ] **Step 4:** test PASS.
- [ ] **Step 5:** `comptoir.html` : `h1` en deux `span` block (`titleL1`, `t.titleL2`), sous-titre en deux `span` block (`t.subtitle1`, `t.subtitle2`), `kpiTitle`, `visTitle`, `visSub` du design ; suppression de la pastille dans les libellés de barres, du bloc légende, de `DOT` et de `legend` ; phrase rendue en `{{ins.avant}}<strong>{{ins.gras}}</strong>{{ins.apres}}` (neutre ou chargement : texte dans `avant`, `gras` et `apres` vides). Supprimer `t.insight` devenu inutile.
- [ ] **Step 6:** suite complète verte, commit `feat(comptoir): en-tête sur deux lignes, graphique sans légende, phrase d'analyse orientée action`.

### Task 2: Four illustré cliquable sur le comptoir

**Files:**
- Modify: `comptoir.html` (styles du four, `<symbol id="pq-four">`, carte, valeurs `four*`, textes `fourLabel`, `fourCta`)

**Interfaces:**
- Consumes: `Bento.pickTopics`, `Store.refsIgnorees` (inchangés)
- Produces: lien `<a class="four-lien" href="/fournee#n1">` attendu par la tâche 3.

- [ ] **Step 1:** dessiner le symbole (viewBox `0 0 200 160` environ) : corps brun `--brun`, porte vitrée avec rectangle de lueur classe `four-lueur` (dégradé braise), pain `--maillard` avec grignes, trois chemins de vapeur classe `four-vapeur` (délais décalés). Keyframes `pq-four-lueur` (opacité 0,55 à 1, 2,4 s) et `pq-four-vapeur` (montée de 10 px et fondu, 3 s). Bloc `@media (prefers-reduced-motion:reduce){.four-lueur,.four-vapeur{animation:none}}`.
- [ ] **Step 2:** carte claire : `h2#next-t` « Tout juste sorti du four » ; si news : `<a class="four-lien" href="/fournee#n1" aria-label="{{fourLabel}}">` contenant `<svg aria-hidden="true" focusable="false"><use href="#pq-four"></use></svg>`, le titre de la news et « Voir dans la fournée → » ; sinon bloc sans lien avec le même `<use>` (attente) ou le texte vide existant. Textes : `fourLabel` FR « Voir la première news du jour : {titre} », EN « See today’s first news: {titre} » ; `fourCta` FR « Voir dans la fournée → », EN « See it in the batch → ». Survol et focus visibles (anneau braise, léger soulèvement coupé sous mouvement réduit).
- [ ] **Step 3:** navigateur : FR/EN, 1440 et 375, Tab atteint le lien et lit le bon libellé, animation `none` sous mouvement réduit, état d'attente (fournée « attente ») sans lien.
- [ ] **Step 4:** suite verte, commit `feat(comptoir): four illustré qui mène à la première news du jour`.

### Task 3: Arrivée sur /fournee#n1 (défilement, focus, halo)

**Files:**
- Modify: `bento.js` (ajout `cibleAncre`)
- Modify: `fournee.html` (constructeur, `afterRender`, CSS `.pq-halo`)
- Test: `tests/bento-ancre.test.js` (nouveau)

**Interfaces:**
- Produces: `Bento.cibleAncre(hash: string, visibles: string[]) -> string|null`

- [ ] **Step 1: tests qui échouent** :

```js
test('cibleAncre vise le bloc demandé s’il est visible', () => {
  assert.equal(B.cibleAncre('#n1', ['n1', 'n2']), 'n1');
  assert.equal(B.cibleAncre('#n3', ['n1', 'n3']), 'n3');
});
test('cibleAncre se replie sur le premier bloc news visible', () => {
  assert.equal(B.cibleAncre('#n1', ['graph', 'n3', 'n2']), 'n2');
});
test('cibleAncre ignore les ancres étrangères et l’absence de bloc', () => {
  assert.equal(B.cibleAncre('', ['n1']), null);
  assert.equal(B.cibleAncre('#haut', ['n1']), null);
  assert.equal(B.cibleAncre('#n9', ['n1']), null);
  assert.equal(B.cibleAncre('#n1', ['graph']), null);
});
```

- [ ] **Step 2:** FAIL, **Step 3:** implémenter (repli dans l'ordre n1 à n7, pas l'ordre reçu), **Step 4:** PASS.
- [ ] **Step 5:** `fournee.html` : le constructeur lit `location.hash` dans `this.ancre` ; `afterRender`, quand la grille est affichée et `this.ancre` non traitée : visibles = ids des `.tile[data-tile]` non `hidden`, cible = `Bento.cibleAncre`, `this.ancre = null`, `this.halo = { id, fin: Date.now() + 2000 }`, focus `preventScroll` sur `[data-act="knead"][data-id=cible]`, puis `setTimeout` 0 : `scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'center' })` ; `setTimeout` 2000 : `this.halo = null` et retrait de la classe. À chaque rendu, si `this.halo` actif, ajouter `pq-halo` au bloc. CSS : `.tile.pq-halo{box-shadow:0 0 0 4px var(--croute),0 0 26px 8px rgba(255,176,32,.55);animation:pq-halo 1s ease-in-out 2 alternate}` et version sans animation sous mouvement réduit.
- [ ] **Step 6:** navigateur : depuis le comptoir, clic sur le four : arrivée sur la n°1, focus sur « Pétrir un post », halo 2 s ; mise en page Personnalisée sans n1 : premier bloc visible ; 375 px ; mouvement réduit ; console propre.
- [ ] **Step 7:** suite verte, commit `feat(fournee): arrivée par #n1 avec défilement doux, focus et halo doré`.

### Task 4: Ampoule devant « Pour toi »

**Files:**
- Modify: `charte.css` (`--eclair:#E0A100`, `.pour-toi`, `.ampoule`)
- Modify: `fournee.html` (paragraphe `s.forYou`), `fournil.html` (span `sujet.pourToi`)
- Test: `tests/charte.test.js`

- [ ] **Step 1: test qui échoue** : `charte.css` définit `--eclair` et `.ampoule` ; `fournee.html` et `fournil.html` contiennent `class="ampoule"` avec `aria-hidden="true"`.
- [ ] **Step 2:** FAIL, **Step 3:** ajouter le SVG (ampoule et petits rayons, `viewBox="0 0 24 24"`, `fill` et `stroke` en `currentColor`) dans un conteneur `.pour-toi` (flex, `align-items:flex-start`, ampoule `margin-top` pour l'aligner sur la première ligne) ; le conteneur garde le style d'affichage conditionnel existant. **Step 4:** PASS.
- [ ] **Step 5:** navigateur : fournée (bloc L) et fournil, FR/EN, alignement première ligne.
- [ ] **Step 6:** commit `feat(charte): ampoule éclair de génie devant Pour toi`.

### Task 5: Scénario jury, captures, journal

- [ ] `docs/demo/scenario-jury.md` étape 11 : phrase d'analyse et clic sur le four vers la n°1 en évidence.
- [ ] Captures `docs/demo/captures-lot10/comptoir-1440-avant.png` (reprise de la capture « après » du lot 9, comptoir inchangé depuis), `comptoir-1440-apres.png`, `comptoir-375-apres.png`.
- [ ] `.superpowers/sdd/2026-11-17-lot10-comptoir/progress.md` : décisions et vérifications.
- [ ] Commit `docs(lot10): scénario jury, captures et journal`.
