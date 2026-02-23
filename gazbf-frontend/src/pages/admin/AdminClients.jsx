// ==========================================
// FICHIER: src/pages/admin/AdminClients.jsx
// VERSION RESPONSIVE
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  ShoppingCart,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { formatPrice, formatDateTime } from '../../utils/helpers';
import useAdmin from '../../hooks/useAdmin';

const AdminClients = () => {
  const navigate = useNavigate();

  const {
    loading,
    error,
    clearError,
    getAllClients,
    blockClient,
    unblockClient,
    deleteClient
  } = useAdmin();

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [alert, setAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { loadClients(); }, []);
  useEffect(() => { filterClients(); }, [searchTerm, statusFilter, clients]);

  const loadClients = async () => {
    try {
      const response = await getAllClients();
      if (response?.success) setClients(response.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Erreur lors du chargement des clients' });
    }
  };

  const filterClients = () => {
    let filtered = [...clients];
    if (searchTerm) {
      filtered = filtered.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => {
        if (statusFilter === 'active') {
          // ✅ FIX: utiliser hasActiveAccess + accessExpiryDate
          return c.hasActiveAccess && c.accessExpiryDate && new Date(c.accessExpiryDate) > new Date();
        }
        if (statusFilter === 'expired') {
          // A déjà acheté mais expiré, OU jamais acheté
          const hasExpired = c.accessExpiryDate && new Date(c.accessExpiryDate) <= new Date();
          const neverBought = !c.accessExpiryDate && (c.totalAccessPurchases || 0) === 0;
          return hasExpired && !neverBought;
        }
        if (statusFilter === 'never') {
          return !c.accessExpiryDate && (c.totalAccessPurchases || 0) === 0;
        }
        if (statusFilter === 'blocked') return c.isBlocked;
        return true;
      });
    }
    setFilteredClients(filtered);
  };

  const handleBlock = async (client) => {
    if (!window.confirm(`Bloquer ${client.firstName} ${client.lastName} ?`)) return;
    const reason = prompt('Raison du blocage :');
    if (!reason) return;
    try {
      const response = await blockClient(client.id, reason);
      if (response?.success) { setAlert({ type: 'success', message: 'Client bloqué' }); loadClients(); }
    } catch (err) { setAlert({ type: 'error', message: err.message || 'Erreur lors du blocage' }); }
  };

  const handleUnblock = async (client) => {
    if (!window.confirm(`Débloquer ${client.firstName} ${client.lastName} ?`)) return;
    try {
      const response = await unblockClient(client.id);
      if (response?.success) { setAlert({ type: 'success', message: 'Client débloqué' }); loadClients(); }
    } catch (err) { setAlert({ type: 'error', message: err.message || 'Erreur lors du déblocage' }); }
  };

  const handleDelete = async (client) => {
    const confirmation = prompt(
      `⚠️ ATTENTION: Cette action est IRRÉVERSIBLE!\n\nPour supprimer ${client.firstName} ${client.lastName}, tapez: SUPPRIMER`
    );
    if (confirmation !== 'SUPPRIMER') return;
    try {
      const response = await deleteClient(client.id);
      if (response?.success) { setAlert({ type: 'success', message: 'Client supprimé' }); loadClients(); }
    } catch (err) { setAlert({ type: 'error', message: err.message || 'Erreur lors de la suppression' }); }
  };

  /**
   * ✅ FIX: Badge basé sur hasActiveAccess + accessExpiryDate (champs User directs)
   * au lieu de client.subscription qui n'existe pas dans ce modèle
   */
  const getAccessBadge = (client) => {
    const now = new Date();
    const expiry = client.accessExpiryDate ? new Date(client.accessExpiryDate) : null;
    const isActive = client.hasActiveAccess && expiry && expiry > now;
    const hasEverBought = (client.totalAccessPurchases || 0) > 0 || expiry !== null;

    if (isActive) {
      return (
        <div>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 block">
            ✓ Accès actif
          </span>
          <span className="text-xs text-gray-400 mt-0.5 block">
            Expire {expiry.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      );
    }

    if (hasEverBought) {
      return (
        <div>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 block">
            ⚠ Expiré
          </span>
          {expiry && (
            <span className="text-xs text-gray-400 mt-0.5 block">
              {expiry.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Jamais acheté
      </span>
    );
  };

  // ── Action buttons réutilisables ──
  const ActionButtons = ({ client }) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate(`/admin/clients/${client.id}`)}
        className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
        title="Voir détails"
      >
        <Eye className="h-5 w-5" />
      </button>
      {!client.isBlocked ? (
        <button
          onClick={() => handleBlock(client)}
          className="p-1.5 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors"
          title="Bloquer"
          disabled={loading}
        >
          <Ban className="h-5 w-5" />
        </button>
      ) : (
        <button
          onClick={() => handleUnblock(client)}
          className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
          title="Débloquer"
          disabled={loading}
        >
          <CheckCircle className="h-5 w-5" />
        </button>
      )}
      <button
        onClick={() => handleDelete(client)}
        className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
        title="Supprimer"
        disabled={loading}
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );

  if (loading && !clients.length) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Gestion des Clients</h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
            </p>
          </div>
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

      {/* ── Filtres ── */}
      <div className="bg-white rounded-lg border p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nom ou téléphone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* ✅ FIX: Filtre statut mis à jour pour correspondre aux nouveaux critères */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Accès actif</option>
              <option value="expired">Accès expiré</option>
              <option value="never">Jamais acheté</option>
              <option value="blocked">Bloqués</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Version MOBILE (< md) ── */}
      <div className="md:hidden space-y-3">
        {filteredClients.length > 0 ? filteredClients.map((client) => (
          <div
            key={client.id}
            className={`bg-white rounded-lg border p-4 ${client.isBlocked ? 'border-red-300 bg-red-50' : ''}`}
          >
            {/* Ligne 1 : nom + actions */}
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900">{client.firstName} {client.lastName}</span>
                  {client.isBlocked && <span className="text-xs text-red-600">🚫 Bloqué</span>}
                </div>
                <span className="text-xs text-gray-500">{client.phone}</span>
              </div>
              <ActionButtons client={client} />
            </div>

            {/* Ligne 2 : détails */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-600">
              <span>📍 {client.city || 'N/A'}</span>
              <span>📅 {formatDateTime(client.createdAt).split(' à ')[0]}</span>
            </div>

            {/* Ligne 3 : accès + activité */}
            <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100">
              {getAccessBadge(client)}
              <div className="text-right">
                <div className="flex items-center gap-1 text-gray-900 text-sm">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>{client.stats?.totalOrders || 0} commandes</span>
                </div>
                <div className="text-xs text-gray-500">{formatPrice(client.stats?.totalSpent || 0)} dépensés</div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun client trouvé</p>
          </div>
        )}
      </div>

      {/* ── Version DESKTOP (≥ md) ── */}
      <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Ville</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">Inscription</th>
                {/* ✅ FIX: Colonne renommée "Accès 24h" */}
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accès 24h</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Activité</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className={`hover:bg-gray-50 transition-colors ${client.isBlocked ? 'bg-red-50' : ''}`}>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{client.firstName} {client.lastName}</div>
                    {client.isBlocked && <span className="text-xs text-red-600">🚫 Bloqué</span>}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.phone}</td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">{client.city || 'N/A'}</td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                    {formatDateTime(client.createdAt).split(' à ')[0]}
                  </td>
                  {/* ✅ FIX: Utilise getAccessBadge au lieu de getSubscriptionBadge */}
                  <td className="px-4 lg:px-6 py-4">
                    {getAccessBadge(client)}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-gray-900">
                      <ShoppingCart className="h-4 w-4" />
                      <span>{client.stats?.totalOrders || 0} commandes</span>
                    </div>
                    <div className="text-xs text-gray-500">{formatPrice(client.stats?.totalSpent || 0)} dépensés</div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                    <ActionButtons client={client} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun client trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminClients;