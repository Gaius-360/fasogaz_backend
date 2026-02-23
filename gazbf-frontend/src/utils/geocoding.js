// ==========================================
// FICHIER: src/utils/geocoding.js
// Service de géocodage inversé (GPS → Adresse)
// ==========================================

/**
 * Obtenir l'adresse complète à partir des coordonnées GPS
 * Utilise l'API Nominatim d'OpenStreetMap (gratuite)
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>} Informations d'adresse
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'fr', // Résultats en français
        'User-Agent': 'YourAppName/1.0' // Obligatoire pour Nominatim
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la géolocalisation inversée');
    }

    const data = await response.json();

    // Extraire les informations pertinentes
    const address = data.address || {};
    
    // Déterminer le quartier (plusieurs possibilités selon la région)
    const quarter = 
      address.suburb ||           // Quartier
      address.neighbourhood ||    // Voisinage
      address.hamlet ||           // Hameau
      address.quarter ||          // Quartier alternatif
      address.city_district ||    // District
      address.residential ||      // Zone résidentielle
      address.road ||             // Rue (fallback)
      'Quartier non identifié';

    const city = 
      address.city || 
      address.town || 
      address.village || 
      address.municipality ||
      'Ouagadougou'; // Valeur par défaut

    return {
      success: true,
      quarter: quarter,
      city: city,
      fullAddress: data.display_name || `${quarter}, ${city}`,
      details: {
        road: address.road || '',
        suburb: address.suburb || '',
        neighbourhood: address.neighbourhood || '',
        postcode: address.postcode || '',
        country: address.country || 'Burkina Faso'
      },
      raw: address // Données brutes pour debug
    };

  } catch (error) {
    console.error('❌ Erreur géocodage inversé:', error);
    return {
      success: false,
      error: error.message,
      quarter: null,
      city: null
    };
  }
};

/**
 * Obtenir uniquement le quartier à partir des coordonnées GPS
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>} Nom du quartier
 */
export const getQuarterFromCoordinates = async (latitude, longitude) => {
  const result = await reverseGeocode(latitude, longitude);
  return result.success ? result.quarter : null;
};

/**
 * Valider si les coordonnées sont dans une ville supportée
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object>}
 */
export const validateLocationInSupportedCity = async (latitude, longitude) => {
  const result = await reverseGeocode(latitude, longitude);
  
  if (!result.success) {
    return {
      valid: false,
      message: 'Impossible de vérifier votre localisation'
    };
  }

  const supportedCities = ['ouagadougou', 'bobo-dioulasso', 'bobo dioulasso'];
  const cityLower = result.city.toLowerCase();
  
  const isSupported = supportedCities.some(city => 
    cityLower.includes(city) || city.includes(cityLower)
  );

  return {
    valid: isSupported,
    city: result.city,
    quarter: result.quarter,
    message: isSupported 
      ? `Localisation valide : ${result.quarter}, ${result.city}`
      : `Désolé, nous n'opérons pas encore dans ${result.city}`
  };
};