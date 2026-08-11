/* ═══════════════════════════════════════════════════════════════
   MOTEUR DE CALCUL PARTAGÉ : 2026
   ───────────────────────────────────────────────────────────────
   Dépend de parametres-2026.js (charger AVANT ce fichier).
   Fonctions pures : aucun accès au DOM → testables en Node.
   ═══════════════════════════════════════════════════════════════ */

// ─── Charges sociales TNS : gérant majoritaire SARL/EURL (~45%) ───
function calcTns(s) {
  if (s <= 0) return 0;
  return s * TNS.maladie
       + Math.min(s, PASS) * TNS.retraiteBase
       + s * TNS.retraiteCompl
       + s * TNS.invalDeces
       + s * TNS.csgCrds
       + s * TNS.formation
       + s * TNS.allocations;
}

// ─── Impôt sur les Sociétés (barème progressif) ───
function calcIs(b) {
  if (b <= 0) return 0;
  let imp = 0, reste = b;
  for (const [lo, hi, t] of IS_BRACKETS) {
    const x = Math.max(0, Math.min(reste, hi - lo));
    if (x > 0) { imp += x * t; reste -= x; }
  }
  return Math.round(imp);
}

// ─── Impôt sur le Revenu (barème progressif, foyer seul) ───
// ⚠️ Implémentation historique : largeur de tranche = hi - lo.
// Sous-estime d'une fraction d'euro aux frontières (gap de 1€
// entre tranches). Conservée pour non-régression (scénarios base).
function calcIr(r) {
  if (r <= 0) return 0;
  let imp = 0, reste = r;
  for (const [lo, hi, t] of TMI_BRACKETS) {
    const x = Math.max(0, Math.min(reste, hi - lo));
    if (x > 0) { imp += x * t; reste -= x; }
  }
  return Math.round(imp);
}

// Implémentation exacte : largeur de tranche = plafond - plafond_précédent.
// À terme, unifier sur celle-ci (les deux versions diffèrent de ±1€
// aux frontières de tranches : bug latent de l'original).
function calcIrExact(revenu) {
  if (!revenu || revenu <= 0 || isNaN(revenu)) return 0;
  let imp = 0, reste = revenu;
  for (let i = 0; i < TMI_BRACKETS.length; i++) {
    const prev = i === 0 ? 0 : TMI_BRACKETS[i - 1][1];
    const t = Math.min(Math.max(0, reste), TMI_BRACKETS[i][1] - prev);
    if (t > 0) { imp += t * TMI_BRACKETS[i][2]; reste -= t; }
    if (reste <= 0) break;
  }
  return Math.round(imp);
}

// ─── Tranche TMI + seuil du plafond de la tranche courante ───
function calcTmiBracket(revenu) {
  if (!revenu || revenu <= 0 || isNaN(revenu)) {
    return { taux: 0, seuil: TMI_BRACKETS[0][1], bracket: 0, nom: '0%' };
  }
  for (let i = 0; i < TMI_BRACKETS.length; i++) {
    if (revenu <= TMI_BRACKETS[i][1]) {
      return { taux: TMI_BRACKETS[i][2], seuil: TMI_BRACKETS[i][1], bracket: i,
               nom: (TMI_BRACKETS[i][2] * 100).toFixed(0) + '%' };
    }
  }
  const last = TMI_BRACKETS.length - 1;
  return { taux: TMI_BRACKETS[last][2], seuil: 999999999, bracket: last,
           nom: (TMI_BRACKETS[last][2] * 100).toFixed(0) + '%' };
}

// ─── Formatage montant en euros ───
function fmt(n) {
  return n.toLocaleString('fr-FR') + ' €';
}

// ─── Flat tax sur dividendes (PFU), option barème possible ───
function calcPfu(dividendeBrut, useBarème = false) {
  if (dividendeBrut <= 0) return 0;
  if (useBarème) return Math.round(dividendeBrut * 0.172); // PS seuls (IR géré via barème)
  return Math.round(dividendeBrut * PFU);
}

// ─── Micro-entreprise : cotisations URSSAF + base imposable ───
function calcMicro(ca, type) {
  const p = MICRO[type] || MICRO.service;
  return {
    urssaf: ca * p.urssaf,
    imposable: ca * (1 - p.abattement),
    taux: p.urssaf,
    abattement: p.abattement
  };
}
