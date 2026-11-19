const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Lot 19 (passe unslop) : accueil, fournée et comptoir.
const RACINE = path.join(__dirname, '..');
const lireFichier = f => fs.readFileSync(path.join(RACINE, f), 'utf8');

function textes(page) {
  const html = lireFichier(page);
  const objet = html.split('var T = ')[1].split('\n};')[0] + '\n}';
  return vm.runInNewContext('(' + objet + ')');
}

test('accueil : les tuiles n°2 à n°7 de l’aperçu montrent les vrais titres de la fournée de démo', () => {
  const T = textes('index.html');
  const articles = JSON.parse(lireFichier('data/fournee.json')).articles;
  for (let rang = 2; rang <= 7; rang++) {
    const article = articles.find(a => a.rang === rang);
    assert.equal(T.fr['titre' + rang], article.titre, 'n°' + rang);
    assert.ok(T.en['titre' + rang], 'traduction EN de n°' + rang);
  }
  const html = lireFichier('index.html');
  assert.equal((html.match(/<span class="mini-texte">\{\{t\.titre[2-7]\}\}<\/span>/g) || []).length, 6);
});

test('surtitres en casse normale, sans capitales espacées, sur les trois écrans', () => {
  for (const f of ['fournee.html', 'comptoir.html', 'parcours.css']) {
    assert.doesNotMatch(lireFichier(f), /text-transform:\s*uppercase/, f);
  }
});

test('titres et chiffres à 600 au plus sur la fournée et le comptoir', () => {
  for (const f of ['fournee.html', 'comptoir.html']) {
    assert.doesNotMatch(lireFichier(f), /font-weight:\s*[789]00/, f);
  }
  assert.doesNotMatch(lireFichier('parcours.css'), /\.(heros h1|section-titre|etape-num|mini-titre|mini-rang)\{[^}]*font-weight:[789]00/);
});

test('comptoir : chaque variation dit à quoi elle se compare', () => {
  const T = textes('comptoir.html');
  for (const k of ['hausseN', 'baisseN', 'hausseP', 'baisseP']) {
    assert.match(T.fr.ecart[k], /vs mois dernier$/, 'fr ' + k);
    assert.match(T.en.ecart[k], /vs last month$/, 'en ' + k);
  }
});

test('comptoir : le four ne tourne plus en boucle, pas de point d’exclamation dans l’analyse', () => {
  const html = lireFichier('comptoir.html');
  assert.doesNotMatch(html, /infinite/);
  assert.doesNotMatch(html, /four-lueur/);
  assert.doesNotMatch(lireFichier('comptoir.js'), /PHRASES[\s\S]*?!\s/);
});

test('fournée : le surlignage reste un anneau croûte, sans lueur floue', () => {
  const html = lireFichier('fournee.html');
  const halo = html.match(/\.bento \.tile\.pq-halo\{[^}]*\}/)[0];
  assert.match(halo, /0 0 0 4px var\(--croute\)/);
  assert.doesNotMatch(html, /0 0 \d+px \d+px color-mix/);
});
