const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Accueil (étapes, aperçu en ticket, Miette, FAQ et chat de la démo) et Découvrir (coupure du chapo).
const RACINE = path.join(__dirname, '..');

function lire(page) {
  // Fins de ligne ramenées à LF : une copie Windows (core.autocrlf) ne doit pas casser les comparaisons.
  const html = fs.readFileSync(path.join(RACINE, page), 'utf8').replace(/\r\n/g, '\n');
  const tpl = html.split('<script type="text/plain" id="tpl">')[1].split('</script>')[0];
  const objet = html.split('var T = ')[1].split('\nclass Component')[0].trim().replace(/;$/, '');
  return { tpl, T: vm.runInNewContext('(' + objet + ')') };
}

test('accueil : étape 3 relue (lot 38), en FR comme en EN', () => {
  const { T } = lire('index.html');
  assert.equal(T.fr.etapes[2][1], 'Tu pétris la news en post LinkedIn (quelques minutes seulement), tu choisis le ton donné à ton texte et ton style d’écriture. Valide la publication et suis les réactions.');
  assert.equal(T.en.etapes[2][1], 'Knead the story into a LinkedIn post (just a few minutes), pick the tone of your text and your writing style. Approve the post and follow the reactions.');
});

// Lot 38 : l'encart final garde son titre et son bouton, avec le four du comptoir (décoratif) à côté.
function symbole(h, id) {
  const m = h.match(new RegExp('<symbol id="' + id + '"[^>]*>([\\s\\S]*?)</symbol>'));
  assert.ok(m, 'symbole ' + id);
  return m[1];
}

test('accueil : encart final avec le four du comptoir, décoratif, en version animée et figée (lot 38)', () => {
  const { tpl } = lire('index.html');
  const comptoir = fs.readFileSync(path.join(RACINE, 'comptoir.html'), 'utf8').replace(/\r\n/g, '\n');
  const fin = tpl.match(/<section class="fin" aria-labelledby="fin-t">([\s\S]*?)<\/section>/);
  assert.ok(fin, 'section .fin');
  const f = fin[1];
  // Même dessin que le comptoir, animé comme figé.
  for (const id of ['pq-four', 'pq-four-fige']) assert.equal(symbole(tpl, id), symbole(comptoir, id), id);
  assert.match(f, /<div class="fin-four" aria-hidden="true"><svg class="four-svg four-svg-anime" viewBox="0 0 200 170" aria-hidden="true" focusable="false"><use href="#pq-four"><\/use><\/svg><svg class="four-svg four-svg-fixe" viewBox="0 0 200 170" aria-hidden="true" focusable="false"><use href="#pq-four-fige"><\/use><\/svg><\/div>/);
  assert.equal((tpl.match(/<use href="#pq-four"/g) || []).length, 1, 'aucun four animé sans jumeau figé');
  // Titre et bouton dans le même bloc, sans style en ligne qui les décalerait.
  assert.match(f, /<div class="fin-texte">\s*<h2 id="fin-t" class="section-titre">\{\{t\.finTitre\}\}<\/h2>\s*<a class="bouton" href="\{\{ctaHref\}\}">\{\{ctaLabel\}\}<\/a>\s*<\/div>/);
  assert.doesNotMatch(f.replace(/<svg width="0"[\s\S]*?<\/svg>/, ''), /style="/, 'hors des symboles du four');
  assert.equal(lire('index.html').T.fr.finTitre, 'Ta première fournée est à 2 minutes');
  // Bascule animé / figé comme au comptoir (lot 24 bis), et empilement sur mobile.
  const css = fs.readFileSync(path.join(RACINE, 'parcours.css'), 'utf8');
  assert.match(css, /\.four-vapeur-fixe\{[^}]*opacity:\.8/);
  assert.ok(css.indexOf('.four-svg-fixe{display:none}') > css.indexOf('.four-svg{'), 'règle placée après .four-svg');
  assert.match(css, /html\[data-animations="off"\] \.four-svg-anime\{display:none\}html\[data-animations="off"\] \.four-svg-fixe\{display:block\}/);
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{html:not\(\[data-animations="on"\]\) \.four-svg-anime\{display:none\}html:not\(\[data-animations="on"\]\) \.four-svg-fixe\{display:block\}/);
  assert.match(css, /\.fin\{[^}]*display:flex/);
  assert.match(css, /@media \(max-width:640px\)\{[^@]*\.fin\{[^}]*flex-direction:column/);
});

test('accueil : titre relu, sans « Chaque matin », fin de titre insécable (lot 27)', () => {
  const html = fs.readFileSync(path.join(RACINE, 'index.html'), 'utf8');
  const { T } = lire('index.html');
  assert.equal(T.fr.promesse, 'L’actu IA qui compte pour ton métier, prête à pétrir en post LinkedIn tout\u00a0chaud.');
  assert.equal(T.en.promesse, 'The AI news that matters for your job, ready to knead into a piping hot LinkedIn\u00a0post.');
  assert.match(html, /<meta name="description" content="L'actu IA qui compte pour ton métier, prête à pétrir en post LinkedIn tout chaud\.">/);
  assert.ok(!/chaque matin/i.test(html.split('<script type="text/plain"')[0]), 'plus de « Chaque matin » dans l’en-tête');
});

test('accueil : le chapo passe à la ligne par le gabarit, pas par la chaîne traduite (lot 27)', () => {
  const { tpl, T } = lire('index.html');
  assert.match(tpl, /<p class="chapo">\{\{t\.chapo\}\}<br>\{\{t\.chapoSuite\}\}<\/p>/);
  assert.equal(T.fr.chapo, 'Tu choisis tes thèmes et ton niveau avec l’IA.');
  assert.equal(T.fr.chapoSuite, 'On sélectionne, on note et on résume pour toi les meilleures news IA du jour, avec l’angle le plus pertinent pour faire réagir tes clients.');
  assert.equal(T.en.chapo, 'Pick your topics and your level with AI.');
  assert.equal(T.en.chapoSuite, 'We select, rate and sum up the best AI news of the day for you, with the most relevant angle to get your clients reacting.');
  for (const lang of ['fr', 'en']) assert.ok(!/<|>/.test(T[lang].chapo + T[lang].chapoSuite), lang);
});

test('accueil : « Confidentialité » est un vrai lien dans la FAQ, même texte que pour Miette (lot 27)', () => {
  const { tpl, T } = lire('index.html');
  assert.match(tpl, /<details class="faq-item" data-id="donnees"[^>]*>[\s\S]*?<p>\{\{t\.donneesAvant\}\}<a class="lien-texte" href="\/confidentialite">\{\{t\.confidentialite\}\}<\/a>\{\{t\.donneesApres\}\}<\/p><\/details>/);
  for (const lang of ['fr', 'en']) {
    const t = T[lang];
    const faq = Object.fromEntries(t.faq.map(f => [f[0], f]));
    assert.equal(t.donneesAvant + t.confidentialite + t.donneesApres, faq.donnees[2], lang);
    assert.equal(t.faq[t.faq.length - 1][0], 'donnees', lang + ' : rendue après la liste, elle doit rester la dernière');
  }
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
    for (const [id, q, rep] of T[lang].faq) {
      const paras = [].concat(rep);
      assert.ok(paras.length <= 2, lang + ' ' + id + ' : le gabarit prévoit deux paragraphes au plus');
      const r = paras.join(' ');
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
  assert.deepEqual(textes.slice(1), [faq.score[1], faq.score[2], faq.sources[1], [].concat(faq.sources[2]).join(' ')]);
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
