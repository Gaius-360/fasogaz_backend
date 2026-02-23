// ==========================================
// FICHIER: src/components/client/AddressSelector.jsx
// Sélecteur d'adresse avec couleurs FasoGaz
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
    return (
      <div className="text-center py-4">
        <div className="spinner w-8 h-8 mx-auto"></div>
        <p className="text-sm text-neutral-600 mt-2">Chargement...</p>
      </div>
    );
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
        <div className="text-center py-8 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl border-2 border-primary-100">
          <MapPin className="h-12 w-12 text-primary-400 mx-auto mb-3" />
          <p className="text-neutral-600 font-medium mb-4">Aucune adresse enregistrée</p>
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
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedAddressId === address.id
                    ? 'border-primary-600 bg-gradient-to-br from-primary-50 to-secondary-50 shadow-gazbf'
                    : 'border-neutral-200 hover:border-primary-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-neutral-900">{address.label}</p>
                      {address.isDefault && (
                        <span className="text-xs px-2 py-0.5 bg-accent-100 text-accent-700 rounded-full font-semibold">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-700 font-medium">
                      {address.fullAddress || address.city}
                    </p>
                    {address.additionalInfo && (
                      <p className="text-sm text-neutral-500 mt-1">
                        {address.additionalInfo}
                      </p>
                    )}
                  </div>
                  {selectedAddressId === address.id && (
                    <div className="ml-2 p-1.5 bg-primary-100 rounded-full">
                      <Check className="h-5 w-5 text-primary-600" />
                    </div>
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