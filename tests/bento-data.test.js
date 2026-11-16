const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const B = require('../bento.js');
const t = (state, d, p, o, extra) => Object.assign({ state, scores: { durability: d, propensity: p, offer: o } }, extra);

test('helpers de score et de sélection', () => {
  const list = [t('stale', 2, 2, 1, { id: 'a' }), t('knead', 4, 3, 3, { id: 'b' }), t('hot', 4, 5, 4, { id: 'c' }), t('hot', 4, 3, 3, { id: 'd' })];
  assert.equal(B.totalScore(list[2]), 13);
  assert.deepEqual(B.pickTopics(list, 3).map(x => x.id), ['c', 'b', 'd']);
  assert.equal(B.pickTopics(list, 7).length, 4);
  assert.equal(B.topTopic(list).id, 'c');
  assert.equal(B.topTopic([t('knead', 1, 1, 1, { id: 'k' })]).id, 'k');
  assert.equal(B.topTopic([]), null);
  assert.deepEqual(B.countStates(list), { hot: 2, knead: 1, stale: 1 });
  assert.equal(B.leftover(list), null);
  assert.equal(B.leftover([t('stale', 1, 1, 1, { id: 's', newAngle: { fr: 'x', en: 'x' } })]).id, 's');
});

test('safeUrl', () => {
  assert.equal(B.safeUrl('https://the-decoder.com/a'), 'https://the-decoder.com/a');
  assert.equal(B.safeUrl('http://x.org'), 'http://x.org');
  for (const bad of ['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,x', '', null, undefined, 42]) {
    assert.equal(B.safeUrl(bad), '#');
  }
});

test('data/fournee.json respecte le contrat', () => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'fournee.json'), 'utf8'));
  const both = v => Boolean(v && typeof v.fr === 'string' && v.fr && typeof v.en === 'string' && v.en);
  const states = ['hot', 'knead', 'stale'];
  assert.equal(data.version, 1);
  assert.match(data.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(data.topics.length, 7);
  assert.equal(new Set(data.topics.map(x => x.id)).size, 7);
  for (const s of data.topics) {
    assert.ok(states.includes(s.state), s.id);
    assert.ok([1, 2].includes(s.axis), s.id);
    assert.ok(both(s.title) && both(s.summary) && both(s.forYou), s.id);
    assert.notEqual(B.safeUrl(s.url), '#', s.id);
    for (const k of ['durability', 'propensity', 'offer']) assert.ok(Number.isInteger(s.scores[k]) && s.scores[k] >= 0 && s.scores[k] <= 5, s.id + ' ' + k);
    if (s.state === 'stale') assert.ok(both(s.newAngle), s.id);
  }
  const c = B.countStates(data.topics);
  assert.ok(c.hot >= 2 && c.knead >= 2 && c.stale >= 2);
  assert.equal(data.posts.length, 6);
  for (const p of data.posts) assert.ok(both(p.label) && Number.isInteger(p.impressions) && states.includes(p.state));
  assert.equal(data.pantry.length, 4);
  for (const p of data.pantry) assert.ok(both(p.title) && Number.isInteger(p.savedDaysAgo) && states.includes(p.state));
  assert.ok(both(data.profile.role) && data.profile.axes.length === 2 && data.profile.sources.length >= 3);
});

test('isValidData refuse un JSON valide mais incomplet', () => {
  const ok = { version: 1, date: '2026-10-30', topics: [], posts: [], pantry: [], profile: { name: 'L', axes: [], sources: [] } };
  assert.equal(B.isValidData(ok), true);
  assert.equal(B.isValidData(null), false);
  assert.equal(B.isValidData([]), false);
  for (const k of ['topics', 'posts', 'pantry']) assert.equal(B.isValidData(Object.assign({}, ok, { [k]: undefined })), false, k);
  assert.equal(B.isValidData(Object.assign({}, ok, { profile: { name: 'L' } })), false);
  assert.equal(B.isValidData(Object.assign({}, ok, { date: 'hier' })), false);
});
