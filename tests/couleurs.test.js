const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Toute couleur passe par les variables de thème de charte.css : aucun littéral hex, rgb() ou hsl()
// ailleurs que dans ses blocs :root et [data-theme=...]. Le QR code (assets/qr-landing.svg) n'est pas
// concerné : ses noir et blanc doivent rester fixes pour être lus par les scanners.
const RACINE = path.join(__dirname, '..');
const LITTERAL = /(?<![&\w])#[0-9A-Fa-f]{3,8}\b|\b(?:rgba?|hsla?)\(/g;

function sansBlocsDeTheme(css) {
  return css.replace(/(?::root|\[data-theme="\w+"\])[^{}]*\{[^{}]*\}/g, '');
}

test('aucune couleur écrite en dur hors des variables de thème', () => {
  const fichiers = fs.readdirSync(RACINE).filter(f => /\.(css|html|js)$/.test(f));
  assert.ok(fichiers.length > 30);
  const trouvees = [];
  for (const f of fichiers) {
    let texte = fs.readFileSync(path.join(RACINE, f), 'utf8');
    if (f === 'charte.css') texte = sansBlocsDeTheme(texte);
    texte.split('\n').forEach((ligne, i) => {
      const m = ligne.match(LITTERAL);
      if (m) trouvees.push(`${f}:${i + 1} ${m.join(' ')}`);
    });
  }
  assert.deepEqual(trouvees, []);
});

test('la recherche détecte bien hex, rgb() et hsl(), et ignore les entités HTML', () => {
  const t = s => (s.match(LITTERAL) || []).length;
  assert.equal(t('color:#FFF;background:#a1b2c3'), 2);
  assert.equal(t('box-shadow:0 0 4px rgba(0,0,0,.3);color:hsl(10 20% 30%)'), 2);
  assert.equal(t('&#123; &#125; var(--fond)'), 0);
  assert.equal(sansBlocsDeTheme(':root{--a:#FFF}\n[data-theme="nuit"]{--a:#000}\n.x{color:#123456}'), '\n\n.x{color:#123456}');
});
