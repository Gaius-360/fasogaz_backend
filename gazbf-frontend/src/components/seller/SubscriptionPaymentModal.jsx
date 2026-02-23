// ==========================================
// FICHIER: src/components/seller/SubscriptionPaymentModal.jsx
// ==========================================

import React, { useState } from 'react';
import { X, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { usePayment } from '../../hooks/usePayment';
import Button from '../common/Button';

const SubscriptionPaymentModal = ({ plan, onClose }) => {
  const { loading, error, initiatePayment } = usePayment();
  const [accepted, setAccepted] = useState(false);

  const handlePayment = async () => {
    if (!accepted) {
      alert('Veuillez accepter les conditions');
      return;
    }

    try {
      await initiatePayment(plan.price, 'subscription', {
        planType: plan.type,
        duration: plan.duration
      });
      // La redirection vers LigdiCash se fera automatiquement
    } catch (err) {
      console.error('Erreur paiement:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Paiement</h2>
              <p className="text-sm text-gray-600">Abonnement {plan.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Récapitulatif */}
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6 mb-6">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Montant à payer</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">
              {new Intl.NumberFormat('fr-FR').format(plan.price)} FCFA
            </p>
            <p className="text-sm text-gray-600">
              Abonnement {plan.duration} jours
            </p>
          </div>
        </div>

        {/* Informations */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <div className="w-1 h-1 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
            <p>Paiement sécurisé via LigdiCash</p>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <div className="w-1 h-1 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
            <p>Méthodes: Orange Money, Moov Money</p>
          </div>
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <div className="w-1 h-1 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
            <p>Activation immédiate après paiement</p>
          </div>
        </div>

        {/* Mode simulation */}
        {process.env.REACT_APP_LIGDICASH_SIMULATION === 'true' && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900 mb-1">
                  🧪 Mode Test Activé
                </p>
                <p className="text-yellow-800">
                  Aucun paiement réel ne sera effectué. Vous pourrez simuler le résultat.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conditions */}
        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600">
            J'accepte les{' '}
            <a href="/terms" className="text-primary-600 hover:underline">
              conditions générales
            </a>
            {' '}et la{' '}
            <a href="/privacy" className="text-primary-600 hover:underline">
              politique de confidentialité
            </a>
          </span>
        </label>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handlePayment}
            className="flex-1"
            disabled={loading || !accepted}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Traitement...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Payer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPaymentModal;