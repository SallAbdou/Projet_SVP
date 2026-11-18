# Lot 12 · Retours de personnalisation et « Pour toi » agrandi : design

Date : 2026-11-18 · Statut : validé par Delio (demandes transmises par la session parente, sans nouvelle validation) · Suit le lot 11 (PR n°14 fusionnée, branche partie de `origin/main`)

## Intention

L'abonnée doit pouvoir dire à l'IA ce qu'elle veut voir plus ou moins souvent, depuis sa page profil. Le front enregistre ces retours (dans le navigateur en démo, dans une table Supabase en réel) ; l'équipe n8n les ajoutera au prompt « Choisir pour l'abonné » de WF4. En parallèle, la ligne « Pour toi » des articles grandit encore.

## 1. Zone « Affine ta fournée » (profil.html)

Nouvelle carte `.pf-carte` sous Informations et Préférences, avant « Se déconnecter ».

| Élément | FR | EN |
|---|---|---|
| Titre (h2) | Affine ta fournée | Fine-tune your batch |
| Phrase | Dis-nous ce que tu veux voir plus ou moins souvent : l'IA en tiendra compte pour choisir tes prochains sujets. | Tell us what you want to see more or less often: the AI will use it to pick your next topics. |
| Libellé du champ | Ton retour | Your feedback |
| Aide | Ex. : plus de sujets sur l'IA en PME, moins sur le hardware | E.g. more topics on AI in small businesses, less on hardware |
| Compteur | `N / 1 000` | `N / 1,000` |
| Bouton | Envoyer mon retour | Send my feedback |
| Envoi en cours | Envoi… | Sending… |
| Succès | Merci, ton retour est enregistré. Il comptera pour tes prochaines fournées. | Thanks, your feedback is saved. It will count for your next batches. |
| Erreur vide | Écris quelques mots avant d'envoyer. | Write a few words before sending. |
| Erreur trop long | Ton retour dépasse 1 000 caractères : raccourcis-le un peu. | Your feedback is over 1,000 characters: please shorten it. |
| Erreur réseau | Envoi impossible pour l'instant (connexion ou serveur). Ton texte est gardé : réessaie dans un moment. | Could not send right now (connection or server). Your text is kept: try again in a moment. |
| Erreur session | Ta session a expiré : reconnecte-toi, ton texte sera à réécrire. | Your session has expired: log in again, you will need to rewrite your text. |
| Sous-titre liste (h3) | Tes derniers retours | Your latest feedback |
| Liste vide | Aucun retour pour l'instant. | No feedback yet. |
| Liste en échec | Impossible d'afficher tes retours pour l'instant. | Your feedback can't be shown right now. |

Accessibilité et comportement :
- `<form onSubmit>` (le moteur fait déjà `preventDefault`), `<label for="retour-texte">` visible, `<textarea id="retour-texte" rows="4">`.
- `aria-describedby="retour-aide retour-compteur"`, plus `retour-erreur` quand une erreur est affichée ; `aria-invalid="true"` dans ce cas.
- Pas d'attribut `maxlength` : on laisse dépasser pour pouvoir expliquer l'erreur. Le compteur compte la saisie brute et passe en brun-rouge au-delà de 1 000.
- Saisie dans l'état de la page (`onInput`), restituée par `boot.js` (focus et curseur conservés, valeur échappée). Taper efface l'erreur affichée.
- Zone `role="status"` (`aria-live="polite"`) toujours présente pour le message de succès.
- Focus : en cas d'erreur, il va sur le champ (`afterRender`, une seule fois) ; en cas de succès, il reste sur le bouton (pas de saut) et le message est lu par la zone live. Bouton désactivé (`aria-disabled` + garde dans le gestionnaire) pendant l'envoi pour éviter les doublons.
- Échec : le texte reste dans le champ, rien n'est perdu.
- Liste : les 3 plus récents, `<ul>`, texte puis date relative (« aujourd'hui », « hier », « il y a N jours » ; EN « today », « yesterday », « N days ago »), calculée en jours civils locaux. Retours longs coupés visuellement à 3 lignes (`-webkit-line-clamp`), texte complet dans le DOM.

## 2. Adaptateur `retours.js`

Même principe que `auth.js` et `api.js` (lot 7) : logique pure testée sous Node, interface identique en démo et en réel.

```
Retours.envoyerRetour(texte) : Promise<{ ok: boolean, erreur: null | 'vide' | 'trop-long' | 'session' | 'reseau' }>
Retours.derniersRetours(n)  : Promise<Array<{ texte, cree_le }>>   (rejetée en cas de panne : la page affiche « Liste en échec »)
```

Logique pure (`Retours.pur`) :
- `MAX = 1000`
- `nettoyer(texte)` : chaîne, fins de ligne `\r\n` ramenées à `\n`, espaces de début et de fin retirés.
- `valider(texte)` : `null`, `'vide'` ou `'trop-long'`, sur le texte nettoyé (longueur en caractères JavaScript, comme `char_length` côté Postgres pour le français courant).
- `enregistrement(texte, maintenantIso, abonneId)` : `{ texte: nettoyé, cree_le, abonne_id }`.
- `derniers(liste, n)` : écarte les entrées invalides, trie par `cree_le` décroissant, garde `n`.
- `dateRelative(iso, maintenant: Date, lang)` : texte FR ou EN décrit plus haut ; date future ou illisible : « aujourd'hui ».
- `cleCompte(u)` : e-mail en minuscules, sinon `abonneId`, sinon `null`.
- Démo : `ajouter(etat, cle, rec)`, `lister(etat, cle)`, `normaliser(raw)` sur l'état `{ version: 1, comptes: { [cle]: Retour[] } }` ; au plus 50 retours gardés par compte.
- Réel : `requeteEnvoi(config, jeton, rec)` et `requeteLecture(config, jeton, n)` renvoient `{ url, options }`.

### Mode démo

Clé `localStorage` `pq-retours`, ajoutée à `Store.CLES_DEMO` (donc effacée par `?demo=reset` et par « Effacer mes données »). Retours rangés par compte : `cleCompte(Auth.utilisateurCourant())`. Sans utilisateur : `{ ok: false, erreur: 'session' }`.

### Mode réel (Supabase REST, sans librairie)

Envoi :
```
POST {supabaseUrl}/rest/v1/retours
apikey: <supabaseCleAnon>
Authorization: Bearer <access_token de la session (Auth.jetonValide)>
Content-Type: application/json
Prefer: return=minimal

{ "texte": "…", "abonne_id": "…" }
```
`user_id` n'est pas envoyé : la colonne a `default auth.uid()` et la politique RLS vérifie `auth.uid() = user_id`.

Lecture :
```
GET {supabaseUrl}/rest/v1/retours?select=texte,cree_le&order=cree_le.desc&limit=3
(mêmes en-têtes sans Content-Type ni Prefer)
```
RLS ne renvoie que les lignes de l'utilisateur ; pas de filtre `user_id` côté front.

Réponses : 2xx ⇒ succès (201 sans corps attendu pour l'insertion). 401 ou 403 ⇒ `'session'`. Autre statut, panne, délai `delaiReseauMs` dépassé (`Config.fetchAvecDelai`) ⇒ `'reseau'`. `Auth.jetonValide()` à `null` ⇒ `'session'` sans appel réseau ; rejet ⇒ `'reseau'`.

Sources consultées (2026-11-18) :
- Supabase, *Row Level Security* (`supabase.com/docs/guides/database/postgres/row-level-security`) : `alter table … enable row level security;`, politiques `for insert to authenticated with check ((select auth.uid()) = user_id)` et `for select to authenticated using ((select auth.uid()) = user_id)` ; « once RLS is enabled, no data is accessible through the API when using a publishable key, until you create policies » ; la clé secrète passe par le rôle `service_role` qui a `bypassrls` et ne doit jamais aller dans le navigateur.
- Supabase, *Creating API routes* (`supabase.com/docs/guides/api/creating-routes`) : API REST sous `https://<project_ref>.supabase.co/rest/v1/<table>`, clé dans l'en-tête `apikey`, plus `Authorization: Bearer`.
- PostgREST, *Tables and Views* et *Preferences* (dépôt `PostgREST/postgrest`, `docs/references/api/`) : `select=col1,col2`, `order=col.desc`, insertion répondue `201 Created`, `Prefer: return=minimal` sans corps de réponse. `limit=N` : page *Pagination* de la même doc (non relue ici, syntaxe standard de PostgREST).

## 3. Guide `docs/branchement-back.md`

Nouvelle section « Retours de personnalisation » : SQL de la table, RLS et deux politiques, test rapide, piste WF4 (lecture des retours des 30 derniers jours par `abonne_id` avec la clé `service_role` côté n8n, ajout au prompt « Choisir pour l'abonné »), rappel « jamais la clé service_role dans le front ».

```sql
create table public.retours (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  abonne_id text,
  texte text not null check (char_length(texte) between 1 and 1000),
  cree_le timestamptz not null default now()
);
alter table public.retours enable row level security;
create policy "insérer ses propres retours" on public.retours for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "lire ses propres retours" on public.retours for select to authenticated using ((select auth.uid()) = user_id);
create index retours_user_cree_le on public.retours (user_id, cree_le desc);
```

Limite connue : `abonne_id` est fourni par le front (lu dans la session) ; WF4 doit plutôt rapprocher par `user_id` ou par `app_metadata.abonne_id`, qui fait foi (même logique que le lot 7).

## 4. Confidentialité

Liste des données : ajout « Les retours que tu écris pour affiner ta fournée. » / « The feedback you write to fine-tune your batch. ». Finalité : « … choisir tes articles chaque matin (en tenant compte de tes retours) … ».

## 5. « Pour toi » encore plus grand

Partout où la ligne s'affiche : fournée (blocs L sur grand écran, tous les blocs sous 641 px) et fournil (sujet choisi). Le comptoir n'affiche pas de « Pour toi » (vérifié : aucune occurrence de `pourToi` / `forYou` dans `comptoir.html`), rien à changer.
- `charte.css` : `.pour-toi` porte la taille, `font-size:17px; line-height:1.4` ; `.ampoule` 26 px, `margin-top:-1px` pour la centrer sur la première ligne (hauteur de ligne 23,8 px).
- Les tailles en ligne (13,5 px dans `fournee.html`, 14 px dans `fournil.html`) sont retirées pour que la charte décide.
- Contraste inchangé (brun foncé #5E3412, déjà testé à 4,5:1 minimum).
- Contrôle : aucun bloc de la fournée ne déborde ni ne défile (mesure `scrollHeight <= clientHeight` sur chaque bloc, S, M, L, 1440 et 375 px).

## Hors champ

- Modifier ou supprimer un retour envoyé.
- Le vrai Supabase et WF4 (non testables ici : ni accès ni clés).
