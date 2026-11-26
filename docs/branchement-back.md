# Brancher le vrai back (Supabase + n8n + Tally)

Pour Abdou (accès Supabase) et l'équipe n8n. Le site tourne aujourd'hui **en mode démo** : tout est simulé dans le navigateur. Ce guide explique comment passer en **mode réel**, le tester, et revenir en démo.

> La démo devant le jury se fait en mode démo. Ne passez en mode réel qu'après la soutenance, ou sur une copie du site.

Design détaillé (formats exacts, sources) : `docs/superpowers/specs/2026-11-17-lot7-branchement-design.md`.

## Vue d'ensemble

```
Tally ──webhook──▶ WF2 (n8n) ──invitation──▶ Supabase Auth ──e-mail──▶ l'abonné
                                                                     │ clic sur le lien
                                                                     ▼
                         site /creer-mot-de-passe (choisit son mot de passe, session ouverte)
                                                                     │
                         site /fournee ──POST + jeton──▶ WF3 (n8n) ──vérifie le jeton──▶ Supabase
```

Le front ne contient que la **clé publique** Supabase. La clé `service_role` reste dans n8n.

## 1. Remplir `config.js`

À la racine du dépôt :

```js
var PQ_CONFIG = {
  mode: 'reel',
  supabaseUrl: 'https://<votre-projet>.supabase.co',
  supabaseCleAnon: '<clé publique : anon ou publishable>',
  webhookFournee: 'https://<votre-n8n>/webhook/<chemin-de-WF3>',
  tallyUrl: 'https://tally.so/r/RWWqKd',
  siteUrl: 'https://team42svp.vercel.app',
  delaiReseauMs: 8000
};
```

- Les trois adresses doivent commencer par `https://`. S'il manque quelque chose, le site **reste en démo** et l'écrit dans la console du navigateur.
- **Jamais la clé `service_role`** (ou « secret ») dans ce fichier : elle donnerait tous les droits à n'importe quel visiteur.
- Un test (`tests/config.test.js`) vérifie que le fichier commité est en mode démo sans valeur. Pour la production, faites le changement sur une branche dédiée et adaptez ce test en connaissance de cause.

## 2. Régler Supabase (tableau de bord, rubrique Authentication)

1. **URL Configuration**
   - Site URL : `https://team42svp.vercel.app`
   - Redirect URLs : ajouter `https://team42svp.vercel.app/creer-mot-de-passe` (et `http://localhost:4174/creer-mot-de-passe` pour tester en local).
2. **Emails, Templates** : garder le lien `{{ .ConfirmationURL }}` et traduire en français, en tutoyant :
   - *Invite user* : objet « Confirme ton adresse pour recevoir ta fournée », texte « Bonjour {{ .Data.prenom }}, ta fournée est presque prête. Clique ici pour choisir ton mot de passe : … ».
   - *Reset password* : objet « Réinitialise ton mot de passe », texte « Tu as demandé à changer ton mot de passe. Clique ici pour en choisir un nouveau. Si ce n'est pas toi, ignore ce message. Le lien reste valable 1 heure. »
3. **SMTP Settings** : brancher un service d'envoi (Resend, Brevo…). L'envoi par défaut de Supabase est très limité (quelques e-mails par heure, réservé aux tests) et ne suffit pas pour de vrais abonnés. Il faut un domaine vérifié chez le service choisi.
4. Laisser activée la connexion par e-mail et mot de passe. Le front impose 8 caractères, une majuscule et un chiffre : réglez au moins 8 caractères de longueur minimale côté Supabase.

## 3. WF2 : inviter l'abonné après le Tally

Après le nœud « Lire les réponses » (qui a le prénom, l'e-mail et le profil), ajouter :

**Nœud HTTP « Inviter dans Supabase »**
- Méthode `POST`, adresse `https://<votre-projet>.supabase.co/auth/v1/invite?redirect_to=https://team42svp.vercel.app/creer-mot-de-passe`
- En-têtes : `apikey: <service_role>`, `Authorization: Bearer <service_role>`, `Content-Type: application/json` (la clé dans un identifiant n8n, pas en clair dans le nœud).
- Corps :

```json
{
  "email": "{{ e-mail lu dans le Tally }}",
  "data": {
    "prenom": "{{ prénom }}",
    "abonne_id": "{{ identifiant de l'abonné (ex. id de l'enregistrement Airtable) }}",
    "profil": { "metiers": ["…"], "thematiques": ["…"], "relation": "En couple", "langue": "…" }
  }
}
```

`data` devient `user_metadata` : le site y lit le prénom et le profil (nav, « Mon profil »).

**Nœud HTTP « Fixer abonne_id » (recommandé, sécurité)**
`user_metadata` peut être modifié par l'utilisateur lui-même. Pour que personne ne puisse se faire passer pour un autre abonné, rangez aussi l'identifiant dans `app_metadata`, que seule la clé `service_role` peut écrire :
- `PUT https://<votre-projet>.supabase.co/auth/v1/admin/users/{{ id renvoyé par l'invitation }}`, mêmes en-têtes, corps `{ "app_metadata": { "abonne_id": "…" } }`.

Le site prend `app_metadata.abonne_id` en priorité, sinon `user_metadata.abonne_id`.

Si l'e-mail existe déjà, Supabase répond une erreur : prévoir une branche qui l'ignore (l'abonné peut utiliser « Mot de passe oublié »).

## 4. WF3 : vérifier le jeton au lieu de lire `body.id`

Le site appelle maintenant WF3 ainsi :

```
POST <webhookFournee>
Authorization: Bearer <jeton de session de l'abonné>
Content-Type: application/json

{}
```

À changer dans WF3 :
1. **Remplacer la lecture de `body.id`** par un nœud HTTP `GET https://<votre-projet>.supabase.co/auth/v1/user` avec les en-têtes `apikey: <clé publique ou service_role>` et `Authorization: <l'en-tête Authorization reçu, recopié tel quel>`.
   - Réponse 200 : l'utilisateur. Prendre `app_metadata.abonne_id` (sinon `user_metadata.abonne_id`) et continuer comme avant avec cet identifiant.
   - Réponse 401 ou 403 : répondre `{ "etat": "invalide" }`.
2. **Réponse inchangée** : `{ etat, prenom, articles: [ … ] }` comme aujourd'hui.
3. **CORS** : le navigateur envoie d'abord une requête `OPTIONS` (à cause de l'en-tête `Authorization`). Le webhook doit répondre à `OPTIONS` et à `POST` avec :
   - `Access-Control-Allow-Origin: https://team42svp.vercel.app` (ajouter `http://localhost:4174` pour les tests locaux)
   - `Access-Control-Allow-Methods: POST, OPTIONS`
   - `Access-Control-Allow-Headers: Authorization, Content-Type`
   Dans n8n, le nœud Webhook a une option d'origines autorisées (CORS) dans ses options ; sinon, renvoyer ces en-têtes depuis le nœud « Respond to Webhook ». À vérifier sur votre version de n8n.
4. **Rapidité** : au-delà de 8 s (`delaiReseauMs`), le site abandonne et affiche la fournée d'exemple avec la mention « Fournée d'exemple : n8n ne répond pas ». Si la sélection n'est pas prête, répondre vite `{ "etat": "attente" }` : le site redemande toutes les 2 s.

## 5. Tally

Dans les réglages du formulaire, page de fin : **rediriger vers** `https://team42svp.vercel.app/verifie-tes-mails`. Cette page affiche alors « On vient de t'envoyer un e-mail… ». En mode réel, les boutons « Régler ma fournée » mènent directement au Tally.

## 6. 5 ou 7 news

WF2 et WF4 sélectionnent aujourd'hui **5 articles**. Le site propose 1, 3, 5 ou 7 news et **cache automatiquement les emplacements sans sujet** : avec 5 articles, le choix « 7 » en affiche 5. Deux options, à trancher en équipe :
- n8n sélectionne 7 articles : tous les choix du site sont pleins ;
- n8n garde 5 : rien à changer, le choix 7 montre simplement 5 news.

## 7. Retours de personnalisation

Sur `/profil`, la zone « Affine ta fournée » permet à l'abonné d'écrire ce qu'il veut voir plus ou moins souvent (1 000 caractères au plus). En démo, ces retours restent dans le navigateur (`pq-retours`). En mode réel, le site les écrit et les relit **directement dans une table Supabase**, par l'API REST, avec le jeton de session de l'abonné.

### Créer la table (SQL Editor de Supabase)

```sql
create table public.retours (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  abonne_id text,
  texte text not null check (char_length(texte) between 1 and 1000),
  cree_le timestamptz not null default now()
);

alter table public.retours enable row level security;

create policy "insérer ses propres retours"
on public.retours for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "lire ses propres retours"
on public.retours for select
to authenticated
using ((select auth.uid()) = user_id);

create index retours_user_cree_le on public.retours (user_id, cree_le desc);
```

- `user_id` est rempli par la base (`default auth.uid()`) : le site ne l'envoie pas, et la politique refuse toute ligne qui ne serait pas celle de l'abonné connecté.
- Sans politique, RLS bloque tout : c'est voulu. Pas de politique de modification ni de suppression (l'abonné ne peut qu'ajouter et relire).

### Ce que le site envoie

```
POST https://<votre-projet>.supabase.co/rest/v1/retours
apikey: <clé publique>
Authorization: Bearer <jeton de session de l'abonné>
Content-Type: application/json
Prefer: return=minimal

{ "texte": "plus de sujets sur l'IA en PME, moins sur le hardware", "abonne_id": "…" }
```

Réponse attendue : `201` sans corps. Lecture des trois derniers : `GET …/rest/v1/retours?select=texte,cree_le&order=cree_le.desc&limit=3` avec les mêmes `apikey` et `Authorization`. En cas de `401`/`403`, le site dit que la session a expiré ; autre erreur ou plus de 8 s : « Envoi impossible pour l'instant », le texte reste dans le champ.

`abonne_id` vient de la session (comme pour WF3, `app_metadata.abonne_id` d'abord). C'est une aide au rapprochement, pas une preuve : côté n8n, se fier plutôt à `user_id`, ou à l'`abonne_id` de `app_metadata` de cet utilisateur.

### Test rapide

Connecté sur le site en mode réel, envoyer un retour depuis `/profil` : il apparaît sous « Tes derniers retours ». Dans Supabase, *Table Editor* > `retours` : la ligne a le bon `user_id`. Avec un autre compte, le retour n'est pas visible.

### Piste pour WF4 (« Choisir pour l'abonné »)

Dans WF4, pour chaque abonné, avant le nœud Gemini :
1. Nœud HTTP `GET https://<votre-projet>.supabase.co/rest/v1/retours?select=texte,cree_le&user_id=eq.<id Supabase de l'abonné>&cree_le=gte.<date d'il y a 30 jours>&order=cree_le.desc&limit=5`, avec `apikey` et `Authorization: Bearer` portant la clé `service_role` (identifiant n8n). La clé `service_role` ignore RLS : elle peut lire les retours de tous les abonnés, c'est pourquoi elle ne sort jamais de n8n.
2. Ajouter au prompt « Choisir pour l'abonné » un paragraphe du type : « Retours récents de l'abonné sur ses fournées (du plus récent au plus ancien) : … Tiens-en compte pour choisir, sans jamais écarter un article majeur du jour. » S'il n'y a aucun retour, ne rien ajouter.

**Rappel : la clé `service_role` ne va jamais dans le front** (ni dans `config.js`, ni dans le dépôt).

## 7 bis. Visite guidée (lot 28)

Note pour Abdou : en mode réel comme en démo, le fait d'avoir vu la visite guidée est stocké **dans le navigateur** (localStorage `pq-visite`, par compte, clé = e-mail en minuscules comme pour le thème). Rien n'est envoyé à Supabase ni à n8n.

- Conséquence : sur un autre navigateur ou après effacement des données du site, la visite se relance à la connexion.
- « Plus tard » reporte la visite jusqu'à la connexion suivante. En mode réel, le repère de connexion est `session.user.last_sign_in_at` de `pq-auth-reel` ; s'il manque, « Plus tard » vaut jusqu'à « Revoir la visite » (profil).
- Une synchro Supabase pourra venir plus tard (par exemple une colonne `visite_vue` sur le profil de l'abonné) ; elle n'est pas faite dans ce lot.

## 7 ter. Jeu des cartes et progression (lots 32 à 34)

Note pour Abdou : **rien n'est branché**. Aujourd'hui, dans les deux modes, le jeu vit dans le navigateur (localStorage `pq-jeu`, par compte, clé = e-mail en minuscules) : case « Jeu des cartes activé », points de cuisson, dernier jour où la découverte a rapporté, levain (jours et dernier jour nourri), cartes retournées aujourd'hui, cartes découvertes (avec leur fraîcheur du moment) et cuites. Depuis le lot 34, plus de rituel du matin ni de vue cartes : les cartes se découvrent dans la fournée. Règles et constantes dans `jeu.js` (`POINTS`, `NIVEAUX`, `LEVAIN`), design dans `docs/superpowers/specs/2026-11-25-lot33-progression-design.md` et `docs/superpowers/specs/2026-11-26-lot34-cartes-fournee-design.md`. Le compte de démo Léa a des données d'exemple (`exempleLea` dans `jeu.js`).

En mode réel, cette progression devrait vivre dans Supabase pour suivre l'abonné d'un appareil à l'autre. Schéma **indicatif**, pas exécuté :

```sql
create table public.jeu_progression (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  actif boolean not null default true,
  points integer not null default 0 check (points >= 0),
  points_jour date,             -- dernier jour où la première carte découverte a rapporté
  levain_jours integer not null default 0 check (levain_jours >= 0),
  levain_dernier date,         -- dernier jour où au moins une carte a été découverte
  maj_le timestamptz not null default now()
);

create table public.jeu_cartes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ref text not null,           -- même ref que l'article de la fournée
  titre text not null,
  source text,
  axe text,
  rarete text not null check (rarete in ('maillard', 'doree', 'croute', 'mie')),
  fraicheur text check (fraicheur in ('hot', 'knead', 'stale')), -- au moment de la découverte
  vue_le date not null,        -- date de découverte (retournée dans la fournée)
  cuite_le date,               -- null tant que le post n'est pas publié
  gain integer not null default 0 check (gain >= 0),
  primary key (user_id, ref)
);

-- Cartes retournées un jour donné (face visible dans la fournée ce jour-là ; le lendemain, tout est recaché).
create table public.jeu_decouvertes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  jour date not null,
  ref text not null,
  primary key (user_id, jour, ref)
);

alter table public.jeu_progression enable row level security;
alter table public.jeu_cartes enable row level security;
alter table public.jeu_decouvertes enable row level security;

create policy "ma progression" on public.jeu_progression for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "mes cartes" on public.jeu_cartes for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "mes découvertes" on public.jeu_decouvertes for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
```

- Points de vigilance : une carte ne doit cuire qu'une fois (`cuite_le` rempli une seule fois) et la découverte ne rapporter qu'une fois par jour. Côté base, le plus sûr serait de calculer les points dans une fonction (RPC) plutôt que de laisser le navigateur écrire `points` directement ; à décider en équipe, ce n'est pas un enjeu de sécurité fort (jeu personnel, sans classement).
- Dates : le front compte les jours en heure locale de l'abonné (`AAAA-MM-JJ`).

## 8. Tester de bout en bout

1. Remplir `config.js` (étape 1) sur une branche de test, déployer (ou servir en local et ajouter `localhost` dans Supabase et le CORS de WF3).
2. Remplir le Tally avec une adresse à vous : vous devez arriver sur `/verifie-tes-mails`, puis recevoir l'e-mail d'invitation en français.
3. Cliquer le lien : `/creer-mot-de-passe` affiche votre adresse. Choisir un mot de passe : arrivée sur `/fournee`.
4. `/fournee` montre vos articles, **sans** la mention « Fournée d'exemple ». Si la mention apparaît : regarder l'onglet Réseau du navigateur (requête vers WF3 : CORS, 401, délai ?).
5. Se déconnecter, se reconnecter sur `/connexion`.
6. « Mot de passe oublié » : recevoir l'e-mail, choisir un nouveau mot de passe.
7. Lien expiré ou déjà utilisé : la page dit « Ce lien n'est plus valable ».

## 9. Revenir en mode démo

Remettre `mode: 'demo'` dans `config.js` (et vider les trois champs avant tout commit sur `main`), puis redéployer. Ouvrir `https://team42svp.vercel.app/?demo=reset` pour repartir d'une démo propre. Les deux modes ne partagent rien : la démo est dans `localStorage` sous `pq-auth` (et `pq-retours` pour les retours), le mode réel sous `pq-auth-reel` (les retours réels sont dans la table Supabase).

Thème de couleur (« Mon profil », section « Apparence ») : dans les deux modes, il reste dans le navigateur, sous `pq-theme`, rangé par e-mail du compte (ou `abonne_id`). Plus tard, on pourra le ranger dans `user_metadata.theme` de Supabase pour le retrouver sur tous les appareils ; rien à faire pour l'instant.

## Ce qui n'a pas pu être testé

Le front a été testé avec un `fetch` simulé et avec de fausses adresses (le site retombe proprement sur l'exemple et affiche des erreurs claires). **Le vrai Supabase et le vrai n8n n'ont pas été testés** : la première vraie mise en route se fera avec ce guide. C'est vrai aussi de la table `retours` : le SQL et les politiques suivent la documentation Supabase (Row Level Security) mais n'ont pas été exécutés sur un vrai projet.
