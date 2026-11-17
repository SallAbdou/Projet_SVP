# Lot 9 · Retours sur la maquette : design

Date : 2026-11-17 · Statut : validé (plan transmis par la session parente, sans nouvelle validation) · Suit le lot 8 (PR n°10 fusionnée)

## Intention

Six retours reçus sur la maquette front : une charte jugée monotone, un libellé de publication plus explicite, un « Tout chaud » en couleur chaude et animé, des boutons « Lire la source » plus visibles, des blocs news qui se lisent en entier sans défiler, et un « Rassis » noir écrit en blanc.

Constat avant travaux (Chrome headless, données de démo, 60 combinaisons mesurées) : aucun `.tile-body` ne défile aujourd'hui avec la fournée de démo, mais la grille à hauteur fixe (`grid-auto-rows: 264px`) tronque les titres des blocs S sur deux lignes (« Un modèle OCR lit les factures et contrats... ») et laisse un grand vide sous la n°1. Avec des résumés plus longs (vraies données n8n), le contenu des blocs M et L défilait. Le correctif porte donc sur la grille et sur la troncature.

## 1. Charte plus vive et centralisée

Nouveau fichier `charte.css`, chargé par toutes les pages avant les autres styles : variables `:root` pour toute la palette, puces d'état, bouton « Lire la source », animation « Tout chaud ». `parcours.css` perd son bloc `:root` (repris tel quel dans `charte.css`) et continue d'utiliser les mêmes noms de variables.

La base brun / crème / doré « Maillard » reste. On ajoute des accents vifs et chauds, et une couleur froide franche réservée aux liens externes pour qu'ils se détachent du reste.

| Variable | Valeur | Rôle |
|----------|--------|------|
| `--fond` | `#FBF5EA` | fond des pages (inchangé) |
| `--creme` | `#FFFDF8` | fond des tuiles et cartes (inchangé) |
| `--sable` / `--miel` | `#F3E6CF` / `#F6E7CC` | nav, bandeaux (inchangés) |
| `--bord` / `--bord-fort` | `#E7D6B8` / `#D9C29C` | bordures (inchangées) |
| `--texte` / `--doux` | `#2E1D12` / `#6B5443` | textes (inchangés) |
| `--brun` / `--brun-fonce` | `#8A4F1C` / `#5E3412` | liens internes (inchangés) |
| `--maillard` | dégradé `#FBE3A8 > #F2C46D > #E3A54A` | emplacement n°1 (inchangé) |
| `--braise` | `#C2410C` | **nouveau** : boutons principaux, anneau de focus, logo |
| `--braise-fonce` | `#9A3412` | **nouveau** : survol des boutons principaux |
| `--braise-vive` | `#F25C05` | **nouveau** : fin du dégradé « Tout chaud », lueur |
| `--croute` | `#FFB020` | **nouveau** : jaune croûte saturé, début du dégradé, bouton du message bref, bouton plein du comptoir |
| `--sur-titre` | `#B23A0B` | sur-titres (avant `#9A5B23`) |
| `--chaud-degrade` | `linear-gradient(135deg, #FFB020, #F25C05)` | puce « Tout chaud » |
| `--chaud-texte` | `#1F1208` | texte de la puce « Tout chaud » |
| `--petrir-fond` / `--petrir-texte` | `#FFE7B0` / `#7A3E00` | puce « À pétrir » |
| `--rassis-fond` / `--rassis-texte` | `#1C1714` / `#FFFFFF` | puce « Rassis » |
| `--source` / `--source-fonce` | `#0B5E6F` / `#08434F` | **nouveau** : bleu canard des liens « Lire la source » |
| `--barre-chaud` | `linear-gradient(180deg, #FFB020, #F25C05)` | barres « Tout chaud » des graphiques |
| `--barre-petrir` | `#C97F00` | barres « À pétrir » |
| `--barre-rassis` | `#2B2522` | barres « Rassis » (gris très foncé) |

### Contrastes (calculés par `Charte.contraste`, vérifiés par `tests/charte.test.js`)

| Texte ou élément | Fond | Rapport | Seuil |
|------------------|------|---------|-------|
| `--texte` | `--fond` | 14,88 | 4,5 |
| `--doux` | `--fond` | 6,51 | 4,5 |
| `--doux` | `--creme` | 6,95 | 4,5 |
| `--brun` (liens) | `--fond` | 6,02 | 4,5 |
| `--sur-titre` | `--fond` | 5,52 | 4,5 |
| blanc (bouton principal) | `--braise` | 5,18 | 4,5 |
| blanc (survol) | `--braise-fonce` | 7,31 | 4,5 |
| `--chaud-texte` | `#FFB020` (début du dégradé) | 10,00 | 4,5 |
| `--chaud-texte` | `#F25C05` (fin du dégradé) | 5,49 | 4,5 |
| `--petrir-texte` | `--petrir-fond` | 6,88 | 4,5 |
| `--rassis-texte` | `--rassis-fond` | 17,77 | 4,5 |
| blanc (« Lire la source ») | `--source` | 7,38 | 4,5 |
| blanc (survol) | `--source-fonce` | 10,90 | 4,5 |
| `--texte` (bouton du message bref) | `--croute` | 8,83 | 4,5 |
| contour : anneau de focus `--braise` | `--fond` | 4,77 | 3 |
| contour : anneau de focus `--braise` | `--sable` (nav) | 4,20 | 3 |
| contour : bouton `--source` | `--creme` | 7,26 | 3 |
| contour : bouton `--source` | `#E3A54A` (bas de la tuile n°1) | 3,43 | 3 |
| barre `--barre-petrir` | `--creme` | 3,17 | 3 |
| barre `--barre-rassis` | `--creme` | 14,86 | 3 |
| barre « Tout chaud » (`#F25C05`, partie basse) | `--creme` | 3,27 | 3 |

Remplacements dans les pages, `parcours.css` et le JS qui produit du HTML (`nav.js`, gabarits des pages) : fonds de page et de tuile, sur-titres, anneaux de focus, boutons principaux (« Pétrir un post », « Pétrir », bouton plein du fournil, `.bouton` du parcours, « Personnaliser », « Tout faire revenir »), choix de langue actif, logo, bouton du message bref. Les couleurs secondaires rares (bordures fines, ombres) restent en dur.

## 2. Fournil : « Valider et publier sur LinkedIn »

Le bouton qui ouvre la confirmation devient « Valider et publier sur LinkedIn » (EN « Confirm and post to LinkedIn »). La fenêtre de confirmation garde son titre et son bouton « Confirmer la publication ». `docs/demo/scenario-jury.md` (étape 10) est mis à jour.

## 3. « Tout chaud » en couleur chaude, animé

- Une fonction pure `Charte.puce(etat)` (dans `charte.js`) renvoie la classe de la puce pour tous les noms d'état utilisés dans le code : `vert`, `hot`, `chaud` donnent `puce puce-chaud` ; `orange`, `knead`, `enfourner` donnent `puce puce-petrir` ; `rouge`, `stale`, `rassis` donnent `puce puce-rassis` ; tout autre état donne `''`. `Charte.barre(etat)` renvoie la valeur CSS de la barre correspondante (`var(--barre-chaud)`...). La valeur `vert` de n8n ne change pas : seul l'affichage change.
- Les gabarits passent de `style="{{chip}}"` à `class="{{chip}}"` : fournée, garde-manger, comptoir (prochain sujet et extrait du garde-manger), fournil (choix du sujet et sujet en cours). Les barres de la fournée, du comptoir et la bande latérale du garde-manger utilisent `Charte.barre`, les pastilles de légende du comptoir aussi.
- `.puce-chaud` : dégradé braise, texte `--chaud-texte`, une petite braise (point clair lumineux) avant le texte, une lueur qui pulse doucement (2,4 s) et un léger glissement du dégradé. Sous `prefers-reduced-motion: reduce`, aucune animation (lueur fixe).
- Miniatures de la landing et de `/ta-fournee-type` : la tuile n°1 porte une puce « Tout chaud » (« Piping hot »).

## 4. « Lire la source » plus visible

- Fournée : le lien `.act[data-act="read"]` devient plein bleu canard (`--source`), texte et icône blancs, survol `--source-fonce`, y compris sur la tuile n°1. Les autres actions (« Mettre de côté », « Ignorer ») restent crème bordées. Tailles inchangées (36 px souris, 44 px toucher), anneau de focus `--braise` décalé de 2 px.
- Décision : en M, le texte « Lire la source » s'affiche désormais (il n'était qu'une icône) puisque la rangée peut passer à la ligne sans créer de défilement. En S, icône seule (texte masqué accessible), comme avant.
- Garde-manger : le lien « Lire la source » prend la classe `gm-source` au même style plein.

## 5. Blocs news lisibles sans défilement

- `.bento` : `grid-auto-rows: minmax(180px, auto)` au lieu de 264 px fixes ; `grid-auto-flow: dense` conservé. Une rangée prend la hauteur de son contenu le plus haut ; un bloc L s'étend sur deux rangées.
- `.tile-body` : plus de `overflow: auto` ni de `min-height: 0` (le corps ne rétrécit plus et ne défile plus).
- Blocs S : le titre n'est plus tronqué à deux lignes. Contenu par taille inchangé : S = rang, puce, source, titre, monétisation, actions ; M ajoute le résumé ; L ajoute « Pour toi », « Pourquoi cette couleur » et les scores.
- Le placement dense des mises en page prédéfinies ne change pas (`Bento.placer` et ses tests), donc pas de trou : chaque bloc remplit ses cases, seule la hauteur des rangées varie.
- Vérification : script Chrome headless (outil local, hors dépôt) qui mesure, pour les 5 mises en page (dont une personnalisée), en lecture et en mode Personnaliser, à 1440, 1280, 1024 et 375 px, en FR et EN : aucun `.tile-body` ni `.tile` avec `scrollHeight > clientHeight + 1`, aucun titre tronqué. Hauteur des blocs relevée pour juger l'équilibre.

## 6. « Rassis » en noir, écrit en blanc

`.puce-rassis` : fond `--rassis-fond`, texte blanc. Barres et bande latérale en `--barre-rassis`. Concerne fournée, garde-manger, comptoir et fournil (il n'existe plus de page « pain perdu »).

## Tests

- `tests/charte.test.js` : `luminance` et `contraste` (noir sur blanc 21, couleur sur elle-même 1, symétrie, valeurs connues), `puce` et `barre` pour tous les noms d'état et un état inconnu, et contrôle de la palette : chaque couple du tableau ci-dessus, lu dans `charte.css`, atteint son seuil.
- Le reste est visuel : vérifié dans le navigateur (captures avant et après dans `docs/demo/captures-lot9/`, console sans erreur).

## Hors périmètre

- Thème sombre, refonte typographique, nouvelles pages.
- Couleurs secondaires rares restées en dur (bordures fines, ombres, bandeaux d'attente).
