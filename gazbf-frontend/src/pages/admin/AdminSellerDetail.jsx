// ==========================================
// FICHIER: src/pages/admin/AdminSellerDetail.jsx
// Détail complet d'un revendeur
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  Ban,
  CheckCircle,
  Trash2
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import { formatPrice, formatDateTime } from '../../utils/helpers';

const AdminSellerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadSellerDetail();
  }, [id]);

  const loadSellerDetail = async () => {
    try {
      const response = await api.admin.sellers.getById(id);
      if (response.success) {
        setSeller(response.data);
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

  const handleSuspend = async () => {
    if (!window.confirm(`Suspendre ${seller.businessName} ?`)) return;

    const reason = prompt('Raison de la suspension :');
    if (!reason) return;

    try {
      const response = await api.admin.sellers.suspend(seller.id, reason, 'indefinite');
      if (response.success) {
        setAlert({ type: 'success', message: 'Revendeur suspendu' });
        loadSellerDetail();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors de la suspension' });
    }
  };

  const handleReactivate = async () => {
    if (!window.confirm(`Réactiver ${seller.businessName} ?`)) return;

    try {
      const response = await api.admin.sellers.reactivate(seller.id);
      if (response.success) {
        setAlert({ type: 'success', message: 'Revendeur réactivé' });
        loadSellerDetail();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors de la réactivation' });
    }
  };

  const handleDelete = async () => {
    const confirmation = prompt(
      `⚠️ ATTENTION: Cette action est IRRÉVERSIBLE!\n\nPour supprimer ${seller.businessName}, tapez: SUPPRIMER`
    );
    
    if (confirmation !== 'SUPPRIMER') return;

    try {
      const response = await api.admin.sellers.delete(seller.id);
      if (response.success) {
        setAlert({ type: 'success', message: 'Revendeur supprimé' });
        setTimeout(() => navigate('/admin/sellers'), 2000);
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors de la suppression' });
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      approved: { label: 'Validé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: null },
      suspended: { label: 'Suspendu', color: 'bg-red-100 text-red-800', icon: Ban },
      rejected: { label: 'Rejeté', color: 'bg-gray-100 text-gray-800', icon: null }
    };
    return configs[status] || configs.pending;
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

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Revendeur non trouvé</p>
          <Button onClick={() => navigate('/admin/sellers')} className="mt-4">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(seller.validationStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/sellers')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Store className="h-6 w-6 text-primary-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {seller.businessName}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Revendeur #{seller.id.slice(-8)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {seller.validationStatus === 'approved' && (
                <Button
                  variant="outline"
                  onClick={handleSuspend}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Suspendre
                </Button>
              )}

              {seller.validationStatus === 'suspended' && (
                <Button
                  variant="primary"
                  onClick={handleReactivate}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Réactiver
                </Button>
              )}

              <Button
                variant="danger"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
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

        {/* Carte principale */}
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                {seller.deliveryAvailable && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    🚚 Livraison disponible
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Informations du propriétaire</h3>
                  <div className="text-sm space-y-2">
                    <p className="text-gray-600">
                      <strong>Nom complet:</strong> {seller.firstName} {seller.lastName}
                    </p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{seller.phone}</span>
                    </div>
                    {seller.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{seller.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Localisation</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{seller.quarter}, {seller.city}</span>
                    </div>
                    {seller.latitude && seller.longitude && (
                      <p className="text-gray-600">
                        <strong>GPS:</strong> {seller.latitude}, {seller.longitude}
                      </p>
                    )}
                    {seller.deliveryAvailable && (
                      <p className="text-gray-600">
                        <strong>Frais de livraison:</strong> {formatPrice(seller.deliveryFee)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Inscrit le {formatDateTime(seller.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {seller.products?.length || 0}
              </p>
              <p className="text-sm text-gray-600">Produits</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {seller.stats?.totalOrders || 0}
              </p>
              <p className="text-sm text-gray-600">Commandes</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(seller.stats?.totalRevenue || 0)}
              </p>
              <p className="text-sm text-gray-600">Chiffre d'affaires</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {seller.stats?.averageRating ? seller.stats.averageRating.toFixed(1) : 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                {seller.stats?.totalReviews || 0} avis
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Vue d'ensemble
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'products'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Produits ({seller.products?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Historique
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Tab: Vue d'ensemble */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Informations détaillées
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Taux de complétion</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {seller.stats?.totalOrders > 0
                          ? Math.round((seller.stats.completedOrders / seller.stats.totalOrders) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Commandes complétées</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {seller.stats?.completedOrders || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {seller.suspensionReason && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800 mb-1">
                      Raison de la suspension
                    </p>
                    <p className="text-sm text-red-700">{seller.suspensionReason}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Produits */}
            {activeTab === 'products' && (
              <div>
                {seller.products && seller.products.length > 0 ? (
                  <div className="space-y-3">
                    {seller.products.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {product.brand} - {product.bottleType}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Stock: {product.quantity} unités
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-600">
                            {formatPrice(product.price)}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            product.status === 'available'
                              ? 'bg-green-100 text-green-800'
                              : product.status === 'limited'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.status === 'available' ? 'Disponible' :
                             product.status === 'limited' ? 'Limité' : 'Rupture'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun produit</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Historique */}
            {activeTab === 'orders' && (
              <div>
                <p className="text-gray-600">
                  Historique des {seller.stats?.totalOrders || 0} commandes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSellerDetail;