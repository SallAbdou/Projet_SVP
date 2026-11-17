# Lot 7 · Branchement du back (design)

Date : 2026-11-17. Feuille de route : `2026-11-17-front-roadmap-design.md` (sections « Principe : simuler le back derrière des adaptateurs », « Contrat avec n8n », lot 7).

## Décision clé

**La démo devant le jury reste en mode démo.** Le mode réel est préparé derrière un interrupteur (`config.js`), désactivé par défaut. Rien du parcours démo ne change de comportement : les 121 tests existants restent verts et `docs/demo/scenario-jury.md` reste valable. Aucune vraie valeur (URL, clé) n'est dans le dépôt : Abdou les remplira.

## 1. `config.js` : l'interrupteur

Chargé en premier sur toutes les pages (premier `<script>` du `<head>`).

```js
window.PQ_CONFIG = { mode: 'demo', supabaseUrl: '', supabaseCleAnon: '', webhookFournee: '',
  tallyUrl: 'https://tally.so/r/RWWqKd', siteUrl: 'https://team42svp.vercel.app', delaiReseauMs: 8000 };
```

- Fonction pure `Config.modeEffectif(config)` : `'reel'` seulement si `mode === 'reel'`, `supabaseUrl` et `webhookFournee` sont des URL `https://`, et `supabaseCleAnon` est une chaîne non vide. Sinon `'demo'`, et un avertissement console si `mode === 'reel'` était demandé.
- Le résultat est exposé en `window.PQ_MODE` et en attribut `data-mode` sur `<html>` : la feuille `parcours.css` cache en mode réel les mentions « Démo : … » et tout élément `[data-demo-seul]` (bouton « compte de démo »).
- `Config.fetchAvecDelai(fetch, url, options, ms)` : `fetch` interrompu par `AbortController` après `ms`. Partagé par `auth.js` et `api.js`.
- Un test verrouille les valeurs par défaut : `mode: 'demo'` et les trois champs secrets vides. Un commit avec de vraies valeurs fait échouer les tests.

## 2. `auth.js` en mode réel : Supabase Auth par `fetch`

Aucune librairie, aucune dépendance. Les six méthodes publiques gardent leur nom et leur retour `{ ok, erreur }`. En mode réel, les méthodes réseau renvoient une **promesse** de `{ ok, erreur }` ; les pages appellent donc `Promise.resolve(Auth.methode(...)).then(...)`, ce qui marche pour les deux modes (en démo, un seul micro-délai en plus, rien de visible). `utilisateurCourant()` reste **synchrone** (la garde des pages en dépend) : il lit la session en `localStorage`.

### Points d'accès (vérifiés dans les sources officielles)

Sources : README du serveur Supabase Auth (`github.com/supabase/auth`, sections `/token`, `/user`, `/recover`, `/logout`, `/invite`, `/verify`), client officiel `supabase-js` (`packages/core/auth-js/src/GoTrueClient.ts`, `GoTrueAdminApi.ts`, `lib/fetch.ts`), page « API keys » de la documentation Supabase.

| Action | Requête |
|---|---|
| Connexion | `POST {supabaseUrl}/auth/v1/token?grant_type=password`, corps `{ email, password }` ; réponse `access_token`, `token_type`, `expires_in`, `refresh_token` (et `user`) |
| Renouvellement | `POST /auth/v1/token?grant_type=refresh_token`, corps `{ refresh_token }`, même réponse |
| Choix du mot de passe | `PUT /auth/v1/user` avec `Authorization: Bearer <access_token du lien>`, corps `{ password }` ; réponse : l'utilisateur |
| Mot de passe oublié | `POST /auth/v1/recover?redirect_to=<siteUrl>/creer-mot-de-passe`, corps `{ email }` (le client officiel passe `redirectTo` en paramètre d'adresse `redirect_to`) |
| Déconnexion | `POST /auth/v1/logout` avec `Authorization: Bearer` (révoque les jetons de renouvellement) |
| Invitation (n8n, pas le front) | `POST /auth/v1/invite?redirect_to=…`, corps `{ email, data }`, en-tête `Authorization: Bearer <service_role>` |

Toutes les requêtes portent l'en-tête `apikey: <clé publique>` (page « API keys » : les clés passent dans l'en-tête `apikey`) et `Content-Type: application/json`.

Lien d'invitation ou de réinitialisation : après `GET /verify`, Supabase redirige vers `redirect_to` avec le fragment `#access_token=…&token_type=bearer&expires_in=3600&refresh_token=…&type=invite` (ou `type=recovery`), parfois `expires_at`. En cas d'échec : fragment `error`, `error_code`, `error_description` (le client officiel lève alors une erreur). Comme le client officiel : `expires_at = expires_at` du fragment, sinon `maintenant + expires_in` (en secondes).

### Comportement

- **Lecture du fragment** (au chargement de `auth.js`, toute page) : `access_token` + `refresh_token` + `expires_in` + `token_type` requis. `type=invite` donne une demande `inscription`, `type=recovery` une demande `reinitialisation`, tout autre type ouvre directement une session. Le fragment est effacé de la barre d'adresse (`history.replaceState`). Si la page n'est pas `/creer-mot-de-passe` et qu'une demande vient d'être lue, on y est redirigé (cas où Supabase retombe sur la Site URL). Un fragment d'erreur ou incomplet ne crée rien : `/creer-mot-de-passe` affiche alors « Ce lien n'est plus valable ».
- **E-mail et métadonnées** : pris dans `user` de la réponse, à défaut dans la charge utile du jeton (JWT décodé en base64url, UTF-8 pour les prénoms accentués).
- **Session** en `localStorage` sous `pq-auth-reel` (distincte de `pq-auth` de la démo) : `{ session: { access_token, refresh_token, expires_at, user }, demande: { email, motif, jetons } }`. Une demande dont le jeton a expiré est ignorée à la lecture.
- **Utilisateur courant** : depuis `user.user_metadata` : `prenom`, `abonne_id`, `profil` (`metiers`, `thematiques`, `relation`, `langue`), même forme que le compte de démo (`statut: 'actif'`).
- **`Auth.jetonValide()`** (nouveau, pour `api.js`) : renvoie l'`access_token` s'il reste plus de 60 s, sinon renouvelle. Refus du renouvellement (400/401) : session effacée, `null`. Erreur réseau : promesse rejetée.
- **Erreurs** : connexion 400 ⇒ `identifiants` ; choix du mot de passe 401/403 ⇒ `aucune-demande` (demande effacée, vue « lien plus valable »), 422 ⇒ `mot-de-passe-faible` ; tout le reste (réseau, délai, 5xx, 429) ⇒ `reseau`, avec un message propre sur la page. Mot de passe oublié : `reseau` seulement en cas d'échec réseau ou HTTP, jamais d'indice sur l'existence du compte.
- **Déconnexion** : session locale effacée tout de suite (synchrone), requête `logout` envoyée avec `keepalive` : la navigation qui suit ne l'annule pas.
- Mode réel : `inscrireDepuisQuestionnaire` renvoie `{ ok: false, erreur: 'questionnaire-tally' }` (l'inscription passe par Tally), `ouvrirFour` ne fait rien. `Auth.charger()` renvoie l'état réel (avec `comptes: []`, pour que `compteParEmail` ne plante jamais).
- Fonctions pures testées avec un `fetch` simulé : construction des requêtes, lecture du fragment, lecture des réponses, expiration, décodage du jeton, adaptateur complet `avecSupabase(config, { fetch, storage, maintenant })`.

## 3. `api.js` en mode réel : WF3 avec le jeton

- `POST webhookFournee`, en-têtes `Authorization: Bearer <access_token>` et `Content-Type: application/json`, corps `{}`.
- Réponse validée par `estReponseValide` : renvoyée telle quelle (`pret`, `attente` ou `invalide`). L'état `attente` réel garde la relance toutes les 2 s des pages.
- Délai `delaiReseauMs` dépassé, erreur réseau, statut HTTP en échec, réponse invalide, ou renouvellement du jeton impossible pour cause réseau : on lit `data/fournee.json` et on ajoute `source: 'exemple'`.
- Plus de session valide (`jetonValide()` vaut `null`) : `{ etat: 'invalide' }`, que les pages traitent déjà.
- `/fournee` et `/comptoir` affichent alors discrètement « Fournée d'exemple : n8n ne répond pas » (EN : « Sample batch: n8n is not responding »).
- Fonction testable `Api.chargerFourneeReelle(deps)` avec `deps = { fetch, jeton, url, delaiMs, lireExemple }`.

## 4. Questionnaire et pages en mode réel

- Le CTA de `/decouvrir` mène au Tally (`tallyUrl`, même onglet) ; `/questionnaire` redirige vers le Tally dès le `<head>`. Tally redirigera vers `/verifie-tes-mails` (réglage côté Tally, décrit dans le guide).
- `/verifie-tes-mails` en mode réel : plus de renvoi vers `/connexion` faute de demande, texte générique « On vient de t'envoyer un e-mail… », sans boîte de démo ni bouton « Renvoyer ». Après « mot de passe oublié », l'adresse saisie reste affichée comme aujourd'hui.
- Pages protégées et nav : inchangées, elles lisent `Auth.utilisateurCourant()`, qui lit la session réelle.
- `/connexion`, `/creer-mot-de-passe`, `/mot-de-passe-oublie` : message d'erreur `reseau` ajouté (FR et EN).

## 5. Guide `docs/branchement-back.md`

Pour Abdou et l'équipe n8n, pas à pas : remplir `config.js` ; Supabase (Site URL, Redirect URLs, modèles d'e-mail en français et tutoiement, SMTP type Resend ou Brevo, clé `service_role` jamais dans le front) ; WF2 (nœud HTTP d'invitation) ; WF3 (vérification du jeton par `GET /auth/v1/user`, `user_metadata.abonne_id`, CORS et OPTIONS) ; Tally (redirection de fin) ; 5 ou 7 news ; test de bout en bout et retour en mode démo. Aucun identifiant, clé ni adresse e-mail réels.

## Hors champ

Vrai Supabase et vrai n8n : non testables d'ici (pas d'accès). Flux PKCE (`?code=`) : non géré, les liens d'invitation par l'API d'administration utilisent le fragment. `/ta-fournee-type` n'est pas dans le parcours réel.
