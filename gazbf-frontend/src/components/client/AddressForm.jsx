// ==========================================
// FICHIER: src/components/addresses/AddressForm.jsx
// Formulaire d'adresse avec couleurs FasoGaz
// ==========================================
import React, { useState } from 'react';
import { MapPin, Navigation, Loader2, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';
import { getCurrentPosition } from '../../utils/helpers';

const AddressForm = ({ 
  initialData = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    label: initialData?.label || '',
    city: initialData?.city || 'Ouagadougou',
    latitude: initialData?.latitude || null,
    longitude: initialData?.longitude || null,
    phoneNumber: initialData?.phoneNumber || '',
    additionalInfo: initialData?.additionalInfo || '',
    isDefault: initialData?.isDefault || false
  });

  const [gettingLocation, setGettingLocation] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGetLocation = async () => {
    setGettingLocation(true);
    setAlert(null);

    try {
      const position = await getCurrentPosition();
      
      setFormData(prev => ({
        ...prev,
        latitude: position.latitude,
        longitude: position.longitude,
        city: position.city || prev.city
      }));

      setAlert({
        type: 'success',
        title: '✓ Position GPS obtenue',
        message: `Position GPS enregistrée avec succès`
      });

    } catch (error) {
      setAlert({
        type: 'error',
        title: 'Erreur de géolocalisation',
        message: error.message
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.label) {
      setAlert({
        type: 'error',
        message: 'Le nom de l\'adresse est obligatoire'
      });
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setAlert({
        type: 'warning',
        title: 'GPS non défini',
        message: 'Il est recommandé d\'ajouter vos coordonnées GPS pour faciliter les livraisons.'
      });
    }

    onSubmit(formData);
  };

  const formatCoordinate = (value) => {
    if (!value) return 'Non défini';
    return parseFloat(value).toFixed(6);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Nom de l'adresse */}
      <Input
        label="Nom de l'adresse *"
        name="label"
        value={formData.label}
        onChange={handleChange}
        placeholder="Ex: Maison, Bureau, Autre"
        required
      />

      {/* Section GPS */}
      <div className="p-4 bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200 rounded-xl">
        <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
          <Navigation className="h-5 w-5 text-primary-600" />
          Localisation GPS
        </h3>
        
        <p className="text-sm text-neutral-700 mb-4">
          📍 Obtenez automatiquement votre position GPS
        </p>

        {formData.latitude && formData.longitude ? (
          <div className="bg-white rounded-lg p-4 mb-3 border-2 border-accent-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-neutral-700">Position enregistrée :</span>
              <span className="text-xs bg-accent-100 text-accent-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Définie
              </span>
            </div>
            <div className="text-sm text-neutral-600 space-y-1">
              <p><strong>Latitude:</strong> {formatCoordinate(formData.latitude)}</p>
              <p><strong>Longitude:</strong> {formatCoordinate(formData.longitude)}</p>
            </div>
          </div>
        ) : (
          <div className="bg-secondary-50 border-2 border-secondary-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-secondary-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4" />
              Position GPS non définie
            </p>
          </div>
        )}

        <Button
          type="button"
          variant="primary"
          fullWidth
          onClick={handleGetLocation}
          loading={gettingLocation}
          disabled={gettingLocation}
        >
          {gettingLocation ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Détection en cours...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              {formData.latitude 
                ? 'Mettre à jour ma position' 
                : 'Obtenir ma position GPS'}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-neutral-500 mt-2">
          💡 Activez la géolocalisation dans votre navigateur
        </p>
      </div>

      {/* Ville */}
      <div>
        <label className="block text-sm font-bold text-neutral-900 mb-2">
          Ville *
        </label>
        <select
          name="city"
          value={formData.city}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-medium"
          required
        >
          <option value="Ouagadougou">Ouagadougou</option>
          <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
        </select>
      </div>

      {/* Numéro de téléphone */}
      <Input
        label="Numéro de téléphone"
        name="phoneNumber"
        value={formData.phoneNumber}
        onChange={handleChange}
        placeholder="Ex: +226 XX XX XX XX"
        type="tel"
      />

      {/* Informations supplémentaires */}
      <div>
        <label className="block text-sm font-bold text-neutral-900 mb-2">
          Indications supplémentaires
        </label>
        <textarea
          name="additionalInfo"
          value={formData.additionalInfo}
          onChange={handleChange}
          rows={3}
          placeholder="Ex: À côté de la pharmacie, porte bleue..."
          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 resize-none transition-all"
        />
      </div>

      {/* Adresse par défaut */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl border-2 border-neutral-200">
        <input
          type="checkbox"
          id="isDefault"
          name="isDefault"
          checked={formData.isDefault}
          onChange={handleChange}
          className="w-5 h-5 text-primary-600 border-neutral-300 rounded-lg focus:ring-primary-500 cursor-pointer"
        />
        <label htmlFor="isDefault" className="flex-1 cursor-pointer">
          <span className="text-neutral-900 font-bold block">
            Définir comme adresse par défaut
          </span>
          <span className="text-sm text-neutral-600">
            Cette adresse sera utilisée automatiquement pour vos commandes
          </span>
        </label>
      </div>

      {/* Boutons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={onCancel}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button
          type="submit"
          variant="gradient"
          fullWidth
          loading={loading}
          className="font-bold"
        >
          <Save className="h-4 w-4 mr-2" />
          {initialData ? 'Mettre à jour' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;