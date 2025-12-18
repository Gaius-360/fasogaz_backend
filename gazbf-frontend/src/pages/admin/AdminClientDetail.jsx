// ==========================================
// FICHIER: src/pages/admin/AdminClientDetail.jsx
// Détail complet d'un client
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  Ban,
  CheckCircle,
  Trash2,
  CreditCard,
  Package
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import { formatPrice, formatDateTime } from '../../utils/helpers';

const AdminClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadClientDetail();
  }, [id]);

  const loadClientDetail = async () => {
    try {
      const response = await api.admin.clients.getById(id);
      if (response.success) {
        setClient(response.data);
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

  const handleBlock = async () => {
    if (!window.confirm(`Bloquer ${client.firstName} ${client.lastName} ?`)) return;

    const reason = prompt('Raison du blocage :');
    if (!reason) return;

    try {
      const response = await api.admin.clients.block(client.id, reason);
      if (response.success) {
        setAlert({ type: 'success', message: 'Client bloqué' });
        loadClientDetail();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors du blocage' });
    }
  };

  const handleUnblock = async () => {
    if (!window.confirm(`Débloquer ${client.firstName} ${client.lastName} ?`)) return;

    try {
      const response = await api.admin.clients.unblock(client.id);
      if (response.success) {
        setAlert({ type: 'success', message: 'Client débloqué' });
        loadClientDetail();
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors du déblocage' });
    }
  };

  const handleDelete = async () => {
    const confirmation = prompt(
      `⚠️ ATTENTION: Cette action est IRRÉVERSIBLE!\n\nPour supprimer ${client.firstName} ${client.lastName}, tapez: SUPPRIMER`
    );
    
    if (confirmation !== 'SUPPRIMER') return;

    try {
      const response = await api.admin.clients.delete(client.id);
      if (response.success) {
        setAlert({ type: 'success', message: 'Client supprimé' });
        setTimeout(() => navigate('/admin/clients'), 2000);
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Erreur lors de la suppression' });
    }
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

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Client non trouvé</p>
          <Button onClick={() => navigate('/admin/clients')} className="mt-4">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/clients')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-primary-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {client.firstName} {client.lastName}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Client #{client.id.slice(-8)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!client.isBlocked ? (
                <Button
                  variant="outline"
                  onClick={handleBlock}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Bloquer
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleUnblock}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Débloquer
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
                {client.isBlocked ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    🚫 Bloqué
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    ✓ Actif
                  </span>
                )}
                
                {client.subscription?.isActive ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Abonné
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    Non abonné
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Informations personnelles</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{client.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Inscrit le {formatDateTime(client.createdAt).split(' à ')[0]}</span>
                    </div>
                  </div>
                </div>

                {client.subscription && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Abonnement</h3>
                    <div className="text-sm space-y-2">
                      <p className="text-gray-600">
                        <strong>Plan:</strong> {client.subscription.planType === 'weekly' ? '1 semaine' : '1 mois'}
                      </p>
                      <p className="text-gray-600">
                        <strong>Début:</strong> {formatDateTime(client.subscription.startDate).split(' à ')[0]}
                      </p>
                      <p className="text-gray-600">
                        <strong>Expire:</strong> {formatDateTime(client.subscription.endDate).split(' à ')[0]}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {client.blockReason && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Raison du blocage
                  </p>
                  <p className="text-sm text-red-700">{client.blockReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {client.stats?.totalOrders || 0}
              </p>
              <p className="text-sm text-gray-600">Commandes</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {client.stats?.completedOrders || 0}
              </p>
              <p className="text-sm text-gray-600">Complétées</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(client.stats?.totalSpent || 0)}
              </p>
              <p className="text-sm text-gray-600">Total dépensé</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(client.stats?.avgOrderValue || 0)}
              </p>
              <p className="text-sm text-gray-600">Panier moyen</p>
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
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Commandes ({client.orders?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'addresses'
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Adresses ({client.addresses?.length || 0})
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Tab: Vue d'ensemble */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Activité
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Taux de complétion</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {client.stats?.totalOrders > 0
                          ? Math.round((client.stats.completedOrders / client.stats.totalOrders) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Fréquence</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {client.stats?.totalOrders > 0
                          ? (client.stats.totalOrders / 
                             Math.max(1, Math.floor((Date.now() - new Date(client.createdAt)) / (7 * 86400000)))).toFixed(1)
                          : 0}
                      </p>
                      <p className="text-xs text-gray-500">commandes/semaine</p>
                    </div>
                  </div>
                </div>

                {client.stats?.lastOrder && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 mb-1">
                      Dernière commande
                    </p>
                    <p className="text-sm text-blue-700">
                      {formatDateTime(client.stats.lastOrder)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Commandes */}
            {activeTab === 'orders' && (
              <div>
                {client.orders && client.orders.length > 0 ? (
                  <div className="space-y-3">
                    {client.orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            Commande #{order.orderNumber}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-600">
                            {formatPrice(order.total)}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune commande</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Adresses */}
            {activeTab === 'addresses' && (
              <div>
                {client.addresses && client.addresses.length > 0 ? (
                  <div className="space-y-3">
                    {client.addresses.map((address) => (
                      <div key={address.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                {address.label}
                              </h4>
                              {address.isDefault && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                  Par défaut
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {address.fullAddress}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.quarter}, {address.city}
                            </p>
                          </div>
                          <MapPin className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune adresse enregistrée</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminClientDetail;