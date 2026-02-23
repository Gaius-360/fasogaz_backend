// ==========================================
// FICHIER: src/components/client/SellerDetailsModal.jsx
// Modal détails revendeur avec couleurs FasoGaz
// ==========================================
import React, { useState, useEffect } from 'react';
import { X, Star, Phone, MapPin, Navigation, Package, Truck, Building2, Lock, Clock } from 'lucide-react';
import Button from '../common/Button';
import AccessPurchaseModal from './AccessPurchaseModal';
import { formatPrice, formatDistance } from '../../utils/helpers';
import { api } from '../../api/apiSwitch';
import { OpeningHoursDisplay } from '../seller/OpeningHoursDisplay';

const SellerDetailsModal = ({ 
  seller, 
  onClose, 
  onOrder, 
  onNavigate,
  hasAccess = false,
  onAccessRequired
}) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [isOpen, setIsOpen] = useState(null);

  // Fonction pour vérifier si le dépôt est ouvert
  const checkIfOpen = () => {
    if (!seller?.openingHours) return null; // Retourner null si pas d'horaires définis

    const openingHours = seller.openingHours;

    // Si ouvert 24/7
    if (openingHours.isOpen24_7) {
      return true;
    }

    // Si fermé définitivement
    if (openingHours.isClosed) {
      return false;
    }

    // Vérifier les horaires du jour actuel
    const now = new Date();
    const daysMap = {
      'dimanche': 'sunday',
      'lundi': 'monday',
      'mardi': 'tuesday',
      'mercredi': 'wednesday',
      'jeudi': 'thursday',
      'vendredi': 'friday',
      'samedi': 'saturday'
    };
    
    const currentDayFr = now.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    const currentDay = daysMap[currentDayFr];
    const currentTime = now.toTimeString().slice(0, 5); // Format HH:MM

    const todaySchedule = openingHours.schedule?.[currentDay];
    
    // Si pas d'horaires pour aujourd'hui ou jour désactivé
    if (!todaySchedule || !todaySchedule.enabled) {
      return false;
    }

    // Vérifier si l'heure actuelle est dans la plage horaire
    return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
  };

  useEffect(() => {
    if (hasAccess && seller && seller.products && seller.products.length > 0) {
      seller.products.forEach(product => {
        incrementProductView(product.id);
      });
    }
    
    // Vérifier si le dépôt est ouvert
    setIsOpen(checkIfOpen());
    
    // Mettre à jour toutes les minutes
    const interval = setInterval(() => {
      setIsOpen(checkIfOpen());
    }, 60000);

    return () => clearInterval(interval);
  }, [seller?.id, hasAccess, seller?.openingHours]);

  const incrementProductView = async (productId) => {
    try {
      await api.products.incrementView(productId);
    } catch (error) {
      console.error('Erreur incrémentation vue:', error);
    }
  };

  if (!seller) return null;

  const displayName = seller.businessName || 
                      `${seller.firstName || ''} ${seller.lastName || ''}`.trim() ||
                      `Dépôt ${seller.quarter || seller.city || 'Gaz'}`;

  const handleProtectedAction = (action, ...args) => {
    if (!hasAccess) {
      setShowAccessModal(true);
      return;
    }
    action(...args);
  };

  const handleAccessPurchased = () => {
    setShowAccessModal(false);
    if (onAccessRequired) {
      onAccessRequired();
    }
  };

  const toggleProduct = (product) => {
    if (!hasAccess) {
      setShowAccessModal(true);
      return;
    }

    if (isOpen === false) {
      return; // Ne pas permettre l'ajout si fermé (mais autoriser si null)
    }
    
    setSelectedProducts(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId, quantity) => {
    setSelectedProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p)
    );
  };

  const total = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  const handleOrder = () => {
    if (!hasAccess) {
      setShowAccessModal(true);
      return;
    }

    if (isOpen === false) {
      return; // Ne pas permettre la commande si fermé
    }

    onOrder(seller, selectedProducts);
  };

  const handleNavigate = () => {
    if (!hasAccess) {
      setShowAccessModal(true);
      return;
    }
    if (onNavigate) {
      onNavigate(seller);
    }
  };

  const handleCall = () => {
    if (!hasAccess) {
      setShowAccessModal(true);
      return;
    }
    window.location.href = `tel:${seller.phone}`;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
          {/* Header avec gradient */}
          <div className="gradient-gazbf p-6">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                {!seller.businessName && (
                  <Building2 className="h-6 w-6" />
                )}
                <h2 className="text-2xl font-bold">
                  {displayName}
                </h2>
                {/* Indicateur d'ouverture - Afficher uniquement si horaires définis */}
                {isOpen === false && (
                  <span className="ml-2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    FERMÉ
                  </span>
                )}
                {isOpen === true && (
                  <span className="ml-2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    OUVERT
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{seller.quarter || 'Quartier non précisé'}, {seller.city}</span>
                </div>
                {seller.averageRating > 0 ? (
                  <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    <Star className="h-4 w-4 fill-secondary-400 text-secondary-400" />
                    <span className="font-bold">
                      {parseFloat(seller.averageRating).toFixed(1)}
                    </span>
                    <span>({seller.totalReviews} avis)</span>
                  </div>
                ) : (
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm font-semibold">
                    Nouveau revendeur
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* Message si le dépôt est fermé */}
            {isOpen === false && hasAccess && (
              <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">
                      🕐 Dépôt actuellement fermé
                    </h3>
                    <p className="text-neutral-700">
                      Ce dépôt est fermé pour le moment. Les commandes seront disponibles pendant les heures d'ouverture. Consultez les horaires ci-dessous.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message d'accès requis */}
            {!hasAccess && (
              <div className="mb-6 bg-gradient-to-r from-secondary-50 to-secondary-100 border-2 border-secondary-300 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">
                      🔒 Informations protégées
                    </h3>
                    <p className="text-neutral-700 mb-4">
                      Pour accéder aux coordonnées, à l'itinéraire et passer commande, vous devez acheter un accès 24h.
                    </p>
                    <Button
                      variant="gradient"
                      onClick={() => setShowAccessModal(true)}
                    >
                      Débloquer l'accès maintenant
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Localisation */}
            <div className="mb-6">
              <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                Localisation
              </h3>
              <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-4 space-y-3 border-2 border-neutral-200">
                <p className="text-neutral-700">
                  <span className="font-bold">Quartier:</span> {seller.quarter || 'Non précisé'}
                </p>
                <p className="text-neutral-700">
                  <span className="font-bold">Ville:</span> {seller.city}
                </p>
                {seller.distance !== null && seller.distance !== undefined && (
                  <p className="text-neutral-700">
                    <span className="font-bold">Distance:</span>{' '}
                    <span className="font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                      {formatDistance(seller.distance)}
                    </span>
                  </p>
                )}
                
                {seller.latitude && seller.longitude ? (
                  <Button
                    variant={hasAccess ? "primary" : "outline"}
                    fullWidth
                    onClick={handleNavigate}
                    className="mt-2"
                    disabled={!hasAccess}
                  >
                    {hasAccess ? (
                      <>
                        <Navigation className="h-4 w-4 mr-2" />
                        Obtenir l'itinéraire
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Itinéraire (Accès requis)
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="bg-secondary-50 border-2 border-secondary-200 rounded-lg p-3 mt-2">
                    <p className="text-sm text-secondary-800 flex items-center gap-2 font-medium">
                      <MapPin className="h-4 w-4" />
                      Coordonnées GPS non disponibles
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Heures d'ouverture */}
            <OpeningHoursDisplay openingHours={seller.openingHours} />

            {/* Contact et Livraison */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleCall}
                disabled={!hasAccess}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all border-2 ${
                  hasAccess 
                    ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 hover:border-primary-300 cursor-pointer' 
                    : 'bg-neutral-100 border-neutral-200 cursor-not-allowed opacity-60'
                }`}
              >
                {hasAccess ? (
                  <Phone className="h-5 w-5 text-primary-600" />
                ) : (
                  <Lock className="h-5 w-5 text-neutral-400" />
                )}
                <div className="text-left">
                  <p className="text-xs text-neutral-600 font-medium">Téléphone</p>
                  <p className="font-bold text-neutral-900">
                    {hasAccess ? seller.phone : '*** *** ****'}
                  </p>
                </div>
              </button>

              {seller.deliveryAvailable ? (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl border-2 border-accent-200">
                  <Truck className="h-5 w-5 text-accent-600" />
                  <div>
                    <p className="text-xs text-neutral-600 font-medium">Livraison disponible</p>
                    <p className="font-bold text-accent-700">
                      {seller.deliveryFee > 0 ? formatPrice(seller.deliveryFee) : 'Gratuit'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-neutral-100 rounded-xl border-2 border-neutral-200">
                  <Truck className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-600 font-medium">Livraison</p>
                    <p className="text-sm text-neutral-500 font-medium">Non disponible</p>
                  </div>
                </div>
              )}
            </div>

            {/* Produits */}
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-600" />
              Produits disponibles ({seller.products?.length || 0})
            </h3>
            
            {!seller.products || seller.products.length === 0 ? (
              <div className="bg-neutral-50 rounded-xl p-8 text-center border-2 border-neutral-200">
                <Package className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
                <p className="text-neutral-500 font-medium">Aucun produit disponible</p>
              </div>
            ) : (
              <div className="space-y-3">
                {seller.products.map((product) => {
                  const isSelected = selectedProducts.find(p => p.id === product.id);
                  const isAvailable = product.status === 'available' || product.status === 'limited';
                  const canOrder = isAvailable && (isOpen === true || isOpen === null) && hasAccess;

                  return (
                    <div
                      key={product.id}
                      className={`border-2 rounded-xl p-4 transition-all ${
                        isSelected 
                          ? 'border-primary-600 bg-gradient-to-br from-primary-50 to-secondary-50 shadow-gazbf' 
                          : 'border-neutral-200 hover:border-neutral-300'
                      } ${(!isAvailable || isOpen === false) && 'opacity-50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-neutral-900">
                            {product.brand} - {product.bottleType}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                              {formatPrice(product.price)}
                            </span>
                            {product.status === 'available' && (isOpen === true || isOpen === null) && (
                              <span className="text-sm text-accent-600 font-bold">✓ Disponible</span>
                            )}
                            {product.status === 'limited' && (isOpen === true || isOpen === null) && (
                              <span className="text-sm text-secondary-600 font-bold">⚠ Quantité faible</span>
                            )}
                            {product.status === 'out_of_stock' && (
                              <span className="text-sm text-red-600 font-bold">✗ Rupture de stock</span>
                            )}
                            {isOpen === false && isAvailable && (
                              <span className="text-sm text-red-600 font-bold">🕐 Fermé</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
                            <span>{product.viewCount || 0} vue{(product.viewCount || 0) !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>{product.orderCount || 0} vente{(product.orderCount || 0) !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {isAvailable && (
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <>
                                <button
                                  onClick={() => updateQuantity(product.id, isSelected.quantity - 1)}
                                  className="w-8 h-8 rounded-full border-2 border-neutral-300 flex items-center justify-center hover:bg-neutral-50 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={!canOrder}
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-bold">
                                  {isSelected.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(product.id, isSelected.quantity + 1)}
                                  className="w-8 h-8 rounded-full border-2 border-neutral-300 flex items-center justify-center hover:bg-neutral-50 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={!canOrder}
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => toggleProduct(product)}
                                  className="ml-2 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={!canOrder}
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleProduct(product)}
                                disabled={!canOrder}
                              >
                                {!hasAccess ? (
                                  <Lock className="h-4 w-4" />
                                ) : isOpen === false ? (
                                  <Clock className="h-4 w-4" />
                                ) : (
                                  'Ajouter'
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {selectedProducts.length > 0 && hasAccess ? (
            <div className="p-6 border-t-2 border-neutral-100 bg-neutral-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-700 font-bold">Total</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                  {formatPrice(total)}
                </span>
              </div>
              <Button
                variant="gradient"
                fullWidth
                onClick={handleOrder}
                disabled={isOpen === false}
                className="h-12 text-base font-bold shadow-gazbf-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOpen === false ? (
                  <>
                    <Clock className="h-5 w-5 mr-2" />
                    Dépôt fermé - Commande impossible
                  </>
                ) : (
                  <>Commander ({selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''})</>
                )}
              </Button>
            </div>
          ) : (
            <div className="p-6 border-t-2 border-neutral-100">
              <Button variant="outline" fullWidth onClick={onClose}>
                Fermer
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'achat d'accès */}
      {showAccessModal && (
        <AccessPurchaseModal
          onClose={() => setShowAccessModal(false)}
          onSuccess={handleAccessPurchased}
        />
      )}
    </>
  );
};

export default SellerDetailsModal;