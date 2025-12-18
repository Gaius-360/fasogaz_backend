// ==========================================
// FICHIER: src/pages/admin/AdminTransactions.jsx
// Gestion des transactions
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Download,
  ArrowLeft,
  TrendingUp
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import { formatPrice, formatDateTime } from '../../utils/helpers';

const AdminTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, statusFilter, typeFilter, transactions]);

  const loadData = async () => {
    try {
      const [transactionsRes, statsRes] = await Promise.all([
        api.admin.transactions.getAll(),
        api.admin.transactions.getStats('month')
      ]);

      if (transactionsRes.success) {
        setTransactions(transactionsRes.data);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
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

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Recherche
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.user?.phone?.includes(searchTerm) ||
        `${t.user?.firstName} ${t.user?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Filtre type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => {
        if (typeFilter === 'client') return t.user?.role === 'client';
        if (typeFilter === 'seller') return t.user?.role === 'revendeur';
        return true;
      });
    }

    setFilteredTransactions(filtered);
  };

  const handleValidate = async (transaction) => {
    if (!window.confirm(`Valider cette transaction de ${formatPrice(transaction.amount)} ?`)) return;

    try {
      const response = await api.admin.transactions.validate(transaction.id);
      if (response.success) {
        setAlert({ type: 'success', message: 'Transaction validée' });
        loadData();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors de la validation' });
    }
  };

  const handleExport = () => {
    // Préparer les données CSV
    const csvData = filteredTransactions.map(t => ({
      Date: formatDateTime(t.createdAt),
      Reference: t.transactionRef,
      Client: `${t.user?.firstName} ${t.user?.lastName}`,
      Telephone: t.user?.phone,
      Type: t.user?.role === 'client' ? 'Client' : 'Revendeur',
      Plan: t.plan?.name,
      Montant: t.amount,
      Statut: t.status === 'completed' ? 'Complété' : 'En attente'
    }));

    // Créer le CSV
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    // Télécharger
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Complété</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⏳ En attente</span>;
  };

  const getTypeBadge = (role) => {
    if (role === 'client') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Client</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Revendeur</span>;
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
                <CreditCard className="h-6 w-6 text-primary-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Transactions
                  </h1>
                  <p className="text-sm text-gray-500">
                    {filteredTransactions.length} transaction{filteredTransactions.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
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

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total ce mois</span>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(stats.total)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.count} transactions
              </p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Clients</span>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold">C</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(stats.clients.total)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.clients.count} transactions
              </p>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Revendeurs</span>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-bold">R</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(stats.sellers.total)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.sellers.count} transactions
              </p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
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
                <option value="completed">Complétées</option>
                <option value="pending">En attente</option>
              </select>
            </div>

            {/* Filtre type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous les types</option>
              <option value="client">Clients</option>
              <option value="seller">Revendeurs</option>
            </select>
          </div>
        </div>

        {/* Liste des transactions */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client/Revendeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
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
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {transaction.transactionRef}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {transaction.user?.firstName} {transaction.user?.lastName}
                        </div>
                        <div className="text-gray-500">{transaction.user?.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(transaction.user?.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.plan?.name}
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
      </div>
    </div>
  );
};

export default AdminTransactions;