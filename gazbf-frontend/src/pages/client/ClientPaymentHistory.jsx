import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertCircle,
  DollarSign,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { api } from '../../api/apiSwitch';

const ClientPaymentHistory = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [stats, setStats] = useState(null);
  const [currentAccess, setCurrentAccess] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '30days'
  });
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadData();
  }, [pagination.page, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPurchaseHistory(),
        loadStats(),
        loadCurrentAccess()
      ]);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des données'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPurchaseHistory = async () => {
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      const response = await api.access.getHistory(params);
      
      if (response?.success) {
        setPurchases(response.data.purchases || []);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
      throw error;
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.access.getStats();
      if (response?.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const loadCurrentAccess = async () => {
    try {
      const response = await api.access.checkStatus();
      if (response?.success) {
        setCurrentAccess(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement accès:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    setAlert({
      type: 'success',
      message: '✅ Données actualisées'
    });
    setTimeout(() => setAlert(null), 3000);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (hours) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}j ${remainingHours}h` : `${days}j`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'Complété'
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: Clock,
        label: 'En attente'
      },
      failed: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: XCircle,
        label: 'Échoué'
      },
      expired: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        icon: XCircle,
        label: 'Expiré'
      }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
        <span className="whitespace-nowrap">{badge.label}</span>
      </span>
    );
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      orange_money: { label: 'Orange Money', short: 'Orange', emoji: '🟠' },
      moov_money: { label: 'Moov Money', short: 'Moov', emoji: '🔵' },
      coris_money: { label: 'Coris Money', short: 'Coris', emoji: '🟢' },
      wave: { label: 'Wave', short: 'Wave', emoji: '💙' },
      cash: { label: 'Espèces', short: 'Cash', emoji: '💵' }
    };
    const m = methods[method] || { label: method, short: method, emoji: '💳' };
    return { full: `${m.emoji} ${m.label}`, short: `${m.emoji} ${m.short}` };
  };

  const isAccessActive = (purchase) => {
    return purchase.status === 'completed' && 
           purchase.isActive && 
           new Date() < new Date(purchase.expiryDate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="space-y-4 sm:space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              💳 Historique des Paiements
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Suivez vos achats d'accès 24h et vos statistiques
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm sm:text-base">Actualiser</span>
          </button>
        </div>

        {/* Alertes */}
        {alert && (
          <div className={`p-3 sm:p-4 rounded-lg border flex items-start sm:items-center gap-2 sm:gap-3 ${
            alert.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            {alert.type === 'success' ? (
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
            )}
            <p className={`flex-1 text-sm sm:text-base ${alert.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {alert.message}
            </p>
            <button
              onClick={() => setAlert(null)}
              className="text-gray-500 hover:text-gray-700 text-lg flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Statut d'accès actuel */}
        {currentAccess && (
          <div className={`rounded-xl p-4 sm:p-6 border-2 ${
            currentAccess.hasAccess && currentAccess.accessType === 'active'
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
              : currentAccess.accessType === 'free'
              ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
              : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
          }`}>
            <div className="flex items-start gap-3 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                currentAccess.hasAccess && currentAccess.accessType === 'active'
                  ? 'bg-green-100'
                  : currentAccess.accessType === 'free'
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
              }`}>
                {currentAccess.hasAccess && currentAccess.accessType === 'active' ? (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                ) : currentAccess.accessType === 'free' ? (
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                ) : (
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                  {currentAccess.accessType === 'active' && '✅ Accès Actif'}
                  {currentAccess.accessType === 'free' && '🎁 Accès Gratuit'}
                  {currentAccess.accessType === 'none' && '🔒 Aucun Accès'}
                  {currentAccess.accessType === 'expired' && '⏰ Accès Expiré'}
                </h3>
                <p className="text-sm sm:text-base text-gray-700 mb-3">{currentAccess.message}</p>
                
                {currentAccess.expiresAt && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">Expire le {formatDateShort(currentAccess.expiresAt)}</span>
                    </div>
                    {currentAccess.remainingTime && (
                      <div className="flex items-center gap-2 font-semibold text-green-600">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span>Reste {currentAccess.remainingTime}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            STATISTIQUES AVEC COULEURS DÉGRADÉES
            ========================================== */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total achats */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {stats.totalPurchases || 0}
                </p>
              </div>
              <p className="text-xs sm:text-sm text-blue-700 font-semibold">💳 Total achats</p>
            </div>

            {/* Total dépensé */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
                <p className="text-base sm:text-xl font-bold text-green-600 truncate">
                  {formatPrice(stats.totalSpent || 0).replace('FCFA', 'F')}
                </p>
              </div>
              <p className="text-xs sm:text-sm text-green-700 font-semibold">💰 Total dépensé</p>
            </div>

            {/* Ce mois-ci */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-300 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                  {stats.recentPurchases || 0}
                </p>
              </div>
              <p className="text-xs sm:text-sm text-purple-700 font-semibold">📈 Ce mois-ci</p>
            </div>

            {/* Dernier achat */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-300 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-orange-600 truncate">
                  {stats.lastPurchase 
                    ? new Date(stats.lastPurchase.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    : 'Aucun'
                  }
                </p>
              </div>
              <p className="text-xs sm:text-sm text-orange-700 font-semibold">🕒 Dernier achat</p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg border p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hidden sm:block" />
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">Complétés</option>
                <option value="pending">En attente</option>
                <option value="failed">Échoués</option>
                <option value="expired">Expirés</option>
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7days">7 derniers jours</option>
                <option value="30days">30 derniers jours</option>
                <option value="90days">90 derniers jours</option>
                <option value="all">Tout l'historique</option>
              </select>
            </div>

            <button className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 hover:bg-gray-50 rounded-lg transition">
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Exporter</span>
            </button>
          </div>
        </div>

        {/* Liste des achats */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {purchases.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Aucun achat
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Vous n'avez pas encore effectué d'achat d'accès 24h
              </p>
            </div>
          ) : (
            <>
              {/* Header du tableau - Desktop uniquement */}
              <div className="bg-gray-50 border-b px-4 sm:px-6 py-3 hidden lg:grid lg:grid-cols-6 gap-4 text-sm font-semibold text-gray-700">
                <div className="col-span-2">Date & Durée</div>
                <div>Montant</div>
                <div>Méthode</div>
                <div>Statut</div>
                <div className="text-right">Expiration</div>
              </div>

              {/* Lignes */}
              <div className="divide-y">
                {purchases.map((purchase) => {
                  const active = isAccessActive(purchase);
                  const paymentMethod = getPaymentMethodLabel(purchase.paymentMethod);
                  
                  return (
                    <div
                      key={purchase.id}
                      className={`px-4 sm:px-6 py-4 hover:bg-gray-50 transition ${
                        active ? 'bg-green-50' : ''
                      }`}
                    >
                      {/* Mobile & Tablet */}
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5 truncate">
                              {formatDateShort(purchase.purchaseDate)}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Durée: {formatDuration(purchase.durationHours)}
                            </p>
                          </div>
                          {getStatusBadge(purchase.status)}
                        </div>
                        
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-base sm:text-lg font-bold text-blue-600">
                            {formatPrice(purchase.amount)}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-600">
                            {paymentMethod.short}
                          </span>
                        </div>

                        {purchase.expiryDate && (
                          <div className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">Expire:</span> {formatDateShort(purchase.expiryDate)}
                          </div>
                        )}

                        {active && (
                          <div className="bg-green-100 border border-green-200 rounded-lg p-2 text-center">
                            <span className="text-xs sm:text-sm font-semibold text-green-800">
                              ✅ Accès actuellement actif
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Desktop */}
                      <div className="hidden lg:grid lg:grid-cols-6 gap-4 items-center">
                        <div className="col-span-2">
                          <p className="font-semibold text-gray-900 mb-0.5">
                            {formatDate(purchase.purchaseDate)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Durée: {formatDuration(purchase.durationHours)}
                          </p>
                          {active && (
                            <span className="inline-block mt-1 text-xs font-semibold text-green-600">
                              ✅ Actif
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-lg font-bold text-blue-600">
                            {formatPrice(purchase.amount)}
                          </span>
                        </div>

                        <div>
                          <span className="text-sm text-gray-700">
                            {paymentMethod.full}
                          </span>
                        </div>

                        <div>
                          {getStatusBadge(purchase.status)}
                        </div>

                        <div className="text-right">
                          {purchase.expiryDate ? (
                            <p className="text-sm text-gray-900 font-medium">
                              {formatDateShort(purchase.expiryDate)}
                            </p>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Page {pagination.page} sur {pagination.totalPages} ({pagination.total} achats)
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex-1 sm:flex-none px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Précédent
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="flex-1 sm:flex-none px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientPaymentHistory;