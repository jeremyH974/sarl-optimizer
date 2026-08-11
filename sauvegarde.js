// Sauvegarde locale des saisies : vos chiffres restent dans votre navigateur (localStorage)
// - au chargement : restaure les valeurs (sauf si un deep link ?ca=... est présent, il prime)
// - à chaque saisie : sauvegarde automatiquement
(function () {
  try {
    var page = location.pathname.split('/').pop() || 'index.html';
    var key = 'sarl-save-' + page;

    function collect() {
      var data = {};
      document.querySelectorAll('input, select').forEach(function (el) {
        if (el.id) {
          data[el.id] = (el.type === 'checkbox') ? (el.checked ? '1' : '') : el.value;
        }
      });
      return data;
    }
    function apply(data) {
      Object.keys(data).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = (data[id] === '1');
        else el.value = data[id] || '';
      });
    }

    // Restauration au chargement : le deep link (query params) prime
    var hasDeepLink = (location.search && location.search.length > 2);
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
    if (saved && !hasDeepLink) apply(saved);

    // Sauvegarde à chaque modification (event delegation)
    document.addEventListener('input', function () {
      try { localStorage.setItem(key, JSON.stringify(collect())); } catch (e) {}
    });
    document.addEventListener('change', function () {
      try { localStorage.setItem(key, JSON.stringify(collect())); } catch (e) {}
    });
  } catch (e) {}
})();
