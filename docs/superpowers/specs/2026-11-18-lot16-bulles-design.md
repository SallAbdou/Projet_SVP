# Lot 16 : bulles d'aide des critères et couleurs de Pétrir et Lire la source

## 1. Bulles d'aide

Les trois critères de monétisation (Durabilité, Propension, Lien offre) ne sont affichés que dans
`fournee.html` (jauges des tuiles L, le n°1 par défaut). Le fournil, le garde-manger et le comptoir
ne les montrent pas : rien à y ajouter.

- Chaque nom de critère devient un `<button type="button" class="jauge-aide">` relié par
  `aria-describedby` à un `<span role="tooltip" class="pq-cache">` qui porte le texte d'aide
  (lu par les lecteurs d'écran, sans attribut title).
- Textes dans les chaînes de traduction de la page (`aides` en FR et EN), injectés par le gabarit.
- Les tuiles coupent leur contenu (`overflow:hidden`) : la bulle visible est un seul élément
  `#pq-bulle` en `position:fixed` hors de la grille, rempli avec le texte du critère et placé
  par `bulle.js` sous le nom (au-dessus s'il manque de place), bornée à 8 px des bords de l'écran.
- Ouverture : survol de la souris, focus clavier, appui au doigt (bascule). Fermeture : sortie de
  la souris, perte du focus, Échap, appui ailleurs, défilement ou redimensionnement.
- Le calcul de position est une fonction pure (`Bulle.placer`) testée sous Node ; la partie DOM
  passe par délégation sur le document (le gabarit peut être réaffiché).

## 2. Couleurs (Bronze, Boulangerie classique, Nuit ; Contraste élevé inchangé)

Dans le bloc Bronze de `charte.css` et `IMPOSEES` de `tools/palette-oklch.js` :

| Variable | Avant | Après | Contraste |
|---|---|---|---|
| petrir-btn-fond / bord | #B20206 | #F27016 | texte #2C1910 : 5,67 |
| petrir-btn-survol | #8C0105 | #E0650F (assombri) | texte #2C1910 : 4,82 |
| petrir-btn-texte / petrir-pain | #FFFFFF | #2C1910 | |
| petrir-grigne | #B20206 | #F27016 (entailles couleur du fond) | |
| lire-fond | #BD470C | #A9642E | texte blanc : 4,62 |
| lire-survol | #9C3A0A | #8A4F24 (assombri) | texte blanc : 6,51 |

Survol, actif et focus gardent leurs règles ; seules les valeurs changent. Les contrastes sont
vérifiés par les tests existants de `tests/charte.test.js` (paires lire et petrir-btn).
