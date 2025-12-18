// ==========================================
// FICHIER 2: src/components/client/SellerCard.jsx (VERSION COMPACTE)
// ==========================================

import React from 'react';
import { MapPin, Star, Phone, Navigation, Package } from 'lucide-react';
import Button from '../common/Button';
import { formatPrice, formatDistance } from '../../utils/helpers';

const SellerCard = ({ seller, onViewDetails, onCall, onNavigate, distance }) => {
  const hasProducts = seller.products && seller.products.length > 0;
  const lowestPrice = hasProducts 
    ? Math.min(...seller.products.map(p => parseFloat(p.price)))
    : null;

  const handleNavigate = (e) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate(seller);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 p-3 cursor-pointer h-full flex flex-col">
      {/* Header compact */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-gray-900 truncate">
            {seller.businessName}
          </h3>
          <div className="flex items-center gap-1 text-xs text-gray-600 mt-0.5">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{seller.quarter}</span>
          </div>
        </div>

        {/* Badge distance */}
        {distance !== null && distance !== undefined && (
          <div className="ml-2 flex-shrink-0 bg-primary-50 px-2 py-1 rounded-md">
            <span className="text-xs font-bold text-primary-600">
              {formatDistance(distance)}
            </span>
          </div>
        )}
      </div>

      {/* Note et prix sur même ligne */}
      <div className="flex items-center justify-between mb-2">
        {seller.averageRating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold">
              {parseFloat(seller.averageRating).toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">
              ({seller.totalReviews})
            </span>
          </div>
        )}

        {lowestPrice && (
          <span className="text-sm font-bold text-primary-600">
            {formatPrice(lowestPrice)}
          </span>
        )}
      </div>

      {/* Produits compacts */}
      {hasProducts && (
        <div className="flex items-center gap-1 mb-2 text-xs text-gray-600">
          <Package className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {seller.products.length} produit{seller.products.length > 1 ? 's' : ''} disponible{seller.products.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Badges produits mini */}
      {hasProducts && (
        <div className="flex flex-wrap gap-1 mb-3 flex-1">
          {seller.products.slice(0, 2).map((product) => (
            <span
              key={product.id}
              className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 rounded text-xs"
            >
              {product.bottleType}
              {product.status === 'available' ? (
                <span className="ml-0.5 text-green-600">✓</span>
              ) : product.status === 'limited' ? (
                <span className="ml-0.5 text-yellow-600">⚠</span>
              ) : (
                <span className="ml-0.5 text-red-600">✗</span>
              )}
            </span>
          ))}
          {seller.products.length > 2 && (
            <span className="text-xs text-gray-500">
              +{seller.products.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Actions compactes */}
      <div className="grid grid-cols-3 gap-1 mt-auto">
        {seller.latitude && seller.longitude && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNavigate}
            title="Itinéraire"
            className="p-1.5"
          >
            <Navigation className="h-3.5 w-3.5" />
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onCall(seller.phone);
          }}
          title="Appeler"
          className="p-1.5"
        >
          <Phone className="h-3.5 w-3.5" />
        </Button>
        
        <Button
          variant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(seller);
          }}
          className={`text-xs ${seller.latitude && seller.longitude ? '' : 'col-span-2'}`}
        >
          Voir
        </Button>
      </div>
    </div>
  );
};

export default SellerCard;