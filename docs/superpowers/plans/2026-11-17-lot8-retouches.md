# Lot 8 · Retouches : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** bouton QR en haut à droite de la landing avec modale, mises en page prédéfinies de la fournée, « Lire la source » sur chaque news.

**Architecture:** logique pure en ES5 dans `bento.js` et `parcours.js` (testée avec `node --test`), DOM dans `bento-ui.js` et les pages (moteur `dc.js` + `boot.js`, pas de `sc-for` imbriqué : les miniatures sont dessinées en `afterRender`).

**Tech Stack:** HTML/CSS/JS sans build ni dépendance, `node --test`.

**Spec:** `docs/superpowers/specs/2026-11-17-lot8-retouches-design.md`

## Global Constraints

- Aucun tiret long nulle part (code, textes, commits). Textes FR et EN.
- ES5 dans `bento.js`, `bento-ui.js`, `parcours.js` (pas de `const`, de flèche ni de classe).
- Cibles de 44 px (36 px pour `.act` à la souris), focus visible.
- Clés de stockage : `pq-layout` (inchangée), `pq-layout-perso` (nouvelle).
- Commits terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Rien n'est poussé.

## Review Focus

- `pq-layout-perso` corrompu ou bloqué (navigation privée) : `loadPerso` renvoie `null`, la page fonctionne. Test dans la tâche 2.
- « Personnalisée » choisie sans disposition personnalisée enregistrée : rien ne change, pas d'erreur. Test dans la tâche 2.
- Préréglage choisi alors qu'on est déjà sur un préréglage : `perso` n'est pas écrasé. Test dans la tâche 2.
- Fournée avec moins de sujets que le préréglage (2 sujets, « Informative ») : les emplacements vides restent cachés, pas d'erreur (trou visuel accepté). Vérifié au navigateur.
- Modale QR ouverte puis changement de langue : la modale reste ouverte et le focus reste dedans. Vérifié au navigateur.

---

### Task 1: Préréglages et placement (`bento.js`)

**Files:** Modify `bento.js` · Test `tests/bento-presets.test.js`

**Interfaces:** Produces `Bento.PRESETS`, `Bento.PRESET_PERSO`, `Bento.appliquerPreset(layout, id) -> layout`, `Bento.presetCourant(layout) -> string`, `Bento.placer(layout, available, colonnes) -> [{ id, col, row, w, h }]`.

- [ ] Écrire les tests : chaque préréglage passe `normalizeLayout` à l'identique ; `placer(preset, Infinity, 4)` couvre exactement `rangées × 4` cases sans chevauchement (2 rangées pour concentree et graphique, 3 pour les autres) ; `appliquerPreset(default,'equilibree')` égale `defaultLayout()` ; `presetCourant(defaultLayout()) === 'equilibree'` ; `presetCourant` vaut `'personnalisee'` après `moveTile`, `stepTile`, `setSize`, `setNewsCount` appliqués à chaque préréglage ; `appliquerPreset(l, 'inconnu')` égale `l` sans le muter.
- [ ] Lancer `node --test tests/bento-presets.test.js` : échec attendu (fonctions absentes).
- [ ] Implémenter : préréglages décrits par `{ id, newsCount, shown: [[id, size], ...] }` puis complétés avec les emplacements restants (ordre `TILE_IDS`, taille par défaut). `placer` : pour chaque emplacement affiché, première case (rangée puis colonne) où le bloc tient, en largeur bornée à `colonnes`.
- [ ] Relancer : vert. Commit `feat(bento): mises en page prédéfinies et placement dense`.

### Task 2: Choix et mémoire de la disposition personnalisée (`bento.js`)

**Files:** Modify `bento.js` · Test `tests/bento-presets.test.js`

**Interfaces:** Produces `Bento.choisirMiseEnPage(layout, perso, id) -> { layout, perso }`, `Bento.loadPerso(storage) -> layout|null`, `Bento.savePerso(storage, layout) -> boolean`, `Bento.PERSO_KEY`.

- [ ] Tests : depuis une disposition personnalisée P, choisir `concentree` donne `{ layout: concentree, perso: P }` ; puis choisir `informative` garde `perso: P` ; puis `personnalisee` rend P ; `personnalisee` avec `perso` nul rend la disposition courante ; `loadPerso` renvoie `null` si absent, JSON cassé ou stockage qui lève, et une disposition normalisée sinon.
- [ ] Échec attendu, implémentation, vert. Commit `feat(bento): retour à la mise en page personnalisée`.

### Task 3: Sélecteur « Mise en page » (`fournee.html`, `bento-ui.js`)

**Files:** Modify `fournee.html`, `bento-ui.js`

**Interfaces:** Consumes tâches 1 et 2. Produces `BentoUI.miniature(svgParent, layout)`.

- [ ] Dans la barre d'édition, avant `editHint` : `<div role="radiogroup" aria-labelledby="mep-t" onKeydown="{{clavierMep}}">` + `sc-for` des cartes `<button type="button" role="radio" class="mep" data-mep="{{p.id}}" data-act="mep-{{p.id}}" aria-checked="{{p.checked}}" tabindex="{{p.tabindex}}" onClick="{{choisirMep}}">` avec `<span data-mini="{{p.id}}" aria-hidden="true">`, nom, description.
- [ ] État `perso` chargé par `Bento.loadPerso`. `choisirMep(id)` : `Bento.choisirMiseEnPage`, `savePerso` si `perso` change, `updateLayout`, focus sur la carte, toast `{ type: 'layout', nom }` sans « Annuler ». Reset passe par `choisirMep('equilibree')`.
- [ ] `afterRender` : `BentoUI.miniature` dans chaque `[data-mini]` (perso ou disposition courante pour « Personnalisée »). SVG `viewBox` 4 × rangées, rectangles avec marge, n1 en doré `#F2C46D` bordé `#B87420`, graph `#8A4F1C`, autres `#EAD9BC`.
- [ ] CSS `.mep-groupe`, `.mep` (cochée : bordure brune, fond `#FFFDF8`).
- [ ] `node --test "tests/*.test.js"` vert ; vérifier au navigateur chaque préréglage, flèches, retour à « Personnalisée », rechargement. Commit `feat(fournee): sélecteur de mise en page`.

### Task 4: « Lire la source » sur toutes les news

**Files:** Modify `fournee.html`, `garde-manger.html`

- [ ] Remplacer le lien `only-L` par `<a class="act" data-act="read" data-id="{{s.id}}" href="{{s.url}}" target="_blank" rel="noopener" aria-label="{{s.readLabel}}" title="{{s.readLabel}}">` + icône lien externe + `<span class="act-label">{{s.read}}</span>`. `readLabel` = `fill(t.readFull, { titre })`. CSS `a.act{text-decoration:none}` et couleur.
- [ ] Garde-manger : même icône dans le lien `gm-sec` « Lire la source ».
- [ ] Vérifier S, M, L au navigateur. Commit `feat(fournee): lire la source sur chaque news`.

### Task 5: Bouton et modale QR de la landing

**Files:** Modify `parcours.js`, `parcours.css`, `index.html`, `verifie-tes-mails.html` · Test `tests/parcours.test.js`

**Interfaces:** Produces `Parcours.enteteHtml({ lang, connexion, qr })`, `Parcours.clavierModale(e, fermer)`.

- [ ] Test : `enteteHtml({ lang:'fr', qr:true })` contient `data-qr-ouvrir`, `aria-haspopup="dialog"`, `data-focus="entete-qr"` et « QR code » ; sans `qr`, rien. Échec attendu.
- [ ] Implémenter le bouton (icône SVG QR + libellé) et le branchement clic dans `monter` (`root.__app.ouvrirQr`). `clavierModale` déplacé depuis `verifie-tes-mails`.
- [ ] `.voile`, `.boite`, `.boite-barre` déplacés dans `parcours.css` ; styles `.entete-qr`.
- [ ] Landing : retirer `aside.qr-demo` et ses styles, ajouter la modale (voile, boîte, image, adresse, aide, lien `/qr`) pilotée par `state.qrOuvert`, focus sur « Fermer » à l'ouverture et retour sur `[data-focus="entete-qr"]` à la fermeture.
- [ ] Tests verts, vérification navigateur (clavier, 375 px, faux e-mail toujours fonctionnel). Commit `feat(landing): QR code en haut à droite dans une fenêtre`.

### Task 6: Vérifications et scénario

- [ ] Parcours navigateur complet (FR/EN, 1440 et 375 px, console), consigné dans `.superpowers/sdd/2026-11-17-lot8-retouches/progress.md`.
- [ ] `docs/demo/scenario-jury.md` : préparation et étape 1 renvoient au bouton « QR code ». Commit `docs(lot8): scénario et journal`.
