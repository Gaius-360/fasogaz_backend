// ==========================================
// FICHIER: src/components/common/OrderExpirationTimer.jsx
// Composant pour afficher le temps restant avant expiration
// ==========================================
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

const OrderExpirationTimer = ({ expiresAt, onExpired }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!expiresAt) return null;

      const now = new Date();
      const expiration = new Date(expiresAt);
      const diff = expiration - now;

      if (diff <= 0) {
        if (onExpired) onExpired();
        return null;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Définir les niveaux d'urgence
      setIsUrgent(hours < 6);
      setIsCritical(hours < 2);

      return { hours, minutes, total: diff };
    };

    // Calcul initial
    const remaining = calculateTimeRemaining();
    setTimeRemaining(remaining);

    // Mise à jour toutes les minutes
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  if (!timeRemaining) return null;

  const { hours, minutes } = timeRemaining;

  // Couleurs selon l'urgence
  const getBgColor = () => {
    if (isCritical) return 'from-red-50 to-red-100 border-red-300';
    if (isUrgent) return 'from-orange-50 to-orange-100 border-orange-300';
    return 'from-yellow-50 to-yellow-100 border-yellow-300';
  };

  const getTextColor = () => {
    if (isCritical) return 'text-red-800';
    if (isUrgent) return 'text-orange-800';
    return 'text-yellow-800';
  };

  const getIconColor = () => {
    if (isCritical) return 'text-red-600';
    if (isUrgent) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getMessage = () => {
    if (isCritical) {
      return '🚨 URGENT: Cette commande expire très bientôt !';
    }
    if (isUrgent) {
      return '⚠️ Attention: Cette commande va bientôt expirer';
    }
    return 'Temps restant pour répondre';
  };

  return (
    <div className={`bg-gradient-to-br ${getBgColor()} border-2 rounded-xl p-4 mb-4 ${
      isCritical ? 'animate-pulse' : ''
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 bg-white rounded-lg ${isCritical ? 'animate-bounce' : ''}`}>
          {isCritical ? (
            <AlertTriangle className={`h-5 w-5 ${getIconColor()}`} />
          ) : (
            <Clock className={`h-5 w-5 ${getIconColor()}`} />
          )}
        </div>
        
        <div className="flex-1">
          <p className={`text-sm font-bold ${getTextColor()} mb-2`}>
            {getMessage()}
          </p>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className={`text-3xl font-bold ${getTextColor()}`}>
                {hours}
              </p>
              <p className="text-xs text-gray-600 font-medium">heures</p>
            </div>
            
            <div className={`text-2xl font-bold ${getTextColor()}`}>:</div>
            
            <div className="text-center">
              <p className={`text-3xl font-bold ${getTextColor()}`}>
                {minutes.toString().padStart(2, '0')}
              </p>
              <p className="text-xs text-gray-600 font-medium">minutes</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-300">
            <p className="text-xs text-gray-700">
              {isCritical ? (
                <span className="font-bold">
                  ⚠️ Acceptez ou refusez maintenant pour éviter l'annulation automatique !
                </span>
              ) : (
                <>
                  Expiration le{' '}
                  <span className="font-bold">
                    {new Date(expiresAt).toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderExpirationTimer;