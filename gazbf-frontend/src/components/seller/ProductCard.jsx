// ==========================================
// FICHIER: src/components/seller/ProductCard.jsx
// ==========================================
import React from 'react';
import { Edit, Trash2, Eye, ShoppingCart } from 'lucide-react';
import Button from '../common/Button';
import { formatPrice } from '../../utils/helpers';

const ProductCard = ({ product, onEdit, onDelete }) => {
  const statusConfig = {
    available: {
      label: 'En stock',
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    limited: {
      label: 'Stock limité',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    },
    out_of_stock: {
      label: 'Rupture',
      color: 'text-red-600 bg-red-50 border-red-200'
    }
  };

  const status = statusConfig[product.status];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">
            {product.brand}
          </h3>
          <p className="text-sm text-gray-600">{product.bottleType}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Prix et stock */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Prix unitaire</p>
          <p className="text-xl font-bold text-primary-600">
            {formatPrice(product.price)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Stock</p>
          <p className="text-xl font-bold text-gray-900">
            {product.quantity} unités
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between py-3 border-t border-b text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span>{product.viewCount || 0} vues</span>
        </div>
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          <span>{product.orderCount || 0} ventes</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          fullWidth
          onClick={() => onEdit(product)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
        <Button
          variant="ghost"
          onClick={() => onDelete(product)}
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
