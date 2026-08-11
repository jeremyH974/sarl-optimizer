/* ═══════════════════════════════════════════════════════════════
   PARAMÈTRES 2026 — Taux fiscaux & sociaux centralisés
   ───────────────────────────────────────────────────────────────
   Fichier UNIQUE de vérité pour tous les simulateurs.
   Toute modification ici impacte toutes les pages (SARL, SASU,
   comparateur, micro). Vérifier node --check après modification.

   SOURCES (vérifiées en ligne le 31/07/2026) :
   • PASS, barème IR, IS : règles officielles URSSAF mon-entreprise
     (github.com/betagouv/mon-entreprise, moteur publicodes —
     réf. Article 197 CGI, fiche service-public F23575)
   • Micro : fiches service-public.gouv.fr F36232/F36244
     (vérifiées 01/01/2026 et 13/03/2026)
   • SASU : fiche service-public F36240 (vérifiée 21/02/2026) +
     moteur officiel URSSAF (net ~78,5% du brut, coût ~1,40x)
   • Conjoint : fiche service-public F32266 (vérifiée 01/06/2026)
   ═══════════════════════════════════════════════════════════════ */

// Plafond Sécurité Sociale 2026 — 4 005 €/mois × 12
// Source : règles URSSAF (base.publicodes), urssaf.fr/plafonds-securite-sociale
const PASS = 48060;

// ═══ PROCÉDURE LF 2027 (à la publication de la loi, via le dépôt JORF) ═══
// 1. Vérifier dans la LF 2027 : barème IR indexé, PASS, IS, PFU, ACRE, seuils micro.
// 2. Mettre à jour CE fichier (source unique) — les simulateurs suivent.
// 3. Mettre à jour les pages qui affichent les montants en clair + tools/titles.json si besoin.
// 4. Mettre à jour les tests verrouillés (tests/test-*.js) AVEC les nouvelles valeurs.
// 5. Mettre à jour CHARTE-FIABILITE.md (registre + date) et la date E-E-A-T (genere-contenu-profond.py).
// Sources : echanges.dila.gouv.fr/OPENDATA/JORF (texte officiel) + fiches service-public.

// Barème de l'IS 2026 : taux réduit 15% sur 42 500 € de bénéfice puis 25%
// ⚠️ 42 500 € (et non 42 787 — seuil 2024+). Source : règles URSSAF
// (imposition.publicodes), fiche service-public F23575.
const IS_BRACKETS = [[0, 42500, 0.15], [42501, 1e9, 0.25]];

// Barème IR 2026 (revenus 2026) — indexation LF 2026
// 0% | 11% | 30% | 41% | 45%
// Source : règles URSSAF (impôt.publicodes), réf. Article 197 CGI
// ⚠️ Barème 2026 (indexé) : 11 600 / 29 579 / 84 577 / 181 917
const TMI_BRACKETS = [
  [0, 11600, 0],
  [11601, 29579, 0.11],
  [29580, 84577, 0.30],
  [84578, 181917, 0.41],
  [181918, 999999999, 0.45]
];

// Abattement 10% sur salaires — plafond 2026 : 14 555 €/an
// (non plafonné dans les calculs : concerne les revenus < ~145k€)
const ABATTEMENT_10PC_PLAFOND = 14555;

// Flat tax (PFU) : 12,8% IR + 17,2% prélèvements sociaux.
// ⚠️ Révocable chaque année depuis la LF 2026 (art. 126) :
// option possible pour le barème progressif.
const PFU = 0.30;

// Barème kilométrique 2026 — véhicule 6CV (approx. 0,51 €/km)
const TAUX_IK = 0.51;

// Cotisations TNS — gérant majoritaire SARL/EURL (décomposition)
// Taux 2026 (ordre de grandeur global ~45% du brut).
// Source : historique chantier, cohérent avec moteur URSSAF (41-45%
// selon le niveau de revenu, exonérations bas revenus incluses).
const TNS = {
  maladie: 0.065,        // maladie-maternité
  retraiteBase: 0.1775,  // retraite de base (plafonnée PASS)
  retraiteCompl: 0.07,   // retraite complémentaire obligatoire
  invalDeces: 0.015,     // invalidité-décès
  csgCrds: 0.098,        // CSG-CRDS non déductible (sur revenu)
  formation: 0.0025,     // formation professionnelle
  allocations: 0.017     // allocations familiales
};

// Conjoint salarié / collaborateur (SARL)
// Collaborateur : taux variables selon revenus du chef (source F32266,
// renvoi URSSAF) — 12% = approximation du guide. Statut limité à 5 ans
// (à compter de 2022). Sans assurance chômage.
const CONJOINT = {
  salarie: { chargesPatronales: 0.45, netRatio: 0.78 },    // net ~78% du brut
  collaborateur: { cotisations: 0.12, netRatio: 0.88 }      // ~12% de cotisations
};

// ACRE — exonération de cotisations 1ʳᵉ année (LFSS 2026)
// Taux 25% (50% avant la LFSS 2026) ; pleine si revenu ≤ 75% PASS, dégressive jusqu'au PASS, nulle au-delà.
// Source : URSSAF (exoneration-acre-createur) + fiche service-public F11677 (vérifiée 01/07/2026).
const ACRE = { taux: 0.25, seuilPleinPASS: 0.75, seuilZeroPASS: 1 };

// ─── Brut → net 2026 ───
// SOURCE : moteur publicodes URSSAF exécuté en local le 01/08/2026 (simulateur officiel)
// + règles salarié__cotisations.publicodes (fichiers téléchargés depuis mon-entreprise.urssaf.fr).
// Ratios agrégés = net avant impôt / brut, HORS mutuelle et prévoyance conventionnelle
// (avec mutuelle obligatoire ~2-3% : compter ~75-76% pour un salarié).
//   salarié non cadre : net ≈ 78% (77,8-78,4% mesurés sur 1 800-3 500 €) · coût employeur ≈ 1,41x
//   assimilé salarié SASU : net ≈ 78% (77,9-78,7%) · coût ≈ 1,40x (AGIRC-ARRCO unifié depuis 2019)
//   gérant TNS : net ≈ 55,5% (cotisations ~44,5% à sa charge — cohérent avec calcTns testé)
BRUT_NET = {
  passMensuel: 48060 / 12, // 4 005 € (PASS 2026 ÷ 12)
  salarie:  { net: 0.78,  cout: 1.41, note: 'non cadre — hors mutuelle/prévoyance' },
  cadre:    { net: 0.78,  cout: 1.40, note: 'assimilé salarié SASU — hors mutuelle/prévoyance' },
  tns:      { net: 0.555, cout: 1.00, note: 'cotisations à la charge du gérant (~44,5%)' },
  // Taux détaillés salarié 2026 (publicodes URSSAF — cas 2 500 € brut, 01/08/2026)
  detail: {
    vieillessePlafonneeSalarie: 0.069,   // 6,90% (173 €/2 500 vérifié)
    vieillesseDeplafonneeSalarie: 0.004, // 0,40% (10 €/2 500 vérifié)
    retraiteComplementaireSalarie: 0.0315, // AGIRC-ARRCO T1 (79 €/2 500 vérifié)
    cetSalarie: 0.0014,                  // contribution d'équilibre technique (règle publicodes)
    chomageSalarie: 0,                   // part salarié 0% (réforme 2018)
    maladieSalarie: 0,                   // part salarié 0%
    csg: 0.092,                          // 9,2% = 6,8 déductible + 2,4 non déductible
    csgDeductible: 0.068,                // 6,8% (171 €/2 500 vérifié)
    crds: 0.005,                         // 0,5% (13 €/2 500 vérifié)
    maladieEmployeur: 0.13,              // taux plein (7% réduit si rémunération < 2,5 SMIC)
    vieillesseEmployeur: 0.0855,         // 8,55% (214 €/2 500 vérifié)
    chomageEmployeur: 0.0405,            // ~4,05% (règle publicodes 2026)
    allocationsFamilialesEmployeur: 0.0525, // 5,25% plein (3,45% réduit sous conditions)
  },
};

// Régime micro-entreprise 2026 — taux URSSAF + abattement IR
// Source : fiches service-public F36232 (vérifiée 01/01/2026)
// et F36244 (vérifiée 13/03/2026).
// ⚠️ Revenus 2025 (déclarés 2026) : abattements 71%/50%/30%.
const MICRO = {
  vente:   { urssaf: 0.123, abattement: 0.71 },  // vente de marchandises
  service: { urssaf: 0.212, abattement: 0.50 },  // prestations de services BIC
  bnc:     { urssaf: 0.256, abattement: 0.34 },  // libéral non réglementé
  // location meublée : urssaf 21,2% ; abattement 30% (tourisme non classé),
  // 50% (classé 2025→…), 71% (location longue durée) — détail guide
  meuble:  { urssaf: 0.212, abattement: 0.30 }
};

// Seuils micro-fiscal 2026 (CA N-1 ou N-2 pour rester en micro au 01/01/N)
// Source : fiche service-public F36244 (vérifiée 13/03/2026)
const SEUIL_MICRO = { vente: 203100, service: 83600, bnc: 83600 };

// Assimilé salarié — président SASU/SAS (régime général cadre)
// ⚠️ PAS d'assurance chômage obligatoire pour le dirigeant
// (source : fiche service-public F36240 vérifiée 21/02/2026).
// Valeurs issues du moteur officiel URSSAF (01/2026) :
// net avant IR ≈ 78-79% du brut, coût employeur ≈ 1,40x le brut.
const SALARIE = {
  cotisations: 0.40,      // part patronale + salariale (~40% du brut)
  chomage: 0,             // ← dirigeant SASU : PAS de chômage obligatoire !
  netRatio: 0.785,        // net avant IR ~78,5% du brut (moteur URSSAF)
  coutRatio: 1.40         // coût employeur ~1,40x le brut
};
