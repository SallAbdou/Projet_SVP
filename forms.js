// Charge les formulaires Tally intégrés.
// Tant qu'un ID n'est pas renseigné (REMPLACER_ID_...), on affiche un encart au lieu d'un formulaire cassé.
(function () {
  var frames = document.querySelectorAll('iframe[data-tally-src]');
  var aCharger = false;

  frames.forEach(function (f) {
    var manquant = f.dataset.tallySrc.match(/REMPLACER_ID_\w+/);
    if (manquant) {
      var box = document.createElement('div');
      box.className = 'placeholder';
      box.innerHTML = 'Formulaire Tally à brancher : remplacer <code>' + manquant[0] + '</code> par l’ID du formulaire.';
      f.replaceWith(box);
    } else {
      aCharger = true;
    }
  });

  if (!aCharger) return;

  // Script officiel Tally : il transmet aussi les paramètres de la page (?token=...&avis=...) aux champs cachés.
  var charger = function () {
    if (window.Tally) {
      window.Tally.loadEmbeds();
    } else {
      document.querySelectorAll('iframe[data-tally-src]:not([src])').forEach(function (f) {
        f.src = f.dataset.tallySrc;
      });
    }
  };
  var s = document.createElement('script');
  s.src = 'https://tally.so/widgets/embed.js';
  s.onload = charger;
  s.onerror = charger;
  document.body.appendChild(s);
})();
