# Lot 3 · Garde-manger réel : design

Date : 2026-11-17 · Statut : validé par Delio · Découle de `2026-11-17-front-roadmap-design.md` (lot 3)

## Intention

Devant le jury, Léa met des sujets de côté depuis la fournée puis les retrouve dans le garde-manger, triés du plus récent au plus ancien, avec leur fraîcheur : bon à publier tout de suite, à enfourner vite, ou rassis. Elle peut filtrer, pétrir, relire la source ou retirer (avec annulation). Fini les données écrites en dur dans la page. Tout reste simulé dans le navigateur (`store` en `localStorage`).

## Source des données

- `/garde-manger` lit `Store.charger(localStorage).sauves` (champs `ref, titre, source, feu, url, savedAt`).
- Ordre : du plus récent au plus ancien (`savedAt` décroissant).
- Après `?demo=reset`, la liste est vide.
- Le badge « Données d'exemple » disparaît : la liste est celle de l'utilisatrice.

## Fraîcheur

Fonction pure `fraicheur(article, maintenantIso)` :

- **Encore chaud** : feu `vert` et mis de côté il y a moins de 24 h.
- **À enfourner avant demain** : `vert` mis de côté il y a 24 h ou plus, ou `orange` de moins de 48 h.
- **Rassis** : tout le reste (`rouge`, `orange` de 48 h ou plus, feu inconnu, date illisible).

Une date `savedAt` dans le futur (horloge décalée) compte comme « à l'instant ».

## Ancienneté affichée

Calculée en jours calendaires, heure locale :

- FR : « Mis de côté aujourd'hui », « Mis de côté hier », « Mis de côté il y a N jours ».
- EN : « Saved today », « Saved yesterday », « Saved N days ago ».
- Date illisible : rien n'est affiché.

## Filtres

- Quatre boutons bascules (`aria-pressed`) : Tout, Encore chaud, À enfourner avant demain, Rassis (EN : All, Still warm, Bake before tomorrow, Gone stale), chacun avec son nombre d'articles, ex. « Encore chaud (2) ».
- Le filtre choisi n'est pas mémorisé entre deux visites.
- Filtre sans résultat : « Rien dans cette catégorie pour l'instant » / « Nothing in this category yet ».

## Actions par article

- **Pétrir** : lien vers `Bento.lienFournil(ref)`.
- **Lire la source** : lien vers `Bento.safeUrl(url)`, nouvel onglet, `rel="noopener"`.
- **Retirer** : `Store.retirer`, puis le même message annulable que sur la fournée (`BentoUI.toast`, zone `#pq-toast`, 5 s, « Retiré du garde-manger » / « Removed from the pantry » + « Annuler » / « Undo »).
- Annuler remet l'article **tel qu'il était** (même `savedAt`, donc même place et même fraîcheur), via une nouvelle fonction `Store.remettre(etat, sauve)`.
- Focus après retrait : bouton Retirer de l'article suivant, sinon du précédent, sinon le bouton Annuler du message. Après Annuler : bouton Retirer de l'article remis.
- Le compteur de la nav suit (il relit le `store` à chaque rendu).

## État vide

- Garde-manger vide : « Ton garde-manger est vide » / « Your pantry is empty », phrase d'aide et lien « Aller à la fournée du jour » / « Go to today's batch » vers `/fournee`. Les filtres sont masqués.

## Charte

- On garde la mise en page actuelle (pastilles et barres de couleur par fraîcheur, carte blanche, boutons arrondis) et l'encart « Ta fournée s'affine ».

## Code

- Nouveau `garde-manger.js` (logique pure, ES5, `window.GardeManger` et `module.exports`) : fraîcheur, tri, comptage par catégorie, filtrage, ancienneté et son libellé.
- `store.js` : `remettre(etat, sauve)`.
- Testés avec `node --test`. La page est vérifiée dans le navigateur intégré.

## Non-objectifs

- Le fournil ne s'ouvre pas encore sur le sujet choisi (lot 4).
- Pas de note de monétisation par article (le `store` ne garde pas les scores).
- Aucun appel réseau.
