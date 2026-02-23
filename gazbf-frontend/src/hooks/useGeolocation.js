// ==========================================
// FICHIER: src/hooks/useGeolocation.js
// Hook pour le suivi de position en temps réel
// ==========================================

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook pour suivre la position géographique en temps réel
 * @param {Object} options - Options de configuration
 * @param {boolean} options.enabled - Activer/désactiver le suivi
 * @param {number} options.updateInterval - Intervalle de mise à jour en ms (défaut: 30000 = 30s)
 * @param {number} options.minDistanceChange - Distance min de changement en mètres pour trigger update (défaut: 50m)
 * @returns {Object} État de géolocalisation
 */
export const useGeolocation = (options = {}) => {
  const {
    enabled = false,
    updateInterval = 30000, // 30 secondes par défaut
    minDistanceChange = 50, // 50 mètres minimum
    onPositionChange = null
  } = options;

  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);
  const intervalIdRef = useRef(null);

  /**
   * Calculer la distance entre deux points GPS (en mètres)
   */
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en mètres
  }, []);

  const toRad = (value) => value * Math.PI / 180;

  /**
   * Gérer une nouvelle position
   */
  const handlePosition = useCallback((geoPosition) => {
    const newPosition = {
      latitude: geoPosition.coords.latitude,
      longitude: geoPosition.coords.longitude,
      accuracy: geoPosition.coords.accuracy,
      timestamp: geoPosition.timestamp
    };

    // Vérifier si le changement de position est significatif
    if (lastPositionRef.current) {
      const distance = calculateDistance(
        lastPositionRef.current.latitude,
        lastPositionRef.current.longitude,
        newPosition.latitude,
        newPosition.longitude
      );

      // Si le déplacement est inférieur au seuil, ignorer
      if (distance < minDistanceChange) {
        console.log(`📍 Déplacement trop faible (${distance.toFixed(0)}m < ${minDistanceChange}m)`);
        return;
      }

      console.log(`📍 Déplacement significatif détecté: ${distance.toFixed(0)}m`);
    }

    lastPositionRef.current = newPosition;
    setPosition(newPosition);
    setError(null);
    setLoading(false);

    // Callback externe si fourni
    if (onPositionChange) {
      onPositionChange(newPosition);
    }
  }, [calculateDistance, minDistanceChange, onPositionChange]);

  /**
   * Gérer les erreurs de géolocalisation
   */
  const handleError = useCallback((geoError) => {
    let message = 'Erreur de géolocalisation';
    
    switch (geoError.code) {
      case geoError.PERMISSION_DENIED:
        message = 'Permission de géolocalisation refusée';
        break;
      case geoError.POSITION_UNAVAILABLE:
        message = 'Position non disponible';
        break;
      case geoError.TIMEOUT:
        message = 'Délai de géolocalisation dépassé';
        break;
      default:
        message = 'Erreur inconnue de géolocalisation';
    }
    
    console.error('❌ Erreur géolocalisation:', message);
    setError(message);
    setLoading(false);
    setIsTracking(false);
  }, []);

  /**
   * Obtenir la position actuelle (one-time)
   */
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      return Promise.reject(new Error('Géolocalisation non supportée'));
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePosition(pos);
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          handleError(err);
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, [handlePosition, handleError]);

  /**
   * Démarrer le suivi continu
   */
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Géolocalisation non supportée');
      return;
    }

    if (watchIdRef.current !== null) {
      console.log('⚠️ Suivi déjà actif');
      return;
    }

    console.log('🎯 Démarrage du suivi de position');
    setLoading(true);
    setIsTracking(true);

    // Méthode 1: watchPosition (temps réel)
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    // Méthode 2: Polling régulier (backup)
    // Certains navigateurs/OS ne déclenchent watchPosition qu'avec un grand déplacement
    intervalIdRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        handlePosition,
        () => {}, // Ignorer les erreurs du polling
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }, updateInterval);

  }, [handlePosition, handleError, updateInterval]);

  /**
   * Arrêter le suivi
   */
  const stopTracking = useCallback(() => {
    console.log('🛑 Arrêt du suivi de position');
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    setIsTracking(false);
    setLoading(false);
  }, []);

  /**
   * Effet : Démarrer/arrêter le suivi selon l'état 'enabled'
   */
  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }

    // Cleanup à la destruction du composant
    return () => {
      stopTracking();
    };
  }, [enabled, startTracking, stopTracking]);

  return {
    position,           // Position actuelle {latitude, longitude, accuracy, timestamp}
    error,              // Message d'erreur
    loading,            // Chargement initial
    isTracking,         // Suivi actif ou non
    getCurrentPosition, // Fonction pour obtenir position ponctuelle
    startTracking,      // Démarrer le suivi manuellement
    stopTracking        // Arrêter le suivi manuellement
  };
};

export default useGeolocation;