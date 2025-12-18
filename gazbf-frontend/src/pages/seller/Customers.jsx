import React, { useState, useEffect } from 'react';
import { Users, Search, Star, ShoppingBag, Phone, Mail, TrendingUp, Award } from 'lucide-react';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import Input from '../../components/common/Input';
import { formatPrice, formatDate } from '../../utils/helpers';
import { api } from '../../api/apiSwitch';

const Customers = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filter, setFilter] = useState('all'); // all, vip, regular, inactive

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, filter, customers]);

  const loadCustomers = async () => {
    try {
      const ordersRes = await api.seller.getReceivedOrders();
      
      if (ordersRes.success) {
        const orders = ordersRes.data.orders || [];
        
        // Grouper par client
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
        
        // Calculer les statistiques
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
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des clients'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];
    
    // Filtrer par recherche
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
    
    // Filtrer par catégorie
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
    
    // Trier par dépenses totales
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
          Base de Données Clients
        </h1>
        <p className="text-gray-600">
          {stats?.total || 0} client(s) enregistré(s)
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-blue-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600">Total clients</p>
          </Card>
          
          <Card>
            <div className="flex items-center gap-3 mb-2">
              <Award className="h-8 w-8 text-yellow-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.vip}</span>
            </div>
            <p className="text-sm text-gray-600">Clients VIP</p>
          </Card>
          
          <Card>
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.regular}</span>
            </div>
            <p className="text-sm text-gray-600">Réguliers</p>
          </Card>
          
          <Card>
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-gray-600" />
              <span className="text-3xl font-bold text-gray-900">{stats.inactive}</span>
            </div>
            <p className="text-sm text-gray-600">Inactifs</p>
          </Card>
        </div>
      )}

      {/* Recherche et filtres */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              icon={Search}
              placeholder="Rechercher un client (nom, téléphone)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-secondary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('vip')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'vip'
                  ? 'bg-secondary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              VIP
            </button>
            <button
              onClick={() => setFilter('regular')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'regular'
                  ? 'bg-secondary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Réguliers
            </button>
            <button
              onClick={() => setFilter('inactive')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'inactive'
                  ? 'bg-secondary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactifs
            </button>
          </div>
        </div>
      </Card>

      {/* Liste des clients */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun client trouvé
            </h3>
            <p className="text-gray-600">
              {searchQuery ? 'Aucun résultat pour cette recherche' : 'Vous n\'avez pas encore de clients'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => {
            const badge = getCustomerBadge(customer);
            const daysSinceLastOrder = getDaysSinceLastOrder(customer.lastOrderDate);
            
            return (
              <Card key={customer.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-3 w-3 text-gray-500" />
                      <span className="text-sm text-gray-600">{customer.phone}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      Commandes
                    </span>
                    <span className="font-semibold text-gray-900">{customer.totalOrders}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total dépensé</span>
                    <span className="font-semibold text-secondary-600">
                      {formatPrice(customer.totalSpent)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-3 border-t">
                    <span className="text-gray-600">Dernière commande</span>
                    <span className={`text-xs ${daysSinceLastOrder > 30 ? 'text-red-600' : 'text-gray-700'}`}>
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
  );
};

export default Customers;