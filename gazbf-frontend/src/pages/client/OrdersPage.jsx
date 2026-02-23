// ==========================================
// FICHIER: src/pages/client/OrdersPage.jsx
// ✅ SIMPLIFIÉ: `preparing` supprimé du statusConfig dans getStatusBadge
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Loader2, AlertCircle, Star } from 'lucide-react';
import useClientStore from '../../store/clientStore';
import useAuthStore from '../../store/authStore';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import ReviewModal from '../../components/client/ReviewModal';
import { formatPrice, formatDate } from '../../utils/helpers';
import { api } from '../../api/apiSwitch';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { orders, loading, error, fetchMyOrders, cancelOrder, clearError } = useClientStore();
  
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [alert, setAlert] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [orderToReview, setOrderToReview] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      await fetchMyOrders();
    } catch (err) {
      setAlert({ type: 'error', message: 'Erreur lors du chargement des commandes' });
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) return;

    setCancellingOrderId(orderId);
    try {
      await cancelOrder(orderId);
      setAlert({ type: 'success', message: 'Commande annulée avec succès' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Erreur lors de l\'annulation' });
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleViewOrder = (orderId) => {
    navigate(`/client/orders/${orderId}`);
  };

  const handleReorder = (order) => {
    navigate('/client/order/new', {
      state: {
        seller: order.seller,
        products: order.items.map(item => item.product)
      }
    });
  };

  const handleReview = (order) => {
    setOrderToReview(order);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      setSubmittingReview(true);
      console.log('📝 Envoi de l\'avis:', reviewData);
      const response = await api.reviews.createReview(reviewData);
      console.log('✅ Avis créé:', response);

      setAlert({ type: 'success', message: 'Votre avis a été publié avec succès !' });
      setShowReviewModal(false);
      setOrderToReview(null);
      await loadOrders();
    } catch (error) {
      console.error('❌ Erreur création avis:', error);
      setAlert({ type: 'error', message: error.message || 'Erreur lors de la publication de l\'avis' });
    } finally {
      setSubmittingReview(false);
    }
  };

  // Filtrer les commandes
  const filteredOrders = selectedStatus === 'all'
    ? orders
    : orders.filter(order => {
        if (selectedStatus === 'cancelled') {
          return order.status === 'cancelled' || order.status === 'rejected';
        }
        return order.status === selectedStatus;
      });

  // Stats
  const stats = {
    total:     orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled' || o.status === 'rejected').length
  };

  // ✅ `preparing` supprimé du statusConfig
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending:     { color: 'bg-yellow-100 text-yellow-800',  icon: Clock,        label: 'En attente' },
      accepted:    { color: 'bg-blue-100 text-blue-800',      icon: Clock,        label: 'Acceptée' },
      in_delivery: { color: 'bg-indigo-100 text-indigo-800',  icon: Package,      label: 'En livraison' },
      completed:   { color: 'bg-green-100 text-green-800',    icon: CheckCircle,  label: 'Complétée' },
      cancelled:   { color: 'bg-gray-100 text-gray-800',      icon: XCircle,      label: 'Annulée' },
      rejected:    { color: 'bg-red-100 text-red-800',        icon: XCircle,      label: 'Rejetée' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        <span className="hidden sm:inline">{config.label}</span>
      </span>
    );
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5 sm:gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 sm:h-4 sm:w-4 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600">Chargement de vos commandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
          Mes commandes
        </h1>
        <p className="text-xs sm:text-sm text-gray-600">
          Suivez l'état de vos commandes en temps réel
        </p>
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      {/* ==========================================
          STATISTIQUES
          ========================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 p-3 sm:p-4 shadow-sm">
          <p className="text-[10px] sm:text-xs text-blue-700 font-semibold mb-1">📦 Total</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300 p-3 sm:p-4 shadow-sm">
          <p className="text-[10px] sm:text-xs text-yellow-700 font-semibold mb-1">⏳ En attente</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 p-3 sm:p-4 shadow-sm">
          <p className="text-[10px] sm:text-xs text-green-700 font-semibold mb-1">✅ Complétées</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 p-3 sm:p-4 shadow-sm">
          <p className="text-[10px] sm:text-xs text-gray-700 font-semibold mb-1">❌ Annulées</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-600">{stats.cancelled}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {[
            { key: 'all',       label: `Toutes (${orders.length})` },
            { key: 'pending',   label: `En attente (${stats.pending})` },
            { key: 'accepted',  label: 'Acceptées' },
            { key: 'completed', label: `Complétées (${stats.completed})` },
            { key: 'cancelled', label: `Annulées (${stats.cancelled})` }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition-colors ${
                selectedStatus === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des commandes */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
          <Package className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {selectedStatus === 'all' ? 'Aucune commande' : 'Aucune commande dans cette catégorie'}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            {selectedStatus === 'all'
              ? 'Vous n\'avez pas encore passé de commande'
              : 'Vous n\'avez pas de commande avec ce statut'}
          </p>
          {selectedStatus === 'all' && (
            <Button variant="primary" onClick={() => navigate('/client/map')}>
              Trouver du gaz
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              
              {/* En-tête */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
                    <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                      {order.orderNumber}
                    </h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-[10px] sm:text-sm text-gray-600 truncate">
                    {order.seller?.businessName || 'Revendeur'} • {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {formatPrice(order.total)}
                  </p>
                  <p className="text-[10px] sm:text-sm text-gray-600">
                    {order.items?.length || 0} article{order.items?.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Articles */}
              <div className="border-t border-gray-100 pt-3 sm:pt-4 mb-3 sm:mb-4">
                {order.items?.slice(0, 2).map((item, index) => (
                  <div key={index} className="flex items-center gap-2 sm:gap-3 py-2">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-base text-gray-900 truncate">
                        {item.product?.brand} - {item.product?.bottleType}
                      </p>
                      <p className="text-[10px] sm:text-sm text-gray-600">
                        Quantité: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-xs sm:text-base text-gray-900 flex-shrink-0">
                      {formatPrice(item.subtotal)}
                    </p>
                  </div>
                ))}
                {order.items?.length > 2 && (
                  <p className="text-[10px] sm:text-sm text-gray-500 mt-2">
                    +{order.items.length - 2} autre{order.items.length - 2 > 1 ? 's' : ''} article{order.items.length - 2 > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Livraison */}
              <div className="border-t border-gray-100 pt-3 sm:pt-4 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 text-[10px] sm:text-sm text-gray-600">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>
                    {order.deliveryMode === 'delivery' ? 'Livraison' : 'Retrait sur place'}
                  </span>
                  {order.deliveryMode === 'delivery' && order.deliveryAddress && (
                    <span>• {order.deliveryAddress.quarter}</span>
                  )}
                </div>
              </div>

              {/* Raison de rejet */}
              {order.status === 'rejected' && order.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 sm:mb-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-red-800">Raison du rejet</p>
                      <p className="text-xs sm:text-sm text-red-700 mt-1">{order.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Avis existant */}
              {order.review && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs sm:text-sm font-medium text-yellow-800">Votre avis</p>
                    {renderStars(order.review.rating)}
                  </div>
                  {order.review.comment && (
                    <p className="text-xs sm:text-sm text-yellow-900 mb-3">
                      "{order.review.comment}"
                    </p>
                  )}
                  {order.review.sellerResponse && (
                    <div className="border-t border-yellow-300 pt-3">
                      <p className="text-[10px] sm:text-xs font-medium text-yellow-800 mb-1">
                        Réponse du revendeur :
                      </p>
                      <p className="text-xs sm:text-sm text-yellow-900">
                        {order.review.sellerResponse}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3 sm:pt-4">
                {order.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancellingOrderId === order.id}
                  >
                    {cancellingOrderId === order.id ? (
                      <>
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                        <span className="text-xs sm:text-sm">Annulation...</span>
                      </>
                    ) : (
                      <span className="text-xs sm:text-sm">Annuler</span>
                    )}
                  </Button>
                )}

                {order.status === 'completed' && !order.review && (
                  <Button variant="primary" size="sm" onClick={() => handleReview(order)}>
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="text-xs sm:text-sm">Laisser un avis</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL AVIS */}
      {showReviewModal && orderToReview && (
        <ReviewModal
          order={orderToReview}
          onClose={() => { setShowReviewModal(false); setOrderToReview(null); }}
          onSubmit={handleSubmitReview}
          loading={submittingReview}
        />
      )}
    </div>
  );
};

export default OrdersPage;