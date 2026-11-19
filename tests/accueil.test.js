const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Retours iPhone du lot 18 : accueil (virgule, aperçu à 7 tuiles) et Découvrir (coupure du chapo).
const RACINE = path.join(__dirname, '..');

function lire(page) {
  const html = fs.readFileSync(path.join(RACINE, page), 'utf8');
  const tpl = html.split('<script type="text/plain" id="tpl">')[1].split('</script>')[0];
  const objet = html.split('var T = ')[1].split('\nclass Component')[0].trim().replace(/;$/, '');
  return { tpl, T: vm.runInNewContext('(' + objet + ')') };
}

test('accueil : étape 3 sans virgule avant « et tu suis », en FR comme en EN', () => {
  const { T } = lire('index.html');
  assert.equal(T.fr.etapes[2][1], 'Tu pétris la news en post LinkedIn en quelques minutes et tu suis ce qu’il rapporte.');
  assert.equal(T.en.etapes[2][1], 'Knead the story into a LinkedIn post in minutes and track what it brings in.');
});

test('accueil : l’aperçu montre 7 tuiles, de n°1 à n°7', () => {
  const { tpl, T } = lire('index.html');
  const bento = tpl.split('<div class="mini-bento"')[1].split('</figure>')[0];
  const tuiles = bento.match(/<div class="mini-tuile[^"]*">/g);
  assert.equal(tuiles.length, 7);
  for (let i = 1; i <= 7; i++) {
    assert.ok(bento.includes('{{t.n' + i + '}}'), 'libellé t.n' + i + ' absent du gabarit');
    assert.equal(T.fr['n' + i], 'n°' + i);
    assert.equal(T.en['n' + i], '#' + i);
  }
});

test('accueil : les tuiles remplissent la grille de 4 colonnes sans trou', () => {
  const { tpl } = lire('index.html');
  const bento = tpl.split('<div class="mini-bento"')[1].split('</figure>')[0];
  const cases = bento.match(/<div class="mini-tuile[^"]*">/g).map(t =>
    /\bor\b/.test(t) ? 4 : /\blarge\b/.test(t) ? 2 : 1);
  const total = cases.reduce((a, b) => a + b, 0);
  assert.equal(total % 4, 0, 'la dernière rangée est incomplète (' + total + ' cases)');
});

test('accueil : le libellé accessible de l’aperçu annonce les 6 suivantes', () => {
  const { T } = lire('index.html');
  assert.match(T.fr.apercuLabel, /6 suivantes/);
  assert.match(T.en.apercuLabel, /6 next/);
});

test('Découvrir : la liste du chapo passe à la ligne d’un seul tenant', () => {
  const { tpl, T } = lire('decouvrir.html');
  assert.match(tpl, /<p class="chapo">\{\{t\.chapoDebut\}\} <span class="groupe">\{\{t\.chapoListe\}\}<\/span><\/p>/);
  assert.equal(T.fr.chapoDebut + ' ' + T.fr.chapoListe, '2 minutes pour la régler à ton goût : ton métier, tes thèmes, ton niveau.');
  assert.equal(T.en.chapoDebut + ' ' + T.en.chapoListe, '2 minutes to make it just the way you like: your job, your topics, your level.');
  assert.ok(!/<|>/.test(T.fr.chapoListe + T.en.chapoListe), 'pas de balise dans les chaînes traduites');
  const css = fs.readFileSync(path.join(RACINE, 'parcours.css'), 'utf8');
  assert.match(css, /\.groupe\{display:inline-block\}/);
});
