// ==========================================
// FICHIER: utils/contentFilter.js
// ✅ Filtre de contenu inapproprié — utilisé côté backend
//    avant toute persistance d'un avis ou d'une réponse.
//    Même liste que côté frontend (SellerDetailsModal.jsx).
//    Importer dans reviewController.js.
// ==========================================

const FORBIDDEN_PATTERNS = [
  // ── Insultes françaises ──────────────────────────────────
  /c[o0]nn?[a@e]/i,
  /[s$][a@]l[o0]p/i,
  /enc[u\*]l/i,
  /f[o0]ut[r]?[e3]/i,
  /put[a@]in/i,
  /p[u\*]t[e3]/i,
  /m[e3]rd[e3]/i,
  /b[i1]t[e3]/i,
  /couill/i,
  /niq[u\*]/i,
  /bais[e3]/i,
  /chier/i,
  /câliss|ostie|tabarnak|criss/i,
  /pd\b|pédé/i,
  /trann?y|trann?ie/i,
  /bamboula/i,
  /n[i1][g9][g9]|n[i1][g9][a@]/i,
  /[r]ac[ail]+[e3]/i,
  /or[a@]ng[o0]ut/i,
  /singe\s*(sale|noir)/i,
  /sale\s*(noir|arabe|blanc|toubab)/i,
  /va\s*te\s*(faire|foutre)/i,
  /ferme\s*(ta|la)\s*(gueule|bouche)/i,
  /tg\b/i,
  /fils?\s*(de\s*)?(put|sal|con)/i,

  // ── Insultes / mots vulgaires dioula / bambara ───────────
  /wolo\s*so/i,
  /dogo\s*kono/i,
  /basi\s*kono/i,

  // ── Insultes / mots vulgaires mooré ─────────────────────
  /koglere/i,
  /yell[e3]\s*boe/i,

  // ── Insultes / mots vulgaires wolof ─────────────────────
  /degeum/i,
  /nit\s*ku\s*bon/i,
  /doff\s*la/i,

  // ── Contenu sexuel explicite ──────────────────────────────
  /porn/i,
  /xxx/i,
  /sexe?\s*explicit/i,
  /\bp[e3]n[i1]s\b/i,
  /\bvagin\b/i,
  /\banus\b/i,
  /\bcul\b/i,

  // ── Menaces / incitation à la violence ───────────────────
  /je\s*(vais|veux)\s*(te\s*)?(tuer|buter|crever|massacrer)/i,
  /mort\s*(aux?|à)/i,
  /crève/i,
];

/**
 * Normalise le texte pour détecter les contournements leetspeak.
 */
const normalizeLeet = (str) =>
  str
    .replace(/[0]/g, 'o')
    .replace(/[1]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[4]/g, 'a')
    .replace(/[@]/g, 'a')
    .replace(/[$]/g, 's')
    .replace(/[+]/g, 't')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Retourne true si le texte contient du contenu inapproprié.
 * @param {string} text
 * @returns {boolean}
 */
const containsInappropriateContent = (text) => {
  if (!text || typeof text !== 'string') return false;
  const normalized = normalizeLeet(text);
  return FORBIDDEN_PATTERNS.some(
    (pattern) => pattern.test(text) || pattern.test(normalized)
  );
};

/**
 * Valide un texte soumis par un utilisateur.
 * Retourne { valid: true } ou { valid: false, message: string }.
 * @param {string} text
 * @param {string} fieldLabel  — nom du champ pour le message d'erreur
 * @returns {{ valid: boolean, message?: string }}
 */
const validateUserText = (text, fieldLabel = 'Ce champ') => {
  if (!text || typeof text !== 'string') {
    return { valid: true };
  }
  if (containsInappropriateContent(text)) {
    return {
      valid: false,
      message: `${fieldLabel} contient des termes non autorisés sur la plateforme. Merci de respecter les règles de bonne conduite.`
    };
  }
  return { valid: true };
};

module.exports = { containsInappropriateContent, validateUserText };