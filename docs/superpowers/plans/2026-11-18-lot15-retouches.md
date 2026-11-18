# Plan du lot 15

Design : `docs/superpowers/specs/2026-11-18-lot15-retouches-design.md`. Tests : `node --test "tests/*.test.js"`.

1. Couleurs imposées : tests (`tests/charte.test.js`) puis `charte.css`, `tools/palette-oklch.js`, règles des boutons (fournee, garde-manger, fournil), SVG du petit pain. Commit.
2. Profil : test de `tests/profil.test.js` puis textes de `profil.html`. Commit.
3. Slogan : test de `tests/nav.test.js` puis `nav.js`. Commit.
4. Jauges : tests de `Bento.jauges` puis gabarit et styles du n°1. Commit.
5. Fournée sans scroll : tests de `Bento.rangees` puis classe `fournee-tient` et CSS ; mesures au navigateur à 1280x800 et 1440x900. Commit.
6. Vérification au navigateur dans les 4 thèmes (fournée, fournil, profil, garde-manger, comptoir), console, remise à zéro de la démo.
