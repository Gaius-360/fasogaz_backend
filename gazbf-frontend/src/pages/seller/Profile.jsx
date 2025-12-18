// ==========================================
// FICHIER: src/pages/seller/Profile.jsx
// Profil revendeur avec restrictions selon statut
// ==========================================
import React, { useState } from 'react';
import { 
  User, MapPin, Phone, Mail, Building2, Clock, 
  Edit2, Save, X, Truck, AlertCircle 
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';

const SellerProfile = () => {
  const { user, updateUser } = useAuthStore();
  
  const [editMode, setEditMode] = useState(false);
  const [editDeliveryMode, setEditDeliveryMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    businessName: user?.businessName || '',
    quarter: user?.quarter || ''
  });

  const [deliveryData, setDeliveryData] = useState({
    deliveryAvailable: user?.deliveryAvailable || false,
    deliveryFee: user?.deliveryFee || 0
  });

  // Vérifier si le revendeur est approuvé
  const isApproved = user?.validationStatus === 'approved';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeliveryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDeliveryData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setAlert(null);
    
    try {
      const response = await api.auth.updateProfile(formData);
      
      if (response.success) {
        updateUser(response.data.user);
        setAlert({
          type: 'success',
          message: 'Profil mis à jour avec succès'
        });
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
    if (!isApproved) {
      setAlert({
        type: 'error',
        message: 'Votre compte doit être approuvé pour modifier les options de livraison'
      });
      return;
    }

    setLoading(true);
    setAlert(null);
    
    try {
      const response = await api.auth.updateProfile(deliveryData);
      
      if (response.success) {
        updateUser(response.data.user);
        setAlert({
          type: 'success',
          message: 'Options de livraison mises à jour'
        });
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

  const handleCancelProfile = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      businessName: user?.businessName || '',
      quarter: user?.quarter || ''
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Mon Profil
        </h1>
        <p className="text-gray-600">
          Gérez les informations de votre dépôt
        </p>
      </div>

      {/* Alerte si compte non approuvé */}
      {!isApproved && (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-1">
                {user?.validationStatus === 'pending' 
                  ? 'Compte en attente de validation' 
                  : 'Compte non approuvé'}
              </h3>
              <p className="text-sm text-yellow-800">
                {user?.validationStatus === 'pending' 
                  ? 'Votre compte est en cours de vérification. Vous pourrez modifier vos options de livraison une fois votre compte approuvé.' 
                  : user?.validationStatus === 'rejected'
                  ? `Votre compte a été rejeté. Raison: ${user?.rejectionReason || 'Non spécifiée'}`
                  : 'Votre compte doit être approuvé pour accéder à toutes les fonctionnalités.'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Profil - Section Informations */}
      <Card>
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Informations du dépôt
          </h2>
          {!editMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelProfile}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveProfile}
                loading={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center">
            <Building2 className="h-10 w-10 text-secondary-600" />
          </div>
          <div className="flex-1">
            {!editMode ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900">
                  {user?.businessName}
                </h3>
                <p className="text-gray-600">{user?.phone}</p>
                {user?.email && (
                  <p className="text-sm text-gray-500">{user.email}</p>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <Input
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Nom du dépôt"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Prénom"
                  />
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Nom"
                  />
                </div>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email (optionnel)"
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Phone className="h-4 w-4" />
              <p className="text-sm">Téléphone</p>
            </div>
            <p className="font-medium">{user?.phone}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <MapPin className="h-4 w-4" />
              <p className="text-sm">Localisation</p>
            </div>
            {!editMode ? (
              <p className="font-medium">{user?.quarter}, {user?.city}</p>
            ) : (
              <Input
                name="quarter"
                value={formData.quarter}
                onChange={handleChange}
                placeholder="Quartier"
                size="sm"
              />
            )}
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Building2 className="h-4 w-4" />
              <p className="text-sm">Type de compte</p>
            </div>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Clock className="h-4 w-4" />
              <p className="text-sm">Statut de validation</p>
            </div>
            <span className={`inline-flex px-2 py-1 rounded text-sm font-medium ${
              user?.validationStatus === 'approved'
                ? 'bg-green-100 text-green-800'
                : user?.validationStatus === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {user?.validationStatus === 'approved' ? '✓ Approuvé' :
               user?.validationStatus === 'pending' ? '⏳ En attente' :
               '❌ Rejeté'}
            </span>
          </div>
        </div>
      </Card>

      {/* Options de livraison - Section séparée */}
      <Card>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-secondary-600" />
            <h3 className="font-semibold text-lg text-gray-900">
              Options de livraison
            </h3>
          </div>
          
          {isApproved && !editDeliveryMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditDeliveryMode(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}

          {editDeliveryMode && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelDelivery}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveDelivery}
                loading={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}
        </div>

        {!isApproved && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Vous pourrez configurer vos options de livraison une fois votre compte approuvé.
            </p>
          </div>
        )}

        {!editDeliveryMode ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  user?.deliveryAvailable ? 'bg-green-100' : 'bg-gray-200'
                }`}>
                  <Truck className={`w-5 h-5 ${
                    user?.deliveryAvailable ? 'text-green-600' : 'text-gray-500'
                  }`} />
                </div>
                <span className="text-gray-700 font-medium">Livraison à domicile</span>
              </div>
              <span className={`font-semibold ${
                user?.deliveryAvailable ? 'text-green-600' : 'text-gray-500'
              }`}>
                {user?.deliveryAvailable ? 'Activée' : 'Désactivée'}
              </span>
            </div>

            {user?.deliveryAvailable && (
              <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                <span className="text-gray-700 font-medium">Frais de livraison</span>
                <span className="font-bold text-secondary-600 text-lg">
                  {user?.deliveryFee > 0 ? `${user.deliveryFee} FCFA` : 'Gratuit'}
                </span>
              </div>
            )}

            {!user?.deliveryAvailable && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Conseil :</strong> Activez la livraison pour attirer plus de clients !
                  Les clients préfèrent commander avec livraison à domicile.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-secondary-300 transition-colors">
              <input
                type="checkbox"
                id="deliveryAvailable"
                name="deliveryAvailable"
                checked={deliveryData.deliveryAvailable}
                onChange={handleDeliveryChange}
                className="w-5 h-5 text-secondary-600 border-gray-300 rounded focus:ring-secondary-500"
              />
              <label htmlFor="deliveryAvailable" className="flex-1 cursor-pointer">
                <span className="text-gray-900 font-medium block">
                  Activer la livraison à domicile
                </span>
                <span className="text-sm text-gray-600">
                  Vos clients pourront demander la livraison
                </span>
              </label>
            </div>

            {deliveryData.deliveryAvailable && (
              <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
                <Input
                  label="Frais de livraison (FCFA)"
                  name="deliveryFee"
                  type="number"
                  value={deliveryData.deliveryFee}
                  onChange={handleDeliveryChange}
                  min="0"
                  placeholder="0"
                  helpText="Laisser à 0 pour proposer une livraison gratuite (recommandé pour débuter)"
                />
                
                <div className="mt-3 p-3 bg-white rounded border border-secondary-200">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Exemples de frais :</strong>
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 0 FCFA - Livraison gratuite (recommandé)</li>
                    <li>• 500 FCFA - Livraison dans le quartier</li>
                    <li>• 1000 FCFA - Livraison dans toute la ville</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Statistiques */}
      <Card>
        <h3 className="font-semibold text-lg text-gray-900 mb-4">
          Statistiques de performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-900">
              {user?.totalOrders || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Commandes totales</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">
              {user?.completedOrders || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Complétées</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">
              {user?.averageRating > 0 ? parseFloat(user.averageRating).toFixed(1) : '-'}
            </p>
            <p className="text-sm text-gray-600 mt-1">Note moyenne ⭐</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">
              {user?.totalReviews || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Avis reçus</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SellerProfile;