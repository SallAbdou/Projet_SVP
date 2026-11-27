# Lot 41 : plan

1. Tests rouges logo : `tests/parcours.test.js` (image, alt, width/height, plus d'icône pain), `tests/nav.test.js`
   (image dans `.pq-nav-marque`, accroche gardée), garde-fou : toutes les pages à `data-entete` reçoivent le logo.
2. `parcours.js`, `parcours.css`, `nav.js` : image du logo. Tests verts.
3. Tests rouges `tests/compte.test.js` : `Auth.pur.supprimerCompte`, `demoSupprime` et `normaliser`, effacement des
   seules entrées du compte, `?demo=reset` qui restaure Léa, mot de confirmation FR / EN, mode réel (URL vide,
   succès, 401, panne), contraste du bouton danger dans les 4 thèmes, profil (section, bouton, script chargé).
4. `auth.js`, `compte.js`, `config.js`, `profil.html`, `parcours.js` (message d'au revoir). Tests verts.
5. `confidentialite.html`, `docs/branchement-back.md`.
6. Navigateur 1280x800 et 390 px, 4 thèmes, FR / EN, clavier puis souris, console.
7. Commits en français.
