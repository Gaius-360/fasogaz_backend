// ==========================================
// FICHIER: src/components/seller/OrderSellerCard.jsx
// ==========================================
import React from 'react';
import { Clock, MapPin, Phone, CheckCircle, XCircle } from 'lucide-react';
import Button from '../common/Button';
import { formatPrice, formatDateTime } from '../../utils/helpers';
import { ORDER_STATUS } from '../../constants';

const OrderSellerCard = ({ order, onAccept, onReject, onViewDetails, onUpdateStatus }) => {
  const status = ORDER_STATUS[order.status];
  const isPending = order.status === 'pending';
  const isAccepted = order.status === 'accepted';
  const canProgress = ['accepted', 'preparing', 'in_delivery'].includes(order.status);

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
    <div className={`bg-white rounded-lg border-2 p-4 transition-all ${
      isPending ? 'border-yellow-300 shadow-md' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">#{order.orderNumber}</p>
          <p className="text-xs text-gray-400 mt-1">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status.color]}`}>
          {status.icon} {status.label}
        </span>
      </div>

      {/* Client */}
      <div className="mb-4 pb-4 border-b">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              {order.customer?.firstName} {order.customer?.lastName}
            </p>
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <Phone className="h-3 w-3" />
              {order.customer?.phone}
            </p>
            {order.deliveryMode === 'delivery' && order.deliveryAddress && (
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {order.deliveryAddress.quarter}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4 space-y-2">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {item.product?.brand} {item.product?.bottleType} x{item.quantity}
            </span>
            <span className="font-medium">{formatPrice(item.subtotal)}</span>
          </div>
        ))}
      </div>

      {/* Note client */}
      {order.customerNote && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-600 font-medium mb-1">Note du client:</p>
          <p className="text-sm text-blue-900">{order.customerNote}</p>
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <span className="text-sm text-gray-600">Total</span>
        <span className="text-xl font-bold text-secondary-600">
          {formatPrice(order.total)}
        </span>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {isPending && (
          <div className="flex gap-2">
            <Button
              variant="primary"
              fullWidth
              onClick={() => onAccept(order)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accepter
            </Button>
            <Button
              variant="danger"
              onClick={() => onReject(order)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {canProgress && (
          <Button
            variant="primary"
            fullWidth
            onClick={() => onUpdateStatus(order)}
          >
            {order.status === 'accepted' && 'Commencer la préparation'}
            {order.status === 'preparing' && order.deliveryMode === 'delivery' && 'Départ en livraison'}
            {order.status === 'preparing' && order.deliveryMode === 'pickup' && 'Prêt pour retrait'}
            {order.status === 'in_delivery' && 'Marquer comme complétée'}
          </Button>
        )}

        <Button
          variant="outline"
          fullWidth
          onClick={() => onViewDetails(order)}
        >
          Voir les détails
        </Button>
      </div>
    </div>
  );
};

export default OrderSellerCard;