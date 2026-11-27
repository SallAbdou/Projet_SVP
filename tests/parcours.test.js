const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../parcours.js');

test('en-tête : logo vers l\'accueil et boutons de langue', () => {
  const fr = P.enteteHtml({ lang: 'fr' });
  assert.ok(fr.includes('href="/"'));
  assert.ok(fr.includes('aria-label="Langue"'));
  assert.ok(/data-lang="fr"[^>]*aria-pressed="true"/.test(fr));
  assert.ok(/data-lang="en"[^>]*aria-pressed="false"/.test(fr));
  const en = P.enteteHtml({ lang: 'en' });
  assert.ok(en.includes('aria-label="Language"'));
  assert.ok(/data-lang="en"[^>]*aria-pressed="true"/.test(en));
});

test('en-tête : lien de connexion optionnel', () => {
  assert.ok(!P.enteteHtml({ lang: 'fr' }).includes('/connexion'));
  assert.ok(/href="\/connexion"[^>]*>Se connecter</.test(P.enteteHtml({ lang: 'fr', connexion: true })));
  assert.ok(/href="\/connexion"[^>]*>Log in</.test(P.enteteHtml({ lang: 'en', connexion: true })));
});

test('en-tête : bouton QR code optionnel qui ouvre une fenêtre', () => {
  assert.ok(!P.enteteHtml({ lang: 'fr' }).includes('data-qr-ouvrir'));
  const fr = P.enteteHtml({ lang: 'fr', qr: true, connexion: true });
  assert.ok(/<button type="button"[^>]*data-qr-ouvrir[^>]*>/.test(fr));
  assert.ok(/data-qr-ouvrir[^>]*aria-haspopup="dialog"/.test(fr));
  assert.ok(/data-qr-ouvrir[^>]*data-focus="entete-qr"/.test(fr));
  assert.ok(/<svg[^>]*aria-hidden="true"/.test(fr.slice(fr.indexOf('data-qr-ouvrir'))));
  assert.ok(/<span class="entete-qr-texte">QR code<\/span>/.test(fr));
  assert.ok(fr.indexOf('data-qr-ouvrir') < fr.indexOf('/connexion'), 'le QR vient avant « Se connecter »');
  assert.ok(P.enteteHtml({ lang: 'en', qr: true }).includes('QR code'));
});

// Lot 41 : nouveau logo (Miette lit le journal « IA »), image fournie, sans icône pain ni texte doublé.
test('en-tête : logo image avec alt, dimensions déclarées, dans le lien vers l’accueil', () => {
  for (const lang of ['fr', 'en']) {
    const h = P.enteteHtml({ lang });
    const lien = /<a class="logo" href="\/"[^>]*>([\s\S]*?)<\/a>/.exec(h);
    assert.ok(lien, lang);
    assert.match(lien[1], /^<span class="logo-cadre"><img class="logo-img" src="\/assets\/logo-votre-pain-quotidien\.webp" width="1774" height="887" alt="Votre pAIn quotidien"><\/span>$/);
    assert.doesNotMatch(h, /logo-icone|logo-nom/);
  }
  assert.match(P.enteteHtml({ lang: 'en' }), /aria-label="Votre pAIn quotidien, home"/);
});

// Recadrage CSS sur la carte crème (sans la marge presque blanche de l'image) : carte de 1658 x 720
// à partir de (57, 82) dans l'image de 1774 x 887.
test('en-tête : logo recadré sur la carte crème, 56 px (44 px sur mobile), coins arrondis', () => {
  const css = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'parcours.css'), 'utf8');
  assert.match(css, /\.logo-cadre\{[^}]*overflow:hidden[^}]*height:56px[^}]*aspect-ratio:1658\/720[^}]*border-radius:4\.9%\/11\.25%/);
  assert.match(css, /\.logo-img\{[^}]*width:calc\(100% \* 1774 \/ 1658\)[^}]*margin:calc\(-100% \* 82 \/ 1658\) 0 0 calc\(-100% \* 57 \/ 1658\)/);
  assert.match(css, /@media \(max-width:640px\)\{[^@]*\.logo-cadre\{height:44px/);
  assert.doesNotMatch(css, /\.logo-icone|\.logo-nom/);
});

test('toutes les pages à en-tête commun chargent parcours.js (donc le logo)', () => {
  const fs = require('node:fs'), path = require('node:path');
  const racine = path.join(__dirname, '..');
  const pages = fs.readdirSync(racine).filter(f => f.endsWith('.html') && !f.includes('copy'));
  const avecEntete = pages.filter(p => fs.readFileSync(path.join(racine, p), 'utf8').includes('data-entete'));
  assert.ok(avecEntete.length >= 11, avecEntete.join(','));
  for (const p of avecEntete) assert.match(fs.readFileSync(path.join(racine, p), 'utf8'), /<script src="\/parcours\.js"><\/script>/, p);
});
