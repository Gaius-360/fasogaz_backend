import React, { useState } from 'react';
import { ArrowLeft, Lock, Bell, Clock, Globe, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';

const SellerSettings = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Horaires
  const [schedule, setSchedule] = useState({
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '08:00', close: '14:00', closed: false },
    sunday: { open: '', close: '', closed: true }
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
    try {
      await api.auth.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      setAlert({
        type: 'success',
        message: 'Mot de passe modifié avec succès'
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors de la modification'
      });
    } finally {
      setLoading(false);
    }
  };

  const days = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
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

      {/* Header */}
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

      {/* Horaires d'ouverture */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-6 w-6 text-secondary-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Horaires d'ouverture
          </h2>
        </div>

        <div className="space-y-3">
          {days.map(day => (
            <div key={day.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-24">
                <span className="font-medium text-gray-900">{day.label}</span>
              </div>
              
              {schedule[day.key].closed ? (
                <div className="flex-1">
                  <span className="text-sm text-gray-500">Fermé</span>
                </div>
              ) : (
                <div className="flex-1 flex gap-2">
                  <input
                    type="time"
                    value={schedule[day.key].open}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="time"
                    value={schedule[day.key].close}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              )}
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={schedule[day.key].closed}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600">Fermé</span>
              </label>
            </div>
          ))}
        </div>

        <Button variant="primary" fullWidth className="mt-4">
          Enregistrer les horaires
        </Button>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-6 w-6 text-secondary-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Nouvelles commandes</p>
              <p className="text-sm text-gray-600">Recevoir une notification pour chaque commande</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium text-gray-900">Avis clients</p>
              <p className="text-sm text-gray-600">Notification quand vous recevez un avis</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Expiration abonnement</p>
              <p className="text-sm text-gray-600">Alerte 7 jours avant expiration</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
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
          <Button variant="outline" fullWidth>
            Conditions d'utilisation revendeur
          </Button>
          <Button variant="outline" fullWidth>
            Politique de confidentialité
          </Button>
          <Button variant="danger" fullWidth>
            Suspendre mon compte
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SellerSettings;