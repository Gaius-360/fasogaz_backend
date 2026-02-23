// ==========================================
// FICHIER: src/pages/admin/AdminPendingSellers.jsx
// VERSION SYNCHRONISÉE avec useAdmin hook
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { formatDateTime } from '../../utils/helpers';
import useAdmin from '../../hooks/useAdmin';

const AdminPendingSellers = () => {
  const navigate = useNavigate();
  
  // ✅ Utilisation du hook
  const {
    loading,
    error,
    clearError,
    getPendingSellers,
    validateSeller,
    rejectSeller
  } = useAdmin();

  const [pendingSellers, setPendingSellers] = useState([]);
  const [alert, setAlert] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPendingSellers();
  }, []);

  const loadPendingSellers = async () => {
    try {
      const response = await getPendingSellers();
      if (response?.success) {
        setPendingSellers(response.data);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Erreur lors du chargement'
      });
    }
  };

  const handleValidate = async (seller) => {
    setSelectedSeller(seller);
    setActionType('validate');
    setMessage(`Félicitations ! Votre profil ${seller.businessName} a été validé. Vous êtes maintenant visible dans votre zone.`);
  };

  const handleReject = async (seller) => {
    setSelectedSeller(seller);
    setActionType('reject');
    setMessage('');
  };

  const confirmAction = async () => {
    if (!selectedSeller) return;

    try {
      let response;
      if (actionType === 'validate') {
        response = await validateSeller(selectedSeller.id, message);
      } else if (actionType === 'reject') {
        if (!message.trim()) {
          setAlert({ type: 'error', message: 'Veuillez indiquer une raison' });
          return;
        }
        response = await rejectSeller(selectedSeller.id, 'autre', message);
      }

      if (response?.success) {
        setAlert({
          type: 'success',
          message: actionType === 'validate' ? 'Revendeur validé' : 'Demande rejetée'
        });
        setSelectedSeller(null);
        setActionType(null);
        setMessage('');
        loadPendingSellers();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Erreur lors de l\'opération'
      });
    }
  };

  const getDaysWaiting = (createdAt) => {
    const days = Math.floor((Date.now() - new Date(createdAt)) / 86400000);
    return days;
  };

  if (loading && !pendingSellers.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

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
                <Clock className="h-6 w-6 text-yellow-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Demandes en Attente
                  </h1>
                  <p className="text-sm text-gray-500">
                    {pendingSellers.length} demande{pendingSellers.length > 1 ? 's' : ''} à traiter
                  </p>
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

        {/* Liste des demandes */}
        <div className="space-y-6">
          {pendingSellers.map((seller) => {
            const daysWaiting = getDaysWaiting(seller.createdAt);
            const isUrgent = daysWaiting > 2;

            return (
              <div
                key={seller.id}
                className={`bg-white rounded-lg border-2 p-6 ${
                  isUrgent ? 'border-yellow-400 shadow-lg' : 'border-gray-200'
                }`}
              >
                {isUrgent && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      En attente depuis {daysWaiting} jours
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {seller.businessName}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Propriétaire:</span>
                        <span>{seller.firstName} {seller.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{seller.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{seller.quarter}, {seller.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Inscrit le {formatDateTime(seller.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations GPS */}
                {seller.latitude && seller.longitude && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      📍 Position GPS
                    </p>
                    <p className="text-sm text-blue-700">
                      Lat: {seller.latitude}, Long: {seller.longitude}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="primary"
                    onClick={() => handleValidate(seller)}
                    className="flex-1"
                    disabled={loading}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Valider
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleReject(seller)}
                    className="flex-1"
                    disabled={loading}
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Rejeter
                  </Button>
                </div>
              </div>
            );
          })}

          {pendingSellers.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucune demande en attente
              </h3>
              <p className="text-gray-600">
                Toutes les demandes ont été traitées !
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation */}
      {selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {actionType === 'validate' ? '✅ Valider le profil' : '❌ Rejeter la demande'}
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">
                {selectedSeller.businessName}
              </p>
              <p className="text-sm text-gray-600">
                {selectedSeller.firstName} {selectedSeller.lastName}
              </p>
            </div>

            {actionType === 'validate' ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message envoyé au revendeur
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ce message sera envoyé par SMS et notification app
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du rejet <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: Les photos fournies ne montrent pas clairement votre dépôt..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSeller(null);
                  setActionType(null);
                  setMessage('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                variant={actionType === 'validate' ? 'primary' : 'danger'}
                onClick={confirmAction}
                className="flex-1"
                loading={loading}
              >
                Confirmer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPendingSellers;