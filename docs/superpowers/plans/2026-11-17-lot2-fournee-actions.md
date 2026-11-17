# Lot 2 · La fournée qui agit : plan d'implémentation

> **Pour les agents :** sous-skill requis : superpowers:executing-plans. Étapes en cases `- [ ]`.

**Objectif :** sur chaque bloc news de `/fournee`, Pétrir (lien vers le fournil), Mettre de côté (bascule, compteur de nav), Ignorer (décale les emplacements), avec un message annulable 5 s.

**Architecture :** logique pure et testée dans `store.js` (`desIgnorer`, `dateDuJour`) et `bento.js` (`pickTopics` avec exclusions, `lienFournil`). La page garde une copie de l'état du store, la recharge depuis `localStorage` avant chaque action, enregistre puis re-rend ; la nav relit le store à chaque `pq:rendu`, donc le compteur suit. Le message (« toast ») vit **hors de `#root`** (élément statique `#pq-toast` géré par `BentoUI.toast`) : `#root` est remplacé à chaque rendu, une zone `aria-live` recréée à chaque fois ne serait pas annoncée de façon fiable.

**Stack :** HTML/CSS/JS sans build, ES5 dans les fichiers de logique, `node --test "tests/*.test.js"`.

**Spec :** `docs/superpowers/specs/2026-11-17-lot2-fournee-actions-design.md`.

## Contraintes globales

- Lien Pétrir : `/fournil?ref=<ref encodée>`.
- Libellés FR / EN : Pétrir un post / Knead a post ; Mettre de côté / Save for later ; Ignorer / Skip ; Annuler / Undo ; messages « Mis de côté » / « Saved for later », « Retiré du garde-manger » / « Removed from the pantry », « Sujet ignoré » / « Topic skipped » ; vide : « Tu as tout passé en revue pour aujourd'hui » / « You have gone through everything for today », bouton « Tout faire revenir » / « Bring everything back ».
- Message visible 5 000 ms, dans `aria-live="polite"`. Seule la dernière action est annulable.
- Date de la fournée : `Store.dateDuJour(new Date())`, heure locale, `YYYY-MM-DD`.
- Boutons d'action masqués quand la grille a la classe `editing`.
- Blocs S (≥ 641 px) : texte des boutons Mettre de côté et Ignorer visuellement masqué mais lu (nom accessible conservé) ; M et L : icône + texte. 44 px au toucher (`pointer:coarse`).
- Jamais de tiret long. Commits locaux terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Points de vigilance

1. Ignorer quand il reste moins d'articles que d'emplacements : l'emplacement vidé se cache, le focus ne doit pas tomber sur `body` (repli sur le bouton Annuler du message). Vérifié au navigateur (tâche 4).
2. État modifié dans un autre onglet (garde-manger) : chaque action recharge le store avant d'écrire, pour ne rien écraser. Vérifié au navigateur.
3. Ignorés d'hier : ne doivent pas masquer la fournée du jour. Déjà couvert par `refsIgnorees` ; `desIgnorer` sur une autre date ne change rien (test tâche 1).
4. `ref` avec caractères spéciaux (`&`, espace) dans le lien Pétrir : encodé. Test tâche 2.
5. Le message expire alors que le focus est sur « Annuler » : on ne perd pas le focus (on le rend au bouton d'origine). Vérifié au navigateur (tâche 4).

---

### Tâche 1 : `store.js`, annuler un « Ignorer » et date du jour

**Fichiers :** modifier `store.js`, `tests/store.test.js`.

**Interfaces produites :**
- `Store.desIgnorer(etat, ref, dateFournee) -> etat` (copie ; retire `ref` si `etat.ignores.date === dateFournee`, sinon copie inchangée).
- `Store.dateDuJour(d: Date) -> 'YYYY-MM-DD'` (heure locale, mois et jour sur deux chiffres).

- [ ] **Étape 1 : tests**

```js
test('desIgnorer annule un ignorer du jour, sans toucher aux autres dates', () => {
  let e = S.ignorer(S.etatInitial(), 'recA', '2026-11-17');
  e = S.ignorer(e, 'recB', '2026-11-17');
  const avant = JSON.stringify(e);
  assert.deepEqual(S.refsIgnorees(S.desIgnorer(e, 'recA', '2026-11-17'), '2026-11-17'), ['recB']);
  assert.equal(JSON.stringify(e), avant, 'entrée non mutée');
  assert.deepEqual(S.refsIgnorees(S.desIgnorer(e, 'recA', '2026-11-18'), '2026-11-17'), ['recA', 'recB']);
  assert.deepEqual(S.refsIgnorees(S.desIgnorer(e, 'inconnu', '2026-11-17'), '2026-11-17'), ['recA', 'recB']);
});

test('dateDuJour au format YYYY-MM-DD, heure locale', () => {
  assert.equal(S.dateDuJour(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(S.dateDuJour(new Date(2026, 10, 17, 0, 1)), '2026-11-17');
});
```

- [ ] **Étape 2 :** `node --test tests/store.test.js` : échec (`desIgnorer is not a function`).
- [ ] **Étape 3 :** implémenter et exporter les deux fonctions.
- [ ] **Étape 4 :** `node --test "tests/*.test.js"` : tout vert.
- [ ] **Étape 5 :** commit `feat(store): desIgnorer et dateDuJour`.

### Tâche 2 : `bento.js`, sélection sans les ignorés et lien du fournil

**Fichiers :** modifier `bento.js`, `tests/bento-data.test.js`.

**Interfaces produites :**
- `Bento.pickTopics(articles, n, exclus?) -> article[]` : comme avant, après avoir retiré les articles dont `ref` est dans `exclus` (tableau, absent = aucun).
- `Bento.lienFournil(ref) -> string` : `'/fournil?ref=' + encodeURIComponent(ref)`.

- [ ] **Étape 1 : tests**

```js
test('pickTopics exclut les refs ignorées et comble le trou', () => {
  const list = [{ ref: 'c', rang: 3 }, { ref: 'a', rang: 1 }, { ref: 'b', rang: 2 }, { ref: 'd', rang: 4 }];
  assert.deepEqual(B.pickTopics(list, 2, ['a']).map(x => x.ref), ['b', 'c']);
  assert.deepEqual(B.pickTopics(list, 3, ['b', 'd']).map(x => x.ref), ['a', 'c']);
  assert.deepEqual(B.pickTopics(list, 3, ['a', 'b', 'c', 'd']), []);
  assert.deepEqual(B.pickTopics(list, 2).map(x => x.ref), ['a', 'b']);
});

test('lienFournil encode la ref', () => {
  assert.equal(B.lienFournil('recDemo01'), '/fournil?ref=recDemo01');
  assert.equal(B.lienFournil('a&b c'), '/fournil?ref=a%26b%20c');
});
```

- [ ] **Étape 2 :** `node --test tests/bento-data.test.js` : échec.
- [ ] **Étape 3 :** implémenter.
- [ ] **Étape 4 :** `node --test "tests/*.test.js"` : tout vert.
- [ ] **Étape 5 :** commit `feat(bento): pickTopics avec exclusions et lienFournil`.

### Tâche 3 : boutons d'action sur `/fournee`

**Fichiers :** modifier `fournee.html`.

**Interfaces consommées :** tâches 1 et 2, `Store.charger/enregistrer/mettreDeCote/retirer/estDeCote/ignorer/refsIgnorees`.

- [ ] **Étape 1 :** état de la page : `store: Store.charger(localStorage)`. `available()` = nombre d'articles non ignorés du jour. `picked = Bento.pickTopics(articles, 7, refsIgnorees(store, dateDuJour))`.
- [ ] **Étape 2 :** dans chaque bloc, rangée `.tile-actions` : lien Pétrir (`href={{s.kneadHref}}`, `data-act="knead"`, `data-id`), bouton `data-act="save"` (`aria-pressed={{s.saved}}`, deux SVG signet vide / plein basculés en CSS selon `aria-pressed`, texte `<span class="act-label">`), bouton `data-act="skip"` (SVG ✕ + `act-label`), lien Lire la source (L) inchangé. `title` = libellé sur les deux boutons icônes.
- [ ] **Étape 3 :** CSS : `.bento.editing .tile-actions{display:none}` ; `.tile-S .act-label` visuellement masqué (≥ 641 px) ; boutons icônes 36 px à la souris, 44 px en `pointer:coarse` ; variantes dorées pour le n°1.
- [ ] **Étape 4 :** handlers `toggleSave` et `skip` : recharger le store, appliquer, `Store.enregistrer`, `setState({ store })`, focus gardé (`pendingFocus = { id, act }`).
- [ ] **Étape 5 :** navigateur : bascule et compteur de nav, ignorer décale, Personnaliser masque les actions, aucune erreur console.
- [ ] **Étape 6 :** commit `feat(fournee): pétrir, mettre de côté et ignorer`.

### Tâche 4 : message annulable et état « tout ignoré »

**Fichiers :** modifier `fournee.html`, `bento-ui.js`.

**Interfaces produites :** `BentoUI.toast(el, vue, onUndo)` avec `vue = { cle, texte, annuler }` ou `null` : ne réécrit le contenu que si `cle` change (pas de double annonce) ; bouton `[data-toast-undo]` si `annuler` est non vide.

- [ ] **Étape 1 :** `<div id="pq-toast" aria-live="polite">` statique hors de `#root`, positionné en bas (fixe, centré, marge 16 px, ne masque rien d'essentiel à 375 px).
- [ ] **Étape 2 :** état `toast = { n, type: 'save'|'unsave'|'skip'|'undone', article, origine: { id, act } }` ; chaque action remplace le précédent et relance un minuteur de 5 000 ms. À l'expiration, si le focus est sur « Annuler », `pendingFocus = origine`.
- [ ] **Étape 3 :** Annuler : `save` → `retirer`, `unsave` → `mettreDeCote(article)`, `skip` → `desIgnorer` ; puis message « Action annulée » / « Undone » sans bouton, focus rendu à `origine`.
- [ ] **Étape 4 :** focus après Ignorer : même bouton du même emplacement s'il est encore affiché, sinon bouton Annuler du message.
- [ ] **Étape 5 :** état vide (prêt, au moins un article, tous ignorés) : bloc avec le message et le bouton `data-act="unskip-all"` qui retire toutes les refs du jour (`desIgnorer` en boucle) et met le focus sur `[data-act="knead"][data-id="n1"]`.
- [ ] **Étape 6 :** navigateur (voir tâche 5), commit `feat(fournee): message annulable et état tout ignoré`.

### Tâche 5 : vérification finale

- [ ] `node --test "tests/*.test.js"` : tout vert.
- [ ] Navigateur, connecté avec Léa : FR et EN, 1440 et 375 px sans débordement, parcours au clavier, Annuler pour les trois messages, tout ignorer puis tout faire revenir, compteur de nav, aucune erreur console.
- [ ] Journal `.superpowers/sdd/2026-11-17-lot2-fournee-actions/progress.md` à jour.
