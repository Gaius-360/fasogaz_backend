// ==========================================
// FICHIER: src/pages/admin/AdminDashboard.jsx
// Tableau de bord administrateur principal
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  LogOut,
  BarChart3
} from 'lucide-react';
import Button from '../../components/common/Button';
import StatCard from '../../components/seller/StatCard';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import { formatPrice } from '../../utils/helpers';
import {
  RevenueChart,
  OrdersBarChart,
  RevenuePieChart,
  UserGrowthChart,
  QuickStats,
  TopSellersTable
} from '../../components/admin/AdminCharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [showCharts, setShowCharts] = useState(true);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    // Vérifier si l'admin est connecté
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    loadDashboardStats();
    loadChartsData();
  }, [navigate]);

  const loadDashboardStats = async () => {
    try {
      const response = await api.adminStats.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des statistiques'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChartsData = async () => {
    try {
      const response = await api.adminStats.getRevenueChart('30days');
      if (response.success) {
        setRevenueData(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement graphiques:', error);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/admin/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Administration GAZBF
                </h1>
                <p className="text-sm text-gray-500">Tableau de bord</p>
              </div>
            </div>

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
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

        {/* Alertes Critiques */}
        {stats.alerts.critical.length > 0 && (
          <div className="mb-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">
                    Alertes critiques
                  </h3>
                  <ul className="space-y-1">
                    {stats.alerts.critical.map(alert => (
                      <li key={alert.id} className="text-sm text-red-700">
                        • {alert.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Utilisateurs Total"
            value={stats.users.total.toLocaleString()}
            icon={Users}
            trend="up"
            trendValue={`+${stats.users.growth}%`}
            color="primary"
          />

          <StatCard
            title="Revenus du Mois"
            value={formatPrice(stats.revenue.thisMonth)}
            icon={DollarSign}
            trend="up"
            trendValue={`+${stats.revenue.growth}%`}
            color="green"
          />

          <StatCard
            title="Commandes Aujourd'hui"
            value={stats.orders.today.toString()}
            icon={ShoppingCart}
            color="blue"
          />

          <StatCard
            title="Taux de Succès"
            value={`${stats.orders.successRate}%`}
            icon={CheckCircle}
            color="purple"
          />
        </div>

        {/* Stats Détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Utilisateurs */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Utilisateurs
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Clients</span>
                <span className="font-semibold text-gray-900">
                  {stats.users.clients.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Revendeurs</span>
                <span className="font-semibold text-gray-900">
                  {stats.users.sellers}
                </span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-gray-600">Nouveaux ce mois</span>
                <span className="font-semibold text-green-600">
                  +{stats.users.newThisMonth}
                </span>
              </div>
            </div>
          </div>

          {/* Abonnements */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Abonnements Actifs
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Clients</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {stats.subscriptions.activeClients}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({stats.subscriptions.clientRate}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Revendeurs</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {stats.subscriptions.activeSellers}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({stats.subscriptions.sellerRate}%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-gray-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Expirent bientôt
                </span>
                <span className="font-semibold text-yellow-600">
                  {stats.subscriptions.expiringIn3Days}
                </span>
              </div>
            </div>
          </div>

          {/* Revenus */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revenus par Source
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Clients</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {formatPrice(stats.revenue.bySource.clients)}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    (32%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Revendeurs</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {formatPrice(stats.revenue.bySource.sellers)}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">
                    (68%)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-gray-600">Aujourd'hui</span>
                <span className="font-semibold text-green-600">
                  {formatPrice(stats.revenue.today)}
                </span>
              </div>
            </div>
          </div>

          {/* Validation */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Validation Revendeurs
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">En attente</span>
                <span className="font-semibold text-yellow-600">
                  {stats.validation.pending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Validés</span>
                <span className="font-semibold text-green-600">
                  {stats.validation.validated}
                </span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-gray-600">Taux de validation</span>
                <span className="font-semibold text-gray-900">
                  {stats.validation.validationRate}%
                </span>
              </div>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/admin/sellers/pending')}
              >
                Voir les demandes
              </Button>
            </div>
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Actions Rapides
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCharts(!showCharts)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {showCharts ? 'Masquer' : 'Afficher'} les graphiques
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/sellers/pending')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Valider revendeurs ({stats.validation.pending})
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/transactions')}
            >
              Voir les transactions
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/admin/wallet')}
            >
              Gérer le portefeuille
            </Button>
          </div>
        </div>

        {/* Graphiques */}
        {showCharts && (
          <>
            {/* Quick Stats */}
            <QuickStats
              stats={{
                newClients: stats.users.newThisMonth,
                newSellers: 12,
                orders: stats.orders.today,
                revenue: stats.revenue.today
              }}
            />

            {/* Graphiques principaux */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <RevenueChart data={revenueData} />
              <RevenuePieChart data={stats.revenue.bySource} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <OrdersBarChart
                data={[
                  { day: 'Lun', orders: 45 },
                  { day: 'Mar', orders: 52 },
                  { day: 'Mer', orders: 38 },
                  { day: 'Jeu', orders: 61 },
                  { day: 'Ven', orders: 73 },
                  { day: 'Sam', orders: 48 },
                  { day: 'Dim', orders: 35 }
                ]}
              />
              <UserGrowthChart
                data={[
                  { month: 'Juil', clients: 850, sellers: 45 },
                  { month: 'Août', clients: 920, sellers: 52 },
                  { month: 'Sep', clients: 980, sellers: 61 },
                  { month: 'Oct', clients: 1050, sellers: 72 },
                  { month: 'Nov', clients: 1180, sellers: 81 },
                  { month: 'Déc', clients: 1247, sellers: 89 }
                ]}
              />
            </div>

            <TopSellersTable
              sellers={[
                { id: 1, name: 'Dépôt Wend Konta', location: 'Gounghin', revenue: 84000, orders: 67 },
                { id: 2, name: 'Shell Gas Plus', location: 'Cissin', revenue: 79500, orders: 61 },
                { id: 3, name: 'Total Express', location: 'Dapoya', revenue: 72000, orders: 58 },
                { id: 4, name: 'Vitogaz Center', location: 'Hamdalaye', revenue: 68500, orders: 52 },
                { id: 5, name: 'Gazlam Pro', location: 'Patte d\'Oie', revenue: 61000, orders: 47 }
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;