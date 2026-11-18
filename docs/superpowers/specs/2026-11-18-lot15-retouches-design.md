# Lot 15 : couleurs imposées, profil, slogan, fournée sans scroll, jauges du n°1

## 1. Couleurs imposées

Écrites une seule fois dans le bloc `:root,[data-theme="bronze"]` de `charte.css` : Bronze, Boulangerie classique et Nuit en héritent (leurs blocs ne les redéfinissent plus). Le bloc Contraste élevé les redéfinit avec ses propres valeurs (celles d'avant le lot).

| Élément | Variables | Valeur | Contraste du texte |
|---|---|---|---|
| Étiquette de source | `--etiquette-fond` / `--etiquette-texte` | #ABBF9B / #2C1910 | 8,50 |
| Lire la source | `--lire-fond` / `--lire-survol` / `--lire-texte` | #BD470C / #9C3A0A / #FFFFFF | 5,16 |
| Pétrir un post | `--petrir-btn-fond` / `-survol` / `-texte` / `-bord`, `--petrir-pain`, `--petrir-grigne` | #B20206 / #8C0105 / #FFFFFF, pain blanc, grignes rouges | 7,23 |
| Rassis (puces, barres) | `--rassis-fond`, `--barre-rassis` / `--rassis-texte` | #615945 / #FFFFFF | 6,95 |
| Valider et publier sur LinkedIn | `--linkedin-fond` / `-survol` / `-texte` / `-bord` | #0A66C2 / #004182 / #FFFFFF | 5,69 |

Toutes les paires de texte passent AA (4,5). Survol : teinte plus foncée ; appui : léger enfoncement ; focus : contour 3 px `--focus`, décalé.

Point signalé : en Nuit, les fonds pleins #B20206 (2,46), #615945 (2,56) et #0A66C2 (3,13) se détachent peu du fond sombre. Le texte reste lisible (les boutons sont identifiés par leur texte), et les barres Rassis gardent leur liseré `--barre-rassis-contour` (au moins 3:1). Les couleurs demandées ne sont pas modifiées.

Le générateur `tools/palette-oklch.js` ne calcule plus ces couleurs : elles sont listées dans `IMPOSEES` (hex tels quels), vérifiées par le test.

Tests remplacés car la demande change : « Rassis froid et éteint », « Rassis en gris clair dans les graphiques », « Lire la source en vert-de-gris », « mêmes puces dans tous les thèmes » (Contraste élevé garde son Rassis). Ils deviennent : valeurs imposées exactes en Bronze, classique et Nuit, valeurs propres en Contraste élevé, contrastes AA dans les quatre thèmes.

## 2. Profil

Suppression de l'intro d'Apparence. Nouvelle intro des retours : « Si jamais ce que tu vois ne te convient pas, dis-nous comment l’améliorer ! » / « If what you see doesn’t suit you, tell us how to make it better! ».

## 3. Slogan

Le bloc marque (logo, nom, slogan) de la nav est centré dans la colonne (classe `pq-nav-marque`) ; sous 900 px (barre du haut), il reste à gauche.

## 4. Fournée sans scroll

`Bento.rangees(layout, available, colonnes)` (pur, testé) donne le nombre de rangées. Si la grille tient en 3 rangées et hors mode Personnaliser, `main` reçoit la classe `fournee-tient`. À partir de 1101 px de large et 700 px de haut, cette classe fixe `main` à la hauteur de l'écran, resserre marges et en-tête, et la grille répartit la hauteur restante (`grid-auto-rows:minmax(0,1fr)`). Résumés et titres tronqués (line-clamp). Sinon (plus de 3 rangées, téléphone, écran bas) : défilement normal.

## 5. Jauges de monétisation du n°1

Remplace la ligne « Durabilité 4/5 · Propension 5/5 · Lien offre 4/5 » (visible seulement en taille L). Trois jauges horizontales de 0 à 5 avec leur valeur, et « Monétisation x/15 » en avant. `Bento.jauges(article)` (pur, testé) donne valeurs et pourcentages bornés. Accessibilité : chaque jauge est un texte lisible (« Durabilité 4/5 ») suivi d'une barre décorative (`aria-hidden`). Couleurs : `--jauge-fond`, `--jauge-plein`, contraste au moins 3:1 sur le doré.
