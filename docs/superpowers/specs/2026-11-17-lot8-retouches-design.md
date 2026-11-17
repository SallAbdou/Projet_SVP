# Lot 8 · Retouches après la démo à blanc : design

Date : 2026-11-17 · Statut : validé (trois demandes de Delio transmises par la session parente, sans nouvelle validation) · Suit le lot 7 (PR n°9 fusionnée)

## Intention

La démo à blanc a fait ressortir trois retouches : un accès au QR code plus visible et toujours au même endroit, des mises en page toutes faites pour la fournée (comme le panneau de mise en page de la page « Nouvel onglet » de Microsoft Edge), et un bouton « Lire la source » présent sur chaque news, au même format que les autres actions.

## 1. QR code en haut à droite de la landing

- Le bloc « Scanne pour la démo » du corps de la landing (lot 6, grand écran seulement) est retiré. L'unique entrée vers le QR devient un bouton de l'en-tête, en haut à droite, visible à toutes les largeurs.
- Bouton : icône QR + libellé « QR code » (« QR code » aussi en anglais), hauteur 44 px, `aria-haspopup="dialog"`, `data-focus="entete-qr"`. Il est produit par `Parcours.enteteHtml({ qr: true })` (attribut `data-qr` sur `[data-entete]`), placé avant le lien « Se connecter » et le choix de langue. Sous 400 px, le libellé passe en texte masqué accessible pour que l'en-tête tienne sur deux lignes au plus.
- Clic : `parcours.js` appelle `window.__app.ouvrirQr()` si la page la définit. La landing ouvre alors une fenêtre modale reprenant la modale du faux e-mail (`verifie-tes-mails`, lot 1) : voile `.voile`, boîte `.boite` avec barre de titre et bouton « Fermer », `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. Contenu : `assets/qr-landing.svg` en grand (jusqu'à 320 px, `alt` « QR code vers https://team42svp.vercel.app/ »), l'adresse `https://team42svp.vercel.app/` en clair, une phrase d'aide et un lien « Version à imprimer » vers `/qr`.
- Comportement : focus sur « Fermer » à l'ouverture, Tab et Maj+Tab bouclent dans la boîte, Échap, « Fermer » ou un clic sur le voile ferment, et le focus revient au bouton QR de l'en-tête.
- Les styles `.voile` et `.boite` passent dans `parcours.css` (une seule source pour les deux modales) et le piège à focus devient `Parcours.clavierModale(e, fermer)`, utilisé par la landing et par `verifie-tes-mails`.

## 2. Mises en page prédéfinies de la fournée

### Données (`bento.js`, pures et testées)

Grille de 4 colonnes, `grid-auto-flow: dense`, S = 1×1, M = 2×1, L = 2×2. Chaque préréglage est une disposition complète (8 emplacements) ; les emplacements affichés sont listés dans l'ordre, les autres suivent dans l'ordre par défaut avec leur taille par défaut.

| id | Nom FR / EN | News | Emplacements affichés | Cases |
|----|-------------|------|------------------------|-------|
| `concentree` | Concentrée / Focused | 3 | n1 L, n2 S, n3 S, graph M | 8 = 2 rangées |
| `equilibree` | Équilibrée / Balanced | 5 | n1 L, n2 M, n3 M, graph M, n4 S, n5 S (disposition par défaut actuelle) | 12 = 3 rangées |
| `informative` | Informative / Informative | 7 | n1 M, n2 M, n3 M, graph M, n4 S, n5 S, n6 S, n7 S | 12 = 3 rangées |
| `graphique` | Graphique en avant / Chart first | 3 | graph L, n1 M, n2 S, n3 S | 8 = 2 rangées |

Justification des ajustements : « Concentrée » garde la n°1 en grand mais réduit n2 et n3 en S pour fermer la grille en 2 rangées ; « Informative » n'utilise aucun bloc L (« blocs compacts ») et met n1 à n3 en M pour que 7 news et le graphique remplissent exactement 3 rangées.

API ajoutée à `Bento` :
- `PRESETS` : liste ordonnée `[{ id, newsCount, tiles }]` (les 4 ci-dessus), `PRESET_PERSO = 'personnalisee'`, `PERSO_KEY = 'pq-layout-perso'`.
- `appliquerPreset(layout, id)` : copie de la disposition du préréglage (ou copie de `layout` si l'id est inconnu).
- `presetCourant(layout)` : id du préréglage identique (même nombre de news, mêmes emplacements dans le même ordre, mêmes tailles), sinon `'personnalisee'`.
- `placer(layout, available, colonnes)` : placement « dense » des emplacements affichés, `[{ id, col, row, w, h }]` (sert aux tests « sans trou » et aux miniatures).
- `choisirMiseEnPage(layout, perso, id)` : renvoie `{ layout, perso }`. Préréglage : si la disposition courante est personnalisée, elle devient `perso` ; la disposition devient le préréglage. `'personnalisee'` : la disposition devient `perso` s'il existe, sinon rien ne change.
- `loadPerso(storage)` (disposition normalisée ou `null`) et `savePerso(storage, layout)`.

« Disposition par défaut » applique `equilibree` par `choisirMiseEnPage` (la mise en page personnalisée reste récupérable).

### Interface (`/fournee`, mode « Personnaliser »)

- En tête de la barre d'édition, un groupe « Mise en page » (`role="radiogroup"`, `aria-labelledby`), une carte par choix (`role="radio"`, `aria-checked`, `tabindex` 0 sur la carte cochée et -1 sur les autres) : miniature schématique (SVG dessiné par `BentoUI.miniature` à partir de `Bento.placer` : rectangles aux bonnes proportions, n°1 doré, graphique en brun), nom et une ligne de description. La carte « Personnalisée » montre la disposition personnalisée enregistrée (ou la disposition courante si aucune).
- Flèches gauche/haut et droite/bas : carte précédente ou suivante (en boucle), qui est cochée et appliquée aussitôt, focus suivant ; Début et Fin vont aux extrémités ; Espace et Entrée cochent la carte focalisée.
- Choisir applique la disposition, l'enregistre (`pq-layout`, et `pq-layout-perso` si besoin) et l'annonce dans la zone `aria-live` `#pq-toast` (« Mise en page « Concentrée » appliquée »). Toute modification manuelle (glisser, flèches, taille, nombre de news) coche « Personnalisée » d'elle-même puisque `presetCourant` est recalculé à chaque rendu.
- Descriptions FR : Concentrée « 3 news, la n°1 en grand, et ton graphique » ; Équilibrée « 5 news, la disposition par défaut » ; Informative « 7 news en blocs compacts, et ton graphique » ; Graphique en avant « Ton graphique en grand, puis 3 news » ; Personnalisée « Ta disposition à toi : déplace ou redimensionne un bloc ». EN traduit.
- Cartes en grille `repeat(auto-fill, minmax(150px, 1fr))`, 44 px minimum, focus visible, carte cochée bordée en brun.

## 3. « Lire la source » sur toutes les news

- Dans chaque bloc news (S, M, L), la rangée d'actions contient « Pétrir un post », « Mettre de côté », « Ignorer » et « Lire la source ». Ce dernier est un lien `<a class="act" data-act="read">` au même style que les deux boutons : icône lien externe + texte en M et L, icône seule en S (texte masqué accessible au-dessus de 640 px, comme les autres actions), 36 px à la souris, 44 px au toucher.
- `href` = `Bento.safeUrl(url)`, `target="_blank" rel="noopener"`, `aria-label` et `title` « Lire la source : <titre> (nouvel onglet) » (« Read the source: <title> (new tab) »).
- Garde-manger : le lien « Lire la source » a déjà le style des autres boutons secondaires (`.gm-sec`) ; on y ajoute la même icône lien externe. Comptoir : aucun lien vers une source, rien à changer.

## Scénario du jury

Les étapes qui mentionnent le bloc « Scanne pour la démo » renvoient au bouton « QR code » en haut à droite. L'étape 8 peut montrer le choix d'une mise en page.

## Hors périmètre

Mise en page synchronisée entre appareils (reste en `localStorage`), annulation d'un changement de mise en page, préréglages pour les grilles à 2 colonnes ou 1 colonne (sous 1100 px la grille se replie comme aujourd'hui et la miniature reste celle des 4 colonnes).
