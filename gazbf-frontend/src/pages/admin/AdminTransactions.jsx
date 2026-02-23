// ==========================================
// FICHIER: src/pages/admin/AdminTransactions.jsx
// VERSION RESPONSIVE - Support mobile, tablette, desktop
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle,
  Download,
  ArrowLeft,
  TrendingUp,
  Users,
  Store,
  ShoppingCart,
  X,
  Menu,
  ChevronDown
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { formatPrice, formatDateTime } from '../../utils/helpers';
import useAdmin from '../../hooks/useAdmin';

const AdminTransactions = () => {
  const navigate = useNavigate();
  
  const {
    loading,
    error,
    clearError,
    getAllTransactions,
    getTransactionStats,
    validateTransaction
  } = useAdmin();

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, statusFilter, typeFilter, transactions]);

  const loadData = async () => {
    try {
      const [transactionsRes, statsRes] = await Promise.all([
        getAllTransactions(),
        getTransactionStats('month')
      ]);

      if (transactionsRes?.success) {
        setTransactions(transactionsRes.data.transactions);
      }
      if (statsRes?.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Erreur lors du chargement'
      });
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.transactionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user?.phone?.includes(searchTerm) ||
        `${t.user?.firstName} ${t.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => {
        if (typeFilter === 'seller_subscription') {
          return ['seller_subscription', 'seller_subscription_renewal', 'seller_early_renewal'].includes(t.type);
        }
        return t.type === typeFilter;
      });
    }

    setFilteredTransactions(filtered);
  };

  const handleValidate = async (transaction) => {
    if (!window.confirm(`Valider cette transaction de ${formatPrice(transaction.amount)} ?`)) return;

    try {
      const response = await validateTransaction(transaction.id);
      if (response?.success) {
        setAlert({ type: 'success', message: 'Transaction validée' });
        setSelectedTransaction(null);
        loadData();
      }
    } catch (err) {
      setAlert({ 
        type: 'error', 
        message: err.message || 'Erreur lors de la validation' 
      });
    }
  };

  const handleExport = () => {
    const csvData = filteredTransactions.map(t => ({
      Date: formatDateTime(t.createdAt),
      Reference: t.transactionNumber,
      Utilisateur: t.user?.role === 'revendeur' 
        ? t.user?.businessName 
        : `${t.user?.firstName} ${t.user?.lastName}`,
      Telephone: t.user?.phone,
      Type: getTypeName(t.type),
      Montant: t.amount,
      Statut: t.status === 'completed' ? 'Complété' : t.status === 'pending' ? 'En attente' : 'Annulé'
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getTypeName = (type) => {
    const types = {
      'seller_subscription': 'Abonnement Revendeur',
      'seller_subscription_renewal': 'Renouvellement',
      'seller_early_renewal': 'Renouvellement Anticipé',
      'client_access': 'Accès 24h',
      'order_payment': 'Commande'
    };
    return types[type] || type;
  };

  const getTypeIcon = (type) => {
    if (['seller_subscription', 'seller_subscription_renewal', 'seller_early_renewal'].includes(type)) {
      return <Store className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />;
    }
    if (type === 'client_access') {
      return <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />;
    }
    if (type === 'order_payment') {
      return <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
    }
    return <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />;
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { text: '✓ Complété', className: 'bg-green-100 text-green-800' },
      pending: { text: '⏳ En attente', className: 'bg-yellow-100 text-yellow-800' },
      failed: { text: '❌ Échoué', className: 'bg-red-100 text-red-800' }
    };
    
    const badge = badges[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  if (loading && !transactions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Header - Responsive */}
      <header className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* Left side */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                    Transactions
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                    {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Desktop only */}
            <Button 
              variant="outline" 
              onClick={handleExport}
              className="hidden md:flex"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden p-2"
            >
              {showFilters ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        
        {/* Alertes */}
        {(alert || error) && (
          <Alert
            type={alert?.type || 'error'}
            message={alert?.message || error}
            onClose={() => {
              setAlert(null);
              clearError();
            }}
            className="mb-4 sm:mb-6"
          />
        )}

        {/* Statistiques - Responsive Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-6">
            {/* Total ce mois */}
            <div className="bg-white rounded-lg border p-3 sm:p-6">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span className="text-xs sm:text-sm text-gray-600">Total</span>
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <p className="text-lg sm:text-3xl font-bold text-gray-900 truncate">
                {formatPrice(stats.overview.total)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
                {stats.overview.count} transactions
              </p>
            </div>

            {/* Abonnements */}
            <div className="bg-white rounded-lg border p-3 sm:p-6">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span className="text-xs sm:text-sm text-gray-600">Abonnements</span>
                <Store className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <p className="text-lg sm:text-3xl font-bold text-gray-900 truncate">
                {formatPrice(stats.byType.sellerSubscriptions.total)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
                {stats.byType.sellerSubscriptions.count} revendeurs
              </p>
            </div>

            {/* Accès 24h */}
            <div className="bg-white rounded-lg border p-3 sm:p-6">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span className="text-xs sm:text-sm text-gray-600">Accès 24h</span>
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <p className="text-lg sm:text-3xl font-bold text-gray-900 truncate">
                {formatPrice(stats.byType.clientAccess.total)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
                {stats.byType.clientAccess.count} clients
              </p>
            </div>

            {/* Commandes */}
            <div className="bg-white rounded-lg border p-3 sm:p-6">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span className="text-xs sm:text-sm text-gray-600">Commandes</span>
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <p className="text-lg sm:text-3xl font-bold text-gray-900 truncate">
                {formatPrice(stats.byType.orderPayments.total)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
                {stats.byType.orderPayments.count} paiements
              </p>
            </div>
          </div>
        )}

        {/* Filtres - Responsive */}
        <div className={`bg-white rounded-lg border mb-4 sm:mb-6 overflow-hidden transition-all ${
          showFilters ? 'block' : 'hidden md:block'
        }`}>
          <div className="p-3 sm:p-4">
            <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-4">
              
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Filtre statut */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="completed">Complétées</option>
                  <option value="pending">En attente</option>
                  <option value="failed">Échouées</option>
                </select>
              </div>

              {/* Filtre type */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Tous les types</option>
                <option value="seller_subscription">Abonnements</option>
                <option value="client_access">Accès 24h</option>
                {/* <option value="order_payment">Commandes</option> */}
              </select>
            </div>

            {/* Mobile export button */}
            <Button 
              variant="outline" 
              onClick={handleExport}
              className="w-full mt-3 md:hidden text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>
        </div>

        {/* Liste des transactions - Desktop (Table) */}
        <div className="hidden md:block bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {transaction.transactionNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {transaction.user?.role === 'revendeur' 
                            ? transaction.user?.businessName 
                            : `${transaction.user?.firstName} ${transaction.user?.lastName}`
                          }
                        </div>
                        <div className="text-gray-500">{transaction.user?.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span className="text-sm text-gray-900">
                          {getTypeName(transaction.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPrice(transaction.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {transaction.status === 'pending' && (
                        <button
                          onClick={() => handleValidate(transaction)}
                          className="text-green-600 hover:text-green-900"
                          title="Valider"
                          disabled={loading}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune transaction trouvée</p>
              </div>
            )}
          </div>
        </div>

        {/* Liste des transactions - Mobile (Cards) */}
        <div className="md:hidden space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-lg border p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune transaction trouvée</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="bg-white rounded-lg border p-4 shadow-sm"
                onClick={() => setSelectedTransaction(transaction)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(transaction.type)}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {getTypeName(transaction.type)}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(transaction.status)}
                </div>

                {/* User info */}
                <div className="mb-3 pb-3 border-b">
                  <div className="text-sm font-medium text-gray-900">
                    {transaction.user?.role === 'revendeur' 
                      ? transaction.user?.businessName 
                      : `${transaction.user?.firstName} ${transaction.user?.lastName}`
                    }
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {transaction.user?.phone}
                  </div>
                </div>

                {/* Amount and action */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Montant</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(transaction.amount)}
                    </div>
                  </div>
                  
                  {transaction.status === 'pending' && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleValidate(transaction);
                      }}
                      className="px-3 py-1.5 text-sm"
                      disabled={loading}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Valider
                    </Button>
                  )}
                </div>

                {/* Reference */}
                <div className="mt-2 pt-2 border-t">
                  <div className="text-xs text-gray-500">
                    Réf: <span className="font-mono">{transaction.transactionNumber}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Transaction detail modal - Mobile */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden flex items-end">
            <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Détails</h3>
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* All transaction details here */}
                <div>
                  <div className="text-sm text-gray-500 mb-1">Type</div>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(selectedTransaction.type)}
                    <span className="font-medium">{getTypeName(selectedTransaction.type)}</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Statut</div>
                  {getStatusBadge(selectedTransaction.status)}
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Montant</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPrice(selectedTransaction.amount)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Utilisateur</div>
                  <div className="font-medium">
                    {selectedTransaction.user?.role === 'revendeur' 
                      ? selectedTransaction.user?.businessName 
                      : `${selectedTransaction.user?.firstName} ${selectedTransaction.user?.lastName}`
                    }
                  </div>
                  <div className="text-sm text-gray-600">{selectedTransaction.user?.phone}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Référence</div>
                  <div className="font-mono text-sm">{selectedTransaction.transactionNumber}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Date</div>
                  <div className="text-sm">{formatDateTime(selectedTransaction.createdAt)}</div>
                </div>

                {selectedTransaction.status === 'pending' && (
                  <Button
                    onClick={() => handleValidate(selectedTransaction)}
                    className="w-full"
                    disabled={loading}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Valider la transaction
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTransactions;