// ==========================================
// FICHIER: src/pages/seller/Dashboard.jsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { Eye, ShoppingBag, TrendingUp, Star, Package, AlertTriangle } from 'lucide-react';
import StatCard from '../../components/seller/StatCard';
import Alert from '../../components/common/Alert';
import { formatPrice } from '../../utils/helpers';
import { api } from '../../api/apiSwitch';
import useAuthStore from '../../store/authStore';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Charger les produits
     const productsRes = await api.seller.getMyProducts();
      const products = productsRes.data?.products || [];
      
      // Charger les commandes
      const ordersRes = await api.seller.getReceivedOrders();
      const orders = ordersRes.data?.orders || [];
      
      // Calculer les stats
      const totalProducts = products.length;
      const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
      const lowStockProducts = products.filter(p => p.quantity <= 5).length;
      
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      
      const totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + parseFloat(o.total), 0);

      setStats({
        totalProducts,
        totalStock,
        lowStockProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        averageRating: user?.averageRating || 0,
        totalReviews: user?.totalReviews || 0
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des données'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-secondary-600 border-r-transparent"></div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si le profil n'est pas approuvé
  if (user?.validationStatus !== 'approved') {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert
          type={user?.validationStatus === 'pending' ? 'warning' : 'error'}
          title={user?.validationStatus === 'pending' ? 'En attente de validation' : 'Profil rejeté'}
          message={
            user?.validationStatus === 'pending'
              ? 'Votre profil est en cours de vérification par notre équipe. Vous recevrez une notification dans les 24-48h.'
              : `Votre profil a été rejeté. Raison: ${user?.rejectionReason || 'Non spécifiée'}`
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Commandes aujourd'hui"
          value={stats?.pendingOrders || 0}
          icon={ShoppingBag}
          color="secondary"
        />
        
        <StatCard
          title="Chiffre d'affaires"
          value={formatPrice(stats?.totalRevenue || 0)}
          icon={TrendingUp}
          color="green"
        />
        
        <StatCard
          title="Stock total"
          value={`${stats?.totalStock || 0} unités`}
          icon={Package}
          color="blue"
        />
        
        <StatCard
          title="Note moyenne"
          value={`${parseFloat(stats?.averageRating || 0).toFixed(1)} ⭐`}
          icon={Star}
          color="yellow"
        />
      </div>

      {/* Alertes stock */}
      {stats?.lowStockProducts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">
                Alertes stock
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {stats.lowStockProducts} produit(s) ont un stock faible (≤ 5 unités)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Résumé des commandes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Commandes en attente</h3>
            <span className="text-3xl font-bold text-yellow-600">
              {stats?.pendingOrders || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Nécessitent une réponse rapide
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Commandes totales</h3>
            <span className="text-3xl font-bold text-blue-600">
              {stats?.totalOrders || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Depuis le début
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Taux de complétion</h3>
            <span className="text-3xl font-bold text-green-600">
              {stats?.totalOrders > 0 
                ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
                : 0}%
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {stats?.completedOrders || 0} commandes complétées
          </p>
        </div>
      </div>

      {/* Produits */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-lg text-gray-900 mb-4">
          Aperçu du stock
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Produits</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{stats?.totalStock || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Unités totales</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats?.lowStockProducts || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Stock faible</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">
              {stats?.averageRating > 0 ? parseFloat(stats.averageRating).toFixed(1) : '-'}
            </p>
            <p className="text-sm text-gray-600 mt-1">Note ⭐</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;