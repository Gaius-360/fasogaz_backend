// ==========================================
// FICHIER: src/pages/client/Settings.jsx (VERSION COMPLÈTE)
// ==========================================
import React, { useState } from 'react';
import { ArrowLeft, Lock, Bell, Globe, Shield, AlertTriangle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import useAuthStore from '../../store/authStore';
import { api } from '../../api/apiSwitch';

// Modals
import PrivacyPolicyModal from '../../components/client/PrivacyPolicyModal';
import TermsModal from '../../components/client/TermsModal';
import DeleteAccountModal from '../../components/client/DeleteAccountModal';

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // États pour les modals
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    orders: true,
    promotions: true,
    subscription: true
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async () => {
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setAlert({
        type: 'error',
        message: 'Tous les champs sont requis'
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({
        type: 'error',
        message: 'Les mots de passe ne correspondent pas'
      });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const response = await api.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

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
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors de la modification'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    // TODO: Sauvegarder les préférences en base de données
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/client/profile')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600">Gérez vos préférences</p>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Changer mot de passe */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Lock className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Changer le mot de passe
          </h2>
        </div>

        <div className="space-y-4">
          <Input
            label="Mot de passe actuel"
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            placeholder="••••••••"
          />

          <Input
            label="Nouveau mot de passe"
            name="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            placeholder="••••••••"
          />

          <Input
            label="Confirmer le mot de passe"
            name="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            placeholder="••••••••"
          />

          <Button
            variant="primary"
            fullWidth
            onClick={handleSavePassword}
            loading={loading}
            disabled={loading}
          >
            Enregistrer le nouveau mot de passe
          </Button>
        </div>
      </Card>

      

      {/* Confidentialité */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Confidentialité et sécurité
          </h2>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowPrivacyModal(true)}
          >
            <FileText className="h-5 w-5 mr-2" />
            Politique de confidentialité
          </Button>
          
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowTermsModal(true)}
          >
            <FileText className="h-5 w-5 mr-2" />
            Conditions d'utilisation
          </Button>
          
          <Button
            variant="danger"
            fullWidth
            onClick={() => setShowDeleteModal(true)}
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            Supprimer mon compte
          </Button>
        </div>
      </Card>

      {/* Modals */}
      {showPrivacyModal && (
        <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />
      )}

      {showTermsModal && (
        <TermsModal onClose={() => setShowTermsModal(false)} />
      )}

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          user={user}
        />
      )}
    </div>
  );
};

export default Settings;