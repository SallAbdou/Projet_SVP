const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../bento.js');

test('totalScore sur les champs de WF3', () => {
  assert.equal(B.totalScore({ durabilite: 4, propension: 5, lienOffre: 4 }), 13);
  assert.equal(B.totalScore({}), 0);
});

test('pickTopics trie par rang et respecte n', () => {
  const list = [{ ref: 'c', rang: 3 }, { ref: 'a', rang: 1 }, { ref: 'b', rang: 2 }];
  assert.deepEqual(B.pickTopics(list, 3).map(x => x.ref), ['a', 'b', 'c']);
  assert.deepEqual(B.pickTopics(list, 2).map(x => x.ref), ['a', 'b']);
  assert.equal(B.pickTopics(list, 7).length, 3);
  assert.equal(list[0].ref, 'c', 'entrée non mutée');
});

test('safeUrl', () => {
  assert.equal(B.safeUrl('https://the-decoder.com/a'), 'https://the-decoder.com/a');
  assert.equal(B.safeUrl('http://x.org'), 'http://x.org');
  for (const bad of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,x', '', null, undefined, 42]) {
    assert.equal(B.safeUrl(bad), '#');
  }
});

test('pickTopics exclut les refs ignorées et comble le trou', () => {
  const list = [{ ref: 'c', rang: 3 }, { ref: 'a', rang: 1 }, { ref: 'b', rang: 2 }, { ref: 'd', rang: 4 }];
  assert.deepEqual(B.pickTopics(list, 2, ['a']).map(x => x.ref), ['b', 'c']);
  assert.deepEqual(B.pickTopics(list, 3, ['b', 'd']).map(x => x.ref), ['a', 'c']);
  assert.deepEqual(B.pickTopics(list, 3, ['a', 'b', 'c', 'd']), []);
  assert.deepEqual(B.pickTopics(list, 2).map(x => x.ref), ['a', 'b']);
});

test('lienFournil encode la ref', () => {
  assert.equal(B.lienFournil('recDemo01'), '/fournil?ref=recDemo01');
  assert.equal(B.lienFournil('a&b c'), '/fournil?ref=a%26b%20c');
});
