/* Logique pure du fournil : choix du sujet, checklist du post, aperçu dans le fil,
   variantes de brouillon et validation des chiffres reportés.
   Aucun accès au DOM, utilisable dans le navigateur (window.Fournil) et sous Node (tests). */
(function (root) {
  var MAX = 3000;
  var ACCROCHE_MAX = 120;
  var APERCU_MAX = 210;
  var LETTRE = 'a-zà-öø-ÿ';
  var PDV_FR_MOT = new RegExp('(^|[^' + LETTRE + '])(je|mon|mes)(?![' + LETTRE + '])', 'i');
  var PDV_FR_ELISION = new RegExp('(^|[^' + LETTRE + '])j[\'’]', 'i');

  function liste(v) { return Array.isArray(v) ? v : []; }
  function texteDe(v) { return typeof v === 'string' ? v : ''; }

  function trouverSujet(ref, articles, sauves) {
    if (typeof ref !== 'string' || ref === '') return null;
    var a = liste(articles).filter(function (x) { return x && x.ref === ref; })[0];
    if (a) return { article: a, origine: 'fournee' };
    var s = liste(sauves).filter(function (x) { return x && x.ref === ref; })[0];
    return s ? { article: s, origine: 'garde-manger' } : null;
  }

  function listeChoix(articles, sauves) {
    var jour = liste(articles).filter(Boolean).slice().sort(function (a, b) { return a.rang - b.rang; });
    var refs = jour.map(function (a) { return a.ref; });
    var cotes = liste(sauves).filter(function (s) { return s && refs.indexOf(s.ref) === -1; }).slice()
      .sort(function (a, b) { return String(b.savedAt || '').localeCompare(String(a.savedAt || '')); });
    return { jour: jour, cotes: cotes };
  }

  function pointDeVue(t, langue) {
    if (langue === 'en') return /\bI\b/.test(t) || /\bmy\b/i.test(t);
    return PDV_FR_MOT.test(t) || PDV_FR_ELISION.test(t);
  }

  function checklist(texte, langue) {
    var t = texteDe(texte);
    var net = t.trim();
    var premier = net.split(/\n[ \t]*\n/)[0].trim();
    return {
      accroche: premier.length > 0 && premier.length <= ACCROCHE_MAX,
      chiffre: /\d/.test(t),
      pointDeVue: pointDeVue(t, langue),
      question: /\?$/.test(net),
      longueur: t.length,
      max: MAX,
      enTrop: Math.max(0, t.length - MAX)
    };
  }

  function apercu(texte, limite) {
    var t = texteDe(texte).trim();
    var max = limite || APERCU_MAX;
    if (t.length <= max) return { texte: t, coupe: false };
    var debut = t.slice(0, max + 1);
    var esp = Math.max(debut.lastIndexOf(' '), debut.lastIndexOf('\n'));
    var coupe = esp >= max - 60 ? t.slice(0, esp) : t.slice(0, max);
    return { texte: coupe.trim(), coupe: true };
  }

  function texteModifie(texte, propose) {
    return texteDe(texte).trim() !== texteDe(propose).trim();
  }

  var TONS = ['expert', 'retour', 'provoc'];
  var LANGUES = ['fr', 'en'];
  // Gabarits des variantes générées : aucun chiffre inventé, toujours un point de vue et une question finale.
  var GABARITS = {
    expert: {
      fr: {
        accroches: ['Un sujet IA à suivre de près cette semaine.', 'Ce qui vient de changer, expliqué simplement.', 'Une info qui concerne directement les petites entreprises.'],
        intro: 'Ce que j’en retiens :',
        puces: ['Ce que ça change concrètement pour une PME.', 'Les questions à se poser avant de s’y mettre.', 'Ce qu’il vaut mieux attendre avant d’investir.'],
        questions: ['Vous avez déjà testé ce type d’outil ?', 'Qu’est-ce qui vous freine encore pour vous lancer ?', 'Quel usage voyez-vous dans votre activité ?']
      },
      en: {
        accroches: ['An AI topic worth watching this week.', 'What just changed, explained simply.', 'News that directly affects small businesses.'],
        intro: 'My take:',
        puces: ['What it changes in practice for a small business.', 'The questions to ask before getting started.', 'What is worth waiting for before investing.'],
        questions: ['Have you tried this kind of tool yet?', 'What is still holding you back?', 'Which use do you see in your business?']
      }
    },
    retour: {
      fr: {
        accroches: ['Je l’ai vu chez mes clients avant de le lire dans la presse.', 'Petit retour du terrain sur un sujet qui monte.', 'Ce sujet, je le croise tous les jours en mission.'],
        intro: 'Ce que j’ai appris avec mes clients :',
        puces: ['Le plus dur n’est pas l’outil, c’est l’habitude à changer.', 'Commencer petit rassure tout le monde.', 'Mesurer avant et après évite les débats sans fin.'],
        questions: ['Et chez vous, ça se passe comment ?', 'Vous avez vécu la même chose ?', 'Quel a été votre premier essai ?']
      },
      en: {
        accroches: ['I saw this with my clients before reading it in the news.', 'A quick field report on a rising topic.', 'I run into this topic every day on client work.'],
        intro: 'What I learned with my clients:',
        puces: ['The hard part is not the tool, it is the habit to change.', 'Starting small reassures everyone.', 'Measuring before and after avoids endless debates.'],
        questions: ['How does it go on your side?', 'Have you been through the same thing?', 'What was your first try?']
      }
    },
    provoc: {
      fr: {
        accroches: ['On en fait trop sur ce sujet. Ou pas assez.', 'Personne ne veut le dire, alors je le dis.', 'Arrêtons de faire semblant sur ce sujet.'],
        intro: 'Mon avis, sans filtre :',
        puces: ['Attendre que ce soit mûr, c’est déjà être en retard.', 'Ce ne sont pas les outils qui manquent, c’est le courage.', 'Les petites structures ont ici un vrai avantage.'],
        questions: ['Vous êtes d’accord, ou je vais trop loin ?', 'Qui ose me contredire ?', 'Battage médiatique ou vrai tournant, vous en pensez quoi ?']
      },
      en: {
        accroches: ['We overhype this topic. Or underrate it.', 'Nobody wants to say it, so I will.', 'Let us stop pretending about this topic.'],
        intro: 'My honest take:',
        puces: ['Waiting until it is mature already means being late.', 'Tools are not missing, courage is.', 'Small businesses have a real edge here.'],
        questions: ['Do you agree, or am I going too far?', 'Who dares to disagree?', 'Hype or real turning point, what do you think?']
      }
    }
  };

  function tonValide(ton) { return TONS.indexOf(ton) === -1 ? 'expert' : ton; }
  function langueValide(langue) { return LANGUES.indexOf(langue) === -1 ? 'fr' : langue; }
  function modulo(n, m) { var k = (Number(n) || 0) % m; return k < 0 ? k + m : k; }

  function pourToiSeul(v) {
    var t = texteDe(v).replace(/^\s*(pour toi|for you)\s*:\s*/i, '').trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
  }

  function brouillonGenerique(article, ton, langue, n) {
    var a = article || {};
    var g = GABARITS[tonValide(ton)][langueValide(langue)];
    var k = modulo(n, 3);
    var puces = g.puces.slice();
    var perso = pourToiSeul(a.pourToi);
    if (perso) puces[0] = perso;
    var blocs = [g.accroches[k], texteDe(a.titre).trim()];
    if (texteDe(a.resume).trim()) blocs.push(texteDe(a.resume).trim());
    blocs.push(g.intro + '\n' + puces.map(function (p) { return '→ ' + p; }).join('\n'));
    blocs.push(g.questions[k]);
    return blocs.filter(Boolean).join('\n\n');
  }

  function ecrit(ref, ton, langue, ecrits) {
    var e = ecrits && typeof ecrits === 'object' ? ecrits[ref] : null;
    var t = e && e[ton] ? e[ton][langue] : null;
    return typeof t === 'string' ? t : null;
  }

  function nbVariantes(ref, ecrits) {
    return ecrits && typeof ecrits === 'object' && ecrits[ref] ? 4 : 3;
  }

  // Pour un sujet écrit à la main : texte écrit (n = 0) puis les 3 variantes générées ; sinon les 3 générées.
  function proposerVariante(article, ton, langue, n, ecrits) {
    var a = article || {};
    var to = tonValide(ton), la = langueValide(langue);
    var main = ecrit(a.ref, to, la, ecrits);
    if (main === null) return brouillonGenerique(a, to, la, n);
    var k = modulo(n, 4);
    return k === 0 ? main : brouillonGenerique(a, to, la, k - 1);
  }

  var Fournil = {
    MAX: MAX, TONS: TONS, LANGUES: LANGUES,
    trouverSujet: trouverSujet, listeChoix: listeChoix, checklist: checklist,
    apercu: apercu, texteModifie: texteModifie,
    brouillonGenerique: brouillonGenerique, nbVariantes: nbVariantes, proposerVariante: proposerVariante
  };

  if (typeof module === 'object' && module.exports) module.exports = Fournil;
  else root.Fournil = Fournil;
})(this);
