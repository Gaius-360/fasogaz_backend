// ==========================================
// FICHIER: src/pages/admin/AdminSellers.jsx
// VERSION RESPONSIVE + COLONNE ABONNEMENT
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  Clock
} from 'lucide-react';
import Alert from '../../components/common/Alert';
import { formatDateTime } from '../../utils/helpers';
import useAdmin from '../../hooks/useAdmin';

const AdminSellers = () => {
  const navigate = useNavigate();

  const {
    loading,
    error,
    clearError,
    getAllSellers,
    suspendSeller,
    reactivateSeller,
    deleteSeller
  } = useAdmin();

  const [sellers, setSellers]                 = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [alert, setAlert]                     = useState(null);
  const [searchTerm, setSearchTerm]           = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');

  useEffect(() => { loadSellers(); }, []);
  useEffect(() => { filterSellers(); }, [searchTerm, subscriptionFilter, sellers]);

  const loadSellers = async () => {
    try {
      const response = await getAllSellers();
      if (response?.success) setSellers(response.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Erreur lors du chargement des revendeurs' });
    }
  };

  const filterSellers = () => {
    let filtered = [...sellers];

    // Filtre texte
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.includes(searchTerm) ||
        s.quarter?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre abonnement
    if (subscriptionFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(s => {
        const expiry = s.subscriptionEndDate ? new Date(s.subscriptionEndDate) : null;
        const isActive = s.hasActiveSubscription && expiry && expiry > now;
        const hasEverSubscribed = expiry !== null;

        if (subscriptionFilter === 'active')   return isActive;
        if (subscriptionFilter === 'expired')  return hasEverSubscribed && !isActive;
        if (subscriptionFilter === 'never')    return !hasEverSubscribed;
        if (subscriptionFilter === 'suspended') return isSuspended(s);
        return true;
      });
    }

    setFilteredSellers(filtered);
  };

  // ── Actions ──
  const handleSuspend = async (seller) => {
    if (!window.confirm(`Suspendre ${seller.businessName} ?`)) return;
    const reason = prompt('Raison de la suspension :');
    if (!reason) return;
    try {
      const response = await suspendSeller(seller.id, reason, 'indefinite');
      if (response?.success) { setAlert({ type: 'success', message: 'Revendeur suspendu' }); loadSellers(); }
    } catch (err) { setAlert({ type: 'error', message: err.message || 'Erreur lors de la suspension' }); }
  };

  const handleReactivate = async (seller) => {
    if (!window.confirm(`Réactiver ${seller.businessName} ?`)) return;
    try {
      const response = await reactivateSeller(seller.id);
      if (response?.success) { setAlert({ type: 'success', message: 'Revendeur réactivé' }); loadSellers(); }
    } catch (err) { setAlert({ type: 'error', message: err.message || 'Erreur lors de la réactivation' }); }
  };

  const handleDelete = async (seller) => {
    const confirmation = prompt(
      `⚠️ ATTENTION: Cette action est IRRÉVERSIBLE!\n\nPour supprimer ${seller.businessName}, tapez: SUPPRIMER`
    );
    if (confirmation !== 'SUPPRIMER') return;
    try {
      const response = await deleteSeller(seller.id);
      if (response?.success) { setAlert({ type: 'success', message: 'Revendeur supprimé' }); loadSellers(); }
    } catch (err) { setAlert({ type: 'error', message: err.message || 'Erreur lors de la suppression' }); }
  };

  const isSuspended = (seller) => seller.validationStatus === 'suspended';

  /**
   * Badge abonnement basé sur subscriptionEndDate + hasActiveSubscription
   * (même logique que getAccessBadge dans AdminClients)
   */
  const getSubscriptionBadge = (seller) => {
    const now    = new Date();
    const expiry = seller.subscriptionEndDate ? new Date(seller.subscriptionEndDate) : null;
    const isActive = seller.hasActiveSubscription && expiry && expiry > now;
    const hasEverSubscribed = expiry !== null;

    if (isActive) {
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      const urgent   = daysLeft <= 7;
      return (
        <div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium block w-fit ${
            urgent ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {urgent ? `⚠ ${daysLeft}j restants` : '✓ Actif'}
          </span>
          <span className="text-xs text-gray-400 mt-0.5 block">
            {expiry.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      );
    }

    if (hasEverSubscribed) {
      return (
        <div>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 block w-fit">
            ✗ Expiré
          </span>
          <span className="text-xs text-gray-400 mt-0.5 block">
            {expiry.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 block w-fit">
        Jamais abonné
      </span>
    );
  };

  // ── Boutons d'action réutilisables ──
  const ActionButtons = ({ seller }) => (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => navigate(`/admin/sellers/${seller.id}`)}
        className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
        title="Voir détails"
      >
        <Eye className="h-5 w-5" />
      </button>

      {!isSuspended(seller) ? (
        <button
          onClick={() => handleSuspend(seller)}
          className="p-1.5 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
          title="Suspendre"
          disabled={loading}
        >
          <Ban className="h-5 w-5" />
        </button>
      ) : (
        <button
          onClick={() => handleReactivate(seller)}
          className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
          title="Réactiver"
          disabled={loading}
        >
          <CheckCircle className="h-5 w-5" />
        </button>
      )}

      <button
        onClick={() => handleDelete(seller)}
        className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
        title="Supprimer"
        disabled={loading}
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );

  // ── Loading ──
  if (loading && !sellers.length) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Titre ── */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Store className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Gestion des Revendeurs</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {filteredSellers.length} revendeur{filteredSellers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Alertes ── */}
      {(alert || error) && (
        <Alert
          type={alert?.type || 'error'}
          message={alert?.message || error}
          onClose={() => { setAlert(null); clearError(); }}
        />
      )}

      {/* ── Recherche + Filtre abonnement ── */}
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nom, téléphone, quartier…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filtre abonnement */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <select
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">Tous les abonnements</option>
              <option value="active">Abonnement actif</option>
              <option value="expired">Abonnement expiré</option>
              <option value="never">Jamais abonné</option>
              <option value="suspended">Suspendus</option>
            </select>
          </div>
        </div>
      </div>

      {/* ══════ VERSION MOBILE : cards ══════ */}
      <div className="md:hidden space-y-3">
        {filteredSellers.length > 0 ? filteredSellers.map((seller) => (
          <div
            key={seller.id}
            className={`bg-white rounded-lg border p-4 ${isSuspended(seller) ? 'border-red-300 bg-red-50' : ''}`}
          >
            {/* Ligne 1 : nom + actions */}
            <div className="flex items-start justify-between mb-2.5 gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 truncate">{seller.businessName}</span>
                  {isSuspended(seller) && (
                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full flex-shrink-0">Suspendu</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{seller.firstName} {seller.lastName}</p>
              </div>
              <div className="flex-shrink-0">
                <ActionButtons seller={seller} />
              </div>
            </div>

            {/* Ligne 2 : contact + localisation */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-600 mb-2.5">
              <span>📞 {seller.phone}</span>
              <span>📍 {seller.quarter ? `${seller.quarter}, ` : ''}{seller.city}</span>
            </div>

            {/* Ligne 3 : abonnement + date */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              {getSubscriptionBadge(seller)}
              <span className="text-xs text-gray-500">
                {formatDateTime(seller.createdAt).split(' à ')[0]}
              </span>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || subscriptionFilter !== 'all'
                ? 'Aucun revendeur trouvé avec ces critères'
                : 'Aucun revendeur enregistré'}
            </p>
          </div>
        )}
      </div>

      {/* ══════ VERSION DESKTOP : tableau ══════ */}
      <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revendeur</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localisation</th>
                {/* ✅ NOUVEAU: Colonne abonnement */}
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abonnement</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Inscription</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSellers.map((seller) => (
                <tr
                  key={seller.id}
                  className={`hover:bg-gray-50 transition-colors ${isSuspended(seller) ? 'bg-red-50' : ''}`}
                >
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {seller.businessName}
                      {isSuspended(seller) && (
                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">Suspendu</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{seller.firstName} {seller.lastName}</div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{seller.phone}</div>
                    {seller.email && <div className="text-sm text-gray-500">{seller.email}</div>}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{seller.quarter || '—'}</div>
                    <div className="text-sm text-gray-500">{seller.city}</div>
                  </td>
                  {/* ✅ NOUVEAU: Cellule abonnement */}
                  <td className="px-4 lg:px-6 py-4">
                    {getSubscriptionBadge(seller)}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                    {formatDateTime(seller.createdAt).split(' à ')[0]}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                    <ActionButtons seller={seller} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSellers.length === 0 && (
            <div className="text-center py-12">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm || subscriptionFilter !== 'all'
                  ? 'Aucun revendeur trouvé avec ces critères'
                  : 'Aucun revendeur enregistré'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSellers;