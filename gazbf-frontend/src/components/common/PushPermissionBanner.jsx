// ==========================================
// FICHIER: src/components/common/PushPermissionBanner.jsx
// Bannière affichée après login pour inciter à activer les notifs
// ==========================================

import React, { useState, useEffect } from 'react';
import { BellRing, X, ChevronRight } from 'lucide-react';
import usePushNotifications from '../../hooks/usePushNotifications';

const STORAGE_KEY = 'fasogaz_push_banner_dismissed';
const REMIND_DAYS = 7;

const PushPermissionBanner = () => {
  const [show, setShow] = useState(false);
  const { isSupported, permission, isSubscribed, isLoading, subscribe } = usePushNotifications();

  useEffect(() => {
    // Ne pas afficher si : pas supporté, déjà abonné, permission refusée
    if (!isSupported || isSubscribed || permission === 'denied' || permission === 'granted') {
      return;
    }

    // Vérifier si l'utilisateur a déjà dismissé récemment
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { dismissedAt } = JSON.parse(raw);
        const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
        if (daysSince < REMIND_DAYS) return;
      }
    } catch {
      // ignore
    }

    // Afficher après 2s (laisser la page se charger)
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed, permission]);

  const handleDismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissedAt: Date.now() }));
    } catch {
      // ignore
    }
  };

  const handleActivate = async () => {
    const ok = await subscribe();
    if (ok) setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-3 right-3 lg:left-auto lg:right-6 lg:w-96 z-40 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-primary-100 overflow-hidden">
        {/* Barre colorée top */}
        <div className="h-1 bg-gradient-to-r from-primary-500 to-secondary-500" />

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icône animée */}
            <div className="p-2.5 bg-primary-50 rounded-xl flex-shrink-0">
              <BellRing className="h-5 w-5 text-primary-600 animate-wiggle" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold text-neutral-900 text-sm">
                Activez les alertes commandes
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                Soyez notifié immédiatement des nouvelles commandes, même quand l'app est fermée.
              </p>

              {/* Boutons */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleActivate}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60"
                >
                  <BellRing className="h-3.5 w-3.5" />
                  {isLoading ? 'Activation...' : 'Activer maintenant'}
                  <ChevronRight className="h-3 w-3" />
                </button>

                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-neutral-500 text-xs hover:text-neutral-700 font-medium rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </div>

            {/* Fermer */}
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-neutral-100 rounded-lg flex-shrink-0"
            >
              <X className="h-4 w-4 text-neutral-400" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-10deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default PushPermissionBanner;