# Lot 10 · Retours sur le comptoir : design

Date : 2026-11-17 · Statut : validé par Delio (retours transmis par la session parente, sans nouvelle validation) · Suit le lot 9 (PR n°11 et n°12 fusionnées)

## Intention

Une collègue a relu la page Le comptoir (`/comptoir`). Ses retours : un accueil plus chaleureux et mieux accordé, des titres plus directs, un graphique allégé, une phrase d'analyse qui pousse à l'action, et une carte « Tout juste sorti du four » plus parlante, remplacée par un four dessiné qui mène à la news n°1. En bonus, une ampoule « éclair de génie » devant chaque « Pour toi ».

## 1. En-tête

Titre sur deux lignes (chaque ligne dans un `span` en `display:block`, donc un seul `h1`) :

| | Ligne 1 | Ligne 2 |
|---|---|---|
| FR | « Bonjour {prénom}, » (sans prénom : « Bonjour, ») | « Regardons ensemble ce que tes fournées ont généré » |
| EN | « Hi {name}, » (sans prénom : « Hi, ») | « Let's look at what your batches brought in » |

Sous-titre sur deux lignes, même principe :

| | Ligne 1 | Ligne 2 |
|---|---|---|
| FR | « Chaque matin, on cook les nouveautés IA pour toi. » | « Tu choisis ce que tu sers à ton audience. » |
| EN | « Every morning, we cook the latest AI news for you. » | « You choose what to serve your audience. » |

## 2. Titre des KPI

FR « Tes posts, ces 30 derniers jours », EN « Your posts, these last 30 days ».

## 3. Graphique

Titre FR « Tes meilleures fournées » (EN « Your best batches »), sous-titre FR « Impressions de tes 6 derniers posts » (EN « Impressions of your last 6 posts »). Sous les barres, les libellés courts restent, sans la pastille « ● » de couleur. La légende « Tout chaud / À pétrir / Rassis » disparaît. Les barres gardent leurs couleurs (`Charte.barre`) et leur libellé accessible (qui cite toujours l'état du sujet, seule trace de la couleur pour un lecteur d'écran).

La tuile graphique de `/fournee` n'a déjà ni pastille ni légende : rien à changer, on garde les mêmes titres qu'aujourd'hui sur la fournée (le titre « Tes meilleures fournées » est propre au comptoir).

## 4. Phrase d'analyse

Nouvelle fonction pure `Comptoir.phraseAnalyse(ratio, lang)` dans `comptoir.js`, qui renvoie trois morceaux `{ avant, gras, apres }` (le gabarit échappe tout, donc le gras est un `<strong>` dans le gabarit) ou `null` si le ratio est `null`.

- FR : « Sers-les vite ! Tes posts sur des sujets » **« tout chaud »** « font en moyenne {ratio} fois plus d'audience que les autres. » ; ratio avec virgule décimale (1,8), entier sans décimale (2), espace insécable avant « ! ».
- EN : « Serve them fast! Your posts on » **« piping hot »** « topics get on average {ratio} times more reach than the others. » ; point décimal.

Le calcul du ratio (`Comptoir.analyse`) ne change pas. Sans données : phrase neutre existante (« Publie et reporte tes chiffres… »), pendant le chargement : « Mise au four… ».

## 5. Le four illustré

La carte sombre (puce, titre, « Pour toi », bouton « Pétrir le post ») est remplacée par une carte claire contenant :

- le titre court `h2` « Tout juste sorti du four » (EN « Fresh out of the oven ») au-dessus ;
- un four en SVG en ligne, décoratif (`aria-hidden="true"`, `focusable="false"`) : corps brun, porte vitrée dont la lueur braise rougeoie, pain doré « Maillard » à l'intérieur, trois volutes de vapeur qui montent au-dessus. Animations CSS (`pq-four-lueur`, `pq-four-vapeur`) entièrement coupées sous `prefers-reduced-motion: reduce` ;
- en légende, le titre de la news n°1 du jour.

Le four, son titre de news et une petite mention « Voir dans la fournée → » forment **un seul lien** vers `/fournee#n1`, de libellé accessible « Voir la première news du jour : {titre} » (EN « See today's first news: {title} »). La news n°1 reste calculée comme aujourd'hui (`Bento.pickTopics(articles, 1, refs ignorées du jour)`).

Pour ne pas dupliquer le dessin, le four est un `<symbol id="pq-four">` défini une fois dans la page et affiché par `<use>` : dans le lien quand la fournée est prête, dans un bloc sans lien (« La fournée chauffe… ») tant qu'elle est en attente ou en chargement. Si la fournée est vide ou en erreur : texte existant « Rien de nouveau au four pour l'instant. » et bouton « Voir la fournée du jour ».

Arrivée sur `/fournee#n1` : une fonction pure `Bento.cibleAncre(hash, visibles)` choisit le bloc visé (`#n1` à `#n7` ; si ce bloc est masqué par la mise en page, le premier bloc news visible dans l'ordre n1 à n7 ; `null` si l'ancre n'est pas une news ou si aucun bloc n'est visible). Au premier rendu où la bento est affichée, la page : met le focus (sans défilement brusque) sur le bouton principal du bloc (« Pétrir un post »), fait défiler en douceur jusqu'au bloc (instantané sous `prefers-reduced-motion`), et ajoute une classe `pq-halo` 2 s (halo doré `--croute` qui pulse ; halo fixe sans animation sous `prefers-reduced-motion`). Ceci ne se fait qu'une fois par chargement de page. Comme le moteur restaure la position de défilement après chaque rendu, le défilement est lancé juste après le rendu (`setTimeout` 0), et la classe halo est réappliquée à chaque rendu tant que les 2 s ne sont pas écoulées.

## 6. Ampoule devant « Pour toi »

Une ampoule « éclair de génie » en SVG en ligne (`aria-hidden="true"`, `focusable="false"`), couleur `--eclair` ajoutée à `charte.css` (`#E0A100`, jaune ampoule ; décorative, donc pas de seuil de contraste texte), classes `.pour-toi` (flex, ampoule alignée sur la première ligne) et `.ampoule` dans `charte.css`. Occurrences : blocs news de `/fournee` (paragraphe « Pour toi », visible en taille L) et en-tête du sujet sur `/fournil`. La carte du comptoir qui l'affichait disparaît. L'ampoule n'apparaît que si le texte « Pour toi » est présent.

## Hors champ

Pas de changement de calcul des KPI, du graphique ni de la news n°1 ; pas de changement du back simulé.

## Scénario jury

`docs/demo/scenario-jury.md`, étape 11 : montrer la phrase d'analyse et cliquer le four, qui ramène sur la fournée avec la news n°1 mise en évidence.
