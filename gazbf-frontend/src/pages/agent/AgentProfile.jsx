// ==========================================
// FICHIER: src/pages/agent/AgentProfile.jsx
// Profil et paramètres de l'agent terrain
// ✅ RESPONSIVE: Optimisé pour mobile, tablette et desktop
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Key,
  Save,
  Edit2,
  CheckCircle,
  Calendar,
  TrendingUp,
  Award,
  Target,
  Users,
  Link2,
  Eye,
  EyeOff
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import useAuthStore from '../../store/authStore';
import { api } from '../../api/apiSwitch';
import { formatDate } from '../../utils/helpers';

const AgentProfile = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // État du profil
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    agentZone: ''
  });

  // État changement mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Statistiques
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Mode édition
  const [isEditing, setIsEditing] = useState(false);

  // ==========================================
  // INITIALISATION
  // ==========================================
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        agentZone: user.agentZone || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab]);

  // ==========================================
  // CHARGER STATISTIQUES
  // ==========================================
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await api.invitations.getMyInvitations();
      
      if (response.success) {
        const invitations = response.data.invitations;
        const statsData = response.data.stats;

        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();

        const thisMonthInvitations = invitations.filter(inv => {
          const invDate = new Date(inv.createdAt);
          return invDate.getMonth() === thisMonth && 
                 invDate.getFullYear() === thisYear;
        });

        const thisMonthUsed = thisMonthInvitations.filter(
          inv => inv.status === 'used'
        ).length;

        const conversionRate = statsData.total > 0
          ? Math.round((statsData.used / statsData.total) * 100)
          : 0;

        const monthConversionRate = thisMonthInvitations.length > 0
          ? Math.round((thisMonthUsed / thisMonthInvitations.length) * 100)
          : 0;

        const dayStats = {};
        invitations.forEach(inv => {
          const day = new Date(inv.createdAt).toLocaleDateString('fr-FR', { 
            weekday: 'long' 
          });
          dayStats[day] = (dayStats[day] || 0) + 1;
        });

        const bestDay = Object.entries(dayStats).sort((a, b) => b[1] - a[1])[0];

        setStats({
          ...statsData,
          thisMonth: thisMonthInvitations.length,
          thisMonthUsed,
          conversionRate,
          monthConversionRate,
          bestDay: bestDay ? bestDay[0] : 'N/A',
          bestDayCount: bestDay ? bestDay[1] : 0,
          recentInvitations: invitations.slice(0, 5)
        });
      }
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // ==========================================
  // METTRE À JOUR LE PROFIL
  // ==========================================
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setAlert(null);

      if (!profileData.firstName || !profileData.lastName) {
        setAlert({
          type: 'error',
          message: 'Prénom et nom requis'
        });
        return;
      }

      const response = await api.auth.updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email || null
      });

      if (response.success) {
        updateUser(response.data.user);
        
        setAlert({
          type: 'success',
          message: 'Profil mis à jour avec succès'
        });
        
        setIsEditing(false);
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors de la mise à jour'
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CHANGER LE MOT DE PASSE
  // ==========================================
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setAlert(null);

      if (!passwordData.currentPassword || !passwordData.newPassword) {
        setAlert({
          type: 'error',
          message: 'Tous les champs sont requis'
        });
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setAlert({
          type: 'error',
          message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
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
      console.error('❌ Erreur changement mot de passe:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Mot de passe actuel incorrect'
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ANNULER ÉDITION
  // ==========================================
  const handleCancelEdit = () => {
    setProfileData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      agentZone: user.agentZone || ''
    });
    setIsEditing(false);
    setAlert(null);
  };

  // ==========================================
  // TABS
  // ==========================================
  const tabs = [
    { id: 'profile', label: 'Mon profil', icon: User },
    { id: 'stats', label: 'Statistiques', icon: TrendingUp }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* En-tête - Responsive */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 sm:mb-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-sm sm:text-base text-orange-100">Agent terrain FasoGaz</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="font-mono font-bold text-sm sm:text-base">{user?.agentCode}</span>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 sm:px-4 self-start">
            <p className="text-xs text-orange-100 mb-1">Membre depuis</p>
            <p className="font-semibold text-sm sm:text-base">{formatDate(user?.createdAt)}</p>
          </div>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Tabs - Responsive */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="border-b">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setAlert(null);
                  }}
                  className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* TAB: PROFIL */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Informations personnelles
                </h2>
                {!isEditing && (
                  <Button
                    variant="outline"
                    icon={Edit2}
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto"
                  >
                    Modifier
                  </Button>
                )}
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-6">
                {/* Prénom & Nom - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <Input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ 
                        ...profileData, 
                        firstName: e.target.value 
                      })}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <Input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ 
                        ...profileData, 
                        lastName: e.target.value 
                      })}
                      disabled={!isEditing}
                      required
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed text-sm sm:text-base"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Le numéro de téléphone ne peut pas être modifié
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (optionnel)
                  </label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ 
                      ...profileData, 
                      email: e.target.value 
                    })}
                    icon={Mail}
                    disabled={!isEditing}
                    placeholder="exemple@email.com"
                  />
                </div>

                {/* Zone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zone d'affectation
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={profileData.agentZone}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed text-sm sm:text-base"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Contactez un administrateur pour changer de zone
                  </p>
                </div>

                {/* Code agent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code agent
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={user?.agentCode || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed font-mono text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Boutons - Responsive */}
                {isEditing && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      onClick={handleCancelEdit}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={loading}
                      icon={Save}
                    >
                      Enregistrer
                    </Button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB: STATISTIQUES - Responsive */}
          {activeTab === 'stats' && (
            <div className="space-y-4 sm:space-y-6">
              {loadingStats ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
              ) : stats ? (
                <>
                  {/* Résumé rapide - Responsive Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-medium text-blue-700">Total</p>
                        <Link2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-900">{stats.total}</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 sm:p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-medium text-green-700">Utilisées</p>
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-green-900">{stats.used}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {stats.conversionRate}%
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 sm:p-4 border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-medium text-orange-700">Ce mois</p>
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-orange-900">{stats.thisMonth}</p>
                      <p className="text-xs text-orange-600 mt-1">
                        {stats.thisMonthUsed} utilisées
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 sm:p-4 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs sm:text-sm font-medium text-purple-700">Meilleur</p>
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                      <p className="text-base sm:text-lg font-bold text-purple-900 capitalize truncate">
                        {stats.bestDay}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        {stats.bestDayCount} inv.
                      </p>
                    </div>
                  </div>

                  {/* Performances */}
                  <div className="bg-white rounded-lg border p-4 sm:p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      <span className="text-sm sm:text-base">Performances</span>
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm text-gray-600">Taux global</span>
                          <span className="text-xs sm:text-sm font-semibold text-gray-900">
                            {stats.conversionRate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 sm:h-3 rounded-full transition-all"
                            style={{ width: `${stats.conversionRate}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs sm:text-sm text-gray-600">Taux ce mois</span>
                          <span className="text-xs sm:text-sm font-semibold text-gray-900">
                            {stats.monthConversionRate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                          <div
                            className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 sm:h-3 rounded-full transition-all"
                            style={{ width: `${stats.monthConversionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Invitations récentes */}
                  {stats.recentInvitations && stats.recentInvitations.length > 0 && (
                    <div className="bg-white rounded-lg border p-4 sm:p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-orange-600" />
                        <span className="text-sm sm:text-base">Dernières invitations</span>
                      </h3>

                      <div className="space-y-2 sm:space-y-3">
                        {stats.recentInvitations.map((inv) => (
                          <div
                            key={inv.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(inv.createdAt)}
                              </p>
                              {inv.seller && (
                                <p className="text-xs text-gray-600 truncate">
                                  {inv.seller.businessName}
                                </p>
                              )}
                            </div>
                            <span className={`self-start sm:self-auto px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                              inv.status === 'used'
                                ? 'bg-green-100 text-green-800'
                                : inv.status === 'active'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {inv.status === 'used' ? 'Utilisé' :
                               inv.status === 'active' ? 'Actif' : 'Expiré'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message encouragement */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                          Excellent travail !
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-700">
                          {stats.conversionRate >= 70
                            ? `Votre taux de conversion de ${stats.conversionRate}% est excellent ! Continuez comme ça.`
                            : stats.conversionRate >= 50
                            ? `Bon travail ! Vous êtes sur la bonne voie avec ${stats.conversionRate}% de conversion.`
                            : `Continuez vos efforts ! Chaque invitation compte pour développer notre réseau.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune statistique disponible</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentProfile;