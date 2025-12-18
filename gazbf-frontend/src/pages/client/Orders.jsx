// ==========================================
// FICHIER: src/pages/client/Orders.jsx (COMPLET)
// ==========================================
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import OrderCard from '../../components/client/OrderCard';
import OrderDetailsModal from '../../components/client/OrderDetailsModal';
import { api } from '../../api/apiSwitch';

const Orders = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, completed

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [filter, orders]);

  const loadOrders = async () => {
    try {
      const response = await api.orders.getMyOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des commandes'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (filter === 'all') {
      setFilteredOrders(orders);
    } else if (filter === 'pending') {
      setFilteredOrders(orders.filter(o => 
        ['pending', 'accepted', 'preparing', 'in_delivery'].includes(o.status)
      ));
    } else if (filter === 'completed') {
      setFilteredOrders(orders.filter(o => o.status === 'completed'));
    }
  };

  const handleCancelOrder = async (order) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }

    try {
      const response = await api.orders.cancelOrder(order.id);
      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Commande annulée avec succès'
        });
        loadOrders();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors de l\'annulation'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des commandes...</p>
        </div>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Mes Commandes</h1>
        <p className="text-gray-600">
          {orders.length} commande{orders.length > 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Filters */}
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
          En cours ({orders.filter(o => 
            ['pending', 'accepted', 'preparing', 'in_delivery'].includes(o.status)
          ).length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Complétées ({orders.filter(o => o.status === 'completed').length})
        </Button>
      </div>

      {/* Liste */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune commande
          </h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'Vous n\'avez pas encore passé de commande'
              : 'Aucune commande dans cette catégorie'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={setSelectedOrder}
              onCancel={handleCancelOrder}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancel={handleCancelOrder}
        />
      )}
    </div>
  );
};

export default Orders;