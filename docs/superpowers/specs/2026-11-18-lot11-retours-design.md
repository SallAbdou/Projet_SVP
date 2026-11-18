# Lot 11 · Retours sur l'interface : design

Date : 2026-11-18 · Statut : validé par Delio (retours transmis par la session parente, sans nouvelle validation) · Suit le lot 10 (PR n°13 fusionnée)

## Intention

Une collègue et Delio ont relu l'interface complète. Leurs retours : des couleurs plus franches et plus cohérentes (plus de noir dans les graphiques, un seul style pour tous les « Pétrir »), une fournée plus lisible (moins de chiffres, actions compactes sur une ligne, graphique masqué par défaut), des titres plus parlants sur le fournil et le garde-manger, et une page profil plus classique.

## Partout

### 1. « Pour toi » et l'ampoule

- `.ampoule` : 20 px de côté, pleine, couleur `--croute` (#FFB020, jaune croûte), le trait brun #8A4F1C du lot 10 reste pour la détacher des fonds dorés.
- Texte « Pour toi » : `--brun-fonce` (#5E3412), graisse 600. Contraste vérifié par `tests/charte.test.js` : brun foncé sur crème et sur le doré le plus sombre du bloc n°1 (#E3A54A), seuil 4,5.

### 2. Couleurs des graphiques (comptoir, fournée, barre de fraîcheur du garde-manger)

- « Tout chaud » : dégradé braise (inchangé, `--barre-chaud`).
- « À pétrir » : ambre (inchangé, `--barre-petrir` #C97F00).
- « Rassis » : gris chaud clair `--barre-rassis` #D6CCC2 avec un contour intérieur de 2 px `--barre-rassis-contour` #7D7068 (contraste du contour sur crème ≥ 3:1, vérifié). Nouvelle fonction pure `Charte.contourBarre(etat)` qui renvoie `inset 0 0 0 2px var(--barre-rassis-contour)` pour un état rassis et `''` sinon ; les gabarits l'appliquent en `box-shadow`.
- La puce « Rassis » (étiquette d'état) reste noire écrite en blanc (lot 9).

### 3. Un seul style « Pétrir »

Nouvelle classe `.btn-petrir` dans `charte.css` : fond braise, texte #FFFDF8, 700, 14 px, hauteur 44 px, pilule, survol braise foncé, anneau de focus braise. Appliquée à : bouton principal des blocs de la fournée, « Pétrir » du garde-manger, « Pétrir » de l'aperçu du garde-manger sur le comptoir (qui était en contour), boutons « Pétrir » de l'écran de choix du fournil. Le bouton « Pétrir à nouveau » du fournil (régénérer) reste secondaire : ce n'est pas un départ vers le fournil.

### 4. Nav

- Icône de « La fournée du jour » : flamme simple en trait (SVG 24, `stroke-width` 2 comme les autres).
- Accroche : FR « L'actu IA, pétrie pour toi. », EN « AI news, kneaded for you. ». L'ancienne accroche n'existe que dans `nav.js` (l'en-tête du parcours n'a pas d'accroche, la landing non plus) : un seul endroit à changer. Logo inchangé.

## La fournée du jour

### 5. Sous-titre

FR « Les sujets croustillants, tout juste sortis du four. », EN « Crispy topics, fresh out of the oven. ».

### 6. Blocs news

- Source : étiquette `.etiquette-source`, fond brun foncé #5E3412, texte #FFF6E3, 700, coins de 6 px (forme distincte des puces d'état, toutes en pilule, et teinte brune distincte du noir de « Rassis »).
- Retirés : la ligne « Monétisation x/15 » et la ligne de détail des scores (durabilité, propension, lien offre) du bloc L, car ce détail n'apparaît nulle part ailleurs. `Bento.totalScore` reste (utilisé par d'autres modules ou tests) mais n'est plus affiché.
- Actions, dans l'ordre : « Pétrir un post » (texte, `.btn-petrir`), « Mettre de côté » (icône signet seule), « Ignorer » (icône croix seule), « Lire la source » (icône + texte). Les icônes seules gardent leur libellé dans un `span` masqué visuellement (`.pq-sr`) et un `title`. Cibles : 36 px à la souris, 44 px au toucher (`pointer: coarse`).
- Une seule ligne grâce à des requêtes de conteneur sur le bloc (`container-type: inline-size`) plutôt que sur la taille S/M/L, car la largeur réelle dépend de l'écran (une M fait 500 px à 1440, un bloc fait moins de 300 px à 375) :
  - largeur de contenu ≥ 400 px : les quatre actions comme ci-dessus ;
  - moins de 400 px : « Lire la source » passe en icône seule (libellé masqué visuellement, nom accessible complet inchangé) ;
  - moins de 280 px (bloc S sur grand écran) : « Pétrir un post » se raccourcit en « Pétrir » (la fin « un post » est masquée, donc le nom accessible suit le texte visible).
  Équilibre retenu pour S : Pétrir garde un mot visible, car c'est l'action principale et une icône seule serait ambiguë ; les trois autres sont des icônes. `flex-wrap` reste en filet de sécurité (zoom 200 %).

### 7. « Lire la source »

Le bleu canard est remplacé par un prune : `--source` #6E2A5E, `--source-fonce` #521F46 (texte blanc ≥ 4,5, prune sur crème et sur le doré ≥ 3, vérifiés). La variable garde son nom, donc le garde-manger suit.

### 8. Graphique masqué par défaut

- La disposition (`pq-layout`) passe en version 3 avec un champ booléen `graphique` (affiché ou non). `Bento.isShown(layout, 'graph')` renvoie `layout.graphique === true`.
- `normalizeLayout` accepte la version 3 et migre la version 2 : une disposition v2 identique à l'une des quatre anciennes mises en page prédéfinies devient la nouvelle mise en page de même nom ; toute autre v2 garde ses blocs et ses tailles, graphique masqué. Le reste (null, v1, illisible) donne la disposition par défaut.
- Mises en page prédéfinies revues pour rester sans trou quand le graphique est masqué, et sans trou quand on l'affiche (le graphique, taille L, est rangé en tête de l'ordre, il apparaît donc en haut à gauche) :

| Id | News | Graphique | Blocs affichés (masqué) | Rangées masqué / affiché |
|---|---|---|---|---|
| concentree | 3 | masqué | n1 L, n2 M, n3 M | 2 / 3 |
| equilibree (défaut) | 5 | masqué | n1 L, n2 M, n3 M, n4 M, n5 M | 3 / 4 |
| informative | 7 | masqué | n1 L, n2 M, n3 M, n4 à n7 S | 3 / 4 |
| graphique | 3 | affiché | graph L, n1 M, n2 S, n3 S | sans objet / 2 |

- Descriptions des cartes : « 3 news, la n°1 en grand » / « 3 news, #1 large » ; « 7 news, la n°1 en grand puis des blocs compacts » / « 7 news, #1 large then compact blocks ».
- Nouvelle fonction pure `Bento.basculerGraphique(layout)` (copie avec `graphique` inversé). Dans la barre du mode Personnaliser, bouton `.tool` `data-act="graph-toggle"`, `aria-pressed` = graphique affiché, texte « Afficher le graphique » / « Masquer le graphique » (EN « Show the chart » / « Hide the chart »). La disposition est enregistrée comme les autres changements.
- `presetCourant` compare aussi `graphique` : masquer le graphique de « Graphique en avant » ou l'afficher dans une autre mise en page donne « Personnalisée ». Choisir « Graphique en avant » l'affiche.
- `loadPerso` accepte v2 et v3 (via `normalizeLayout`).

## Le fournil

### 9. En-tête

Titre sur deux lignes dans un seul `h1` (deux `span` en `display:block`) : « Le fournil » / « L'IA pétrit, tu enfournes » ; EN « The kitchen » / « AI kneads, you bake ». Sous-titre FR « Ton post déjà rédigé, à partir du sujet que tu as choisi. Tu ajustes, tu copies, tu publies. », EN « Your post already written, from the topic you picked. You adjust, copy and post. ».

### 10. Écran de choix

Le `h2` « Sur quel sujet veux-tu écrire ? » reste dans le code (structure des titres : les `h3` « Les news du jour » et « Mis de côté » en dépendent) mais est masqué visuellement (`.pq-sr`, classe ajoutée à `charte.css`).

## Le garde-manger

### 11. En-tête

Titre « Le garde-manger » (inchangé) ; sous-titre FR « Ce que tu as mis de côté. Chaque article indique sa fraîcheur. », EN « What you set aside. Each article shows its freshness. ».

### 12. Filtres colorés

Classes `.gm-filtre` et `.gm-filtre-{tout|chaud|enfourner|rassis}` (les styles en ligne disparaissent). Inactif : fond crème, contour 2 px de la couleur de l'état (brun pour Tout, braise, ambre #C97F00, noir) et une pastille ronde de 10 px de cette couleur devant le libellé. Actif (`aria-pressed="true"`) : rempli de la couleur de l'état (brun foncé texte blanc, braise texte blanc, ambre texte #1F1208, noir texte blanc) et précédé d'une coche « ✓ » à la place de la pastille : l'état actif se voit donc à la forme, pas seulement à la couleur. Contrastes texte vérifiés. Les puces d'état de la liste sont déjà aux couleurs de la charte (braise animée, ambre, noir).

### 13. Encart du bas

Titre FR « Tes choix d'aujourd'hui font une meilleure fournée pour demain », EN « Today's choices make a better batch tomorrow » ; texte d'explication inchangé.

## Mon profil

### 14. Page de compte

- Section `h2` « Informations » (EN « Details ») : lignes libellé / valeur « Prénom », « E-mail ».
- Section `h2` « Préférences » (EN « Preferences ») : « Métier », « Thématiques », « Relation avec l'IA », « Langue des articles », en lignes simples (`dl`, libellé à gauche, valeur à droite, qui passent l'une sous l'autre sous 640 px). Les thématiques sont jointes par des virgules.
- Bouton « Modifier mes préférences » (lien vers `/questionnaire`, style contour brun) et bouton « Se déconnecter » (même logique que la nav : `Auth.seDeconnecter()` puis `/`).
- Données lues depuis `Auth.utilisateurCourant()` (`prenom`, `email`, `profil`). Fonction pure `Profil.lignes(u, lang, libelle)` dans un nouveau `profil.js`, testée (valeurs vides remplacées par « Non renseigné » / « Not set »).

## Hors champ

Logo (nouvelle image plus tard), calculs des KPI, back simulé, landing.

## Scénario jury

`docs/demo/scenario-jury.md`, étape 8 : plus de « monétisation », actions en icônes, graphique masqué par défaut puis affiché via Personnaliser ; étape 12 : filtres colorés.
