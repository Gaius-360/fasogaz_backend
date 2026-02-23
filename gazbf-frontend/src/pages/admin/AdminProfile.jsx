// ==========================================
// FICHIER: src/pages/admin/AdminProfile.jsx
// Page de profil et sécurité administrateur
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle,
  Calendar,
  Key
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import useAuthStore from '../../store/authStore';

const AdminProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // État profil
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    
    username: ''
  });

  // État mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.adminAuth.getProfile();
      if (response.success) {
        setProfileData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          username: response.data.username || ''
        });
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = () => {
    const errors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Mot de passe actuel requis';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'Nouveau mot de passe requis';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Minimum 8 caractères';
    } else if (!/[A-Z]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Doit contenir au moins une majuscule';
    } else if (!/[a-z]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Doit contenir au moins une minuscule';
    } else if (!/[0-9]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Doit contenir au moins un chiffre';
    } else if (!/[@$!%*?&#]/.test(passwordData.newPassword)) {
      errors.newPassword = 'Doit contenir au moins un caractère spécial (@$!%*?&#)';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Confirmation requise';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (passwordData.currentPassword && passwordData.newPassword && 
        passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'Le nouveau mot de passe doit être différent';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    try {
      // Simulation - À remplacer par l'API réelle
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateUser(profileData);
      
      setAlert({
        type: 'success',
        message: 'Profil mis à jour avec succès'
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors de la mise à jour'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!validatePassword()) return;

    setLoading(true);

    try {
      const response = await api.adminAuth.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Mot de passe modifié avec succès'
        });
        
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setShowPasswords({
          current: false,
          new: false,
          confirm: false
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors du changement de mot de passe'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&#]/.test(password)) strength++;

    if (strength <= 2) return { strength: 33, label: 'Faible', color: 'bg-red-500' };
    if (strength <= 4) return { strength: 66, label: 'Moyen', color: 'bg-yellow-500' };
    return { strength: 100, label: 'Fort', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-lg">
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
          <p className="text-gray-600">Gérer vos informations et votre sécurité</p>
        </div>
      </div>

      {/* Alertes */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`
              pb-4 px-1 border-b-2 font-medium transition-colors
              ${activeTab === 'profile'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations
            </div>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`
              pb-4 px-1 border-b-2 font-medium transition-colors
              ${activeTab === 'security'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sécurité
            </div>
          </button>
        </nav>
      </div>

      {/* Contenu des tabs */}
      {activeTab === 'profile' && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Informations du compte
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Prénom"
                name="firstName"
                type="text"
                value={profileData.firstName}
                onChange={handleProfileChange}
                icon={User}
              />

              <Input
                label="Nom"
                name="lastName"
                type="text"
                value={profileData.lastName}
                onChange={handleProfileChange}
                icon={User}
              />
            </div>

            <Input
              label="Nom d'utilisateur"
              name="username"
              type="text"
              value={profileData.username}
              onChange={handleProfileChange}
              disabled
              icon={User}
              helpText="Le nom d'utilisateur ne peut pas être modifié"
            />

            

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Compte Administrateur
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Vous avez un accès complet à toutes les fonctionnalités de la plateforme
                  </p>
                  
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => loadProfile()}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Info sécurité */}
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <div className="flex gap-4">
              <div className="p-3 bg-red-100 rounded-lg h-fit">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Sécurité du compte administrateur
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  En tant qu'administrateur, la sécurité de votre compte est primordiale. 
                  Utilisez un mot de passe fort et unique.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Minimum 8 caractères</li>
                  <li>• Au moins une majuscule et une minuscule</li>
                  <li>• Au moins un chiffre</li>
                  <li>• Au moins un caractère spécial (@$!%*?&#)</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Formulaire changement de mot de passe */}
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Modifier le mot de passe
              </h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="relative">
                <Input
                  label="Mot de passe actuel"
                  name="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.currentPassword}
                  icon={Lock}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.current ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Nouveau mot de passe"
                  name="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.newPassword}
                  icon={Lock}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
                
                {/* Indicateur de force */}
                {passwordData.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Force du mot de passe</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.strength === 100 ? 'text-green-600' :
                        passwordStrength.strength === 66 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.strength}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <Input
                  label="Confirmer le nouveau mot de passe"
                  name="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.confirmPassword}
                  icon={Lock}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setPasswordErrors({});
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Modifier le mot de passe
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;