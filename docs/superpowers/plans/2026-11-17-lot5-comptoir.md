# Lot 5 · Comptoir Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Calculer le comptoir (KPI, graphique, analyse, alerte) à partir de l'historique d'exemple et des posts publiés, et brancher la news du jour et le garde-manger réels.

**Architecture:** Logique pure dans `comptoir.js` (ES5, `window.Comptoir` ou `module.exports`), testée sous Node. `data/posts.json` passe au nouveau format, validé par `Api.postExempleValide`. `comptoir.html` réécrite sur `dc.js`/`boot.js` ; la tuile graphique de `fournee.html` réutilise `Comptoir.graphique`.

**Tech Stack:** HTML statique, ES5, `node --test`, aucune dépendance.

**Spec:** `docs/superpowers/specs/2026-11-17-lot5-comptoir-design.md`

## Global Constraints

- Aucun build, aucune dépendance ; ES5 dans les fichiers servis sauf la classe `Component` déjà en usage.
- Jamais de tiret long dans le code, les textes et les commits.
- FR et EN pour chaque texte d'interface ; cibles tactiles de 44 px ; pas de défilement horizontal à 375 px.
- Champs de chiffres : `impressions, reactions, republications, commentaires, contacts`.
- Fenêtres : courante `0 <= âge < 30 j` (âge négatif compté courant), précédente `30 <= âge < 60 j`.
- Graphique : 6 posts ; libellé coupé à 22 caractères ; feu inconnu = `orange`.

## Review Focus

- Post publié sans chiffres : compté dans « posts publiés », absent des sommes, du graphique et de l'analyse ; compté par `sansChiffres`. Tests tâches 2 et 3.
- Période précédente vide (aucun post) : écarts « nouveau » ou « stable », jamais de division par zéro ni de `NaN`. Test tâche 2.
- `posts.json` absent ou invalide : le comptoir et la tuile n'affichent que les posts publiés, sans badge d'exemple. Test `postExempleValide` (tâche 4) et navigateur (tâche 6).
- Tous les sujets du jour ignorés ou fournée en échec : encart « Rien de nouveau au four ». Navigateur (tâche 6).
- Titre très long ou sans espace dans le libellé du graphique : coupé proprement à 22 caractères. Test tâche 1.

---

### Task 1: Conversion et fusion des posts

**Files:**
- Create: `comptoir.js`
- Test: `tests/comptoir.test.js`

**Interfaces:**
- Produces: `Post = { id, ref, titre, label, feu, publieLe: ISO, chiffres: object|null, exemple: boolean }` ; `Comptoir.libelleCourt(titre, max=22) -> string` ; `Comptoir.depuisExemples(exemples, maintenantIso) -> Post[]` (`id = 'exemple-' + ref`, `publieLe = maintenant - ilYaJours * 86400000`) ; `Comptoir.depuisPublies(publies, articles, sauves) -> Post[]` ; `Comptoir.fusionner(postsA, postsB) -> Post[]` (plus récent d'abord, ordre conservé à égalité).

- [ ] **Step 1: Tests** : `libelleCourt('Agents en PME')` inchangé ; titre de 40 caractères avec espaces coupé à la dernière espace avant 22 + « … », longueur <= 23 ; mot unique de 30 lettres coupé à 21 + « … ». `depuisExemples` avec `ilYaJours: 3` et maintenant `2026-11-17T10:00:00.000Z` donne `publieLe` `2026-11-14T10:00:00.000Z`, `exemple: true`. `depuisPublies` : feu trouvé dans la fournée, sinon dans les sauves, sinon `orange` ; `chiffres: null` conservé ; `exemple: false`. `fusionner` trie par date décroissante.
- [ ] **Step 2:** `node --test tests/comptoir.test.js` : FAIL (module absent).
- [ ] **Step 3:** Implémenter dans `comptoir.js` (même enveloppe que `garde-manger.js`).
- [ ] **Step 4:** `node --test "tests/*.test.js"` : PASS.
- [ ] **Step 5:** Commit `feat(comptoir): conversion et fusion des posts`.

### Task 2: KPI et écarts

**Interfaces:**
- Produces: `Comptoir.totaux(posts, maintenantIso, debutJours, finJours) -> { posts, impressions, reactions, republications, commentaires, contacts }` ; `Comptoir.ecart(actuel, precedent, mode: 'nombre'|'pourcent') -> { sens: 'hausse'|'baisse'|'stable'|'nouveau', valeur: number }` (valeur toujours positive ou nulle ; `nombre` : différence absolue ; `pourcent` : `Math.round(|a-p|/p*100)`, `nouveau` si `p = 0` et `a > 0`, `stable` si valeur arrondie nulle) ; `Comptoir.kpis(posts, maintenantIso) -> { actuel, precedent, ecarts: { posts, impressions, reactions, republications, contacts } }`.

- [ ] **Step 1: Tests** : un post à 0 j, un à 29 j, un à 30 j, un à 59 j, un à 60 j, un en date future, un sans chiffres à 2 j, un avec date illisible : `actuel.posts === 4`, `precedent.posts === 2`, sommes sans le post sans chiffres. `ecart(6, 4, 'nombre')` = `{ sens: 'hausse', valeur: 2 }` ; `ecart(4820, 3493, 'pourcent')` = hausse 38 ; `ecart(27, 27, 'pourcent')` stable 0 ; `ecart(1001, 1000, 'pourcent')` stable ; `ecart(5, 0, 'pourcent')` nouveau ; `ecart(0, 0, 'pourcent')` stable ; `ecart(80, 100, 'pourcent')` baisse 20.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implémenter.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(comptoir): KPI sur 30 jours et écarts`.

### Task 3: Graphique, analyse, posts sans chiffres, bilan

**Interfaces:**
- Produces: `Comptoir.graphique(posts, n=6) -> [{ id, label, feu, impressions, hauteur }]` (posts avec chiffres, les n plus récents, du plus ancien au plus récent, `hauteur = Math.round(imp / max(maxImp, 1) * 100)`) ; `Comptoir.analyse(posts) -> { ratio: number|null }` ; `Comptoir.sansChiffres(posts) -> number` (non exemple et `chiffres === null`) ; `Comptoir.bilan(posts) -> { posts, contacts }` (tout l'historique, `posts` compte aussi ceux sans chiffres).

- [ ] **Step 1: Tests** : 8 posts dont un sans chiffres : graphique de 6, ordre chronologique, plus haut à 100 ; impressions toutes nulles : hauteurs 0 sans `NaN`. Analyse : verts 1000 et 1200, autres 600 : ratio 1.8 ; aucun vert : `null` ; autres à 0 impression : `null`. `sansChiffres` ignore les exemples. `bilan` somme les contacts.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implémenter.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(comptoir): graphique, analyse et bilan`.

### Task 4: Historique d'exemple et tuile de la fournée

**Files:**
- Modify: `data/posts.json`, `api.js`, `tests/api.test.js`, `fournee.html` (chargement et tuile graphique)

**Interfaces:**
- Produces: `Api.postExempleValide(p) -> boolean` ; `Api.chargerPosts()` renvoie seulement les posts valides.

- [ ] **Step 1: Tests** : contrat de `posts.json` : 10 posts valides, `ref` uniques, `ilYaJours` entre 0 et 59 ; avec `Comptoir.kpis` au 2026-11-17 : actuel 6 posts, 4 820 impressions, 312 réactions, 27 republications ; écarts `+2`, `+38`, `+21`, stable. `postExempleValide` refuse feu inconnu, `ilYaJours` négatif ou décimal, chiffre manquant ou négatif.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Écrire les 10 posts (chiffres du design), `postExempleValide`, filtre dans `chargerPosts`. Dans `fournee.html` : charger `comptoir.js`, barres = `Comptoir.graphique(fusionner(depuisExemples(posts), depuisPublies(store.publies, articles, store.sauves)))`.
- [ ] **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat(comptoir): historique d'exemple relatif et tuile graphique partagée`.

### Task 5: Page `/comptoir`

**Files:**
- Modify: `comptoir.html` (réécriture du script et du gabarit, mêmes styles)

- [ ] **Step 1:** Charger `api.js`, `bento.js`, `garde-manger.js`, `comptoir.js` ; état `{ lang, data, posts, postsOk, store }` ; `Promise.all` fournée (attente/échec tolérés) et posts.
- [ ] **Step 2:** Rendu : en-tête, alerte, KPI formatés (`Intl.NumberFormat`), graphique avec légende, analyse, encart news n°1, bilan, garde-manger 3 derniers ; textes FR/EN du design.
- [ ] **Step 3:** `node --test "tests/*.test.js"` : PASS.
- [ ] **Step 4:** Commit `feat(comptoir): page calculée à partir des posts, de la fournée et du garde-manger`.

### Task 6: Vérification navigateur

- [ ] Connectée avec Léa après `?demo=reset` : KPI de l'exemple, graphique identique à la tuile de `/fournee`.
- [ ] Publier un post depuis le fournil : alerte « 1 post attend ses chiffres », posts publiés 7. Reporter ses chiffres : alerte disparue, KPI, graphique et bilan mis à jour.
- [ ] Ignorer la news n°1 dans la fournée : l'encart passe à la n°2.
- [ ] FR/EN, 1440 et 375 px (scrollWidth), clavier, console sans erreur. Journal dans `.superpowers/sdd/2026-11-17-lot5-comptoir/progress.md`.
