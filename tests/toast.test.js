const test = require('node:test');
const assert = require('node:assert/strict');
const { BentoUI } = require('../bento-ui.js');

// Faux élément : enregistre les écouteurs pour les déclencher à la main.
function fauxEl() {
  const ec = {};
  return {
    ec,
    addEventListener(type, fn) { (ec[type] = ec[type] || []).push(fn); },
    contains(x) { return x === this.enfant; },
    enfant: {},
    emettre(type, e) { (ec[type] || []).forEach(fn => fn(Object.assign({ preventDefault() {} }, e || {}))); }
  };
}
function journal() {
  const j = [];
  return { j, f: { pause: () => j.push('pause'), reprise: () => j.push('reprise'), echap: () => j.push('echap') } };
}

// Lot 24 (N5, 2.2.1) : le délai du message est suspendu au survol comme au focus.
test('toast : survol suspend le délai, sortie le reprend', () => {
  const el = fauxEl(), { j, f } = journal();
  BentoUI.suivreToast(el, f);
  el.emettre('mouseenter');
  el.emettre('mouseleave');
  assert.deepEqual(j, ['pause', 'reprise']);
});

test('toast : souris sortie mais focus dedans, le délai reste suspendu', () => {
  const el = fauxEl(), { j, f } = journal();
  BentoUI.suivreToast(el, f);
  el.emettre('focusin');
  el.emettre('mouseenter');
  el.emettre('mouseleave');
  assert.deepEqual(j.filter(x => x === 'reprise'), []);
  el.emettre('focusout', { relatedTarget: null });
  assert.equal(j[j.length - 1], 'reprise');
});

test('toast : focus sorti mais souris dessus, le délai reste suspendu', () => {
  const el = fauxEl(), { j, f } = journal();
  BentoUI.suivreToast(el, f);
  el.emettre('mouseenter');
  el.emettre('focusin');
  el.emettre('focusout', { relatedTarget: null });
  assert.deepEqual(j.filter(x => x === 'reprise'), []);
});
