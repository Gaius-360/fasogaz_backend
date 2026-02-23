// ==========================================
// FICHIER: src/pages/seller/Products.jsx (AVEC CONTRÔLE D'ACCÈS)
// ==========================================
import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, MapPin, Navigation, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import ProductCard from '../../components/seller/ProductCard';
import ProductFormModal from '../../components/seller/ProductFormModal';
import useSellerStore from '../../store/sellerStore';
import useAuthStore from '../../store/authStore';
import useSellerAccess from '../../hooks/useSellerAccess';
import SubscriptionRequired from '../../components/seller/SubscriptionRequired';
import SellerAccessBanner from '../../components/seller/SellerAccessBanner';
import { api } from '../../api/apiSwitch';
import { getCurrentPosition } from '../../utils/helpers';

const Products = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { 
    products, 
    loading: productsLoading, 
    error, 
    fetchMyProducts, 
    deleteProduct,
    clearError 
  } = useSellerStore();
  
  const { loading: accessLoading, accessStatus, pricingConfig, hasAccess, needsSubscription } = useSellerAccess();

  const [stats, setStats] = useState(null);
  const [alert, setAlert] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Modale de confirmation GPS
  const [showGPSConfirm, setShowGPSConfirm] = useState(false);

  // Vérification des coordonnées GPS
  const hasGPSCoordinates = user?.latitude && user?.longitude;

  useEffect(() => {
    if (hasGPSCoordinates && hasAccess && !accessLoading) {
      loadProducts();
    }
  }, [hasGPSCoordinates, hasAccess, accessLoading]);

  useEffect(() => {
    if (error) {
      setAlert({ type: 'error', message: error });
      clearError();
    }
  }, [error]);

  useEffect(() => {
    if (products.length > 0) {
      calculateStats();
    }
  }, [products]);

  const loadProducts = async () => {
    try {
      await fetchMyProducts();
    } catch (err) {
      if (err.response?.status === 403) {
        setAlert({
          type: 'error',
          message: 'Votre abonnement a expiré. Renouvelez pour accéder à vos produits.'
        });
      } else {
        setAlert({ type: 'error', message: 'Erreur lors du chargement des produits' });
      }
    }
  };

  const calculateStats = () => {
    const total = products.length;
    const available = products.filter(p => p.status === 'available').length;
    const limited = products.filter(p => p.status === 'limited').length;
    const outOfStock = products.filter(p => p.status === 'out_of_stock').length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    setStats({ total, available, limited, outOfStock, totalValue });
  };

  // ==========================================
  // GPS — Ouvrir la modale si coordonnées existantes,
  //        sinon obtenir directement (première fois)
  // ==========================================
  const handleRequestLocation = () => {
    if (user?.latitude && user?.longitude) {
      setShowGPSConfirm(true);
    } else {
      handleGetCurrentLocation();
    }
  };

  // ==========================================
  // GPS — Exécuter après confirmation
  // ✅ FIX: quarter et city sont maintenant persistés
  // ==========================================
  const handleGetCurrentLocation = async () => {
    setShowGPSConfirm(false);
    setGettingLocation(true);
    setAlert(null);

    try {
      const position = await getCurrentPosition();

      // ✅ Inclure quarter et city dans la mise à jour du profil
      const updatePayload = {
        latitude: position.latitude,
        longitude: position.longitude,
      };

      if (position.quarter) {
        updatePayload.quarter = position.quarter;
      }
      if (position.city) {
        updatePayload.city = position.city;
      }

      const response = await api.auth.updateProfile(updatePayload);

      if (response.success) {
        updateUser(response.data.user);

        const locationInfo = position.quarter
          ? `Quartier : ${position.quarter}, ${position.city || 'Ouagadougou'}`
          : `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;

        setAlert({
          type: 'success',
          message: `Position GPS enregistrée — ${locationInfo}`
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Impossible d\'obtenir votre position GPS'
      });
    } finally {
      setGettingLocation(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Supprimer ${product.brand} ${product.bottleType} ?`)) return;
    try {
      await deleteProduct(product.id);
      setAlert({ type: 'success', message: 'Produit supprimé avec succès' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Erreur lors de la suppression' });
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    loadProducts();
    handleCloseForm();
    setAlert({
      type: 'success',
      message: editingProduct ? 'Produit mis à jour' : 'Produit ajouté avec succès'
    });
  };

  // Loader vérification accès
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

  // Blocage abonnement
  if (needsSubscription) {
    return <SubscriptionRequired accessStatus={accessStatus} pricingConfig={pricingConfig} />;
  }

  // ==========================================
  // ÉCRAN BLOCAGE GPS
  // ==========================================
  if (!hasGPSCoordinates) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* Modale de confirmation GPS */}
        {showGPSConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Modifier la position GPS ?</h3>
                  <p className="text-sm text-gray-500">Cette action mettra à jour votre localisation</p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  ⚠️ Vous êtes sur le point de <strong>remplacer les coordonnées GPS</strong> de votre dépôt.
                  Cela modifiera votre position sur la carte visible par les clients.
                </p>
                <p className="text-sm text-yellow-800 mt-2">
                  Assurez-vous d'être <strong>physiquement présent à votre point de vente</strong> avant de continuer.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" fullWidth onClick={() => setShowGPSConfirm(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleGetCurrentLocation}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Confirmer et mettre à jour
                </Button>
              </div>
            </div>
          </div>
        )}

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            className="mb-4"
          />
        )}

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 border-2 border-yellow-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <MapPin className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-600" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Coordonnées GPS requises
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Pour accéder à votre stock, vous devez d'abord définir les coordonnées GPS de votre dépôt
              </p>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 sm:p-6 mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 flex-shrink-0" />
                <span>Pourquoi les coordonnées GPS sont-elles importantes ?</span>
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 text-base sm:text-lg flex-shrink-0">📍</span>
                  <span>Les clients pourront vous localiser facilement sur la carte</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 text-base sm:text-lg flex-shrink-0">🚀</span>
                  <span>Améliore votre visibilité dans les recherches de proximité</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 text-base sm:text-lg flex-shrink-0">✅</span>
                  <span>Permet aux clients de calculer la distance jusqu'à votre dépôt</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 text-base sm:text-lg flex-shrink-0">🎯</span>
                  <span>Indispensable pour proposer la livraison à domicile</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={handleRequestLocation}
                loading={gettingLocation}
                disabled={gettingLocation}
                className="bg-yellow-600 hover:bg-yellow-700 text-sm sm:text-base"
              >
                {gettingLocation ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Détection en cours...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Obtenir ma position GPS
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center px-2">
                💡 Activez la géolocalisation dans votre navigateur
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chargement initial produits
  if (productsLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
      </div>
    );
  }

  // Interface normale
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="space-y-4 sm:space-y-6">
        <SellerAccessBanner accessStatus={accessStatus} pricingConfig={pricingConfig} />

        {alert && (
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
              Gestion du Stock
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {products.length} produit(s) dans votre catalogue
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto whitespace-nowrap text-sm sm:text-base"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Ajouter un produit
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg border-2 border-secondary-300 p-3 sm:p-4 shadow-sm">
              <p className="text-xs sm:text-sm text-secondary-700 font-semibold mb-1">📦 Total produits</p>
              <p className="text-2xl sm:text-3xl font-bold text-secondary-600">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 p-3 sm:p-4 shadow-sm">
              <p className="text-xs sm:text-sm text-green-700 font-semibold mb-1">✅ Disponibles</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.available}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300 p-3 sm:p-4 shadow-sm">
              <p className="text-xs sm:text-sm text-yellow-700 font-semibold mb-1">⚠️ Stock limité</p>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.limited}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-300 p-3 sm:p-4 shadow-sm">
              <p className="text-xs sm:text-sm text-red-700 font-semibold mb-1">❌ Rupture</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.outOfStock}</p>
            </div>
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Aucun produit</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Commencez par ajouter des produits à votre catalogue
            </p>
            <Button variant="primary" onClick={() => setShowForm(true)} className="w-full sm:w-auto text-sm sm:text-base">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Ajouter mon premier produit
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {showForm && (
          <ProductFormModal
            product={editingProduct}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default Products;