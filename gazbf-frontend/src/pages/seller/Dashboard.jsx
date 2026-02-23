// ==========================================
// FICHIER: src/pages/seller/Dashboard.jsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Star, 
  Package,
  Loader2,
  AlertTriangle,
  XCircle,
  TrendingDown,
  EyeOff,
  Clock,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import Alert from '../../components/common/Alert';
import useSellerStore from '../../store/sellerStore';
import useSellerAccess from '../../hooks/useSellerAccess';
import SubscriptionRequired from '../../components/seller/SubscriptionRequired';
import SellerAccessBanner from '../../components/seller/SellerAccessBanner';

// ==========================================
// COMPOSANT : Alerte Rupture de Stock
// ==========================================
const OutOfStockAlert = ({ outOfStockProducts, onNavigate }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!outOfStockProducts || outOfStockProducts.length === 0) return null;

  const consequences = [
    {
      icon: <EyeOff className="h-4 w-4" />,
      label: 'Produits masqués',
      description: 'Vos produits en rupture ne sont plus visibles pour les clients sur la carte.'
    },
    {
      icon: <TrendingDown className="h-4 w-4" />,
      label: 'Ventes perdues',
      description: 'Chaque jour sans stock = des commandes perdues au profit de vos concurrents.'
    },
    {
      icon: <Star className="h-4 w-4" />,
      label: 'Image dégradée',
      description: 'Une rupture prolongée peut nuire à votre note et à la confiance des clients.'
    },
    {
      icon: <Clock className="h-4 w-4" />,
      label: 'Délai critique',
      description: 'Plus vous tardez, plus vous perdez de clients fidèles vers la concurrence.'
    },
  ];

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl border-2 border-red-400">
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
              <XCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                🚨 Rupture de stock détectée !
              </h3>
              <p className="text-xs sm:text-sm text-red-200">
                {outOfStockProducts.length} produit{outOfStockProducts.length > 1 ? 's sont' : ' est'} en rupture — Action requise
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/70 hover:text-white transition-colors text-xs underline flex-shrink-0 ml-2"
          >
            {isExpanded ? 'Réduire' : 'Voir'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-white">
          {/* Produits en rupture */}
          <div className="px-4 sm:px-6 pt-4 pb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Produits concernés
            </p>
            <div className="space-y-2">
              {outOfStockProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.id || index}
                  className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 animate-pulse" />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {product.brand} — {product.bottleType}
                      </p>
                      <p className="text-xs text-red-600 font-medium">Stock : 0 unité</p>
                    </div>
                  </div>
                  <span className="ml-3 flex-shrink-0 text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-full">
                    RUPTURE
                  </span>
                </div>
              ))}
              {outOfStockProducts.length > 5 && (
                <p className="text-sm text-red-600 font-semibold text-center pt-1">
                  + {outOfStockProducts.length - 5} autre{outOfStockProducts.length - 5 > 1 ? 's' : ''} produit{outOfStockProducts.length - 5 > 1 ? 's' : ''} en rupture
                </p>
              )}
            </div>
          </div>

          <div className="mx-4 sm:mx-6 border-t border-gray-100 my-1" />

          {/* Conséquences */}
          <div className="px-4 sm:px-6 py-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              ⚠️ Conséquences si vous ne réapprovisionnez pas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {consequences.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-3"
                >
                  <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 text-red-600 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-800">{item.label}</p>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Encart incitatif */}
          <div className="mx-4 sm:mx-6 mb-4 bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-4 text-white">
            <div className="flex items-start gap-3">
              <RefreshCw className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm mb-1">Dès que vous êtes réapprovisionné :</p>
                <p className="text-xs text-red-100 leading-relaxed">
                  Rendez-vous dans <strong className="text-white">Gestion du Stock</strong>, trouvez
                  le produit concerné et mettez à jour la quantité. Vos produits redeviennent
                  immédiatement visibles par vos clients !
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-4 sm:px-6 pb-5">
            <button
              onClick={() => onNavigate('/seller/products')}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
            >
              <Package className="h-5 w-5" />
              Mettre à jour mon stock maintenant
              <ChevronRight className="h-5 w-5" />
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              ⏱️ Ça prend moins d'une minute
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// COMPOSANT : Alerte Stock Faible
// ==========================================
const LowStockAlert = ({ lowStockProducts, onNavigate }) => {
  if (!lowStockProducts || lowStockProducts.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-4 sm:p-6 shadow-lg">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
          <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-orange-900 mb-2">
            ⚠️ Attention : Stock faible détecté !
          </h3>
          <p className="text-sm sm:text-base text-orange-800 mb-3">
            {lowStockProducts.length} produit{lowStockProducts.length > 1 ? 's ont' : ' a'} un stock
            critique et nécessite{lowStockProducts.length > 1 ? 'nt' : ''} un réapprovisionnement urgent.
          </p>
          <div className="space-y-2">
            {lowStockProducts.slice(0, 3).map((product, index) => (
              <div
                key={product.id || index}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {product.brand} - {product.bottleType}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Stock restant :{' '}
                    <span className="font-bold text-orange-600">
                      {product.quantity} unité{product.quantity > 1 ? 's' : ''}
                    </span>
                  </p>
                </div>
              </div>
            ))}
            {lowStockProducts.length > 3 && (
              <p className="text-sm text-orange-700 font-medium">
                + {lowStockProducts.length - 3} autre{lowStockProducts.length - 3 > 1 ? 's' : ''} produit{lowStockProducts.length - 3 > 1 ? 's' : ''}...
              </p>
            )}
          </div>
          <button
            onClick={() => onNavigate('/seller/products')}
            className="mt-4 w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
          >
            Gérer le stock maintenant
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PAGE PRINCIPALE : Dashboard
// ==========================================
const Dashboard = () => {
  const navigate = useNavigate();

  // ✅ On destructure products ET fetchMyProducts depuis le store
  const { 
    stats,
    products,
    orders, 
    fetchStats,
    fetchMyProducts,
    fetchReceivedOrders,
    error,
    clearError 
  } = useSellerStore();

  const { loading: accessLoading, accessStatus, pricingConfig, hasAccess, needsSubscription } = useSellerAccess();

  // ✅ États de chargement SÉPARÉS pour ne pas bloquer l'affichage
  const [loadingStats, setLoadingStats]       = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders]     = useState(false);

  const [alert, setAlert]                       = useState(null);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts]     = useState([]);
  const [customersCount, setCustomersCount]         = useState(0);

  // Chargement initial
  useEffect(() => {
    if (hasAccess && !accessLoading) {
      loadStats();
      loadProducts();
      loadOrders();
    }
  }, [hasAccess, accessLoading]);

  // Erreurs du store
  useEffect(() => {
    if (error) {
      setAlert({ type: 'error', message: error });
      clearError();
    }
  }, [error]);

  // ✅ CORRECTION CLÉ : dériver les ruptures depuis `products` du store
  //    (même liste que Products.jsx — fiable et toujours à jour)
  useEffect(() => {
    if (!products || products.length === 0) {
      setOutOfStockProducts([]);
      setLowStockProducts([]);
      return;
    }
    setOutOfStockProducts(
      products.filter(p => p.status === 'out_of_stock' || p.quantity === 0)
    );
    setLowStockProducts(
      products.filter(p => p.status === 'limited' && p.quantity > 0)
    );
  }, [products]);

  // Clients uniques depuis les commandes
  useEffect(() => {
    if (!orders || orders.length === 0) return;
    const ids = new Set(orders.map(o => o.customer?.id).filter(Boolean));
    setCustomersCount(ids.size);
  }, [orders]);

  // ✅ Fonctions avec états locaux séparés pour ne pas masquer le contenu
  const loadStats = async () => {
    setLoadingStats(true);
    try { await fetchStats(); } catch (err) { console.error(err); }
    finally { setLoadingStats(false); }
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try { await fetchMyProducts(); } catch (err) { console.error(err); }
    finally { setLoadingProducts(false); }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try { await fetchReceivedOrders(); } catch (err) { console.error(err); }
    finally { setLoadingOrders(false); }
  };

  // Vérification accès
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
    return <SubscriptionRequired accessStatus={accessStatus} pricingConfig={pricingConfig} />;
  }

  // Loader initial uniquement si stats pas encore chargées
  const showMainLoader = loadingStats && !stats;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="space-y-4 sm:space-y-6">

        <SellerAccessBanner accessStatus={accessStatus} pricingConfig={pricingConfig} />

        {/* ── ALERTES STOCK ─────────────────────────── */}
        <OutOfStockAlert outOfStockProducts={outOfStockProducts} onNavigate={navigate} />
        <LowStockAlert   lowStockProducts={lowStockProducts}   onNavigate={navigate} />

        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Tableau de bord
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Bienvenue sur votre espace revendeur
          </p>
        </div>

        {showMainLoader ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
          </div>
        ) : (
          <>
            {/* ── STATISTIQUES ──────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

              {/* Commandes */}
              <div
                onClick={() => navigate('/seller/orders')}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 p-3 sm:p-4 shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-105"
              >
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                  <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {stats?.orders?.total || 0}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-700 font-semibold">📦 Commandes totales</p>
                {stats?.orders?.pending > 0 && (
                  <p className="text-xs text-orange-600 font-bold mt-1">
                    ⏳ {stats.orders.pending} en attente
                  </p>
                )}
              </div>

              {/* Produits */}
              <div
                onClick={() => navigate('/seller/products')}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 p-3 sm:p-4 shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-105"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
                  <span className="text-2xl sm:text-3xl font-bold text-green-600">
                    {products?.length || stats?.products?.total || 0}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-green-700 font-semibold">📦 Produits</p>
                {outOfStockProducts.length > 0 && (
                  <p className="text-xs text-red-600 font-bold mt-1">
                    🚨 {outOfStockProducts.length} en rupture
                  </p>
                )}
                {lowStockProducts.length > 0 && (
                  <p className="text-xs text-orange-600 font-bold mt-0.5">
                    ⚠️ {lowStockProducts.length} stock faible
                  </p>
                )}
              </div>

              {/* Clients */}
              <div
                onClick={() => navigate('/seller/customers')}
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-300 p-3 sm:p-4 shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-105"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0" />
                  <span className="text-2xl sm:text-3xl font-bold text-purple-600">
                    {customersCount}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-purple-700 font-semibold">👥 Clients</p>
              </div>

              {/* Note moyenne */}
              <div
                onClick={() => navigate('/seller/reviews')}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300 p-3 sm:p-4 shadow-sm cursor-pointer hover:shadow-md transition-all hover:scale-105"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0" />
                  <span className="text-2xl sm:text-3xl font-bold text-yellow-600">
                    {stats?.reviews?.average?.toFixed(1) || '0.0'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-yellow-700 font-semibold">⭐ Note moyenne</p>
                {stats?.reviews?.total > 0 && (
                  <p className="text-xs text-yellow-600 font-bold mt-1">
                    {stats.reviews.total} avis
                  </p>
                )}
              </div>
            </div>

            {/* ── CHIFFRE D'AFFAIRES ─────────────────────── */}
            <div className="bg-gradient-to-br from-secondary-50 to-accent-50 rounded-xl border-2 border-secondary-300 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-secondary-700 font-semibold mb-1">
                    💰 Chiffre d'affaires
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-secondary-600 truncate">
                    {stats?.revenue?.total?.toLocaleString() || '0'} FCFA
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-secondary-600 flex-shrink-0 ml-2" />
              </div>
              {stats?.revenue?.thisMonth !== undefined && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-secondary-200">
                  <p className="text-xs sm:text-sm text-secondary-700 font-medium">
                    Ce mois :{' '}
                    <span className="font-bold text-secondary-900">
                      {stats.revenue.thisMonth.toLocaleString()} FCFA
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* ── ACTIONS RAPIDES ───────────────────────── */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                ⚡ Actions rapides
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'Gérer produits', sub: 'Stock et catalogue', icon: Package, path: '/seller/products' },
                  { label: 'Voir commandes', sub: 'Gérer les commandes', icon: ShoppingBag, path: '/seller/orders' },
                  { label: 'Mes clients',    sub: 'Base de données',    icon: Users,      path: '/seller/customers' },
                  { label: 'Avis clients',   sub: 'Évaluations',        icon: Star,       path: '/seller/reviews' },
                ].map(({ label, sub, icon: Icon, path }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="p-3 sm:p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-secondary-600 hover:bg-secondary-50 transition-all text-left group shadow-sm hover:shadow-md"
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-secondary-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm sm:text-base font-bold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500 mt-1">{sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;