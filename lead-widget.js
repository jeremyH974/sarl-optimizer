/* ═══════════════════════════════════════════════════════════════
   LEAD CAPTURE WIDGET : capture d'emails → Telegram (sans backend)
   ───────────────────────────────────────────────────────────────
   Envoie {email, nom, source, message} au bot Telegram de Jeremy.
   Fallback : mailto si le bot n'est pas configuré.
   ═══════════════════════════════════════════════════════════════ */

// 🔧 CONFIGURATION (à personnaliser)
const LEAD_BOT_TOKEN = "CREER_BOT_LEADS_VIA_BOTFATHER"; // ⚠️ à remplacer
const LEAD_CHAT_ID = "1597952161"; // chat_id de Jeremy
const LEAD_EMAIL_FALLBACK = "jeremyhenry974@gmail.com";

// Widget HTML injecté dans la page
function leadWidgetHTML(contexte) {
  return `
  <div class="lead-widget" id="leadWidget" style="
    margin:1.5rem 0; padding:1.3rem; border-radius:14px;
    background:linear-gradient(135deg, rgba(245,158,11,.1), rgba(245,158,11,.03));
    border:1px solid rgba(245,158,11,.35); text-align:center;">
    <div style="font-size:1.6rem; margin-bottom:.4rem;">📬</div>
    <h3 style="margin:0 0 .3rem; color:var(--accent, #f59e0b);">Recevez l'analyse complète par email</h3>
    <p style="font-size:.85rem; color:var(--muted, #94a3b8); margin:0 0 .9rem;">
      ${contexte || "Vos résultats détaillés + le guide pratique, directement dans votre boîte mail. Gratuit."}
    </p>
    <form id="leadForm" style="display:flex; gap:.5rem; flex-wrap:wrap; justify-content:center;" onsubmit="event.preventDefault(); leadSubmit(this, '${contexte || ''}')">
      <input type="text" id="leadNom" placeholder="Votre prénom" required style="
        padding:.65rem 1rem; border-radius:30px; border:1px solid var(--border, #334155);
        background:var(--card, #1e293b); color:var(--text, #e2e8f0); font-size:.9rem; min-width:130px;">
      <input type="email" id="leadEmail" placeholder="Votre email" required style="
        padding:.65rem 1rem; border-radius:30px; border:1px solid var(--border, #334155);
        background:var(--card, #1e293b); color:var(--text, #e2e8f0); font-size:.9rem; min-width:180px;">
      <button type="submit" style="
        padding:.65rem 1.4rem; border-radius:30px; border:none; cursor:pointer;
        background:var(--accent, #f59e0b); color:var(--dark, #0f172a); font-weight:700; font-size:.9rem;">
        Recevoir 🎁
      </button>
    </form>
    <div id="leadMsg" style="font-size:.85rem; margin-top:.7rem; display:none;"></div>
  </div>`;
}

// Injection automatique (à appeler au chargement)
function leadWidgetInject(selector, contexte) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.insertAdjacentHTML('beforeend', leadWidgetHTML(contexte));
}

// Envoi du lead
async function leadSubmit(form, contexte) {
  const nom = form.querySelector('#leadNom').value.trim();
  const email = form.querySelector('#leadEmail').value.trim();
  const msg = document.getElementById('leadMsg');
  const page = location.pathname.split('/').pop() || 'page';

  const texte = `🆕 *NOUVEAU LEAD : ${contexte || page}*\n👤 ${nom}\n📧 ${email}\n📄 Page : ${page}\n🕐 ${new Date().toLocaleString('fr-FR')}`;

  let ok = false;

  // 1) Envoi Telegram (si token configuré)
  if (LEAD_BOT_TOKEN && LEAD_BOT_TOKEN.indexOf('CREER_BOT') !== 0) {
    try {
      const rep = await fetch(`https://api.telegram.org/bot${LEAD_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: LEAD_CHAT_ID, text: texte, parse_mode: 'Markdown' })
      });
      ok = rep.ok;
    } catch (e) { ok = false; }
  }

  // 2) Fallback : ouverture mailto pré-rempli
  if (!ok) {
    const sujet = encodeURIComponent(`Lead : ${contexte || page}`);
    const corps = encodeURIComponent(`${texte.replace(/\*/g, '')}\n\n${window.location.href}`);
    window.location.href = `mailto:${LEAD_EMAIL_FALLBACK}?subject=${sujet}&body=${corps}`;
  }

  // 3) Confirmation
  msg.style.display = 'block';
  if (ok) {
    msg.style.color = '#22c55e';
    msg.textContent = '✅ Merci ! Votre analyse arrive bientôt dans votre boîte mail.';
  } else {
    msg.style.color = '#22c55e';
    msg.textContent = '✅ Merci ! Votre email a été ouvert dans votre messagerie : un clic sur Envoyer et c\'est fait.';
  }
  form.querySelector('button').textContent = '✅ Envoyé !';
  form.querySelector('button').disabled = true;
}
