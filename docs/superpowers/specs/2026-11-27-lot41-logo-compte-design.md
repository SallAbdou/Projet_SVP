# Lot 41 : nouveau logo et suppression du compte (design)

## 1. Logo

- Fichier fourni : `assets/logo-votre-pain-quotidien.webp` (1774 x 887, sans transparence, fond crème arrondi). Aucune retouche.
- En-tête public (`parcours.js`, `enteteHtml`) : le carré pain + le texte sont remplacés par
  `<img class="logo-img" src="/assets/logo-votre-pain-quotidien.webp" width="1774" height="887" alt="Votre pAIn quotidien">`
  dans le lien vers l'accueil. Le lien garde son `aria-label` (« Votre pAIn quotidien, accueil » / « …, home ») :
  il remplace le contenu, rien n'est lu deux fois. Hauteur CSS 64 px (48 px sous 640 px), largeur automatique.
- Menu latéral (`nav.js`) : le titre texte devient la même image (largeur 100 %, bornée à 214 px), accroche gardée
  dessous. Barre mobile (< 900 px) : image de 36 px de haut à gauche, accroche masquée (comme avant).
- `alt` identique en FR et EN (nom de marque), porté par `TEXTES.fr/en.logoAlt`.
- Thèmes Nuit et Contraste élevé : l'image garde son fond crème, coins arrondis en CSS (`border-radius`).
- Favicon inchangée.

## 2. Supprimer mon compte

Nouveau module `compte.js` (logique pure testée + dialogue dans le navigateur).

- Données effacées pour le compte `u` (clé = e-mail en minuscules, sinon abonneId, même règle que theme, jeu, visite…) :
  - par compte : `pq-theme`, `pq-animations`, `pq-visite`, `pq-jeu`, `pq-retours` (seule l'entrée du compte part) ;
  - propres à l'appareil, sans clé de compte (données de la personne connectée) : `pq-store`, `pq-layout`,
    `pq-layout-perso`, `pq-questionnaire` (supprimées) ; `sessionStorage` `pq-mail` ;
  - gardé : `pq-lang` (réglage de l'appareil, sert au message d'au revoir), entrées des autres comptes.
- Démo : `Auth.pur.supprimerCompte(etat, email)` retire le compte, ferme la session et la demande liées. Pour Léa,
  `demoSupprime: true` empêche `normaliser` de la recréer ; `?demo=reset` efface `pq-auth`, donc Léa revient.
- Réel : `config.js` reçoit `suppressionCompteUrl` (vide). Vide : erreur `indisponible`, rien n'est effacé, message
  « bientôt disponible, écris-nous ». Rempli (https) : `POST` avec `Authorization: Bearer <jeton>` et
  `{"confirmation":"SUPPRIMER"}` ; 2xx : données locales effacées et `pq-auth-reel` retiré ; 401 : `session` ; sinon `reseau`.
- Dialogue (`<dialog>` natif créé hors de `#root`, pour survivre aux rendus) : `aria-labelledby`, `aria-describedby`,
  liste de ce qui part, mention irréversible, champ « tape SUPPRIMER » (EN : « DELETE », la casse et les espaces
  autour sont tolérés), boutons « Annuler » (focus initial) et « Supprimer définitivement » (style danger).
  Échap ou Annuler : fermeture, focus rendu au bouton du profil. Mot faux : message d'erreur relié au champ, focus sur le champ.
- Après suppression : `sessionStorage` `pq-adieu` puis redirection vers `/` ; l'en-tête public affiche une fois
  `<p class="adieu" role="status">` (annoncé par le relais de boot.js).
- Profil : section « Zone sensible » en bas, bouton `pf-danger` (bord et texte `--erreur`, 44 px).
- Confidentialité : paragraphe « Les effacer » complété (compte supprimable depuis Mon profil).
- `docs/branchement-back.md` : contrat du point d'entrée pour Abdou.
