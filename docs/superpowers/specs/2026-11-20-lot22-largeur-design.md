# Lot 22 : largeur bornée des pages connectées

## Problème mesuré (avant, Chrome headless, compte démo, thème bronze)

| Écran | Page | main | Blocs / graphique | Paragraphe le plus large |
|---|---|---|---|---|
| 2560x1440 | fournée | 2308 px | 1115 px de large, petits blocs 422 px de haut | 1077 px |
| 1920x1080 | fournée | 1669 px | 795 px, petits blocs 302 px de haut | 757 px |
| 2560x1440 | comptoir | 2308 px | graphique 1821 px | 2220 px |
| 1920x1080 | comptoir | 1669 px | graphique 1182 px | 1581 px |
| 2560x1440 | fournil | 2308 px | | 2170 px |

Causes : `main` sans largeur maximale ; règle « fournée tient » qui remplit toute la hauteur ; lignes non bornées.

## Décisions

1. `charte.css` : nouvelle variable `--largeur-contenu: 1440px` dans un bloc `:root` à part (hors blocs de couleurs imposées).
   Règle commune `[data-nav]+main{max-width:var(--largeur-contenu);margin-inline:auto}` : les 5 pages connectées
   (comptoir, fournée, fournil, garde-manger, profil) ont toutes le menu juste avant `main`, donc une seule règle, aucun gabarit touché.
2. Sans autre réglage, une fois `main` bloqué à sa largeur maximale, le menu (`flex:1 1 250px`) prendrait tout l'espace restant.
   Au-dessus de 900 px (seuil où nav.js garde le menu en colonne), le menu ne grandit plus : `flex-grow:0`.
   L'espace libre va aux marges automatiques de `main`, qui se centre à droite du menu. Le fond reste celui du conteneur, jusqu'au bord.
3. Fournée : la règle de remplissage devient `@media (min-width:1101px) and (min-height:700px) and (max-height:1000px)`.
   Au-delà de 1000 px de haut, rangées à la hauteur du contenu. 1280x800 et 1440x900 inchangés.
4. Paragraphes du `main` : `max-width:70ch`. Exception par la classe `pq-pleine` pour les paragraphes en encadré
   (phrase du comptoir sur fond miel, état vide du fournil) qui gardent toute la largeur de leur bloc.
5. Comptoir : le graphique suit la largeur bornée, sa hauteur reste fixe (220 px, déjà en place).
6. Pas d'agrandissement du texte sur très grand écran. `parcours copy.css` non touché.
