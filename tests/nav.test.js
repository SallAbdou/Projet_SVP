const test = require('node:test');
const assert = require('node:assert/strict');
const N = require('../nav.js');
const base = { page: 'fournee', lang: 'fr', compteurGardeManger: 0, prenom: 'Léa' };
const html = o => N.html(Object.assign({}, base, o));

test('les 5 liens sont présents', () => {
  const h = html({});
  for (const href of ['href="/comptoir"', 'href="/fournee"', 'href="/fournil"', 'href="/garde-manger"', 'href="/profil"']) assert.ok(h.includes(href), href);
  assert.ok(!h.includes('href="/"'));
  assert.ok(!h.includes('/preferences'));
});

test('utilisatrice connectée : prénom, initiale et déconnexion', () => {
  const h = html({ prenom: 'Sam' });
  assert.ok(h.includes('>Sam<'));
  assert.ok(h.includes('>S<'));
  assert.ok(/<button type="button"[^>]*data-focus="logout"[^>]*>[^<]*Se déconnecter/.test(h));
  assert.ok(/data-focus="logout"[^>]*>[^<]*Log out/.test(html({ lang: 'en' })));
});

test('aria-current seulement sur la page courante', () => {
  const h = html({ page: 'fournil' });
  assert.equal(h.split('aria-current="page"').length - 1, 1);
  assert.ok(/<a href="\/fournil" aria-current="page"/.test(h));
});

test('compteur du garde-manger', () => {
  assert.ok(!html({ compteurGardeManger: 0 }).includes('data-compteur'));
  assert.ok(/data-compteur[^>]*>3</.test(html({ compteurGardeManger: 3 })));
  assert.ok(html({ compteurGardeManger: 1 }).includes('aria-label="1 article mis de côté"'));
  assert.ok(html({ compteurGardeManger: 3 }).includes('aria-label="3 articles mis de côté"'));
});

test('prénom échappé', () => {
  const h = html({ prenom: '<b>"Léa" & co</b>' });
  assert.ok(h.includes('&lt;b&gt;&quot;Léa&quot; &amp; co&lt;/b&gt;'));
  assert.ok(!h.includes('<b>"Léa"'));
});

test('libellés et boutons de langue', () => {
  const fr = html({});
  assert.ok(fr.includes('Le comptoir') && fr.includes('Mon profil'));
  assert.ok(/data-focus="lang-fr"[^>]*aria-pressed="true"/.test(fr));
  assert.ok(/data-focus="lang-en"[^>]*aria-pressed="false"/.test(fr));
  const en = html({ lang: 'en' });
  assert.ok(en.includes('The counter') && en.includes('My profile'));
  assert.ok(/data-focus="lang-en"[^>]*aria-pressed="true"/.test(en));
});

test('bouton menu mobile : disclosure fermée par défaut', () => {
  const h = html({});
  assert.ok(/<button type="button"[^>]*data-nav-menu[^>]*aria-expanded="false"/.test(h));
  assert.ok(/data-nav-menu[^>]*aria-controls="pq-nav-panneau"/.test(h));
  assert.ok(/data-nav-menu[^>]*data-focus="nav-menu"/.test(h));
  assert.ok(/data-nav-menu[^>]*>[\s\S]*?Menu[\s\S]*?<\/button>/.test(h));
  assert.ok(!h.includes('data-ouvert'));
});

test('bouton menu ouvert', () => {
  const h = html({ ouvert: true });
  assert.ok(/data-nav-menu[^>]*aria-expanded="true"/.test(h));
  assert.ok(h.includes('data-ouvert'));
});

test('liens, langue et déconnexion dans le panneau, prénom dans la barre', () => {
  const h = html({ prenom: 'Sam' });
  const i = h.indexOf('id="pq-nav-panneau"');
  assert.ok(i > 0);
  const barre = h.slice(0, i);
  const panneau = h.slice(i);
  for (const x of ['href="/comptoir"', 'data-lang="en"', 'data-logout']) assert.ok(panneau.includes(x), x);
  assert.ok(/class="pq-nav-prenom"[^>]*>Sam</.test(barre));
});
