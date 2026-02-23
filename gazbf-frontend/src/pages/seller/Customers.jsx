// ==========================================
// FICHIER: src/pages/seller/Customers.jsx (AVEC CONTRÔLE D'ACCÈS)
// ==========================================
import React, { useState, useEffect } from 'react';
import { Users, Search, ShoppingBag, Phone, TrendingUp, Award, Loader2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import Input from '../../components/common/Input';
import { formatPrice, formatDate } from '../../utils/helpers';
import useSellerStore from '../../store/sellerStore';
import useSellerAccess from '../../hooks/useSellerAccess';
import SubscriptionRequired from '../../components/seller/SubscriptionRequired';
import SellerAccessBanner from '../../components/seller/SellerAccessBanner';

const Customers = () => {
  const { orders, loading: ordersLoading, error, fetchReceivedOrders, clearError } = useSellerStore();
  const { loading: accessLoading, accessStatus, pricingConfig, hasAccess, needsSubscription } = useSellerAccess();
  
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (hasAccess && !accessLoading) {
      loadCustomers();
    }
  }, [hasAccess, accessLoading]);

  useEffect(() => {
    if (error) {
      setAlert({
        type: 'error',
        message: error
      });
      clearError();
    }
  }, [error]);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, filter, customers]);

  const loadCustomers = async () => {
    try {
      await fetchReceivedOrders();
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des clients'
      });
    }
  };

  useEffect(() => {
    if (orders.length > 0) {
      processCustomersData();
    }
  }, [orders]);

  const processCustomersData = () => {
    const customersMap = new Map();
    
    orders.forEach(order => {
      const customerId = order.customer?.id;
      if (!customerId) return;
      
      if (!customersMap.has(customerId)) {
        customersMap.set(customerId, {
          ...order.customer,
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: null,
          orders: []
        });
      }
      
      const customer = customersMap.get(customerId);
      customer.totalOrders++;
      
      if (order.status === 'completed') {
        customer.totalSpent += parseFloat(order.total);
      }
      
      customer.orders.push(order);
      
      const orderDate = new Date(order.createdAt);
      if (!customer.lastOrderDate || orderDate > new Date(customer.lastOrderDate)) {
        customer.lastOrderDate = order.createdAt;
      }
    });
    
    const customersArray = Array.from(customersMap.values());
    
    const total = customersArray.length;
    const vip = customersArray.filter(c => c.totalOrders >= 5).length;
    const regular = customersArray.filter(c => c.totalOrders >= 2 && c.totalOrders < 5).length;
    const inactive = customersArray.filter(c => {
      const lastOrder = new Date(c.lastOrderDate);
      const daysSinceLastOrder = (new Date() - lastOrder) / (1000 * 60 * 60 * 24);
      return daysSinceLastOrder > 30;
    }).length;
    
    setStats({ total, vip, regular, inactive });
    setCustomers(customersArray);
  };

  const filterCustomers = () => {
    let filtered = [...customers];
    
    if (searchQuery) {
      filtered = filtered.filter(customer => {
        const searchLower = searchQuery.toLowerCase();
        return (
          customer.firstName?.toLowerCase().includes(searchLower) ||
          customer.lastName?.toLowerCase().includes(searchLower) ||
          customer.phone?.includes(searchQuery)
        );
      });
    }
    
    if (filter === 'vip') {
      filtered = filtered.filter(c => c.totalOrders >= 5);
    } else if (filter === 'regular') {
      filtered = filtered.filter(c => c.totalOrders >= 2 && c.totalOrders < 5);
    } else if (filter === 'inactive') {
      filtered = filtered.filter(c => {
        const lastOrder = new Date(c.lastOrderDate);
        const daysSinceLastOrder = (new Date() - lastOrder) / (1000 * 60 * 60 * 24);
        return daysSinceLastOrder > 30;
      });
    }
    
    filtered.sort((a, b) => b.totalSpent - a.totalSpent);
    setFilteredCustomers(filtered);
  };

  const getCustomerBadge = (customer) => {
    if (customer.totalOrders >= 10) {
      return { label: 'VIP Gold', color: 'bg-yellow-100 text-yellow-800' };
    } else if (customer.totalOrders >= 5) {
      return { label: 'VIP', color: 'bg-purple-100 text-purple-800' };
    } else if (customer.totalOrders >= 2) {
      return { label: 'Régulier', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { label: 'Nouveau', color: 'bg-green-100 text-green-800' };
    }
  };

  const getDaysSinceLastOrder = (lastOrderDate) => {
    if (!lastOrderDate) return null;
    const days = Math.floor((new Date() - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24));
    return days;
  };

  // Afficher le loader pendant la vérification de l'accès
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

  // Afficher l'écran de blocage si pas d'accès
  if (needsSubscription) {
    return (
      <SubscriptionRequired 
        accessStatus={accessStatus}
        pricingConfig={pricingConfig}
      />
    );
  }

  if (ordersLoading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary-600 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="space-y-4 sm:space-y-6">
        {/* Bannière de statut d'accès */}
        <SellerAccessBanner 
          accessStatus={accessStatus}
          pricingConfig={pricingConfig}
        />

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Base de Données Clients
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {stats?.total || 0} client(s) enregistré(s)
          </p>
        </div>

        {/* ==========================================
            STATISTIQUES AVEC COULEURS DÉGRADÉES
            ========================================== */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total clients */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                <span className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.total}</span>
              </div>
              <p className="text-xs sm:text-sm text-blue-700 font-semibold">Total clients</p>
            </div>
            
            {/* Clients VIP */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300 p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0" />
                <span className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.vip}</span>
              </div>
              <p className="text-xs sm:text-sm text-yellow-700 font-semibold">👑 Clients VIP</p>
            </div>
            
            {/* Réguliers */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                <span className="text-2xl sm:text-3xl font-bold text-green-600">{stats.regular}</span>
              </div>
              <p className="text-xs sm:text-sm text-green-700 font-semibold">📈 Réguliers</p>
            </div>
            
            {/* Inactifs */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-gray-300 p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 flex-shrink-0" />
                <span className="text-2xl sm:text-3xl font-bold text-gray-600">{stats.inactive}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-700 font-semibold">💤 Inactifs</p>
            </div>
          </div>
        )}

        <Card>
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <Input
                icon={Search}
                placeholder="Rechercher un client (nom, téléphone)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['all', 'vip', 'regular', 'inactive'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    filter === filterType
                      ? 'bg-secondary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterType === 'all' ? 'Tous' :
                   filterType === 'vip' ? 'VIP' :
                   filterType === 'regular' ? 'Réguliers' :
                   'Inactifs'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {filteredCustomers.length === 0 ? (
          <Card>
            <div className="text-center py-8 sm:py-12">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Aucun client trouvé
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                {searchQuery ? 'Aucun résultat pour cette recherche' : 'Vous n\'avez pas encore de clients'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredCustomers.map((customer) => {
              const badge = getCustomerBadge(customer);
              const daysSinceLastOrder = getDaysSinceLastOrder(customer.lastOrderDate);
              
              return (
                <Card key={customer.id}>
                  <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                        {customer.firstName} {customer.lastName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-3 w-3 text-gray-500 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-gray-600 truncate">{customer.phone}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span>Commandes</span>
                      </span>
                      <span className="font-semibold text-gray-900">{customer.totalOrders}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Total dépensé</span>
                      <span className="font-semibold text-secondary-600 truncate ml-2">
                        {formatPrice(customer.totalSpent)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm pt-2 sm:pt-3 border-t">
                      <span className="text-gray-600">Dernière commande</span>
                      <span className={`text-xs ${daysSinceLastOrder > 30 ? 'text-red-600' : 'text-gray-700'} whitespace-nowrap`}>
                        {daysSinceLastOrder === 0 ? 'Aujourd\'hui' :
                         daysSinceLastOrder === 1 ? 'Hier' :
                         `Il y a ${daysSinceLastOrder}j`}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;