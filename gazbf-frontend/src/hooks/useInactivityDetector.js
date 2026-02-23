// ==========================================
// FICHIER: src/hooks/useInactivityDetector.js
// Hook pour détecter l'inactivité utilisateur - VERSION CORRIGÉE
// ==========================================

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook pour détecter l'inactivité de l'utilisateur
 * @param {Object} options - Configuration
 * @param {number} options.timeout - Délai d'inactivité en ms (défaut: 30min)
 * @param {Function} options.onInactive - Callback appelé lors de l'inactivité
 * @param {boolean} options.enabled - Activer/désactiver la détection
 * @returns {Object} État de l'inactivité
 */
export const useInactivityDetector = (options = {}) => {
  const {
    timeout = 30 * 60 * 1000, // 30 minutes par défaut
    onInactive = null,
    enabled = true
  } = options;

  const [isInactive, setIsInactive] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  
  const timeoutIdRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  
  // ✅ CORRECTION : Stocker onInactive dans une ref pour éviter les re-renders
  const onInactiveRef = useRef(onInactive);
  
  useEffect(() => {
    onInactiveRef.current = onInactive;
  }, [onInactive]);

  /**
   * Réinitialiser le timer d'inactivité
   */
  const resetInactivityTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    setLastActivityTime(now);
    setIsInactive(false);

    // Effacer le timer précédent
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    // Créer un nouveau timer
    if (enabled) {
      timeoutIdRef.current = setTimeout(() => {
        console.log('⏱️ Inactivité détectée après', timeout / 1000 / 60, 'minutes');
        setIsInactive(true);
        
        // ✅ Utiliser la ref pour éviter la dépendance
        if (onInactiveRef.current) {
          onInactiveRef.current();
        }
      }, timeout);
    }
  }, [timeout, enabled]); // ✅ CORRECTION : Retirer onInactive des dépendances

  /**
   * Événements à surveiller pour détecter l'activité
   */
  useEffect(() => {
    if (!enabled) {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      return;
    }

    // Liste des événements qui indiquent une activité utilisateur
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ];

    // Handler d'événement optimisé avec debounce
    let debounceTimer;
    const handleActivity = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        resetInactivityTimer();
      }, 1000); // Debounce de 1 seconde
    };

    // Ajouter les listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Démarrer le timer initial
    resetInactivityTimer();

    // Cleanup
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, resetInactivityTimer]); // ✅ CORRECTION : Dépendances correctes

  /**
   * Calculer le temps restant avant inactivité
   */
  const getTimeUntilInactive = useCallback(() => {
    const elapsed = Date.now() - lastActivityRef.current;
    const remaining = Math.max(0, timeout - elapsed);
    return remaining;
  }, [timeout]);

  /**
   * Obtenir le temps écoulé depuis la dernière activité
   */
  const getTimeSinceLastActivity = useCallback(() => {
    return Date.now() - lastActivityRef.current;
  }, []);

  return {
    isInactive,                    // L'utilisateur est inactif
    lastActivityTime,              // Timestamp de la dernière activité
    resetInactivityTimer,          // Fonction pour réinitialiser manuellement
    getTimeUntilInactive,          // Temps restant avant inactivité (ms)
    getTimeSinceLastActivity       // Temps depuis dernière activité (ms)
  };
};

export default useInactivityDetector;