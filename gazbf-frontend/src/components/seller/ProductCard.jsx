// ==========================================
// FICHIER: src/components/seller/ProductCard.jsx
// Carte produit avec couleurs FasoGaz
// ==========================================
import React from 'react';
import { Edit, Trash2, Eye, ShoppingCart } from 'lucide-react';
import Button from '../common/Button';
import { formatPrice } from '../../utils/helpers';

const ProductCard = ({ product, onEdit, onDelete }) => {
  const statusConfig = {
    available: {
      label: 'En stock',
      color: 'text-accent-700 bg-accent-100 border-accent-300'
    },
    limited: {
      label: 'Stock limité',
      color: 'text-secondary-700 bg-secondary-100 border-secondary-300'
    },
    out_of_stock: {
      label: 'Rupture',
      color: 'text-red-700 bg-red-100 border-red-300'
    }
  };

  const status = statusConfig[product.status];

  return (
    <div className="bg-white rounded-xl border-2 border-neutral-200 p-4 hover:border-secondary-300 hover:shadow-gazbf transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-neutral-900">
            {product.brand}
          </h3>
          <p className="text-sm text-neutral-600 font-medium">{product.bottleType}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Prix et stock */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl">
        <div>
          <p className="text-sm text-neutral-600 mb-1 font-medium">Prix unitaire</p>
          <p className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
            {formatPrice(product.price)}
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600 mb-1 font-medium">Stock</p>
          <p className="text-xl font-bold text-neutral-900">
            {product.quantity} unités
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between py-3 border-t-2 border-b-2 border-neutral-100 text-sm text-neutral-600 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-100 rounded-lg">
            <Eye className="h-4 w-4 text-primary-600" />
          </div>
          <span className="font-medium">{product.viewCount || 0} vues</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent-100 rounded-lg">
            <ShoppingCart className="h-4 w-4 text-accent-600" />
          </div>
          <span className="font-medium">{product.orderCount || 0} ventes</span>
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
          className="text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;