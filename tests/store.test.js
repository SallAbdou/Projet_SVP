const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../store.js');
const art = { ref: 'recA', rang: 1, titre: 'Titre A', url: 'https://a.fr', source: 'The Decoder', feu: 'vert' };
const T0 = '2026-10-30T08:00:00.000Z';

test('état initial', () => {
  assert.deepEqual(S.etatInitial(), { version: 1, sauves: [], ignores: { date: '', refs: [] }, brouillons: {}, publies: [] });
});

test('normaliserEtat répare champ par champ', () => {
  for (const raw of [null, 'x', { version: 2 }]) assert.deepEqual(S.normaliserEtat(raw), S.etatInitial());
  const e = S.normaliserEtat({ version: 1, sauves: 'non', ignores: { date: 3 }, brouillons: { recA: 'ok', recB: 4 }, publies: [] });
  assert.deepEqual(e.sauves, []);
  assert.deepEqual(e.ignores, { date: '', refs: [] });
  assert.deepEqual(e.brouillons, { recA: 'ok' });
});

test('mettre de côté, sans doublon, puis retirer', () => {
  let e = S.mettreDeCote(S.etatInitial(), art, T0);
  e = S.mettreDeCote(e, art, T0);
  assert.equal(e.sauves.length, 1);
  assert.deepEqual(e.sauves[0], { ref: 'recA', titre: 'Titre A', source: 'The Decoder', feu: 'vert', url: 'https://a.fr', savedAt: T0 });
  assert.equal(S.estDeCote(e, 'recA'), true);
  assert.equal(S.estDeCote(S.retirer(e, 'recA'), 'recA'), false);
});

test('ignorer vaut pour une seule fournée', () => {
  const e = S.ignorer(S.ignorer(S.etatInitial(), 'recA', '2026-10-30'), 'recB', '2026-10-30');
  assert.deepEqual(S.refsIgnorees(e, '2026-10-30'), ['recA', 'recB']);
  assert.deepEqual(S.refsIgnorees(e, '2026-10-31'), []);
  assert.deepEqual(S.ignorer(e, 'recC', '2026-10-31').ignores, { date: '2026-10-31', refs: ['recC'] });
});

test('brouillon, publication et chiffres', () => {
  let e = S.enregistrerBrouillon(S.etatInitial(), 'recA', 'Mon texte');
  assert.equal(e.brouillons.recA, 'Mon texte');
  e = S.publier(e, art, T0);
  assert.deepEqual(e.publies[0], { id: 'recA-' + T0, ref: 'recA', titre: 'Titre A', publieLe: T0, chiffres: null });
  const ch = { impressions: 1240, reactions: 52, republications: 7, commentaires: 9, contacts: 1 };
  e = S.saisirChiffres(e, 'recA-' + T0, ch);
  assert.deepEqual(e.publies[0].chiffres, ch);
  assert.deepEqual(S.saisirChiffres(e, 'recA-' + T0, Object.assign({}, ch, { reactions: -1 })), e);
  assert.deepEqual(S.saisirChiffres(e, 'inconnu', ch), e);
});

test('les fonctions ne mutent pas leur entrée', () => {
  const e0 = S.etatInitial();
  S.mettreDeCote(e0, art, T0);
  S.ignorer(e0, 'recA', '2026-10-30');
  S.enregistrerBrouillon(e0, 'recA', 'x');
  S.publier(e0, art, T0);
  assert.deepEqual(e0, S.etatInitial());
});

test('charger et enregistrer, y compris stockage cassé', () => {
  const mem = {};
  const st = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
  assert.deepEqual(S.charger(st), S.etatInitial());
  const e = S.mettreDeCote(S.etatInitial(), art, T0);
  assert.equal(S.enregistrer(st, e), true);
  assert.deepEqual(S.charger(st), e);
  mem['pq-store'] = '{cassé';
  assert.deepEqual(S.charger(st), S.etatInitial());
  const boom = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  assert.deepEqual(S.charger(boom), S.etatInitial());
  assert.equal(S.enregistrer(boom, e), false);
  assert.doesNotThrow(() => S.reinitialiserDemo(boom));
  mem['pq-layout'] = '1'; mem['pq-lang'] = 'en'; mem['autre'] = 'garde';
  S.reinitialiserDemo(st);
  assert.deepEqual(Object.keys(mem), ['autre']);
});

test('CLES_DEMO couvre aussi le compte et le questionnaire', () => {
  assert.ok(S.CLES_DEMO.includes('pq-auth'));
  assert.ok(S.CLES_DEMO.includes('pq-questionnaire'));
  assert.ok(S.CLES_DEMO.includes('pq-retours'));
});

test('retirerParamDemo', () => {
  assert.equal(S.retirerParamDemo('?demo=reset'), '');
  assert.equal(S.retirerParamDemo('?a=1&demo=reset&b=2'), '?a=1&b=2');
  assert.equal(S.retirerParamDemo('?demo=autre'), null);
  assert.equal(S.retirerParamDemo(''), null);
});

test('desIgnorer annule un ignorer du jour, sans toucher aux autres dates', () => {
  let e = S.ignorer(S.etatInitial(), 'recA', '2026-11-17');
  e = S.ignorer(e, 'recB', '2026-11-17');
  const avant = JSON.stringify(e);
  assert.deepEqual(S.refsIgnorees(S.desIgnorer(e, 'recA', '2026-11-17'), '2026-11-17'), ['recB']);
  assert.equal(JSON.stringify(e), avant, 'entrée non mutée');
  assert.deepEqual(S.refsIgnorees(S.desIgnorer(e, 'recA', '2026-11-18'), '2026-11-17'), ['recA', 'recB']);
  assert.deepEqual(S.refsIgnorees(S.desIgnorer(e, 'inconnu', '2026-11-17'), '2026-11-17'), ['recA', 'recB']);
});

test('dateDuJour au format YYYY-MM-DD, heure locale', () => {
  assert.equal(S.dateDuJour(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.equal(S.dateDuJour(new Date(2026, 10, 17, 0, 1)), '2026-11-17');
});

test('remettre restaure l\'article d\'origine, sans doublon', () => {
  const avecA = S.mettreDeCote(S.etatInitial(), art, T0);
  const original = avecA.sauves[0];
  const vide = S.retirer(avecA, 'recA');
  const avant = JSON.stringify(vide);
  const remis = S.remettre(vide, original);
  assert.deepEqual(remis.sauves, [original]);
  assert.equal(remis.sauves[0].savedAt, T0);
  assert.equal(JSON.stringify(vide), avant, 'entrée non mutée');
  assert.equal(S.remettre(remis, original).sauves.length, 1);
  assert.equal(S.remettre(vide, { titre: 'sans ref' }).sauves.length, 0);
});
