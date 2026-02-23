// ==========================================
// FICHIER: src/components/client/AccessPurchaseModal.jsx
// Modal d'achat d'accès avec paiement LigdiCash
// ✅ FIX: Utiliser import.meta.env au lieu de process.env
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, CreditCard, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../api/apiSwitch';
import { usePayment } from '../../hooks/usePayment';

const AccessPurchaseModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState(null);
  
  const modalRef = useRef();

  // Hook de paiement
  const { loading: paymentLoading, error: paymentError, initiatePayment, clearError } = usePayment();

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      const response = await api.access.getPricing();
      if (response?.success) {
        setPricing(response.data);
      }
    } catch (err) {
      console.error('Erreur chargement tarifs:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ NOUVEAU: Initier le paiement via LigdiCash
   */
  const handlePurchase = async () => {
    if (!pricing) {
      return;
    }

    clearError();

    try {
      console.log('💳 Lancement paiement accès 24h');

      const metadata = {
        duration: pricing.duration || 24,
        accessType: '24h'
      };

      // Initier le paiement (redirection automatique vers LigdiCash)
      await initiatePayment(pricing.price, 'access', metadata);

      // Note: Le code après ne sera jamais exécuté car l'utilisateur sera redirigé
      
    } catch (error) {
      console.error('❌ Erreur achat accès:', error);
      // L'erreur est déjà gérée par le hook usePayment
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // ✅ FIX: Utiliser import.meta.env au lieu de process.env
  const isSimulationMode = import.meta.env.VITE_LIGDICASH_SIMULATION === 'true';

  if (loading) {
    return (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl max-w-md w-full animate-scale-in max-h-[90vh] overflow-y-auto"
      >
        {/* Header avec gradient */}
        <div className="gradient-gazbf p-6 rounded-t-2xl">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Accès 24h</h2>
                <p className="text-sm text-white/90">Débloquez l'accès complet</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition p-2 hover:bg-white/20 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* ✅ Badge mode simulation */}
          {isSimulationMode && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-yellow-900 mb-1">🧪 Mode Test</p>
                  <p className="text-yellow-800">
                    Aucun paiement réel. Vous pourrez simuler le résultat.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info importante */}
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-neutral-900">
                <p className="font-bold mb-2">🔓 Accès illimité pendant 24h</p>
                <ul className="space-y-1">
                  <li>• Voir tous les numéros de téléphone</li>
                  <li>• Obtenir tous les itinéraires GPS</li>
                  <li>• Accéder aux détails complets</li>
                  <li>• Contacter autant de revendeurs que vous voulez</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Prix */}
          {pricing && (
            <div className="gradient-gazbf rounded-xl p-6 text-center text-white">
              <p className="text-sm mb-2 text-white/90">Prix de l'accès</p>
              <p className="text-4xl font-bold mb-2">{formatPrice(pricing.price)}</p>
              <p className="text-sm text-white/90">Valable {pricing.duration} heures</p>
            </div>
          )}

          {/* Info paiement LigdiCash */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-blue-900 mb-1">Paiement sécurisé</p>
                <p className="text-blue-800 mb-2">
                  Vous serez redirigé vers LigdiCash pour payer avec:
                </p>
                <div className="flex gap-3 text-xs text-blue-700">
                  <span>🟠 Orange Money</span>
                  <span>🔵 Moov Money</span>
                </div>
              </div>
            </div>
          </div>

          {/* Erreur */}
          {paymentError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-800 font-medium">{paymentError}</p>
              </div>
            </div>
          )}

          {/* Bouton d'achat */}
          <button
            onClick={handlePurchase}
            disabled={paymentLoading || !pricing}
            className="w-full px-6 py-4 gradient-gazbf text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-gazbf-lg"
          >
            {paymentLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Redirection...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Payer maintenant
              </>
            )}
          </button>

          <p className="text-xs text-center text-neutral-500">
            💡 Activation immédiate après paiement
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessPurchaseModal;