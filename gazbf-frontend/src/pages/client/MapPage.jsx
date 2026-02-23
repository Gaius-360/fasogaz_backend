// ==========================================
// FICHIER: src/pages/client/MapPage.jsx - VERSION FINALE CORRIGÉE
// ✅ Fix: Ne pas écraser les données d'accès
// ==========================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, AlertCircle, Navigation, Plus, Clock, Lock, Radio, CreditCard } from 'lucide-react';
import SearchFilters from '../../components/client/SearchFilters';
import SellerCard from '../../components/client/SellerCard';
import SellerDetailsModal from '../../components/client/SellerDetailsModal';
import AddAddressModal from '../../components/client/AddAddressModal';
import TrackingNotification from '../../components/common/TrackingNotification';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import { api } from '../../api/apiSwitch';
import useAuthStore from '../../store/authStore';
import { useGeolocationContext } from '../../contexts/GeolocationContext';
import { getCurrentPosition, openNavigationToLocation } from '../../utils/helpers';

const MapPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const {
    position: livePosition,
    isTracking,
    enableTracking,
    disableTracking,
    autoStopReason,
    setOnAutoStop
  } = useGeolocationContext();

  // États de chargement
  const [loading, setLoading] = useState(true);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  
  // États de données
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [addresses, setAddresses] = useState([]);
  
  // États UI
  const [alert, setAlert] = useState(null);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  
  // Modal d'achat d'accès
  const [showAccessModal, setShowAccessModal] = useState(false);
  
  // États du tracking
  const [trackingMode, setTrackingMode] = useState(false);
  const [lastSearchPosition, setLastSearchPosition] = useState(null);
  const [showAutoStopNotification, setShowAutoStopNotification] = useState(false);
  
  // État d'accès
  const [accessStatus, setAccessStatus] = useState({
    hasAccess: false,
    accessType: 'none',
    expiresAt: null,
    remainingHours: 0,
    remainingMinutes: 0,
    price: null,
    duration: null
  });

  // Filtres
  const [filters, setFilters] = useState({
    bottleType: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    radius: '10'
  });

  const MAX_DISTANCE_KM = 10;
  const MIN_MOVEMENT_FOR_REFRESH = 100;
  const isSearchingRef = useRef(false);

  // Effet : Configurer le callback d'arrêt automatique
  useEffect(() => {
    setOnAutoStop((reason) => {
      console.log('🔔 Notification d\'arrêt automatique:', reason);
      setTrackingMode(false);
      setShowAutoStopNotification(true);
      
      if (addresses.length > 0) {
        const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
        if (defaultAddress.latitude && defaultAddress.longitude) {
          const location = {
            latitude: parseFloat(defaultAddress.latitude),
            longitude: parseFloat(defaultAddress.longitude)
          };
          setUserLocation(location);
          searchProducts({
            ...filters,
            latitude: location.latitude,
            longitude: location.longitude,
            city: user?.city || '',
            radius: MAX_DISTANCE_KM
          }, true);
        }
      }
    });
  }, [setOnAutoStop, addresses, filters, user?.city]);

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const filterSellersByDistance = (sellersArray) => {
    return sellersArray.filter(seller => {
      if (seller.distance === null || seller.distance === undefined) {
        return false;
      }
      return seller.distance <= MAX_DISTANCE_KM;
    });
  };

  const checkAccessStatus = useCallback(async () => {
    try {
      console.log('🔐 Vérification de l\'accès...');
      const response = await api.access.checkStatus();

      if (response?.success) {
        const status = response.data;
        setAccessStatus({
          hasAccess: status.hasAccess,
          accessType: status.accessType,
          expiresAt: status.expiresAt,
          remainingHours: status.remainingHours || 0,
          remainingMinutes: status.remainingMinutes || 0,
          price: status.price,
          duration: status.duration
        });

        console.log('✅ Statut d\'accès:', status);
      }
    } catch (error) {
      console.error('❌ Erreur vérification accès:', error);
      setAccessStatus({
        hasAccess: false,
        accessType: 'error',
        expiresAt: null,
        remainingHours: 0,
        remainingMinutes: 0
      });
    } finally {
      setLoadingAccess(false);
    }
  }, []);

  /**
   * ✅ CORRECTION : Ne pas écraser les données d'accès
   */
  const searchProducts = useCallback(async (searchFilters, forceRefresh = false) => {
    if (isSearchingRef.current && !forceRefresh) {
      console.log('⏳ Recherche déjà en cours, ignoré');
      return;
    }

    try {
      isSearchingRef.current = true;
      console.log('🔍 Recherche avec filtres:', searchFilters);

      const params = {};

      if (user?.id) {
        params.userId = user.id;
      }

      if (searchFilters.city) {
        params.city = searchFilters.city;
      } else if (user?.city) {
        params.city = user.city;
      } else {
        console.error('❌ Pas de ville définie');
        setAlert({
          type: 'error',
          message: 'Impossible de déterminer votre ville.'
        });
        return;
      }

      if (searchFilters.bottleType) params.bottleType = searchFilters.bottleType;
      if (searchFilters.brand) params.brand = searchFilters.brand;
      if (searchFilters.minPrice) params.minPrice = searchFilters.minPrice;
      if (searchFilters.maxPrice) params.maxPrice = searchFilters.maxPrice;
      if (searchFilters.latitude) params.latitude = searchFilters.latitude;
      if (searchFilters.longitude) params.longitude = searchFilters.longitude;
      
      params.radius = Math.min(parseFloat(searchFilters.radius) || 10, MAX_DISTANCE_KM);

      const response = await api.products.searchProducts(params);

      // ✅ TOUJOURS TRAITER LA RÉPONSE (PAS DE BLOCAGE)
      if (response.success) {
        const sellersData = response.data.sellers || [];
        const accessInfo = response.data.accessInfo || {};
        
        console.log(`📍 ${sellersData.length} revendeurs trouvés`);
        console.log('🔐 Accès:', accessInfo);

        // ✅ FIX: Mettre à jour UNIQUEMENT hasAccess sans écraser le reste
        // Les vraies données (expiresAt, remainingHours, etc.) viennent de checkAccessStatus()
        setAccessStatus(prev => ({
          ...prev, // ✅ GARDER toutes les données existantes
          hasAccess: accessInfo.hasAccess || false
          // Ne PAS toucher à expiresAt, remainingHours, etc.
        }));

        // Filtrer par distance si on a accès
        let finalSellers = sellersData;
        if (accessInfo.hasAccess && searchFilters.latitude && searchFilters.longitude) {
          finalSellers = filterSellersByDistance(sellersData);
          console.log(`🎯 ${finalSellers.length} revendeurs dans rayon ${MAX_DISTANCE_KM}km`);
        }

        setSellers(finalSellers);
        setFilteredSellers(finalSellers);

        // Afficher un message si pas d'accès
        if (!accessInfo.hasAccess && accessInfo.isSystemActive) {
          setAlert({
            type: 'info',
            message: '💡 Achetez un accès 24h pour voir les coordonnées et obtenir les itinéraires'
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      setAlert({
        type: 'error',
        message: 'Erreur lors de la recherche des revendeurs'
      });
    } finally {
      isSearchingRef.current = false;
    }
  }, [user?.city, user?.id, filterSellersByDistance]);

  const loadAddresses = useCallback(async () => {
    try {
      console.log('📍 Chargement des adresses...');
      const response = await api.addresses.getMyAddresses();
      
      if (response?.success) {
        const addressList = response.data || [];
        setAddresses(addressList);
        
        if (addressList.length > 0 && !trackingMode) {
          const defaultAddress = addressList.find(a => a.isDefault) || addressList[0];
          if (defaultAddress.latitude && defaultAddress.longitude) {
            setUserLocation({
              latitude: parseFloat(defaultAddress.latitude),
              longitude: parseFloat(defaultAddress.longitude)
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement adresses:', error);
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  }, [trackingMode]);

  const loadProducts = useCallback(async (location) => {
    setLoading(true);
    
    try {
      if (location?.latitude && location?.longitude) {
        await searchProducts({
          ...filters,
          latitude: location.latitude,
          longitude: location.longitude,
          city: user?.city || '',
          radius: MAX_DISTANCE_KM
        });
        setLastSearchPosition(location);
      } else {
        try {
          const position = await getCurrentPosition();
          setUserLocation(position);
          await searchProducts({
            ...filters,
            latitude: position.latitude,
            longitude: position.longitude,
            city: user?.city || '',
            radius: MAX_DISTANCE_KM
          });
          setLastSearchPosition(position);
        } catch (geoError) {
          await searchProducts({
            ...filters,
            city: user?.city || '',
            radius: MAX_DISTANCE_KM
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, searchProducts, user?.city]);

  const handleToggleTracking = useCallback(async () => {
    if (trackingMode) {
      disableTracking();
      setTrackingMode(false);
      
      if (addresses.length > 0) {
        const defaultAddress = addresses.find(a => a.isDefault) || addresses[0];
        if (defaultAddress.latitude && defaultAddress.longitude) {
          const location = {
            latitude: parseFloat(defaultAddress.latitude),
            longitude: parseFloat(defaultAddress.longitude)
          };
          setUserLocation(location);
          searchProducts({
            ...filters,
            latitude: location.latitude,
            longitude: location.longitude,
            city: user?.city || '',
            radius: MAX_DISTANCE_KM
          }, true);
        }
      }
      
      setAlert({
        type: 'info',
        message: '📍 Mode position fixe activé'
      });
    } else {
      try {
        setAlert({
          type: 'info',
          message: '📡 Obtention de votre position GPS actuelle...'
        });

        const currentPos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              });
            },
            (error) => reject(error),
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        });

        console.log('📍 Position GPS actuelle obtenue:', currentPos);

        setUserLocation(currentPos);
        setLastSearchPosition(currentPos);

        await searchProducts({
          ...filters,
          latitude: currentPos.latitude,
          longitude: currentPos.longitude,
          city: user?.city || '',
          radius: MAX_DISTANCE_KM
        }, true);

        enableTracking((newPosition) => {
          console.log('📍 Nouvelle position détectée:', newPosition);
          
          if (lastSearchPosition) {
            const distance = calculateDistance(
              lastSearchPosition.latitude,
              lastSearchPosition.longitude,
              newPosition.latitude,
              newPosition.longitude
            );
            
            if (distance < MIN_MOVEMENT_FOR_REFRESH) {
              console.log(`⏭️ Déplacement trop faible (${distance.toFixed(0)}m)`);
              return;
            }
            
            console.log(`🔄 Déplacement significatif (${distance.toFixed(0)}m)`);
          }
          
          setLastSearchPosition(newPosition);
          setUserLocation(newPosition);
          
          searchProducts({
            ...filters,
            latitude: newPosition.latitude,
            longitude: newPosition.longitude,
            city: user?.city || '',
            radius: MAX_DISTANCE_KM
          }, true);
        });
        
        setTrackingMode(true);
        
        setAlert({
          type: 'success',
          message: '🎯 Suivi GPS activé - Arrêt auto après 30 min d\'inactivité'
        });

      } catch (gpsError) {
        console.error('❌ Erreur GPS:', gpsError);
        
        let errorMessage = '❌ Impossible d\'obtenir votre position GPS';
        if (gpsError.code === 1) {
          errorMessage = '❌ Permission GPS refusée';
        } else if (gpsError.code === 2) {
          errorMessage = '❌ Position GPS non disponible';
        } else if (gpsError.code === 3) {
          errorMessage = '❌ Délai d\'attente GPS dépassé';
        }
        
        setAlert({
          type: 'error',
          message: errorMessage
        });
      }
    }
  }, [trackingMode, enableTracking, disableTracking, filters, user?.city, lastSearchPosition, calculateDistance, searchProducts, addresses]);

  const handleReactivateTracking = useCallback(async () => {
    setShowAutoStopNotification(false);
    await handleToggleTracking();
  }, [handleToggleTracking]);

  const handleApplyFilters = (newFilters) => {
    const limitedFilters = {
      ...newFilters,
      radius: Math.min(parseFloat(newFilters.radius) || 10, MAX_DISTANCE_KM).toString()
    };
    
    setFilters(limitedFilters);
    
    if (userLocation) {
      searchProducts({
        ...limitedFilters,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        city: user?.city || ''
      }, true);
    } else {
      searchProducts({
        ...limitedFilters,
        city: user?.city || ''
      }, true);
    }
  };

  const handleViewDetails = (seller) => {
    setSelectedSeller(seller);
  };

  const handleCall = (phone) => {
    if (!accessStatus.hasAccess) {
      setShowAccessModal(true);
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const handleNavigate = (seller) => {
    if (!accessStatus.hasAccess) {
      setShowAccessModal(true);
      return;
    }
    
    if (seller.latitude && seller.longitude) {
      openNavigationToLocation(
        seller.latitude,
        seller.longitude,
        seller.businessName || `Dépôt ${seller.quarter || seller.city}`,
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
    if (!accessStatus.hasAccess) {
      setShowAccessModal(true);
      return;
    }
    navigate('/client/order/new', {
      state: { seller, products }
    });
  };

  const handleAddressAdded = async () => {
    setShowAddAddressModal(false);
    setLoadingAddresses(true);
    await loadAddresses();
    
    const response = await api.addresses.getMyAddresses();
    if (response?.success && response.data?.length > 0) {
      const newAddress = response.data.find(a => a.isDefault) || response.data[0];
      if (newAddress.latitude && newAddress.longitude) {
        const location = {
          latitude: parseFloat(newAddress.latitude),
          longitude: parseFloat(newAddress.longitude)
        };
        setUserLocation(location);
        await loadProducts(location);
      }
    }
    
    setAlert({
      type: 'success',
      message: '✅ Adresse ajoutée avec succès !'
    });
  };

  const handleAccessRequired = async () => {
    await checkAccessStatus();
    setAlert({
      type: 'success',
      message: '🎉 Accès activé ! Vous pouvez maintenant voir tous les détails.'
    });
    
    // Recharger les données après achat d'accès
    if (userLocation) {
      loadProducts(userLocation);
    }
  };

  const handleBuyAccess = () => {
    setShowAccessModal(false);
    navigate('/client/access/purchase');
  };

  const formatRemainingTime = () => {
    if (!accessStatus.hasAccess) return null;
    const { remainingHours, remainingMinutes } = accessStatus;
    return `${remainingHours}h ${remainingMinutes}min`;
  };

  // EFFETS
  useEffect(() => {
    if (trackingMode && livePosition) {
      setUserLocation(livePosition);
    }
  }, [trackingMode, livePosition]);

  useEffect(() => {
    checkAccessStatus();
  }, [checkAccessStatus]);

  useEffect(() => {
    if (!loadingAccess) {
      loadAddresses();
    }
  }, [loadingAccess, loadAddresses]);

  useEffect(() => {
    if (!loadingAccess && !loadingAddresses) {
      if (addresses.length > 0) {
        loadProducts(userLocation);
      } else {
        setLoading(false);
      }
    }
  }, [loadingAccess, loadingAddresses, addresses.length]);

  // États de chargement
  if (loadingAccess || loadingAddresses) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Pas d'adresse
  if (addresses.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert
          type="warning"
          title="Adresse requise"
          message="Pour utiliser la carte, vous devez enregistrer une adresse avec votre position GPS."
          className="mb-6"
        />

        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Navigation className="h-10 w-10 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            📍 Enregistrez votre adresse
          </h2>
          
          <p className="text-gray-700 mb-2 text-lg">
            Pour accéder à la carte, ajoutez au moins une adresse.
          </p>
          
          <p className="text-gray-600 mb-8">
            Votre position GPS permet de calculer les distances.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowAddAddressModal(true)}
            className="mb-4"
          >
            <Plus className="h-5 w-5 mr-2" />
            Ajouter mon adresse maintenant
          </Button>
        </div>

        {showAddAddressModal && (
          <AddAddressModal
            onClose={() => setShowAddAddressModal(false)}
            onSuccess={handleAddressAdded}
          />
        )}
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

  // RENDU PRINCIPAL
  return (
    <div className="space-y-4">
      {/* Notification d'arrêt automatique */}
      {showAutoStopNotification && autoStopReason && (
        <TrackingNotification
          reason={autoStopReason}
          onClose={() => setShowAutoStopNotification(false)}
          onReactivate={handleReactivateTracking}
        />
      )}

      {/* Modal d'achat d'accès */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-scale-in">
            <button
              onClick={() => setShowAccessModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Accès 24h requis
              </h3>
              
              <p className="text-gray-600">
                Pour appeler, obtenir l'itinéraire ou commander
              </p>
            </div>

            {accessStatus.price && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 mb-6 border-2 border-amber-200">
                <div className="text-center">
                  <p className="text-sm text-amber-700 mb-2">Prix de l'accès</p>
                  <p className="text-3xl font-bold text-amber-900 mb-1">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0
                    }).format(accessStatus.price)}
                  </p>
                  <p className="text-sm text-amber-700">
                    pour {accessStatus.duration}h d'accès complet
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleBuyAccess}
                className="w-full"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Acheter l'accès maintenant
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowAccessModal(false)}
                className="w-full"
              >
                Plus tard
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                💡 Avec l'accès 24h, voyez tout : coordonnées, itinéraires, passez commande
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alertes */}
      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Badge de tracking GPS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 rounded-lg ${isTracking ? 'bg-green-100' : 'bg-blue-100'}`}>
              <Radio className={`h-5 w-5 ${isTracking ? 'text-green-600 animate-pulse' : 'text-blue-400'}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {trackingMode ? '🎯 Suivi GPS actif' : '📡 Me suivre en temps réel'}
              </h3>
              {trackingMode && userLocation && (
                <p className="text-xs text-green-600 mt-1">
                  📡 Position : {userLocation.latitude.toFixed(4)}°, {userLocation.longitude.toFixed(4)}°
                </p>
              )}
            </div>
          </div>
          <Button
            variant={trackingMode ? 'outline' : 'primary'}
            size="sm"
            onClick={handleToggleTracking}
            className="flex-shrink-0"
          >
            {trackingMode ? (
              <>
                <Radio className="h-4 w-4 mr-1" />
                Désactiver
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-1" />
                Me suivre
              </>
            )}
          </Button>
        </div>
        
        {!trackingMode && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Arrêt auto après 30 min d'inactivité
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Banners de statut d'accès */}
      {accessStatus.accessType === 'free' && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-900">Accès gratuit activé</h3>
              <p className="text-sm text-green-700">
                Système de tarification non activé
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ FIX: Vérifier que expiresAt est valide avant d'afficher */}
      {accessStatus.hasAccess && accessStatus.accessType === 'active' && accessStatus.expiresAt && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900">Accès actif</h3>
                <p className="text-sm text-blue-700">
                  Temps restant: {formatRemainingTime()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-600">Expire le</p>
              <p className="text-sm font-semibold text-blue-900">
                {new Date(accessStatus.expiresAt).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {!accessStatus.hasAccess && accessStatus.accessType !== 'free' && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-1">Aucun accès actif</h3>
              <p className="text-sm text-amber-700 mb-3">
                Pour voir coordonnées et itinéraires, achetez un accès 24h
              </p>
              {accessStatus.price && (
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-amber-900">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0
                    }).format(accessStatus.price)}
                  </span>
                  <span className="text-sm text-amber-700">
                    pour {accessStatus.duration}h d'accès
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Titre et compteur */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Trouver du gaz près de chez vous
        </h1>
        <p className="text-sm text-gray-600">
          {filteredSellers.length} revendeur{filteredSellers.length > 1 ? 's' : ''} trouvé{filteredSellers.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filtres */}
      <SearchFilters
        onApplyFilters={handleApplyFilters}
        initialFilters={filters}
        maxRadius={MAX_DISTANCE_KM}
        accessType={accessStatus.accessType}
        hasAccess={accessStatus.hasAccess}
      />

      {/* AFFICHAGE DES REVENDEURS */}
      {filteredSellers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun revendeur trouvé
          </h3>
          <p className="text-gray-600 mb-2">
            Aucun revendeur dans votre zone actuellement
          </p>
          <p className="text-sm text-gray-500">
            Essayez de modifier vos critères de recherche
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
              hasAccess={accessStatus.hasAccess}
              onAccessRequired={handleAccessRequired}
            />
          ))}
        </div>
      )}

      {/* Modal détails */}
      {selectedSeller && (
        <SellerDetailsModal
          seller={selectedSeller}
          onClose={() => setSelectedSeller(null)}
          onOrder={handleOrder}
          onNavigate={handleNavigate}
          hasAccess={accessStatus.hasAccess}
          onAccessRequired={handleAccessRequired}
        />
      )}
    </div>
  );
};

export default MapPage;