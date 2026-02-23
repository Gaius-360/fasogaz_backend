// ==========================================
// FICHIER: src/pages/admin/AdminSettings.jsx (CORRIGÉ)
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Save,
  ArrowLeft,
  DollarSign,
  Clock,
  Shield,
  Info,
  Users,
  Store,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';

const AdminSettings = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'FasoGaz',
    version: '2.0',
    supportPhone: '',
    supportEmail: '',
    validationDelay: 48,
    autoValidation: false
  });

  const [clientConfig, setClientConfig] = useState({
    isActive: false,
    freeTrialDays: 0,
    plans: {
      weekly: { price: 0, duration: 7, enabled: false },
      monthly: { price: 0, duration: 30, enabled: false },
      quarterly: { price: 0, duration: 90, enabled: false },
      yearly: { price: 0, duration: 365, enabled: false }
    },
    options: {
      autoRenew: true,
      gracePeriodDays: 3,
      notifyBeforeExpiry: 7
    }
  });

  const [revendeurConfig, setRevendeurConfig] = useState({
    isActive: false,
    freeTrialDays: 0,
    plans: {
      weekly: { price: 0, duration: 7, enabled: false },
      monthly: { price: 0, duration: 30, enabled: false },
      quarterly: { price: 0, duration: 90, enabled: false },
      yearly: { price: 0, duration: 365, enabled: false }
    },
    options: {
      autoRenew: true,
      gracePeriodDays: 3,
      notifyBeforeExpiry: 7
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Charger les paramètres généraux
      const settingsResponse = await api.admin.settings.get();
      if (settingsResponse?.success) {
        setGeneralSettings(settingsResponse.data);
      }

      // Charger la tarification
      const pricingResponse = await api.admin.settings.getPricing();
      if (pricingResponse?.success) {
        const { client, revendeur } = pricingResponse.data;
        
        if (client) {
          setClientConfig({
            isActive: client.isActive || false,
            freeTrialDays: client.freeTrialDays || 0,
            plans: client.plans || {
              weekly: { price: 0, duration: 7, enabled: false },
              monthly: { price: 0, duration: 30, enabled: false },
              quarterly: { price: 0, duration: 90, enabled: false },
              yearly: { price: 0, duration: 365, enabled: false }
            },
            options: client.options || {
              autoRenew: true,
              gracePeriodDays: 3,
              notifyBeforeExpiry: 7
            }
          });
        }

        if (revendeur) {
          setRevendeurConfig({
            isActive: revendeur.isActive || false,
            freeTrialDays: revendeur.freeTrialDays || 0,
            plans: revendeur.plans || {
              weekly: { price: 0, duration: 7, enabled: false },
              monthly: { price: 0, duration: 30, enabled: false },
              quarterly: { price: 0, duration: 90, enabled: false },
              yearly: { price: 0, duration: 365, enabled: false }
            },
            options: revendeur.options || {
              autoRenew: true,
              gracePeriodDays: 3,
              notifyBeforeExpiry: 7
            }
          });
        }
      }
    } catch (err) {
      console.error('Erreur chargement:', err);
      setAlert({
        type: 'error',
        message: err.message || 'Erreur lors du chargement'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const response = await api.admin.settings.update(generalSettings);
      if (response?.success) {
        setAlert({
          type: 'success',
          message: 'Paramètres généraux mis à jour avec succès'
        });
      }
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setAlert({
        type: 'error',
        message: err.message || 'Erreur lors de la mise à jour'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClient = async () => {
    setSaving(true);
    try {
      // ✅ STRUCTURE CORRIGÉE
      const response = await api.admin.settings.updatePricing({
        targetRole: 'client',
        config: {
          isActive: clientConfig.isActive,
          freeTrialDays: parseInt(clientConfig.freeTrialDays) || 0,
          plans: clientConfig.plans,
          options: clientConfig.options
        }
      });

      if (response?.success) {
        setAlert({
          type: 'success',
          message: 'Configuration client enregistrée avec succès'
        });
        await loadSettings(); // Recharger
      }
    } catch (err) {
      console.error('Erreur sauvegarde client:', err);
      setAlert({
        type: 'error',
        message: err.message || 'Erreur lors de la sauvegarde'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRevendeur = async () => {
    setSaving(true);
    try {
      // ✅ STRUCTURE CORRIGÉE
      const response = await api.admin.settings.updatePricing({
        targetRole: 'revendeur',
        config: {
          isActive: revendeurConfig.isActive,
          freeTrialDays: parseInt(revendeurConfig.freeTrialDays) || 0,
          plans: revendeurConfig.plans,
          options: revendeurConfig.options
        }
      });

      if (response?.success) {
        setAlert({
          type: 'success',
          message: 'Configuration revendeur enregistrée avec succès'
        });
        await loadSettings(); // Recharger
      }
    } catch (err) {
      console.error('Erreur sauvegarde revendeur:', err);
      setAlert({
        type: 'error',
        message: err.message || 'Erreur lors de la sauvegarde'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateClientPlan = (planType, field, value) => {
    setClientConfig(prev => ({
      ...prev,
      plans: {
        ...prev.plans,
        [planType]: {
          ...prev.plans[planType],
          [field]: field === 'enabled' ? value : parseFloat(value) || 0
        }
      }
    }));
  };

  const updateRevendeurPlan = (planType, field, value) => {
    setRevendeurConfig(prev => ({
      ...prev,
      plans: {
        ...prev.plans,
        [planType]: {
          ...prev.plans[planType],
          [field]: field === 'enabled' ? value : parseFloat(value) || 0
        }
      }
    }));
  };

  const planLabels = {
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    yearly: 'Annuel'
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'security', label: 'Sécurité', icon: Shield }
  ];

  if (loading && !generalSettings.platformName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Paramètres
                  </h1>
                  <p className="text-sm text-gray-500">Configuration de la plateforme</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Alertes */}
        {(alert || error) && (
          <Alert
            type={alert?.type || 'error'}
            message={alert?.message || error}
            onClose={() => {
              setAlert(null);
              setError(null);
            }}
            className="mb-6"
          />
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Tabs */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-lg border p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="col-span-12 lg:col-span-9">
            
            {/* Général */}
            {activeTab === 'general' && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Paramètres Généraux
                </h2>

                <div className="space-y-6">
                  <Input
                    label="Nom de la plateforme"
                    name="platformName"
                    value={generalSettings.platformName}
                    onChange={handleGeneralChange}
                    required
                  />

                  <Input
                    label="Version"
                    name="version"
                    value={generalSettings.version}
                    onChange={handleGeneralChange}
                    required
                    disabled
                  />

                  <Input
                    label="Téléphone Support"
                    name="supportPhone"
                    type="tel"
                    placeholder="+226 XX XX XX XX"
                    value={generalSettings.supportPhone}
                    onChange={handleGeneralChange}
                    required
                  />

                  <Input
                    label="Email Support"
                    name="supportEmail"
                    type="email"
                    placeholder="support@fasogaz.bf"
                    value={generalSettings.supportEmail}
                    onChange={handleGeneralChange}
                    required
                  />

                  <Button
                    variant="primary"
                    onClick={handleSaveGeneral}
                    loading={saving}
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Enregistrer les Modifications
                  </Button>
                </div>
              </div>
            )}

            

            {/* Sécurité */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Sécurité
                </h2>

                <div className="space-y-6">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-yellow-900">
                        <p className="font-medium mb-1">Sécurité du compte</p>
                        <p className="mb-3">
                          Pour des raisons de sécurité, le changement de mot de passe
                          administrateur doit être effectué depuis les paramètres
                          du profil.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/admin/profile')}
                        >
                          Modifier le mot de passe
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Options de Sécurité
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="twoFactor"
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"
                        />
                        <label htmlFor="twoFactor" className="ml-3">
                          <span className="text-sm font-medium text-gray-700">
                            Authentification à deux facteurs (2FA)
                          </span>
                          <p className="text-xs text-gray-500">
                            Sécurité renforcée pour la connexion admin
                          </p>
                        </label>
                      </div>

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="autoLogout"
                          defaultChecked
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"
                        />
                        <label htmlFor="autoLogout" className="ml-3">
                          <span className="text-sm font-medium text-gray-700">
                            Déconnexion automatique
                          </span>
                          <p className="text-xs text-gray-500">
                            Après 30 minutes d'inactivité
                          </p>
                        </label>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;