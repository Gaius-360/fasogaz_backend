// ==========================================
// FICHIER: src/pages/admin/AdminSellerDetail.jsx
// VERSION RESPONSIVE
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
  Trash2,
  Truck,
  Eye,
  MessageSquare,
  DollarSign,
  Clock
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { formatPrice, formatDateTime } from '../../utils/helpers';
import useAdmin from '../../hooks/useAdmin';

// ── Helpers d'affichage ──────────────────────────────────────────────────────

/** Formate un taux (0-100) en "X%" ou "N/A" si indéfini / NaN */
const formatRate = (value) => {
  if (value === undefined || value === null || isNaN(Number(value))) return 'N/A';
  return `${Number(value).toFixed(0)}%`;
};

/** Formate une note (0-5) en "X.X" ou "N/A" si indéfini / NaN */
const formatRating = (value) => {
  if (value === undefined || value === null || isNaN(Number(value)) || Number(value) === 0) return 'N/A';
  return Number(value).toFixed(1);
};

// ────────────────────────────────────────────────────────────────────────────

const AdminSellerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    loading,
    error,
    clearError,
    getSellerById,
    suspendSeller,
    reactivateSeller,
    deleteSeller
  } = useAdmin();

  const [seller, setSeller]       = useState(null);
  const [alert, setAlert]         = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadSellerDetail(); }, [id]);

  const loadSellerDetail = async () => {
    try {
      const response = await getSellerById(id);
      if (response?.success) setSeller(response.data);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Erreur lors du chargement' });
    }
  };

  // ── Actions ──
  const handleSuspend = async () => {
    if (!window.confirm(`Suspendre ${seller.businessName} ?`)) return;
    const reason = prompt('Raison de la suspension :');
    if (!reason) return;
    try {
      const response = await suspendSeller(seller.id, reason, 'indefinite');
      if (response?.success) { setAlert({ type: 'success', message: 'Revendeur suspendu' }); loadSellerDetail(); }
    } catch (err) { setAlert({ type: 'error', message: err.message || 'Erreur lors de la suspension' }); }
  };

  const handleReactivate = async () => {
    if (!window.confirm(`Réactiver ${seller.businessName} ?`)) return;
    try {
      const response = await reactivateSeller(seller.id);
      if (response?.success) { setAlert({ type: 'success', message: 'Revendeur réactivé' }); loadSellerDetail(); }
    } catch (err) { setAlert({ type: 'error', message: err.message || 'Erreur lors de la réactivation' }); }
  };

  const handleDelete = async () => {
    const confirmation = prompt(
      `⚠️ ATTENTION: Cette action est IRRÉVERSIBLE!\n\nPour supprimer ${seller.businessName}, tapez: SUPPRIMER`
    );
    if (confirmation !== 'SUPPRIMER') return;
    try {
      const response = await deleteSeller(seller.id);
      if (response?.success) { setAlert({ type: 'success', message: 'Revendeur supprimé' }); setTimeout(() => navigate('/admin/sellers'), 2000); }
    } catch (err) { setAlert({ type: 'error', message: err.message || 'Erreur lors de la suppression' }); }
  };

  const isSuspended = seller?.validationStatus === 'suspended';

  // ── Loading / Not found ──
  if (loading && !seller) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Revendeur non trouvé</p>
          <Button onClick={() => navigate('/admin/sellers')}>Retour</Button>
        </div>
      </div>
    );
  }

  // ── Stats avec valeurs par défaut sécurisées ──
  const rawStats = seller.stats || {};

  const stats = {
    products: {
      total:      rawStats.products?.total      ?? 0,
      available:  rawStats.products?.available  ?? 0,
      limited:    rawStats.products?.limited    ?? 0,
      outOfStock: rawStats.products?.outOfStock ?? 0,
      totalStock: rawStats.products?.totalStock ?? 0,
      totalViews: rawStats.products?.totalViews ?? 0,
    },
    orders: {
      total:     rawStats.orders?.total     ?? 0,
      pending:   rawStats.orders?.pending   ?? 0,
      completed: rawStats.orders?.completed ?? 0,
      cancelled: rawStats.orders?.cancelled ?? 0,
    },
    revenue: {
      total:     rawStats.revenue?.total     ?? 0,
      thisMonth: rawStats.revenue?.thisMonth ?? 0,
      today:     rawStats.revenue?.today     ?? 0,
      average:   rawStats.revenue?.average   ?? 0,
    },
    reviews: {
      total:        rawStats.reviews?.total        ?? 0,
      average:      rawStats.reviews?.average      ?? 0,
      withResponse: rawStats.reviews?.withResponse ?? 0,
      distribution: rawStats.reviews?.distribution ?? {},
    },
    performance: {
      orderCompletionRate:  rawStats.performance?.orderCompletionRate  ?? null,
      orderAcceptanceRate:  rawStats.performance?.orderAcceptanceRate  ?? null,
      averageRating:        rawStats.performance?.averageRating        ?? null,
    },
  };

  // ── Tabs config ──
  const tabs = [
    { key: 'overview',  label: "Vue d'ensemble" },
    { key: 'products',  label: `Produits (${stats.products.total})` },
    { key: 'orders',    label: `Commandes (${stats.orders.total})` },
    { key: 'reviews',   label: `Avis (${stats.reviews.total})` },
  ];

  return (
    <div className="space-y-4">

      {/* ── En-tête : retour + nom + boutons action ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Côté gauche */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button variant="ghost" onClick={() => navigate('/admin/sellers')} className="p-1.5 sm:p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Store className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{seller.businessName}</h1>
              <p className="text-xs sm:text-sm text-gray-500">Revendeur #{seller.id.slice(-8)}</p>
            </div>
          </div>
        </div>

        {/* Côté droit : boutons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isSuspended ? (
            <Button variant="outline" onClick={handleSuspend} disabled={loading} className="text-sm sm:text-base">
              <Ban className="h-4 w-4 mr-1.5" /> Suspendre
            </Button>
          ) : (
            <Button variant="primary" onClick={handleReactivate} disabled={loading} className="text-sm sm:text-base">
              <CheckCircle className="h-4 w-4 mr-1.5" /> Réactiver
            </Button>
          )}
          <Button variant="danger" onClick={handleDelete} disabled={loading} className="text-sm sm:text-base">
            <Trash2 className="h-4 w-4 mr-1.5" /> Supprimer
          </Button>
        </div>
      </div>

      {/* ── Alertes ── */}
      {(alert || error) && (
        <Alert
          type={alert?.type || 'error'}
          message={alert?.message || error}
          onClose={() => { setAlert(null); clearError(); }}
        />
      )}

      {/* ══════ CARTE PRINCIPALE ══════ */}
      <div className="bg-white rounded-lg border p-4 sm:p-6">

        {/* Badges statut */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {isSuspended ? (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 flex items-center gap-1">
              <Ban className="h-4 w-4" /> Suspendu
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Actif
            </span>
          )}
          {seller.deliveryAvailable && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
              <Truck className="h-4 w-4" /> Livraison disponible
            </span>
          )}
        </div>

        {/* Info propriétaire + Localisation : 1 col mobile, 2 col md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Propriétaire */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Informations du propriétaire</h3>
            <div className="text-sm space-y-2">
              <p className="text-gray-600"><strong>Nom complet :</strong> {seller.firstName} {seller.lastName}</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="break-all">{seller.phone}</span>
              </div>
              {seller.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="break-all">{seller.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Localisation */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Localisation</h3>
            <div className="text-sm space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                {/* ✅ Affiche quartier + ville, ou juste la ville si pas de quartier */}
                <span>
                  {seller.quarter ? `${seller.quarter}, ` : ''}{seller.city || 'Non précisée'}
                </span>
              </div>
              {seller.latitude && seller.longitude && (
                <p className="text-gray-600"><strong>GPS :</strong> {seller.latitude}, {seller.longitude}</p>
              )}
              {seller.deliveryAvailable && (
                <p className="text-gray-600"><strong>Frais livraison :</strong> {formatPrice(seller.deliveryFee)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Date inscription */}
        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 flex-shrink-0" />
          <span>Inscrit le {formatDateTime(seller.createdAt)}</span>
        </div>

        {/* ── Stats principales : 2 cols mobile, 4 cols desktop ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-5 mt-5 border-t">
          {[
            {
              Icon: Package,
              bg: 'bg-blue-100', color: 'text-blue-600',
              value: stats.products.total,
              label: 'Produits',
              sub: `${stats.products.available} disponibles • ${stats.products.limited} limités`
            },
            {
              Icon: ShoppingCart,
              bg: 'bg-green-100', color: 'text-green-600',
              value: stats.orders.total,
              label: 'Commandes',
              sub: `${stats.orders.completed} complétées • ${stats.orders.pending} en attente`
            },
            {
              Icon: TrendingUp,
              bg: 'bg-purple-100', color: 'text-purple-600',
              value: formatPrice(stats.revenue.total),
              label: "Chiffre d'affaires",
              sub: `${formatPrice(stats.revenue.thisMonth)} ce mois`
            },
            {
              Icon: Star,
              bg: 'bg-yellow-100', color: 'text-yellow-600',
              value: formatRating(stats.reviews.average),
              label: `${stats.reviews.total} avis`,
              sub: `${stats.reviews.withResponse} réponses`
            },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className={`flex items-center justify-center w-11 h-11 ${s.bg} rounded-lg mx-auto mb-2`}>
                <s.Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs sm:text-sm text-gray-600">{s.label}</p>
              <p className="text-xs text-gray-500 mt-1 leading-tight">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══════ TABS ══════ */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Tab bar : scroll horizontal sur petit écran */}
        <div className="border-b overflow-x-auto">
          <div className="flex min-w-max sm:min-w-0">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contenu tabs ── */}
        <div className="p-4 sm:p-6">

          {/* ════ TAB : Vue d'ensemble ════ */}
          {activeTab === 'overview' && (
            <div className="space-y-5 sm:space-y-6">

              {/* Performance : 1 col mobile, 3 col sm+ */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary-600" /> Statistiques de performance
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    {
                      bg: 'from-green-50 to-green-100',   border: 'border-green-200',
                      labelColor: 'text-green-700',  valueColor: 'text-green-600',  subColor: 'text-green-600',
                      label: 'Taux de complétion',
                      // ✅ formatRate protège contre undefined / null / NaN
                      value: formatRate(stats.performance.orderCompletionRate),
                      sub: `${stats.orders.completed} / ${stats.orders.total} commandes`
                    },
                    {
                      bg: 'from-blue-50 to-blue-100',     border: 'border-blue-200',
                      labelColor: 'text-blue-700',   valueColor: 'text-blue-600',   subColor: 'text-blue-600',
                      label: "Taux d'acceptation",
                      // ✅ formatRate protège contre undefined / null / NaN
                      value: formatRate(stats.performance.orderAcceptanceRate),
                      sub: 'Commandes acceptées vs rejetées'
                    },
                    {
                      bg: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200',
                      labelColor: 'text-yellow-700', valueColor: 'text-yellow-600', subColor: 'text-yellow-600',
                      label: 'Note moyenne',
                      // ✅ formatRating protège contre undefined / null / 0
                      value: formatRating(stats.performance.averageRating),
                      sub: `Basée sur ${stats.reviews.total} avis`
                    },
                  ].map((card, i) => (
                    <div key={i} className={`p-4 bg-gradient-to-br ${card.bg} rounded-lg border ${card.border}`}>
                      <p className={`text-sm ${card.labelColor} mb-1 font-medium`}>{card.label}</p>
                      <p className={`text-2xl sm:text-3xl font-bold ${card.valueColor}`}>{card.value}</p>
                      <p className={`text-xs ${card.subColor} mt-1`}>{card.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenus détaillés : 1 col mobile, 3 col sm+ */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-600" /> Chiffre d'affaires détaillé
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {[
                    { label: 'Total',        value: formatPrice(stats.revenue.total) },
                    { label: 'Ce mois',      value: formatPrice(stats.revenue.thisMonth) },
                    { label: 'Panier moyen', value: formatPrice(stats.revenue.average) },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventaire : 2 cols mobile, 4 cols md+ */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" /> Inventaire détaillé
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { bg: 'bg-blue-50',   border: 'border-blue-200',   labelColor: 'text-blue-700',   valueColor: 'text-blue-600',   label: 'Total produits', value: stats.products.total },
                    { bg: 'bg-green-50',  border: 'border-green-200',  labelColor: 'text-green-700',  valueColor: 'text-green-600',  label: 'Disponibles',    value: stats.products.available },
                    { bg: 'bg-yellow-50', border: 'border-yellow-200', labelColor: 'text-yellow-700', valueColor: 'text-yellow-600', label: 'Stock limité',   value: stats.products.limited },
                    { bg: 'bg-red-50',    border: 'border-red-200',    labelColor: 'text-red-700',    valueColor: 'text-red-600',    label: 'Rupture',        value: stats.products.outOfStock },
                  ].map((item, i) => (
                    <div key={i} className={`p-3 sm:p-4 ${item.bg} rounded-lg border ${item.border}`}>
                      <p className={`text-xs sm:text-sm ${item.labelColor} mb-1`}>{item.label}</p>
                      <p className={`text-xl sm:text-2xl font-bold ${item.valueColor}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raison suspension */}
              {isSuspended && seller.suspensionReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1 flex items-center gap-2">
                    <Ban className="h-4 w-4" /> Raison de la suspension
                  </p>
                  <p className="text-sm text-red-700">{seller.suspensionReason}</p>
                </div>
              )}
            </div>
          )}

          {/* ════ TAB : Produits ════ */}
          {activeTab === 'products' && (
            <div>
              {seller.products && seller.products.length > 0 ? (
                <div className="space-y-3">
                  {seller.products.map((product) => (
                    <div key={product.id} className="flex items-start justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-3">
                      {/* Infos produit */}
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{product.brand} – {product.bottleType}</h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" /> Stock : {product.quantity ?? 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" /> {product.viewCount || 0} vues
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="h-3.5 w-3.5" /> {product.orderCount || 0} ventes
                          </span>
                        </div>
                      </div>

                      {/* Prix + badge */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold text-primary-600">{formatPrice(product.price)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          product.status === 'available' ? 'bg-green-100 text-green-800' :
                          product.status === 'limited'   ? 'bg-yellow-100 text-yellow-800' :
                                                           'bg-red-100 text-red-800'
                        }`}>
                          {product.status === 'available' ? 'Disponible' : product.status === 'limited' ? 'Limité' : 'Rupture'}
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

          {/* ════ TAB : Commandes ════ */}
          {activeTab === 'orders' && (
            <div>
              {seller.recentOrders && seller.recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {seller.recentOrders.map((order) => (
                    <div key={order.id} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      {/* Ligne 1 : numéro + montant + statut */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                          <p className="text-sm text-gray-600 truncate">
                            {order.customer?.firstName} {order.customer?.lastName}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800'    :
                            order.status === 'pending'   ? 'bg-yellow-100 text-yellow-800' :
                                                           'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Ligne 2 : détails (wrap sur mobile) */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          {order.deliveryMode === 'delivery' ? <Truck className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                          {order.deliveryMode === 'delivery' ? 'Livraison' : 'Retrait'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" /> {order.itemsCount ?? 0} article(s)
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {formatDateTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {stats.orders.total > 10 && (
                    <p className="text-center text-sm text-gray-500 pt-2">
                      Affichage des 10 dernières commandes sur {stats.orders.total} au total
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune commande</p>
                </div>
              )}
            </div>
          )}

          {/* ════ TAB : Avis ════ */}
          {activeTab === 'reviews' && (
            <div>
              {seller.recentReviews && seller.recentReviews.length > 0 ? (
                <div className="space-y-4">

                  {/* Distribution des notes */}
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold text-gray-900 mb-3">Distribution des notes</h4>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map(rating => {
                        const count      = stats.reviews.distribution?.[rating] || 0;
                        const percentage = stats.reviews.total > 0 ? (count / stats.reviews.total * 100).toFixed(0) : 0;
                        return (
                          <div key={rating} className="flex items-center gap-2 sm:gap-3">
                            <span className="text-sm font-medium text-gray-700 w-7 text-right">{rating}★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Liste des avis */}
                  {seller.recentReviews.map((review) => (
                    <div key={review.id} className="p-3 sm:p-4 border rounded-lg">
                      {/* Auteur + date */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {review.customer?.firstName} {review.customer?.lastName}
                          </p>
                          {/* Étoiles */}
                          <div className="flex items-center gap-0.5 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0 whitespace-nowrap">
                          {formatDateTime(review.createdAt)}
                        </span>
                      </div>

                      {/* Commentaire */}
                      {review.comment && (
                        <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded break-words">
                          "{review.comment}"
                        </p>
                      )}

                      {/* Réponse donnée */}
                      {review.hasResponse && (
                        <div className="mt-2 pl-3 border-l-2 border-primary-200">
                          <p className="text-xs text-primary-600 font-medium">✓ Réponse donnée</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {stats.reviews.total > 5 && (
                    <p className="text-center text-sm text-gray-500 pt-2">
                      Affichage des 5 avis les plus récents sur {stats.reviews.total} au total
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucun avis</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSellerDetail;