const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../config.js');

const complet = { mode: 'reel', supabaseUrl: 'https://abc.supabase.co', supabaseCleAnon: 'cle-publique', webhookFournee: 'https://n8n.exemple.fr/webhook/file', tallyUrl: 'https://tally.so/r/RWWqKd', siteUrl: 'https://team42svp.vercel.app', delaiReseauMs: 8000 };

test('config par défaut : mode démo, aucune valeur secrète commitée', () => {
  assert.deepEqual(C.DEFAUT, { mode: 'demo', supabaseUrl: '', supabaseCleAnon: '', webhookFournee: '', tallyUrl: 'https://tally.so/r/RWWqKd', siteUrl: 'https://team42svp.vercel.app', delaiReseauMs: 8000 });
});

test('modeEffectif : démo par défaut, réel seulement si tout est rempli en https', () => {
  assert.equal(C.modeEffectif(C.DEFAUT), 'demo');
  assert.equal(C.modeEffectif(complet), 'reel');
  assert.equal(C.modeEffectif(Object.assign({}, complet, { mode: 'demo' })), 'demo');
  for (const k of ['supabaseUrl', 'supabaseCleAnon', 'webhookFournee']) {
    assert.equal(C.modeEffectif(Object.assign({}, complet, { [k]: '' })), 'demo', k);
  }
  assert.equal(C.modeEffectif(Object.assign({}, complet, { supabaseUrl: 'http://abc.supabase.co' })), 'demo');
  assert.equal(C.modeEffectif(Object.assign({}, complet, { webhookFournee: 'ftp://x' })), 'demo');
  assert.equal(C.modeEffectif(Object.assign({}, complet, { supabaseCleAnon: 42 })), 'demo');
  assert.equal(C.modeEffectif(null), 'demo');
});

test('fetchAvecDelai : passe un signal et rejette après le délai', async () => {
  let signal = null;
  const jamais = (url, o) => { signal = o.signal; return new Promise((res, rej) => { o.signal.addEventListener('abort', () => rej(new Error('abort'))); }); };
  await assert.rejects(C.fetchAvecDelai(jamais, 'https://x', { method: 'POST' }, 20));
  assert.ok(signal && signal.aborted);
});

test('fetchAvecDelai : renvoie la réponse si elle arrive à temps', async () => {
  const vite = () => Promise.resolve({ ok: true, status: 200 });
  const r = await C.fetchAvecDelai(vite, 'https://x', {}, 1000);
  assert.equal(r.status, 200);
});
