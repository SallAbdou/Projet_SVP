# Lot 34 : les cartes dans la fournée et la collection de pains

Retour utilisateur sur les lots 32 et 33 : le principe des cartes plaît, mais la découverte doit se faire dans « La fournée du jour », pas dans un dialogue à l'ouverture de l'app. Le lot 34 déplace le jeu et étend le lot 33 ; il ne refait rien.

## Décisions
- **Rituel plein écran retiré** (`rituel.js` supprimé, ainsi que son enchaînement avec la visite, `pq:rituel-fin`). La logique « nouvelle fournée du jour » reste : chaque jour, les cartes du jour sont recachées.
- **Vue cartes retirée.** Une fois les cartes face cachée dans la grille bento, la vue cartes du lot 32 faisait doublon (mêmes news, mêmes actions, deuxième bascule à expliquer au jury). Le retournement s'applique à la vue principale. Les styles `.jeu-carte` restent pour la collection. Le champ `vue` d'un ancien compte est simplement ignoré.
- **Personnaliser** : les tuiles face cachée se déplacent et se redimensionnent comme les autres (on arrange des emplacements, pas des news). Pendant le mode, le dos n'est pas cliquable (pas de retournement par erreur en glissant) ; il garde son texte.
- **Points** : +10 points de cuisson une seule fois par jour, à la première carte découverte (`Jeu.POINTS.decouverte`). Par carte, le gain pousserait à cliquer sans lire et changerait l'économie du lot 33 (niveaux, démo Mitron puis Boulanger). L'essentiel des points reste la cuisson.
- **Levain** : nourri le jour où au moins une carte est découverte.
- **Collection** : une carte entre dans la collection quand elle est découverte (plus à l'ouverture de la page).

## Mémoire (`pq-jeu`, version 1, par compte)
Champs ajoutés, facultatifs : `decouvertes: { date: 'AAAA-MM-JJ', refs: [ref] }` (cartes retournées aujourd'hui ; une autre date vaut liste vide), `pointsJour: 'AAAA-MM-JJ'` (dernier jour où la découverte a rapporté ; relit `rituelPoints` du lot 33). Chaque carte gagne `fraicheur` (hot, knead, stale au moment de la découverte). `rituel` et `vue` ne sont plus lus.

## Fournée
- Jeu actif et compte connecté : chaque news non découverte aujourd'hui s'affiche face cachée dans sa tuile. Le dos est un bouton (`data-act="decouvrir"`) : pain dessiné, « n°3 », rareté en toutes lettres avec ses grignes, cadre selon la rareté (jamais la couleur seule), nom accessible « Découvrir la news n°3, rareté Croûte ». Le dos du n°1 dit « À garder pour la fin » : ordre suggéré, pas imposé.
- Clic, Entrée ou Espace : le dos pivote, la tuile se révèle avec ses actions ; aucune animation si `data-animations="off"` ou reduced-motion. Le focus passe sur le titre de la tuile et le contenu est annoncé (`Jeu.annonce`).
- En-tête : « 2 cartes sur 5 découvertes » et bouton « Tout retourner » tant qu'il reste une carte cachée.
- Jeu coupé (case du profil) ou sans compte : fournée face visible, comme avant le lot 32.

## Visite guidée
Quand l'étape « La fournée du jour » ou « À toi de pétrir » s'affiche, `visite.js` émet `pq:visite-etape` ; la fournée découvre alors le n°1 (compté comme découverte), pour que « Pétrir un post » existe. Le texte de l'étape 4 dit que les news arrivent face cachée.

## Garde-manger : « Collection de pains »
L'onglet « Ma collection » devient « Collection de pains ». En haut, la progression par famille (lignes du lot 33). Dessous, l'historique de toutes les cartes découvertes, du plus récent au plus ancien : date de découverte, rareté, fraîcheur au moment de la découverte, titre, source, famille, « Cuite ». Deux listes déroulantes filtrent par rareté et par famille.

## Données d'exemple
Léa (compte démo, sans entrée `pq-jeu`) : 8 cartes découvertes sur cinq jours passés, trois familles, deux cuites, fraîcheur renseignée, `exemple: true`. Aucune découverte du jour : la fournée de démo s'ouvre face cachée. `?demo=reset` efface `pq-jeu`.
