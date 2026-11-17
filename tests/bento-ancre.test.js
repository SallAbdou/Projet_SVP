const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../bento.js');

test('cibleAncre vise le bloc demandé s’il est visible', () => {
  assert.equal(B.cibleAncre('#n1', ['n1', 'n2']), 'n1');
  assert.equal(B.cibleAncre('#n3', ['n1', 'n3']), 'n3');
});

test('cibleAncre se replie sur le premier bloc news visible, dans l’ordre n1 à n7', () => {
  assert.equal(B.cibleAncre('#n1', ['graph', 'n3', 'n2']), 'n2');
});

test('cibleAncre ignore les ancres étrangères et l’absence de bloc news', () => {
  assert.equal(B.cibleAncre('', ['n1']), null);
  assert.equal(B.cibleAncre(undefined, ['n1']), null);
  assert.equal(B.cibleAncre('#haut', ['n1']), null);
  assert.equal(B.cibleAncre('#n9', ['n1']), null);
  assert.equal(B.cibleAncre('#n1', ['graph']), null);
  assert.equal(B.cibleAncre('#n1', null), null);
});
