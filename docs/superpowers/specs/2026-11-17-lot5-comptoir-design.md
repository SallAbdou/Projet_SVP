# Lot 5 · Comptoir : design

Date : 2026-11-17 · Statut : validé (décisions de Delio transmises par la session parente) · Découle de `2026-11-17-front-roadmap-design.md` (lot 5)

## Intention

Devant le jury, Léa ouvre `/comptoir` et voit ce que ses fournées lui ont rapporté : chiffres clés sur 30 jours, graphique de ses derniers posts, une phrase d'analyse, la news du jour à pétrir, ses articles mis de côté. Quand elle publie un post depuis le fournil puis reporte ses chiffres, le comptoir bouge. Plus aucune donnée écrite en dur dans la page.

## Sources des chiffres

- **Historique d'exemple** : `data/posts.json` devient un tableau de 10 posts répartis sur les 60 derniers jours, relatifs à aujourd'hui. Chaque post : `ref`, `titre`, `label` (court, pour le graphique), `feu` (`vert`, `orange`, `rouge`), `ilYaJours` (entier positif ou nul), `chiffres` (`impressions`, `reactions`, `republications`, `commentaires`, `contacts`, entiers positifs ou nuls). Date de publication = maintenant moins `ilYaJours` jours.
- Les 6 posts des 30 derniers jours reprennent les chiffres de la maquette (4 820 impressions, 312 réactions, 27 republications) ; les 4 posts des 30 jours d'avant donnent « +2 vs mois dernier », « +38 % », « +21 % », « stable ».
- **Posts réellement publiés** : `Store.charger(...).publies` (`id`, `ref`, `titre`, `publieLe`, `chiffres` ou `null`). Le feu est retrouvé par `ref` dans la fournée du jour, puis dans le garde-manger, sinon `orange`. Le libellé du graphique est le titre coupé à 22 caractères au plus (à la dernière espace si possible, suivi de « … »).
- `Api.chargerPosts` écarte les posts d'exemple invalides (fonction testée `Api.postExempleValide`). S'il échoue, le comptoir continue avec les seuls posts publiés.
- Badge « Inclut des données d'exemple » tant que l'historique d'exemple est affiché.

## Module pur `comptoir.js` (`window.Comptoir`, testé sous Node)

- Conversion des deux sources dans un format commun `Post = { id, ref, titre, label, feu, publieLe, chiffres, exemple }`, puis fusion triée du plus récent au plus ancien.
- **KPI sur 30 jours** : posts publiés, impressions, réactions, republications, prises de contact. Fenêtre courante = âge de 0 à moins de 30 jours (une date future compte dans la fenêtre courante) ; fenêtre précédente = de 30 à moins de 60 jours ; date illisible ignorée. Les posts sans chiffres comptent dans « posts publiés » mais pas dans les sommes.
- **Écarts** : nombre de posts en différence absolue (« +2 vs mois dernier »), sommes en pourcentage arrondi (« +38 % »). Écart arrondi nul : « stable ». Période précédente à 0 et actuelle positive : « nouveau ». Baisse : « -12 % » (trait d'union).
- **Graphique** : les 6 derniers posts qui ont des chiffres, du plus ancien au plus récent (gauche à droite), hauteur en pourcentage du maximum. Même fonction pour la tuile graphique de `/fournee`.
- **Phrase d'analyse** : moyenne des impressions des posts `vert` divisée par celle des autres (tous posts ayant des chiffres), arrondie à une décimale : « Tes posts sur des sujets tout chauds font en moyenne 1,8 fois plus d'impressions : sers-les vite. » S'il manque un des deux groupes ou si la moyenne des autres est nulle : phrase neutre « Publie et reporte tes chiffres pour voir ce qui marche le mieux. »
- **Posts sans chiffres** : nombre de posts publiés (pas d'exemple) dont `chiffres` est `null`.
- **Bilan depuis le début** (« Ce que ta veille a rapporté ») : total des prises de contact et nombre de posts publiés grâce à la fournée, sur tout l'historique.

## Page `/comptoir`

- En-tête : date du jour + « tes 30 derniers jours », « Bonjour {prénom} » (utilisatrice connectée), badge d'exemple. Badges « MVP » et « V1 » retirés (la page est réelle).
- Alerte « 1 post attend ses chiffres » / « N posts attendent leurs chiffres » avec lien « Reporter mes chiffres » vers `/fournil`, absente à 0.
- 5 KPI (le dernier, prises de contact, mis en avant), graphique avec légende de couleur par feu, phrase d'analyse.
- « Tout juste sorti du four » : news n°1 du jour en sautant les sujets ignorés aujourd'hui (`Bento.pickTopics(articles, 1, Store.refsIgnorees(etat, Store.dateDuJour(new Date())))`), pastille de feu (Tout chaud, À pétrir, Rassis), titre, « Pour toi », bouton « Pétrir le post » vers `Bento.lienFournil(ref)`. Fournée en chargement : « La fournée chauffe… » ; vide, en attente ou en échec : « Rien de nouveau au four » et lien vers `/fournee`.
- « Ce que ta veille a rapporté » : prises de contact et posts publiés grâce à la fournée, depuis le début.
- Garde-manger : 3 derniers articles mis de côté (`GardeManger.trier`), fraîcheur (`GardeManger.fraicheur`, mêmes libellés que le garde-manger), ancienneté, source, lien « Pétrir » vers `Bento.lienFournil(ref)`. État vide : « Rien de côté pour l'instant » et lien vers `/fournee`.
- FR et EN, cibles de 44 px, aucune barre de défilement horizontale à 375 px.

## Hors périmètre

Réaction à l'événement `storage` d'un autre onglet, choix de la période, vraies statistiques LinkedIn.

## Tests

`tests/comptoir.test.js` : conversion, fusion, KPI et écarts, graphique, analyse, posts sans chiffres, bilan. `tests/api.test.js` : nouveau contrat de `data/posts.json` et `postExempleValide`. Pages vérifiées dans le navigateur.
