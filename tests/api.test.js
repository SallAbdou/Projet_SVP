const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const A = require('../api.js');
const lire = f => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', f), 'utf8'));
const ok = { ref: 'r1', rang: 1, titre: 'T', url: 'https://x.fr', source: 'S', feu: 'vert', raisonFeu: '', axe: 'Axe 1', resume: '', pourToi: '', durabilite: 4, propension: 5, lienOffre: 4 };

test('estReponseValide', () => {
  assert.equal(A.estReponseValide({ etat: 'pret', prenom: 'Léa', articles: [ok] }), true);
  assert.equal(A.estReponseValide({ etat: 'attente' }), true);
  assert.equal(A.estReponseValide({ etat: 'invalide' }), true);
  for (const r of [null, [], {}, { etat: 'fini' }, { etat: 'pret', prenom: 'L' },
    { etat: 'pret', prenom: 'L', articles: [Object.assign({}, ok, { feu: 'bleu' })] },
    { etat: 'pret', prenom: 'L', articles: [Object.assign({}, ok, { durabilite: 6 })] },
    { etat: 'pret', prenom: 'L', articles: [Object.assign({}, ok, { rang: 0 })] }]) {
    assert.equal(A.estReponseValide(r), false, JSON.stringify(r));
  }
});

test('les fichiers de démo respectent le contrat', () => {
  const f = lire('fournee.json');
  assert.equal(A.estReponseValide(f), true);
  assert.equal(f.articles.length, 7);
  assert.deepEqual(f.articles.map(a => a.rang), [1, 2, 3, 4, 5, 6, 7]);
  assert.equal(new Set(f.articles.map(a => a.ref)).size, 7);
  for (const a of f.articles) {
    assert.ok(/^https:\/\//.test(a.url), a.ref);
    assert.ok(['Axe 1', 'Axe 2'].includes(a.axe), a.ref);
    assert.ok(a.resume && a.raisonFeu && a.pourToi.startsWith('Pour toi :'), a.ref);
  }
});

const ex = { ref: 'h1', titre: 'Titre', label: 'Court', feu: 'vert', ilYaJours: 3, chiffres: { impressions: 10, reactions: 1, republications: 0, commentaires: 2, contacts: 0 } };
const avec = (champ, v) => Object.assign({}, ex, { [champ]: v });
const chiffresAvec = (champ, v) => avec('chiffres', Object.assign({}, ex.chiffres, { [champ]: v }));

test('postExempleValide', () => {
  assert.equal(A.postExempleValide(ex), true);
  for (const p of [null, [], avec('feu', 'bleu'), avec('ilYaJours', -1), avec('ilYaJours', 1.5), avec('ref', ''),
    avec('label', 3), avec('chiffres', null), chiffresAvec('contacts', -1), chiffresAvec('reactions', 2.5), chiffresAvec('impressions', undefined)]) {
    assert.equal(A.postExempleValide(p), false, JSON.stringify(p));
  }
});

test('l historique d exemple donne les chiffres de la maquette', () => {
  const C = require('../comptoir.js');
  const posts = lire('posts.json');
  assert.equal(posts.length, 10);
  assert.ok(posts.every(A.postExempleValide));
  assert.equal(new Set(posts.map(p => p.ref)).size, 10);
  assert.ok(posts.every(p => p.ilYaJours >= 0 && p.ilYaJours <= 59));
  const k = C.kpis(C.depuisExemples(posts, '2026-11-17T10:00:00.000Z'), '2026-11-17T10:00:00.000Z');
  assert.deepEqual([k.actuel.posts, k.actuel.impressions, k.actuel.reactions, k.actuel.republications], [6, 4820, 312, 27]);
  assert.deepEqual(k.ecarts.posts, { sens: 'hausse', valeur: 2 });
  assert.deepEqual(k.ecarts.impressions, { sens: 'hausse', valeur: 38 });
  assert.deepEqual(k.ecarts.reactions, { sens: 'hausse', valeur: 21 });
  assert.deepEqual(k.ecarts.republications, { sens: 'stable', valeur: 0 });
});
