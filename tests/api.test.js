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
  const posts = lire('posts.json');
  assert.equal(posts.length, 6);
  for (const p of posts) assert.ok(p.label && Number.isInteger(p.impressions) && ['vert', 'orange', 'rouge'].includes(p.feu));
});
