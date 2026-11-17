# Lot 3 · Garde-manger réel : plan d'implémentation

> **Pour les agents :** sous-skill requis : superpowers:executing-plans. Étapes en cases `- [ ]`.

**Objectif :** `/garde-manger` affiche les articles mis de côté (lus dans le `store`), triés du plus récent au plus ancien, avec leur fraîcheur, des filtres fonctionnels, et les actions Pétrir, Lire la source, Retirer (annulable).

**Architecture :** logique pure et testée dans un nouveau `garde-manger.js` (`window.GardeManger`) et dans `store.js` (`remettre`). La page garde une copie du store, la recharge depuis `localStorage` avant chaque écriture, enregistre puis re-rend ; la nav relit le store à chaque `pq:rendu`. Le message annulable réutilise `BentoUI.toast` et une zone statique `#pq-toast` hors de `#root`, comme sur la fournée.

**Stack :** HTML/CSS/JS sans build, ES5 dans les fichiers de logique, `node --test "tests/*.test.js"`.

**Spec :** `docs/superpowers/specs/2026-11-17-lot3-garde-manger-design.md`.

## Contraintes globales

- Catégories internes : `chaud`, `enfourner`, `rassis` ; filtre `tout` en plus.
- Seuils : 24 h (`vert`) et 48 h (`orange`), en millisecondes depuis `savedAt` ; date future = 0 h.
- Libellés FR / EN : Tout / All ; Encore chaud / Still warm ; À enfourner avant demain / Bake before tomorrow ; Rassis / Gone stale ; Pétrir / Knead ; Lire la source / Read the source ; Retirer / Remove ; Annuler / Undo ; « Retiré du garde-manger » / « Removed from the pantry » ; « Action annulée » / « Undone » ; vide : « Ton garde-manger est vide » / « Your pantry is empty » ; lien « Aller à la fournée du jour » / « Go to today's batch » ; filtre vide : « Rien dans cette catégorie pour l'instant » / « Nothing in this category yet ».
- Ancienneté : « Mis de côté aujourd'hui / hier / il y a N jours » ; « Saved today / yesterday / N days ago ».
- Message visible 5 000 ms dans `#pq-toast` (`aria-live="polite"`), seule la dernière action annulable.
- Cibles de 44 px. Jamais de tiret long. Commits locaux terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Points de vigilance

1. `savedAt` illisible ou absent (store ancien ou bricolé) : l'article s'affiche quand même, classé Rassis, sans ancienneté. Test tâche 2.
2. Retirer le dernier article d'un filtre ou de la liste : le focus ne tombe pas sur `body` (repli sur Annuler). Vérifié au navigateur (tâche 4).
3. Annuler un retrait : l'article revient avec son `savedAt` d'origine, à sa place. Test tâche 1 + navigateur.
4. `url` non http(s) (`javascript:`) : lien neutralisé en `#` par `Bento.safeUrl` (déjà testé) ; titre et source passent par l'échappement du moteur `{{...}}`.
5. Changement d'heure et minuit : « hier » se calcule en jours calendaires locaux, pas en tranches de 24 h. Test tâche 2.

---

### Tâche 1 : `store.js`, remettre un article retiré

**Fichiers :** modifier `store.js`, `tests/store.test.js`.

**Interfaces produites :** `Store.remettre(etat, sauve) -> etat` (copie ; ajoute l'objet `sauve` tel quel, `savedAt` compris, sauf si sa `ref` est déjà de côté ou si `sauve.ref` n'est pas une chaîne).

- [ ] **Étape 1 : test** `remettre restaure l'article d'origine, sans doublon` : après `mettreDeCote(art, T0)` puis `retirer`, `remettre(e, original)` redonne `sauves[0]` profondément égal à l'original (`savedAt === T0`) ; un second `remettre` laisse 1 article ; l'entrée n'est pas mutée.
- [ ] **Étape 2 :** `node --test tests/store.test.js` : échec (`remettre is not a function`).
- [ ] **Étape 3 :** implémenter et exporter `remettre`.
- [ ] **Étape 4 :** tests verts.
- [ ] **Étape 5 :** commit `feat(store): remettre un article retiré tel quel`.

### Tâche 2 : `garde-manger.js`, logique pure

**Fichiers :** créer `garde-manger.js`, `tests/garde-manger.test.js`.

**Interfaces produites (`GardeManger`) :**
- `CATEGORIES = ['chaud', 'enfourner', 'rassis']`, `FILTRES = ['tout', 'chaud', 'enfourner', 'rassis']`.
- `fraicheur(article, maintenantIso) -> 'chaud' | 'enfourner' | 'rassis'`.
- `trier(sauves) -> copie triée par savedAt décroissant` (dates illisibles en dernier, ordre stable).
- `compter(sauves, maintenantIso) -> { tout, chaud, enfourner, rassis }`.
- `filtrer(sauves, filtre, maintenantIso) -> copie triée puis filtrée` (filtre inconnu = `tout`).
- `joursDepuis(savedAt, maintenantIso) -> entier >= 0 | null` (jours calendaires locaux ; null si date illisible).
- `libelleAnciennete(jours, lang) -> string` (`''` si `jours === null` ; `lang` autre que `en` = FR).

- [ ] **Étape 1 : tests** (dates construites en heure locale avec `new Date(2026, 10, 17, h).toISOString()` pour ne pas dépendre du fuseau) :
  - `fraicheur` : vert à 23 h → `chaud` ; vert à 24 h pile → `enfourner` ; orange à 47 h → `enfourner` ; orange à 48 h → `rassis` ; rouge à 1 h → `rassis` ; feu inconnu → `rassis` ; `savedAt` `'n/a'` → `rassis` ; vert daté dans 2 h (futur) → `chaud`.
  - `trier` : trois articles mélangés + un sans date → ordre du plus récent au plus ancien, sans date en dernier ; entrée non mutée.
  - `compter` : un de chaque + un vert récent de plus → `{ tout: 4, chaud: 2, enfourner: 1, rassis: 1 }` ; liste vide → tout à 0.
  - `filtrer` : `'chaud'` ne renvoie que les chauds, triés ; `'tout'` et `'bidon'` renvoient tout.
  - `joursDepuis` : même jour à 00:05 et 23:55 → 0 ; veille à 23:55 vu le lendemain à 00:05 → 1 ; 6 jours plus tôt → 6 ; futur → 0 ; illisible → null.
  - `libelleAnciennete` : 0, 1, 2 en FR et EN (textes des contraintes globales), null → `''`.
- [ ] **Étape 2 :** `node --test tests/garde-manger.test.js` : échec (module introuvable).
- [ ] **Étape 3 :** implémenter (même enveloppe UMD que `store.js`).
- [ ] **Étape 4 :** `node --test "tests/*.test.js"` vert.
- [ ] **Étape 5 :** commit `feat(garde-manger): fraîcheur, tri, filtres et ancienneté`.

### Tâche 3 : page lue dans le store, filtres et états vides

**Fichiers :** modifier `garde-manger.html`.

**Interfaces consommées :** `GardeManger.*` (tâche 2), `Store.charger`, `Bento.lienFournil`, `Bento.safeUrl`.

- [ ] **Étape 1 :** charger `/bento.js`, `/bento-ui.js`, `/garde-manger.js` ; retirer `items` en dur et le badge d'exemple ; état `{ lang, filtre: 'tout', store }` ; helper `stockage()` avec repli inerte (comme la fournée).
- [ ] **Étape 2 :** boutons de filtre `data-filtre="…"`, `aria-pressed`, style actif/inactif existant, libellé avec nombre ; un clic change `filtre` et garde le focus sur le bouton.
- [ ] **Étape 3 :** chaque article : pastille et barre de sa fraîcheur, source, ancienneté, titre ; Pétrir (`data-act="knead"`), Lire la source (`target="_blank" rel="noopener"`), Retirer (`data-act="remove" data-ref="…"`, sans effet pour l'instant).
- [ ] **Étape 4 :** état vide (filtres masqués, lien `/fournee`) et filtre vide.
- [ ] **Étape 5 :** vérification navigateur rapide (liste, filtres, `?demo=reset` vide), tests verts, commit `feat(garde-manger): liste réelle et filtres de fraîcheur`.

### Tâche 4 : Retirer, annuler, focus

**Fichiers :** modifier `garde-manger.html`.

**Interfaces consommées :** `Store.retirer`, `Store.remettre` (tâche 1), `BentoUI.toast`.

- [ ] **Étape 1 :** zone `<div id="pq-toast" aria-live="polite">` hors de `#root` et styles du message copiés de la fournée.
- [ ] **Étape 2 :** `retirer(ref)` : recharge le store, garde l'objet retiré, `Store.retirer`, enregistre, message 5 s ; focus voulu = Retirer de l'article suivant dans la liste filtrée, sinon précédent, sinon Annuler.
- [ ] **Étape 3 :** `annuler()` : `Store.remettre(objet)`, message « Action annulée », focus sur Retirer de l'article remis (sinon filtre actif). Expiration avec le focus sur Annuler : focus sur le filtre actif.
- [ ] **Étape 4 :** navigateur : retirer + annuler, compteur nav, retirer le dernier article d'un filtre, aucune erreur console.
- [ ] **Étape 5 :** commit `feat(garde-manger): retirer avec message annulable`.

### Tâche 5 : vérification de bout en bout

- [ ] Connecté avec `lea@demo.painquotidien.fr`, 4 articles mis de côté depuis `/fournee`, `savedAt` forcés via la console pour obtenir les trois fraîcheurs.
- [ ] FR/EN, 1440 et 375 px (pas de défilement horizontal), clavier (Tab, Entrée, Espace), filtres et nombres, retirer + annuler, état vide, compteur de nav, aucune erreur console.
- [ ] Journal dans `.superpowers/sdd/2026-11-17-lot3-garde-manger/progress.md`.
