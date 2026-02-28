// ==========================================
// FICHIER: utils/locationValidator.js (BACKEND)
// ✅ Validation GPS côté serveur — double vérification sécurisée
// ==========================================

/**
 * Coordonnées et rayons des villes autorisées
 */
const SUPPORTED_CITIES = {
  'Ouagadougou': { lat: 12.3647, lon: -1.5339, radiusKm: 30 },
  'Bobo-Dioulasso': { lat: 11.1771, lon: -4.2979, radiusKm: 25 }
};

/**
 * Formule Haversine — distance entre deux coordonnées GPS (km)
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Valider que les coordonnées GPS correspondent bien à la ville déclarée
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} city  — "Ouagadougou" ou "Bobo-Dioulasso"
 * @returns {{ valid: boolean, distance: number|null, message: string }}
 */
const validateLocationForCity = (latitude, longitude, city) => {
  // Valider les coordonnées
  if (
    latitude === undefined || latitude === null ||
    longitude === undefined || longitude === null ||
    isNaN(Number(latitude)) || isNaN(Number(longitude))
  ) {
    return { valid: false, distance: null, message: 'Coordonnées GPS manquantes ou invalides.' };
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { valid: false, distance: null, message: 'Coordonnées GPS hors limites.' };
  }

  const cityConfig = SUPPORTED_CITIES[city];
  if (!cityConfig) {
    return { valid: false, distance: null, message: `Ville "${city}" non supportée.` };
  }

  const distance = haversineDistance(lat, lon, cityConfig.lat, cityConfig.lon);
  const distanceRounded = Math.round(distance * 10) / 10;

  if (distance <= cityConfig.radiusKm) {
    return {
      valid: true,
      distance: distanceRounded,
      message: `Position confirmée (${distanceRounded} km de ${city}).`
    };
  }

  return {
    valid: false,
    distance: distanceRounded,
    message: `Votre position GPS (${distanceRounded} km) ne correspond pas à la ville "${city}". FasoGaz opère uniquement à Ouagadougou et Bobo-Dioulasso.`
  };
};

module.exports = { validateLocationForCity, SUPPORTED_CITIES };


