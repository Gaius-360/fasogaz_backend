// ==========================================
// FICHIER: src/data/quartersData.js
// Base de données locale des quartiers de Ouagadougou et Bobo-Dioulasso
// Utilisée en fallback si l'API Nominatim ne trouve rien
// ==========================================

/**
 * Quartiers de Ouagadougou avec coordonnées approximatives (centre du quartier)
 */
export const OUAGADOUGOU_QUARTERS = [
  // Zone Centre
  { name: 'Gounghin', lat: 12.3714, lon: -1.5197, sector: 1 },
  { name: 'Dapoya', lat: 12.3680, lon: -1.5160, sector: 1 },
  { name: 'Koulouba', lat: 12.3590, lon: -1.5310, sector: 1 },
  { name: 'Bilbalogho', lat: 12.3640, lon: -1.5240, sector: 1 },
  { name: 'Samandin', lat: 12.3750, lon: -1.5280, sector: 2 },
  { name: 'Nemnin', lat: 12.3820, lon: -1.5210, sector: 2 },
  { name: 'Boulmiougou', lat: 12.3450, lon: -1.4890, sector: 3 },
  { name: 'Tampouy', lat: 12.3380, lon: -1.4750, sector: 4 },
  { name: 'Bogodogo', lat: 12.3520, lon: -1.4650, sector: 5 },
  { name: 'Dassasgho', lat: 12.3680, lon: -1.4580, sector: 6 },
  
  // Zone Nord
  { name: 'Patte d\'Oie', lat: 12.3950, lon: -1.5150, sector: 15 },
  { name: 'Ouaga 2000', lat: 12.3410, lon: -1.4580, sector: 12 },
  { name: 'Pissy', lat: 12.3280, lon: -1.5420, sector: 23 },
  { name: 'Tanghin', lat: 12.3850, lon: -1.4950, sector: 7 },
  { name: 'Somgandé', lat: 12.4020, lon: -1.4880, sector: 8 },
  
  // Zone Ouest
  { name: 'Hamdalaye', lat: 12.3620, lon: -1.5520, sector: 17 },
  { name: 'Dassasgo', lat: 12.3680, lon: -1.4580, sector: 6 },
  { name: 'Wayalghin', lat: 12.3480, lon: -1.5680, sector: 21 },
  { name: 'Saaba', lat: 12.3950, lon: -1.4320, sector: 10 },
  
  // Zone Est
  { name: 'Kossodo', lat: 12.3890, lon: -1.4620, sector: 7 },
  { name: 'Balkuy', lat: 12.3950, lon: -1.4450, sector: 9 },
  { name: 'Rimkieta', lat: 12.4180, lon: -1.4380, sector: 11 },
  
  // Zone Sud
  { name: 'Cité An II', lat: 12.3180, lon: -1.5080, sector: 13 },
  { name: 'Cité An III', lat: 12.3120, lon: -1.4950, sector: 13 },
  { name: 'Goughin', lat: 12.3280, lon: -1.4620, sector: 14 },
  { name: 'Zogona', lat: 12.3450, lon: -1.5350, sector: 20 },
  { name: 'Karpala', lat: 12.3580, lon: -1.5480, sector: 22 },
  
  // Autres quartiers importants
  { name: 'Zone 1', lat: 12.3650, lon: -1.5180, sector: 1 },
  { name: 'Zone 3', lat: 12.3480, lon: -1.5020, sector: 3 },
  { name: 'Zone 4', lat: 12.3420, lon: -1.4820, sector: 4 },
  { name: 'Cissin', lat: 12.3320, lon: -1.5620, sector: 23 },
  { name: 'Yamtenga', lat: 12.3880, lon: -1.5320, sector: 19 },
  { name: 'Koulouba', lat: 12.3590, lon: -1.5310, sector: 16 },
  { name: 'Nioko II', lat: 12.3150, lon: -1.5380, sector: 25 },
  { name: 'Kilwin', lat: 12.2980, lon: -1.5280, sector: 26 },
  { name: 'Bendogo', lat: 12.2850, lon: -1.5150, sector: 27 },
  { name: 'Somkèré', lat: 12.2920, lon: -1.4920, sector: 28 },
  { name: 'Nonsin', lat: 12.2780, lon: -1.4780, sector: 29 },
  { name: 'Polesgo', lat: 12.2650, lon: -1.4650, sector: 30 },
];

/**
 * Quartiers de Bobo-Dioulasso avec coordonnées approximatives
 */
export const BOBO_QUARTERS = [
  { name: 'Sarfalao', lat: 11.1820, lon: -4.2980, sector: 'Centre' },
  { name: 'Accart-Ville', lat: 11.1780, lon: -4.2920, sector: 'Centre' },
  { name: 'Konsa', lat: 11.1850, lon: -4.3050, sector: 'Nord' },
  { name: 'Belleville', lat: 11.1750, lon: -4.2850, sector: 'Centre' },
  { name: 'Diarradougou', lat: 11.1920, lon: -4.3120, sector: 'Nord' },
  { name: 'Nieneta', lat: 11.1680, lon: -4.2780, sector: 'Sud' },
  { name: 'Dogona', lat: 11.1650, lon: -4.2920, sector: 'Sud' },
  { name: 'Kua', lat: 11.1580, lon: -4.3080, sector: 'Sud-Ouest' },
  { name: 'Colma', lat: 11.1950, lon: -4.2850, sector: 'Nord' },
  { name: 'Lafiabougou', lat: 11.1720, lon: -4.3150, sector: 'Ouest' },
  { name: 'Tounouma', lat: 11.1820, lon: -4.3200, sector: 'Ouest' },
  { name: 'Sikasso', lat: 11.1890, lon: -4.2750, sector: 'Nord-Est' },
  { name: 'Zona', lat: 11.1620, lon: -4.2650, sector: 'Sud-Est' },
];

/**
 * Calcule la distance entre deux points GPS (formule de Haversine)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (value) => value * Math.PI / 180;

/**
 * Trouve le quartier le plus proche à partir des coordonnées GPS
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} city - 'Ouagadougou' ou 'Bobo-Dioulasso'
 * @returns {Object|null}
 */
export const findNearestQuarter = (latitude, longitude, city = 'Ouagadougou') => {
  const quarters = city.toLowerCase().includes('bobo') 
    ? BOBO_QUARTERS 
    : OUAGADOUGOU_QUARTERS;

  let nearest = null;
  let minDistance = Infinity;

  quarters.forEach(quarter => {
    const distance = calculateDistance(latitude, longitude, quarter.lat, quarter.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = quarter;
    }
  });

  // Si la distance est supérieure à 5km, c'est probablement hors de la ville
  if (minDistance > 5) {
    console.warn(`⚠️ Distance trop grande (${minDistance.toFixed(2)} km). Hors zone?`);
    return null;
  }

  console.log(`✅ Quartier le plus proche trouvé: ${nearest.name} (${minDistance.toFixed(2)} km)`);

  return {
    name: nearest.name,
    sector: nearest.sector,
    distance: minDistance,
    confidence: minDistance < 0.5 ? 'high' : minDistance < 1.5 ? 'medium' : 'low'
  };
};

/**
 * Obtient le quartier avec fallback intelligent
 * 1. Essaie d'abord l'API Nominatim
 * 2. Si échec, utilise la base locale
 */
export const getQuarterWithFallback = async (latitude, longitude, nominatimResult) => {
  // Si Nominatim a trouvé un quartier, l'utiliser
  if (nominatimResult && nominatimResult.quarter) {
    return {
      source: 'nominatim',
      quarter: nominatimResult.quarter,
      city: nominatimResult.city,
      confidence: 'high'
    };
  }

  // Sinon, chercher dans la base locale
  console.log('🔍 Nominatim sans résultat, recherche dans la base locale...');
  
  const city = nominatimResult?.city || 'Ouagadougou';
  const nearestQuarter = findNearestQuarter(latitude, longitude, city);

  if (nearestQuarter) {
    return {
      source: 'local_database',
      quarter: nearestQuarter.name,
      city: city,
      confidence: nearestQuarter.confidence,
      distance: nearestQuarter.distance
    };
  }

  // Aucune solution trouvée
  return {
    source: 'none',
    quarter: null,
    city: city,
    confidence: 'none'
  };
};