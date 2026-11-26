# Lot 32 : cartes à collectionner, bascule de vue et rituel du matin

Première moitié de la gamification (jeu personnel, sans classement ni achat). Le lot 33 ajoutera cartes cuites, points de cuisson, levain, niveaux, collection et case de désactivation.

## Vocabulaire
Carte ; raretés Mie, Croûte, Dorée, Maillard ; fraîcheur Tout chaud, À pétrir, Rassis (étiquettes existantes issues du feu) ; « la fournée sort du four ».

## Rareté
Score de monétisation sur 15 (durabilite + propension + lienOffre, `Bento.totalScore`). Seuils dans une seule constante `Jeu.RARETES` : Maillard 13 à 15, Dorée 11 à 12, Croûte 9 à 10, Mie 8 et moins. La rareté est toujours écrite en toutes lettres, avec un nombre de grignes (4, 3, 2, 1) et un cadre propre : Maillard reprend le doré du n°1 (`--maillard`, `--or-*`), Dorée une surface `--or-surface` cadre `--or-bord`, Croûte un cadre `--cuivre`, Mie un cadre en pointillés. Jamais la couleur seule.

## Fichiers
- `jeu.js` : logique pure exportée pour Node. Rareté, cartes du jour (rang, news écartées, nombre réglé), ordre de retournement (rang décroissant, le n°1 en dernier), règle « le n°1 se retourne après les autres », mémoire par compte en localStorage `pq-jeu` = `{ version: 1, comptes: { [clé]: { rituel: 'AAAA-MM-JJ', vue: 'fournee' | 'cartes' } } }` (clé de compte comme `visite.js`), date injectable, textes FR et EN, HTML de la face d'une carte (sans actions, échappé).
- `rituel.js` : partie navigateur. Au premier `pq:rendu` d'une page protégée, si le rituel n'a pas été vu aujourd'hui par ce compte (et qu'aucune visite n'est en cours), il charge la fournée et ouvre le dialogue plein écran. Fin du rituel : mémoire mise à jour, événement `pq:rituel-fin`.
- `charte.css` : styles des cartes (partagés par le rituel et la vue cartes) et du rituel.
- `fournee.html` : bascule « Vue fournée / Vue cartes » (`aria-pressed`) dans l'en-tête, grille de cartes avec les actions existantes (gabarit `sc-for`, car un lien « nouvel onglet » ne doit pas être généré par script, garde-fou du lot 25).
- `visite.js` : l'accueil de Miette attend `pq:rituel-fin` quand le rituel est prévu sur la page. Cibles `grille` et `petrir` aussi présentes en vue cartes.
- `store.js` : `pq-jeu` dans `CLES_DEMO`.

## Rituel
Dialogue modal (`role="dialog"`, `aria-modal`, fond `inert`, focus piégé, Échap = Passer). Titre « La fournée sort du four ». Cartes face cachée dans l'ordre de retournement (n°K d'abord, n°1 en dernier). Chaque dos est un bouton « Retourner la carte 3 sur 5 » ; le dos du n°1 reste `aria-disabled` tant que d'autres cartes sont cachées (un clic explique qu'il vient en dernier). Retourner annonce le contenu de la carte (zone `pq-annonce` de `boot.js`) et place le focus sur la carte suivante. « Tout retourner » et « Passer » ; à la fin, « Voir ma fournée » mène à `/fournee` (vue mémorisée), ou ferme le dialogue si l'on y est déjà. Animation de retournement en 3D, coupée par `data-animations="off"` et `prefers-reduced-motion`. Dans le rituel, la carte ne porte pas les actions (elles sont dans la vue cartes et la vue fournée).

Le rituel n'est pas marqué vu si la fournée n'est pas prête (attente, erreur, aucune carte) : il reviendra au prochain chargement.

## Vue cartes
Bascule dans l'en-tête, vue fournée par défaut, choix mémorisé par compte. Cartes face visible en grille responsive (`auto-fill`, 260 px mini), dans la largeur bornée du lot 22. « Personnaliser » n'existe qu'en vue fournée (le passage en vue cartes quitte le mode). Actions : Pétrir un post, mettre de côté, écarter, Lire la source, mêmes couleurs imposées.
