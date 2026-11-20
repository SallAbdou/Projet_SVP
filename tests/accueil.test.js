const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Accueil (étapes, aperçu en ticket, Miette, FAQ et chat de la démo) et Découvrir (coupure du chapo).
const RACINE = path.join(__dirname, '..');

function lire(page) {
  const html = fs.readFileSync(path.join(RACINE, page), 'utf8');
  const tpl = html.split('<script type="text/plain" id="tpl">')[1].split('</script>')[0];
  const objet = html.split('var T = ')[1].split('\nclass Component')[0].trim().replace(/;$/, '');
  return { tpl, T: vm.runInNewContext('(' + objet + ')') };
}

test('accueil : étape 3 sans virgule avant « et tu suis », en FR comme en EN', () => {
  const { T } = lire('index.html');
  assert.equal(T.fr.etapes[2][1], 'Tu pétris la news en post LinkedIn en quelques minutes et tu suis ce qu’il rapporte.');
  assert.equal(T.en.etapes[2][1], 'Knead the story into a LinkedIn post in minutes and track what it brings in.');
});

test('accueil : l’aperçu en ticket montre les 3 premières news, classées, avec état et score', () => {
  const { tpl, T } = lire('index.html');
  assert.ok(!tpl.includes('mini-bento'), 'l’ancien aperçu en tuiles a été remplacé par le ticket');
  assert.match(tpl, /<ol class="ticket-liste">[\s\S]*<sc-for list="\{\{apercu\}\}"/);
  for (const lang of ['fr', 'en']) {
    const a = T[lang].apercu;
    assert.equal(a.length, 3, lang);
    for (const [titre, source, etat, score] of a) {
      assert.ok(titre && source, lang);
      assert.ok(T[lang].etats[etat], lang + ' : état inconnu ' + etat);
      assert.ok(Number.isInteger(score) && score >= 3 && score <= 15, lang + ' : score ' + score);
    }
    const scores = a.map(x => x[3]);
    assert.deepEqual(scores, scores.slice().sort((x, y) => y - x), lang + ' : classées de la mieux notée à la moins bien notée');
  }
});

test('accueil : les news de l’aperçu reprennent la fournée de démo (titre, source, score)', () => {
  const { T } = lire('index.html');
  const fournee = JSON.parse(fs.readFileSync(path.join(RACINE, 'data', 'fournee.json'), 'utf8')).articles;
  T.fr.apercu.forEach(([titre, source, , score], i) => {
    const art = fournee[i];
    assert.equal(titre, art.titre);
    assert.equal(source, art.source);
    assert.equal(score, art.durabilite + art.propension + art.lienOffre);
  });
});

test('accueil : Miette est décrite une fois, ses autres apparitions sont décoratives', () => {
  const { tpl, T } = lire('index.html');
  const svgs = tpl.match(/<svg class="miette[^"]*"[^>]*>/g);
  assert.equal(svgs.length, 3);
  assert.equal(svgs.filter(x => /role="img" aria-label="\{\{t\.mietteAlt\}\}"/.test(x)).length, 1);
  assert.equal(svgs.filter(x => /aria-hidden="true"/.test(x)).length, 2);
  assert.match(T.fr.mietteAlt, /Miette/);
  assert.match(T.en.mietteAlt, /Miette/);
});

test('accueil : la FAQ a les mêmes questions en FR et en EN, toutes renseignées', () => {
  const { tpl, T } = lire('index.html');
  assert.match(tpl, /<section id="faq"[^>]*aria-labelledby="faq-t"/);
  assert.match(tpl, /<details class="faq-item"[^>]*><summary>\{\{f\.q\}\}/);
  assert.deepEqual(T.fr.faq.map(f => f[0]), T.en.faq.map(f => f[0]));
  for (const lang of ['fr', 'en']) {
    for (const [id, q, r] of T[lang].faq) {
      assert.ok(id && q.endsWith('?') && r.length > 20, lang + ' ' + id);
      assert.ok(!/\[|À COMPLÉTER|TODO/i.test(q + r), lang + ' ' + id + ' : réponse provisoire');
    }
  }
});

test('accueil : le chat est un dialogue étiqueté, fermable, sans saisie libre, et le dit', () => {
  const { tpl, T } = lire('index.html');
  const chat = tpl.split('<section id="chat"')[1].split('</section>')[0];
  assert.match('<section id="chat"' + chat, /role="dialog" aria-labelledby="chat-t" aria-describedby="chat-d"/);
  assert.match(chat, /class="chat-fermer"[^>]*aria-label="\{\{t\.chatFermer\}\}"/);
  assert.ok(!/<input|<textarea/.test(chat), 'pas de champ libre : Miette ne répond qu’aux questions de la FAQ');
  assert.match(tpl, /class="chat-lanceur"[^>]*aria-expanded="\{\{chatOuvert\}\}"/);
  assert.match(T.fr.chatNote, /^Démo : /);
  assert.match(T.en.chatNote, /^Demo: /);
});

test('accueil : chaque réponse du chat est celle de la FAQ', () => {
  const html = fs.readFileSync(path.join(RACINE, 'index.html'), 'utf8');
  const script = html.split('<script src="/dc.js"></script><script>')[1].split('</script>')[0];
  const ctx = { Auth: { utilisateurCourant: () => null }, Parcours: {} };
  vm.runInNewContext('class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(s) { Object.assign(this.state, s); } }\n' + script + '\nthis.Component = Component; this.T = T;', ctx);
  const c = new ctx.Component({});
  c.poser('score');
  c.poser('sources');
  const v = c.renderVals();
  const textes = Array.from(v.messages, m => String(m.texte));
  const faq = Object.fromEntries(ctx.T.fr.faq.map(f => [f[0], f]));
  assert.deepEqual(textes.slice(1), [faq.score[1], faq.score[2], faq.sources[1], faq.sources[2]]);
  assert.ok(!v.suggestions.some(s => s.id === 'score' || s.id === 'sources'), 'une question posée n’est plus proposée');
  assert.ok(v.suggestions.length <= 4);
});

test('Découvrir : la liste du chapo passe à la ligne d’un seul tenant', () => {
  const { tpl, T } = lire('decouvrir.html');
  assert.match(tpl, /<p class="chapo">\{\{t\.chapoDebut\}\} <span class="groupe">\{\{t\.chapoListe\}\}<\/span><\/p>/);
  assert.equal(T.fr.chapoDebut + ' ' + T.fr.chapoListe, '2 minutes pour la régler à ton goût : ton métier, tes thèmes, ton niveau.');
  assert.equal(T.en.chapoDebut + ' ' + T.en.chapoListe, '2 minutes to make it just the way you like: your job, your topics, your level.');
  assert.ok(!/<|>/.test(T.fr.chapoListe + T.en.chapoListe), 'pas de balise dans les chaînes traduites');
  const css = fs.readFileSync(path.join(RACINE, 'parcours.css'), 'utf8');
  assert.match(css, /\.groupe\{display:inline-block\}/);
});
