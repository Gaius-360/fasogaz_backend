// ==========================================
// FICHIER: src/pages/admin/AdminSellers.jsx
// Gestion des revendeurs
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  Eye,
  ArrowLeft
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import { formatDateTime } from '../../utils/helpers';

const AdminSellers = () => {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadSellers();
  }, []);

  useEffect(() => {
    filterSellers();
  }, [searchTerm, statusFilter, sellers]);

  const loadSellers = async () => {
    try {
      const response = await api.admin.sellers.getAll();
      if (response.success) {
        setSellers(response.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des revendeurs'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSellers = () => {
    let filtered = [...sellers];

    // Filtre de recherche
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.includes(searchTerm) ||
        s.quarter?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre de statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => {
        if (statusFilter === 'approved') return s.validationStatus === 'approved';
        if (statusFilter === 'pending') return s.validationStatus === 'pending';
        if (statusFilter === 'suspended') return s.validationStatus === 'suspended';
        return true;
      });
    }

    setFilteredSellers(filtered);
  };

  const handleSuspend = async (seller) => {
    if (!window.confirm(`Suspendre ${seller.businessName} ?`)) return;

    const reason = prompt('Raison de la suspension :');
    if (!reason) return;

    try {
      const response = await api.admin.sellers.suspend(seller.id, reason, 'indefinite');
      if (response.success) {
        setAlert({ type: 'success', message: 'Revendeur suspendu' });
        loadSellers();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors de la suspension' });
    }
  };

  const handleReactivate = async (seller) => {
    if (!window.confirm(`Réactiver ${seller.businessName} ?`)) return;

    try {
      const response = await api.admin.sellers.reactivate(seller.id);
      if (response.success) {
        setAlert({ type: 'success', message: 'Revendeur réactivé' });
        loadSellers();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors de la réactivation' });
    }
  };

  const handleDelete = async (seller) => {
    const confirmation = prompt(
      `⚠️ ATTENTION: Cette action est IRRÉVERSIBLE!\n\nPour supprimer ${seller.businessName}, tapez: SUPPRIMER`
    );
    
    if (confirmation !== 'SUPPRIMER') return;

    try {
      const response = await api.admin.sellers.delete(seller.id);
      if (response.success) {
        setAlert({ type: 'success', message: 'Revendeur supprimé' });
        loadSellers();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors de la suppression' });
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      approved: { label: 'Validé', color: 'bg-green-100 text-green-800' },
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      suspended: { label: 'Suspendu', color: 'bg-red-100 text-red-800' },
      rejected: { label: 'Rejeté', color: 'bg-gray-100 text-gray-800' }
    };
    const badge = config[status] || config.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
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
                <Store className="h-6 w-6 text-primary-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Gestion des Revendeurs
                  </h1>
                  <p className="text-sm text-gray-500">
                    {filteredSellers.length} revendeur{filteredSellers.length > 1 ? 's' : ''}
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
                placeholder="Rechercher par nom, téléphone, quartier..."
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
                <option value="approved">Validés</option>
                <option value="pending">En attente</option>
                <option value="suspended">Suspendus</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des revendeurs */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revendeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {seller.businessName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {seller.firstName} {seller.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{seller.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{seller.quarter}</div>
                      <div className="text-sm text-gray-500">{seller.city}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDateTime(seller.createdAt).split(' à ')[0]}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(seller.validationStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/sellers/${seller.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir détails"
                        >
                          <Eye className="h-5 w-5" />
                        </button>

                        {seller.validationStatus === 'approved' && (
                          <button
                            onClick={() => handleSuspend(seller)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Suspendre"
                          >
                            <Ban className="h-5 w-5" />
                          </button>
                        )}

                        {seller.validationStatus === 'suspended' && (
                          <button
                            onClick={() => handleReactivate(seller)}
                            className="text-green-600 hover:text-green-900"
                            title="Réactiver"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(seller)}
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

            {filteredSellers.length === 0 && (
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun revendeur trouvé</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSellers;