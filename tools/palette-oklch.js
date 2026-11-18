// Générateur de la palette du lot 14 : chaque couleur est décrite en OKLCH (luminosité L, chroma C,
// teinte H) puis convertie en hex sRGB pour charte.css. Une famille garde sa teinte et sa chroma,
// seule la luminosité avance par pas réguliers : les rampes paraissent égales à l'œil.
// Usage : node tools/palette-oklch.js   (affiche les déclarations à recopier dans charte.css)
// Le site ne charge pas ce fichier : les hex restent écrits en clair dans la charte.

function versSrgb(x) { return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; }
function oklchVersRvb(L, C, H) {
  var h = H * Math.PI / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  var l = L + 0.3963377774 * a + 0.2158037573 * b, m = L - 0.1055613458 * a - 0.0638541728 * b, s = L - 0.0894841775 * a - 1.2914855480 * b;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s].map(versSrgb);
}
// Hors gamut sRGB : on réduit la chroma jusqu'à rentrer, sans toucher luminosité ni teinte.
function hex(L, C, H) {
  var c = C, rvb;
  for (;;) {
    rvb = oklchVersRvb(L, c, H);
    if (rvb.every(function (v) { return v >= -0.0005 && v <= 1.0005; }) || c <= 0) break;
    c -= 0.002;
  }
  return '#' + rvb.map(function (v) { var n = Math.round(Math.min(1, Math.max(0, v)) * 255); return (n < 16 ? '0' : '') + n.toString(16).toUpperCase(); }).join('');
}

// Teintes de famille.
var FARINE = 75, MIE = 80, BRUN = 50, BRONZE = 50, OR = 82, PATINE = 185, CENDRE = 245, VERT = 145, ROUGE = 30;

var BRONZE_THEME = {
  // Farine et mie : fonds et traits.
  fond: [.958, .016, FARINE], creme: [.985, .010, MIE], sable: [.928, .026, FARINE - 3], miel: [.936, .038, OR - 4],
  trait: [.935, .018, FARINE - 3], bord: [.878, .030, FARINE - 5], 'bord-fort': [.745, .058, 65],
  // Brun : textes.
  texte: [.235, .035, BRUN - 5], 'texte-2': [.335, .045, BRUN - 2], doux: [.445, .045, BRUN + 2],
  brun: [.475, .100, BRONZE], 'brun-fonce': [.335, .055, BRUN - 2],
  // Bronze cuivré : l'accent unique des actions.
  dore: [.515, .125, BRONZE - 2], 'sur-titre': [.485, .105, BRONZE], cuivre: [.545, .110, BRONZE + 8],
  braise: [.515, .125, BRONZE - 2], 'braise-fonce': [.440, .110, BRONZE - 5], focus: [.515, .125, BRONZE - 2],
  // Statuts.
  ok: [.430, .085, VERT], 'ok-fond': [.930, .040, VERT - 5], erreur: [.430, .130, ROUGE], 'erreur-fond': [.930, .035, ROUGE + 5],
  // Or : Maillard du n°1, croûte de Tout chaud, À pétrir, pain.
  'or-haut': [.925, .065, OR + 3], 'or-milieu': [.865, .085, OR - 2], 'or-bas': [.805, .095, OR - 7],
  'braise-vive': [.655, .145, 55], croute: [.825, .130, OR - 4], 'chaud-texte': [.240, .050, BRUN],
  'petrir-fond': [.925, .060, OR], 'petrir-texte': [.430, .090, 58], 'barre-petrir': [.640, .120, 70],
  eclair: [.760, .140, OR - 4],
  'pain-haut': [.830, .100, FARINE], 'pain-bas': [.645, .110, 62], 'pain-grigne': [.935, .055, OR + 3], 'pain-texte': [.225, .040, BRUN],
  // Surfaces du n°1, fixes dans tous les thèmes puisque le doré l'est aussi.
  'or-texte': [.235, .035, BRUN - 5], 'or-texte-2': [.335, .045, BRUN - 2], 'or-brun': [.380, .085, BRUN],
  'or-surface': [.975, .025, OR + 3], 'or-sur-plein': [.985, .010, MIE], 'or-bord': [.600, .110, 68],
  'or-source': [.450, .048, PATINE], 'or-source-fonce': [.380, .042, PATINE],
  // Patine : « Lire la source ».
  source: [.450, .048, PATINE], 'source-fonce': [.380, .042, PATINE],
  // Cendre : Rassis, froid et éteint.
  'rassis-fond': [.370, .014, CENDRE], 'rassis-texte': [.975, .006, CENDRE],
  'barre-rassis': [.840, .010, CENDRE], 'barre-rassis-contour': [.560, .014, CENDRE],
  // Surfaces et panneaux.
  'sur-plein': [.985, .010, MIE], 'sur-clair': [.225, .040, BRUN], champ: [.995, .004, MIE], 'bord-champ': [.555, .050, 60],
  'etiquette-fond': [.335, .045, BRUN - 2], 'etiquette-texte': [.945, .020, FARINE],
  panneau: [.255, .035, BRUN - 5], 'panneau-texte': [.955, .016, FARINE], 'panneau-doux': [.900, .022, FARINE - 3],
  'panneau-or': [.860, .095, OR - 2],
  // Teinte des ombres et voiles : brun profond plutôt que gris.
  'ombre-teinte': [.280, .050, BRUN - 5]
};

var NUIT = {
  fond: [.170, .014, 55], creme: [.210, .018, 55], sable: [.245, .020, 58], miel: [.270, .026, 65], trait: [.265, .020, 58],
  bord: [.345, .030, 58], 'bord-fort': [.470, .045, 62],
  texte: [.945, .020, FARINE], 'texte-2': [.885, .026, FARINE - 3], doux: [.800, .035, 70],
  brun: [.790, .090, 65], 'brun-fonce': [.880, .060, 75], dore: [.730, .125, 52], 'sur-titre': [.790, .100, 62], cuivre: [.720, .090, 62],
  ok: [.830, .090, VERT], 'ok-fond': [.285, .040, VERT], erreur: [.790, .090, ROUGE], 'erreur-fond': [.285, .050, ROUGE],
  braise: [.730, .125, 52], 'braise-fonce': [.790, .100, 58],
  source: [.760, .060, PATINE], 'source-fonce': [.820, .050, PATINE],
  'barre-rassis-contour': [.640, .014, CENDRE],
  'sur-plein': [.170, .014, 55], champ: [.140, .012, 55], 'bord-champ': [.610, .045, 65],
  'etiquette-fond': [.385, .050, BRUN], 'etiquette-texte': [.945, .020, FARINE], focus: [.820, .110, 75],
  panneau: [.300, .030, BRUN], 'panneau-texte': [.945, .020, FARINE], 'panneau-doux': [.885, .026, FARINE - 3],
  'panneau-or': [.860, .095, OR - 2], 'ombre-teinte': [.080, .010, 55]
};

// Contraste élevé : seule la source change (patine très foncée), le reste est écrit à la main dans la charte.
var CONTRASTE = { source: [.320, .055, PATINE], 'source-fonce': [.250, .045, PATINE] };

function enHex(spec) { var r = {}; Object.keys(spec).forEach(function (k) { r[k] = hex(spec[k][0], spec[k][1], spec[k][2]); }); return r; }
var Palette = { hex: hex, bronze: enHex(BRONZE_THEME), nuit: enHex(NUIT), contraste: enHex(CONTRASTE) };
if (typeof module === 'object' && module.exports) module.exports = Palette;
if (typeof require === 'function' && require.main === module) {
  ['bronze', 'nuit', 'contraste'].forEach(function (t) {
    console.log('/* ' + t + ' */\n' + Object.keys(Palette[t]).map(function (k) { return '--' + k + ':' + Palette[t][k]; }).join(';'));
  });
}
