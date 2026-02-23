// ==========================================
// FICHIER: src/pages/client/ProfileComplete.jsx (CORRIGÉ)
// ==========================================
import React, { useState } from 'react';
import { User, MapPin, CreditCard, Star, Settings, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';

const ProfileComplete = () => {
  const { user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setAlert(null);
    
    try {
      const response = await api.auth.updateProfile(formData);
      
      if (response.success) {
        updateUser(response.data);
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

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || ''
    });
    setEditMode(false);
    setAlert(null);
  };

  const menuItems = [
    {
      icon: MapPin,
      label: 'Mes adresses',
      description: 'Gérer mes adresses de livraison',
      onClick: () => navigate('/client/addresses')
    },
    {
      icon: CreditCard,
      label: 'Mon abonnement',
      description: 'Gérer mon abonnement',
      onClick: () => navigate('/client/subscription')
    },
    {
      icon: Star,
      label: 'Mes avis',
      description: 'Avis que j\'ai laissés',
      onClick: () => navigate('/client/my-reviews')
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Profil */}
      <Card>
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Informations personnelles
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
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-primary-600" />
          </div>
          <div className="flex-1">
            {!editMode ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-gray-600">{user?.phone}</p>
                {user?.email && (
                  <p className="text-sm text-gray-500">{user.email}</p>
                )}
              </>
            ) : (
              <div className="space-y-3">
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
                
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Téléphone</p>
            <p className="font-medium">{user?.phone}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Ville</p>
            <p className="font-medium">{user?.city}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Type de compte</p>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Inscription</p>
            <p className="font-medium">
              {user?.createdAt 
                ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })
                : 'N/A'
              }
            </p>
          </div>
        </div>
      </Card>

      {/* Menu */}
      <Card padding={false}>
        <div className="divide-y">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="p-3 bg-primary-50 rounded-lg">
                <item.icon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <Card>
        <div className="space-y-3">
          <Button variant="outline" fullWidth onClick={() => navigate('/client/settings')}>
            <Settings className="h-5 w-5 mr-2" />
            Paramètres
          </Button>
          
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                logout();
                navigate('/login');
              }
            }}
          >
            Se déconnecter
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProfileComplete;