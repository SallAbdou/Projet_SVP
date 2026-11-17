const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../garde.js');

test('retourSur garde les chemins internes', () => {
  assert.equal(G.retourSur('/fournil?x=1'), '/fournil?x=1');
  assert.equal(G.retourSur('/fournee'), '/fournee');
});

test('retourSur refuse toute sortie du site', () => {
  for (const v of ['//pirate.fr', 'https://pirate.fr', '/\\pirate.fr', '', null, undefined, 'fournil', '/fournil\\x', 'javascript:alert(1)', 42, '/\t/pirate.fr', '/\n/pirate.fr', '/\r/pirate.fr', ' //pirate.fr']) {
    assert.equal(G.retourSur(v), '/fournee', String(v));
  }
});

test('adresseConnexion encode le chemin demandé', () => {
  assert.equal(G.adresseConnexion('/fournee', ''), '/connexion?retour=%2Ffournee');
  assert.equal(G.adresseConnexion('/fournil', '?x=1'), '/connexion?retour=%2Ffournil%3Fx%3D1');
});
