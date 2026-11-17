/* ?demo=reset dans l'adresse remet le site dans son état initial (avant un passage devant le jury). */
(function () {
  var search = window.Store && Store.retirerParamDemo(location.search);
  if (search == null) return;
  try { Store.reinitialiserDemo(window.localStorage); } catch (e) {}
  history.replaceState(null, '', location.pathname + search + location.hash);
})();
