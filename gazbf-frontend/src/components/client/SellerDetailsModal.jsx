// ==========================================
// FICHIER 3: src/components/client/SellerDetailsModal.jsx (VERSION COMPLÈTE)
// ==========================================

import React, { useState } from 'react';
import { X, Star, Phone, MapPin, Navigation, Package, Truck } from 'lucide-react';
import Button from '../common/Button';
import { formatPrice, formatDistance } from '../../utils/helpers';

const SellerDetailsModal = ({ seller, onClose, onOrder, onNavigate }) => {
  const [selectedProducts, setSelectedProducts] = useState([]);

  if (!seller) return null;

  const toggleProduct = (product) => {
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
    onOrder(seller, selectedProducts);
  };

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate(seller);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {seller.businessName}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{seller.quarter}, {seller.city}</span>
              </div>
              {seller.averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {parseFloat(seller.averageRating).toFixed(1)}
                  </span>
                  <span>({seller.totalReviews} avis)</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Localisation et distance */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              Localisation
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-gray-700">
                <span className="font-medium">Quartier:</span> {seller.quarter}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Ville:</span> {seller.city}
              </p>
              {seller.distance !== null && seller.distance !== undefined && (
                <p className="text-gray-700">
                  <span className="font-medium">Distance:</span>{' '}
                  <span className="text-primary-600 font-semibold">
                    {formatDistance(seller.distance)}
                  </span>
                </p>
              )}
              
              {/* Bouton d'itinéraire */}
              {seller.latitude && seller.longitude && (
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleNavigate}
                  className="mt-2"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Obtenir l'itinéraire
                </Button>
              )}
            </div>
          </div>

          {/* Contact et Livraison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-5 w-5 text-primary-600" />
              <div>
                <p className="text-xs text-gray-600">Téléphone</p>
                <p className="font-medium">{seller.phone}</p>
              </div>
            </div>

            {seller.deliveryAvailable && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Truck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-600">Livraison</p>
                  <p className="font-medium text-green-600">
                    {formatPrice(seller.deliveryFee)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Produits */}
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary-600" />
            Produits disponibles ({seller.products?.length || 0})
          </h3>
          <div className="space-y-3">
            {seller.products && seller.products.map((product) => {
              const isSelected = selectedProducts.find(p => p.id === product.id);
              const isAvailable = product.status === 'available' || product.status === 'limited';

              return (
                <div
                  key={product.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isSelected ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                  } ${!isAvailable && 'opacity-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {product.brand} - {product.bottleType}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-lg font-bold text-primary-600">
                          {formatPrice(product.price)}
                        </span>
                        {product.status === 'available' && (
                          <span className="text-sm text-green-600">✓ En stock</span>
                        )}
                        {product.status === 'limited' && (
                          <span className="text-sm text-yellow-600">⚠ Stock limité</span>
                        )}
                        {product.status === 'out_of_stock' && (
                          <span className="text-sm text-red-600">✗ Rupture</span>
                        )}
                      </div>
                    </div>

                    {isAvailable && (
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <>
                            <button
                              onClick={() => updateQuantity(product.id, isSelected.quantity - 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">
                              {isSelected.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(product.id, isSelected.quantity + 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                            >
                              +
                            </button>
                            <button
                              onClick={() => toggleProduct(product)}
                              className="ml-2 text-red-600 hover:text-red-700"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleProduct(product)}
                          >
                            Ajouter
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        {selectedProducts.length > 0 ? (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Total</span>
              <span className="text-2xl font-bold text-primary-600">
                {formatPrice(total)}
              </span>
            </div>
            <Button
              variant="primary"
              fullWidth
              onClick={handleOrder}
            >
              Commander ({selectedProducts.length} produit{selectedProducts.length > 1 ? 's' : ''})
            </Button>
          </div>
        ) : (
          <div className="p-6 border-t">
            <Button variant="outline" fullWidth onClick={onClose}>
              Fermer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDetailsModal;
