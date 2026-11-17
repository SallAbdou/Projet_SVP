const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../bento.js');

const depart = o => B.departGlisser(Object.assign({ edition: true, surTuile: true, surControle: false, typePointeur: 'mouse', bouton: 0 }, o));

test('souris ou stylet n\'importe où sur un bloc en mode Personnaliser : glisser immédiat', () => {
  assert.equal(depart({}), 'immediat');
  assert.equal(depart({ typePointeur: 'pen' }), 'immediat');
});

test('au doigt : appui long pour laisser défiler la page', () => {
  assert.equal(depart({ typePointeur: 'touch' }), 'appui-long');
});

test('poignée ⠿ : glisser immédiat, même au doigt', () => {
  assert.equal(depart({ typePointeur: 'touch', surPoignee: true }), 'immediat');
});

test('pas de glisser hors mode Personnaliser, hors bloc, sur un bouton ou avec le clic droit', () => {
  assert.equal(depart({ edition: false }), null);
  assert.equal(depart({ surTuile: false }), null);
  assert.equal(depart({ surControle: true }), null);
  assert.equal(depart({ bouton: 2 }), null);
});
