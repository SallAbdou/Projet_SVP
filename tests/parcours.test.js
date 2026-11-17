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
