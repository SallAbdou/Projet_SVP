const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../boot.js');

test('une valeur de liste contenant {{...}} n est jamais réinterprétée', () => {
  const s = B.remplirGabarit('<sc-for list="{{l}}" as="x"><i>{{x.t}}</i></sc-for><b>{{a}}</b>', { l: [{ t: '{{a}}' }, { t: '{{t.title}}' }], a: 'A' });
  assert.ok(!s.includes('<i>A</i>'));
  assert.ok(s.includes('<i>&#123;&#123;a&#125;&#125;</i>'));
  assert.ok(s.includes('<i>&#123;&#123;t.title&#125;&#125;</i>'));
  assert.ok(s.includes('<b>A</b>'));
});

test('événements et échappement inchangés', () => {
  const s = B.remplirGabarit('<button onClick="{{f}}">{{a}}</button><sc-for list="{{l}}" as="x"><i title="{{x.t}}">{{x.t}}</i></sc-for>', { f: function () {}, a: '<"&>', l: [{ t: '<b>"x"</b>' }] });
  assert.ok(s.includes('data-ev="click:f"'));
  assert.ok(s.includes('&lt;&quot;&amp;&gt;'));
  assert.ok(s.includes('<i title="&lt;b&gt;&quot;x&quot;&lt;/b&gt;">'));
});

test('valeur de premier niveau contenant {{...}} affichée telle quelle', () => {
  assert.equal(B.remplirGabarit('<p>{{a}}</p>{{b}}', { a: '{{b}}', b: 'B' }), '<p>{{b}}</p>B');
});

test('titre de page selon la langue', () => {
  assert.equal(B.titrePage('en', 'A', 'B'), 'B');
  assert.equal(B.titrePage('fr', 'A', 'B'), 'A');
  assert.equal(B.titrePage('en', 'A', ''), 'A');
  assert.equal(B.titrePage('en', 'A', null), 'A');
});
