# Page News en bento personnalisable

Date : 2026-11-16 · Statut : à valider

## Intention

La page `/fournee` (« La fournée du jour ») devient la page News du parcours : une grille bento que l'utilisatrice adapte à sa façon. C'est une maquette de démo, mais construite pour qu'on la branche plus tard sur les automatisations n8n sans la réécrire.

## Objectifs

- A. Afficher ou masquer chaque tuile, et choisir le nombre de sujets affichés (1, 3, 5 ou 7).
- B. Réordonner les tuiles par glisser-déposer, à la souris et au doigt.
- C. Changer la taille de chaque tuile parmi S (1×1), M (2×1), L (2×2).
- La disposition survit au rechargement de la page.
- Les données affichées viennent d'un fichier JSON séparé, au format que n8n produira plus tard.

## Non-objectifs

- Pas de backend, pas d'appel réel à n8n dans cette itération.
- Pas de redimensionnement libre au pixel.
- Pas de refonte des autres pages (nav dupliquée, boutons décoratifs ailleurs).

## Anti-objectifs (échec même si « ça marche »)

- Le mode édition gêne la lecture normale de la page.
- Ajout d'une dépendance ou d'une étape de build.
- Des contenus écrits en dur dans le template, que n8n ne pourrait pas remplacer.
- Une page qui ne s'utilise plus au clavier ou sur mobile (le site soigne l'accessibilité aujourd'hui).

## Contraintes

- Site statique sur Vercel, pas de build, moteur maison `dc.js` + `boot.js`.
- `boot.js` réécrit tout `#root` à chaque `setState` : pendant un glisser, on déplace les éléments directement dans le DOM, et l'état n'est mis à jour qu'au lâcher.
- Bilingue FR/EN comme les autres pages.

## Approches envisagées

1. **Fait main, tailles fixes S/M/L en grille CSS** (retenue). Zéro dépendance, compatible avec le moteur, les tailles fixes donnent l'aspect bento. Pas de redimensionnement libre.
2. **GridStack.js**. Glisser et redimensionner tout faits, mais la librairie gère son propre DOM, que `boot.js` détruirait à chaque rendu : il faudrait sortir la page du moteur.
3. **Boutons seulement (↑ ↓ S/M/L)**. Le plus robuste, mais ne couvre pas vraiment le glisser-déposer demandé.

Choix de Delio : approche 1, couvrant A, B et C.

## Conception

### Tuiles

| id | Contenu | Taille par défaut |
|---|---|---|
| `news` | Sujets du jour, cartes avec état, axe, source, scores, actions | L |
| `top` | « Tout juste sorti du four » : le sujet le mieux noté mis en avant | M |
| `graph` | Impressions des derniers posts | M |
| `stats` | Répartition chaud / à pétrir / rassis | S |
| `profile` | Profil : métier, axes suivis, sources | S |
| `painperdu` | « Pain perdu » : un sujet rassis à recycler avec un nouvel angle | S |
| `pantry` | Derniers articles mis au garde-manger | M |

Les intitulés `news`, `profil`, `graph`, `pain perdu` viennent du bento du tableau blanc. Les autres reprennent des blocs existants du site (proposition de Claude).

### Deux modes

- **Lecture** (par défaut) : grille propre, aucune poignée visible.
- **Édition** (bouton « Personnaliser ») : chaque tuile montre une poignée de glisser, des boutons ↑ ↓, un sélecteur S/M/L et un bouton masquer. Les tuiles masquées apparaissent dans un tiroir en bas d'où on les rajoute. Boutons « Terminer » et « Disposition par défaut ».

### Disposition

Un objet unique, enregistré en `localStorage` sous `pq-layout` :

```json
{ "version": 1, "newsCount": 5,
  "tiles": [ { "id": "news", "size": "L", "visible": true } ] }
```

Plus tard, ce même objet sera envoyé à n8n ou stocké en base par compte.

### Données

Un fichier `data/fournee.json` chargé au démarrage : date, sujets (id, état, axe, source, url, titre, résumé, « pour toi », scores durabilité / propension / lien offre / monétisation), séries du graphe, garde-manger. Les textes de contenu ont une version `fr` et `en`. Les libellés d'interface restent dans le dictionnaire `T` de la page. Le badge « Données d'exemple » reste affiché.

### Responsive

Sous 640 px, une seule colonne : les tailles ne jouent plus, l'ordre et la visibilité si.

## Laissé au constructeur

- Le contenu exact des sujets d'exemple (reprise des 3 sujets actuels, complétée jusqu'à 7).
- Les détails visuels des poignées et du tiroir, dans la charte existante.
- La gestion d'une disposition enregistrée qui référence une tuile inconnue (à ignorer) ou qui en oublie une (à ajouter en fin, visible).

## Point d'attention

`fetch` du JSON ne marche pas en ouvrant le fichier en `file://` : il faut un petit serveur local pour tester (Vercel le sert normalement).
