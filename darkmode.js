// Thème clair/sombre + menu mobile : robuste (ne doit JAMAIS planter)
(function () {
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // Le toggle doit exister EN PREMIER, avant toute lecture localStorage
  // (si localStorage lève une erreur, le bouton 🌙☀️ doit quand même marcher)
  window.basculeTheme = function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', cur);
    safeSet('sarl-theme', cur);
    var btn = document.getElementById('theme-btn');
    if (btn) btn.textContent = cur === 'light' ? '🌙' : '☀️';
  };

  // Restaurer le thème sauvegardé (si possible)
  try {
    var saved = safeGet('sarl-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  } catch (e) {}

  // Fermer le menu ☰ au clic extérieur
  document.addEventListener('click', function (e) {
    document.querySelectorAll('details.menu[open]').forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });
  });

  // MENU MOBILE FIABLE : overlay plein écran géré en JS
  // (position:fixed dans un <details> est bugué sur Safari/iOS :
  //  on clone le contenu dans le body, méthode fiable)
  function setupMobileMenu() {
    if (window.innerWidth > 640) return;
    document.querySelectorAll('details.menu').forEach(function (d) {
      var summary = d.querySelector('summary');
      var content = d.querySelector('.menu-content');
      if (!summary || !content || d.getAttribute('data-overlay')) return;
      var overlay = document.createElement('div');
      overlay.className = 'menu-overlay';
      overlay.setAttribute('aria-label', 'Menu');
      overlay.innerHTML = content.innerHTML;
      overlay.style.display = 'none';
      document.body.appendChild(overlay);
      d.setAttribute('data-overlay', '1');
      summary.addEventListener('click', function (e) {
        e.preventDefault();
        overlay.style.display = 'flex';
      });
      overlay.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        overlay.style.display = 'none';
      });
    });
  }
  try { setupMobileMenu(); } catch (e) {}

})();
