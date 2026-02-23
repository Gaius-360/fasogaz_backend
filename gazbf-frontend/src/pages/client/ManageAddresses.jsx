// ==========================================
// FICHIER: src/pages/client/ManageAddresses.jsx
// Gestion des adresses avec affichage GPS
// ==========================================
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, MapPin, Loader2, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import AddAddressModal from '../../components/client/AddAddressModal';
import useClientStore from '../../store/clientStore';

const ManageAddresses = () => {
  const navigate = useNavigate();
  const { 
    addresses, 
    loading, 
    error, 
    fetchMyAddresses, 
    deleteAddress, 
    updateAddress,
    clearError 
  } = useClientStore();

  const [alert, setAlert] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    if (error) {
      setAlert({
        type: 'error',
        message: error
      });
      clearError();
    }
  }, [error]);

  const loadAddresses = async () => {
    try {
      await fetchMyAddresses();
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des adresses'
      });
    }
  };

  const handleDelete = async (address) => {
    if (!window.confirm(`Supprimer l'adresse "${address.label}" ?`)) {
      return;
    }

    try {
      await deleteAddress(address.id);
      setAlert({
        type: 'success',
        message: 'Adresse supprimée'
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Erreur lors de la suppression'
      });
    }
  };

  const handleSetDefault = async (address) => {
    if (address.isDefault) return;

    try {
      await updateAddress(address.id, { isDefault: true });
      setAlert({
        type: 'success',
        message: 'Adresse par défaut mise à jour'
      });
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Erreur lors de la mise à jour'
      });
    }
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setShowAddModal(true);
  };

  // Helper pour formater les coordonnées
  const formatCoordinate = (value) => {
    if (!value) return null;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? null : num.toFixed(6);
  };

  if (loading && addresses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/client/profile')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Mes Adresses</h1>
          <p className="text-gray-600">{addresses.length} adresse(s) enregistrée(s)</p>
        </div>
        <Button variant="primary" onClick={() => {
          setEditingAddress(null);
          setShowAddModal(true);
        }}>
          <Plus className="h-5 w-5 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Navigation className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              🎯 Adresses basées sur la géolocalisation
            </h3>
            <p className="text-sm text-blue-800">
              Vos adresses utilisent votre position GPS pour calculer automatiquement 
              la distance jusqu'aux dépôts et faciliter la livraison.
            </p>
          </div>
        </div>
      </div>

      {/* Liste */}
      {addresses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune adresse enregistrée
          </h3>
          <p className="text-gray-600 mb-6">
            Ajoutez une adresse avec votre position GPS pour faciliter vos commandes
          </p>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Ajouter ma première adresse
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white rounded-lg border-2 p-6 transition-colors ${
                address.isDefault 
                  ? 'border-primary-300 bg-primary-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className={`h-5 w-5 ${
                      address.isDefault ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <h3 className="font-semibold text-lg text-gray-900">
                      {address.label}
                    </h3>
                    {address.isDefault && (
                      <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded font-semibold">
                        Par défaut
                      </span>
                    )}
                  </div>
                  
                  <div className="ml-8 space-y-1">
                    <p className="text-gray-700">
                      <strong>{address.quarter}</strong>, {address.city}
                    </p>
                    
                    {address.phoneNumber && (
                      <p className="text-sm text-gray-600">
                        📞 {address.phoneNumber}
                      </p>
                    )}
                    
                    {address.additionalInfo && (
                      <p className="text-sm text-gray-600">
                        💡 {address.additionalInfo}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(address)}
                    title="Modifier"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(address)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {/* Coordonnées GPS */}
              {address.latitude && address.longitude && (
                <div className="ml-8 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Navigation className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Position GPS
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p>Lat: {formatCoordinate(address.latitude)}</p>
                    <p>Long: {formatCoordinate(address.longitude)}</p>
                  </div>
                </div>
              )}

              {/* Bouton par défaut */}
              {!address.isDefault && (
                <div className="ml-8 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(address)}
                  >
                    Définir comme adresse par défaut
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showAddModal && (
        <AddAddressModal
          editAddress={editingAddress}
          onClose={() => {
            setShowAddModal(false);
            setEditingAddress(null);
          }}
          onSuccess={() => {
            loadAddresses();
            setShowAddModal(false);
            setEditingAddress(null);
            setAlert({
              type: 'success',
              message: editingAddress 
                ? 'Adresse mise à jour avec succès' 
                : 'Adresse ajoutée avec succès'
            });
          }}
        />
      )}
    </div>
  );
};

export default ManageAddresses;