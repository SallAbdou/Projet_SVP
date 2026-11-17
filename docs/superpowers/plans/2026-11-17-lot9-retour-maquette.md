# Lot 9 · Retours sur la maquette : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** charte plus vive et centralisée, « Valider et publier sur LinkedIn », « Tout chaud » braise animé, « Lire la source » bleu canard, blocs news sans défilement, « Rassis » noir et blanc.

**Architecture:** `charte.css` porte la palette et les classes partagées (puces, animation) ; `charte.js` (ES5, UMD comme `nav.js`) porte la logique pure testée (contraste, classe de puce, couleur de barre). Les gabarits des pages passent des styles en ligne de couleur aux classes et variables.

**Tech Stack:** HTML/CSS/JS sans build ni dépendance, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-17-lot9-retour-maquette-design.md`

## Global Constraints

- Aucun tiret long nulle part (code, textes, commits). Textes FR et EN.
- ES5 dans `charte.js` (pas de `const`, de flèche ni de classe).
- Seul l'affichage change : les valeurs d'état de n8n (`vert`, `orange`, `rouge`) restent identiques.
- Cibles de 44 px (36 px pour `.act` à la souris), focus visible.
- Toute animation est coupée sous `prefers-reduced-motion: reduce`.
- Commits terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Rien n'est poussé.

## Review Focus

- État inconnu venu de n8n (`feu` absent ou faux) : pas de puce vide affichée ni d'erreur. Test `puce('inconnu') === ''` (tâche 1) ; le fournil garde son repli sur `rouge`.
- Page chargée sans `charte.css` (cache, ancienne version) : les variables manquent ; on charge `charte.css` en premier sur les 16 pages, contrôlé par un test qui lit chaque `.html` (tâche 1).
- Résumé très long ou titre sans espace en S : le bloc grandit, aucune barre de défilement, pas de débordement horizontal (`overflow-wrap:anywhere` sur les titres). Vérifié par la mesure headless (tâche 4).
- Mode Personnaliser à 375 px : outils + contenu, aucun défilement interne. Mesure (tâche 4).
- Puce « Tout chaud » sur la tuile dorée n°1 : reste lisible (texte sombre sur dégradé, contrastes testés tâche 1).

---

### Task 1: Palette et logique pure (`charte.css`, `charte.js`)

**Files:** Create `charte.css`, `charte.js`, `tests/charte.test.js` · Modify `parcours.css` (retrait du `:root`), les 16 pages `.html` (lien `charte.css` en premier dans `<head>`).

**Interfaces:** Produces `Charte.luminance(hex) -> number`, `Charte.contraste(hexA, hexB) -> number`, `Charte.puce(etat) -> 'puce puce-chaud' | 'puce puce-petrir' | 'puce puce-rassis' | ''`, `Charte.barre(etat) -> 'var(--barre-chaud)' | 'var(--barre-petrir)' | 'var(--barre-rassis)' | ''`. Classes CSS `.puce`, `.puce-chaud`, `.puce-petrir`, `.puce-rassis`, `.pq-cache`, `.mini-puce`.

- [ ] Tests : `contraste('#000000','#FFFFFF')` vaut 21 ; `contraste(x,x)` vaut 1 ; symétrie ; `contraste('#FFFFFF','#C2410C')` arrondi à 5,18 ; `puce` pour `vert/hot/chaud`, `orange/knead/enfourner`, `rouge/stale/rassis`, `'inconnu'`, `undefined` ; idem `barre` ; palette : lire `charte.css`, extraire les `--nom:#hex`, vérifier chaque couple du tableau des contrastes du design (seuils 4,5 et 3) ; chaque page `.html` référence `/charte.css` avant tout autre `<link rel="stylesheet">` ou `<style>` local.
- [ ] Lancer `node --test tests/charte.test.js` : échec attendu.
- [ ] Implémenter `charte.js` puis `charte.css` (valeurs exactes du design ; animation `pq-braise` 2,4 s sur la lueur et la position du dégradé, `pq-braise-point` sur la braise `::before`, coupées sous `prefers-reduced-motion`). Ajouter le lien dans les 16 pages ; retirer le `:root` de `parcours.css`.
- [ ] Relancer tous les tests : vert. Commit `feat(charte): palette vive centralisée et contrastes testés`.

### Task 2: Pages de l'application aux couleurs de la charte

**Files:** Modify `fournee.html`, `garde-manger.html`, `comptoir.html`, `fournil.html`, `profil.html`, `nav.js`, `parcours.css`, `index.html`, `ta-fournee-type.html`.

**Interfaces:** Consumes `Charte.puce`, `Charte.barre` ; `charte.js` chargé avant le script de page dans fournée, garde-manger, comptoir, fournil.

- [ ] Gabarits : `style="{{…chip}}"` devient `class="{{…chip}}"` (fournée l.147, garde-manger l.59, comptoir l.81 et l.107 avec `style="align-self:flex-start"` pour le prochain sujet, fournil l.58, 68, 78) ; les objets `CHIP` locaux sont remplacés par `Charte.puce(etat)` (valeur cachée : `'pq-cache'`), les `BAR`/`BAR_COLOR`/`DOT` par `Charte.barre(etat)`.
- [ ] Couleurs : fonds `var(--fond)`/`var(--creme)`, sur-titres `var(--sur-titre)`, anneaux de focus `var(--braise)`, boutons principaux `var(--braise)` (survol `var(--braise-fonce)`), bouton du message bref et bouton plein du comptoir `var(--croute)`, nav (logo, « AI », langue active en braise ; lien actif avec liseré braise à gauche).
- [ ] Miniatures landing et `/ta-fournee-type` : puce `mini-puce puce puce-chaud` « Tout chaud » / « Piping hot » dans la tuile n°1.
- [ ] Fournil : `publish` = « Valider et publier sur LinkedIn » / « Confirm and post to LinkedIn » ; étape 10 de `docs/demo/scenario-jury.md`.
- [ ] Tests complets verts ; contrôle visuel rapide de chaque page, console sans erreur. Commits par page ou groupe : `feat(charte): …`, `feat(fournil): valider et publier sur LinkedIn`.

### Task 3: « Lire la source » bleu canard

**Files:** Modify `fournee.html` (CSS), `garde-manger.html`.

- [ ] Fournée : `.act[data-act="read"]` plein `--source`, texte blanc, survol `--source-fonce`, règle plus spécifique que `.tile[data-tile="n1"] .act` ; texte affiché en M (retrait de la règle qui le masquait), icône seule en S.
- [ ] Garde-manger : classe `gm-source` sur le lien, même style.
- [ ] Vérifier au navigateur : tailles 36/44 px inchangées (`getBoundingClientRect`), focus visible. Commit `feat(fournee): lire la source en bleu canard`.

### Task 4: Grille sans défilement interne

**Files:** Modify `fournee.html` (CSS de `.bento`, `.tile`, `.tile-body`, `.tile-S`).

- [ ] Mesure avant (script headless local) consignée dans `progress.md`.
- [ ] `grid-auto-rows: minmax(180px, auto)`, `.tile-body` sans `overflow:auto` ni `min-height:0` (`flex:1 0 auto`), retrait du `line-clamp` des titres S, `overflow-wrap:anywhere` sur `.news-title`.
- [ ] Mesure après : 5 mises en page × lecture/Personnaliser × 1440/1280/1024/375 × FR/EN, zéro débordement et zéro titre tronqué ; hauteurs relevées dans `progress.md`. Commit `fix(fournee): blocs news lisibles sans défilement`.

### Task 5: Vérification finale

- [ ] `node --test "tests/*.test.js"` entièrement vert.
- [ ] Captures après (`docs/demo/captures-lot9/*-apres.png`) des pages landing, fournée, garde-manger, fournil, comptoir, fournée type ; console sans erreur ; scénario du jury rejoué (étapes 8 à 12).
- [ ] `prefers-reduced-motion: reduce` émulé : puce « Tout chaud » sans animation.
- [ ] Commit `docs(lot9): captures et journal`.
