// ==========================================
// FICHIER: src/components/client/AddressForm.jsx
// ==========================================
import React, { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import { CITIES } from '../../constants';
import { getCurrentPosition } from '../../utils/helpers';

const AddressForm = ({ initialData = null, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    label: initialData?.label || '',
    city: initialData?.city || 'Ouagadougou',
    quarter: initialData?.quarter || '',
    fullAddress: initialData?.fullAddress || '',
    latitude: initialData?.latitude || null,
    longitude: initialData?.longitude || null,
    isDefault: initialData?.isDefault || false
  });

  const [gettingLocation, setGettingLocation] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
    } catch (error) {
      alert('Impossible d\'obtenir votre position');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Libellé"
        name="label"
        value={formData.label}
        onChange={handleChange}
        placeholder="Ex: Maison, Bureau..."
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
          required
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
        value={formData.quarter}
        onChange={handleChange}
        placeholder="Ex: Gounghin"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse complète <span className="text-red-500">*</span>
        </label>
        <textarea
          name="fullAddress"
          value={formData.fullAddress}
          onChange={handleChange}
          placeholder="Ex: Rue 12.45, près du marché"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={handleGetLocation}
          loading={gettingLocation}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Utiliser ma position actuelle
        </Button>
        {formData.latitude && formData.longitude && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Position GPS enregistrée
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

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
        >
          {initialData ? 'Modifier' : 'Ajouter'}
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;