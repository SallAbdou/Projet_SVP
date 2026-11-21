# Lot 28 : visite guidée d'onboarding (design)

## But
Faire découvrir l'application à la première connexion, façon Airtable : Miette guide, un projecteur éclaire un élément à la fois, la visite traverse cinq pages (comptoir, fournée, garde-manger, fournil, profil).

## Comportement
- **Lancement** : sur le comptoir, compte connecté, visite jamais vue et pas reportée pour cette session de connexion. Étape 1 au centre : Miette, « Bienvenue au fournil ! Je te fais visiter ? », boutons « C'est parti » et « Plus tard ».
- **Plus tard** : ferme sans marquer la visite comme vue. Le report est lié à la session de connexion (`session.depuis` de `pq-auth`) : la visite revient à la connexion suivante.
- **Passer la visite** et **Échap** : ferment et marquent la visite comme vue. **Terminer** (dernière étape) aussi.
- **Étapes** (12) : comptoir (accueil, menu, indicateurs, graphique, four), fournée (grille et étiquettes, n°1 et jauges, actions, Personnaliser), garde-manger (articles mis de côté), fournil (brouillon, ton, publier), profil (réglages et « Revoir la visite »).
- **Entre les pages** : Suivant sur la dernière étape d'une page enregistre `{ index, sens }` dans `pq-visite` puis navigue ; à l'arrivée, après le premier `pq:rendu`, la visite reprend. Précédent peut revenir à la page d'avant.
- **Cible absente ou masquée** (aucune boîte visible) : étape sautée dans le sens du parcours. Le compteur ne compte que les étapes affichables connues : à l'arrivée sur une page on mesure toutes ses cibles, les étapes masquées sortent du total.
- **Revoir la visite** (profil) : efface la mémoire « vue » du compte, pose une visite en cours à l'étape 1 et ouvre le comptoir.
- **Mémoire** : `pq-visite` = `{ version: 1, comptes: { [cleCompte]: { vue, reportee } }, encours: { compte, index, sens, sautees } | null }`, clé de compte comme `theme.js`. Ajoutée à `CLES_DEMO` : `?demo=reset` remet Léa à zéro.

## Présentation
- Voile : un trou arrondi (élément positionné en `fixed` avec `box-shadow` géant) autour de la cible ; sans cible, voile plein. Le voile intercepte les clics.
- Bulle : Miette en petit (dessin d'Abdou repris tel quel), titre, une ou deux phrases, « 3 sur 12 », Précédent, Suivant (ou Terminer), Passer la visite.
- Desktop : placement calculé (droite, gauche, dessous, dessus, sinon coin bas), jamais hors écran, recalcul au redimensionnement et au défilement.
- Mobile (< 900 px) : bulle en feuille fixée en bas, cible défilée en vue sous la barre collante ; l'étape menu ouvre le menu mobile puis le referme.

## Accessibilité
- Bulle hors de `#root`, `role="dialog"` `aria-modal="true"`, `aria-labelledby` (titre) et `aria-describedby` (texte). Le reste de la page est rendu `inert`. Focus sur le titre de la bulle à chaque étape, Tab et Maj+Tab piégés dans la bulle. Étape annoncée par la zone `pq-annonce` de `boot.js`.
- Fin : focus rendu au contenu principal (`#contenu`) ou, depuis le profil, au bouton « Revoir la visite ».
- Pas de transition si `data-animations="off"` ou `prefers-reduced-motion`.
- Couleurs : uniquement les jetons de `charte.css` (`--creme`, `--texte`, `--bord-fort`, `--braise`...), donc les 4 thèmes suivent. Cibles de 44 px. Aucune couleur imposée touchée.
- Textes FR et EN dans `visite.js`, langue lue sur `__app.state.lang`.

## Code
- `visite.js` : partie pure exportée sous Node (étapes, `suivante`, `precedente`, compteur, mémoire, reprise, décision de lancement, placement de la bulle) et partie DOM dans le navigateur.
- Pages : `data-visite="..."` sur les cibles des cinq pages, script `visite.js` chargé avant `boot.js`, bouton « Revoir la visite » au profil.
- `nav.js` expose `Nav.ouvrirMenu(etat)` pour l'étape menu en mobile.
- Note pour Abdou dans `docs/branchement-back.md`.

## v2 (retours de Delio)
- 16 étapes. Fournil en deux temps : à quoi il sert (une news de la fournée devient un post LinkedIn, « Changer de sujet ») puis le brouillon (ton, texte, compteur, publier).
- Garde-manger expliqué même vide : `data-visite="garde"` sur la liste et sur l'état vide.
- Profil détaillé : préférences, apparence (thèmes et animations), « Affine ta fournée », puis « Revoir la visite ».
- Étape du four à faire : pas de bouton Suivant, « À toi de jouer ! ». Seul le lien « Voir ma fournée » reste actif (ses voisins deviennent inertes à chaque niveau), il reçoit le focus et fait partie de la boucle Tab ; le clic ou Entrée ouvre la fournée et la visite reprend à l'étape suivante. La bulle passe en `aria-modal="false"` pendant cette étape et l'étape est annoncée.
- Desktop : une cible large qui tient avec la bulle en dessous est remontée en haut de l'écran pour que la bulle ne la recouvre pas.
