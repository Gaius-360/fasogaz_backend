// ==========================================
// FICHIER: src/hooks/useSellerAccess.js
// Hook personnalisé pour gérer l'accès des revendeurs
// ==========================================
import { useState, useEffect } from 'react';
import { api } from '../api/apiSwitch';
import useAuthStore from '../store/authStore';

const useSellerAccess = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState({
    hasAccess: false,
    type: 'no_access',
    endDate: null,
    daysRemaining: 0,
    message: ''
  });
  const [pricingConfig, setPricingConfig] = useState({
    isActive: false,
    freeTrialDays: 0,
    plans: {}
  });

  useEffect(() => {
    checkAccess();
  }, [user]);

  const checkAccess = async () => {
    if (!user || user.role !== 'revendeur') {
      setAccessStatus({
        hasAccess: true,
        type: 'not_seller',
        endDate: null,
        daysRemaining: 0,
        message: ''
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1️⃣ Récupérer la configuration
      const configResponse = await api.pricing.getRevendeurConfig();
      if (configResponse?.success) {
        const config = configResponse.data;
        setPricingConfig(config);

        if (!config.isActive) {
          setAccessStatus({
            hasAccess: true,
            type: 'free_unlimited',
            endDate: null,
            daysRemaining: 0,
            message: 'Accès gratuit illimité'
          });
          setLoading(false);
          return;
        }
      }

      // 2️⃣ Récupérer le statut d'accès
      const statusResponse = await api.pricing.getAccessStatus();
      if (statusResponse?.success) {
        const status = statusResponse.data;

        // Normaliser les données pour le composant
        setAccessStatus({
          hasAccess: status.hasAccess,
          type: status.type,
          endDate: status.details?.endDate || null,
          daysRemaining: status.details?.daysRemaining || 0,
          message: status.message || ''
        });
      }

    } catch (error) {
      console.error('❌ Erreur vérification accès:', error);

      if (error.response?.status === 403) {
        setAccessStatus({
          hasAccess: false,
          type: 'no_access',
          endDate: null,
          daysRemaining: 0,
          message: error.response?.data?.message || 'Abonnement requis'
        });
      } else {
        setAccessStatus({
          hasAccess: true,
          type: 'error',
          endDate: null,
          daysRemaining: 0,
          message: 'Impossible de vérifier l\'accès'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshAccess = async () => {
    await checkAccess();
  };

  return {
    loading,
    accessStatus,
    pricingConfig,
    refreshAccess,
    hasAccess: accessStatus.hasAccess,
    needsSubscription: !accessStatus.hasAccess && pricingConfig.isActive
  };
};

export default useSellerAccess;
