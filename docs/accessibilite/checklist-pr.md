# Checklist accessibilité pour chaque PR

Cible : WCAG 2.2 AA. À cocher pour chaque page ou composant touché par la PR. Les garde-fous automatiques
(`node --test "tests/*.test.js"`, en particulier `tests/gardefous.test.js` et `tests/charte.test.js`) couvrent une partie
de cette liste ; le reste se vérifie à la main, en moins de cinq minutes.

- [ ] **Clavier** : tout se fait au clavier seul (Tab, Maj+Tab, Entrée, Espace, Échap), dans un ordre logique, sans piège.
- [ ] **Focus visible** : chaque élément atteint au clavier montre un contour net (`:focus-visible`), jamais masqué par la barre collante.
- [ ] **Nom accessible** : boutons, liens, champs et icônes seules ont un nom clair (texte visible, `label` ou `aria-label` qui commence par le texte visible).
- [ ] **Contraste** : texte à 4,5:1, contours, focus et graphiques à 3:1, dans les 4 thèmes (Bronze, Boulangerie classique, Nuit, Contraste élevé). Toute nouvelle paire de couleurs est ajoutée à `tests/charte.test.js`.
- [ ] **Cibles de 24 px** : chaque cible cliquable mesure au moins 24 × 24 px, ou garde assez d'espace autour.
- [ ] **Animations coupables** : toute animation ou boucle s'arrête avec la case « Animations activées » du profil (`data-animations="off"`) et sous `prefers-reduced-motion` ; attention aux dessins servis par `<use>`, que `html[...]` n'atteint pas.
- [ ] **Textes FR/EN** : tout nouveau texte visible ou annoncé (y compris `aria-label`, bulles, messages d'erreur) existe en français et en anglais.
- [ ] **Test axe DevTools** : extension axe DevTools lancée sur chaque page touchée, en mode démo, sans nouvelle erreur (noter les avertissements restants dans la PR).
