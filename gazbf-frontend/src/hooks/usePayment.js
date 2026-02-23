// ==========================================
// FICHIER: src/hooks/usePayment.js
// Version utilisant api.payments
// ==========================================

import { useState } from 'react';
import { api } from '../api/apiSwitch';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initier un paiement et rediriger vers LigdiCash
   */
  const initiatePayment = async (amount, type, metadata = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('💳 Initiation paiement:', { amount, type, metadata });

      // ✅ Utiliser api.payments.initiatePayment
      const response = await api.payments.initiatePayment({
        amount,
        type,
        metadata
      });

      if (response?.success && response.data) {
        console.log('✅ Paiement initié:', response.data);

        if (response.data.isSimulation) {
          console.log('🧪 Mode SIMULATION activé');
        }

        // Rediriger vers la page de paiement
        window.location.href = response.data.paymentUrl;
        
        return response.data;
      } else {
        throw new Error(response?.message || 'Erreur lors de l\'initiation du paiement');
      }
    } catch (err) {
      console.error('❌ Erreur paiement:', err);
      const errorMessage = err.message || 'Erreur lors du paiement';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Vérifier le statut d'une transaction
   */
  const checkPaymentStatus = async (transactionNumber) => {
    try {
      // ✅ Utiliser api.payments.checkStatus
      const response = await api.payments.checkStatus(transactionNumber);
      
      if (response?.success) {
        return response.data;
      }
      
      throw new Error('Impossible de vérifier le statut');
    } catch (err) {
      console.error('❌ Erreur vérification statut:', err);
      throw err;
    }
  };

  /**
   * Réinitialiser l'erreur
   */
  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    initiatePayment,
    checkPaymentStatus,
    clearError
  };
};

export default usePayment;