# Lot 13 · Bronze : comptoir, scores, pain « Pétrir », palette et thèmes : design

Date : 2026-11-18 · Statut : interprétation retenue par la session parente, sans nouvelle validation de Delio · Suit le lot 12 (PR n°15 fusionnée, branche `feat/lot13-bronze` partie de `origin/main`)

## Intention

Dernière passe visuelle avant le jury : un comptoir plus direct, les scores de monétisation de retour dans la fournée, un bouton « Pétrir » qui ressemble enfin à un pain, une palette chaude « bronze » inspirée du tableau Pinterest de Delio, et le choix de quatre thèmes de couleur dans « Mon profil ».

## 1. Comptoir (`comptoir.html`, `comptoir.js`)

| Élément | Avant | Après (FR) | Après (EN) |
|---|---|---|---|
| Titre, ligne 2 | Regardons ensemble ce que tes fournées ont généré | Voici ce que tes fournées ont généré | Here's what your batches brought in |
| Lien sous le four | Voir dans la fournée → | Voir ma fournée → | See my batch → |
| Phrase d'analyse | Sers-les vite ! … font en moyenne 1,8 fois plus d'audience que les autres. | Sers-les vite ! Tes posts sur des sujets **tout chaud** font plus d'audience que les autres. | Serve them fast! Your posts on **piping hot** topics get more reach than the others. |

Logique pure :
- `Comptoir.analyse(posts)` renvoie `{ chaudGagne: boolean }` : vrai seulement si des posts « vert » ont des chiffres, si d'autres posts ont des chiffres, et si la moyenne d'impressions des verts est strictement supérieure à celle des autres. Le ratio disparaît (plus affiché nulle part).
- `Comptoir.phraseAnalyse(chaudGagne, lang)` renvoie `{ avant, gras, apres }` si `chaudGagne === true`, sinon `null` (la page affiche alors la phrase neutre existante).
- La phrase passe en gras (`font-weight:700`) et un peu plus grande (16 px au lieu de 14 px) ; « tout chaud » reste dans un `<strong>` découpé par le gabarit.

## 2. Fournée (`fournee.html`, `bento.js`)

### Scores réaffichés

- Chaque bloc news (S, M, L) : « Monétisation x/15 » (EN « Monetisation x/15 »), x = `Bento.totalScore(article)`, en Fraunces 15 px gras, sur une ligne au-dessus des actions.
- Blocs L seulement : « Durabilité d/5 · Propension p/5 · Lien offre o/5 » (EN « Shelf life d/5 · Shareability p/5 · Offer fit o/5 »), 12,5 px, couleur `--doux`.
- Contrainte : aucun défilement interne (`scrollHeight <= clientHeight` mesuré sur chaque bloc à 1440 px, 1100 px et 375 px) et la ligne d'actions reste sur une seule ligne. Si un bloc S déborde, la hauteur minimale des rangées passe de 180 à 196 px.

### Le n°1 ne commente pas sa couleur

- Bloc n°1 (doré « Maillard ») : la ligne « Pourquoi cette couleur : … » (`raisonFeu`) n'est plus rendue. Les blocs n°2 à n°7 en taille L la gardent.
- Règle pure testée : `Bento.montreRaison(id)` vaut `false` pour `n1`, `true` sinon.
- Vérifié à l'écran : le n°1 n'affiche ensuite que rang, puce d'état, source, titre, résumé, « Pour toi », scores et actions. Aucun autre texte visible ne parle du doré (le commentaire CSS « doré Maillard » et l'infobulle du rang « la news classée 1 du jour » ne sont pas des textes sur la couleur).

## 3. Bouton « Pétrir » en forme de pain (`charte.css`)

Le style `.btn-petrir` est commun (fournée, garde-manger, comptoir, fournil) : la refonte se fait une fois dans la charte.
- Forme : ovale allongé façon bâtard (`border-radius:50% / 50%` sur un bouton plus large que haut), hauteur minimale 44 px, marge intérieure horizontale 22 px.
- Croûte : dégradé `--pain-haut` vers `--pain-bas`, ombre portée légère et liseré intérieur plus sombre.
- Grignes : trois entailles obliques plus claires (`--pain-grigne`) dessinées par un `::before` en dégradés CSS, décoratives, sous le texte (`z-index`), sans contenu lu.
- Texte : `--pain-texte` (chocolat), contraste au moins 4,5:1 sur la teinte la plus sombre ET la plus claire de la croûte, et sur la grigne (testé).
- Survol : le pain s'assombrit un peu ; appui (`:active`) : il « s'enfonce » (`translateY(1px) scale(.97)` et ombre réduite). `transition` coupée sous `prefers-reduced-motion`.
- Focus : `outline:3px solid var(--focus)` décalé de 3 px.

## 4. Palette « Bronze » (thème par défaut)

Source : tableau Pinterest « Bronze wallpaper » (44 épingles, lu sans connexion le 2026-11-18, aucune action sur le tableau). Planches de couleurs relevées : Whipped Butter `#F2E6B3`, Cookie Crumble `#4B2E21`, Chocolate Ganache (chocolat très foncé), Belgian Waffle, Honeycomb, Maple Syrup (caramels), Vanilla / Caramel / Almond / Coffee / Mocca / Espresso, Mahogany / Cinnamon / Cognac / Caramel / Ember, Bronze / Rust Brown / Dark Garnet / Rich Mahogany. Dominante : chocolats et cafés profonds, caramels et bronzes cuivrés, crèmes champagne ; accents braise orangée et grenat.

Traduction dans la charte (rôles inchangés, valeurs nouvelles) :

| Rôle | Bronze | Inspiration |
|---|---|---|
| `--fond` | `#F6EDE1` | crème champagne |
| `--creme` (cartes) | `#FFFAF3` | vanilla foam |
| `--sable` (nav) | `#EEDFC9` | almond |
| `--miel` | `#F4E4CB` | whipped butter adouci |
| `--texte` | `#2A1710` | chocolate ganache |
| `--texte-2` | `#4A2F20` | coffee |
| `--doux` | `#67493A` | mocca |
| `--brun` (liens) | `#8A4A1F` | cognac / bronze foncé |
| `--brun-fonce` | `#4B2E21` | cookie crumble |
| `--sur-titre` | `#96461A` | rust brown |
| `--cuivre` (liserés) | `#A8642A` | bronze |
| Doré n°1 (`--maillard`) | `#F7DFA8` → `#E8BB6E` → `#D49B55` | honeycomb, maple syrup |
| Pain « Pétrir » | `#EDBB72` → `#C27A35`, grigne `#F8DDA6`, texte `#2A1408` | belgian waffle, caramel |

Les états restent identiques dans tous les thèmes : Tout chaud (dégradé braise animé), À pétrir (ambre `#FFE7B0` / `#7A3E00`), Rassis (noir écrit en blanc). Le prune « Lire la source » reste distinct de la braise.

## 5. Quatre thèmes

| Thème | `data-theme` | Principe |
|---|---|---|
| Bronze | `bronze` (défaut, aussi sans attribut) | palette ci-dessus |
| Boulangerie classique | `classique` | valeurs de la charte avant ce lot, à l'identique |
| Nuit | `nuit` | fond chocolat presque noir `#16100C`, textes crème, liens caramel ; boutons pleins éclaircis écrits en sombre (`--sur-plein`) |
| Contraste élevé | `contraste` | fond blanc, texte noir, bordures noires, couleurs d'action foncées, contrastes ≥ 7:1 sur le texte courant |

Mise en œuvre :
- Variables dans `charte.css` : `:root,[data-theme="bronze"]{…}`, puis `[data-theme="classique"]{…}`, `[data-theme="nuit"]{…}`, `[data-theme="contraste"]{…}`. Des sélecteurs d'attribut (et non `:root[…]`) pour que les aperçus du profil puissent porter leur propre thème.
- Les couleurs écrites en dur dans les pages applicatives (comptoir, fournée, garde-manger, fournil, profil, `nav.js`, `bento-ui.js`) passent en variables de rôle. Nouveaux rôles : `--texte-2`, `--trait` (séparateurs), `--cuivre`, `--sur-plein` (texte sur bouton plein), `--sur-clair` (texte sur doré ou croûte, toujours sombre), `--champ` et `--bord-champ` (zones de saisie), `--etiquette-fond` et `--etiquette-texte`, `--focus`, `--pain-*`.
- Le doré du n°1 garde la même teinte dans tous les thèmes et force son texte en `--sur-clair`.
- Contrastes : `tests/charte.test.js` lit chaque bloc de thème, fusionne avec le bloc par défaut et vérifie la même liste de couples par thème (4,5:1 texte, 3:1 graphiques et contours), avec la fonction `Charte.contraste` existante.

### Choix et mémorisation (`theme.js`, nouveau)

- Logique pure testée : `THEMES = ['bronze', 'classique', 'nuit', 'contraste']`, `normaliser(nom)` (inconnu → `bronze`), `cleCompte(u)` (e-mail en minuscules, sinon `abonneId`, sinon `null`), `lire(storage, cle)`, `enregistrer(storage, cle, nom)` sur la clé localStorage `pq-theme` = `{ version: 1, comptes: { [cle]: nom } }`.
- Application avant le premier rendu : `theme.js` est chargé dans le `<head>` des cinq pages protégées, juste après `garde.js`, et pose `data-theme` sur `<html>` d'après le compte connecté. Pages publiques (accueil, connexion…) : Bronze.
- `pq-theme` ajoutée à `Store.CLES_DEMO` : `?demo=reset` remet Bronze.
- Mode réel : même stockage local, par e-mail du compte ; une ligne dans `docs/branchement-back.md` indique qu'on pourra le ranger plus tard dans `user_metadata` de Supabase.

### Section « Apparence » de Mon profil

- Nouvelle carte entre « Préférences » et « Affine ta fournée » : titre « Apparence » (EN « Appearance »), phrase « Choisis les couleurs du site. Ton choix est gardé pour ton compte. » (EN « Pick the site's colours. Your choice is kept for your account. »).
- `<fieldset>` + `<legend>` « Thème de couleur » (EN « Colour theme »), 4 boutons radio natifs (`name="theme"`), chaque libellé contient un aperçu miniature décoratif (`aria-hidden`) portant `data-theme` : fond, carte, texte, doré et petit pain.
- Libellés : Bronze / Boulangerie classique (Classic bakery) / Nuit (Night) / Contraste élevé (High contrast).
- Changement immédiat : la page applique le thème sur `<html>` et l'enregistre ; message `role="status"` « Thème « X » appliqué. » (EN « “X” theme applied. »).

## 6. Documents

- `docs/demo/scenario-jury.md` : textes du comptoir, scores, bouton pain, thèmes.
- `docs/branchement-back.md` : ligne `pq-theme` / `user_metadata`.
- Captures avant/après : `docs/superpowers/captures/lot13/`.

## Hors périmètre

- Pages publiques (accueil, connexion, questionnaire…) : elles prennent la palette Bronze par les variables existantes mais ne proposent pas de choix de thème et leurs couleurs en dur ne sont pas migrées.
- Synchronisation du thème entre appareils (mode réel) : plus tard via `user_metadata`.

## Contrastes retenus (calculés par `Charte.contraste`, vérifiés par `tests/charte.test.js`)

| Couple | bronze | classique | nuit | contraste |
|---|---|---|---|---|
| `texte` sur `fond` | #2A1710 / #F6EDE1 : 14.75 | #2E1D12 / #FBF5EA : 14.88 | #F5EADB / #16100C : 15.87 | #000000 / #FFFFFF : 21 |
| `doux` sur `fond` | #67493A / #F6EDE1 : 6.99 | #6B5443 / #FBF5EA : 6.51 | #CDB7A0 / #16100C : 9.77 | #2B2B2B / #FFFFFF : 14.16 |
| `doux` sur `creme` | #67493A / #FFFAF3 : 7.8 | #6B5443 / #FFFDF8 : 6.95 | #CDB7A0 / #211812 : 9.03 | #2B2B2B / #FFFFFF : 14.16 |
| `brun` sur `creme` | #8A4A1F / #FFFAF3 : 6.57 | #8A4F1C / #FFFDF8 : 6.42 | #EAA866 / #211812 : 8.55 | #5C2600 / #FFFFFF : 12.12 |
| `sur-titre` sur `fond` | #96461A / #F6EDE1 : 5.68 | #B23A0B / #FBF5EA : 5.52 | #F0A660 / #16100C : 9.28 | #7A2400 / #FFFFFF : 10.1 |
| `braise` sur `fond` | #B83D0B / #F6EDE1 : 4.88 | #C2410C / #FBF5EA : 4.77 | #F2793A / #16100C : 6.8 | #9E2E08 / #FFFFFF : 7.37 |
| `sur-plein` sur `braise` | #FFFAF3 / #B83D0B : 5.45 | #FFFDF8 / #C2410C : 5.09 | #1A100A / #F2793A : 6.75 | #FFFFFF / #9E2E08 : 7.37 |
| `sur-plein` sur `source` | #FFFAF3 / #6E2A5E : 9.38 | #FFFDF8 / #6E2A5E : 9.58 | #1A100A / #DDA8CF : 9.42 | #FFFFFF / #4A1240 : 14.47 |
| `etiquette-texte` sur `etiquette-fond` | #F6EBDA / #4B2E21 : 10.41 | #FFF6E3 / #5E3412 : 9.89 | #F6EBDA / #5A3826 : 8.78 | #FFFFFF / #000000 : 21 |
| `sur-clair` sur `or-bas` | #2A1408 / #D49B55 : 7.17 | #2E1D12 / #E3A54A : 7.49 | #2A1408 / #D49B55 : 7.17 | #000000 / #D49B55 : 8.62 |
| `pain-texte` sur `pain-bas` | #1E0E05 / #BA7230 : 4.94 | #1E0E05 / #BA7230 : 4.94 | #1E0E05 / #BA7230 : 4.94 | #1E0E05 / #BA7230 : 4.94 |
| `pain-texte` sur `pain-grigne` | #1E0E05 / #F8DDA6 : 14.18 | #1E0E05 / #F8DDA6 : 14.18 | #1E0E05 / #F8DDA6 : 14.18 | #1E0E05 / #F8DDA6 : 14.18 |
| `petrir-texte` sur `petrir-fond` | #7A3E00 / #FFE7B0 : 6.88 | #7A3E00 / #FFE7B0 : 6.88 | #7A3E00 / #FFE7B0 : 6.88 | #7A3E00 / #FFE7B0 : 6.88 |
| `chaud-texte` sur `braise-vive` | #1F1208 / #F25C05 : 5.49 | #1F1208 / #F25C05 : 5.49 | #1F1208 / #F25C05 : 5.49 | #1F1208 / #F25C05 : 5.49 |
| `rassis-texte` sur `rassis-fond` | #FFFFFF / #1C1714 : 17.77 | #FFFFFF / #1C1714 : 17.77 | #FFFFFF / #1C1714 : 17.77 | #FFFFFF / #1C1714 : 17.77 |
| `focus` sur `fond` | #B83D0B / #F6EDE1 : 4.88 | #C2410C / #FBF5EA : 4.77 | #F2B36B / #16100C : 10.27 | #000000 / #FFFFFF : 21 |
| `bord-champ` sur `champ` | #8A6A48 / #FFFFFF : 4.96 | #8A6A48 / #FFFFFF : 4.96 | #9C8166 / #120D0A : 5.28 | #000000 / #FFFFFF : 21 |
| `pain-bas` sur `fond` | #BA7230 / #F6EDE1 : 3.27 | #BA7230 / #FBF5EA : 3.49 | #BA7230 / #16100C : 4.97 | #BA7230 / #FFFFFF : 3.79 |

Seuils : 4,5:1 pour le texte, 3:1 pour `focus`, `bord-champ` et la silhouette du pain (`pain-bas` sur `fond`). Contraste élevé : texte courant au moins 7:1 (testé).

## Décisions prises en cours de route

- Bronze : braise assombrie à `#B83D0B` (au lieu de `#C2410C`) pour garder 4,5:1 sur le fond champagne, plus foncé que l'ancien crème.
- Cuivre `#9E5A22` (Bronze) et `#9A5B23` (Classique) : l'ancien `#B87420` sous l'initiale de l'aperçu LinkedIn ne faisait que 3,7:1 avec le texte clair.
- Encadrés sombres (« Tes choix d'aujourd'hui… », « Avant d'enfourner ») : variables `--panneau`, `--panneau-texte`, `--panneau-doux`, restées sombres en Nuit.
- Le n°1 redéfinit localement ses variables de texte et de prune : il reste un bloc clair et doré dans tous les thèmes (testé).
- Fond « miel » pour le sélecteur de langue de la nav (le gris `--trait` du Contraste élevé ne passait pas).
- Ligne d'actions des petits blocs S sur deux lignes à 1180 px de large (quatre colonnes étroites) : déjà le cas avant ce lot (mesuré aussi sur la version d'avant), non corrigé ici.
