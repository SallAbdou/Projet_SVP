# Lot 35 : titres par thématique et vitrine

Suite de la proposition de gamification (v2, 9 novembre) adaptée à ce qui existe depuis les lots 32 à 34 : cartes à découvrir dans la fournée, points de cuisson, niveaux de boulangerie, levain, collection de pains. Le lot 35 **étend `jeu.js`**, il ne refait rien. Jeu personnel : ni classement, ni achat, ni message culpabilisant.

## Ce qui change par rapport à la proposition v2

| Proposition v2 (9 nov.) | Ce qui existe aujourd'hui | Décision lot 35 |
| --- | --- | --- |
| XP par thématique, monnaie à part | Points de cuisson globaux (`Jeu.POINTS`), gagnés à la cuisson et à la première découverte du jour | **Une seule monnaie.** Chaque point de cuisson gagné sur un article est aussi crédité à chacune de ses thématiques. Pas de deuxième compteur à expliquer au jury. |
| Barème Lire 5, Générer 15, Copier 25 | La cuisson (publication confirmée au fournil) rapporte 15 à 75 points | On garde la cuisson comme gain principal. On ajoute **la lecture** : « Lire la source » rapporte 5 points, une fois par article, 3 lectures comptées par jour au plus. |
| Feu vert ×2 | La cuisson dépend déjà de la fraîcheur (Tout chaud 60, À pétrir 40, Rassis 15) et de la rareté | Rien à ajouter : le timing est déjà récompensé. |
| Titre sous le prénom | La barre latérale affiche le métier sous le prénom | Le **titre choisi** remplace la ligne du métier ; sans titre, le métier reste. |
| Vue « Mes titres » dans `mes-articles.html` | `mes-articles.html` n'existe plus | **Nouvelle page `/vitrine`**, entre Le garde-manger et Mon profil dans le menu. |
| Niveaux par thématique Novice → Visionnaire | Niveau global Apprenti → Maître artisan | Les deux coexistent, avec des rôles distincts (ci-dessous). |
| Partage, phase 2 avec Supabase | Supabase Auth est en place (mode réel), la progression reste dans le navigateur | Phase 1 inchangée (navigateur). Phase 2 : badge vérifiable, branché sur le schéma `jeu_progression` / `jeu_cartes` déjà décrit dans `docs/branchement-back.md`. |

## Deux échelles, deux rôles

- **Niveau de boulangerie** (existant, global) : ton rang dans l'atelier, pour le plaisir. Apprenti 0, Mitron 100, Boulanger 250, Maître artisan 600. Reste au Comptoir, inchangé.
- **Titre de thématique** (nouveau) : ton expertise sur un sujet, sobre pour pouvoir le montrer sur LinkedIn. Titres épicènes, identiques au masculin et au féminin.

| Palier | Titre FR | Titre EN | Points cumulés dans la thématique |
| --- | --- | --- | --- |
| 1 | Novice | Novice | 0 |
| 2 | Analyste | Analyst | 50 |
| 3 | Spécialiste | Specialist | 150 |
| 4 | Stratège | Strategist | 400 |
| 5 | Visionnaire | Visionary | 1 000 |

Ordre de grandeur : publier un post sur un sujet Tout chaud (60 points et plus) suffit pour devenir Analyste ; 3 posts à chaud dans la même thématique pour Spécialiste. Valeurs de départ, à calibrer en équipe. Le palier 1 n'est pas un titre affichable : il faut au moins Analyste pour afficher ou partager.

Titre affiché : `Spécialiste · Automatisation`. Libellés courts des 12 thématiques du questionnaire :

| Thématique (questionnaire) | Libellé court | Identifiant |
| --- | --- | --- |
| LLMs | LLMs | `llms` |
| Vidéo | Vidéo | `video` |
| Image | Image | `image` |
| Automatisation et agents | Automatisation | `automatisation` |
| Cybersécurité | Cybersécurité | `cybersecurite` |
| Actualité des grandes firmes | Grandes firmes | `grandes-firmes` |
| Monétisation | Monétisation | `monetisation` |
| Finance et spéculation | Finance | `finance` |
| Hardware | Hardware | `hardware` |
| IA en entreprise | IA en entreprise | `ia-entreprise` |
| Ecosystèmes | Écosystèmes | `ecosystemes` |
| Ingénierie R&D | R&D | `rd` |

## Données : la seule dépendance côté back

Les articles n'ont aujourd'hui qu'un `axe` (« Axe 1 », « Axe 2 »). Il faut un champ **`thematiques`** (liste de 1 à 3 libellés exacts du questionnaire) dans chaque article renvoyé par WF3.

- **n8n** : ajouter `thematiques` dans « Préparer les données » de WF3 (et le lookup Thématiques dans Airtable si le champ n'y est pas encore). C'est le seul changement back du lot.
- **Front** : `api.js` nettoie `thematiques` comme les autres champs (liste de chaînes connues, le reste ignoré). Article sans thématique : la cuisson et la lecture rapportent leurs points globaux, aucune thématique n'est créditée.
- **Démo** : `data/fournee.json` et les cartes de `Jeu.exempleLea` reçoivent des `thematiques`.

## Mémoire (`pq-jeu`, version 1, par compte)

Champs ajoutés, tous facultatifs (un compte du lot 34 reste valide) :

```
cartes: { [ref]: { …, thematiques: ['Automatisation et agents'] } },  // recopiées à la découverte
lectures: { [ref]: { jour: 'AAAA-MM-JJ', thematiques: [...] } },       // une entrée par article lu
titreAffiche: 'automatisation' | '',                                  // choisi dans la vitrine
titres: { [identifiant]: { palier: 3, depuis: 'AAAA-MM-JJ' } }         // plus haut palier atteint et sa date
```

Les points par thématique ne sont **pas stockés** : `Jeu.pointsParThematique(compte)` les recalcule à partir des cartes cuites (`gain`) et des lectures. Une seule source de vérité, et rien à migrer si le barème change. `titres` ne garde que la date d'obtention, pour l'historique et le partage.

## Règles (constantes uniques dans `jeu.js`)

- `Jeu.POINTS.lecture = 5`, `Jeu.LECTURES_PAR_JOUR = 3`.
- `Jeu.PALIERS = [{ id: 'novice', min: 0 }, { id: 'analyste', min: 50 }, { id: 'specialiste', min: 150 }, { id: 'stratege', min: 400 }, { id: 'visionnaire', min: 1000 }]`.
- `Jeu.THEMATIQUES` : la table des 12 thématiques ci-dessus (libellé du questionnaire, court FR/EN, identifiant).
- **Lecture** : clic sur « Lire la source » (fournée ou garde-manger), carte découverte, jeu actif. Une fois par article, 3 par jour au plus. Ajoute les points au total global et les crédite aux thématiques de l'article.
- **Cuisson** : inchangée. Le gain déjà calculé est crédité à chaque thématique de la carte.
- **Nouveau palier** : `Jeu.cuire` et `Jeu.lire` renvoient en plus `nouveauxTitres: [{ thematique, palier }]`, et `titres` garde la date du premier passage.
- **Jamais de perte** : un titre obtenu reste, même si le barème baisse.
- **Jeu désactivé** : pas de lecture comptée, pas de titre sous le prénom, pas d'entrée Vitrine dans le menu. Les données restent.

## Interface

### Barre latérale (`nav.js`)
Sous le prénom : le titre affiché (`Spécialiste · Automatisation`) à la place du métier. Sans titre choisi, ou jeu coupé : le métier, comme aujourd'hui. Le titre est un lien vers `/vitrine`.

### Messages après une action
Le message de statut existant du fournil dit déjà « Carte cuite : +60 points de cuisson. ». Il ajoute, s'il y a lieu : « Nouveau titre : Analyste · Automatisation. » avec un lien « Voir ma vitrine ». Pour une lecture, un message discret dans la fournée : « Lecture : +5 points en Automatisation. ». Pas de chiffre sur les boutons, pas de confettis.

### Page `/vitrine` (nouvelle, `vitrine.html`)
Sur-titre « Tes titres », titre « La vitrine », chapeau « Ce que tes fournées disent de ton expertise. »

1. **Titre affiché** : liste de choix des titres obtenus (Analyste et plus), « Aucun » pour garder le métier. Annonce « Titre affiché : Spécialiste · Automatisation. »
2. **Tes thématiques** : une carte par thématique, d'abord celles choisies au questionnaire, puis les autres où l'utilisateur a des points. Chaque carte : libellé, titre actuel, barre (décorative, `aria-hidden`), texte « 40 points avant Stratège », nombre de cartes cuites, date d'obtention. Thématiques sans point : regroupées en une ligne « Pas encore de points en : Vidéo, Hardware… ».
3. **Partager** sur chaque titre obtenu : « Partager sur LinkedIn » (lien de partage vers la page du titre) et « Rédiger l'annonce au fournil » (brouillon à relire, comme tout texte généré).
4. **Comment progresser** : le barème en clair (lecture 5, cuisson selon la fraîcheur, bonus de rareté) et les 5 paliers.

Styles : `.jeu-carte` et `.jeu-barre` existants, aucune nouvelle couleur. Le palier se lit en toutes lettres (jamais la couleur seule). Visionnaire peut reprendre le doré Maillard.

### Pages de partage (phase 1)
`/titres/<thematique>-<palier>` (12 thématiques × 4 paliers partageables = 48 pages statiques), générées par un script `tools/titres.mjs` : balises `og:title`, `og:description`, `og:image` (image 1200 × 627 générée par le même script), `og:url`. Le lien de partage est `https://www.linkedin.com/sharing/share-offsite/?url=<adresse de la page>`. La page est générique : elle **ne prouve pas** que la personne a ce titre. Acceptable pour la démo, à dire au jury.

### Profil
Rien de nouveau : la case « Jeu des cartes activé » coupe aussi les titres. Le libellé devient « Jeu et titres activés ».

## Données d'exemple (démo jury)
Léa : thématiques sur ses 8 cartes, 2 lectures. Résultat visé : **Spécialiste · Automatisation** affiché sous son prénom, **Analyste · IA en entreprise**, et une thématique à 20 points d'un palier pour montrer un passage en direct en publiant le n°1 de la fournée de démo. `?demo=reset` efface tout.

## Phase 2 (après la soutenance)
Badge vérifiable `/badge/<id>` lu dans Supabase, avec balises `og:` produites côté serveur (fonction Vercel). Tables indicatives dans `docs/branchement-back.md`, à côté de `jeu_progression` et `jeu_cartes` : `jeu_lectures (user_id, ref, jour, thematiques)` et `jeu_titres (user_id, thematique, palier, depuis)`. Points calculés par une fonction en base, pas par le navigateur. Bouton « Ajouter au profil LinkedIn » à proposer, pas à pousser.

## Garde-fous
- Titres déterministes : on sait toujours ce qu'il faut faire pour progresser. Aucun tirage au sort.
- Pas de classement, pas de comparaison entre utilisateurs.
- La lecture est plafonnée (3 par jour) pour ne pas pousser à ouvrir des onglets sans lire.
- Le levain ne remet jamais à zéro (lot 33) ; les titres ne se perdent jamais.
- Le partage reste un brouillon à relire.

## Accessibilité
Tout ce que la barre montre est écrit. Messages dans la zone de statut existante (`role="status"`). Liste de choix étiquetée. Cibles de 44 px. 4 thèmes, FR et EN, animations coupables.
