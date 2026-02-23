// ==========================================
// FICHIER: src/components/common/TrackingNotification.jsx
// Notification pour les événements de tracking GPS
// ==========================================

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Clock, Battery, Navigation } from 'lucide-react';

/**
 * Composant de notification pour les événements de tracking
 */
const TrackingNotification = ({ 
  reason, 
  onClose, 
  onReactivate,
  autoHideDuration = 10000 // 10 secondes par défaut
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!autoHideDuration) return;

    const startTime = Date.now();
    const interval = 100; // Mise à jour toutes les 100ms

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / autoHideDuration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        handleClose();
      }
    }, interval);

    return () => clearInterval(progressTimer);
  }, [autoHideDuration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // Délai pour l'animation
  };

  const handleReactivate = () => {
    if (onReactivate) {
      onReactivate();
    }
    handleClose();
  };

  if (!reason) return null;

  const getIconAndColor = () => {
    switch (reason.type) {
      case 'inactivity':
        return {
          Icon: Clock,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          iconColor: 'text-amber-600',
          iconBg: 'bg-amber-100',
          progressColor: 'bg-amber-500'
        };
      case 'battery':
        return {
          Icon: Battery,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          progressColor: 'bg-red-500'
        };
      case 'background':
        return {
          Icon: AlertCircle,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          progressColor: 'bg-blue-500'
        };
      default:
        return {
          Icon: Navigation,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          iconBg: 'bg-gray-100',
          progressColor: 'bg-gray-500'
        };
    }
  };

  const { Icon, bgColor, borderColor, iconColor, iconBg, progressColor } = getIconAndColor();

  return (
    <div
      className={`fixed top-4 right-4 max-w-md w-full z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`${bgColor} border-2 ${borderColor} rounded-xl shadow-lg overflow-hidden`}>
        {/* Barre de progression */}
        <div className="h-1 bg-gray-200">
          <div
            className={`h-full ${progressColor} transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icône */}
            <div className={`${iconBg} rounded-full p-2 flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {reason.icon} Suivi GPS arrêté
                  </h3>
                  <p className="text-sm text-gray-700">
                    {reason.message}
                  </p>
                </div>

                {/* Bouton fermer */}
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleReactivate}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Navigation className="h-4 w-4 inline mr-1" />
                  Réactiver
                </button>
                <button
                  onClick={handleClose}
                  className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Ignorer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingNotification;