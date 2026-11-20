# Lot 21 : passe unslop complète (accueil, fournée du jour, comptoir)

Branche `feat/lot21-unslop`, partie de `main` à jour (f683952, lot 20 fusionné). Une passe du skill `unslop` = un commit, pour pouvoir annuler une passe précise avec `git revert <commit>`.

| Commit | Passe |
| --- | --- |
| `6aa4b77` | captures de départ |
| `b2f86fb` | 1 espacement |
| `1029156` | 2 couleur |
| `8076533` | 3 icônes |
| `bd75322` | 4 textes |
| `ef56a8b` | 5 typographie |
| `eb252cb` | 6 mise en page |
| `3ff30d8` | 7 détails |
| `53604c3` | 8 visuels |
| `b502b5f` | 9 mouvement |
| `decf5b2` | ajustement après vérification (espace insécable) |

Rien n'est poussé, aucune PR ouverte.

## 1. Audit initial (signes trouvés, avant toute modification)

Niveau jugé : **slop léger**, donc mode polissage du skill (garder la palette, les polices, la mise en page et le visuel ; corriger ce que l'audit trouve). Les passes ont toutes été appliquées sans attente, comme demandé.

### Commun (charte.css, parcours.css, nav.js)
- Fond de page avec lavis radial crème en haut (`--fond-page`, charte.css:36).
- Puce « Tout chaud » : dégradé de teintes qui défile, lueur colorée qui pulse, point qui respire en boucle (charte.css:75-83).
- Barres « chaudes » des graphiques en dégradé vertical de deux teintes (`--barre-chaud`).
- Bouton Pétrir : ombre colorée orange (charte.css:95), graisse 800, pilule.
- Graisses 700 et 800 partout (titres, logo, rangs, boutons, libellés).
- Tout en pilule (`border-radius:999px`) : boutons, langues, puces, rangs, compteurs.
- Interlettrage négatif sur tous les h1 à h3, y compris les petits titres (parcours.css:8).
- Icônes de la nav en trait 2, menu mobile en 20 px trait 2.
- Compteur du garde-manger en pastille colorée dans la nav.
- Valeurs d'espacement hors grille de 4 : 6, 7, 10, 14, 18, 22, 26, 34, 44, 60.

### Accueil (index.html)
- Surtitre en capitales espacées « VEILLE IA POUR SOLOPRENEURS » (`.sur-titre`).
- Titre du héros en Fraunces 800.
- Aperçu bento : n°2 à n°7 remplis de barres grises de remplissage (`.mini-ligne`).
- Aperçu : ombre colorée sous la tuile dorée.
- « Comment ça marche » : trois cartes égales avec pastilles numérotées rondes (gabarit).
- Points finaux sur la légende de l'aperçu et la mention de démo du pied de page.
- Affirmations non vérifiables dans les étapes : « Toutes les 3 heures », « des dizaines de sources fiables ».

### Fournée du jour (fournee.html)
- Surtitre en capitales espacées (l.150), h1 en 800 (l.151).
- Rang, score, total de monétisation, valeurs des jauges, boutons en 700 ou 800.
- Actions, rang, bouton Personnaliser, bouton du message, « Données d'exemple » en pilule.
- Tuile n°1 : ombre colorée dorée et anneau autour du rang.
- Halo d'arrivée depuis le comptoir : grande lueur floue colorée qui pulse.
- Carte de mise en page cochée : anneau coloré diffus.
- Glyphes en guise d'icônes : poignée ⠿, flèches ↑ ↓ dans les outils Personnaliser.
- Icônes d'action en traits 2 et 2,2.
- Tailles hors échelle : 11,5 et 12,5 px.
- Sous-titre et message d'attente terminés par un point.
- Focus en 2 px quand le reste du site est en 3 px.

### Comptoir (comptoir.html, comptoir.js)
- Titre de salutation « Bonjour Léa, / Voici ce que tes fournées ont généré ».
- Anglicisme « on cook » dans le sous-titre.
- Écarts en pourcentage sans référence (« +38 % », « +21 % », « +150 % ») à côté de « +2 vs mois dernier ».
- Analyse qui commence par « Sers-les vite ! » (point d'exclamation).
- Barres en dégradé, coins très arrondis, trois couleurs sans légende visible.
- Chiffres clés en Fraunces 800 sans chiffres tabulaires.
- Four : vapeur et lueur animées en boucle infinie.
- Flèches « → » écrites dans le texte des liens (lues par les lecteurs d'écran).
- « Inclut des données d'exemple » en pilule pointillée.
- États vides courts terminés par un point.

## 2. Direction (cinq lignes)

- **Produit** : chaque matin, une sélection d'actus IA notées et résumées pour un solopreneur, prête à devenir un post LinkedIn.
- **Caractère** : chaleureux, artisanal, précis sur les chiffres.
- **Monde** : le fournil au petit matin, farine, croûte dorée, papier kraft.
- **Moments** : la tuile n°1 dorée de la fournée (et sa réplique dans l'aperçu de l'accueil), le four du comptoir.
- **Signature** : le n°1 doré, seul élément doré de chaque écran.

## 3. Détail des passes

Notation : fichier, élément, avant → après.

### Passe 1, espacement (`b2f86fb`)
- parcours.css `.entete` : padding 18px 32px → 16px 32px ; `.entete-droite` gap 10px 16px → 8px 16px ; `.logo` gap 10 → 8 ; `.logo-icone` 38 → 40 px.
- parcours.css `.carte` padding 32px 34px → 32px (mobile 24px 18px → 24px 16px) ; `.liens-bas` gap 18 → 16 ; `form` gap 18 → 16 ; `.champ` gap 6 → 8 ; `.choix` gap 10 → 12 et étiquettes 12px 14px → 12px 16px.
- parcours.css `.mini-bento` rangées 86 → 88 px, gap 10 → 8 ; `.mini-tuile` gap 7 → 8 ; `.etapes` gap 18 → 16 ; `.etape` padding 22 → 24, gap 10 → 12 ; `.section-titre` marge basse 18 → 16 ; `.entete-qr` padding 14 → 16 ; `.qr-contenu` padding 22 → 24, gap 14 → 16.
- index.html figure de l'aperçu gap 10 → 12 ; section finale margin-top 40 → 48, gap 14 → 16.
- nav.js : `.pq-nav` et panneau gap 26 → 24 ; liens gap 10 → 12 ; bloc du bas gap 14 → 16 ; bloc avatar padding 14 → 16, gap 10 → 12.
- fournee.html et comptoir.html : nav padding 28px 18px → 28px 16px, gap 26 → 24 ; `main` padding 40px 44px 60px → 40px 48px 64px, gap 22 (fournée) et 26 (comptoir) → 24 ; bloc de titre gap 6 → 8.
- fournee.html : `.tile` padding 20px 22px → 20px 24px ; `.jauges` gap 7 → 8, padding 12px 16px 14px → 12px 16px ; mode sans défilement : padding 22px 32px → 24px 32px, gap 14 → 16, grille 14 → 12, tuile 14px 18px → 16px, corps 5 → 4 ; message gap 14 → 12, padding gauche 18 → 16 ; mises en page gap 10 → 12 ; graphique 10 → 8 et 6 → 4 ; états vide et attente gap 14 et 10 → 16 et 12 ; barre d'édition 12px 18px → 12px 16px et padding 14px 18px → 16px ; erreur 14px 18px → 12px 16px ; boutons 0 18px → 0 20px.
- comptoir.html : `.kpis` gap 14 → 16 ; cartes de chiffres padding 16px 18px → 16px 20px ; sections 22px 24px → 24px ; colonne de droite gap 18 → 16 ; barres gap 14 → 16 (mobile 6 → 8), valeur 6 → 4 ; bandeau d'attente 12px 18px → 12px 16px ; lignes du garde-manger gap 10px 18px → 8px 16px ; `.four-lien` 10px 12px 14px → 12px 12px 16px ; `.btn-plein` 0 18px → 0 20px.

### Passe 2, couleur (`1029156`)
- charte.css `--fond-page` : lavis radial crème + dégradé linéaire → dégradé linéaire seul (farine vers sable, même famille). Contraste élevé reste uni.
- charte.css `.puce-chaud` : dégradé croûte, braise vive, croûte + lueur orange → aplat `--croute`, sans ombre ; point sans halo.
- charte.css `--barre-chaud` : dégradé croûte vers braise vive → `var(--braise-vive)` (aplat qui garde 3:1 sur la crème, déjà vérifié par les tests).
- charte.css `--chaud-degrade` supprimé (plus utilisé).
- charte.css `.btn-petrir` : ombre orange diffuse → `var(--ombre-1)` (ombre brune neutre de la charte). Fond, texte et survol imposés inchangés.
- parcours.css `.mini-tuile.or` et fournee.html `.tile[data-tile="n1"]` : ombre dorée colorée → `var(--ombre-1)`. Dégradé Maillard du n°1 gardé (signature).
- fournee.html `.tile[data-tile="n1"] .rank` : anneau or haut → retiré.
- fournee.html `.pq-halo` : liseré + lueur floue de 26 à 30 px → liseré croûte de 3 à 5 px seul.
- fournee.html `.mep[aria-checked="true"]` : anneau coloré diffus → retiré (la bordure de 2 px suffit).

### Passe 3, icônes (`8076533`)
- fournee.html outils Personnaliser (tuiles et graphique) : glyphe ⠿ → icône SVG « poignée six points » 14 px trait 1,5 ; ↑ ↓ → flèches SVG 14 px trait 1,5 (les `aria-label` existants restent).
- fournee.html texte d'aide : « la poignée ⠿ » → « la poignée à six points » (EN « the six-dot handle »).
- fournee.html icônes Mettre de côté, Ignorer, Lire la source : trait 2 et 2,2 → 1,5.
- nav.js icônes des liens : trait 2 → 1,5 ; icône Menu 20 px trait 2 → 18 px trait 1,5.
- comptoir.html « Voir ma fournée → » et « Tout le garde-manger → » : flèche dans le texte → texte seul + icône flèche SVG décorative (`aria-hidden`), donc plus de « flèche droite » lue à voix haute.

### Passe 4, textes (`bd75322`)
- comptoir.html h1 : « Bonjour Léa, / Voici ce que tes fournées ont généré » → « Ce que tes fournées ont généré » (EN « What your batches brought in »). Le prénom n'est plus lu dans ce gabarit.
- comptoir.html sous-titre : « Chaque matin, on cook les nouveautés IA pour toi. » → « Chaque matin, on prépare les nouveautés IA pour toi » ; « Tu choisis ce que tu sers à ton audience. » → sans point (EN « we cook » → « we prepare »).
- comptoir.html écarts : « +{n} % » → « +{n} % vs mois dernier » (EN « vs last month »), même règle pour les baisses.
- comptoir.js analyse : « Sers-les vite ! Tes posts sur des sujets **tout chaud** font plus d'audience que les autres. » → « Tes posts sur des sujets **tout chaud** font plus d'audience que les autres : sers-les vite. » (EN « …than the others, so serve them fast. »).
- comptoir.html états vides : points finaux retirés (« Rien de nouveau au four pour l'instant », « Rien de côté pour l'instant »).
- fournee.html sous-titre et message d'attente : points finaux retirés.
- index.html légende de l'aperçu et mention de démo du pied de page : points finaux retirés.
- Gardés : les phrases des étapes, de l'aide Personnaliser et des erreurs (paragraphes).

### Passe 5, typographie (`ef56a8b`)
- Polices inchangées (Fraunces + DM Sans, déjà chargées par Google Fonts). Sur index.html, fournee.html et comptoir.html, le lien Google Fonts charge Fraunces en **500 et 600** au lieu de 500, 700 et 800. Les autres pages gardent leur lien.
- Graisses 700 et 800 → 600 dans fournee.html (15), comptoir.html (11), nav.js (8), parcours.css (16), charte.css (3, dont puces, étiquettes de source et bouton Pétrir).
- Grands titres en 500 : h1 fournée et comptoir, `.heros h1` (avec interlettrage −0,02em à 48 px), `.titre`, `.section-titre`, titre d'attente, « Tu as tout passé en revue ».
- Titres de tuiles et de sections du comptoir explicitement en 600.
- Surtitres : 13 px 600/700, capitales, interlettrage 0,08em → 14 px 500 en casse normale (fournée, comptoir, `.sur-titre` du parcours).
- parcours.css `h1,h2,h3` : interlettrage −0,01em → 0, graisse 600 par défaut.
- Chiffres clés du comptoir (32 px) : 800 → 500 + `tabular-nums` ; valeurs des barres (fournée, comptoir) 700 → 500 + `tabular-nums` ; bilan « Ce que ta veille a rapporté » en `tabular-nums`.
- Tailles : 12,5 → 13 px (3), 11,5 → 12 px, 16,5 → 16 px, 10,5 → 11 px (`.mini-puce`), h1 mobile 30 → 32 px.

### Passe 6, mise en page (`eb252cb`)
- parcours.css « Comment ça marche » : trois cartes crème égales avec pastille ronde → trois colonnes séparées par un filet en haut, numéro en chiffre Fraunces 20 px couleur surtitre, gouttière 16 → 32 px (mobile 24). Sections, ordre et textes inchangés.
- Héros (texte à gauche, aperçu à droite), grille bento, colonnes du comptoir : inchangés, déjà conformes.

### Passe 7, détails (`3ff30d8`)
- Rayons selon la taille au lieu de la pilule partout :
  - charte.css `.puce` et `.etiquette-source` : 999 → 6 px (toujours la même forme, lot 20 respecté) ; `.btn-petrir` 999 → 10 px.
  - fournee.html `.act`, bouton Personnaliser, « Tout faire revenir » : 999 → 10 ; bouton du message 999 → 8 ; `.rank` 999 → 6 (padding 10 → 8) ; `.tool` 12 → 10 ; `.mep` 14 → 10 ; `.mep-mini` 8 → 6 ; `.tile` 18 → 16 ; `.jauges` 14 → 8 ; états vide et attente 18 → 16 ; barres 10/3 → 4/2.
  - comptoir.html `.btn-plein`, `.btn-ligne` 999 → 10 ; sections 18 → 16 ; encart d'analyse 12 → 8 ; bandeau d'attente 14 → 12 ; barres 14/4 → 6/2.
  - nav.js groupe de langues 999 → 12, boutons de langue 999 → 8, bouton Menu 999 → 10.
  - parcours.css `.langues` 999 → 12 et boutons 999 → 8 ; `.bouton`, `.bouton-secondaire`, `.entete-qr` 999 → 10 ; `.mini-rang` 999 → 4 ; `.carte` 22 et 18 → 16 ; `.mini-tuile` 14 → 12.
- fournee.html « Données d'exemple » et comptoir.html « Inclut des données d'exemple » : pilule pointillée → texte 13 px discret.
- nav.js compteur du garde-manger : pastille miel 700 → chiffre 12 px couleur douce, tabulaire (libellé accessible inchangé).
- comptoir.html : **légende** ajoutée sous le graphique (carrés Tout chaud, À pétrir, Rassis, `aria-hidden` car chaque barre annonce déjà son état).
- fournee.html focus : 2 px braise → 3 px `--focus`, comme le reste du site.

### Passe 8, visuels (`53604c3`)
- index.html aperçu bento : barres grises → vrais contenus de la fournée d'exemple (`data/fournee.json`) :
  - n°1 : titre d'exemple existant + étiquette de source « The Decoder » (source du n°1 de la fournée d'exemple).
  - n°2 et n°5 (tuiles larges) : puce d'état + titre réel tronqué à deux lignes.
  - n°3 à n°7 (petites tuiles) : puce d'état réelle (À pétrir, Rassis).
  - Traductions EN des deux titres et des états.
- parcours.css : `.mini-tete`, `.mini-titre-petit`, placement de l'étiquette ; mobile : rangées 70 → 80 px, padding 8, titre du n°1 14 px.
- Aucune image générée. Prompt proposé plus bas.

### Passe 9, mouvement (`b502b5f`)
- charte.css `.puce-chaud` : animations `pq-braise` et `pq-braise-point` supprimées (puce immobile).
- comptoir.html four : vapeur qui monte en boucle et lueur qui pulse → vapeur fixe (opacité 0,8), lueur fixe.
- Nouvelle variable `--courbe: cubic-bezier(0.22,1,0.36,1)` dans charte.css, utilisée par le bouton Pétrir (0,12 s ease → 0,14 s), les actions des tuiles (nouvelle transition de couleur 0,14 s), `.bouton` et `.bouton-secondaire` (nouvelle transition de couleur), le four (0,16 s), le message d'annulation et le pain qui lève.
- Gardés, parce qu'ils disent quelque chose : le pain qui lève pendant que la fournée chauffe, le liseré d'arrivée (2 battements), l'apparition du message d'annulation. Tous coupés sous `prefers-reduced-motion`.

### Ajustement après vérification (`decf5b2`)
- comptoir.js : espace insécable avant les deux-points de l'analyse (à 390 px, « : » partait seul en début de ligne).

## 4. Tests adaptés

Suite complète `node --test "tests/*.test.js"` : **274 sur 274 au vert** au départ et après chaque passe.

| Test | Fichier | Avant | Après | Raison |
| --- | --- | --- | --- | --- |
| icône flamme pour la fournée du jour | tests/nav.test.js:84 | `stroke-width="2"` | `stroke-width="1.5"` | passe 3, un seul trait pour toutes les icônes |
| phraseAnalyse FR | tests/comptoir.test.js:117 | « Sers-les vite ! Tes posts… » | « Tes posts… que les autres : sers-les vite. » | passe 4, plus de point d'exclamation (puis insécable) |
| phraseAnalyse EN | tests/comptoir.test.js:124 | « Serve them fast! Your posts… » | « Your posts… so serve them fast. » | passe 4 |
| bouton Pétrir en pastille | tests/charte.test.js:274 | `border-radius:999px` | `border-radius:10px` | passe 7, rayon de contrôle au lieu de la pilule |
| animation Tout chaud | tests/charte.test.js:315 | coupée sous reduced-motion | renommé « puce Tout chaud immobile, sans boucle ni lueur » : vérifie l'absence d'animation et d'ombre | passe 9, plus d'animation du tout |

## 5. Suggestions non appliquées (garde-fous ou hors périmètre)

- **Couleurs imposées** : le bouton Pétrir #F27016 et Lire la source #A9642E côte à côte font deux accents chauds forts sur chaque tuile ; le skill voudrait un seul accent. Gardés (IMPOSEES).
- **Métaphore boulangère** : gardée telle quelle (fournée, pétrir, comptoir, garde-manger, Tout chaud, Rassis…).
- **Dégradé Maillard du n°1** : c'est un dégradé tonal dans une seule famille, donc admis ; gardé comme signature.
- **Ampoule « Pour toi »** en jaune croûte plein : le skill veut des icônes couleur du texte. Gardée (choix d'un lot précédent) ; à passer en trait 1,5 couleur `--brun` si tu veux aller plus loin.
- **Affirmations à confirmer** sur l'accueil : « Toutes les 3 heures » et « des dizaines de sources fiables ». Si elles ne sont pas vraies telles quelles, les rendre précises (par exemple le nombre réel de sources) ou les retirer.
- **Chips d'état en pilule** : passées à 6 px ; si le jury doit retrouver les pastilles rondes des démos précédentes, ce seul point se règle dans `.puce` et `.etiquette-source` (charte.css).
- **Visuel du héros** : le skill préfère une scène pleine largeur. Prompt à générer si tu le veux (non généré) :
  > Wide 16:9 photograph of an artisan bakery workbench at dawn, warm window light from the left, flour dusted on dark oak, a single golden sourdough loaf with a deep Maillard crust on the right third, kraft paper and a linen cloth, soft shallow depth of field, calm empty warm cream wall on the left half for text, natural colors, no people, no text, no logos.
  À placer derrière le héros, texte sur la moitié gauche vide, aperçu bento qui monte du bas.
- **Écrans non passés** : fournil, garde-manger, profil, questionnaire, connexion, 404. Ils héritent seulement des changements partagés (charte.css, parcours.css, nav.js : fond, puces, bouton Pétrir, graisses, rayons, nav). Leurs titres inline restent en Fraunces 800 et leurs surtitres éventuels en capitales. La 404 garde « Attendez, on cook ».
- **Pied de page de l'accueil** : le lien « Confidentialité » est décalé vers le bas (hauteur tactile de 44 px sans `align-items:center` sur `.pied`). Défaut antérieur, non corrigé ici.
- **Libellés de barres coupés** à 390 px (« Prompti ng ») : césure automatique antérieure, non corrigée.

## 6. Vérifications

- Tests : 274 sur 274.
- Captures (Chrome headless piloté par le protocole DevTools, script local hors repo, compte démo Léa après `?demo=reset`) dans `docs/demo/captures-lot21/` :
  - `avant-*` et `apres-*` : accueil 1280 et 390 ; fournée et comptoir en 1280x800 et 390 px pleine page dans les 4 thèmes (bronze, classique, nuit, contraste) ; fournil, garde-manger, profil en Bronze 1280.
- Console : aucune erreur JavaScript sur toutes les pages capturées. Seule entrée : `favicon.ico` en 404 sur le serveur local (antérieur, sans effet sur Vercel si le favicon y est servi, non vérifié).
- Relu à l'œil : accueil 1280 et 390, fournée Bronze 1280, Contraste 1280, Nuit 390, comptoir Bronze 1280, Nuit 1280, Classique 390.

## 7. Ce qui n'est pas vérifié

- Les captures `apres-*` ont été prises avant l'ajustement de l'espace insécable (seule différence : la coupure de ligne de l'analyse du comptoir à 390 px).
- Les captures de Classique 1280, Bronze 390, Contraste 390 et Nuit 1280 de la fournée n'ont pas été relues une par une (générées, sans erreur console).
- Contraste AA : non recalculé à la main pour les nouveaux couples ; les couples existants sont couverts par tests/charte.test.js (vert), la puce Tout chaud utilise un couple déjà testé (`chaud-texte` sur `croute`) et les barres chaudes un couple déjà testé (`braise-vive` sur `creme`).
- Focus clavier : la règle 3 px `--focus` est en place, parcours clavier complet non rejoué.
- `prefers-reduced-motion` : règles relues, non émulé dans le navigateur.
- Mode Personnaliser (icônes de la poignée et des flèches) et message d'annulation : non capturés.
- Rendu sur Vercel (production) : non vérifié, rien n'est poussé.

---
Skill utilisé : unslop de Damir Sokolovsky (@heydamir), CC BY 4.0.
