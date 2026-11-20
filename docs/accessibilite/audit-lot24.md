# Audit d'accessibilité, lot 24

Cible : WCAG 2.2 niveau AA, sans overlay. Audit manuel fait le 20 novembre 2026 sur la branche `feat/lot24-audit` (partie de `main` après la fusion de la PR #29, lot 23), serveur local, Chromium du navigateur intégré, compte démo Léa pour les pages connectées.

Pages parcourues : accueil (Miette, FAQ, chat de démo, modale QR), découvrir, questionnaire (6 étapes, au clavier seul), ta-fournee-type, vérifie-tes-mails (boîte de démo), créer-mot-de-passe, connexion, mot-de-passe-oublié, comptoir, fournée (mode normal et Personnaliser), fournil (choix du sujet, brouillon, modale de publication), garde-manger (vide et avec 2 articles), profil, confidentialité, qr, 404.

## Synthèse

| Gravité | Nombre |
|---|---|
| Majeure | 3 |
| Moyenne | 8 (dont A1, trouvé par axe) |
| Mineure | 9 (dont A2, trouvé par axe) |

Rien de bloquant au clavier : pas de piège, ordre logique, focus visible partout (contour 3 px), modales QR, boîte de démo et publication qui gardent et rendent le focus, chat et menu mobile fermables avec Échap, erreurs des champs texte bien reliées (`aria-invalid`, `aria-describedby`, focus sur le premier champ en erreur). Les faiblesses portent surtout sur les annonces aux lecteurs d'écran, le contraste des bordures de champs et les bulles d'aide.

## Problèmes relevés

Gravité : **majeure** = une personne ne peut pas accomplir une tâche ou perd une information importante ; **moyenne** = tâche possible mais pénible ou critère AA non respecté ; **mineure** = gêne légère ou bonne pratique.

### Majeurs

**M1. Réponses du chat de Miette non annoncées**
- Critère : 4.1.3 Messages d'état (AA)
- Page : accueil, élément `#chat .chat-fil`
- Constat : quand on choisit une question, la réponse s'ajoute dans le fil mais aucune zone `aria-live` ni `role="log"` n'existe ; le focus passe à la question suivante. Un lecteur d'écran n'annonce rien.
- Correction : `role="log"` (avec `aria-live="polite"`) sur un conteneur persistant, ou envoi du texte de la réponse dans une zone d'annonce hors de `#root` (voir M2).

**M2. Zones d'annonce recréées à chaque rendu**
- Critère : 4.1.3 Messages d'état (AA)
- Pages : toutes celles qui ont un `role="status"` ou `aria-live` dans `#root` : comptoir, fournée (« Mise au four… »), fournil, profil (thème appliqué, retour envoyé), vérifie-tes-mails (« C'est renvoyé ! »), questionnaire.
- Constat : `boot.js` remplace tout `#root` par `innerHTML` à chaque rendu. Une zone `role="status"` insérée déjà remplie est souvent ignorée par NVDA et JAWS (les `role="alert"` passent en général). Les toasts de fournée, fournil et garde-manger sont, eux, hors de `#root` et donc fiables.
- Correction : une zone d'annonce unique et persistante posée en dur hors de `#root` sur chaque page (comme le lien d'évitement), avec une petite fonction `annoncer(texte)` testée sous Node ; les pages l'appellent au lieu de compter sur les `role="status"` re-rendus.
- À confirmer au lecteur d'écran (procédure en fin de rapport).

**M3. Bordures des champs trop pâles**
- Critère : 1.4.11 Contraste du contenu non textuel (AA)
- Pages : questionnaire, connexion, mot-de-passe-oublié, créer-mot-de-passe (`.champ input`, couleur `--bord-fort`), fournil (`select` Ton et Langue, `textarea` du brouillon).
- Mesure : bordure `rgb(199,165,134)` à 2,2:1 contre le fond de la carte et 2,26:1 contre l'intérieur du champ (3:1 demandé). Le fond du champ et celui de la carte sont presque identiques : la bordure est le seul repère.
- Correction : utiliser `--bord-champ` (déjà employé par le profil, 4,65:1) ; ce n'est pas une couleur imposée.

### Moyens

**N1. Bulle d'aide des jauges qui disparaît quand on la survole**
- Critère : 1.4.13 Contenu au survol ou au focus (AA), condition « survolable »
- Page : fournée, boutons `.jauge-aide` (Durabilité, Propension, Lien offre), `bulle.js`
- Constat vérifié : la bulle s'affiche 8 px sous le nom ; dès que la souris quitte le bouton pour aller vers la bulle, `mouseout` la ferme. Impossible de la survoler (gênant avec une loupe d'écran).
- Correction : ne pas fermer si la souris part vers `#pq-bulle` ou y entre, fermer quand elle quitte la bulle ; délai court de fermeture pour franchir l'écart. Test unitaire sur la logique de décision.

**N2. Même défaut, en plus léger, sur la bulle de pause des animations**
- Critère : 1.4.13 (AA)
- Pages : partout où il y a « Tout chaud » (`animations.js`, `#pq-bulle-anim`)
- Constat : le cas « la souris entre dans la bulle » est prévu, mais il y a un écart de 6 px entre le bouton et la bulle, et rien ne ferme la bulle quand on la quitte.
- Correction : même mécanique que N1, partagée.

**N3. Bouton focalisable caché dans une image**
- Critère : 4.1.2 Nom, rôle et valeur (A) ; axe le signalera en « nested-interactive »
- Page : ta-fournee-type, `.mini-bento[role="img"]` qui contient le bouton « Tout chaud, mettre en pause l'animation »
- Constat : les enfants d'un `role="img"` sont masqués aux technologies d'assistance, mais le bouton reste dans l'ordre de tabulation : on tombe sur un élément muet.
- Correction : sortir le bouton de pause de l'aperçu, ou remplacer `role="img"` par un conteneur simple avec un texte masqué qui décrit l'aperçu.

**N4. Déplacements et tailles de blocs non annoncés**
- Critère : 4.1.3 Messages d'état (AA)
- Page : fournée en mode Personnaliser (boutons ↑ ↓, S M L, mise en page)
- Constat : le bloc bouge et le focus le suit (bien), mais rien n'est dit (« Emplacement n°1 descendu en position 2 », « Taille L »). Le toast « Mise en page appliquée » existe déjà pour la mise en page, pas pour ces actions.
- Correction : annoncer via `#pq-toast` (déjà hors de `#root`) ou la zone de M2.

**N5. Toast « Annuler » limité à 5 secondes**
- Critère : 2.2.1 Réglage du délai (A)
- Pages : fournée (Mettre de côté, Ignorer), garde-manger (Retirer)
- Constat : le toast et son bouton « Annuler » disparaissent après 5 s, même si le focus ou la souris est dessus. L'action reste rattrapable ailleurs (garde-manger, « tout faire revenir »), d'où une gravité moyenne.
- Correction : suspendre le minuteur tant que le focus ou la souris est dans le toast, et le relancer à la sortie.

**N6. Catégorie des barres donnée par la seule couleur**
- Critère : 1.4.1 Utilisation de la couleur (A)
- Page : comptoir, graphique « Tes meilleures fournées »
- Constat : chaque barre a la couleur de son état (Tout chaud, À pétrir, Rassis) sans légende visible ; la phrase « Tes posts sur des sujets tout chaud font plus d'audience » suppose qu'on distingue les couleurs. Les noms accessibles des barres disent bien l'état, la faille ne touche que la vue.
- Correction : légende visible avec les trois états, et l'état écrit sous chaque barre (ou un motif en plus de la couleur).

**N7. Effacement des données sans confirmation**
- Critère : 3.3.4 Prévention des erreurs (AA)
- Page : confidentialité, bouton « Effacer mes données »
- Constat : un clic supprime tout et renvoie à l'accueil, sans confirmation ni annulation.
- Correction : demander une confirmation (modale existante sur le modèle de la publication du fournil, ou second clic explicite « Oui, tout effacer »).

### Mineurs

**m1. Erreur peu utile sur la connexion à vide**
- Critère : 3.3.3 Suggestion après une erreur (AA)
- Page : connexion. Champs vides : message « E-mail ou mot de passe incorrect. » au lieu de « Indique ton e-mail » / « Indique ton mot de passe ».
- Correction : messages distincts pour les champs vides, comme au questionnaire.

**m2. Cases du consentement sans `aria-invalid`**
- Critère : 4.1.2 (A), 3.3.1 (A) déjà respecté par le texte
- Page : questionnaire étape 6, `#newsletter` et `#rgpd`
- Constat : le message est lié et le focus va sur la case, mais la case n'a pas `aria-invalid="true"` et rien ne la distingue visuellement en erreur (les champs texte passent en rouge).
- Correction : `aria-invalid` et un liseré d'erreur sur la ligne de la case.

**m3. Pastille du garde-manger dans le menu**
- Critère : 1.3.1 (A) / 2.4.4 (A)
- Pages : menu des pages connectées, lien « Le garde-manger » avec la pastille « 2 »
- Constat : la pastille porte un `aria-label` sur un `span` sans rôle (interdit en ARIA 1.2, ignoré par certains couples navigateur et lecteur d'écran) ; le lien peut se lire « Le garde-manger2 ».
- Correction : `aria-hidden="true"` sur le chiffre et un texte masqué « , 2 articles mis de côté ».

**m4. Bouton Personnaliser qui change de nom et d'état à la fois**
- Critère : 4.1.2 (A), bonne pratique
- Page : fournée. Le bouton passe de « Personnaliser » à « Terminer » et porte `aria-pressed`. Annoncé « Terminer, bouton, activé », ce qui est confus.
- Correction : garder un seul des deux mécanismes (libellé qui change sans `aria-pressed`, ou libellé fixe avec `aria-pressed`).

**m5. Titre de la page 404**
- Critère : 2.4.2 Titre de page (A)
- Page : 404. Titre « Attendez, on cook » : il ne dit pas que la page n'existe pas ; la barre « Cuisson 87 % » est un faux `progressbar` annoncé comme une vraie progression.
- Correction : titre « Page introuvable · Votre pAIn quotidien » (le h1 humoristique peut rester) ; barre décorative en `aria-hidden="true"`.

**m6. Lanceur du chat qui recouvre une partie du contenu**
- Critère : 2.4.11 Focus non masqué (AA), respecté de justesse
- Page : accueil à 640 px. Le lanceur fixe couvre en partie les éléments focalisés en bas d'écran (pastilles de l'aperçu, questions de la FAQ). Jamais entièrement masqués pendant le test.
- Correction : `scroll-padding-bottom` égal à la hauteur du lanceur.

**m7. Compteur de caractères du brouillon non relié**
- Critère : 1.3.1 (A), bonne pratique
- Page : fournil, « 592 / 3 000 caractères » sans `aria-describedby` vers la zone de texte (le profil le fait déjà).
- Correction : relier le compteur au `textarea`.

**m8. Libellé fautif**
- Critère : aucun (qualité)
- Page : fournée en Personnaliser, groupe « Taille de le graphique ».
- Correction : « Taille du graphique ».

## Contrôles conformes

- Clavier : Tab, Maj+Tab, Entrée, Espace, Échap, flèches dans les boutons radio du questionnaire et dans le groupe de mises en page. Aucun piège.
- Focus visible partout, contour `--focus` mesuré entre 3,6:1 et plus de 5:1 selon le fond (cartes crème, n°1 doré).
- Modales (QR, boîte de démo, publication) : focus initial dans la boîte, boucle Tab, Échap ferme et rend le focus au déclencheur. Chat non modal : Échap ferme et rend le focus au lanceur.
- Questionnaire : focus déplacé sur le titre de chaque étape, erreurs reliées et focus sur le premier champ en erreur.
- `autocomplete` présent sur prénom, e-mail, identifiant et mots de passe (1.3.5) ; collage jamais bloqué (3.3.8) ; règles du mot de passe reliées au champ.
- Contraste du texte sur fonds en dégradé : pastille « Tout chaud » 5,01:1 au pire point, texte de la tuile n°1 dorée 6,57:1 à 9,26:1, « Pétrir » 5,66:1.
- Cibles : aucune cible interactive sous 24 × 24 px hors liens dans le texte (2.5.8). Cases et boutons radio du profil à 20 px mais avec un libellé cliquable.
- Glisser-déposer (2.5.7) : alternatives ↑ ↓ et S M L au clavier et à la souris.
- Noms accessibles cohérents avec le texte visible (2.5.3) : « Pétrir : titre », « Lire la source : titre », « Tout chaud, mettre en pause l'animation » commencent par le texte visible.
- Zoom 200 % (fenêtre de 640 px) : pas de défilement horizontal, rien de coupé, sur toutes les pages listées.
- Espacement du texte 1.4.12 (interligne 1,5, lettres 0,12 em, mots 0,16 em, paragraphes 2 em) : aucun texte coupé, à 640 px comme en bureau.
- Aide cohérente (3.2.6) : le chat n'existe que sur l'accueil, il n'y a donc pas d'incohérence entre pages.

## Corrections faites dans ce lot

Tous les points relevés sont corrigés, avec tests (329 au vert) et vérification dans le navigateur. Après correction, axe-core 4.10.2 ne trouve **aucune violation** sur les 16 pages, y compris dans les états ouverts (chat, modales, mode Personnaliser, fournil avec un sujet, garde-manger rempli).

| Point | Correction | Vérifié dans le navigateur |
|---|---|---|
| M1, A1 | Fil du chat atteignable au clavier (`tabindex="0"`, région nommée) ; la dernière réponse de Miette passe par la zone d'annonce | Réponse écrite dans `#pq-annonce`, axe sans violation |
| M2 | `boot.js` crée deux zones d'annonce persistantes hors de `#root` (`#pq-annonce` polie, `#pq-annonce-urgente` assertive) et une fonction `annoncer()`. Après chaque rendu, il relève les `role="status"`, `role="alert"`, `aria-live` et `data-annonce` de `#root`, retire leur rôle et ne dit que ce qui vient d'apparaître ou a changé | Erreur de connexion dite une seule fois (pas à chaque frappe), thème du profil, « C'est renvoyé ! » |
| M3 | Champs en `--bord-champ` (4,65:1 au lieu de 2,2:1) : questionnaire, connexion, mots de passe, fournil | Mesuré au fournil |
| N1, N2 | Bulles survolables : plus de `pointer-events:none`, pont invisible sur l'écart, fermeture quand la souris quitte la bulle | Survol bouton puis bulle : reste ouverte ; sortie : se ferme |
| N3 | Aperçu de ta-fournee-type en `role="group"` nommé, décor masqué | `nested-interactive` disparu |
| N4 | « L'emplacement n°1 est maintenant en position 2 », « Le graphique : taille S » | Annonces lues dans la zone |
| N5 | Le délai du toast était déjà suspendu au focus (le rapport le surestimait) ; il l'est maintenant aussi au survol, et ne reprend que quand souris et focus sont sortis | Toast présent après 7 s de survol, parti 5 s après la sortie |
| N6 | État écrit sous chaque barre (« Tout chaud », « À pétrir », « Rassis ») | Capture du comptoir |
| N7 | Effacement en deux temps : message « C'est définitif », focus sur « Oui, tout effacer », « Annuler » rend le focus | Parcours au clavier, données conservées après Annuler |
| m1 | « Indique ton e-mail. » / « Indique ton mot de passe. », focus et `aria-invalid` sur le seul champ concerné | Les deux cas |
| m2 | Cases de consentement avec `aria-invalid` et liseré rouge | Capture de l'étape 6 |
| m3 | Chiffre en `aria-hidden`, texte masqué « , 1 article mis de côté » | Nom du lien relevé |
| m4 | Bouton Personnaliser sans `aria-pressed` (seul le libellé change) | |
| m5 | Titre « Page introuvable », barre de cuisson en décor | Titre relevé |
| m6 | `scroll-padding-bottom: 104px` quand le lanceur du chat est présent | Valeur calculée relevée |
| m7, A2 | Compteur relié au brouillon ; `aside` remplacé par un `div` | axe sans violation |
| m8 | « Taille pour le graphique » | |

Bug corrigé en plus : e-mail saisi à l'envers (voir plus haut).

## Non vérifié dans ce lot

- Lecteur d'écran réel (NVDA, Narrateur) : à faire par l'utilisateur, procédure ci-dessous. M2 en dépend.
- Zoom du texte seul à 200 % (1.4.4) : Chromium ne sait pas zoomer le texte seul. À faire dans Firefox : Affichage, Zoom, cocher « Zoom texte seulement », puis Ctrl + plusieurs fois.
- Mode Contraste élevé de Windows (`forced-colors`) : non testé.
- Thèmes Nuit et Contraste élevé : contrastes non remesurés dans ce lot (contours traités au lot 23).
- Mobile tactile réel (VoiceOver, TalkBack) : non testé.

## Résultats axe

Le premier passage de l'utilisateur avec l'extension axe DevTools dans Firefox avait donné 0 problème partout. Le second passage a été lancé dans le navigateur intégré avec axe-core 4.10.2 (règles WCAG 2.0, 2.1 et 2.2 A et AA, plus les bonnes pratiques), sur le serveur local, compte démo pour les pages connectées. Il couvre aussi les états ouverts : chat avec une réponse, modale QR, boîte de démo, mode Personnaliser, modale de publication, garde-manger avec 2 articles. Une partie des écarts entre les deux passages s'explique sans doute par des pages qu'on n'atteint qu'en suivant le parcours (ta-fournee-type redirige vers le questionnaire si on tape son adresse directement) ou par des états qui ne s'affichent qu'après une action.

### Violations

| Règle | Impact | Nombre | Page, élément | Rapport |
|---|---|---|---|---|
| `nested-interactive` | serious | 1 | ta-fournee-type, `.mini-bento` | Confirme **N3** |
| `scrollable-region-focusable` | serious | 1 | accueil, chat ouvert, `.chat-fil` | Nouveau : **A1** |
| `landmark-complementary-is-top-level` | moderate | 1 | fournil avec un sujet choisi, `aside` | Nouveau : **A2** |

**A1. Fil du chat non atteignable au clavier**
- Critère : 2.1.1 Clavier (A)
- Page : accueil, `#chat .chat-fil`
- Constat : quand l'historique dépasse la hauteur du panneau, le fil défile, mais il ne contient aucun élément focalisable : impossible de remonter dans les réponses au clavier.
- Gravité : moyenne.
- Correction : `tabindex="0"`, `role="log"` et un nom (« Conversation avec Miette ») sur le fil. Une seule modification règle A1 et M1.

**A2. Repère `aside` imbriqué**
- Critère : bonne pratique (lié à 1.3.1)
- Page : fournil, colonne de droite (`aside` dans `main`)
- Gravité : mineure.
- Correction : remplacer `aside` par un `section` qui porte le titre (`aria-labelledby`), ou sortir l'`aside` du `main`.

### À vérifier (« incomplete »)

- `color-contrast` (serious, de 1 à 25 éléments selon la page) : axe ne sait pas mesurer un texte posé sur un dégradé. Vérifié à la main : sur le fond de page (dégradé de `rgb(254,250,243)` à `rgb(242,229,213)`), le texte le plus clair (sur-titre) reste à 5,36:1 au pire point, les liens à 5,61:1, le texte secondaire à 6,24:1. Pastille « Tout chaud » à 5,01:1, texte des tuiles dorées au moins à 6,57:1. **Conforme.**
- `aria-valid-attr-value` (accueil, `.chat-lanceur`) : axe ne peut pas confirmer la cible de `aria-controls="chat"` combinée à `aria-haspopup`. La cible existe. Pas de correction nécessaire, ou retirer `aria-haspopup` qui n'apporte rien sur un panneau non modal.

### Prévu par l'audit manuel mais non signalé par axe

- m3 (pastille du garde-manger avec `aria-label` sur un `span`) : axe 4.10 ne le signale pas. La correction reste recommandée.
- Tout le reste du rapport (annonces, bordures de champs, bulles, délai du toast, couleur du graphique, confirmation d'effacement) est hors de portée d'un outil automatique : c'est attendu.

## Bug corrigé dans ce lot : e-mail saisi à l'envers

- Pages : questionnaire, connexion, mot-de-passe-oublié.
- Constat : en tapant « abc » dans le champ e-mail, on obtenait « cba ». Le moteur recrée `#root` à chaque frappe et remet le curseur en place ; or Chrome ne donne pas la position du curseur d'un `type="email"`, si bien que le curseur revenait au début du champ.
- Correction : champs e-mail en `type="text"` avec `inputmode="email"` (clavier e-mail sur mobile), `autocomplete` conservé, `spellcheck="false"`, `autocapitalize="none"`. Le site n'utilisait pas la validation native, il a la sienne. Test ajouté dans `tests/accessibilite.test.js`. Vérifié dans le navigateur : saisie à l'endroit et insertion au milieu correctes sur les trois pages.

## Test au lecteur d'écran : procédure

Durée : 20 minutes environ. NVDA est gratuit (nvaccess.org) ; à défaut, Narrateur est intégré à Windows (Ctrl + Windows + Entrée pour l'allumer ou l'éteindre).

Touches NVDA utiles : Insert est la touche NVDA. Ctrl coupe la parole. H passe au titre suivant, D au repère suivant, F au champ de formulaire suivant, B au bouton suivant. Insert + F7 liste les liens, titres et repères. Insert + Espace bascule entre mode navigation et mode formulaire.

1. Lancer NVDA, ouvrir Firefox sur la démo, aller sur `/connexion?demo=reset`.
2. **Accueil** : Tab une fois. Vérifier que NVDA dit « Aller au contenu, lien ». Appuyer sur H plusieurs fois : les titres doivent être lus dans l'ordre logique.
3. **Chat** : Tab jusqu'à « Une question ? Demande à Miette », Entrée. Choisir une question avec Entrée. Noter si la réponse de Miette est lue (attendu après correction de M1 ; aujourd'hui probablement non).
4. **Questionnaire** : depuis l'accueil, « Goûter ma fournée ». Appuyer sur « Continuer » sans rien remplir. Vérifier que NVDA lit le champ prénom suivi de « Indique ton prénom ». Remplir et finir les 6 étapes au clavier ; à chaque étape, le titre doit être lu.
5. **Connexion** : bouton « Utiliser le compte de démo (Léa) », puis « Me connecter ».
6. **Fournée** : D pour atteindre le contenu principal. Tab jusqu'à « Mettre de côté » sur la première news, Entrée. Noter si « Mis de côté » est lu, et si le focus arrive sur « Annuler ». Attendre 5 secondes et noter ce qui se passe.
7. **Personnaliser** : activer « Personnaliser », Tab jusqu'à « Descendre l'emplacement n°1 », Entrée. Noter si quelque chose est annoncé (attendu après N4).
8. **Profil** : changer de thème avec les flèches. Noter si « thème appliqué » (ou équivalent) est lu (test de M2). Envoyer un retour vide, puis un retour rempli : noter si l'erreur et le succès sont lus.
9. **Vérifie tes mails** (via mot de passe oublié) : « Renvoyer l'e-mail ». Noter si « C'est renvoyé ! » est lu (test de M2).
10. Pour chaque point, noter : lu correctement / lu de façon confuse / pas lu, et me renvoyer la liste.
