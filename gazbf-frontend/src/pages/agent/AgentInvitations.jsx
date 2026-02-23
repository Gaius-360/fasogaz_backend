// ==========================================
// FICHIER: src/pages/agent/AgentInvitations.jsx
// Historique détaillé des invitations d'un agent
// ✅ RESPONSIVE: Optimisé pour mobile, tablette et desktop
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  Link2,
  Copy,
  Check,
  Eye,
  Calendar,
  Clock,
  User,
  Phone,
  Store,
  Filter,
  Search,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import { formatDate } from '../../utils/helpers';

const AgentInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Filtres
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateRange: 'all'
  });

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  // Modal détails
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================
  useEffect(() => {
    loadInvitations();
  }, [filters.status, pagination.currentPage]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: pagination.currentPage,
        limit: 20
      };
      
      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      const response = await api.invitations.getMyInvitations(params);
      
      if (response.success) {
        let invList = response.data.invitations;
        
        // Filtrer par recherche locale
        if (filters.search) {
          const search = filters.search.toLowerCase();
          invList = invList.filter(inv =>
            inv.token?.toLowerCase().includes(search) ||
            inv.seller?.businessName?.toLowerCase().includes(search) ||
            inv.seller?.phone?.includes(search)
          );
        }

        // Filtrer par date
        if (filters.dateRange !== 'all') {
          const now = new Date();
          invList = invList.filter(inv => {
            const invDate = new Date(inv.createdAt);
            const diffDays = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));
            
            if (filters.dateRange === '7days') return diffDays <= 7;
            if (filters.dateRange === '30days') return diffDays <= 30;
            if (filters.dateRange === '90days') return diffDays <= 90;
            return true;
          });
        }
        
        setInvitations(invList);
        setStats(response.data.stats);
        
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement invitations:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors du chargement des invitations'
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
      
      setAlert({
        type: 'success',
        message: 'Lien copié dans le presse-papier'
      });
      
      setTimeout(() => setCopiedId(null), 3000);
    } catch (error) {
      console.error('❌ Erreur copie:', error);
      setAlert({
        type: 'error',
        message: 'Impossible de copier le lien'
      });
    }
  };

  // ==========================================
  // VOIR DÉTAILS INVITATION
  // ==========================================
  const handleViewDetails = (invitation) => {
    setSelectedInvitation(invitation);
    setShowDetailModal(true);
  };

  // ==========================================
  // EXPORTER EN CSV
  // ==========================================
  const handleExportCSV = () => {
    const headers = ['Date création', 'Statut', 'Expiration', 'Utilisé par', 'Téléphone', 'Date utilisation'];
    
    const rows = invitations.map(inv => [
      formatDate(inv.createdAt),
      inv.status === 'used' ? 'Utilisé' : 
      inv.status === 'active' ? 'Actif' :
      inv.status === 'expired' ? 'Expiré' : 'Révoqué',
      formatDate(inv.expiresAt),
      inv.seller?.businessName || '-',
      inv.seller?.phone || '-',
      inv.usedAt ? formatDate(inv.usedAt) : '-'
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `invitations_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    setAlert({
      type: 'success',
      message: 'Export CSV réussi'
    });
  };

  // ==========================================
  // CALCUL TAUX DE CONVERSION
  // ==========================================
  const conversionRate = stats?.total > 0
    ? Math.round((stats.used / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* En-tête - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mes invitations</h1>
          <p className="text-sm sm:text-base text-gray-600">Historique complet de vos liens d'invitation</p>
        </div>
        <Button
          variant="outline"
          icon={Download}
          onClick={handleExportCSV}
          disabled={invitations.length === 0}
          className="w-full sm:w-auto"
        >
          Exporter CSV
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Statistiques - Responsive Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm font-medium text-blue-700">Total</p>
              <Link2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-blue-900">{stats.total}</p>
            <p className="text-xs text-blue-600 mt-1">Liens</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 sm:p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm font-medium text-green-700">Utilisées</p>
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-900">{stats.used}</p>
            <p className="text-xs text-green-600 mt-1">{conversionRate}%</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-3 sm:p-4 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm font-medium text-yellow-700">Actives</p>
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-yellow-900">{stats.active}</p>
            <p className="text-xs text-yellow-600 mt-1">En attente</p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm font-medium text-gray-700">Expirées</p>
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.expired}</p>
            <p className="text-xs text-gray-600 mt-1">Non utilisées</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 sm:p-4 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm font-medium text-red-700">Révoquées</p>
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-red-900">{stats.revoked || 0}</p>
            <p className="text-xs text-red-600 mt-1">Annulées</p>
          </div>
        </div>
      )}

      {/* Performance visuelle */}
      {stats && stats.total > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Performance</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm text-gray-600">Utilisées</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {stats.used} ({conversionRate}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${conversionRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm text-gray-600">Actives</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {stats.active} ({Math.round((stats.active / stats.total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.active / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm text-gray-600">Expirées</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  {stats.expired} ({Math.round((stats.expired / stats.total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-600 h-2 rounded-full transition-all"
                  style={{ width: `${(stats.expired / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres - Responsive */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Recherche */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            />
          </div>

          {/* Statut */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="used">Utilisées</option>
            <option value="expired">Expirées</option>
            <option value="revoked">Révoquées</option>
          </select>

          {/* Période */}
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
          >
            <option value="all">Toutes périodes</option>
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
            <option value="90days">90 derniers jours</option>
          </select>
        </div>
      </div>

      {/* Liste des invitations */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Aucune invitation trouvée</p>
            <p className="text-xs sm:text-sm text-gray-500">
              {filters.search || filters.status !== 'all' || filters.dateRange !== 'all'
                ? 'Essayez de modifier les filtres'
                : 'Commencez par générer un lien d\'invitation'}
            </p>
          </div>
        ) : (
          <>
            {/* Version Desktop - Hidden on mobile */}
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
                      Date utilisation
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
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(inv.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          inv.status === 'used'
                            ? 'bg-green-100 text-green-800'
                            : inv.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : inv.status === 'expired'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {inv.status === 'used' ? 'Utilisé' :
                           inv.status === 'active' ? 'Actif' :
                           inv.status === 'expired' ? 'Expiré' : 'Révoqué'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(inv.expiresAt)}
                      </td>
                      <td className="px-6 py-4">
                        {inv.seller ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-gray-400" />
                              <p className="font-medium text-gray-900">
                                {inv.seller.businessName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-500">{inv.seller.phone}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {inv.usedAt ? formatDate(inv.usedAt) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {inv.status === 'active' && (
                            <button
                              onClick={() => handleCopyLink(inv.token)}
                              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Copier le lien"
                            >
                              {copiedId === inv.token ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  <span>Copié</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  <span>Copier</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleViewDetails(inv)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Version Mobile/Tablet - Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {invitations.map((inv) => (
                <div key={inv.id} className="p-4 space-y-3">
                  {/* En-tête */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        inv.status === 'used'
                          ? 'bg-green-100 text-green-800'
                          : inv.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : inv.status === 'expired'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {inv.status === 'used' ? 'Utilisé' :
                         inv.status === 'active' ? 'Actif' :
                         inv.status === 'expired' ? 'Expiré' : 'Révoqué'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Créé le {formatDate(inv.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewDetails(inv)}
                      className="p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Infos */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 truncate">
                        Expire: {formatDate(inv.expiresAt)}
                      </span>
                    </div>

                    {inv.seller && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Store className="h-4 w-4 text-gray-600 flex-shrink-0" />
                          <p className="font-medium text-gray-900 truncate">
                            {inv.seller.businessName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <p className="text-sm text-gray-600">{inv.seller.phone}</p>
                        </div>
                        {inv.usedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Utilisé le {formatDate(inv.usedAt)}
                          </p>
                        )}
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
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-gray-600">
                  Page {pagination.currentPage} sur {pagination.totalPages}
                </p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                    className="flex-1 sm:flex-initial"
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                    className="flex-1 sm:flex-initial"
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal détails - Responsive */}
      {showDetailModal && selectedInvitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Détails de l'invitation
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Statut */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <p className="text-sm text-gray-600 mb-2">Statut</p>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  selectedInvitation.status === 'used'
                    ? 'bg-green-100 text-green-800'
                    : selectedInvitation.status === 'active'
                    ? 'bg-blue-100 text-blue-800'
                    : selectedInvitation.status === 'expired'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedInvitation.status === 'used' ? 'Utilisé' :
                   selectedInvitation.status === 'active' ? 'Actif' :
                   selectedInvitation.status === 'expired' ? 'Expiré' : 'Révoqué'}
                </span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date de création</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">
                    {formatDate(selectedInvitation.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date d'expiration</p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">
                    {formatDate(selectedInvitation.expiresAt)}
                  </p>
                </div>
              </div>

              {/* Revendeur */}
              {selectedInvitation.seller ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <p className="text-sm font-medium text-green-900 mb-3">
                    ✅ Utilisé par un revendeur
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-green-700 flex-shrink-0" />
                      <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                        {selectedInvitation.seller.businessName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-700 flex-shrink-0" />
                      <p className="text-sm text-gray-700">
                        {selectedInvitation.seller.phone}
                      </p>
                    </div>
                    {selectedInvitation.usedAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-700 flex-shrink-0" />
                        <p className="text-sm text-gray-700">
                          Le {formatDate(selectedInvitation.usedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">
                    Pas encore utilisé
                  </p>
                </div>
              )}

              {/* Notes */}
              {selectedInvitation.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Notes</p>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                    {selectedInvitation.notes}
                  </p>
                </div>
              )}

              {/* Lien (si actif) */}
              {selectedInvitation.status === 'active' && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Lien d'invitation</p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/register-revendeur?token=${selectedInvitation.token}`}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs sm:text-sm"
                    />
                    <button
                      onClick={() => handleCopyLink(selectedInvitation.token)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-shrink-0"
                    >
                      {copiedId === selectedInvitation.token ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowDetailModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentInvitations;