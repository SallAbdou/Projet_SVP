# Plan lot 23 (accessibilité prioritaire)

Design : `docs/superpowers/specs/2026-11-20-lot23-accessibilite-design.md`. Journal : `.superpowers/sdd/2026-11-20-lot23-accessibilite/progress.md`.

## Task 1 : tests rouges
- `tests/accessibilite.test.js` : lien d'évitement premier focusable de chaque page, `main#contenu[tabindex=-1]` unique,
  styles du lien, texte FR/EN (`Boot.texteEvitement`), scroll-padding dans nav.js, contours Nuit (variable et ratios, règles),
  puce Tout chaud en bouton (CSS : curseur, 24 px), animations.js chargé sur les pages qui affichent des puces.
- `tests/animations.test.js` : clé, lecture/écriture par compte, défaut selon prefers-reduced-motion, stockage cassé, appliquer,
  libellés FR/EN, puce convertible ou non (ancêtres interdits), CLES_DEMO, règles CSS `data-animations="off"`, case du profil.

## Task 2 : lien d'évitement et scroll-padding
16 pages, `main id="contenu" tabindex="-1"`, charte.css, boot.js (texte traduit), nav.js.

## Task 3 : animations.js, bouton Tout chaud, bulle, case du profil
animations.js, chargement sur les pages, charte.css (bouton, bulle, état off), pages (règles reduce et off), profil.html, store.js, fournee.html (défilement).

## Task 4 : contours Nuit
charte.css (variable Nuit, règles), tools/palette-oklch.js non touché (couleurs imposées).

## Task 5 : vérification
Tests, navigateur 1280x800 et 390 px, clavier Tab et Maj+Tab (accueil, fournée, comptoir, profil), bulle, case du profil,
4 thèmes, console, démo remise à zéro.
