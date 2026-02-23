// ==========================================
// FICHIER: src/components/client/OrderCard.jsx
// Card commande avec couleurs FasoGaz
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
    yellow: 'bg-secondary-100 text-secondary-800 border-secondary-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    green: 'bg-accent-100 text-accent-800 border-accent-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    gray: 'bg-neutral-100 text-neutral-800 border-neutral-300'
  };

  return (
    <div className="bg-white rounded-xl border-2 border-neutral-200 hover:border-primary-300 hover:shadow-gazbf transition-all duration-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-neutral-600 font-medium">Commande #{order.orderNumber}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${statusColors[status.color]}`}>
          {status.icon} {status.label}
        </span>
      </div>

      {/* Revendeur */}
      <div className="mb-4">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-primary-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-neutral-900">
              {order.seller?.businessName}
            </p>
            <p className="text-sm text-neutral-600 flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {order.seller?.quarter}
            </p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4 space-y-2 bg-neutral-50 rounded-lg p-3">
        {order.items?.slice(0, 2).map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-neutral-700 font-medium">
              {item.product?.brand} {item.product?.bottleType} x{item.quantity}
            </span>
            <span className="font-bold text-neutral-900">{formatPrice(item.subtotal)}</span>
          </div>
        ))}
        {order.items?.length > 2 && (
          <p className="text-xs text-neutral-500 text-center pt-1 border-t border-neutral-200">
            +{order.items.length - 2} autre(s) produit(s)
          </p>
        )}
      </div>

      {/* Mode de livraison */}
      <div className="mb-4 pb-4 border-b-2 border-neutral-100">
        <p className="text-sm text-neutral-700 font-medium">
          {order.deliveryMode === 'delivery' ? (
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent-500" />
              Livraison à domicile
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4 text-secondary-500" />
              Retrait sur place
            </span>
          )}
        </p>
      </div>

      {/* Total et actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-600 font-medium">Total</p>
          <p className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
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
              className="text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;