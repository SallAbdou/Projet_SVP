/* Règles du questionnaire d'inscription (repris du Tally « Souscription à la Newsletter »).
   Les textes des choix sont ceux du Tally, mot pour mot : n8n (WF2, WF4) en reconnaît certains.
   Logique pure, testée sous Node ; brouillon gardé en localStorage sous « pq-questionnaire ». */
(function (root) {
  var CHOIX = {
    metiers: ['Entrepreneur', 'Consultant', 'Influenceur', 'Formateur', 'Étudiant', 'Autre'],
    thematiques: ['LLMs', 'Vidéo', 'Image', 'Automatisation et agents', 'Cybersécurité', 'Actualité des grandes firmes',
      'Monétisation', 'Finance et spéculation', 'Hardware', 'IA en entreprise', 'Ecosystèmes', 'Ingénierie R&D'],
    relations: ['Timide', 'En couple', 'Marié'],
    langues: ['Je veux des sources françaises uniquement', 'Je veux des sources polyglottes avec une traduction française', 'English all the way']
  };
  var NB_ETAPES = 6;
  var CLE_BROUILLON = 'pq-questionnaire';
  var NEWS = { 'Timide': 3, 'En couple': 5, 'Marié': 7 };

  function estObjet(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function texte(v) { return typeof v === 'string' ? v : ''; }
  function chaines(v) { return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }) : []; }

  // Même règle que Auth.emailValide (copiée pour que ce fichier reste testable seul).
  function emailValide(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function reponsesVides() {
    return { prenom: '', email: '', metiers: [], thematiques: [], relation: '', langue: '', newsletter: false, rgpd: false };
  }

  function plusieurs(liste, valeurs) {
    var v = chaines(valeurs);
    if (!v.length) return 'requis';
    return v.every(function (x) { return liste.indexOf(x) !== -1; }) ? null : 'inconnu';
  }

  function un(liste, valeur) {
    if (!texte(valeur)) return 'requis';
    return liste.indexOf(valeur) !== -1 ? null : 'inconnu';
  }

  function etapeValide(n, r) {
    var rep = estObjet(r) ? r : {};
    var erreurs = {};
    function noter(champ, code) { if (code) erreurs[champ] = code; }
    if (n === 1) {
      noter('prenom', texte(rep.prenom).trim() ? null : 'requis');
      noter('email', !texte(rep.email).trim() ? 'requis' : (emailValide(rep.email) ? null : 'invalide'));
    } else if (n === 2) noter('metiers', plusieurs(CHOIX.metiers, rep.metiers));
    else if (n === 3) noter('thematiques', plusieurs(CHOIX.thematiques, rep.thematiques));
    else if (n === 4) noter('relation', un(CHOIX.relations, rep.relation));
    else if (n === 5) noter('langue', un(CHOIX.langues, rep.langue));
    else if (n === 6) {
      noter('newsletter', rep.newsletter === true ? null : 'requis');
      noter('rgpd', rep.rgpd === true ? null : 'requis');
    } else return { ok: false, erreurs: { etape: 'inconnue' } };
    return { ok: Object.keys(erreurs).length === 0, erreurs: erreurs };
  }

  function nombreDeNews(relation) { return NEWS[relation] || 5; }

  function profilDepuis(r) {
    return {
      prenom: texte(r.prenom).trim(), email: texte(r.email).trim(),
      metiers: chaines(r.metiers), thematiques: chaines(r.thematiques), relation: texte(r.relation), langue: texte(r.langue)
    };
  }

  function normaliserReponses(raw) {
    var r = reponsesVides();
    if (!estObjet(raw)) return r;
    r.prenom = texte(raw.prenom); r.email = texte(raw.email);
    r.metiers = chaines(raw.metiers); r.thematiques = chaines(raw.thematiques);
    r.relation = texte(raw.relation); r.langue = texte(raw.langue);
    r.newsletter = raw.newsletter === true; r.rgpd = raw.rgpd === true;
    return r;
  }

  function chargerBrouillon(storage) {
    var vide = { etape: 1, reponses: reponsesVides() };
    try {
      var raw = JSON.parse(storage.getItem(CLE_BROUILLON));
      if (!estObjet(raw)) return vide;
      var etape = typeof raw.etape === 'number' && raw.etape % 1 === 0 && raw.etape >= 1 && raw.etape <= NB_ETAPES ? raw.etape : 1;
      return { etape: etape, reponses: normaliserReponses(raw.reponses) };
    } catch (err) {
      return vide;
    }
  }

  function enregistrerBrouillon(storage, brouillon) {
    try {
      storage.setItem(CLE_BROUILLON, JSON.stringify(brouillon));
      return true;
    } catch (err) {
      return false;
    }
  }

  function effacerBrouillon(storage) {
    try { storage.removeItem(CLE_BROUILLON); } catch (err) {}
  }

  // Libellés anglais des choix : affichage seulement, la valeur enregistrée reste le texte du Tally.
  var LIBELLES_EN = {
    'Entrepreneur': 'Entrepreneur', 'Consultant': 'Consultant', 'Influenceur': 'Influencer', 'Formateur': 'Trainer', 'Étudiant': 'Student', 'Autre': 'Other',
    'LLMs': 'LLMs', 'Vidéo': 'Video', 'Image': 'Image', 'Automatisation et agents': 'Automation and agents', 'Cybersécurité': 'Cybersecurity',
    'Actualité des grandes firmes': 'Big tech news', 'Monétisation': 'Monetisation', 'Finance et spéculation': 'Finance and speculation',
    'Hardware': 'Hardware', 'IA en entreprise': 'AI at work', 'Ecosystèmes': 'Ecosystems', 'Ingénierie R&D': 'R&D engineering',
    'Timide': 'Shy', 'En couple': 'In a relationship', 'Marié': 'Married',
    'Je veux des sources françaises uniquement': 'French sources only',
    'Je veux des sources polyglottes avec une traduction française': 'Sources in every language, translated into French',
    'English all the way': 'English all the way'
  };

  function libelle(valeur, lang) {
    return lang === 'en' && Object.prototype.hasOwnProperty.call(LIBELLES_EN, valeur) ? LIBELLES_EN[valeur] : valeur;
  }

  var Questionnaire = {
    CHOIX: CHOIX, NB_ETAPES: NB_ETAPES, CLE_BROUILLON: CLE_BROUILLON, LIBELLES_EN: LIBELLES_EN, libelle: libelle,
    reponsesVides: reponsesVides, etapeValide: etapeValide, nombreDeNews: nombreDeNews, profilDepuis: profilDepuis,
    chargerBrouillon: chargerBrouillon, enregistrerBrouillon: enregistrerBrouillon, effacerBrouillon: effacerBrouillon
  };

  if (typeof module === 'object' && module.exports) module.exports = Questionnaire;
  else root.Questionnaire = Questionnaire;
})(this);
