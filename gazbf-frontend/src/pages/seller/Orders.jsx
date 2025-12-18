// ==========================================
// FICHIER: src/pages/seller/Orders.jsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import OrderSellerCard from '../../components/seller/OrderSellerCard';
import OrderDetailsModal from '../../components/client/OrderDetailsModal';
import Input from '../../components/common/Input';
import { api } from '../../api/apiSwitch';

const Orders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);
  
  // Modals
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderToProcess, setOrderToProcess] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState('20');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadOrders();
    // Rafraîchir toutes les 30 secondes pour les nouvelles commandes
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterOrders();
  }, [filter, orders]);

  const loadOrders = async () => {
    try {
     const response = await api.seller.getReceivedOrders();
      if (response.success) {
        setOrders(response.data.orders);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (filter === 'all') {
      setFilteredOrders(orders);
    } else if (filter === 'pending') {
      setFilteredOrders(orders.filter(o => o.status === 'pending'));
    } else if (filter === 'active') {
      setFilteredOrders(orders.filter(o => 
        ['accepted', 'preparing', 'in_delivery'].includes(o.status)
      ));
    } else if (filter === 'completed') {
      setFilteredOrders(orders.filter(o => o.status === 'completed'));
    }
  };

  const handleAccept = (order) => {
    setOrderToProcess(order);
    setShowAcceptModal(true);
  };

  const handleReject = (order) => {
    setOrderToProcess(order);
    setShowRejectModal(true);
  };

  const confirmAccept = async () => {
    if (!orderToProcess) return;

    try {
      const response = await api.seller.acceptOrder(
        orderToProcess.id,
        parseInt(estimatedTime)
      );

      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Commande acceptée avec succès'
        });
        setShowAcceptModal(false);
        setOrderToProcess(null);
        setEstimatedTime('20');
        loadOrders();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors de l\'acceptation'
      });
    }
  };

  const confirmReject = async () => {
    if (!orderToProcess || !rejectionReason.trim()) {
      setAlert({
        type: 'error',
        message: 'Veuillez indiquer une raison'
      });
      return;
    }

    try {
      const response = await api.seller.rejectOrder(
        orderToProcess.id,
        rejectionReason
      );

      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Commande rejetée'
        });
        setShowRejectModal(false);
        setOrderToProcess(null);
        setRejectionReason('');
        loadOrders();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors du rejet'
      });
    }
  };

  const handleUpdateStatus = async (order) => {
    const nextStatus = {
      'accepted': 'preparing',
      'preparing': 'in_delivery',
      'in_delivery': 'completed'
    };

    const newStatus = nextStatus[order.status];
    if (!newStatus) return;

    try {
      const response = await api.seller.updateOrderStatus(order.id, newStatus);

      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Statut mis à jour'
        });
        loadOrders();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors de la mise à jour'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
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
          Commandes Reçues
        </h1>
        <p className="text-gray-600">
          {orders.length} commande(s) au total
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600 mb-1">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600 mb-1">En cours</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.accepted + stats.preparing + stats.inDelivery || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600 mb-1">Complétées</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600 mb-1">CA Total</p>
            <p className="text-2xl font-bold text-secondary-600">
              {Math.round(stats.totalRevenue).toLocaleString()} F
            </p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Toutes ({orders.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('pending')}
        >
          En attente ({stats?.pending || 0})
        </Button>
        <Button
          variant={filter === 'active' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          En cours ({(stats?.accepted || 0) + (stats?.preparing || 0)})
        </Button>
        <Button
          variant={filter === 'completed' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Complétées ({stats?.completed || 0})
        </Button>
      </div>

      {/* Liste */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune commande
          </h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'Vous n\'avez pas encore reçu de commande'
              : 'Aucune commande dans cette catégorie'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <OrderSellerCard
              key={order.id}
              order={order}
              onAccept={handleAccept}
              onReject={handleReject}
              onViewDetails={setSelectedOrder}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      {/* Modal Accepter */}
      {showAcceptModal && orderToProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Accepter la commande
            </h3>
            <p className="text-gray-600 mb-4">
              Commande #{orderToProcess.orderNumber}
            </p>

            <Input
              label="Temps de préparation estimé (minutes)"
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              min="5"
              max="120"
            />

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAcceptModal(false);
                  setOrderToProcess(null);
                }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={confirmAccept}
              >
                Accepter la commande
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejeter */}
      {showRejectModal && orderToProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Rejeter la commande
            </h3>
            <p className="text-gray-600 mb-4">
              Commande #{orderToProcess.orderNumber}
            </p>

            <div className="space-y-3 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reason"
                  value="Produit en rupture de stock"
                  checked={rejectionReason === 'Produit en rupture de stock'}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Produit en rupture de stock</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reason"
                  value="Hors zone de livraison"
                  checked={rejectionReason === 'Hors zone de livraison'}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Hors zone de livraison</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reason"
                  value="Fermé actuellement"
                  checked={rejectionReason === 'Fermé actuellement'}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Fermé actuellement</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="reason"
                  value="other"
                  checked={!['Produit en rupture de stock', 'Hors zone de livraison', 'Fermé actuellement'].includes(rejectionReason)}
                  onChange={(e) => setRejectionReason('')}
                  className="mr-2"
                />
                <span className="text-sm">Autre</span>
              </label>
            </div>

            {!['Produit en rupture de stock', 'Hors zone de livraison', 'Fermé actuellement'].includes(rejectionReason) && (
              <Input
                placeholder="Précisez la raison..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            )}

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setOrderToProcess(null);
                  setRejectionReason('');
                }}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={confirmReject}
              >
                Rejeter la commande
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détails */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={() => {}} // Pas d'annulation côté revendeur
        />
      )}
    </div>
  );
};

export default Orders;