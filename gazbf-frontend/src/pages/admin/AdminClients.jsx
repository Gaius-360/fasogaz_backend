// ==========================================
// FICHIER: src/pages/admin/AdminClients.jsx
// Gestion des clients
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
  ArrowLeft
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import { formatPrice, formatDateTime } from '../../utils/helpers';

const AdminClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [searchTerm, statusFilter, clients]);

  const loadClients = async () => {
    try {
      const response = await api.admin.clients.getAll();
      if (response.success) {
        setClients(response.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des clients'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = [...clients];

    // Filtre de recherche
    if (searchTerm) {
      filtered = filtered.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
      );
    }

    // Filtre de statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => {
        if (statusFilter === 'active') return c.subscription?.isActive;
        if (statusFilter === 'expired') return !c.subscription?.isActive;
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
      const response = await api.admin.clients.block(client.id, reason);
      if (response.success) {
        setAlert({ type: 'success', message: 'Client bloqué' });
        loadClients();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors du blocage' });
    }
  };

  const handleUnblock = async (client) => {
    if (!window.confirm(`Débloquer ${client.firstName} ${client.lastName} ?`)) return;

    try {
      const response = await api.admin.clients.unblock(client.id);
      if (response.success) {
        setAlert({ type: 'success', message: 'Client débloqué' });
        loadClients();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors du déblocage' });
    }
  };

  const handleDelete = async (client) => {
    const confirmation = prompt(
      `⚠️ ATTENTION: Cette action est IRRÉVERSIBLE!\n\nPour supprimer ${client.firstName} ${client.lastName}, tapez: SUPPRIMER`
    );
    
    if (confirmation !== 'SUPPRIMER') return;

    try {
      const response = await api.admin.clients.delete(client.id);
      if (response.success) {
        setAlert({ type: 'success', message: 'Client supprimé' });
        loadClients();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors de la suppression' });
    }
  };

  const getSubscriptionBadge = (subscription) => {
    if (!subscription) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Jamais abonné</span>;
    }
    if (subscription.isActive) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Actif</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⚠ Expiré</span>;
  };

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
                <Users className="h-6 w-6 text-primary-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Gestion des Clients
                  </h1>
                  <p className="text-sm text-gray-500">
                    {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
                  </p>
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

        {/* Filtres */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filtre statut */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Abonnement actif</option>
                <option value="expired">Abonnement expiré</option>
                <option value="blocked">Bloqués</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des clients */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ville
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Abonnement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activité
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className={`hover:bg-gray-50 ${client.isBlocked ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {client.firstName} {client.lastName}
                        </div>
                        {client.isBlocked && (
                          <span className="text-xs text-red-600">🚫 Bloqué</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.city}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDateTime(client.createdAt).split(' à ')[0]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSubscriptionBadge(client.subscription)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-gray-900">
                          <ShoppingCart className="h-4 w-4" />
                          <span>{client.stats?.totalOrders || 0} commandes</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatPrice(client.stats?.totalSpent || 0)} dépensés
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/clients/${client.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir détails"
                        >
                          <Eye className="h-5 w-5" />
                        </button>

                        {!client.isBlocked ? (
                          <button
                            onClick={() => handleBlock(client)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Bloquer"
                          >
                            <Ban className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnblock(client)}
                            className="text-green-600 hover:text-green-900"
                            title="Débloquer"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(client)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
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
    </div>
  );
};

export default AdminClients;