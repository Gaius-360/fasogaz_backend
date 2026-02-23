// ==========================================
// FICHIER: src/utils/helpers.js
// ✅ FIX: Importer userApi
// ==========================================

import { correctQuarterName, cleanAndValidateQuarterName } from '../data/quarterNameCorrections.js';
// ✅ AJOUT: Importer userApi
import userApi from '../api/apiSwitch';

/**
 * Formate un nombre en prix FCFA
 */
export const formatPrice = (price) => {
  if (!price && price !== 0) return '0 FCFA';
  return `${Math.round(price).toLocaleString('fr-FR')} FCFA`;
};

/**
 * Formate une distance en km ou m
 */
export const formatDistance = (distance) => {
  if (!distance && distance !== 0) return '';
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
};

/**
 * Formate une date en format lisible
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('fr-FR', options);
};

/**
 * Formate une date avec l'heure
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString('fr-FR', options);
};

/**
 * Formate une durée relative (il y a X temps)
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'À l\'instant';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} min`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours}h`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Il y a ${diffInDays}j`;
  }
  
  return formatDate(dateString);
};

/**
 * ✅ GÉOCODAGE INVERSÉ via backend (évite CORS)
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    console.log(`📍 Géocodage inversé via backend: ${latitude}, ${longitude}`);

    // ✅ Appeler le backend au lieu de Nominatim directement
    const response = await userApi.get('/geocoding/multi-zoom', {
      params: { lat: latitude, lon: longitude }
    });

    if (!response.success || !response.data) {
      console.warn('⚠️ Aucune donnée de géocodage');
      return {
        success: true,
        quarter: null,
        city: 'Ouagadougou',
        fullAddress: 'Ouagadougou',
        source: 'backend',
        warning: 'Aucun quartier trouvé'
      };
    }

    const data = response.data;
    const address = data.address || {};

    // ✅ Extraire et corriger le quartier
    const rawQuarter = 
      address.suburb ||
      address.neighbourhood ||
      address.hamlet ||
      address.quarter ||
      address.city_district ||
      address.residential ||
      null;

    const quarter = rawQuarter ? cleanAndValidateQuarterName(rawQuarter) : null;

    if (quarter && rawQuarter !== quarter) {
      console.log(`🔧 Quartier corrigé: "${rawQuarter}" → "${quarter}"`);
    }

    // Extraire la ville
    const city = 
      address.city || 
      address.town || 
      address.village || 
      address.municipality ||
      'Ouagadougou';

    console.log('✅ Géocodage réussi:', {
      quarter,
      city,
      zoom: data.zoom,
      source: 'backend'
    });

    return {
      success: true,
      quarter,
      city,
      fullAddress: data.display_name || `${quarter || ''}, ${city}`.trim(),
      details: {
        road: address.road || '',
        suburb: address.suburb || '',
        neighbourhood: address.neighbourhood || '',
        city_district: address.city_district || '',
        postcode: address.postcode || '',
        country: address.country || 'Burkina Faso',
        zoom: data.zoom
      },
      raw: address,
      source: 'backend'
    };

  } catch (error) {
    console.error('❌ Erreur géocodage backend:', error);
    
    return {
      success: false,
      error: error.message,
      quarter: null,
      city: null,
      source: 'error'
    };
  }
};

/**
 * ✅ OBTENIR LA POSITION GÉOGRAPHIQUE ACTUELLE
 */
export const getCurrentPosition = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n\'est pas supportée par votre navigateur'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        console.log('📍 Position GPS obtenue:', { latitude, longitude });

        try {
          // ✅ Utiliser le backend pour le géocodage
          const locationData = await reverseGeocode(latitude, longitude);
          
          if (locationData.success) {
            resolve({
              latitude,
              longitude,
              accuracy: position.coords.accuracy,
              quarter: locationData.quarter,
              city: locationData.city,
              fullAddress: locationData.fullAddress,
              details: locationData.details,
              source: 'backend',
              warning: locationData.warning || null
            });
          } else {
            console.error('❌ Échec géocodage backend');
            resolve({
              latitude,
              longitude,
              accuracy: position.coords.accuracy,
              quarter: null,
              city: null,
              geocodingError: locationData.error || 'Erreur de géocodage',
              source: 'error'
            });
          }

        } catch (geocodeError) {
          console.error('❌ Erreur géocodage:', geocodeError);
          
          resolve({
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
            quarter: null,
            city: null,
            geocodingError: geocodeError.message,
            source: 'error'
          });
        }
      },
      (error) => {
        let message = 'Impossible d\'obtenir votre position';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Vous avez refusé l\'accès à votre position. Veuillez activer la géolocalisation dans les paramètres de votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Position non disponible';
            break;
          case error.TIMEOUT:
            message = 'La demande a expiré. Veuillez réessayer.';
            break;
        }
        
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Ouvre l'application de navigation vers un lieu
 */
export const openNavigationToLocation = (latitude, longitude, placeName, userLocation = null) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  let navigationUrl;
  
  if (userLocation && userLocation.latitude && userLocation.longitude) {
    if (isIOS) {
      navigationUrl = `http://maps.apple.com/?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${latitude},${longitude}&dirflg=d`;
    } else if (isAndroid) {
      navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${latitude},${longitude}&travelmode=driving`;
    } else {
      navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${latitude},${longitude}&travelmode=driving`;
    }
  } else {
    if (isIOS) {
      navigationUrl = `http://maps.apple.com/?q=${encodeURIComponent(placeName)}&ll=${latitude},${longitude}`;
    } else {
      navigationUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }
  }
  
  console.log('🗺️ Ouverture navigation:', {
    url: navigationUrl,
    destination: placeName,
    coords: `${latitude}, ${longitude}`,
    hasUserLocation: !!userLocation
  });
  
  window.open(navigationUrl, '_blank');
};

/**
 * Calculer la distance entre deux points GPS (en km)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10;
};

const toRad = (value) => {
  return value * Math.PI / 180;
};

/**
 * Tronquer un texte avec ellipse
 */
export const truncate = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Obtenir les initiales d'un nom
 */
export const getInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
};

/**
 * Valider un numéro de téléphone burkinabè
 */
export const isValidPhoneNumber = (phone) => {
  const regex = /^(\+?226|0)?[567]\d{7}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

/**
 * Formater un numéro de téléphone
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('226')) {
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('0')) {
    return '+226' + cleaned.substring(1);
  }
  
  return '+226' + cleaned;
};

/**
 * Copier du texte dans le presse-papier
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erreur copie:', error);
    return false;
  }
};

/**
 * Générer une couleur aléatoire
 */
export const getRandomColor = () => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Convertir un fichier en base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

/**
 * Debounce une fonction
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Vérifier si un objet est vide
 */
export const isEmpty = (obj) => {
  return Object.keys(obj).length === 0;
};

/**
 * Obtenir un message d'erreur lisible
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Une erreur est survenue';
};

// ✅ EXPORT: Fonctions de correction pour utilisation externe
export { correctQuarterName, cleanAndValidateQuarterName } from '../data/quarterNameCorrections.js';