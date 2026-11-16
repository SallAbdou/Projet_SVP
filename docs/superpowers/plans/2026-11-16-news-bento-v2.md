# Page News bento v2 (emplacements) : plan d'implémentation

> **Pour les agents :** sous-skill requis : superpowers:executing-plans. Étapes en cases `- [ ]`.

**Objectif :** réduire `/fournee` aux news (un bloc par news, 1 à 7) et au graphique, l'utilisatrice arrangeant des emplacements remplis chaque jour par score.

**Architecture :** on garde `bento.js` (logique pure testée), `bento-ui.js` (DOM, glisser) et le moteur `boot.js`. La disposition passe en version 2 : emplacements `n1`..`n7` + `graph`, visibilité déduite du nombre de news choisi et du nombre de sujets disponibles.

**Stack :** HTML/CSS/JS sans build, `node --test "tests/*.test.js"`.

**Spec :** `docs/superpowers/specs/2026-11-16-news-bento-v2-design.md`

## Contraintes globales

- Mêmes contraintes que le plan v1 (pas de dépendance, pas de tiret long, FR/EN, 44 px, commits locaux signés `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`).
- Clé `pq-layout`, format `{ "version": 2, "newsCount": 5, "tiles": [ { "id", "size" } ] }`.
- Ordre et tailles par défaut : `n1` L, `n2` M, `n3` M, `graph` M, `n4` S, `n5` S, `n6` S, `n7` S.

## Points de vigilance

1. Disposition v1 déjà enregistrée : ignorée, retour au défaut. Testé en tâche 1.
2. Fournée du jour avec moins de sujets que le nombre choisi : les emplacements sans sujet sont cachés. Testé en tâche 1 (`isShown` avec `available`).
3. Flèches sur un bloc voisin d'emplacements cachés : le bloc saute les cachés. Testé en tâche 1.
4. Glisser alors que des emplacements sont cachés : l'index reste celui de la liste complète (les cachés restent dans le DOM). Vérifié en tâche 2.
5. Bloc S très chargé : le contenu défile, rien ne déborde. Vérifié en tâche 2.

---

### Tâche 1 : logique d'emplacements

**Fichiers :** modifier `bento.js`, réécrire `tests/bento-layout.test.js`.

**Interfaces produites (dans `Bento`) :**
- `TILE_IDS = ['n1','n2','n3','graph','n4','n5','n6','n7']`, `SIZES`, `COUNTS`, `STORAGE_KEY` inchangés.
- `defaultLayout(): { version: 2, newsCount: 5, tiles: [{ id, size }] }`
- `normalizeLayout(raw)` : mêmes règles qu'en v1, sans `visible`, et `version !== 2` → défaut.
- `rankOf(id): number | null` : `'n3'` → 3, `'graph'` → null.
- `isShown(layout, id, available = Infinity): boolean` : `graph` toujours vrai ; `nK` vrai si `K <= newsCount` et `K <= available`.
- `stepTile(layout, id, delta, available = Infinity)` : échange de place avec le plus proche emplacement affiché dans la direction `delta` ; aucun changement s'il n'y en a pas.
- `moveTile`, `setSize`, `setNewsCount`, `loadLayout`, `saveLayout` inchangés. `setVisible` et `hiddenIds` supprimés.

- [ ] Réécrire les tests : défaut v2 (ordre, tailles, pas de `visible`) ; `normalizeLayout` répare (id inconnu, doublon, taille invalide, emplacements manquants ajoutés à la fin) et rejette une disposition v1 ; `rankOf` ; `isShown` avec `newsCount` 3 (n3 vrai, n4 faux, graph vrai) et `available` 2 (n3 faux) ; `stepTile` : avec `newsCount` 3, `graph` monte devant `n3`, et `n3` descendu passe après `graph` en sautant rien, puis avec ordre `[n1, n4, n5, n2]` et `newsCount` 3, descendre `n1` le place après `n2` (saute n4, n5 cachés) ; `moveTile`, `setSize`, `setNewsCount`, load/save (normal, JSON cassé, stockage qui lève) comme en v1.
- [ ] `node --test "tests/*.test.js"` : échecs attendus sur `rankOf`, `isShown`, défaut v2.
- [ ] Implémenter dans `bento.js`.
- [ ] `node --test "tests/*.test.js"` : tout passe.
- [ ] Commit `feat(news): disposition en emplacements n1 à n7 et graphique`.

### Tâche 2 : page simplifiée

**Fichiers :** modifier `fournee.html`, `bento-ui.js`.

**Interfaces :**
- `BentoUI.applyLayout(root, layout, available)` : ordre DOM, classe de taille, `hidden = !Bento.isShown(layout, id, available)`, `aria-pressed` des boutons taille et nombre.
- Gestionnaires de la page : `toggleEdit`, `tileUp`, `tileDown`, `tileSize`, `setCount`, `resetLayout` (supprimer `tileHide`, `tileShow`, le tiroir, `hiddenTiles`).
- `tileUp` / `tileDown` passent `available = data.topics.length` à `stepTile`.

Contenu :
- Template : un `sc-for` sur `slots` (7 entrées, `n1`..`n7`, chacune avec le sujet de rang K de `pickTopics(topics, 7)` ou vide) qui produit `<section data-tile="{{s.id}}">` avec la barre d'outils (poignée, ↑, ↓, S/M/L) et le bloc news ; puis la tuile `graph` avec sa barre. Badge de rang « n°K ».
- Contenu selon taille, en CSS : `.tile-S .only-M, .tile-S .only-L, .tile-M .only-L { display: none }`. Résumé en `only-M` (visible en M et L), « pour toi », détail des scores et « Lire la source » en `only-L`. Sous 640 px, tout s'affiche.
- Mode édition : sélecteur 1/3/5/7 et « Disposition par défaut » dans une barre au-dessus de la grille, avec le texte d'aide.
- Supprimer les tuiles top, stats, profile, painperdu, pantry, le tiroir, le message « toutes les tuiles masquées » et les textes devenus inutiles.

- [ ] Modifier `bento-ui.js` et `fournee.html`.
- [ ] Vérifier dans le navigateur à 1440 px : 5 blocs news + graphique, 3 rangées pleines ; passer à 3 puis 7 news ; ↑ ↓ avec emplacements cachés ; tailles S/M/L changent le contenu affiché ; glisser un bloc et recharger ; disposition v1 en `localStorage` ignorée ; EN ; 375 px sans débordement ; aucune erreur console ; non-régression des autres pages.
- [ ] `node --test "tests/*.test.js"`, commit `feat(news): page réduite aux news et au graphique`.
