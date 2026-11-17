# Scénario de démo devant le jury

Durée visée : 6 minutes (5 à 7). Site : https://team42svp.vercel.app/ (bouton « QR code » en haut à droite de la landing, et page imprimable `/qr`).
Tout est simulé dans le navigateur : aucun e-mail, aucun mot de passe, aucune publication LinkedIn ne part réellement.

## Avant d'entrer dans la salle (2 minutes)

1. Ouvrir `https://team42svp.vercel.app/?demo=reset` dans une fenêtre normale (pas en navigation privée), plein écran (F11), zoom navigateur à 100 %.
2. Vérifier que la landing est en français (bouton FR enfoncé en haut à droite) et que le bouton « QR code » est visible à sa gauche.
3. Garder un deuxième onglet ouvert sur `https://team42svp.vercel.app/connexion` (plan B).
4. Avoir sous la main : un prénom (Nora), un e-mail inventé (`nora@exemple.fr`), le mot de passe `Croissant8`.

## Déroulé

| N° | Écran | Clics exacts | Ce qu'on dit | Durée |
|----|-------|--------------|--------------|-------|
| 1 | Landing `/` | Clic sur « QR code » en haut à droite : le QR s'affiche en grand dans une fenêtre. Laisser scanner, puis « Fermer » (ou Échap). | « Chaque matin, Votre pAIn quotidien sélectionne l'actu IA qui compte pour ton métier et la rend prête à pétrir en post LinkedIn. Vous pouvez scanner le QR pour suivre sur votre téléphone. » | 0:30 |
| 2 | Landing | Clic sur « Goûter ma fournée », puis « Régler ma fournée ». | « On démarre comme un nouvel abonné : deux minutes de questions, reprises de notre Tally. » | 0:15 |
| 3 | Questionnaire, 6 étapes | Prénom `Nora`, Tab, e-mail `nora@exemple.fr`, Entrée. Cocher « Consultant », Continuer. Cocher « Automatisation et agents », Continuer. Choisir « En couple », Continuer. Choisir « Je veux des sources françaises uniquement », Continuer. Cocher les deux accords, « Voir ma fournée ». | « Métier, thèmes, niveau de jargon et langue : c'est ce qui pilote la sélection de nos workflows n8n. » | 1:00 |
| 4 | `/ta-fournee-type` | Aucun clic, montrer la mini-bento puis « Recevoir ma fournée ». | « Voici la fournée type de Nora : cinq news par matin, la mieux notée en doré. » | 0:20 |
| 5 | `/verifie-tes-mails` | « Ouvrir ma boîte de réception (démo) », puis « Confirmer mon adresse » dans le faux e-mail. | « Comme en vrai, on confirme l'adresse. Ici la boîte mail est simulée. » | 0:20 |
| 6 | `/creer-mot-de-passe` | Saisir `Croissant8`, Tab Tab, `Croissant8`, Entrée. | « Les règles s'allument en direct. Aucun mot de passe n'est stocké. » | 0:20 |
| 7 | `/fournee`, au four | Attendre 4 s : le pain lève. | « Pendant que l'IA choisit les sujets du jour, la fournée est au four. » | 0:10 |
| 8 | `/fournee`, bento | Clic sur « Mettre de côté » de la news n°2 (le message « Mis de côté · Annuler » apparaît). Montrer la pastille de couleur et la monétisation de la n°1. Clic sur « Personnaliser », puis sur la carte « Concentrée » dans « Mise en page », puis « Équilibrée », puis « Terminer ». | « Chaque news est notée : tout chaud, à pétrir ou rassis, avec trois scores. On garde ce qui nous intéresse pour plus tard, chaque news renvoie à sa source. La page se personnalise : mises en page toutes faites ou disposition à soi. » | 1:00 |
| 9 | `/fournee` | Clic sur « Pétrir un post » de la news n°1 (dorée). | « On transforme la meilleure news en post. » | 0:05 |
| 10 | `/fournil` | Choisir le ton « Provocateur » dans la liste, montrer la checklist et l'aperçu LinkedIn, clic sur « Publier sur LinkedIn », puis « Confirmer la publication ». | « Trois tons, deux langues, une checklist de qualité. La publication est simulée pour la démo. » | 1:00 |
| 11 | `/comptoir` | Clic sur « Le comptoir » dans la nav. | « Le comptoir fait les comptes : sept posts ce mois-ci, un attend ses chiffres. Les sujets tout chauds font près de deux fois plus d'impressions. » | 0:40 |
| 12 | `/garde-manger` | Clic sur « Le garde-manger ». | « Et l'article mis de côté est là, avec sa fraîcheur. Fin de la démo. » | 0:20 |

Total indicatif : 6 min (étape 8 allongée de 10 s pour la mise en page).

**Durées mesurées lors de la répétition du 17 novembre 2026** (navigateur piloté, sans parole, après `?demo=reset`) : landing à mot de passe validé en 1 min 29 s (étapes 1 à 6), four visible 4 s, publication au fournil à 2 min 06 s, comptoir à 2 min 11 s, garde-manger et plan B ensuite. Avec les phrases du tableau, la démo tient dans 5 à 7 minutes.

## Plans B

- **Le questionnaire bloque ou on manque de temps** : onglet `/connexion`, bouton « Utiliser le compte de démo (Léa) », Entrée. On arrive directement sur la fournée de Léa (pas de four), puis on reprend à l'étape 8.
- **Un état bizarre (données d'un essai précédent, mauvaise langue)** : ajouter `?demo=reset` à l'adresse de n'importe quelle page et valider. Tout est remis à zéro (comptes créés, garde-manger, brouillons, langue) ; le compte de Léa reste disponible. On reprend à l'étape 1, ou au plan B ci-dessus.
- **Le four ne s'affiche pas** (plus de 10 minutes entre le mot de passe et la fournée, ou compte de Léa) : la bento s'affiche directement ; dire « la fournée est déjà sortie du four » et continuer à l'étape 8.
- **La fournée ne charge pas** (« Impossible de charger la fournée ») : recharger la page (F5). La fournée vient d'un fichier d'exemple du site (`data/fournee.json`) : il suffit que le site soit en ligne. Sans réseau, passer au plan C.
- **Plan C, pas de réseau** : lancer le site en local (`node tools/serve.mjs` dans le dossier du projet, puis `http://localhost:4174/?demo=reset`) et dérouler le même scénario.
- **Un clic de trop** (news ignorée par erreur) : cliquer « Annuler » dans le message en bas de l'écran dans les 5 secondes, ou « Tout faire revenir » si toutes les news ont été ignorées.
- **Question du jury sur le mobile** : réduire la fenêtre ou ouvrir le site scanné sur un téléphone : sous 900 px la nav devient une barre avec un bouton « Menu ».
