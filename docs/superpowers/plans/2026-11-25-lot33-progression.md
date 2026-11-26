# Plan lot 33 : progression personnelle

Design : `docs/superpowers/specs/2026-11-25-lot33-progression-design.md`. Journal : `.superpowers/sdd/2026-11-25-lot33-progression/progress.md`. Base : `feat/lot32-cartes` (PR #41 non fusionnée, PR empilée).

1. **Tests rouges** `tests/progression.test.js` : constantes (points, niveaux, levain), niveau et barre, cuisson unique et pondérée, rituel une fois par jour, levain qui s'endort puis se réveille (dates injectées), cartes vues, collection par famille, désactivation (aucun gain, données gardées), exemple de Léa, compatibilité avec un compte du lot 32, textes FR/EN sans tiret long, branchements des pages (fournil, comptoir, garde-manger, profil, fournée, rituel).
2. **`jeu.js`** jusqu'au vert.
3. **`charte.css`** : carte cuite, encart, collection, onglets.
4. **Pages** : fournil (cuisson et message), fournée (cartes vues, cuites, bascule masquée si jeu coupé), rituel (gain, jeu coupé), comptoir (encart), garde-manger (onglets et collection), profil (case).
5. **Note back** `docs/branchement-back.md`.
6. **Vérification** navigateur 1280x800 et 390 px, 4 thèmes, FR/EN, captures `docs/demo/captures-lot33/`.
7. **Commits** en français.
