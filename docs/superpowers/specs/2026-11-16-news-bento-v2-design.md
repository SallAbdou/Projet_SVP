# Page News bento, version simplifiée (emplacements)

Date : 2026-11-16 · Statut : à valider · Remplace en partie `2026-11-16-news-bento-design.md`

## Intention

La première version faisait trop fouillis. La page `/fournee` ne garde que **les news et le graphique**. Chaque news est un bloc à part. L'utilisatrice arrange des **emplacements**, pas des articles : chaque matin, les nouvelles news (envoyées plus tard par n8n) remplissent ses emplacements par ordre de score. Sa mise en page reste valable tous les jours. (Choix A, validé par Delio.)

## Ce qui change par rapport à la version 1

- Supprimé : tuiles sujet phare, état de la fournée, profil, pain perdu, garde-manger ; le bouton masquer et le tiroir des tuiles masquées.
- Conservé : grille 4 colonnes, rangées de 264 px, tailles S/M/L, glisser-déposer, flèches, choix 1/3/5/7 news, disposition par défaut, enregistrement en `localStorage`, accessibilité clavier, responsive (2 colonnes sous 1100 px, 1 colonne sous 640 px), JSON de données inchangé.

## Conception

- **8 emplacements** : `n1` à `n7` (n1 = news la mieux notée du jour, n2 la suivante, etc.) et `graph`.
- **Visibilité déduite** : `graph` est toujours visible ; `nK` est visible si K ≤ nombre de news choisi et si la fournée du jour contient au moins K sujets. Plus de champ `visible` à enregistrer.
- **Disposition** (`pq-layout`, version 2) : `{ "version": 2, "newsCount": 5, "tiles": [ { "id": "n1", "size": "L" }, ... ] }`. Une disposition version 1 enregistrée est ignorée (retour au défaut).
- **Disposition par défaut** : n1 L, n2 M, n3 M, graph M, n4 S, n5 S, n6 S, n7 S. Avec 5 news, la grille fait 3 rangées pleines. Avec 1, 3 ou 7 news, il peut rester des trous que l'utilisatrice comble en arrangeant.
- **Flèches ↑ ↓** : sautent les emplacements cachés, pour que chaque clic déplace visiblement le bloc.
- **Contenu d'un bloc news selon sa taille** : badge du rang (« n°1 »), état, source, titre, monétisation et « Pétrir un post » toujours ; en M on ajoute le résumé ; en L on ajoute aussi « pour toi », le détail des scores et « Lire la source ». Le contenu défile si besoin.
- **Mode édition** : barre d'outils par bloc (poignée, ↑, ↓, S/M/L), sélecteur 1/3/5/7 en haut de la grille, bouton « Disposition par défaut ».

## Non-objectifs

- Pas de choix d'articles précis, pas de masquage du graphique.
- Les helpers de contenu inutilisés (`topTopic`, `countStates`, `leftover`) restent dans `bento.js` avec leurs tests, pour les autres pages ou n8n plus tard.

## Approches envisagées

1. **Emplacements remplis par score** (retenue, choix A).
2. **Ordre des articles du jour** (choix B) : écarté, la mise en page serait perdue chaque matin.
