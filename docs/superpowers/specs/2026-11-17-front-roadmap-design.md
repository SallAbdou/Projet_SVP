# Feuille de route du front jusqu'à la démo jury

Date : 2026-11-17 · Statut : à valider · Auteur : Claude avec Delio

## Intention

Votre pAIn quotidien doit être présenté à un jury bientôt. Delio est seul sur le front et peut y consacrer le temps nécessaire. Le but : un **front très beau, cliquable de bout en bout**, qui raconte le parcours de Léa sans un seul bouton mort. Les automatisations n8n sont prêtes de leur côté ; les brancher est un bonus, pas une condition. Si le branchement n'est pas fait, le front seul doit suffire à convaincre.

## Objectifs

1. Le jury suit Léa du QR code jusqu'à la publication LinkedIn, en un seul parcours fluide.
2. Les pages sont cohérentes entre elles : un sujet mis de côté apparaît au garde-manger, un post publié compte dans le comptoir.
3. Chaque écran est soigné, bilingue FR/EN, utilisable au clavier et sur mobile.
4. Le front est prêt à recevoir n8n : chaque page lit ses données dans un JSON au format du futur flux.

## Non-objectifs

- **Aucun travail côté back avant la démo** (décision de Delio) : pas de Supabase, pas d'appel à n8n, pas de Tally branché. Tout le back est simulé dans le navigateur.
- Pas de vraie publication sur LinkedIn : confirmation simulée.
- Pas de migration de framework (décision : option A, consolider l'existant).

## Principe : simuler le back derrière des adaptateurs

Le front ne parle jamais directement au stockage ou au réseau. Il passe par deux fichiers dont l'interface est celle du futur back ; seule leur implémentation change au moment du branchement.

- **`auth.js`**, futur Supabase Auth :
  `inscrireDepuisQuestionnaire(profil)`, `definirMotDePasse(motDePasse)`, `seConnecter(email, motDePasse)`, `motDePasseOublie(email)`, `seDeconnecter()`, `utilisateurCourant()`.
  Version simulée : le compte (prénom, e-mail, identifiant d'abonné, profil) est gardé en `localStorage` ; **aucun mot de passe n'est jamais stocké**, seule la règle de saisie est vérifiée ; un compte de démo (Léa) existe toujours.
- **`api.js`**, futur webhook WF3 : `chargerFournee()` renvoie exactement la réponse de WF3 (`etat`, `prenom`, `articles`). Version simulée : lit `data/fournee.json`, et peut renvoyer `attente` pendant quelques secondes juste après l'inscription pour jouer l'écran « on enfourne ta fournée ».

Au branchement : `auth.js` appelle Supabase (clé publique uniquement), WF2 invite l'utilisateur et envoie le vrai e-mail, WF3 vérifie le jeton de session au lieu d'un identifiant en clair. Le reste du front ne change pas.

## Anti-objectifs (échec même si « ça marche »)

- La démo plante ou se bloque devant le jury (réseau, données vides, état laissé par une répétition).
- Les pages se contredisent (chiffres, articles, prénom).
- Un clic sur le chemin de démo mène à un 404 ou ne fait rien.
- Une page collecte un vrai mot de passe ou de vraies données personnelles.
- Une étape de build ou une dépendance npm apparaît pour faire tourner le site.

## Contraintes

- HTML statique sur Vercel, moteur maison `dc.js` + `boot.js`, aucune étape de build.
- Charte existante : Fraunces + DM Sans, palette brun / crème / doré Maillard, métaphore boulangère.
- Bilingue FR/EN, cibles tactiles de 44 px, focus visibles.
- La page News bento (PR n°1) est la référence de qualité et d'architecture : logique pure testée dans un fichier, DOM dans un autre, données dans un JSON.

## Approches envisagées pour la base technique

1. **Consolider la stack actuelle** (retenue par Delio). Environ 1 jour de socle, la PR n°1 reste valable, pas de build.
2. Preact via CDN sans build : vrais composants, mais réécriture des 5 pages avant tout écran neuf.
3. Framework avec build (Vite + React ou Next.js) : meilleure base à long terme, réécriture complète, plus de risque avant le jury. À reconsidérer après la démo si le projet continue.

## Le parcours de démo (fil rouge)

```
QR code ─► Landing LPQ ─► Plateforme grisée + CTA ─► Questionnaire ─► Ton schéma personnalisé
                                                                          │
   Comptoir ◄── Fournil (pétrir, publier) ◄── Garde-manger ◄── Fournée bento ◄── Inscription simulée
   (KPI mis à jour par la publication)
```

## Lots, dans l'ordre

### Lot 0 · Socle (prérequis de tout le reste)

- **Nav partagée** : un fichier `nav.js` produit la nav latérale pour toutes les pages (page courante, compteur du garde-manger calculé, lien profil). Fin des 5 copies.
- **État partagé** : `store.js`, logique pure testée, sauvegardée en `localStorage` sous une seule clé versionnée. Contient : session simulée (prénom, connecté ou non), profil issu du questionnaire, articles mis de côté, brouillons, posts publiés avec leurs chiffres.
- **Moteur de rendu** : `boot.js` conserve l'élément actif, la position du curseur et le défilement à chaque rendu, pour que la saisie dans un champ ne soit plus cassée.
- **Données** : une source JSON par domaine dans `data/` (fournée déjà faite ; comptoir, garde-manger, fournil à extraire des pages), mêmes articles et mêmes chiffres partout.
- **Mode démo** : `?demo=reset` remet le site dans l'état initial avant le passage devant le jury.
- **Lien `/preferences`** : remplacé par « Mon profil », qui affiche les réponses du questionnaire et permet de le refaire.

### Lot 1 · Entrée du parcours

- **Landing LPQ** (`/` devient la landing ; le comptoir passe à `/comptoir`) : promesse en une phrase, « comment ça marche » en 3 étapes, aperçu visuel de la fournée bento, CTA « Goûter ma fournée ». QR code imprimable qui pointe vers elle.
- **Plateforme grisée** : l'application floutée derrière une carte d'invitation, CTA vers le questionnaire. Donne envie avant de demander quoi que ce soit.
- **Questionnaire de démo dans le site** : les mêmes questions que le Tally (prénom, e-mail, métiers, thématiques parmi les 12, relation avec l'IA, langue), en étapes, aux couleurs du site. Il sera remplacé par le vrai Tally au branchement. (Choix de Claude : la démo reste hors ligne et rien ne part vers n8n.)
- **Ton schéma personnalisé** : écran de restitution, « voici ta fournée type » (thématiques, métier, ton, nombre de news) avec un aperçu de la bento préréglée selon les réponses.
- **E-mail de confirmation simulé** : écran « vérifie ta boîte mail » montrant l'adresse saisie, plus un aperçu du mail (fenêtre « boîte de réception » dans le site) avec son bouton « Confirmer mon adresse ».
- **`/creer-mot-de-passe`** : choix du mot de passe avec règles affichées en direct et confirmation, puis connexion automatique.
- **Fournée en préparation** : écran d'attente animé tant que `api.js` répond `attente`, puis la fournée.
- **`/connexion`** et **mot de passe oublié** : e-mail + mot de passe, messages d'erreur clairs ; le compte de démo de Léa fonctionne toujours.
- **Mention démo et confidentialité** : case de consentement et page courte de confidentialité, comme pour le vrai produit.

### Lot 2 · La fournée qui agit

- Sur chaque bloc news : **Mettre de côté** (ajout au garde-manger, compteur de nav mis à jour), **Pétrir** (ouvre le fournil sur ce sujet), **Ignorer** (le bloc passe au sujet suivant).
- Retour visuel bref à chaque action (message discret annoncé aux lecteurs d'écran).

### Lot 3 · Garde-manger réel

- Liste lue dans le `store`, filtres de fraîcheur fonctionnels, **Retirer**, **Pétrir**, état vide soigné.

### Lot 4 · Fournil

- Ouvre le sujet choisi (ou propose de choisir).
- Brouillon éditable, sélecteurs **ton** et **langue** qui changent de variante de brouillon (variantes écrites d'avance dans le JSON du fournil).
- **Checklist calculée en direct** sur le texte : accroche courte, chiffre présent, question finale, longueur.
- **Copier** (presse-papiers) et **Publier sur LinkedIn** simulé : fenêtre de confirmation, aperçu du post, puis ajout aux posts publiés.
- **Saisie des chiffres** après publication, enregistrée dans le `store`.

### Lot 5 · Comptoir

- KPI et graphique calculés à partir des posts publiés du `store` et des données d'exemple.
- « Tout juste sorti du four » = la news n°1 de la fournée ; aperçu du garde-manger réel.

### Lot 6 · Finitions de démo

- Passe visuelle sur tous les écrans, transitions douces, états vides et de chargement.
- Passe responsive (375, 768, 1024, 1440 px) et accessibilité (clavier, contrastes, lecteur d'écran sur le parcours).
- **Scénario de démo écrit** (5 à 7 minutes, clics exacts), répété avec `?demo=reset`.
- Page 404 et liens de nav vérifiés.

### Lot 7 · Après la démo : branchement du back

- `auth.js` passe sur Supabase Auth ; WF2 invite l'utilisateur (vrai e-mail) ; le vrai Tally remplace le questionnaire de démo.
- `api.js` appelle WF3 avec le jeton de session et **retombe sur le JSON local** en cas d'échec ou de lenteur.
- À régler côté back à ce moment : service d'envoi d'e-mails, adresses de retour autorisées dans Supabase, accès CORS au webhook n8n, choix 5 ou 7 news.

## Ordre et dépendances

Lot 0 d'abord (tout en dépend). Ensuite 1 → 2 → 3 → 4 → 5 suivent le parcours ; 3 et 5 peuvent s'échanger. Lot 6 en fin, mais une passe rapide après chaque lot. Lot 7 seulement si tout le reste est prêt.

Chaque lot fait l'objet de son propre plan et de sa propre PR, sur le modèle de la PR n°1.

## Choix faits par Claude (à vérifier par Delio)

- **Pages de l'application protégées mais jamais bloquantes** : sans session, elles renvoient vers `/connexion`, où le compte de démo de Léa est toujours proposé. Un incident en démo se rattrape donc en un clic.
- **« Ignorer » vaut pour la journée** : le sujet ignoré est mémorisé avec la date de la fournée et réapparaît si la fournée change.
- **Point de départ du code** : le lot 0 part de la branche de la PR n°1 (ou de `main` une fois la PR fusionnée), car il réutilise `bento.js`, `bento-ui.js` et le serveur local.
- **Tests** : comme pour la PR n°1, toute logique pure (`store.js`, checklist du fournil, calcul des KPI) a ses tests `node --test` ; les écrans sont vérifiés dans le navigateur.

## Laissé au constructeur

- Les textes exacts des écrans, dans le ton existant (tutoiement, métaphore boulangère).
- Les détails visuels dans la charte.
- Le format interne du `store`, tant qu'il est versionné et testé.

## Contrat avec n8n (d'après les workflows existants)

Réponses de Delio : le questionnaire est un **Tally** (réponses stockées côté back) ; l'écran « ta fournée type » correspond bien au « custom schéma » du tableau.

Chaîne existante :
- **WF1** collecte les articles toutes les 3 h, Gemini les analyse (axe, feu, scores, thématiques, métiers, niveau, sujet, résumé en français) et les écrit dans Airtable.
- **WF2** reçoit le webhook Tally à l'inscription, lit le profil (prénom, e-mail, métiers, thématiques, relation avec l'IA, langue) et prépare les **5 premiers articles** de l'abonné, avec une phrase « Pour toi ».
- **WF4** refait chaque matin à 6 h une sélection de **5 articles** par inscrit.
- **WF3** est l'API du front : `POST /file` avec `{ "id": "<identifiant abonné>" }`. Réponse :

```json
{ "etat": "pret", "prenom": "Léa",
  "articles": [ { "ref": "rec…", "rang": 1, "titre": "…", "url": "https://…", "source": "The Decoder",
                  "feu": "vert", "raisonFeu": "…", "axe": "Axe 2", "resume": "…", "pourToi": "Pour toi : …",
                  "durabilite": 4, "propension": 5, "lienOffre": 4 } ] }
```

`etat` vaut aussi `"attente"` (la sélection n'est pas encore écrite) ou `"invalide"` (identifiant refusé).

Conséquences pour le front :
- **Le lot 0 adopte ce format tel quel** pour `data/fournee.json` (correspondance : `feu` vert / orange / rouge = tout chaud / à pétrir / rassis ; `durabilite`, `propension`, `lienOffre` = les trois scores ; monétisation = leur somme). Le lot 7 se réduit alors à remplacer l'adresse du fichier par celle du webhook.
- **Les contenus arrivent dans une seule langue** : titre dans la langue d'origine, résumé en français, « pour toi » en français ou en anglais selon le profil. Le bouton FR/EN traduit l'interface, pas les articles. Les champs `{ fr, en }` de la PR n°1 disparaissent.
- **L'état `attente` devient un écran du parcours** : après le questionnaire, le front interroge WF3 toutes les quelques secondes et montre « on enfourne ta première fournée » jusqu'à `pret`. C'est aussi le moment idéal pour l'écran « ta fournée type ».
- Les champs du profil Tally (métiers, thématiques parmi les 12 de WF1, relation Timide / En couple / Marié, langue) alimentent « Mon profil » et l'écran de restitution.

## Points réglés et points reportés au branchement

- **Identifiant d'abonné** : réglé par l'authentification. Il sera rangé dans le compte Supabase ; en simulation, dans le compte local d'`auth.js`.
- **5 ou 7 news** : la démo garde 1 / 3 / 5 / 7 avec la fournée d'exemple de 7 sujets. Au branchement, soit n8n sélectionne 7 sujets, soit le front passe à 1 / 3 / 5. Les emplacements sans sujet sont déjà cachés automatiquement.
- **Envoi d'e-mails, CORS, règles d'accès Supabase** : lot 7, avec Abdou (accès Supabase).
