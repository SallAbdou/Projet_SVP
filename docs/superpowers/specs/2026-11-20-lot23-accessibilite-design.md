# Lot 23 : corrections d'accessibilité prioritaires

Cible WCAG 2.2 AA, sans overlay. Premier des quatre lots accessibilité (24 audit manuel, 25 garde-fous, 26 déclaration).

## 1. Lien d'évitement (2.4.1)

- Toutes les pages (16, 404 et qr comprises) : `<a class="pq-evitement" href="#contenu">Aller au contenu</a>` posé en dur,
  premier enfant de `<body>`, donc hors de `#root` : le rendu de boot.js ne le touche jamais et la restauration du focus n'est pas concernée.
- Cible : `<main id="contenu" tabindex="-1">` dans chaque gabarit. L'id rend le repère de focus de boot.js stable (`#contenu`).
- Masqué hors de l'écran, visible au focus (charte.css, variables de thème). Texte traduit par boot.js après chaque rendu
  (`Boot.texteEvitement(lang)` : « Aller au contenu » / « Skip to content »). qr.html (sans moteur) reste en français.

## 2. Focus non masqué (2.4.11)

- Sous 900 px la barre du menu est collante (65 px). `--pq-barre-nav: 72px` (barre + marge) dans charte.css ;
  la feuille de nav.js pose `html{scroll-padding-top:var(--pq-barre-nav)}` sous 900 px, donc sur les seules pages connectées.

## 3. « Tout chaud » devient un bouton pause (2.2.2)

- Nouveau `animations.js`. Après chaque rendu (`pq:rendu`, avant la restauration du focus), chaque `span.puce-chaud` devient
  un `<button type="button">` de même classe et même texte (aspect inchangé, curseur main, petit pictogramme pause/lecture discret,
  hauteur minimale 24 px). Pas de conversion si la puce est dans un lien, un bouton, un label ou une zone `aria-hidden`/`inert`
  (pas d'interactif imbriqué ; ces puces restent pilotées par le réglage global).
- Nom accessible : « Tout chaud, mettre en pause l'animation » puis « Tout chaud, relancer l'animation » (EN : « Tout chaud, pause the animation » /
  « resume the animation »). Le nom commence par le texte visible (2.5.3). Pas d'`aria-pressed` (le libellé change déjà).
- Bulle au survol et au focus clavier (« Mettre en pause » / « Relancer l'animation »), élément fixe `#pq-bulle-anim` hors des tuiles
  (qui coupent leur contenu), fermée par Échap, en sortant ou au défilement ; on peut passer la souris dessus sans qu'elle disparaisse (1.4.13).
- Un clic bascule l'état global (le même que la case du profil) : toutes les animations décoratives de la page s'arrêtent ou repartent.
- Glisser-déposer : bento-ui.js exclut déjà `button` du départ de glisser ; un `<button>` en hérite sans changement.

## 4. Case « Animations » du profil

- `animations.js` porte la logique pure (testée sous Node) : clé `pq-animations` = `{ version: 1, comptes: { [compte]: 'on'|'off' } }`,
  compte = même règle que theme.js, `*` pour un visiteur non connecté. Sans choix enregistré : `off` si le système demande
  de réduire les animations, sinon `on`.
- Appliqué tôt : `data-animations="on|off"` sur `<html>`, depuis le `<head>` des pages protégées (après theme.js) et avant boot.js
  sur les pages publiques.
- CSS : `html[data-animations="off"]` coupe toutes les animations (`animation:none!important`), plus les mouvements au survol
  du four et l'enfoncement de Pétrir ; la vapeur reste visible (opacité fixe). Les retours de couleur au survol restent.
  Les règles existantes `prefers-reduced-motion` restent comme filet sans JavaScript, mais ne s'appliquent plus quand
  l'utilisateur a choisi `on` (`html:not([data-animations="on"])`). Le défilement doux vers le halo suit aussi l'état.
- Profil, section Apparence : case « Animations activées » (EN « Animations on ») avec une aide courte, annonce dans la zone `role=status` existante.
- `pq-animations` rejoint `CLES_DEMO` (store.js) : `?demo=reset` l'efface.

## 5. Contours en thème Nuit (1.4.11)

Mesures contre les fonds Nuit (fond, creme, sable, miel) : Pétrir au repos 5,1 à 6,5 mais survol 2,95 à 3,7 ; LinkedIn 2,66 à 3,37
(survol 1,5 à 1,9) ; Rassis 2,18 à 2,76 ; Lire la source au survol 1,9 à 2,4. Couleurs imposées inchangées.
- Nouvelle variable `--contour-plein` dans le seul bloc Nuit, au moins 3:1 contre fond, creme, sable, miel et panneau.
- `[data-theme="nuit"]` : contour 1,5 px (`outline`, sauf au focus clavier qui garde son propre contour) sur Pétrir, LinkedIn,
  les puces Rassis et Lire la source. Ratios vérifiés par test.

## Hors périmètre

`parcours copy.css`, `index copy.html`, couleurs imposées. Pas de test au lecteur d'écran réel dans ce lot (lot 24).
