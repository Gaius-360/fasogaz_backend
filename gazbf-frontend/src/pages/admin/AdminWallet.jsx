// ==========================================
// FICHIER: src/pages/admin/AdminWallet.jsx
// VERSION CORRIGÉE - Gestion correcte de la structure withdrawals
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  Download,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { formatPrice } from '../../utils/helpers';
import useAdmin from '../../hooks/useAdmin';

const AdminWallet = () => {
  const navigate = useNavigate();
  
  const {
    loading,
    error,
    clearError,
    getWalletBalance,
    getWithdrawals,
    requestWithdrawal
  } = useAdmin();

  const [walletData, setWalletData] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]); // ✅ Initialisé comme tableau
  const [alert, setAlert] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    method: 'moov_money',
    phone: '',
    accountName: ''
  });

  // ==========================================
  // CHARGEMENT INITIAL
  // ==========================================
  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const [balanceRes, withdrawalsRes] = await Promise.all([
        getWalletBalance(),
        getWithdrawals()
      ]);

      console.log('📊 Réponse balance:', balanceRes);
      console.log('📊 Réponse withdrawals:', withdrawalsRes);

      if (balanceRes?.success) {
        setWalletData(balanceRes.data);
      }
      
      if (withdrawalsRes?.success) {
        // ✅ CORRECTION: Extraire le tableau withdrawals de la réponse
        const withdrawalsArray = withdrawalsRes.data?.withdrawals || [];
        console.log('✅ Withdrawals extraits:', withdrawalsArray);
        setWithdrawals(withdrawalsArray);
      }
    } catch (err) {
      console.error('❌ Erreur chargement:', err);
      setAlert({
        type: 'error',
        message: err.message || 'Erreur lors du chargement'
      });
    }
  };

  // ==========================================
  // GESTION FORMULAIRE
  // ==========================================
  const handleWithdrawChange = (e) => {
    const { name, value } = e.target;
    setWithdrawForm(prev => ({ ...prev, [name]: value }));
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();

    const amount = parseFloat(withdrawForm.amount);
    
    // Validation
    if (amount < 50000) {
      setAlert({
        type: 'error',
        message: 'Le montant minimum est de 50,000 FCFA'
      });
      return;
    }

    if (walletData?.overview?.availableBalance && amount > walletData.overview.availableBalance) {
      setAlert({
        type: 'error',
        message: 'Solde insuffisant'
      });
      return;
    }

    try {
      const response = await requestWithdrawal(
        amount,
        withdrawForm.method,
        {
          phone: withdrawForm.phone,
          accountName: withdrawForm.accountName
        }
      );

      if (response?.success) {
        setAlert({
          type: 'success',
          message: 'Demande de retrait envoyée. Traitement sous 24-48h.'
        });
        setShowWithdrawModal(false);
        setWithdrawForm({
          amount: '',
          method: 'moov_money',
          phone: '',
          accountName: ''
        });
        loadWalletData();
      }
    } catch (err) {
      console.error('❌ Erreur retrait:', err);
      setAlert({
        type: 'error',
        message: err.message || 'Erreur lors de la demande de retrait'
      });
    }
  };

  // ==========================================
  // CALCULS
  // ==========================================
  const fees = 1000;
  const netAmount = withdrawForm.amount 
    ? parseFloat(withdrawForm.amount) - fees 
    : 0;

  // ✅ Extraction sécurisée des valeurs du solde
  const availableBalance = walletData?.overview?.availableBalance || walletData?.balance || 0;
  const totalRevenue = walletData?.overview?.totalRevenue || walletData?.totalRevenue || 0;
  const thisMonthRevenue = walletData?.thisMonth?.total || walletData?.thisMonth || 0;

  // ==========================================
  // LOADING STATE
  // ==========================================
  if (loading && !walletData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Wallet className="h-6 w-6 text-primary-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Portefeuille
                  </h1>
                  <p className="text-sm text-gray-500">Gestion financière</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Alertes */}
        {(alert || error) && (
          <Alert
            type={alert?.type || 'error'}
            message={alert?.message || error}
            onClose={() => {
              setAlert(null);
              clearError();
            }}
            className="mb-6"
          />
        )}

        {/* Solde principal */}
        <div className="bg-gradient-to-br from-primary-600 to-secondary-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-primary-100 mb-2">Solde Disponible</p>
              <p className="text-5xl font-bold">
                {formatPrice(availableBalance)}
              </p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Wallet className="h-8 w-8" />
            </div>
          </div>

          <Button
            variant="outline"
            className="bg-white text-primary-600 hover:bg-primary-50 border-white"
            onClick={() => setShowWithdrawModal(true)}
            disabled={!availableBalance || availableBalance < 50000}
          >
            <Download className="h-5 w-5 mr-2" />
            Demander un Retrait
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Revenus Totaux</span>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatPrice(totalRevenue)}
            </p>
            <p className="text-sm text-gray-500">Depuis le début</p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Ce Mois</span>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              {formatPrice(thisMonthRevenue)}
            </p>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('fr-FR', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Historique des retraits */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Historique des Retraits
          </h2>

          {/* ✅ CORRECTION: Vérification que withdrawals est bien un tableau */}
          {!Array.isArray(withdrawals) || withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun retrait effectué</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Méthode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Frais
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(withdrawal.createdAt || withdrawal.requestedAt || withdrawal.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatPrice(withdrawal.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {withdrawal.paymentMethod || withdrawal.method || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatPrice(withdrawal.fees || 1000)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          withdrawal.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : withdrawal.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : withdrawal.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {withdrawal.status === 'completed' ? '✓ Payé' :
                           withdrawal.status === 'pending' ? '⏳ En attente' :
                           withdrawal.status === 'processing' ? '🔄 En cours' :
                           '❌ Rejeté'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de retrait */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              💸 Retrait de Fonds
            </h3>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Solde disponible:</strong> {formatPrice(availableBalance)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Montant minimum: 50,000 FCFA
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant à retirer (FCFA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={withdrawForm.amount}
                  onChange={handleWithdrawChange}
                  min="50000"
                  step="1000"
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Méthode de retrait <span className="text-red-500">*</span>
                </label>
                <select
                  name="method"
                  value={withdrawForm.method}
                  onChange={handleWithdrawChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="orange_money">Orange Money</option>
                  <option value="moov_money">Moov Money</option>
                  <option value="telecel_money">Telecel Money</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={withdrawForm.phone}
                  onChange={handleWithdrawChange}
                  placeholder="+226 XX XX XX XX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du compte <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountName"
                  value={withdrawForm.accountName}
                  onChange={handleWithdrawChange}
                  placeholder="Nom et Prénom"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {withdrawForm.amount && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Montant demandé</span>
                    <span className="font-medium">{formatPrice(parseFloat(withdrawForm.amount))}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Frais de retrait</span>
                    <span className="font-medium">- {formatPrice(fees)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold text-gray-900">Montant net</span>
                    <span className="font-bold text-primary-600">{formatPrice(netAmount)}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500">
                ⏱️ Délai de traitement: 24-48 heures ouvrées
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  loading={loading}
                >
                  Confirmer le Retrait
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWallet;