// ==========================================
// FICHIER: src/data/quarterNameCorrections.js
// Corrections des noms de quartiers mal retournés par Nominatim
// ==========================================

/**
 * Dictionnaire de corrections pour les noms de quartiers
 * Format: { "nom_incorrect": "nom_correct" }
 */
export const QUARTER_NAME_CORRECTIONS = {
  // Ouagadougou
  'karpalin': 'Karpala',
  'Karpalin': 'Karpala',
  'KARPALIN': 'Karpala',
  
  'gounghin': 'Gounghin',
  'Gounghin nord': 'Gounghin',
  'Gounghin sud': 'Gounghin',
  
  'cissin': 'Cissin',
  'Cissin nord': 'Cissin',
  
  'dapoya': 'Dapoya',
  'Dapoya nord': 'Dapoya',
  
  'tanghin': 'Tanghin',
  'Tanghin nord': 'Tanghin',
  
  'somgande': 'Somgandé',
  'Somgande': 'Somgandé',
  
  'koulouba': 'Koulouba',
  'Koulouba nord': 'Koulouba',
  
  'pissy': 'Pissy',
  'Pissy nord': 'Pissy',
  
  'tampouy': 'Tampouy',
  'Tampouy nord': 'Tampouy',
  
  'samandin': 'Samandin',
  'Samandin nord': 'Samandin',
  
  'ouaga 2000': 'Ouaga 2000',
  'ouaga2000': 'Ouaga 2000',
  
  'zogona': 'Zogona',
  'Zogona nord': 'Zogona',
  
  'balkuy': 'Balkuy',
  'Balkuy nord': 'Balkuy',
  
  'dassasgo': 'Dassasgho',
  'Dassasgo': 'Dassasgho',
  'dassasgho': 'Dassasgho',
  
  'kilwin': 'Kilwin',
  'Kilwin nord': 'Kilwin',
  
  'paspanga': 'Paspanga',
  'Paspanga nord': 'Paspanga',
  
  'bogodogo': 'Bogodogo',
  'Bogodogo nord': 'Bogodogo',
  
  'nongr-massom': 'Nongr-Massom',
  'nongr massom': 'Nongr-Massom',
  'Nongr Massom': 'Nongr-Massom',
  
  'sig-noghin': 'Sig-Noghin',
  'sig noghin': 'Sig-Noghin',
  'Sig Noghin': 'Sig-Noghin',
  
  'boulmiougou': 'Boulmiougou',
  'Boulmiougou nord': 'Boulmiougou',
  
  'kossodo': 'Kossodo',
  'Kossodo nord': 'Kossodo',
  
  'wayalghin': 'Wayalghin',
  'Wayalghin nord': 'Wayalghin',
  
  'zagtouli': 'Zagtouli',
  'Zagtouli nord': 'Zagtouli',
  
  'non-kotologo': 'Non-Kotologo',
  'non kotologo': 'Non-Kotologo',
  'Nonkotologo': 'Non-Kotologo',
  
  'zone du bois': 'Zone du Bois',
  'zone bois': 'Zone du Bois',
  
  '1200 logements': '1200 Logements',
  '1200logements': '1200 Logements',
  
  'zone 1': 'Zone 1',
  'zone1': 'Zone 1',
  'zone 01': 'Zone 1',
  
  'zone 3': 'Zone 3',
  'zone3': 'Zone 3',
  'zone 03': 'Zone 3',
  
  'zone 4': 'Zone 4',
  'zone4': 'Zone 4',
  'zone 04': 'Zone 4',
  
  'bilbambili': 'Bilbalogho',
  'bilbalogho': 'Bilbalogho',
  
  'hamdallaye': 'Hamdallaye',
  'Hamdallaye nord': 'Hamdallaye',
  
  'paglayiri': 'Paglayiri',
  'Paglayiri nord': 'Paglayiri',
  
  'zanguettin': 'Zanguetin',
  'Zanguettin': 'Zanguetin',
  'zanguetin': 'Zanguetin',
  
  'yamtenga': 'Yamtenga',
  'Yamtenga nord': 'Yamtenga',
  
  'kongoussi': 'Kongoussi',
  'Kongoussi nord': 'Kongoussi',
  
  'kalgondin': 'Kalgondin',
  'Kalgondin nord': 'Kalgondin',
  
  'nioko 2': 'Nioko II',
  'nioko ii': 'Nioko II',
  'Nioko 2': 'Nioko II',
  
  'kossyam': 'Kossyam',
  'Kossyam nord': 'Kossyam',
  
  'bendogo': 'Bendogo',
  'Bendogo nord': 'Bendogo',
  
  'sourgoubila': 'Sourgoubila',
  'Sourgoubila nord': 'Sourgoubila',
  
  'tanghin-dassouri': 'Tanghin-Dassouri',
  'tanghin dassouri': 'Tanghin-Dassouri',
  'Tanghin Dassouri': 'Tanghin-Dassouri',
  
  'rakounda': 'Rakoundé',
  'Rakounda': 'Rakoundé',
  'rakoundé': 'Rakoundé',
  
  'saaba': 'Saaba',
  'Saaba nord': 'Saaba',
  
  'komsilga': 'Komsilga',
  'Komsilga nord': 'Komsilga',
  
  'koubri': 'Koubri',
  'Koubri nord': 'Koubri',
  
  'pabré': 'Pabré',
  'pabre': 'Pabré',
  'Pabre': 'Pabré',
  
  'loumbila': 'Loumbila',
  'Loumbila nord': 'Loumbila',
};

/**
 * Variations orthographiques communes à corriger
 */
export const QUARTER_VARIATIONS = {
  // Enlever les directions (nord, sud, est, ouest)
  patterns: [
    { regex: /\s+(nord|sud|est|ouest)$/i, replace: '' },
    { regex: /\s+\d+$/i, replace: '' }, // Enlever numéros à la fin
  ]
};

/**
 * Mots à capitaliser correctement
 */
export const CAPITALIZATION_RULES = {
  // Mots qui doivent rester en minuscule
  lowercase: ['de', 'du', 'des', 'le', 'la', 'les'],
  
  // Mots qui doivent être en majuscule
  uppercase: ['II', 'III', 'IV', 'V'],
};

/**
 * Fonction pour corriger le nom d'un quartier
 */
export const correctQuarterName = (rawName) => {
  if (!rawName) return null;
  
  let correctedName = rawName.trim();
  
  // 1. Vérifier d'abord dans le dictionnaire de corrections exactes
  const lowerName = correctedName.toLowerCase();
  if (QUARTER_NAME_CORRECTIONS[lowerName]) {
    console.log(`🔧 Correction appliquée: "${rawName}" → "${QUARTER_NAME_CORRECTIONS[lowerName]}"`);
    return QUARTER_NAME_CORRECTIONS[lowerName];
  }
  
  // Vérifier aussi avec la casse exacte
  if (QUARTER_NAME_CORRECTIONS[correctedName]) {
    console.log(`🔧 Correction appliquée: "${rawName}" → "${QUARTER_NAME_CORRECTIONS[correctedName]}"`);
    return QUARTER_NAME_CORRECTIONS[correctedName];
  }
  
  // 2. Appliquer les patterns de variation
  QUARTER_VARIATIONS.patterns.forEach(pattern => {
    correctedName = correctedName.replace(pattern.regex, pattern.replace);
  });
  
  // 3. Capitalisation appropriée
  correctedName = capitalizeQuarterName(correctedName);
  
  // 4. Vérifier à nouveau dans le dictionnaire après nettoyage
  const cleanedLower = correctedName.toLowerCase();
  if (QUARTER_NAME_CORRECTIONS[cleanedLower]) {
    console.log(`🔧 Correction après nettoyage: "${rawName}" → "${QUARTER_NAME_CORRECTIONS[cleanedLower]}"`);
    return QUARTER_NAME_CORRECTIONS[cleanedLower];
  }
  
  console.log(`ℹ️ Nom conservé (aucune correction): "${rawName}" → "${correctedName}"`);
  return correctedName;
};

/**
 * Capitaliser correctement un nom de quartier
 */
const capitalizeQuarterName = (name) => {
  if (!name) return '';
  
  return name
    .split(/[\s-]/) // Split sur espaces et tirets
    .map((word, index) => {
      const lower = word.toLowerCase();
      
      // Mots qui doivent rester en minuscule (sauf en début)
      if (index > 0 && CAPITALIZATION_RULES.lowercase.includes(lower)) {
        return lower;
      }
      
      // Mots qui doivent être en majuscule
      if (CAPITALIZATION_RULES.uppercase.includes(word.toUpperCase())) {
        return word.toUpperCase();
      }
      
      // Capitalisation normale (première lettre en majuscule)
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\s+-\s+/g, '-'); // Remettre les tirets sans espaces
};

/**
 * Fonction pour vérifier si un nom de quartier est valide
 */
export const isValidQuarterName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  // Critères de validation
  const minLength = 3;
  const maxLength = 50;
  
  const trimmed = name.trim();
  
  // Vérifier la longueur
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    return false;
  }
  
  // Vérifier qu'il n'y a pas que des chiffres
  if (/^\d+$/.test(trimmed)) {
    return false;
  }
  
  // Vérifier qu'il contient au moins une lettre
  if (!/[a-zA-ZÀ-ÿ]/.test(trimmed)) {
    return false;
  }
  
  return true;
};

/**
 * Fonction pour nettoyer et valider un nom de quartier
 */
export const cleanAndValidateQuarterName = (rawName) => {
  if (!rawName) return null;
  
  // 1. Corriger le nom
  const corrected = correctQuarterName(rawName);
  
  // 2. Valider
  if (!isValidQuarterName(corrected)) {
    console.warn(`⚠️ Nom de quartier invalide après correction: "${rawName}" → "${corrected}"`);
    return null;
  }
  
  return corrected;
};

/**
 * Fonction pour trouver la meilleure correspondance
 * Utile pour la recherche floue
 */
export const findBestQuarterMatch = (inputName, quartersList) => {
  if (!inputName || !quartersList || quartersList.length === 0) {
    return null;
  }
  
  const input = inputName.toLowerCase().trim();
  
  // 1. Recherche exacte
  let exactMatch = quartersList.find(q => 
    q.toLowerCase().trim() === input
  );
  if (exactMatch) return exactMatch;
  
  // 2. Recherche après correction
  const corrected = correctQuarterName(inputName).toLowerCase();
  exactMatch = quartersList.find(q => 
    q.toLowerCase().trim() === corrected
  );
  if (exactMatch) return exactMatch;
  
  // 3. Recherche par début de chaîne
  const startMatch = quartersList.find(q => 
    q.toLowerCase().startsWith(input) || 
    input.startsWith(q.toLowerCase())
  );
  if (startMatch) return startMatch;
  
  // 4. Recherche par contenu
  const containsMatch = quartersList.find(q => 
    q.toLowerCase().includes(input) || 
    input.includes(q.toLowerCase())
  );
  if (containsMatch) return containsMatch;
  
  return null;
};

/**
 * Statistiques sur les corrections appliquées
 */
export const getCorrectionStats = () => {
  return {
    totalCorrections: Object.keys(QUARTER_NAME_CORRECTIONS).length,
    patterns: QUARTER_VARIATIONS.patterns.length,
    commonErrors: [
      'karpalin → Karpala',
      'dassasgo → Dassasgho',
      'bilbambili → Bilbalogho',
      'nongr massom → Nongr-Massom',
      'sig noghin → Sig-Noghin',
    ]
  };
};

export default {
  correctQuarterName,
  cleanAndValidateQuarterName,
  isValidQuarterName,
  findBestQuarterMatch,
  getCorrectionStats,
  QUARTER_NAME_CORRECTIONS,
};