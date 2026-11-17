# Lot 4 · Fournil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le fournil réel : sujet choisi, brouillon éditable et sauvegardé, variantes de ton et de langue, checklist et aperçu en direct, copie, publication simulée et report des chiffres.

**Architecture:** Logique pure dans `fournil.js` (ES5, `window.Fournil` ou `module.exports`), testée sous Node. Textes écrits à la main dans `data/brouillons.json`. `fournil.html` réécrite sur le moteur `dc.js`/`boot.js`, état partagé via `store.js`, utilisatrice via `auth.js`, messages via `BentoUI.toast`.

**Tech Stack:** HTML statique, ES5, `node --test`, aucune dépendance.

**Spec:** `docs/superpowers/specs/2026-11-17-lot4-fournil-design.md`

## Global Constraints

- Aucun build, aucune dépendance ; ES5 dans les fichiers servis (pas de `=>`, `let`, gabarits) sauf la classe `Component` déjà en usage.
- Jamais de tiret long dans le code, les textes et les commits.
- FR et EN pour chaque texte d'interface ; cibles tactiles de 44 px ; page sans défilement horizontal à 375 px.
- Les `ref` peuvent contenir des guillemets : pas de sélecteur construit à partir d'une `ref`.
- Limite LinkedIn : 3 000 caractères ; aperçu : 210 caractères ; accroche : 120 caractères.
- Chiffres : `impressions, reactions, republications, commentaires, contacts`, entiers positifs ou nuls.

## Review Focus

- Frappe rapide dans le brouillon (re-rendu complet à chaque saisie) : curseur, défilement interne et hauteur de la zone de texte conservés ; touches mortes (« ê ») correctes. Vérifié dans le navigateur (tâche 6).
- Saisie de chiffres pendant qu'on tape ailleurs : les champs sont liés à l'état, un re-rendu ne vide rien. Test `validerChiffres` (tâche 3) et navigateur (tâche 6).
- Texte vide ou fait seulement d'espaces : checklist toute fausse, longueur 0, Copier et Publier désactivés. Test `checklist('')` (tâche 1).
- `ref` présente à la fois dans la fournée et le garde-manger : la fournée gagne et l'écran de choix ne la liste qu'une fois. Tests tâche 1.
- Saisies « 12.5 », « -3 », « 1e3 », «  » : refusées avec message ; « 007 » accepté (7). Tests tâche 3.

---

### Task 1: Logique de sujet, checklist et aperçu

**Files:**
- Create: `fournil.js`
- Test: `tests/fournil.test.js`

**Interfaces:**
- Produces: `Fournil.trouverSujet(ref, articles, sauves) -> { article, origine: 'fournee'|'garde-manger' } | null` ; `Fournil.listeChoix(articles, sauves) -> { jour: Article[], cotes: Sauve[] }` (jour par `rang` croissant, cotes par `savedAt` décroissant sans les `ref` du jour) ; `Fournil.checklist(texte, langue) -> { accroche, chiffre, pointDeVue, question: boolean, longueur: number, max: 3000, enTrop: number }` ; `Fournil.apercu(texte, limite?) -> { texte: string, coupe: boolean }` (limite 210 par défaut) ; `Fournil.texteModifie(texte, propose) -> boolean`.

- [ ] **Step 1: Write the failing tests**
  - `trouverSujet('recA', [artA], [sauveA])` renvoie l'article de la fournée, origine `fournee` ; `ref` seulement dans `sauves` : origine `garde-manger` ; `ref` absente, vide ou non chaîne : `null`.
  - `listeChoix` : rangs 3,1,2 rendus 1,2,3 ; un sauvé dont la `ref` est dans la fournée n'apparaît pas dans `cotes` ; `cotes` triés du plus récent au plus ancien ; entrées non tableaux : listes vides.
  - `checklist` : `''` et `'   '` : tout faux, longueur 0 ; accroche de 120 caractères vraie, 121 fausse ; premier paragraphe = avant la première ligne vide ; `'3 outils'` chiffre vrai ; FR `je`, `j’ai`, `J'ai`, `mon`, `mes` vrais, `jeudi`, `monde`, `mesure` faux ; EN `I think`, `my` vrais, `i think`, `myth` faux ; `'Et toi ?  \n'` question vraie, `'? fin'` faux ; 3 001 caractères : `enTrop` 1.
  - `apercu` : texte court inchangé `coupe` faux ; 300 caractères avec espaces : coupé à la dernière espace avant 210, sans espace finale, `coupe` vrai ; mot unique de 300 lettres : coupé à 210.
  - `texteModifie('a ', ' a')` faux ; `texteModifie('a', 'b')` vrai.

- [ ] **Step 2: Run** `node --test tests/fournil.test.js` : FAIL (module absent).
- [ ] **Step 3: Implement** in `fournil.js` (UMD comme `garde-manger.js`). Point de vue FR : `/(^|[^a-zà-ÿ])(je|mon|mes)(?![a-zà-ÿ])/i` ou `j['’]` en début de mot ; EN : `\bI\b` sensible à la casse, `\bmy\b` insensible. Apercu : si la dernière espace avant la limite est à moins de 150, couper net.
- [ ] **Step 4: Run** `node --test "tests/*.test.js"` : PASS.
- [ ] **Step 5: Commit** `feat(fournil): sujet, écran de choix, checklist et aperçu (logique pure)`

### Task 2: Variantes de brouillon

**Files:**
- Modify: `fournil.js`, `tests/fournil.test.js`
- Create: `data/brouillons.json`

**Interfaces:**
- Consumes: `checklist` (tâche 1).
- Produces: `Fournil.TONS = ['expert', 'retour', 'provoc']`, `Fournil.LANGUES = ['fr', 'en']` ; `Fournil.brouillonGenerique(article, ton, langue, n) -> string` ; `Fournil.nbVariantes(ref, ecrits) -> number` ; `Fournil.proposerVariante(article, ton, langue, n, ecrits) -> string` où `ecrits` = contenu de `data/brouillons.json` : `{ "<ref>": { "<ton>": { "fr": string, "en": string } } }`. Pour une `ref` écrite à la main, `n % nbVariantes` = 0 donne le texte écrit, sinon la variante générée `n - 1` ; sinon variante générée `n % 3`.

- [ ] **Step 1: Write the failing tests**
  - Pour chaque ton et langue, `brouillonGenerique(art, ton, langue, 0)` contient le titre, le résumé, la phrase « Pour toi » sans son préfixe (« Pour toi : »), trois lignes commençant par `→ `, se termine par `?` ; les variantes 0, 1 et 2 diffèrent, 3 égale 0 ; tons différents donnent des textes différents ; article sans `resume` ni `pourToi` : pas de `undefined` dans le texte ; aucun chiffre ajouté si l'article n'en a pas (`checklist(...).chiffre` faux).
  - Point de vue présent (`checklist(texte, langue).pointDeVue` vrai) pour toute variante générée.
  - `data/brouillons.json` (lu avec `require`) : `recDemo01` et `recDemo02`, 3 tons × 2 langues, chaque texte passe les 4 critères de la checklist et fait au plus 3 000 caractères.
  - `proposerVariante(recDemo01, 'provoc', 'en', 0, ecrits)` égale le texte écrit ; `n = 1` égale `brouillonGenerique(..., 0)` ; `nbVariantes('recDemo01', ecrits)` vaut 4, `nbVariantes('autre', ecrits)` vaut 3 ; ton ou langue inconnus : `expert` et `fr`.
- [ ] **Step 2: Run** : FAIL.
- [ ] **Step 3: Implement** gabarits par ton et langue (3 accroches et 3 questions par ton) et écrire les 12 textes de `data/brouillons.json` (FR repris et enrichi du brouillon codé en dur actuel pour `recDemo01`).
- [ ] **Step 4: Run** `node --test "tests/*.test.js"` : PASS.
- [ ] **Step 5: Commit** `feat(fournil): variantes de brouillon écrites et générées`

### Task 3: Validation des chiffres

**Files:** Modify `fournil.js`, `tests/fournil.test.js`

**Interfaces:**
- Produces: `Fournil.CHAMPS = ['impressions', 'reactions', 'republications', 'commentaires', 'contacts']` ; `Fournil.validerChiffres(saisie) -> { chiffres: object|null, erreurs: { [champ]: 'requis'|'entier' } }`. Accepte chaînes ou nombres ; chaîne nettoyée des espaces (y compris insécables) ; `/^\d+$/` et `Number.isSafeInteger`.

- [ ] **Step 1: Write the failing tests** : saisie complète `'1 240'`, `'52'`, `7`, `'0'`, `'007'` : `chiffres` = `{1240, 52, 7, 0, 7}` sans erreurs ; `''` : `requis` ; `'12.5'`, `'-3'`, `'1e3'`, `'abc'`, `'99999999999999999'` : `entier` ; une erreur : `chiffres` null et les autres champs sans erreur ; saisie `null` : 5 erreurs `requis` ; le résultat est accepté par `Store.saisirChiffres`.
- [ ] **Step 2: Run** : FAIL. **Step 3: Implement.** **Step 4: Run** tous les tests : PASS.
- [ ] **Step 5: Commit** `feat(fournil): validation des chiffres reportés`

### Task 4: Page du fournil, sujet et brouillon

**Files:** Modify `fournil.html` (réécriture)

**Interfaces:**
- Consumes: `Api.chargerFournee()`, `Store.charger/enregistrer/enregistrerBrouillon`, `Auth.utilisateurCourant()`, `Bento.lienFournil(ref)`, `Fournil.*` (tâches 1 à 3), `fetch('/data/brouillons.json')` (échec : `{}`).

- [ ] **Step 1:** Scripts : `store.js, demo.js, auth.js, garde.js` dans le head ; `dc.js, api.js, bento.js, bento-ui.js, fournil.js` avant le script de page ; `#pq-toast` hors de `#root`.
- [ ] **Step 2:** États `chargement`, `choix` (avec phrase « sujet introuvable » si `ref` donnée), `sujet`. Lecture de `ref` par `URLSearchParams`.
- [ ] **Step 3:** En-tête du sujet, sélecteurs (options via `sc-for` avec attribut `selected`, `onChange`), `textarea id="brouillon"` (`onInput`, `onCompositionend`), Repétrir, bandeau de confirmation (focus sur « Remplacer », Garder rend le focus au contrôle d'origine), checklist, compteur avec alerte, aperçu avec « voir plus / voir moins » (`aria-expanded`).
- [ ] **Step 4:** Défilement interne et hauteur de la `textarea` mémorisés dans le gestionnaire de saisie et rétablis dans `afterRender`.
- [ ] **Step 5: Run** `node --test "tests/*.test.js"` : PASS ; contrôle rapide dans le navigateur (sujet, choix, frappe).
- [ ] **Step 6: Commit** `feat(fournil): sujet choisi, brouillon sauvegardé, ton, langue, checklist et aperçu`

### Task 5: Copier, publier et chiffres

**Files:** Modify `fournil.html`

- [ ] **Step 1:** Copier (`navigator.clipboard` puis repli `execCommand`), messages via `BentoUI.toast`.
- [ ] **Step 2:** Modale de publication (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus piégé et Échap comme `verifie-tes-mails.html`, focus initial sur « Confirmer », retour sur « Publier »).
- [ ] **Step 3:** Section des posts publiés : état vide, liste triée, formulaire par post (identifiants de champ à partir de l'indice dans `publies`), erreurs par champ, focus sur le premier champ en erreur, succès.
- [ ] **Step 4: Run** tous les tests : PASS ; contrôle navigateur.
- [ ] **Step 5: Commit** `feat(fournil): copie, publication simulée et report des chiffres`

### Task 6: Vérification navigateur et journal

- [ ] Connecté avec `lea@demo.painquotidien.fr` : Pétrir depuis la fournée et le garde-manger, écran de choix sans sujet et avec `ref` inconnue, frappe (curseur stable, accents), checklist, changement de ton avec confirmation, Repétrir, copier, publier, reporter des chiffres, rechargement (brouillon, posts et chiffres conservés), FR/EN, 1440 et 375 px, clavier, console sans erreur.
- [ ] Journal `.superpowers/sdd/2026-11-17-lot4-fournil/progress.md`.
