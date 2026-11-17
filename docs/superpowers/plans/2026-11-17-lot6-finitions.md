# Lot 6 · Finitions de démo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le site sûr pour la démo du jury : correctifs relevés aux lots 1 à 5, nav mobile, passe visuelle et accessibilité, QR code, scénario joué.

**Architecture:** Logique pure ajoutée aux modules existants (`boot.js` exporté sous Node, `auth.js`, `questionnaire.js`, `nav.js`), testée avec `node --test`. Interface modifiée page par page, vérifiée au navigateur (serveur `tools/serve.mjs`, port 4174).

**Tech Stack:** HTML statique, ES5, `node --test`, aucune dépendance.

**Spec:** `docs/superpowers/specs/2026-11-17-lot6-finitions-design.md`

## Global Constraints

- Aucun build, aucune dépendance ajoutée au site ; ES5 dans les fichiers servis sauf la classe `Component`.
- Jamais de tiret long dans le code, les textes et les commits.
- FR et EN pour chaque texte d'interface ; cibles de 44 px ; pas de défilement horizontal à 375 px.
- Point de rupture de la nav : 900 px. Délai du four : 4 000 ms ; ouverture possible pendant 600 000 ms après l'activation.
- Valeurs du Tally enregistrées mot pour mot.
- `npx --yes qrcode@1.5.4 ...` seulement après accord explicite de Delio dans le chat.

## Review Focus

- Titre d'article contenant `{{t.title}}` ou `{{x}}` dans une liste : affiché tel quel, jamais remplacé. Test tâche 1.
- Retour sur `/fournee` 20 minutes après l'inscription, ou compte de Léa : pas de four. Test tâche 2.
- Changement de langue depuis le panneau mobile ouvert : panneau toujours ouvert, focus sur le bouton de langue. Test tâche 4 (`ouvert` dans `Nav.html`) et navigateur.
- Action à la souris : le focus ne saute pas sur « Annuler » et le message expire en 5 s. Navigateur tâche 5.
- Valeur de profil inconnue du Tally (ancien compte) : affichée telle quelle en EN. Test tâche 3.

---

### Task 1: Moteur sans double remplacement

**Files:** Modify `boot.js` ; Test `tests/boot.test.js`

**Interfaces:** Produces `remplirGabarit(tpl: string, v: object) -> string` et `esc(v) -> string`, exportés par `boot.js` quand `module.exports` existe (aucun accès au DOM dans ce cas).

- [ ] Test RED : `remplirGabarit('<sc-for list="{{l}}" as="x"><i>{{x.t}}</i></sc-for><b>{{a}}</b>', { l: [{ t: '{{a}}' }], a: 'A' })` ne contient pas `<i>A</i>`, contient `&#123;&#123;a&#125;&#125;` et `<b>A</b>` ; `onClick="{{f}}"` devient `data-ev="click:f"` ; échappement de `<"&>` inchangé.
- [ ] `node --test tests/boot.test.js` échoue (module sans export).
- [ ] Extraire le remplissage de `window.__render` dans `remplirGabarit` ; dans `sc-for`, la valeur est passée par `esc` puis `{` et `}` deviennent `&#123;` et `&#125;`.
- [ ] Suite complète verte ; commit `fix(moteur): une valeur de liste n'est jamais réinterprétée`.

### Task 2: Four compté depuis la première visite, reset partout

**Files:** Modify `auth.js`, `api.js`, `ta-fournee-type.html`, `verifie-tes-mails.html` ; Test `tests/auth.test.js`

**Interfaces:** Produces `Auth.pur.ouvrirFour(etat, maintenantIso) -> { etat, erreur: null }` et `Auth.ouvrirFour()` (enveloppe stockage) ; compte normalisé avec `fourOuvertLe: string|null`.

- [ ] Tests RED : activé à T0, `ouvrirFour` à T0+30 s pose `fourOuvertLe` ; `fourneeAuFour` vrai à T0+33 s, faux à T0+35 s ; second `ouvrirFour` ne déplace pas la date ; `ouvrirFour` à T0+11 min ne pose rien et `fourneeAuFour` faux ; Léa : rien ; `normaliser` garde `fourOuvertLe`.
- [ ] Implémenter ; `fourneeAuFour` compte depuis `fourOuvertLe || activeLe` ; `Api.chargerFournee` appelle `Auth.ouvrirFour()` avant le test.
- [ ] Les deux pages : `<script src="/store.js"></script><script src="/demo.js"></script>` avant `auth.js` dans le `<head>`, retirés du bas.
- [ ] Suite verte ; navigateur : `/ta-fournee-type?demo=reset` après inscription renvoie vers `/questionnaire` avec l'état vidé ; commit.

### Task 3: Libellés anglais et titres de pages

**Files:** Modify `questionnaire.js`, `questionnaire.html`, `ta-fournee-type.html`, `profil.html`, `boot.js`, toutes les pages `.html` (meta) ; Test `tests/questionnaire.test.js`, `tests/boot.test.js`

**Interfaces:** Produces `Questionnaire.LIBELLES_EN` (table du `questionnaire.html` actuel) et `Questionnaire.libelle(valeur, lang) -> string` (valeur inchangée en FR ou si inconnue) ; `titrePage(lang, fr, en) -> string` exporté par `boot.js` (`en` vide : `fr`).

- [ ] Tests RED : `libelle('Vidéo','en') === 'Video'`, `libelle('Vidéo','fr') === 'Vidéo'`, `libelle('Inconnu','en') === 'Inconnu'`, chaque choix du Tally a un libellé EN ; `titrePage('en','A','B') === 'B'`, `titrePage('en','A','') === 'A'`.
- [ ] Implémenter ; questionnaire, restitution et profil passent par `Questionnaire.libelle` (profil charge `questionnaire.js`) ; `boot.js` lit `meta[name="pq-titre-en"]` à chaque rendu ; une meta par page.
- [ ] Suite verte ; navigateur EN : restitution et profil en anglais, onglet traduit ; commit.

### Task 4: Nav mobile

**Files:** Modify `nav.js` ; Test `tests/nav.test.js`

**Interfaces:** `Nav.html(o)` accepte `o.ouvert: boolean` ; produit un bouton `data-nav-menu data-focus="nav-menu" aria-expanded aria-controls="pq-nav-panneau"` et `<div id="pq-nav-panneau" class="pq-nav-panneau">` ; la racine porte `data-ouvert` quand `ouvert`.

- [ ] Tests RED : bouton menu avec `aria-expanded="false"` par défaut, `"true"` avec `ouvert`, `aria-controls="pq-nav-panneau"`, libellé « Menu » / « Menu », prénom présent dans la barre ; liens et déconnexion dans le panneau.
- [ ] Implémenter le gabarit, la feuille injectée (sous 900 px : nav en barre collante, panneau masqué sauf ouvert, en surplomb sous la barre ; au-dessus : bouton masqué), et le comportement (bascule, Échap, clic extérieur, sortie du focus).
- [ ] Suite verte ; navigateur 375 / 768 / 1024 / 1440 sur les 5 pages ; commit.

### Task 5: Message annulable au clavier

**Files:** Modify `bento-ui.js`, `fournee.html`, `garde-manger.html`

**Interfaces:** `BentoUI.toast(el, vue, onUndo)` inchangé, le bouton reçoit `aria-describedby` vers le texte ; nouveau `BentoUI.suivreToast(el, { pause, reprise, echap })` (liaison unique sur la zone statique).

- [ ] Fournée (Mettre de côté, Ignorer) et garde-manger (Retirer) : action au clavier (`e.detail === 0`) met le focus sur Annuler ; pause du délai au focus, reprise de 5 s à la sortie ; Échap rend le focus à l'origine.
- [ ] Navigateur : clavier et souris sur les deux pages ; commit.

### Task 6: Comptoir, 404, badges et mouvement

**Files:** Modify `comptoir.html`, `404.html`, pages avec badges et transitions

- [ ] Comptoir : état `chargement` (KPI « … », sous-titres masqués, graphique et analyse « Mise au four… ») ; relance toutes les 2 s tant que `attente`.
- [ ] 404 : en-tête `parcours.js` (`parcours.css`), lien « Retour à l'accueil » vers `/`.
- [ ] Badges : recenser `MVP`, `V1`, `Données d'exemple` ; ne garder que les justes. Transitions sous `prefers-reduced-motion: reduce` coupées.
- [ ] Navigateur ; commit.

### Task 7: QR code et page `/qr`

**Files:** Create `assets/qr-landing.svg`, `qr.html` ; Modify `index.html`

- [ ] Demander l'accord de Delio pour `npx --yes qrcode@1.5.4 -t svg -o assets/qr-landing.svg "https://team42svp.vercel.app/"` ; lancer seulement après un oui.
- [ ] `/qr` : QR en grand (au moins 320 px), adresse en clair, styles d'impression ; landing : bloc « Scanne pour la démo » au-dessus de 1024 px, `alt` explicite.
- [ ] Navigateur ; commit.

### Task 8: Passe accessibilité et scénario

**Files:** Create `docs/demo/scenario-jury.md` ; Modify ce que la passe révèle

- [ ] Passe 375 / 768 / 1024 / 1440, clavier, contrastes (script de calcul dans la page), repères sur tout le parcours ; corriger.
- [ ] Écrire le scénario, le jouer après `?demo=reset`, noter les durées réelles ; commit.
