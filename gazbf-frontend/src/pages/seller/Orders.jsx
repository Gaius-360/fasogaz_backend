// ==========================================
// FICHIER: src/pages/seller/Orders.jsx
// ✅ SIMPLIFIÉ: Suppression de l'état `preparing`
//
// FLUX RETRAIT SUR PLACE : pending → accepted → completed
// FLUX LIVRAISON         : pending → accepted → in_delivery → completed
// ==========================================
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Truck, Store, Package } from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import OrderSellerCard from '../../components/seller/OrderSellerCard';
import OrderDetailsModal from '../../components/client/OrderDetailsModal';
import Input from '../../components/common/Input';
import useSellerStore from '../../store/sellerStore';
import useSellerAccess from '../../hooks/useSellerAccess';
import SubscriptionRequired from '../../components/seller/SubscriptionRequired';
import SellerAccessBanner from '../../components/seller/SellerAccessBanner';

const Orders = () => {
  // ==========================================
  // ÉTAT ET HOOKS
  // ==========================================
  const {
    orders,
    loading: ordersLoading,
    error,
    fetchReceivedOrders,
    acceptOrder,
    rejectOrder,
    updateOrderStatus,
    completeOrder,
    clearError
  } = useSellerStore();

  const {
    loading: accessLoading,
    accessStatus,
    pricingConfig,
    hasAccess,
    needsSubscription
  } = useSellerAccess();

  // États locaux
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [alert, setAlert] = useState(null);

  // Filtres
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState('all'); // all | delivery | pickup
  const [statusFilter, setStatusFilter] = useState('all');             // all | pending | active | completed

  // ✅ Statistiques — `preparing` supprimé partout.
  //    `active` = accepted + in_delivery
  const [stats, setStats] = useState({
    total: 0,
    delivery: { total: 0, pending: 0, active: 0, completed: 0 },
    pickup:   { total: 0, pending: 0, active: 0, completed: 0 },
    byStatus: { pending: 0, active: 0, completed: 0 },
    revenue: 0
  });

  // Modals
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderToProcess, setOrderToProcess] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState('20');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // ==========================================
  // EFFETS
  // ==========================================

  useEffect(() => {
    if (hasAccess && !accessLoading) {
      loadOrders();
      const interval = setInterval(loadOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [hasAccess, accessLoading]);

  useEffect(() => {
    if (error) {
      setAlert({ type: 'error', message: error });
      clearError();
    }
  }, [error]);

  useEffect(() => {
    calculateStats();
    applyFilters();
  }, [orders, deliveryTypeFilter, statusFilter]);

  // ==========================================
  // FONCTIONS DE DONNÉES
  // ==========================================

  const loadOrders = async () => {
    try {
      await fetchReceivedOrders();
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
    }
  };

  // ✅ `active` = accepted + in_delivery (preparing supprimé)
  const calculateStats = () => {
    const deliveryOrders = orders.filter(o => o.deliveryMode === 'delivery');
    const pickupOrders   = orders.filter(o => o.deliveryMode === 'pickup');

    const countByStatus = (ordersList) => ({
      pending:   ordersList.filter(o => o.status === 'pending').length,
      active:    ordersList.filter(o => ['accepted', 'in_delivery'].includes(o.status)).length,
      completed: ordersList.filter(o => o.status === 'completed').length,
      total:     ordersList.length
    });

    const revenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    setStats({
      total: orders.length,
      delivery: countByStatus(deliveryOrders),
      pickup:   countByStatus(pickupOrders),
      byStatus: countByStatus(orders),
      revenue
    });
  };

  // ✅ Filtre `active` = accepted + in_delivery
  const applyFilters = () => {
    let result = [...orders];

    // Filtre par type de livraison
    if (deliveryTypeFilter === 'delivery') {
      result = result.filter(o => o.deliveryMode === 'delivery');
    } else if (deliveryTypeFilter === 'pickup') {
      result = result.filter(o => o.deliveryMode === 'pickup');
    }

    // Filtre par statut
    if (statusFilter === 'pending') {
      result = result.filter(o => o.status === 'pending');
    } else if (statusFilter === 'active') {
      result = result.filter(o => ['accepted', 'in_delivery'].includes(o.status));
    } else if (statusFilter === 'completed') {
      result = result.filter(o => o.status === 'completed');
    }

    // Tri : pending en premier, puis par date décroissante
    result.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setFilteredOrders(result);
  };

  // ==========================================
  // GESTIONNAIRES D'ACTIONS
  // ==========================================

  const handleAccept = (order) => {
    setOrderToProcess(order);
    setShowAcceptModal(true);
  };

  const handleReject = (order) => {
    setOrderToProcess(order);
    setShowRejectModal(true);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setAlert({ type: 'success', message: 'Statut mis à jour avec succès' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Erreur lors de la mise à jour' });
    }
  };

  const confirmAccept = async () => {
    if (!orderToProcess) return;

    setProcessing(true);
    try {
      await acceptOrder(orderToProcess.id, parseInt(estimatedTime));
      setAlert({ type: 'success', message: 'Commande acceptée avec succès' });
      setShowAcceptModal(false);
      setOrderToProcess(null);
      setEstimatedTime('20');
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Erreur lors de l\'acceptation' });
    } finally {
      setProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!orderToProcess || !rejectionReason.trim()) {
      setAlert({ type: 'error', message: 'Veuillez indiquer une raison' });
      return;
    }

    setProcessing(true);
    try {
      await rejectOrder(orderToProcess.id, rejectionReason);
      setAlert({ type: 'success', message: 'Commande rejetée' });
      setShowRejectModal(false);
      setOrderToProcess(null);
      setRejectionReason('');
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Erreur lors du rejet' });
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async (order) => {
    if (!window.confirm('Marquer cette commande comme complétée ?')) return;

    try {
      await completeOrder(order.id);
      setAlert({ type: 'success', message: 'Commande marquée comme complétée' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Erreur lors de la mise à jour' });
    }
  };

  // ==========================================
  // RENDU CONDITIONNEL
  // ==========================================

  if (accessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary-600 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600">Vérification de votre accès...</p>
        </div>
      </div>
    );
  }

  if (needsSubscription) {
    return (
      <SubscriptionRequired
        accessStatus={accessStatus}
        pricingConfig={pricingConfig}
      />
    );
  }

  if (ordersLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
      </div>
    );
  }

  // ==========================================
  // RENDU PRINCIPAL
  // ==========================================

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="space-y-4 sm:space-y-6">

        {/* Bannière d'accès */}
        <SellerAccessBanner
          accessStatus={accessStatus}
          pricingConfig={pricingConfig}
        />

        {/* Alertes */}
        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        {/* En-tête */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Commandes Reçues
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {stats.total} commande(s) au total
          </p>
        </div>

        {/* ==========================================
            FILTRES PAR TYPE DE LIVRAISON
            ========================================== */}
        <div className="bg-white rounded-lg border-2 border-neutral-200 p-3 sm:p-4 shadow-sm">
          <p className="text-xs font-semibold text-neutral-600 mb-3 uppercase tracking-wide">
            Type de livraison
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {/* Toutes */}
            <Button
              variant={deliveryTypeFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDeliveryTypeFilter('all')}
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Toutes</span>
              <span className={`${
                deliveryTypeFilter === 'all'
                  ? 'bg-white text-secondary-600'
                  : 'bg-gray-100 text-gray-700'
              } px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold min-w-[24px] text-center`}>
                {stats.total}
              </span>
            </Button>

            {/* Livraison */}
            <Button
              variant={deliveryTypeFilter === 'delivery' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDeliveryTypeFilter('delivery')}
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <Truck className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Livraison</span>
              <span className="sm:hidden">Livr.</span>
              <span className={`${
                deliveryTypeFilter === 'delivery'
                  ? 'bg-white text-secondary-600'
                  : 'bg-gray-100 text-gray-700'
              } px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold min-w-[24px] text-center`}>
                {stats.delivery.total}
              </span>
            </Button>

            {/* Retrait */}
            <Button
              variant={deliveryTypeFilter === 'pickup' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setDeliveryTypeFilter('pickup')}
              className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
            >
              <Store className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Retrait</span>
              <span className="sm:hidden">Retrait</span>
              <span className={`${
                deliveryTypeFilter === 'pickup'
                  ? 'bg-white text-secondary-600'
                  : 'bg-gray-100 text-gray-700'
              } px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold min-w-[24px] text-center`}>
                {stats.pickup.total}
              </span>
            </Button>
          </div>
        </div>

        {/* ==========================================
            STATISTIQUES DÉTAILLÉES
            ========================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {deliveryTypeFilter === 'all' && (
            <>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300 p-3 sm:p-4 shadow-sm">
                <p className="text-xs sm:text-sm text-yellow-700 font-semibold mb-1">⏳ En attente</p>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.byStatus.pending}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 p-3 sm:p-4 shadow-sm">
                <p className="text-xs sm:text-sm text-blue-700 font-semibold mb-1">🔄 En cours</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.byStatus.active}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 p-3 sm:p-4 shadow-sm">
                <p className="text-xs sm:text-sm text-green-700 font-semibold mb-1">✅ Complétées</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.byStatus.completed}</p>
              </div>

              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg border-2 border-secondary-300 p-3 sm:p-4 shadow-sm">
                <p className="text-xs sm:text-sm text-secondary-700 font-semibold mb-1">💰 CA Total</p>
                <p className="text-base sm:text-xl lg:text-2xl font-bold text-secondary-600 truncate">
                  {Math.round(stats.revenue).toLocaleString()} F
                </p>
              </div>
            </>
          )}

          {deliveryTypeFilter === 'delivery' && (
            <>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300 p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-yellow-700 font-semibold truncate">En attente</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.delivery.pending}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-blue-700 font-semibold truncate">En cours</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.delivery.active}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-green-700 font-semibold truncate">Complétées</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.delivery.completed}</p>
              </div>

              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg border-2 border-secondary-300 p-3 sm:p-4 shadow-sm">
                <p className="text-xs sm:text-sm text-secondary-700 font-semibold mb-1 truncate">📦 Total Livraison</p>
                <p className="text-2xl sm:text-3xl font-bold text-secondary-600">{stats.delivery.total}</p>
              </div>
            </>
          )}

          {deliveryTypeFilter === 'pickup' && (
            <>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300 p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Store className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-yellow-700 font-semibold truncate">En attente</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pickup.pending}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Store className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-blue-700 font-semibold truncate">En cours</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.pickup.active}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Store className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs sm:text-sm text-green-700 font-semibold truncate">Complétées</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.pickup.completed}</p>
              </div>

              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg border-2 border-secondary-300 p-3 sm:p-4 shadow-sm">
                <p className="text-xs sm:text-sm text-secondary-700 font-semibold mb-1 truncate">🏪 Total Retrait</p>
                <p className="text-2xl sm:text-3xl font-bold text-secondary-600">{stats.pickup.total}</p>
              </div>
            </>
          )}
        </div>

        {/* ==========================================
            FILTRES PAR STATUT
            ========================================== */}
        <div className="bg-white rounded-lg border-2 border-neutral-200 p-3 sm:p-4 shadow-sm">
          <p className="text-xs font-semibold text-neutral-600 mb-3 uppercase tracking-wide">
            Statut des commandes
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={statusFilter === 'all' ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="whitespace-nowrap text-xs sm:text-sm font-semibold"
            >
              Toutes ({filteredOrders.length})
            </Button>

            <Button
              variant={statusFilter === 'pending' ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
              className="whitespace-nowrap text-xs sm:text-sm font-semibold"
            >
              ⏳ En attente
            </Button>

            <Button
              variant={statusFilter === 'active' ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
              className="whitespace-nowrap text-xs sm:text-sm font-semibold"
            >
              🔄 En cours
            </Button>

            <Button
              variant={statusFilter === 'completed' ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('completed')}
              className="whitespace-nowrap text-xs sm:text-sm font-semibold"
            >
              ✅ Complétées
            </Button>
          </div>
        </div>

        {/* ==========================================
            LISTE DES COMMANDES
            ========================================== */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border-2 border-neutral-200 p-8 sm:p-12 text-center">
            {deliveryTypeFilter === 'delivery' ? (
              <Truck className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            ) : deliveryTypeFilter === 'pickup' ? (
              <Store className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            ) : (
              <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            )}
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              Aucune commande trouvée
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              {deliveryTypeFilter === 'delivery' && statusFilter === 'all' &&
                'Aucune commande de livraison pour le moment'
              }
              {deliveryTypeFilter === 'pickup' && statusFilter === 'all' &&
                'Aucune commande de retrait pour le moment'
              }
              {deliveryTypeFilter === 'all' && statusFilter === 'pending' &&
                'Aucune commande en attente'
              }
              {deliveryTypeFilter === 'all' && statusFilter === 'active' &&
                'Aucune commande en cours'
              }
              {deliveryTypeFilter === 'all' && statusFilter === 'completed' &&
                'Aucune commande complétée'
              }
              {deliveryTypeFilter === 'all' && statusFilter === 'all' &&
                'Vous n\'avez pas encore reçu de commande'
              }
              {deliveryTypeFilter !== 'all' && statusFilter !== 'all' &&
                `Aucune commande ${deliveryTypeFilter === 'delivery' ? 'de livraison' : 'de retrait'} ${
                  statusFilter === 'pending'   ? 'en attente' :
                  statusFilter === 'active'    ? 'en cours'   : 'complétée'
                }`
              }
            </p>
          </div>
        ) : (
          <div>
            {/* Compteur */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-neutral-600">
                <span className="font-bold text-neutral-900">{filteredOrders.length}</span> commande(s) affichée(s)
              </p>
              {(deliveryTypeFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setDeliveryTypeFilter('all'); setStatusFilter('all'); }}
                  className="text-xs"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>

            {/* Grille */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {filteredOrders.map((order) => (
                <OrderSellerCard
                  key={order.id}
                  order={order}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onUpdateStatus={handleUpdateStatus}
                  onViewDetails={setSelectedOrder}
                  onComplete={handleComplete}
                />
              ))}
            </div>
          </div>
        )}

        {/* ==========================================
            MODAL ACCEPTATION
            ========================================== */}
        {showAcceptModal && orderToProcess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Accepter la commande
              </h3>

              <div className="flex items-center gap-2 mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-br from-accent-50 to-primary-50 rounded-lg border-2 border-accent-200">
                {orderToProcess.deliveryMode === 'delivery' ? (
                  <>
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm sm:text-base text-gray-900 truncate">
                        Commande #{orderToProcess.orderNumber}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">Livraison à domicile</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Store className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm sm:text-base text-gray-900 truncate">
                        Commande #{orderToProcess.orderNumber}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">Retrait sur place</p>
                    </div>
                  </>
                )}
              </div>

              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <Button
                  variant="outline"
                  onClick={() => { setShowAcceptModal(false); setOrderToProcess(null); }}
                  disabled={processing}
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
                <Button variant="primary" fullWidth onClick={confirmAccept} loading={processing}>
                  Accepter la commande
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            MODAL REJET
            ========================================== */}
        {showRejectModal && orderToProcess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                Rejeter la commande
              </h3>

              <div className="flex items-center gap-2 mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200">
                {orderToProcess.deliveryMode === 'delivery' ? (
                  <>
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm sm:text-base text-gray-900 truncate">
                        Commande #{orderToProcess.orderNumber}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">Livraison à domicile</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Store className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm sm:text-base text-gray-900 truncate">
                        Commande #{orderToProcess.orderNumber}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">Retrait sur place</p>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                {[
                  'Produit en rupture de stock',
                  'Hors zone de livraison',
                  'Fermé actuellement'
                ].map((reason) => (
                  <label key={reason} className="flex items-start sm:items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={rejectionReason === reason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mr-2 mt-0.5 sm:mt-0 flex-shrink-0"
                    />
                    <span className="text-xs sm:text-sm">{reason}</span>
                  </label>
                ))}
                <label className="flex items-start sm:items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                  <input
                    type="radio"
                    name="reason"
                    value="other"
                    checked={!['Produit en rupture de stock', 'Hors zone de livraison', 'Fermé actuellement'].includes(rejectionReason)}
                    onChange={() => setRejectionReason('')}
                    className="mr-2 mt-0.5 sm:mt-0 flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm">Autre raison</span>
                </label>
              </div>

              {!['Produit en rupture de stock', 'Hors zone de livraison', 'Fermé actuellement'].includes(rejectionReason) && (
                <Input
                  placeholder="Précisez la raison du rejet..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <Button
                  variant="outline"
                  onClick={() => { setShowRejectModal(false); setOrderToProcess(null); setRejectionReason(''); }}
                  disabled={processing}
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
                <Button variant="danger" fullWidth onClick={confirmReject} loading={processing}>
                  Rejeter la commande
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            MODAL DÉTAILS COMMANDE
            ========================================== */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onCancel={() => {}}
          />
        )}
      </div>
    </div>
  );
};

export default Orders;