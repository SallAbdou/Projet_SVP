# Lot 14 : palette fluide et bouton Pétrir en pastille

## Constat

- Le bouton « Pétrir un post » en forme de baguette rend mal : les grignes du `::before` passent derrière le texte.
- Trop d'accents concurrents : orange vif `--braise-vive` (#F25C05), jaune `--croute` (#FFB020), prune `--source`, doré Maillard du n°1 et noir pur de Rassis (#1C1714).
- Des couleurs écrites en dur hors variables (graphiques, miniatures `MINI_COULEURS`, SVG, styles en ligne) ignorent les thèmes.

## Références

- Méthode OKLCH : garder teinte et chroma, faire varier la luminosité par pas réguliers pour une rampe perçue comme égale (uxdesign.cc « OKLCH, explained for designers », documentation des jetons Verdigris).
- Patine du bronze : vert-de-gris désaturé (#63826B « Vintage Verdigris », #7A8B6F « Statue Bronze »), cuivre #B87333.
- Pain : croûte #B78B43, mie crème #F4E8D1.

## Décisions

### Rampes par famille (OKLCH, écrites en hex)

| Famille | Teinte H | Rôles |
|---|---|---|
| Farine / mie | 75 à 82 | fond, crème, sable, miel, traits, bords |
| Brun (texte) | 45 à 52 | texte, texte-2, doux, brun-foncé, panneau |
| Bronze cuivré (accent unique des actions) | 48 à 58 | braise, braise-foncé, doré, focus, sur-titre, cuivre, liens |
| Or (Maillard, croûte, pétrir) | 75 à 85 | or-haut, or-bas, croûte, pétrir, pain |
| Patine (Lire la source) | 185 | source, source-foncé |
| Cendre (Rassis) | 245, chroma 0,01 | rassis, barre rassis |
| Statuts | 145 vert, 30 rouge | ok, erreur |

Le générateur (`tools/palette-oklch.js`) donne la conversion et sert de mémoire du raisonnement. Les hex restent écrits dans `charte.css` (pas de calcul au chargement).

### Accents

- Accent dominant : bronze cuivré #9F4D1A (braise, focus, doré).
- `--braise-vive` désaturé (#D27528), `--croute` adouci (#F4BB5B) : Tout chaud reste chaud et animé, sans jaune fluo.
- « Lire la source » : vert-de-gris #345E59, nettement distinct du bronze.
- Rassis : ardoise cendrée #3A4147 écrite en #F4F7FB, froide et éteinte, plus de noir pur.
- n°1 : dégradé Maillard plus fin (or-haut #FAE4B5 vers or-bas #E3B778).

### Profondeur

- `--fond-page` : léger halo crème en haut et dégradé fond vers sable. Contraste élevé garde un fond uni.
- `--ombre-1`, `--ombre-2` : ombres teintées brun (rgba sur 60,32,14) au lieu du gris ou du noir.

### Thèmes

- Bronze (défaut) : rampes ci-dessus.
- Boulangerie classique : garde ses fonds, textes et braise d'avant le lot 13 (son identité), hérite des nouveaux accents secondaires (source patine, Rassis ardoise, Tout chaud adouci).
- Nuit : mêmes teintes en rampe sombre (fond L 0,17), accents éclaircis.
- Contraste élevé : inchangé sauf la source qui passe en patine très foncée #033C36 ; aucun adoucissement, fond uni.

### Bouton Pétrir

Pastille arrondie (`border-radius:999px`), fond uni `--pain-haut`, bord `--pain-bas`, texte `--pain-texte`, petit pain SVG inline à gauche (`aria-hidden="true"`, `focusable="false"`, couleurs par `currentColor` et variables). 44 px de haut minimum, focus visible, appui (`:active`), sans transition sous `prefers-reduced-motion`. Plus de `::before`. Le SVG est ajouté dans chaque gabarit (comptoir, fournée, fournil x2, garde-manger).

### Couleurs en dur

Tout littéral de couleur hors des blocs de thème de `charte.css` passe par une variable. Nouvelles variables au besoin (ex. couleurs de miniatures, séries de graphique). Un test parcourt CSS, HTML et JS et échoue sur tout littéral restant, hors liste d'exceptions motivées.

## Tests

- Contrastes étendus aux nouvelles paires (source sur crème, rassis-texte sur rassis-fond, pain-texte sur pain-haut, couleurs de graphique sur crème).
- Teinte de la source : verte (ni prune ni bronze).
- Rassis : ni noir pur ni blanc pur, luminance de fond entre 0,03 et 0,1.
- Bouton : pastille, SVG décoratif présent sur chaque gabarit, plus de `::before`.
- Absence de couleur en dur.
