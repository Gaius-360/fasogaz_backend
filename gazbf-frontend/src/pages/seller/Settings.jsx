// ==========================================
// FICHIER: src/pages/seller/Settings.jsx
// ==========================================
import React, { useState } from 'react';
import { ArrowLeft, Lock, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import SellerTermsModal from '../../components/seller/SellerTermsModal';
import SellerPrivacyPolicyModal from '../../components/seller/SellerPrivacyPolicyModal';
import DeleteAccountModal from '../../components/client/DeleteAccountModal';
import useAuthStore from '../../store/authStore';
import { api } from '../../api/apiSwitch';

const SellerSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // ✅ NOUVEAU

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({ type: 'error', message: 'Les mots de passe ne correspondent pas' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.success) {
        setAlert({ type: 'success', message: 'Mot de passe modifié avec succès' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/seller/profile')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600">Gérez vos préférences</p>
        </div>
      </div>

      {/* Changer mot de passe */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Lock className="h-6 w-6 text-secondary-600" />
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
          >
            Enregistrer le nouveau mot de passe
          </Button>
        </div>
      </Card>

      {/* Confidentialité */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-secondary-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Confidentialité & Sécurité
          </h2>
        </div>

        <div className="space-y-3">
          <Button variant="outline" fullWidth onClick={() => setShowTerms(true)}>
            Conditions d'utilisation
          </Button>
          <Button variant="outline" fullWidth onClick={() => setShowPrivacy(true)}>
            Politique de confidentialité
          </Button>

          {/* ✅ BOUTON SUPPRESSION → ouvre la modal */}
          <Button
            variant="danger"
            fullWidth
            onClick={() => setShowDeleteModal(true)}
          >
            Supprimer définitivement mon compte
          </Button>
        </div>
      </Card>

      {/* Modales */}
      {showTerms && <SellerTermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <SellerPrivacyPolicyModal onClose={() => setShowPrivacy(false)} />}

      {/* ✅ Modal suppression compte — réutilise le composant client */}
      {showDeleteModal && (
        <DeleteAccountModal
          user={user}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default SellerSettings;