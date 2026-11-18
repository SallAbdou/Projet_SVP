# Lot 12 · Retours de personnalisation : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** zone « Affine ta fournée » sur le profil, adaptateur `retours.js` (démo et Supabase REST), guide back, confidentialité, « Pour toi » agrandi.

**Architecture :** `retours.js` suit `auth.js` / `api.js` : fonctions pures sous `Retours.pur`, deux enveloppes (`avecStockage` pour la démo, `avecSupabase` pour le réel) qui exposent la même interface à promesses ; la page choisit selon `PQ_MODE`. La page profil garde la saisie dans son état DCLogic.

**Tech Stack :** HTML statique, ES5, moteur maison `dc.js` + `boot.js`, `node --test`.

**Spec :** `docs/superpowers/specs/2026-11-18-lot12-retours-profil-design.md`

## Global Constraints

- Aucun build, aucune dépendance ; ES5 dans les `.js` racine (pas de `const`, de flèches, ni de gabarits).
- Jamais de tiret long dans le code, les textes et les commits.
- `config.js` commité en `mode: 'demo'` avec valeurs vides (`tests/config.test.js`).
- Jamais de clé `service_role` dans le front.
- Limite de texte : 1 000 caractères après nettoyage ; clé démo `pq-retours`.
- Commits terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Texte fait uniquement d'espaces et de retours à la ligne : erreur « vide », rien d'enregistré (test `valider` dans la tâche 1).
2. Texte collé de 1 001 caractères, ou de 1 000 entouré d'espaces : refusé pour le premier, accepté pour le second (tâche 1).
3. Données démo abîmées dans `pq-retours` (JSON invalide, mauvais types) : la page s'affiche avec une liste vide, l'envoi repart d'un état propre (test `normaliser`, tâche 1).
4. Deux comptes sur le même navigateur : chacun ne voit que ses retours (test `avecStockage`, tâche 2).
5. Réseau coupé ou 500 en réel : `'reseau'`, et le texte reste dans le champ (tâche 2 côté adaptateur, tâche 3 côté page, vérification navigateur tâche 6).

---

### Task 1 : logique pure de `retours.js`

**Files :** Create `retours.js`, `tests/retours.test.js`

**Interfaces :** Produces `Retours.pur = { MAX, CLE, nettoyer, valider, enregistrement, derniers, dateRelative, cleCompte, normaliser, ajouter, lister, requeteEnvoi, requeteLecture }`.

- [ ] **Step 1 : tests en échec** dans `tests/retours.test.js` :
  - `nettoyer('  a\r\nb  ') === 'a\nb'` ; `nettoyer(null) === ''`.
  - `valider('   \n ') === 'vide'`, `valider('x'.repeat(1001)) === 'trop-long'`, `valider(' ' + 'x'.repeat(1000) + ' ') === null`.
  - `enregistrement(' Plus de PME ', '2026-11-18T10:00:00.000Z', 'demoLea0000000001')` vaut `{ texte: 'Plus de PME', cree_le: '2026-11-18T10:00:00.000Z', abonne_id: 'demoLea0000000001' }`.
  - `derniers` : 4 entrées dans le désordre plus une invalide ⇒ les 3 plus récentes, décroissant.
  - `dateRelative` avec `maintenant = new Date(2026, 10, 18, 9)` : même jour ⇒ `'aujourd’hui'` / `'today'`, la veille à 23 h ⇒ `'hier'` / `'yesterday'`, 5 jours avant ⇒ `'il y a 5 jours'` / `'5 days ago'`, futur ⇒ `'aujourd’hui'`.
  - `cleCompte({ email: 'Lea@X.fr', abonneId: 'a' }) === 'lea@x.fr'`, `cleCompte({ email: '', abonneId: 'a' }) === 'a'`, `cleCompte(null) === null`.
  - `normaliser('nimporte')` et `normaliser({ version: 1, comptes: { a: [{ texte: 1 }] } })` ⇒ `{ version: 1, comptes: { a: [] } }` ou vide ; `ajouter` garde au plus 50 entrées par compte, `lister(etat, 'b')` ⇒ `[]`.
  - `requeteEnvoi({ supabaseUrl: 'https://p.supabase.co/', supabaseCleAnon: 'pub' }, 'jwt', rec)` : url `https://p.supabase.co/rest/v1/retours`, méthode POST, en-têtes exacts `{ apikey: 'pub', Authorization: 'Bearer jwt', 'Content-Type': 'application/json', Prefer: 'return=minimal' }`, corps JSON `{ texte, abonne_id }` sans `cree_le` ni `user_id`.
  - `requeteLecture(config, 'jwt', 3)` : url `…/rest/v1/retours?select=texte,cree_le&order=cree_le.desc&limit=3`, GET, en-têtes `apikey` et `Authorization` seulement.
  - `Store.CLES_DEMO` contient `'pq-retours'` (dans `tests/store.test.js`).
- [ ] **Step 2 :** `node --test tests/retours.test.js tests/store.test.js` ⇒ échec (module absent).
- [ ] **Step 3 :** écrire `retours.js` (module UMD comme `api.js`), ajouter `'pq-retours'` à `CLES_DEMO` de `store.js`.
- [ ] **Step 4 :** relancer ⇒ vert.
- [ ] **Step 5 :** commit `feat(retours): logique pure des retours de personnalisation`.

### Task 2 : enveloppes démo et réelle

**Files :** Modify `retours.js`, `tests/retours.test.js`

**Interfaces :**
- Consumes : Task 1 ; `Config.fetchAvecDelai(fetch, url, options, ms)`.
- Produces : `Retours.avecStockage({ storage, utilisateur: () => u|null, maintenant: () => iso })` et `Retours.avecSupabase(config, { fetch, jeton: () => Promise<string|null>, utilisateur })`, chacun `{ envoyerRetour(texte), derniersRetours(n) }`. `Retours.envoyerRetour` / `Retours.derniersRetours` pointent sur l'enveloppe active (`PQ_MODE === 'reel'` ⇒ Supabase avec `Auth.jetonValide`).

- [ ] **Step 1 : tests en échec** :
  - démo : envoi valide ⇒ `{ ok: true, erreur: null }` et `derniersRetours(3)` le renvoie ; envoi vide ⇒ `{ ok: false, erreur: 'vide' }` et rien d'enregistré ; utilisateur null ⇒ `'session'` ; deux utilisateurs ⇒ listes séparées.
  - réel avec `fetch` simulé : 201 ⇒ ok et la requête reçue a les en-têtes et le corps de Task 1 ; 401 ⇒ `'session'` ; 500 ⇒ `'reseau'` ; `fetch` rejeté ⇒ `'reseau'` ; jeton `null` ⇒ `'session'` sans appel ; texte vide ⇒ `'vide'` sans appel ; `fetch` qui ne répond jamais avec `delaiReseauMs: 20` ⇒ `'reseau'`.
  - réel lecture : 200 `[{ texte, cree_le }]` ⇒ liste ; 500 ⇒ promesse rejetée.
- [ ] **Step 2 :** lancer ⇒ échec.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** `node --test "tests/*.test.js"` ⇒ tout vert.
- [ ] **Step 5 :** commit `feat(retours): adaptateur démo et Supabase REST`.

### Task 3 : zone « Affine ta fournée » sur le profil

**Files :** Modify `profil.html` ; Test : `tests/profil.test.js`

**Interfaces :** Consumes `Retours.envoyerRetour`, `Retours.derniersRetours`, `Retours.pur.dateRelative`, `Retours.pur.MAX`.

- [ ] **Step 1 : test en échec** (lecture du HTML, comme `charte.test.js`) : `profil.html` charge `/retours.js` après `/auth.js` ; contient `<label for="retour-texte"`, `<textarea id="retour-texte"`, `aria-describedby="{{retourDecrit}}"`, `role="status"`, les textes FR « Affine ta fournée », « Envoyer mon retour », « Tes derniers retours » et EN « Fine-tune your batch ».
- [ ] **Step 2 :** lancer ⇒ échec.
- [ ] **Step 3 :** gabarit et logique selon le design § 1 (textes exacts du tableau). État : `retour`, `retourErreur`, `retourSucces`, `envoi`, `derniers`, `derniersErreur`. Chargement de la liste au constructeur ; rechargée après un envoi réussi. Erreur ⇒ `this.focusRetour = true`, consommé dans `afterRender`.
- [ ] **Step 4 :** suite complète verte.
- [ ] **Step 5 :** commit `feat(profil): zone Affine ta fournée`.

### Task 4 : « Pour toi » plus grand

**Files :** Modify `charte.css`, `fournee.html:165`, `fournil.html:424`, `tests/charte.test.js:103-112`

- [ ] **Step 1 : test en échec** : `.pour-toi{` contient `font-size:17px` ; `.ampoule{` contient `width:26px` et `height:26px` ; plus de `font-size:13.5px` sur la ligne `pour-toi` de `fournee.html` ; `fournil.html` ne pose plus `font-size: 14px` dans `pourToiStyle`.
- [ ] **Step 2 :** lancer ⇒ échec.
- [ ] **Step 3 :** modifier selon le design § 5.
- [ ] **Step 4 :** suite verte.
- [ ] **Step 5 :** commit `feat(charte): Pour toi et ampoule agrandis`.

### Task 5 : guide back et confidentialité

**Files :** Modify `docs/branchement-back.md`, `confidentialite.html`

- [ ] **Step 1 :** section « Retours de personnalisation » (SQL du design § 3, test rapide, piste WF4, rappel service_role) ; textes du design § 4 dans `confidentialite.html` (FR et EN).
- [ ] **Step 2 :** suite verte, commit `docs(retours): guide Supabase et confidentialité`.

### Task 6 : vérifications navigateur

- [ ] Démo après `?demo=reset`, connectée avec le compte de démo : envoi vide (erreur, focus sur le champ), envoi valide (message, liste « aujourd'hui »), rechargement (toujours là), `?demo=reset` (effacé).
- [ ] Réel avec de fausses valeurs dans `config.js` (non commitées) : erreur réseau claire, texte conservé ; `config.js` remis et `git diff config.js` vide.
- [ ] « Pour toi » : mesures de débordement des blocs S, M, L à 1440 et 375 px ; fournil.
- [ ] FR/EN, clavier, console sans erreur. Journal dans `.superpowers/sdd/2026-11-18-lot12-retours-profil/progress.md`, commit.
