// ═══════════════════════════════════════════════════════
// WIDGET BESOIN — bouton flottant + overlay formulaire Tally
// ═══════════════════════════════════════════════════════
(function(){
  if (window.__besoinWidgetLoaded) return;
  window.__besoinWidgetLoaded = true;

  var FORM_URL = "https://tally.so/r/EkVxb2"; // formulaire de besoin

  // CSS
  var css = document.createElement("style");
  css.textContent = `
    .besoin-fab{position:fixed;bottom:20px;right:20px;z-index:9999;background:#f59e0b;color:#0f172a;
      border:none;border-radius:50px;padding:14px 20px;font-weight:700;font-size:.9rem;cursor:pointer;
      box-shadow:0 6px 20px rgba(245,158,11,.4);display:flex;align-items:center;gap:8px;transition:transform .2s;}
    .besoin-fab:hover{transform:scale(1.05);}
    .besoin-overlay{position:fixed;inset:0;background:rgba(11,18,32,.85);z-index:10000;display:none;
      align-items:center;justify-content:center;padding:16px;}
    .besoin-overlay.open{display:flex;}
    .besoin-box{background:#141f36;border:1px solid #26355c;border-radius:16px;width:100%;max-width:520px;
      max-height:90vh;overflow:hidden;position:relative;}
    .besoin-box iframe{width:100%;height:560px;border:none;display:block;}
    .besoin-close{position:absolute;top:10px;right:10px;background:rgba(255,255,255,.1);border:none;
      color:#e8edf7;width:34px;height:34px;border-radius:50%;font-size:1.1rem;cursor:pointer;z-index:10;}
    @media(max-width:640px){.besoin-fab{bottom:14px;right:14px;padding:12px 16px;font-size:.82rem;}
      .besoin-box iframe{height:500px;}}
  `;
  document.head.appendChild(css);

  // Bouton
  var fab = document.createElement("button");
  fab.className = "besoin-fab";
  fab.innerHTML = "💬 Parlez-moi de votre besoin";
  fab.setAttribute("aria-label", "Ouvrir le formulaire de besoin");
  document.body.appendChild(fab);

  // Overlay
  var overlay = document.createElement("div");
  overlay.className = "besoin-overlay";
  overlay.innerHTML = `<div class="besoin-box">
    <button class="besoin-close" aria-label="Fermer">&times;</button>
    <iframe src="${FORM_URL}" title="Formulaire de besoin" loading="lazy"></iframe>
  </div>`;
  document.body.appendChild(overlay);

  var box = overlay.querySelector(".besoin-box");

  function openForm(){
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeForm(){
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }
  fab.addEventListener("click", openForm);
  overlay.querySelector(".besoin-close").addEventListener("click", closeForm);
  overlay.addEventListener("click", function(e){ if(e.target === overlay) closeForm(); });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") closeForm(); });

  // Exposition globale pour que les CTA des pages puissent ouvrir le formulaire
  window.openBesoinForm = openForm;
  window.closeBesoinForm = closeForm;
})();
