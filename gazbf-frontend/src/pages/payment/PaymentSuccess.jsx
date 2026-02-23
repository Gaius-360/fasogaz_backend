// ==========================================
// FICHIER: src/pages/payment/PaymentSuccess.jsx
// ==========================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { usePayment } from '../../hooks/usePayment';
import Button from '../../components/common/Button';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkPaymentStatus } = usePayment();
  const [status, setStatus] = useState('checking');
  const [transaction, setTransaction] = useState(null);

  const transactionNumber = searchParams.get('transaction');

  useEffect(() => {
    if (transactionNumber) {
      verifyPayment();
    } else {
      setStatus('error');
    }
  }, [transactionNumber]);

  const verifyPayment = async () => {
    try {
      const result = await checkPaymentStatus(transactionNumber);
      setTransaction(result);
      
      if (result.status === 'completed') {
        setStatus('success');
      } else if (result.status === 'pending') {
        setStatus('pending');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error('Erreur vérification:', err);
      setStatus('error');
    }
  };

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-subtle">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Paiement Réussi ! 🎉
            </h1>
            
            <p className="text-gray-600 mb-6">
              Votre paiement a été traité avec succès. Votre accès a été activé.
            </p>

            {transaction && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Transaction</span>
                  <span className="text-sm font-mono text-gray-900">
                    {transactionNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Montant</span>
                  <span className="text-sm font-bold text-gray-900">
                    {new Intl.NumberFormat('fr-FR').format(transaction.amount)} FCFA
                  </span>
                </div>
              </div>
            )}

            <Button
              variant="primary"
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-12 w-12 text-yellow-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Paiement en cours...
          </h1>
          
          <p className="text-gray-600 mb-6">
            Votre paiement est en cours de traitement. Veuillez patienter.
          </p>

          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="w-full"
          >
            Retour
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;