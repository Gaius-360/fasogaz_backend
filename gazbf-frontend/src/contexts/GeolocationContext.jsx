// ==========================================
// FICHIER: src/contexts/GeolocationContext.jsx
// Contexte global pour la géolocalisation avec désactivation automatique
// ==========================================

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useInactivityDetector } from '../hooks/useInactivityDetector';

const GeolocationContext = createContext(null);

export const useGeolocationContext = () => {
  const context = useContext(GeolocationContext);
  if (!context) {
    throw new Error('useGeolocationContext doit être utilisé dans GeolocationProvider');
  }
  return context;
};

export const GeolocationProvider = ({ children }) => {
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [onPositionChangeCallback, setOnPositionChangeCallback] = useState(null);
  const [autoStopReason, setAutoStopReason] = useState(null);
  
  // Ref pour stocker le callback de notification
  const onAutoStopCallbackRef = useRef(null);

  /**
   * Gérer l'arrêt automatique du tracking
   */
  const handleAutoStop = useCallback((reason) => {
    console.log('🛑 Arrêt automatique du tracking GPS:', reason);
    
    setTrackingEnabled(false);
    setOnPositionChangeCallback(null);
    setAutoStopReason(reason);

    // Notifier l'application via callback si défini
    if (onAutoStopCallbackRef.current) {
      onAutoStopCallbackRef.current(reason);
    }
  }, []);

  /**
   * Détection d'inactivité utilisateur
   * Arrêt automatique après 30 minutes d'inactivité
   */
  const { isInactive, getTimeSinceLastActivity } = useInactivityDetector({
    timeout: 30 * 60 * 1000, // 30 minutes
    enabled: trackingEnabled,
    onInactive: () => {
      handleAutoStop({
        type: 'inactivity',
        message: 'Suivi GPS arrêté après 30 minutes d\'inactivité',
        icon: '⏱️'
      });
    }
  });

  // Hook de géolocalisation
  const {
    position,
    error,
    loading,
    isTracking,
    getCurrentPosition,
    startTracking,
    stopTracking
  } = useGeolocation({
    enabled: trackingEnabled,
    updateInterval: 30000, // 30 secondes
    minDistanceChange: 50,  // 50 mètres
    onPositionChange: onPositionChangeCallback
  });

  /**
   * Activer le suivi avec callback optionnel
   */
  const enableTracking = useCallback((callback) => {
    console.log('🎯 Activation du suivi GPS');
    
    if (callback) {
      setOnPositionChangeCallback(() => callback);
    }
    
    setTrackingEnabled(true);
    setAutoStopReason(null); // Réinitialiser la raison d'arrêt
  }, []);

  /**
   * Désactiver le suivi manuellement
   */
  const disableTracking = useCallback(() => {
    console.log('🛑 Désactivation manuelle du suivi GPS');
    
    setTrackingEnabled(false);
    setOnPositionChangeCallback(null);
    setAutoStopReason(null);
  }, []);

  /**
   * Définir le callback appelé lors d'un arrêt automatique
   */
  const setOnAutoStop = useCallback((callback) => {
    onAutoStopCallbackRef.current = callback;
  }, []);

  /**
   * Obtenir des statistiques sur le tracking
   */
  const getTrackingStats = useCallback(() => {
    return {
      isTracking,
      isInactive,
      timeSinceLastActivity: getTimeSinceLastActivity(),
      lastPosition: position,
      autoStopReason
    };
  }, [isTracking, isInactive, getTimeSinceLastActivity, position, autoStopReason]);

  const value = {
    // État
    position,
    error,
    loading,
    isTracking,
    trackingEnabled,
    isInactive,
    autoStopReason,
    
    // Actions
    enableTracking,
    disableTracking,
    getCurrentPosition,
    setOnAutoStop,
    
    // Utilitaires
    getTrackingStats,
    setPositionChangeCallback: setOnPositionChangeCallback
  };

  return (
    <GeolocationContext.Provider value={value}>
      {children}
    </GeolocationContext.Provider>
  );
};

export default GeolocationContext;