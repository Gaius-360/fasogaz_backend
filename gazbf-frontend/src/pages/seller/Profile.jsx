// ==========================================
// FICHIER: src/pages/seller/Profile.jsx (VERSION RESPONSIVE)
// Profil revendeur - GPS + HEURES D'OUVERTURE + BOUTON PARAMÈTRES
// ==========================================
import React, { useState, useEffect } from 'react';
import { 
  User, MapPin, Phone, Mail, Building2, Clock, 
  Edit2, Save, X, Truck, AlertCircle, Navigation, Loader2, CheckCircle, XCircle, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import OpeningHoursEditor from '../../components/seller/OpeningHoursEditor';
import { api } from '../../api/apiSwitch';
import { getCurrentPosition } from '../../utils/helpers';

const SellerProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  
  const [editMode, setEditMode] = useState(false);
  const [editDeliveryMode, setEditDeliveryMode] = useState(false);
  const [editHoursMode, setEditHoursMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [alert, setAlert] = useState(null);

  // Modale de confirmation GPS
  const [showGPSConfirm, setShowGPSConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    businessName: '',
    latitude: null,
    longitude: null,
    // ✅ FIX: quarter et city inclus dans formData
    quarter: '',
    city: ''
  });

  const [deliveryData, setDeliveryData] = useState({
    deliveryAvailable: false,
    deliveryFee: 0
  });

  const [hoursData, setHoursData] = useState({
    isOpen24_7: false,
    isClosed: false,
    schedule: {
      monday: { enabled: true, open: '08:00', close: '20:00' },
      tuesday: { enabled: true, open: '08:00', close: '20:00' },
      wednesday: { enabled: true, open: '08:00', close: '20:00' },
      thursday: { enabled: true, open: '08:00', close: '20:00' },
      friday: { enabled: true, open: '08:00', close: '20:00' },
      saturday: { enabled: true, open: '08:00', close: '18:00' },
      sunday: { enabled: false, open: '09:00', close: '13:00' }
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        businessName: user.businessName || '',
        latitude: user.latitude || null,
        longitude: user.longitude || null,
        // ✅ FIX: Initialiser quarter et city depuis user
        quarter: user.quarter || '',
        city: user.city || ''
      });

      setDeliveryData({
        deliveryAvailable: user.deliveryAvailable || false,
        deliveryFee: user.deliveryFee || 0
      });

      if (user.openingHours) {
        setHoursData(user.openingHours);
      }
    }
  }, [user]);

  const formatCoordinate = (value, decimals = 6) => {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? null : num.toFixed(decimals);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeliveryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDeliveryData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ==========================================
  // GPS — Ouvrir la modale de confirmation
  // Si c'est la première fois (pas de coords), on ne demande pas confirmation
  // ==========================================
  const handleRequestLocation = () => {
    if (user?.latitude && user?.longitude) {
      // Des coordonnées existent déjà → confirmation requise
      setShowGPSConfirm(true);
    } else {
      // Première définition → pas besoin de confirmation
      handleGetCurrentLocation();
    }
  };

  // ==========================================
  // GPS — Exécuter après confirmation
  // ✅ FIX: quarter et city sont maintenant mis à jour dans formData
  // ==========================================
  const handleGetCurrentLocation = async () => {
    setShowGPSConfirm(false);
    setGettingLocation(true);
    setAlert(null);

    try {
      const position = await getCurrentPosition();
      
      // ✅ Mettre à jour latitude, longitude ET quarter/city dans formData
      setFormData(prev => ({
        ...prev,
        latitude: position.latitude,
        longitude: position.longitude,
        ...(position.quarter && { quarter: position.quarter }),
        ...(position.city && { city: position.city })
      }));

      const locationInfo = position.quarter
        ? `Quartier : ${position.quarter}, ${position.city || 'Ouagadougou'}`
        : `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;

      setAlert({
        type: 'success',
        title: '✓ Position GPS obtenue',
        message: `Position GPS enregistrée avec succès — ${locationInfo}`
      });

    } catch (error) {
      setAlert({
        type: 'error',
        title: 'Erreur de géolocalisation',
        message: error.message || 'Impossible d\'obtenir votre position GPS'
      });
    } finally {
      setGettingLocation(false);
    }
  };

  // ==========================================
  // Sauvegarde profil
  // ✅ formData contient désormais quarter et city → envoyés automatiquement
  // ==========================================
  const handleSaveProfile = async () => {
    if (!formData.businessName) {
      setAlert({ type: 'error', message: 'Le nom du dépôt est obligatoire' });
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setAlert({
        type: 'warning',
        title: 'Coordonnées GPS manquantes',
        message: 'Il est fortement recommandé d\'ajouter vos coordonnées GPS pour que les clients puissent vous trouver facilement.'
      });
    }

    setLoading(true);
    setAlert(null);
    
    try {
      // ✅ formData inclut maintenant quarter et city
      const response = await api.auth.updateProfile(formData);
      if (response.success) {
        updateUser(response.data.user);
        setAlert({ type: 'success', message: 'Profil mis à jour avec succès' });
        setEditMode(false);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors de la mise à jour'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDelivery = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await api.auth.updateProfile(deliveryData);
      if (response.success) {
        updateUser(response.data.user);
        setAlert({ type: 'success', message: 'Options de livraison mises à jour' });
        setEditDeliveryMode(false);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors de la mise à jour'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHours = async (newHours) => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await api.auth.updateProfile({ openingHours: newHours });
      if (response.success) {
        updateUser(response.data.user);
        setHoursData(newHours);
        setAlert({ type: 'success', message: 'Heures d\'ouverture mises à jour avec succès' });
        setEditHoursMode(false);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors de la mise à jour'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelProfile = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      businessName: user?.businessName || '',
      latitude: user?.latitude || null,
      longitude: user?.longitude || null,
      // ✅ FIX: Réinitialiser aussi quarter et city
      quarter: user?.quarter || '',
      city: user?.city || ''
    });
    setEditMode(false);
    setAlert(null);
  };

  const handleCancelDelivery = () => {
    setDeliveryData({
      deliveryAvailable: user?.deliveryAvailable || false,
      deliveryFee: user?.deliveryFee || 0
    });
    setEditDeliveryMode(false);
    setAlert(null);
  };

  const handleCancelHours = () => {
    setHoursData(user?.openingHours || hoursData);
    setEditHoursMode(false);
    setAlert(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

      {/* ==========================================
          MODALE DE CONFIRMATION GPS
          ========================================== */}
      {showGPSConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Modifier la position GPS ?
                </h3>
                <p className="text-sm text-gray-500">Cette action mettra à jour votre localisation</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                ⚠️ Vous êtes sur le point de <strong>remplacer les coordonnées GPS</strong> de votre dépôt. 
                Cela modifiera votre position sur la carte visible par les clients.
              </p>
              <p className="text-sm text-yellow-800 mt-2">
                Assurez-vous d'être <strong>physiquement présent à votre point de vente</strong> avant de continuer.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowGPSConfirm(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleGetCurrentLocation}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Confirmer et mettre à jour
              </Button>
            </div>
          </div>
        </div>
      )}

      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* En-tête avec bouton paramètres */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Mon Profil</h1>
          <p className="text-sm sm:text-base text-gray-600">Gérez les informations de votre dépôt</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/seller/settings')}
          className="w-full sm:w-auto"
        >
          <Settings className="h-4 w-4 mr-2" />
          Paramètres
        </Button>
      </div>

      {/* Section Informations du dépôt */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Informations du dépôt</h2>
          {!editMode ? (
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="w-full sm:w-auto">
              <Edit2 className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="ghost" size="sm" onClick={handleCancelProfile} disabled={loading} className="flex-1 sm:flex-none">
                <X className="h-4 w-4" />
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveProfile} loading={loading} className="flex-1 sm:flex-none">
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-4 mb-4 sm:mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-secondary-600" />
          </div>
          <div className="flex-1 w-full min-w-0">
            {!editMode ? (
              <>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                  {user?.businessName || 'Nom du dépôt non défini'}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 break-all">{user?.phone}</p>
                {user?.email && (
                  <p className="text-xs sm:text-sm text-gray-500 break-all">{user.email}</p>
                )}
              </>
            ) : (
              <div className="space-y-3 w-full">
                <Input
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Nom du dépôt *"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Prénom" />
                  <Input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Nom" />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="p-2 sm:p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <p className="text-xs sm:text-sm">Téléphone</p>
            </div>
            <p className="font-medium text-xs sm:text-base break-all">{user?.phone}</p>
          </div>
          <div className="p-2 sm:p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <p className="text-xs sm:text-sm">Localisation</p>
            </div>
            {/* ✅ FIX: Afficher quartier + ville */}
            <p className="font-medium text-xs sm:text-base">
              {user?.quarter ? `${user.quarter}, ` : ''}{user?.city || 'Ouagadougou'}
            </p>
          </div>
          <div className="p-2 sm:p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <p className="text-xs sm:text-sm">Type de compte</p>
            </div>
            <p className="font-medium text-xs sm:text-base capitalize">{user?.role}</p>
          </div>
          <div className="p-2 sm:p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-1 sm:gap-2 text-gray-600 mb-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <p className="text-xs sm:text-sm">Membre depuis</p>
            </div>
            <p className="font-medium text-xs sm:text-base">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-'}
            </p>
          </div>
        </div>

        {/* Section GPS - Mode Édition */}
        {editMode && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Navigation className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              Coordonnées GPS de votre dépôt
            </h3>
            <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
              📍 Cliquez sur le bouton ci-dessous pour obtenir automatiquement vos coordonnées GPS.
            </p>

            {formData.latitude && formData.longitude ? (
              <div className="bg-white rounded-lg p-3 sm:p-4 mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 sm:mb-3">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Position enregistrée :</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold flex items-center gap-1 w-fit">
                    <CheckCircle className="w-3 h-3" />
                    Définie
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                  {/* ✅ FIX: Afficher le quartier détecté par GPS */}
                  {formData.quarter && (
                    <p><strong>Quartier détecté :</strong> {formData.quarter}</p>
                  )}
                  {formData.city && (
                    <p><strong>Ville :</strong> {formData.city}</p>
                  )}
                  <p className="break-all"><strong>Latitude :</strong> {formatCoordinate(formData.latitude)}</p>
                  <p className="break-all"><strong>Longitude :</strong> {formatCoordinate(formData.longitude)}</p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                <p className="text-xs sm:text-sm text-yellow-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Aucune coordonnée GPS enregistrée</span>
                </p>
              </div>
            )}

            <Button
              variant="primary"
              fullWidth
              onClick={handleRequestLocation}
              loading={gettingLocation}
              disabled={gettingLocation}
              className="text-sm sm:text-base"
            >
              {gettingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Détection en cours...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  {formData.latitude ? 'Mettre à jour ma position GPS' : 'Obtenir ma position GPS'}
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 mt-2 text-center">
              💡 Activez la géolocalisation dans votre navigateur
            </p>
          </div>
        )}

        {/* Section GPS - Mode Lecture */}
        {!editMode && user?.latitude && user?.longitude && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <h4 className="font-semibold text-green-900 text-sm sm:text-base">Coordonnées GPS</h4>
            </div>
            <div className="text-xs sm:text-sm text-gray-700 space-y-1">
              {/* ✅ FIX: Afficher le quartier en mode lecture */}
              {user?.quarter && (
                <p><strong>Quartier :</strong> {user.quarter}</p>
              )}
              {user?.city && (
                <p><strong>Ville :</strong> {user.city}</p>
              )}
              <p className="break-all"><strong>Latitude :</strong> {formatCoordinate(user.latitude)}</p>
              <p className="break-all"><strong>Longitude :</strong> {formatCoordinate(user.longitude)}</p>
            </div>
          </div>
        )}

        {!editMode && (!user?.latitude || !user?.longitude) && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 w-full">
                <h4 className="font-semibold text-yellow-900 mb-1 text-sm sm:text-base">
                  Coordonnées GPS manquantes
                </h4>
                <p className="text-xs sm:text-sm text-yellow-800 mb-2 sm:mb-3">
                  Ajoutez vos coordonnées GPS pour que les clients puissent vous localiser facilement.
                </p>
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="w-full sm:w-auto">
                  Ajouter mes coordonnées
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Section Livraison */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-600 flex-shrink-0" />
            <h3 className="font-semibold text-base sm:text-lg text-gray-900">Options de livraison</h3>
          </div>
          {!editDeliveryMode && (
            <Button variant="outline" size="sm" onClick={() => setEditDeliveryMode(true)} className="w-full sm:w-auto">
              <Edit2 className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
          {editDeliveryMode && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="ghost" size="sm" onClick={handleCancelDelivery} disabled={loading} className="flex-1 sm:flex-none">
                <X className="h-4 w-4" />
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveDelivery} loading={loading} className="flex-1 sm:flex-none">
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}
        </div>

        {!editDeliveryMode ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  user?.deliveryAvailable ? 'bg-green-100' : 'bg-gray-200'
                }`}>
                  <Truck className={`w-4 h-4 sm:w-5 sm:h-5 ${user?.deliveryAvailable ? 'text-green-600' : 'text-gray-500'}`} />
                </div>
                <span className="text-sm sm:text-base text-gray-700 font-medium">Livraison à domicile</span>
              </div>
              <span className={`font-semibold text-sm sm:text-base ${user?.deliveryAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                {user?.deliveryAvailable ? 'Activée' : 'Désactivée'}
              </span>
            </div>
            {user?.deliveryAvailable && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-secondary-50 rounded-lg border border-secondary-200 gap-2">
                <span className="text-sm sm:text-base text-gray-700 font-medium">Frais de livraison</span>
                <span className="font-bold text-secondary-600 text-base sm:text-lg">
                  {user?.deliveryFee > 0 ? `${user.deliveryFee} FCFA` : 'Gratuit'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <input
                type="checkbox"
                id="deliveryAvailable"
                name="deliveryAvailable"
                checked={deliveryData.deliveryAvailable}
                onChange={handleDeliveryChange}
                className="w-5 h-5 text-secondary-600 border-gray-300 rounded mt-0.5 flex-shrink-0"
              />
              <label htmlFor="deliveryAvailable" className="flex-1 cursor-pointer">
                <span className="text-gray-900 font-medium block text-sm sm:text-base">
                  Activer la livraison à domicile
                </span>
                <span className="text-xs sm:text-sm text-gray-600">
                  Vos clients pourront demander la livraison
                </span>
              </label>
            </div>
            {deliveryData.deliveryAvailable && (
              <div className="p-3 sm:p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                <Input
                  label="Frais de livraison (FCFA)"
                  name="deliveryFee"
                  type="number"
                  value={deliveryData.deliveryFee}
                  onChange={handleDeliveryChange}
                  min="0"
                  step="1"
                  placeholder="0"
                  helpText="Laisser à 0 pour livraison gratuite"
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Section Heures d'ouverture */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-600 flex-shrink-0" />
            <h3 className="font-semibold text-base sm:text-lg text-gray-900">Heures d'ouverture</h3>
          </div>
          {!editHoursMode && (
            <Button variant="outline" size="sm" onClick={() => setEditHoursMode(true)} className="w-full sm:w-auto">
              <Edit2 className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>

        {editHoursMode ? (
          <OpeningHoursEditor
            initialHours={hoursData}
            onSave={handleSaveHours}
            onCancel={handleCancelHours}
            loading={loading}
          />
        ) : (
          <OpeningHoursReadOnly openingHours={user?.openingHours} />
        )}
      </Card>
    </div>
  );
};

// Composant lecture seule pour les heures d'ouverture
const OpeningHoursReadOnly = ({ openingHours }) => {
  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const daysInFrench = {
    monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
    thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi', sunday: 'Dimanche'
  };

  if (!openingHours) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center">
        <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm sm:text-base text-gray-600 mb-2">Aucun horaire défini</p>
        <p className="text-xs sm:text-sm text-gray-500">Cliquez sur "Modifier" pour configurer vos heures d'ouverture</p>
      </div>
    );
  }

  if (openingHours.isOpen24_7) {
    return (
      <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-900 font-semibold text-base sm:text-lg">Ouvert 24h/24 7j/7</p>
            <p className="text-green-700 text-xs sm:text-sm mt-1">Votre dépôt est toujours ouvert</p>
          </div>
        </div>
      </div>
    );
  }

  if (openingHours.isClosed) {
    return (
      <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-900 font-semibold text-base sm:text-lg">Fermé définitivement</p>
            <p className="text-red-700 text-xs sm:text-sm mt-1">Votre dépôt est temporairement hors service</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {daysOrder.map((day) => {
        const schedule = openingHours.schedule?.[day];
        if (!schedule) return null;
        return (
          <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
            <span className="font-medium text-gray-900 text-sm sm:text-base w-full sm:w-28">
              {daysInFrench[day]}
            </span>
            {schedule.enabled ? (
              <span className="text-gray-700 text-sm sm:text-base">{schedule.open} - {schedule.close}</span>
            ) : (
              <span className="text-gray-400 italic text-sm sm:text-base">Fermé</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SellerProfile;