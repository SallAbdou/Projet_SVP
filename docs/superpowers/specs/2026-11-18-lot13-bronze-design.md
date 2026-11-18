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
