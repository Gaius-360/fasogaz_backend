
// ==========================================
// FICHIER 1: src/pages/client/MapPage.jsx (OPTIMISÉ)
// Tri par distance + affichage compact
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import SearchFilters from '../../components/client/SearchFilters';
import SellerCard from '../../components/client/SellerCard';
import SellerDetailsModal from '../../components/client/SellerDetailsModal';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import { api } from '../../api/apiSwitch';
import useAuthStore from '../../store/authStore';
import { getCurrentPosition, openNavigationToLocation } from '../../utils/helpers';

const MapPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [alert, setAlert] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [filters, setFilters] = useState({
    bottleType: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    radius: '10'
  });

  useEffect(() => {
    checkSubscription();
  }, []);

  useEffect(() => {
    if (subscription?.subscription?.isActive) {
      loadUserLocationAndProducts();
    } else if (subscription && !subscription.subscription) {
      setLoading(false);
    } else if (subscription?.subscription && !subscription.subscription.isActive) {
      setLoading(false);
    }
  }, [subscription]);

  const checkSubscription = async () => {
    setLoadingSubscription(true);
    try {
      const response = await api.subscriptions.getMySubscription();

      if (response && response.data) {
        setSubscription(response.data);

        if (!response.data.subscription || !response.data.subscription.isActive) {
          setAlert({
            type: 'warning',
            title: 'Abonnement requis',
            message: 'Vous devez avoir un abonnement actif pour accéder à la carte.'
          });
        } else if (response.data.status?.willExpireSoon) {
          setAlert({
            type: 'warning',
            title: 'Abonnement bientôt expiré',
            message: `Votre abonnement expire dans ${response.data.status.daysRemaining} jour(s).`
          });
        }
      } else {
        setSubscription({ subscription: null });
        setAlert({
          type: 'warning',
          title: 'Abonnement requis',
          message: 'Vous devez avoir un abonnement actif pour accéder à la carte.'
        });
      }
    } catch (error) {
      console.error('❌ Erreur vérification abonnement:', error);
      setSubscription({ subscription: null });
      setAlert({
        type: 'error',
        message: 'Erreur lors de la vérification de votre abonnement'
      });
    } finally {
      setLoadingSubscription(false);
    }
  };

  const loadUserLocationAndProducts = async () => {
    setLoading(true);

    try {
      const position = await getCurrentPosition();
      setUserLocation(position);

      await searchProducts({
        ...filters,
        latitude: position.latitude,
        longitude: position.longitude,
        city: user?.city || ''
      });
    } catch (error) {
      console.warn('⚠️ Géolocalisation échouée:', error);
      await searchProducts({
        ...filters,
        city: user?.city || ''
      });
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (searchFilters) => {
    try {
      const params = {
        city: searchFilters.city
      };

      if (searchFilters.bottleType) params.bottleType = searchFilters.bottleType;
      if (searchFilters.brand) params.brand = searchFilters.brand;
      if (searchFilters.minPrice) params.minPrice = searchFilters.minPrice;
      if (searchFilters.maxPrice) params.maxPrice = searchFilters.maxPrice;
      if (searchFilters.latitude) params.latitude = searchFilters.latitude;
      if (searchFilters.longitude) params.longitude = searchFilters.longitude;
      if (searchFilters.radius) params.radius = searchFilters.radius;

      const response = await api.products.searchProducts(params);

      if (response.success) {
        const productsData = response.data.products || [];
        const sellersMap = new Map();

        productsData.forEach(product => {
          const sellerId = product.seller.id;
          if (!sellersMap.has(sellerId)) {
            sellersMap.set(sellerId, {
              ...product.seller,
              products: [],
              distance: product.distance || null
            });
          }
          sellersMap.get(sellerId).products.push(product);
        });

        let sellersArray = Array.from(sellersMap.values());

        // 🆕 TRI PAR DISTANCE (du plus proche au plus éloigné)
        sellersArray.sort((a, b) => {
          // Si pas de distance, mettre à la fin
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          
          // Tri croissant par distance
          return a.distance - b.distance;
        });

        console.log(`📊 ${sellersArray.length} revendeurs triés par distance`);

        setSellers(sellersArray);
        setFilteredSellers(sellersArray);
      }
    } catch (error) {
      console.error('❌ Erreur recherche produits:', error);
      setAlert({
        type: 'error',
        message: 'Erreur lors de la recherche des produits'
      });
    }
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    if (userLocation) {
      searchProducts({
        ...newFilters,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        city: user?.city || ''
      });
    } else {
      searchProducts({
        ...newFilters,
        city: user?.city || ''
      });
    }
  };

  const handleViewDetails = (seller) => {
    setSelectedSeller(seller);
  };

  const handleCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleNavigate = (seller) => {
    if (seller.latitude && seller.longitude) {
      openNavigationToLocation(
        seller.latitude,
        seller.longitude,
        seller.businessName,
        userLocation
      );
    } else {
      setAlert({
        type: 'error',
        message: 'Coordonnées GPS du revendeur non disponibles'
      });
    }
  };

  const handleOrder = (seller, products) => {
    navigate('/client/order/new', {
      state: { seller, products }
    });
  };

  if (loadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Vérification de votre abonnement...</p>
        </div>
      </div>
    );
  }

  if (!subscription?.subscription?.isActive) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert
          type="warning"
          title="Abonnement requis"
          message="Pour accéder à la carte et trouver des revendeurs près de chez vous, vous devez avoir un abonnement actif."
          className="mb-6"
        />

        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Accès à la carte
          </h2>
          <p className="text-gray-600 mb-6">
            Abonnez-vous pour découvrir tous les revendeurs de gaz dans votre ville
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/client/subscription')}
          >
            Voir les abonnements
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des revendeurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Trouver du gaz près de chez vous
        </h1>
        <p className="text-sm text-gray-600">
          {filteredSellers.length} revendeur{filteredSellers.length > 1 ? 's' : ''} • 
          Triés du plus proche au plus éloigné
        </p>
      </div>

      <SearchFilters
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
      />

      {filteredSellers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun revendeur trouvé
          </h3>
          <p className="text-gray-600">
            Essayez d'élargir vos critères de recherche
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredSellers.map((seller) => (
            <SellerCard
              key={seller.id}
              seller={seller}
              distance={seller.distance}
              onViewDetails={handleViewDetails}
              onCall={handleCall}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}

      {selectedSeller && (
        <SellerDetailsModal
          seller={selectedSeller}
          onClose={() => setSelectedSeller(null)}
          onOrder={handleOrder}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
};

export default MapPage;