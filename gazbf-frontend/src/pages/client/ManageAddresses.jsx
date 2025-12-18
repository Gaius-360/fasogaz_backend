// ==========================================
// FICHIER: src/pages/client/ManageAddresses.jsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import AddAddressModal from '../../components/client/AddAddressModal';
import { api } from '../../api/apiSwitch';

const ManageAddresses = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const response = await api.addresses.getMyAddresses();
      if (response.success) {
        setAddresses(response.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des adresses'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (address) => {
    if (!window.confirm(`Supprimer l'adresse "${address.label}" ?`)) {
      return;
    }

    try {
      const response = await api.addresses.deleteAddress(address.id);
      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Adresse supprimée'
        });
        loadAddresses();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors de la suppression'
      });
    }
  };

  const handleSetDefault = async (address) => {
    if (address.isDefault) return;

    try {
      const response = await api.addresses.updateAddress(address.id, {
  isDefault: true
});
      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Adresse par défaut mise à jour'
        });
        loadAddresses();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors de la mise à jour'
      });
    }
  };

  if (loading) {
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
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Liste */}
      {addresses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune adresse
          </h3>
          <p className="text-gray-600 mb-6">
            Ajoutez des adresses pour faciliter vos commandes
          </p>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Ajouter une adresse
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="bg-white rounded-lg border-2 border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {address.label}
                    </h3>
                    {address.isDefault && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
                        Par défaut
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{address.fullAddress}</p>
                  <p className="text-sm text-gray-500">
                    {address.quarter}, {address.city}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(address)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>

              {!address.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetDefault(address)}
                >
                  Définir comme adresse par défaut
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showAddModal && (
        <AddAddressModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadAddresses();
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ManageAddresses;