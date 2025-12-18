// ==========================================
// FICHIER: src/components/client/AddAddressModal.jsx
// ==========================================
import React, { useState } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';
import { api } from '../../api/apiSwitch';
import { CITIES } from '../../constants';
import { getCurrentPosition } from '../../utils/helpers';

const AddAddressModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    label: '',
    city: 'Ouagadougou',
    quarter: '',
    fullAddress: '',
    latitude: null,
    longitude: null,
    isDefault: false
  });
  
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleGetLocation = async () => {
    setGettingLocation(true);
    try {
      const position = await getCurrentPosition();
      setFormData(prev => ({
        ...prev,
        latitude: position.latitude,
        longitude: position.longitude
      }));
      setAlert({
        type: 'success',
        message: 'Position obtenue avec succès'
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Impossible d\'obtenir votre position'
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.label.trim()) newErrors.label = 'Le libellé est requis';
    if (!formData.quarter.trim()) newErrors.quarter = 'Le quartier est requis';
    if (!formData.fullAddress.trim()) newErrors.fullAddress = 'L\'adresse est requise';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setAlert(null);
    
    try {
      const response = await api.addresses.createAddress(formData);
      
      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Adresse créée avec succès'
        });
        
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors de la création'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Nouvelle adresse
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Libellé"
              name="label"
              placeholder="Ex: Maison, Bureau"
              value={formData.label}
              onChange={handleChange}
              error={errors.label}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville <span className="text-red-500">*</span>
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {CITIES.map(city => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Quartier"
              name="quarter"
              placeholder="Ex: Gounghin"
              value={formData.quarter}
              onChange={handleChange}
              error={errors.quarter}
              required
            />

            <Input
              label="Adresse complète"
              name="fullAddress"
              placeholder="Ex: Rue 12.45, près du marché"
              value={formData.fullAddress}
              onChange={handleChange}
              error={errors.fullAddress}
              required
            />

            <div>
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={handleGetLocation}
                loading={gettingLocation}
              >
                <MapPin className="h-5 w-5 mr-2" />
                Utiliser ma position actuelle
              </Button>
              {formData.latitude && formData.longitude && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Position enregistrée
                </p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                Définir comme adresse par défaut
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={loading}
              onClick={handleSubmit}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAddressModal;