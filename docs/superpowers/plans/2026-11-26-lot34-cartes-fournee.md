# Plan du lot 34 : cartes dans la fournée, collection de pains

Spec : `docs/superpowers/specs/2026-11-26-lot34-cartes-fournee-design.md`. Journal : `.superpowers/sdd/2026-11-26-lot34-cartes-fournee/progress.md`.

1. **jeu.js (TDD)** : `decouvertes` du jour, `estDecouverte`, `decouvrir` (collection, fraîcheur, levain, +10 une fois par jour), `toutDecouvrir`, `historique` (tri, filtres), `etiquetteDos` ; retrait de `rituelAFaire`, `marquerRituel`, `lireVue`, `choisirVue`, `gagnerRituel`, `ordreRetournement`, `peutRetourner`, `suivante`, `faceHtml`, `ouvrirFournee` ; données d'exemple de Léa enrichies. Tests dans `tests/progression.test.js` et `tests/jeu.test.js`.
2. **Retrait du rituel** : suppression de `rituel.js`, des balises script des cinq pages, des styles `.jeu-rituel*`, de l'attente `pq:rituel-fin` dans `visite.js`.
3. **fournee.html** : dos de carte dans chaque tuile, retournement animé, focus et annonce, compteur et « Tout retourner », Personnaliser, retrait de la bascule et de la vue cartes.
4. **visite.js** : événement `pq:visite-etape`, texte de l'étape fournée ; la fournée découvre le n°1.
5. **garde-manger.html** : onglet « Collection de pains », progression par famille, historique filtrable.
6. **profil.html, comptoir, docs** : textes d'aide mis à jour, note back.
7. **Vérification** : tests, navigateur 1280x800 et 390 px, 4 thèmes, FR et EN, captures `docs/demo/captures-lot34/`.
