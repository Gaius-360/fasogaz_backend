
// ==========================================
// FICHIER: src/pages/client/Settings.jsx (NOUVEAU)
// ==========================================
import React, { useState } from 'react';
import { ArrowLeft, Lock, Bell, Globe, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';

const Settings = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
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
      setAlert({
        type: 'error',
        message: 'Les mots de passe ne correspondent pas'
      });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      // Simulation
      setTimeout(() => {
        setAlert({
          type: 'success',
          message: 'Mot de passe modifié avec succès'
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors de la modification'
      });
      setLoading(false);
    }
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
            helpText="Au moins 8 caractères"
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

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Commandes</p>
              <p className="text-sm text-gray-600">Notifications sur vos commandes</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-primary-600" />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Promotions</p>
              <p className="text-sm text-gray-600">Offres spéciales et nouveautés</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-primary-600" />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Abonnement</p>
              <p className="text-sm text-gray-600">Alertes d'expiration</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-primary-600" />
          </div>
        </div>
      </Card>

      {/* Confidentialité */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Confidentialité
          </h2>
        </div>

        <div className="space-y-3">
          <Button variant="outline" fullWidth>
            Politique de confidentialité
          </Button>
          <Button variant="outline" fullWidth>
            Conditions d'utilisation
          </Button>
          <Button variant="danger" fullWidth>
            Supprimer mon compte
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;