// ==========================================
// FICHIER: src/pages/admin/AdminSettings.jsx
// Paramètres de l'administration
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
  Info
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';

const AdminSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'GAZBF',
    version: '2.0',
    supportPhone: '',
    supportEmail: '',
    validationDelay: 48,
    autoValidation: false
  });

  const [pricing, setPricing] = useState({
  client: {
    weekly: '',
    monthly: '',
    quarterly: '',
    yearly: '',
    freeDays: 0
  },
  seller: {
    weekly: '',
    monthly: '',
    quarterly: '',
    yearly: '',
    freeDays: 0
  }
});


  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [settingsRes, pricingRes] = await Promise.all([
        api.admin.settings.get(),
        api.admin.settings.getPricing()
      ]);

      if (settingsRes.success) {
        setGeneralSettings(settingsRes.data);
      }
      if (pricingRes.success) {
        setPricing(pricingRes.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement'
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

  const handlePricingChange = (category, plan, value) => {
    setPricing(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [plan]: parseFloat(value) || 0
      }
    }));
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const response = await api.admin.settings.update(generalSettings);
      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Paramètres généraux mis à jour'
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors de la mise à jour'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePricing = async () => {
    setSaving(true);
    try {
      const response = await api.admin.settings.updatePricing(pricing);
      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Tarifs mis à jour'
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors de la mise à jour'
      });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'pricing', label: 'Tarification', icon: DollarSign },
    { id: 'validation', label: 'Validation', icon: Clock },
    { id: 'security', label: 'Sécurité', icon: Shield }
  ];

  if (loading) {
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
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
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
                    placeholder="support@gazbf.bf"
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

            {/* Tarification */}
{activeTab === 'pricing' && (
  <div className="space-y-6">

    {/* ================= CLIENTS ================= */}
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Abonnements Clients
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Semaine (FCFA)"
          type="number"
          value={pricing.client.weekly}
          onChange={(e) =>
            handlePricingChange('client', 'weekly', e.target.value)
          }
          min="0"
        />

        <Input
          label="Mois (FCFA)"
          type="number"
          value={pricing.client.monthly}
          onChange={(e) =>
            handlePricingChange('client', 'monthly', e.target.value)
          }
          min="0"
        />

        <Input
          label="Trimestre (FCFA)"
          type="number"
          value={pricing.client.quarterly}
          onChange={(e) =>
            handlePricingChange('client', 'quarterly', e.target.value)
          }
          min="0"
        />

        <Input
          label="Année (FCFA)"
          type="number"
          value={pricing.client.yearly}
          onChange={(e) =>
            handlePricingChange('client', 'yearly', e.target.value)
          }
          min="0"
        />
      </div>

      <div className="mt-4">
        <Input
          label="Jours gratuits pour nouveaux clients"
          type="number"
          value={pricing.client.freeDays}
          onChange={(e) =>
            handlePricingChange('client', 'freeDays', e.target.value)
          }
          min="0"
          helpText="Ex: 7 = 7 jours gratuits à l’inscription"
        />
      </div>
    </div>

    {/* ================= REVENDEURS ================= */}
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Abonnements Revendeurs
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Semaine (FCFA)"
          type="number"
          value={pricing.seller.weekly}
          onChange={(e) =>
            handlePricingChange('seller', 'weekly', e.target.value)
          }
          min="0"
        />

        <Input
          label="Mois (FCFA)"
          type="number"
          value={pricing.seller.monthly}
          onChange={(e) =>
            handlePricingChange('seller', 'monthly', e.target.value)
          }
          min="0"
        />

        <Input
          label="Trimestre (FCFA)"
          type="number"
          value={pricing.seller.quarterly}
          onChange={(e) =>
            handlePricingChange('seller', 'quarterly', e.target.value)
          }
          min="0"
        />

        <Input
          label="Année (FCFA)"
          type="number"
          value={pricing.seller.yearly}
          onChange={(e) =>
            handlePricingChange('seller', 'yearly', e.target.value)
          }
          min="0"
        />
      </div>

      <div className="mt-4">
        <Input
          label="Jours gratuits pour nouveaux revendeurs"
          type="number"
          value={pricing.seller.freeDays}
          onChange={(e) =>
            handlePricingChange('seller', 'freeDays', e.target.value)
          }
          min="0"
          helpText="Période d’essai gratuite pour les nouveaux revendeurs"
        />
      </div>
    </div>

    {/* ================= BOUTON SAVE ================= */}
    <Button
      variant="primary"
      onClick={handleSavePricing}
      loading={saving}
    >
      <Save className="h-5 w-5 mr-2" />
      Enregistrer les Tarifs
    </Button>
  </div>
)}
            {/* Validation */}
            {activeTab === 'validation' && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Paramètres de Validation
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Délai de traitement des demandes
                    </label>
                    <select
                      name="validationDelay"
                      value={generalSettings.validationDelay}
                      onChange={handleGeneralChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="24">24 heures</option>
                      <option value="48">48 heures (recommandé)</option>
                      <option value="72">72 heures</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Délai maximum pour traiter une demande de revendeur
                    </p>
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="autoValidation"
                      name="autoValidation"
                      checked={generalSettings.autoValidation}
                      onChange={handleGeneralChange}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"
                    />
                    <label htmlFor="autoValidation" className="ml-3">
                      <span className="text-sm font-medium text-gray-700">
                        Validation automatique
                      </span>
                      <p className="text-xs text-gray-500">
                        Valider automatiquement les profils complets après 24h
                      </p>
                    </label>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-medium mb-1">Note importante</p>
                        <p>
                          La validation manuelle reste recommandée pour maintenir
                          la qualité de la plateforme et éviter les profils frauduleux.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleSaveGeneral}
                    loading={saving}
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Enregistrer
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

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="loginHistory"
                          defaultChecked
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"
                        />
                        <label htmlFor="loginHistory" className="ml-3">
                          <span className="text-sm font-medium text-gray-700">
                            Historique des connexions
                          </span>
                          <p className="text-xs text-gray-500">
                            Conserver un journal des connexions admin
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Sauvegarde des Données
                    </h3>

                    <div className="p-4 bg-gray-50 rounded-lg mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Dernière sauvegarde:</strong> 10/12/2025 à 03:00
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Fréquence:</strong> Quotidienne (automatique)
                      </p>
                    </div>

                    <Button variant="outline">
                      Effectuer une sauvegarde maintenant
                    </Button>
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