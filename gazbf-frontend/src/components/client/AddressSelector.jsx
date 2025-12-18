// ==========================================
// FICHIER: src/components/client/AddressSelector.jsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Check } from 'lucide-react';
import Button from '../common/Button';
import { api } from '../../api/apiSwitch';
import Alert from '../common/Alert';

const AddressSelector = ({ selectedAddressId, onSelectAddress, onAddNew }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const response = await api.addresses.getMyAddresses();
      if (response.success) {
        setAddresses(response.data);
        
        // Sélectionner l'adresse par défaut si aucune n'est sélectionnée
        if (!selectedAddressId && response.data.length > 0) {
          const defaultAddress = response.data.find(a => a.isDefault) || response.data[0];
          onSelectAddress(defaultAddress.id);
        }
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

  if (loading) {
    return <div className="text-center py-4">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Aucune adresse enregistrée</p>
          <Button variant="primary" onClick={onAddNew}>
            <Plus className="h-5 w-5 mr-2" />
            Ajouter une adresse
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                onClick={() => onSelectAddress(address.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedAddressId === address.id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{address.label}</p>
                      {address.isDefault && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {address.fullAddress}
                    </p>
                    <p className="text-sm text-gray-500">
                      {address.quarter}, {address.city}
                    </p>
                  </div>
                  {selectedAddressId === address.id && (
                    <Check className="h-5 w-5 text-primary-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" fullWidth onClick={onAddNew}>
            <Plus className="h-5 w-5 mr-2" />
            Ajouter une nouvelle adresse
          </Button>
        </>
      )}
    </div>
  );
};

export default AddressSelector;