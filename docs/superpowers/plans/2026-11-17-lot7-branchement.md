# Lot 7 · Branchement du back : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** préparer le mode réel (Supabase Auth par `fetch`, WF3 avec jeton, Tally) derrière un interrupteur désactivé, sans rien changer au mode démo.

**Architecture:** `config.js` décide du mode ; `auth.js` et `api.js` gardent leur interface et choisissent leur implémentation au chargement ; logique pure testée sous Node avec un `fetch` simulé.

**Tech Stack:** HTML statique, ES5, moteur `dc.js` + `boot.js`, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-17-lot7-branchement-design.md`

## Global Constraints

- Aucune dépendance, aucun build, aucune vraie valeur (URL, clé, e-mail) dans le dépôt ; `config.js` commité avec `mode: 'demo'` et champs secrets vides.
- Pas de tiret long nulle part. Textes en français avec tutoiement, traduction EN pour tout texte d'interface.
- Mode démo strictement inchangé : `node --test "tests/*.test.js"` vert, scénario du jury valable.
- Commits terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- Prénom accentué dans le jeton (« Léa ») : décodage UTF-8 correct. Test dans la tâche 2.
- `supabaseUrl` saisi avec une barre finale : pas de `//auth`. Test dans la tâche 2.
- Fragment d'erreur (`#error=access_denied&error_code=otp_expired`) : aucune demande, vue « lien plus valable ». Test dans la tâche 2.
- WF3 lent : la page n'attend pas plus que `delaiReseauMs` puis montre l'exemple. Test dans la tâche 3.
- Session périmée avec renouvellement refusé : session effacée, `invalide`, jamais de boucle. Test dans la tâche 2.

---

### Task 1: `config.js` et `modeEffectif`

**Files:** Create `config.js`, `tests/config.test.js` ; Modify toutes les pages `*.html` (premier script du `<head>`), `parcours.css`.

**Interfaces:** Produces `Config.modeEffectif(config) -> 'demo'|'reel'`, `Config.fetchAvecDelai(fetchFn, url, options, ms) -> Promise<Response>`, `Config.DEFAUT`, globaux `PQ_CONFIG`, `PQ_MODE`, attribut `<html data-mode>`.

- [ ] Tests : `DEFAUT` vaut exactement l'objet de la spec ; `modeEffectif` : défaut ⇒ demo ; reel complet https ⇒ reel ; reel avec un champ vide, une URL `http://`, ou une clé non chaîne ⇒ demo ; `fetchAvecDelai` rejette après `ms` avec un `fetch` qui ne répond jamais, et passe un `signal`.
- [ ] Vérifier l'échec, implémenter, vérifier le succès.
- [ ] Ajouter `<script src="/config.js"></script>` juste après la balise viewport de chaque page ; règle CSS `[data-mode="reel"] .mention-demo,[data-mode="reel"] [data-demo-seul]{display:none}`.
- [ ] Suite complète verte, commit.

### Task 2: `auth.js` mode réel

**Files:** Modify `auth.js` ; Create `tests/auth-reel.test.js`.

**Interfaces:** Consumes `Config.fetchAvecDelai`. Produces `Auth.reel` = `{ CLE: 'pq-auth-reel', base(config), requete(config, chemin, methode, corps, jeton) -> { url, options }, lireFragment(hash, maintenantS) -> null | { erreur } | { type, jetons: { access_token, refresh_token, expires_at } }, sessionDepuisReponse(json, maintenantS), decoderJwt(jeton) -> objet|null, utilisateurDepuisSession(session) -> compte|null, expire(jetons, maintenantS, margeS) -> bool, charger(storage, maintenantS), avecSupabase(config, deps) }` ; `deps = { fetch, storage, maintenant: () => secondes }` ; l'adaptateur renvoie les six méthodes + `jetonValide()`, `ouvrirFour()`, `charger()`, `accueillirFragment(hash) -> 'inscription'|'reinitialisation'|'session'|null`. `Auth.jetonValide` public (démo : `Promise.resolve(null)`). `demandeEnCours` ne renvoie que `{ email, motif }`.

- [ ] Tests purs : requêtes exactes (URL, méthode, en-têtes `apikey`, `Authorization`, corps) pour connexion, renouvellement, mot de passe, oubli (`redirect_to` encodé vers `siteUrl + '/creer-mot-de-passe'`), déconnexion ; barre finale de `supabaseUrl` retirée ; `lireFragment` invite, recovery, `expires_at` prioritaire, fragment incomplet ⇒ null, fragment d'erreur ⇒ `{ erreur }` ; `decoderJwt` avec « Léa » ; `utilisateurDepuisSession` depuis `user_metadata`.
- [ ] Tests adaptateur (fetch simulé, stockage mémoire) : connexion ok puis `utilisateurCourant()` ; 400 ⇒ `identifiants` ; rejet réseau ⇒ `reseau` ; invitation puis `definirMotDePasse` ⇒ session ; 401 ⇒ `aucune-demande` ; 422 ⇒ `mot-de-passe-faible` ; demande expirée ignorée ; `jetonValide` frais, renouvelé, refus 400 ⇒ null et session effacée ; `seDeconnecter` efface tout de suite ; `motDePasseOublie` ok et `reseau`.
- [ ] Vérifier l'échec, implémenter, vérifier le succès (anciens tests compris).
- [ ] Branchement navigateur : si `PQ_MODE === 'reel'`, méthodes publiques de `avecSupabase`, lecture du fragment au chargement, effacement du fragment, redirection vers `/creer-mot-de-passe` si besoin.
- [ ] Commit.

### Task 3: `api.js` mode réel et mention « exemple »

**Files:** Modify `api.js`, `tests/api.test.js`, `fournee.html`, `comptoir.html`.

**Interfaces:** Consumes `Auth.jetonValide`, `Config.fetchAvecDelai`. Produces `Api.chargerFourneeReelle({ fetch, jeton, url, delaiMs, lireExemple }) -> Promise<reponseWF3 & { source? }>`.

- [ ] Tests : succès ⇒ réponse WF3 telle quelle, requête `POST` avec `Bearer` et corps `{}` ; `attente` renvoyée telle quelle ; statut 500, réponse invalide, délai, rejet du jeton ⇒ exemple avec `source: 'exemple'` ; jeton `null` ⇒ `{ etat: 'invalide' }`.
- [ ] Vérifier l'échec, implémenter, vérifier le succès.
- [ ] `chargerFournee` utilise ce chemin si `PQ_MODE === 'reel'`. Mention FR « Fournée d'exemple : n8n ne répond pas », EN « Sample batch: n8n is not responding », visible seulement si `data.source === 'exemple'`.
- [ ] Commit.

### Task 4: pages en mode réel

**Files:** Modify `connexion.html`, `creer-mot-de-passe.html`, `mot-de-passe-oublie.html`, `nav.js` (aucun changement si la déconnexion synchrone suffit), `questionnaire.html`, `decouvrir.html`, `verifie-tes-mails.html`.

- [ ] Appels `Promise.resolve(Auth.x(...)).then(...)` ; message `reseau` FR « Le serveur ne répond pas. Réessaie dans un instant. » / EN « The server is not responding. Try again in a moment. » ; bouton démo marqué `data-demo-seul`.
- [ ] `/questionnaire` : `location.replace(PQ_CONFIG.tallyUrl)` en mode réel ; CTA de `/decouvrir` vers `tallyUrl`.
- [ ] `/verifie-tes-mails` : en mode réel, pas de redirection, texte générique FR « On vient de t'envoyer un e-mail. Clique sur le lien qu'il contient pour choisir ton mot de passe. », boutons de démo cachés.
- [ ] Suite complète verte, commit.

### Task 5: guide et vérifications

**Files:** Create `docs/branchement-back.md`.

- [ ] Guide selon la section 5 de la spec.
- [ ] Navigateur, mode démo : scénario du jury rejoué rapidement.
- [ ] Navigateur, mode réel bidon (modifié localement, remis à `demo` avant commit) : connexion ⇒ erreur propre ; session injectée ⇒ `/fournee` et `/comptoir` montrent l'exemple avec la mention.
- [ ] Commit, journal `.superpowers/sdd/2026-11-17-lot7-branchement/progress.md`.
