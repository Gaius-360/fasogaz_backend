// ==========================================
// FICHIER: src/pages/agent/AgentDashboard.jsx
// Dashboard principal de l'agent terrain
// ✅ RESPONSIVE: Optimisé pour mobile, tablette et desktop
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  Link2,
  Users,
  TrendingUp,
  Copy,
  Check,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  Store,
  Phone
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import { formatDate } from '../../utils/helpers';

const AgentDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [stats, setStats] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Modal de génération
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    expiryHours: 24, // 7 jours par défaut
    notes: ''
  });

  // ==========================================
  // CHARGER LES DONNÉES
  // ==========================================
  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const response = await api.invitations.getMyInvitations();
      if (response.success) {
        setInvitations(response.data.invitations);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('❌ Erreur chargement invitations:', error);
    }
  };

  // ==========================================
  // GÉNÉRER UN LIEN
  // ==========================================
  const handleGenerateLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);

    try {
      const response = await api.invitations.generate(modalData);

      if (response.success) {
        const { url, token } = response.data;

        setAlert({
          type: 'success',
          message: 'Lien généré avec succès !'
        });

        // Copier automatiquement
        await navigator.clipboard.writeText(url);

        // Recharger la liste
        loadInvitations();

        // Fermer le modal
        setShowModal(false);
        setModalData({ expiryHours: 24, notes: '' });
      }
    } catch (error) {
      console.error('❌ Erreur génération lien:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors de la génération'
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // COPIER UN LIEN
  // ==========================================
  const handleCopyLink = async (token) => {
    const url = `${window.location.origin}/register-revendeur?token=${token}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(token);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('❌ Erreur copie:', error);
    }
  };

  // ==========================================
  // STATS CARDS
  // ==========================================
  const statsCards = stats ? [
    { label: 'Total', value: stats.total, color: 'blue', icon: Link2 },
    { label: 'Utilisées', value: stats.used, color: 'green', icon: Check },
    { label: 'Actives', value: stats.active, color: 'yellow', icon: Clock },
    { label: 'Expirées', value: stats.expired, color: 'gray', icon: Calendar }
  ] : [];

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* En-tête - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Agent</h1>
          <p className="text-sm sm:text-base text-gray-600">Gérez vos invitations revendeurs</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
          icon={Link2}
          className="w-full sm:w-auto"
        >
          Générer un lien
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Stats - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 border border-${stat.color}-200 rounded-lg p-4 sm:p-6`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-gray-600">{stat.label}</p>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
              </div>
              <p className={`text-2xl sm:text-3xl font-bold text-${stat.color}-600`}>
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Liste des invitations */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 sm:p-6 border-b">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Mes invitations
          </h2>
        </div>

        {/* Version Desktop - Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date création
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Expire le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Utilisé par
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(inv.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        inv.status === 'used'
                          ? 'bg-green-100 text-green-800'
                          : inv.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : inv.status === 'expired'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {inv.status === 'used'
                        ? 'Utilisé'
                        : inv.status === 'active'
                        ? 'Actif'
                        : inv.status === 'expired'
                        ? 'Expiré'
                        : 'Révoqué'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(inv.expiresAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {inv.seller ? (
                      <div>
                        <p className="font-medium">{inv.seller.businessName}</p>
                        <p className="text-xs text-gray-500">{inv.seller.phone}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {inv.status === 'active' && (
                      <button
                        onClick={() => handleCopyLink(inv.token)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        {copiedId === inv.token ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copié
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copier
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invitations.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune invitation générée</p>
            </div>
          )}
        </div>

        {/* Version Mobile/Tablet - Cards */}
        <div className="lg:hidden divide-y divide-gray-200">
          {invitations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-sm sm:text-base">Aucune invitation générée</p>
            </div>
          ) : (
            invitations.map((inv) => (
              <div key={inv.id} className="p-4 space-y-3">
                {/* En-tête */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        inv.status === 'used'
                          ? 'bg-green-100 text-green-800'
                          : inv.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : inv.status === 'expired'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {inv.status === 'used'
                        ? 'Utilisé'
                        : inv.status === 'active'
                        ? 'Actif'
                        : inv.status === 'expired'
                        ? 'Expiré'
                        : 'Révoqué'}
                    </span>
                    <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-gray-600">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">Créé le {formatDate(inv.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Infos */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Expire: {formatDate(inv.expiresAt)}</span>
                  </div>

                  {inv.seller && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Store className="h-4 w-4 text-gray-600 flex-shrink-0" />
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {inv.seller.businessName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-gray-600">{inv.seller.phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {inv.status === 'active' && (
                  <button
                    onClick={() => handleCopyLink(inv.token)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    {copiedId === inv.token ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span className="font-medium text-sm">Lien copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span className="font-medium text-sm">Copier le lien</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de génération - Responsive */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Générer un lien d'invitation
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée de validité
                </label>
                <select
                  value={modalData.expiryHours}
                  onChange={(e) =>
                    setModalData({ ...modalData, expiryHours: parseInt(e.target.value) })
                  }
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                >
                  <option value={24}>24 heures</option>
                  <option value={72}>3 jours</option>
                  {/* <option value={168}>7 jours</option> */}
                  {/* <option value={336}>14 jours</option> */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={modalData.notes}
                  onChange={(e) =>
                    setModalData({ ...modalData, notes: e.target.value })
                  }
                  placeholder="Ex: Dépôt quartier Gounghin..."
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  rows={3}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="primary" fullWidth loading={loading}>
                  {loading ? 'Génération...' : 'Générer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;