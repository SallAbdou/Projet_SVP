# Lot 1 · Entrée du parcours : design

Date : 2026-11-17 · Statut : à valider · Découle de `2026-11-17-front-roadmap-design.md` (lot 1, principe des adaptateurs)

## Intention

Le jury doit voir Léa arriver par un QR code, découvrir le produit, répondre au questionnaire, recevoir son e-mail de confirmation, créer son mot de passe et voir sa première fournée sortir du four. Tout est simulé dans le navigateur, mais chaque écran doit être crédible et prêt à recevoir le vrai back (Supabase Auth, Tally, n8n) sans être redessiné.

## Le parcours

```
/  (landing)  ──CTA──►  /decouvrir (app floutée + invitation)  ──►  /questionnaire (6 étapes)
                                                                          │
/fournee ◄── attente « au four » ◄── /creer-mot-de-passe ◄── /verifie-tes-mails ◄── /ta-fournee-type
   ▲
/connexion ◄── toute page de l'application sans session        /mot-de-passe-oublie ─► /verifie-tes-mails
```

## Écrans

- **`/` landing** (l'actuel comptoir déménage à `/comptoir`) : promesse en une phrase (« Chaque matin, l'actu IA qui compte pour ton métier, prête à pétrir en post LinkedIn »), trois étapes illustrées (on collecte, on trie pour toi, tu publies), aperçu de la bento, CTA « Goûter ma fournée », lien discret « J'ai déjà un compte ». Pas de nav latérale.
- **`/decouvrir` plateforme grisée** : la fournée bento en arrière-plan, floutée et non cliquable, avec une carte d'invitation au premier plan : « Ta fournée t'attend. 2 minutes pour la régler à ton goût. » et le CTA vers le questionnaire.
- **`/questionnaire`** : reprend le Tally « Souscription à la Newsletter » (https://tally.so/r/RWWqKd). Une question par écran, barre de progression, retour arrière, saisie conservée si on revient en arrière ou si on recharge la page. En tête, l'accroche du Tally : « Nous cuisinons tes news préférées chaque matin, avalées devant ton café en 5 minutes. »
  **Les textes des choix sont repris mot pour mot**, car n8n (WF2, WF4) reconnaît certains d'entre eux (« françaises uniquement », « English all the way ») : le jour du branchement, les réponses auront déjà le bon format. Les intitulés des questions passent du vouvoiement du Tally au tutoiement du site (choix de Claude, pour un ton cohérent).
  1. Prénom et e-mail (obligatoires, format de l'e-mail vérifié).
  2. Quel est ton « gagne pAIn » ? (plusieurs choix) : Entrepreneur, Consultant, Influenceur, Formateur, Étudiant, Autre.
  3. Quelles thématiques IA te font le plus vibrer ? (plusieurs choix, au moins un) : LLMs, Vidéo, Image, Automatisation et agents, Cybersécurité, Actualité des grandes firmes, Monétisation, Finance et spéculation, Hardware, IA en entreprise, Ecosystèmes, Ingénierie R&D.
  4. Quelle est ta relation avec l'IA ? : Timide, En couple, Marié (avec une ligne d'explication pour chacun, issue des règles de ton de n8n : mots simples, ton normal, ton expert).
  5. Dans quelle langue doit-on te parler ? : « Je veux des sources françaises uniquement », « Je veux des sources polyglottes avec une traduction française », « English all the way ».
  6. Consentements, tous deux obligatoires : « J'accepte de souscrire à votre newsletter quotidienne » et « J'accepte que mes données soient traitées conformément à la règlementation RGPD en vigueur et que mon activité serve à personnaliser mon contenu », avec le lien vers `/confidentialite`.
- **`/ta-fournee-type`** (le « custom schéma » du tableau) : « Voici ta fournée, Léa » ; récapitulatif (métier, thématiques, ton, langue) et aperçu miniature de la bento préréglée : 3 news pour Timide, 5 pour En couple, 7 pour Marié. CTA « Recevoir ma fournée ».
- **`/verifie-tes-mails`** : « On t'a envoyé un e-mail à lea@… », bouton « Ouvrir ma boîte de réception (démo) » qui ouvre une fenêtre imitant le mail reçu (expéditeur, objet, bouton « Confirmer mon adresse »). Le bouton mène à `/creer-mot-de-passe`. Lien « Renvoyer l'e-mail » (message de confirmation).
- **`/creer-mot-de-passe`** : mot de passe + confirmation, règles affichées et cochées en direct (8 caractères minimum, une majuscule, un chiffre), bouton afficher / masquer. Validation : session ouverte, puis `/fournee`.
- **Première fournée** : sur `/fournee`, juste après l'inscription, l'adaptateur répond `attente` pendant 4 secondes ; la page affiche une animation « Ta fournée est au four » et réinterroge toutes les 2 secondes, puis affiche la bento.
- **`/connexion`** : e-mail + mot de passe, message d'erreur clair, lien « Mot de passe oublié », bouton « Utiliser le compte de démo (Léa) » qui remplit le formulaire. Après connexion, retour à la page demandée.
- **`/mot-de-passe-oublie`** : e-mail, puis même écran que `/verifie-tes-mails` (mail « Réinitialise ton mot de passe »), puis `/creer-mot-de-passe`.
- **`/confidentialite`** : page courte : quelles données (prénom, e-mail, réponses), pourquoi (choisir les articles), où (pour la démo : uniquement dans ce navigateur), comment les effacer (bouton « Effacer mes données » = remise à zéro).
- **Garde des pages de l'application** (`/comptoir`, `/fournee`, `/fournil`, `/garde-manger`, `/profil`) : sans session, redirection vers `/connexion?retour=…`.
- **Nav** : prénom et initiale de l'utilisatrice connectée, bouton « Se déconnecter ». **Mon profil** affiche les réponses du questionnaire.

## Adaptateur `auth.js` (simulé)

Interface définie par la feuille de route : `inscrireDepuisQuestionnaire(profil)`, `definirMotDePasse(motDePasse)`, `seConnecter(email, motDePasse)`, `motDePasseOublie(email)`, `seDeconnecter()`, `utilisateurCourant()`.

- Comptes gardés en `localStorage` (`pq-auth`, ajouté aux clés effacées par `?demo=reset`) : prénom, e-mail, identifiant d'abonné aléatoire, profil, état (`a-confirmer` ou `actif`), date d'inscription.
- **Aucun mot de passe n'est stocké.** `definirMotDePasse` vérifie seulement les règles. `seConnecter` accepte tout compte `actif` dont l'e-mail existe, avec un mot de passe qui respecte les règles.
- Le compte de démo de Léa (`lea@demo.painquotidien.fr`) existe toujours, même après remise à zéro.
- Toute la logique est pure et testée (`node --test`), comme `store.js`.

## Non-objectifs

- Aucun appel réseau, aucun vrai e-mail, aucun vrai Tally.
- Pas de « se souvenir de moi » ni de multi-comptes visibles : un seul compte connecté à la fois.

## Anti-objectifs

- Un écran qui laisse croire qu'un vrai mot de passe est enregistré ou envoyé : une mention « démo » discrète figure sur les écrans de compte.
- Un cul-de-sac : chaque écran a une suite et un retour.

## Approches envisagées

1. **Une page HTML par écran** (retenue) : même modèle que les pages existantes, adresses propres (utile pour le QR code et pour Supabase, qui renvoie vers des adresses précises).
2. Un seul fichier « onboarding » qui change d'étape en interne : moins de fichiers, mais adresses non partageables et retour arrière du navigateur cassé.

## Réponses de Delio

- Libellés : ceux du Tally (relevés le 2026-11-17, ci-dessus).
- Promesse de la landing validée.
