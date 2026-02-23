// ==========================================
// FICHIER: src/pages/admin/AdminDashboard.jsx
// VERSION RESPONSIVE — Cartes & Tableaux
// ✅ CORRECTIONS: newSellers + revenus par source
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Trophy,
  Package,
  UserCheck,
  CreditCard,
  Activity
} from 'lucide-react';
import Button from '../../components/common/Button';
import StatCard from '../../components/seller/StatCard';
import Alert from '../../components/common/Alert';
import { formatPrice } from '../../utils/helpers';
import useAuthStore from '../../store/authStore';
import useAdmin from '../../hooks/useAdmin';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const {
    loading,
    error,
    clearError,
    getDashboardStats,
    getRevenueChart,
    getOrdersChart,
    getUserGrowthChart,
    getTopSellers
  } = useAdmin();

  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topSellersData, setTopSellersData] = useState([]);
  const [alert, setAlert] = useState(null);

  // ── Helper: Formater les taux de croissance de manière sécurisée ──
  const formatGrowth = (growth, currentValue) => {
    if (!currentValue || currentValue < 1) return null;
    if (growth === null || growth === undefined || !isFinite(growth)) return null;
    const numGrowth = Number(growth);
    if (Math.abs(numGrowth) < 0.1) return null;
    if (numGrowth > 999) return '999+';
    if (numGrowth < -99) return '-99';
    return numGrowth.toFixed(1);
  };

  // ── Helper: Déterminer la tendance (up/down) ──
  const getTrend = (growth) => {
    if (!growth || !isFinite(growth) || Math.abs(growth) < 0.1) return null;
    return growth > 0 ? 'up' : 'down';
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, revenueRes, sellersRes] = await Promise.all([
        getDashboardStats(),
        getRevenueChart('30days'),
        getTopSellers(5)
      ]);

      if (statsRes?.success)   setStats(statsRes.data);
      if (revenueRes?.success) setRevenueData(revenueRes.data);
      if (sellersRes?.success) setTopSellersData(sellersRes.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Erreur lors du chargement' });
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // ── Calculs sécurisés des KPIs ──
  const totalUsers     = stats?.users?.total || 0;
  const usersGrowth    = formatGrowth(stats?.users?.growth, totalUsers);
  const usersTrend     = getTrend(stats?.users?.growth);

  const monthRevenue   = stats?.revenue?.thisMonth || 0;
  const revenueGrowth  = formatGrowth(stats?.revenue?.growth, monthRevenue);
  const revenueTrend   = getTrend(stats?.revenue?.growth);

  const todayOrders    = stats?.orders?.today || 0;
  const successRate    = stats?.orders?.successRate || 0;

  // ── Calculs pourcentages revenus par source ──
  const clientsRevenue       = stats?.revenue?.bySource?.clients  || 0;
  const sellersRevenue       = stats?.revenue?.bySource?.sellers  || 0;
  const totalRevenueBySource = clientsRevenue + sellersRevenue;
  const clientsPercent       = totalRevenueBySource ? ((clientsRevenue  / totalRevenueBySource) * 100).toFixed(1) : '0.0';
  const sellersPercent       = totalRevenueBySource ? ((sellersRevenue  / totalRevenueBySource) * 100).toFixed(1) : '0.0';

  // ── Affichage de la croissance du revenu ──
  const revenueGrowthDisplay = (() => {
    if (!revenueGrowth) return null;
    const value = parseFloat(revenueGrowth);
    return value > 0 ? `+${revenueGrowth}%` : `${revenueGrowth}%`;
  })();

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── Alertes ── */}
      {(alert || error) && (
        <Alert
          type={alert?.type || 'error'}
          message={alert?.message || error}
          onClose={() => { setAlert(null); clearError(); }}
        />
      )}

      {/* ── Alertes Critiques ── */}
      {stats.alerts?.critical?.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-red-800 mb-2">Alertes critiques</h3>
              <ul className="space-y-1">
                {stats.alerts.critical.map(a => (
                  <li key={a.id} className="text-sm text-red-700 break-words">• {a.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── KPIs Principaux : 1 col mobile → 2 tablet → 4 desktop ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          title="Utilisateurs Total"
          value={totalUsers.toLocaleString()}
          icon={Users}
          trend={usersTrend}
          trendValue={usersGrowth ? `${usersGrowth > 0 ? '+' : ''}${usersGrowth}%` : undefined}
          color="primary"
        />
        <StatCard
          title="Revenus du Mois"
          value={formatPrice(monthRevenue)}
          icon={DollarSign}
          trend={revenueTrend}
          trendValue={revenueGrowthDisplay}
          color="green"
        />
        <StatCard
          title="Commandes Aujourd'hui"
          value={todayOrders.toString()}
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Taux de Succès"
          value={`${successRate}%`}
          icon={CheckCircle}
          color="purple"
        />
      </div>

      {/* ── Stats Rapides (gradient cards) : 1 col mobile → 2 tablet → 4 desktop ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            bg: 'from-blue-500 to-blue-600',
            Icon: UserCheck,
            // ✅ newThisMonth = nouveaux utilisateurs toutes catégories confondues
            value: stats.users?.newThisMonth || 0,
            label: 'Nouveaux Clients',
            sub: 'Ce mois',
            isPrice: false
          },
          {
            bg: 'from-purple-500 to-purple-600',
            Icon: Users,
            // ✅ CORRECTION: utiliser newSellers (ajouté dans le controller)
            value: stats.users?.newSellers || 0,
            label: 'Nouveaux Revendeurs',
            sub: 'Ce mois',
            isPrice: false
          },
          {
            bg: 'from-green-500 to-green-600',
            Icon: Package,
            value: stats.orders?.today || 0,
            label: 'Commandes',
            sub: "Aujourd'hui",
            isPrice: false
          },
          {
            bg: 'from-yellow-500 to-yellow-600',
            Icon: CreditCard,
            value: stats.revenue?.today || 0,
            label: 'Revenus',
            sub: "Aujourd'hui",
            isPrice: true
          },
        ].map((card, i) => (
          <div key={i} className={`bg-gradient-to-br ${card.bg} rounded-lg p-4 text-white`}>
            <div className="flex items-center justify-between mb-2">
              <card.Icon className="h-7 w-7 opacity-80" />
              <span className="text-xl sm:text-2xl font-bold">
                {card.isPrice ? formatPrice(card.value) : card.value}
              </span>
            </div>
            <p className="text-sm opacity-90">{card.label}</p>
            <p className="text-xs opacity-75 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Revenus – tableau avec scroll horizontal sur mobile ── */}
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            💰 Évolution des Revenus (30 derniers jours)
          </h3>
          {revenueGrowthDisplay && (
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-green-600" />
              <span className={`font-semibold ${revenueTrend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                Croissance : {revenueGrowthDisplay}
              </span>
            </div>
          )}
        </div>

        {revenueData.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm min-w-[400px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Date</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Clients</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Revendeurs</th>
                  <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.slice(-10).map((item, idx) => {
                  // ✅ CORRECTION: le controller retourne maintenant { date, clients, sellers }
                  const clientsAmt = item.clients || 0;
                  const sellersAmt = item.sellers || 0;
                  const total      = clientsAmt + sellersAmt;
                  return (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="py-2 px-3 text-gray-900 whitespace-nowrap">{item.date}</td>
                      <td className="py-2 px-3 text-right text-blue-600 font-medium whitespace-nowrap">
                        {formatPrice(clientsAmt)}
                      </td>
                      <td className="py-2 px-3 text-right text-purple-600 font-medium whitespace-nowrap">
                        {formatPrice(sellersAmt)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-gray-900 whitespace-nowrap">
                        {formatPrice(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Aucune donnée disponible</p>
        )}
      </div>

      {/* ── Bloc 2 colonnes (1 col mobile) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Utilisateurs */}
        <div className="bg-white rounded-lg border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">👥 Statistiques Utilisateurs</h3>
          <div className="space-y-3">
            {[
              { Icon: Users, bg: 'bg-blue-50',   color: 'text-blue-600',   label: 'Clients',     value: stats.users?.clients?.toLocaleString() || 0 },
              { Icon: Users, bg: 'bg-purple-50', color: 'text-purple-600', label: 'Revendeurs',  value: stats.users?.sellers || 0 },
            ].map((row, i) => (
              <div key={i} className={`flex items-center justify-between p-3 ${row.bg} rounded-lg`}>
                <div className="flex items-center gap-3">
                  <row.Icon className={`h-5 w-5 ${row.color}`} />
                  <span className="text-gray-700">{row.label}</span>
                </div>
                <span className={`font-bold ${row.color} text-lg`}>{row.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="text-gray-700 font-medium">Nouveaux ce mois</span>
              </div>
              <span className="font-bold text-green-600 text-xl">+{stats.users?.newThisMonth || 0}</span>
            </div>
          </div>
        </div>

        {/* Abonnements */}
        <div className="bg-white rounded-lg border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">💳 Abonnements Actifs</h3>
          <div className="space-y-3">
            {[
              { bg: 'bg-blue-50',   color: 'text-blue-600',   label: 'Clients abonnés',    value: stats.subscriptions?.activeClients || 0, rate: stats.subscriptions?.clientRate || 0 },
              { bg: 'bg-purple-50', color: 'text-purple-600', label: 'Revendeurs abonnés', value: stats.subscriptions?.activeSellers || 0, rate: stats.subscriptions?.sellerRate || 0 },
            ].map((row, i) => (
              <div key={i} className={`flex items-center justify-between p-3 ${row.bg} rounded-lg`}>
                <span className="text-gray-700">{row.label}</span>
                <div className="text-right">
                  <span className={`font-bold ${row.color} text-lg`}>{row.value}</span>
                  <span className="text-sm text-gray-500 ml-1.5">({row.rate}%)</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="text-gray-700 font-medium">Expirent dans 3 jours</span>
              </div>
              <span className="font-bold text-yellow-600 text-xl">{stats.subscriptions?.expiringIn3Days || 0}</span>
            </div>
          </div>
        </div>

        {/* ✅ Revenus par source — abonnements clients vs revendeurs */}
        <div className="bg-white rounded-lg border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">💵 Revenus Abonnements par Source</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Abonnements Clients</span>
              <div className="text-right">
                <span className="font-bold text-blue-600 text-lg block">
                  {formatPrice(clientsRevenue)}
                </span>
                <span className="text-sm text-gray-500">{clientsPercent}% du total</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-gray-700">Abonnements Revendeurs</span>
              <div className="text-right">
                <span className="font-bold text-purple-600 text-lg block">
                  {formatPrice(sellersRevenue)}
                </span>
                <span className="text-sm text-gray-500">{sellersPercent}% du total</span>
              </div>
            </div>
            {/* Barre de répartition visuelle */}
            {totalRevenueBySource > 0 && (
              <div className="mt-2">
                <div className="flex rounded-full overflow-hidden h-3">
                  <div
                    className="bg-blue-500 transition-all duration-500"
                    style={{ width: `${clientsPercent}%` }}
                  />
                  <div
                    className="bg-purple-500 transition-all duration-500"
                    style={{ width: `${sellersPercent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>🔵 Clients</span>
                  <span>🟣 Revendeurs</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-200">
              <span className="text-gray-700 font-medium">Aujourd'hui</span>
              <span className="font-bold text-green-600 text-xl">
                {formatPrice(stats.revenue?.today || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Revendeurs ── */}
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">🏆 Top 5 Revendeurs du Mois</h3>
        {topSellersData.length > 0 ? (
          <div className="space-y-3">
            {topSellersData.map((seller, index) => (
              <div
                key={seller.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white flex-shrink-0 ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{seller.name}</p>
                    <p className="text-sm text-gray-500 truncate">📍 {seller.location}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900 text-lg">{formatPrice(seller.revenue)}</p>
                  <p className="text-sm text-gray-500">{seller.orders} commandes</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">Aucun revendeur actif ce mois</p>
        )}
      </div>

      {/* ── Actions Rapides ── */}
      <div className="bg-white rounded-lg border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">⚡ Actions Rapides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/transactions')}
            className="h-auto py-4"
          >
            <div className="text-center w-full">
              <CreditCard className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Transactions</p>
              <p className="text-xs text-gray-500">Voir l'historique</p>
            </div>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/wallet')}
            className="h-auto py-4"
          >
            <div className="text-center w-full">
              <DollarSign className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Portefeuille</p>
              <p className="text-xs text-gray-500">Gérer les fonds</p>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;