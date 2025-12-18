// ==========================================
// FICHIER: src/components/client/OrderCard.jsx
// ==========================================
import React from 'react';
import { Clock, MapPin, Package, Phone, XCircle } from 'lucide-react';
import Button from '../common/Button';
import { formatPrice, formatDateTime } from '../../utils/helpers';
import { ORDER_STATUS } from '../../constants';

const OrderCard = ({ order, onViewDetails, onCancel }) => {
  const status = ORDER_STATUS[order.status];
  const canCancel = ['pending', 'accepted'].includes(order.status);

  const statusColors = {
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">Commande #{order.orderNumber}</p>
          <p className="text-xs text-gray-400 mt-1">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status.color]}`}>
          {status.icon} {status.label}
        </span>
      </div>

      {/* Revendeur */}
      <div className="mb-4">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              {order.seller?.businessName}
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {order.seller?.quarter}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4 space-y-2">
        {order.items?.slice(0, 2).map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {item.product?.brand} {item.product?.bottleType} x{item.quantity}
            </span>
            <span className="font-medium">{formatPrice(item.subtotal)}</span>
          </div>
        ))}
        {order.items?.length > 2 && (
          <p className="text-xs text-gray-500">
            +{order.items.length - 2} autre(s) produit(s)
          </p>
        )}
      </div>

      {/* Mode de livraison */}
      <div className="mb-4 pb-4 border-b">
        <p className="text-sm text-gray-600">
          {order.deliveryMode === 'delivery' ? (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Livraison à domicile
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Retrait sur place
            </span>
          )}
        </p>
      </div>

      {/* Total et actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-xl font-bold text-primary-600">
            {formatPrice(order.total)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(order)}
          >
            Détails
          </Button>
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(order)}
            >
              <XCircle className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;