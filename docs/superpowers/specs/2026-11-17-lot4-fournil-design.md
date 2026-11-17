# Lot 4 · Fournil : design

Date : 2026-11-17 · Statut : validé (décisions de Delio transmises par la session parente) · Découle de `2026-11-17-front-roadmap-design.md` (lot 4)

## Intention

Devant le jury, Léa clique « Pétrir » sur une news (fournée ou garde-manger) et arrive dans le fournil sur ce sujet : un premier jet de post LinkedIn l'attend, dans le ton et la langue choisis. Elle le retouche, voit la checklist et l'aperçu bouger pendant qu'elle tape, copie le texte ou « publie » (simulé), puis reporte plus tard les chiffres LinkedIn de ses posts. Tout est simulé dans le navigateur (`store` en `localStorage`), rien n'est envoyé à LinkedIn. Les données écrites en dur dans la page disparaissent.

## Choix du sujet

- `/fournil?ref=<ref>` : le sujet est cherché dans la fournée du jour (`Api.chargerFournee`, état `pret`), puis dans `Store.charger(...).sauves`. La fournée est prioritaire (elle porte `resume` et `pourToi`).
- En-tête du sujet : pastille de feu (Tout chaud, À pétrir, Rassis, mêmes libellés que la fournée), titre, source, phrase « Pour toi » si connue, lien « Changer de sujet » vers `/fournil`.
- Sans `ref`, ou `ref` introuvable : écran de choix. Il liste les news du jour (par rang) puis les articles mis de côté qui ne sont pas déjà dans la fournée (du plus récent au plus ancien), chacun avec un lien « Pétrir » vers `/fournil?ref=…`. Si la `ref` était introuvable, une phrase le dit. Si les deux listes sont vides : renvoi vers la fournée.
- Pendant le chargement de la fournée : « Le fournil chauffe… ». Si la fournée échoue ou est en attente, on continue avec le garde-manger seul.

## Brouillon

- `textarea` liée à l'état (`onInput`). Chaque saisie relit le `store` puis enregistre `Store.enregistrerBrouillon(etat, ref, texte)` : un rechargement retrouve le texte.
- Ouverture d'un sujet : brouillon enregistré s'il existe, sinon la variante proposée (ton « Expert accessible », langue « Français »). Ton et langue ne sont pas mémorisés (le `store` ne garde que le texte).
- Variantes : `data/brouillons.json` contient des textes écrits à la main pour `recDemo01` et `recDemo02` (3 tons × 2 langues). Pour les autres sujets, `Fournil.brouillonGenerique(article, ton, langue, n)` construit un post à partir du titre, du résumé et de « Pour toi » : accroche, constat, 3 puces, question finale. Il n'invente aucun chiffre. En anglais, titre et résumé restent ceux de la source (WF3 ne les fournit qu'en français).
- « Repétrir » propose la variante suivante : pour un sujet écrit à la main, le texte écrit puis les variantes générées ; sinon 3 variantes générées qui tournent (accroche et question différentes).
- Texte modifié par l'utilisatrice (différent de la variante proposée, espaces de bord ignorés) : changer de ton, de langue ou repétrir affiche un bandeau de confirmation « Remplacer ton texte ? » avec « Remplacer » et « Garder mon texte ». Sans modification, la variante remplace directement. Pas de `window.confirm` (bloquant, peu élégant devant le jury).
- Saisie en cours de composition (touches mortes, IME) : pas de rendu avant `compositionend`.

## Checklist (fonction pure `Fournil.checklist(texte, langue)`)

- **Accroche courte** : premier paragraphe (avant la première ligne vide) non vide et de 120 caractères au plus.
- **Un chiffre** : au moins un chiffre dans le texte.
- **Ton point de vue** : FR « je », « j' », « mon », « mes » ; EN « I » (majuscule), « my ». Mots entiers.
- **Une question à la fin** : le texte, sans espaces de fin, se termine par « ? ».
- **Longueur** : « N / 3 000 caractères » ; au-delà de 3 000, alerte « N caractères en trop ».

## Aperçu dans le fil

Sous le texte, mis à jour pendant la frappe : avatar (initiale) et prénom de `Auth.utilisateurCourant()`, rôle = métiers du profil joints par « · ». Texte coupé à 210 caractères au plus (à la dernière espace si possible) suivi de « … voir plus », bouton qui déplie le texte entier (« voir moins » le replie).

## Copier et publier

- « Copier le texte » : `navigator.clipboard.writeText`, repli `document.execCommand('copy')` ; message « Texte copié » ou « Copie impossible : sélectionne le texte à la main ».
- « Publier sur LinkedIn » (simulé) : fenêtre modale (`role="dialog"`, `aria-modal`, titre lié, focus piégé, Échap et clic sur le voile ferment, focus rendu au bouton) avec l'aperçu complet et la mention « Démo : rien n'est envoyé à LinkedIn ». « Confirmer la publication » : `Store.publier(etat, article, maintenant)`, fermeture, message « Post publié (simulation) ».
- Texte vide : « Copier » et « Publier » sont désactivés.

## Ce que tes posts t'ont rapporté

- Liste des posts publiés du `store`, du plus récent au plus ancien : titre, date de publication, chiffres enregistrés s'il y en a.
- Chaque post a un formulaire « Reporter les chiffres » : impressions, réactions, republications, commentaires, prises de contact. Champs texte `inputmode="numeric"` liés à l'état, pré-remplis par les chiffres enregistrés. `Fournil.validerChiffres(saisie)` : entier positif ou nul obligatoire, erreurs lisibles sous chaque champ (`aria-invalid`, `aria-describedby`), focus sur le premier champ en erreur. Succès : `Store.saisirChiffres`, message « Chiffres enregistrés ».
- État vide : « Rien de publié pour l'instant ».
- La note sur l'API LinkedIn Community Management reste.

## Hors périmètre

Mémorisation du ton et de la langue, suppression d'un post publié, réaction à l'événement `storage` d'un autre onglet, vraie publication LinkedIn.

## Tests

`tests/fournil.test.js` (node --test) : `trouverSujet`, `listeChoix`, `checklist`, `apercu`, `brouillonGenerique`, `proposerVariante`, `validerChiffres`, `texteModifie`. La page est vérifiée dans le navigateur.
