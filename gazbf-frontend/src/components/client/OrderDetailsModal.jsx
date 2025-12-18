// ==========================================
// FICHIER: src/components/client/OrderDetailsModal.jsx
// ==========================================
import React from 'react';
import { X, MapPin, Phone, Package, Clock, CheckCircle } from 'lucide-react';
import Button from '../common/Button';
import { formatPrice, formatDateTime } from '../../utils/helpers';
import { ORDER_STATUS } from '../../constants';

const OrderDetailsModal = ({ order, onClose, onCancel }) => {
  if (!order) return null;

  const status = ORDER_STATUS[order.status];
  const canCancel = ['pending', 'accepted'].includes(order.status);

  const timeline = [
    {
      status: 'pending',
      label: 'Commande envoyée',
      time: order.createdAt,
      active: true
    },
    {
      status: 'accepted',
      label: 'Acceptée par le revendeur',
      time: order.acceptedAt,
      active: ['accepted', 'preparing', 'in_delivery', 'completed'].includes(order.status)
    },
    {
      status: 'preparing',
      label: 'En préparation',
      active: ['preparing', 'in_delivery', 'completed'].includes(order.status)
    },
    {
      status: 'in_delivery',
      label: order.deliveryMode === 'delivery' ? 'En livraison' : 'Prêt pour retrait',
      active: ['in_delivery', 'completed'].includes(order.status)
    },
    {
      status: 'completed',
      label: 'Complétée',
      time: order.completedAt,
      active: order.status === 'completed'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Commande #{order.orderNumber}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {formatDateTime(order.createdAt)}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${status.color}-50 text-${status.color}-700`}>
              {status.icon} {status.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Timeline (si pas annulé ou rejeté) */}
          {!['cancelled', 'rejected'].includes(order.status) && (
            <div>
              <h3 className="font-semibold text-lg mb-4">Suivi de la commande</h3>
              <div className="space-y-4">
                {timeline.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        step.active ? 'bg-primary-600' : 'bg-gray-200'
                      }`}>
                        {step.active ? (
                          <CheckCircle className="h-5 w-5 text-white" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-white"></div>
                        )}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className={`w-0.5 h-12 ${
                          step.active ? 'bg-primary-600' : 'bg-gray-200'
                        }`}></div>
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <p className={`font-medium ${step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.label}
                      </p>
                      {step.time && (
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDateTime(step.time)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message de rejet */}
          {order.status === 'rejected' && order.rejectionReason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-1">
                Commande rejetée
              </p>
              <p className="text-sm text-red-700">
                Raison: {order.rejectionReason}
              </p>
            </div>
          )}

          {/* Revendeur */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Revendeur</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-semibold text-gray-900">{order.seller?.businessName}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <MapPin className="h-4 w-4" />
                <span>{order.seller?.quarter}, {order.seller?.city}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Phone className="h-4 w-4" />
                <span>{order.seller?.phone}</span>
              </div>
            </div>
          </div>

          {/* Produits */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Produits</h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.product?.brand} - {item.product?.bottleType}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Adresse de livraison */}
          {order.deliveryMode === 'delivery' && order.deliveryAddress && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Adresse de livraison</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">{order.deliveryAddress.label}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {order.deliveryAddress.fullAddress}
                </p>
                <p className="text-sm text-gray-600">
                  {order.deliveryAddress.quarter}, {order.deliveryAddress.city}
                </p>
              </div>
            </div>
          )}

          {/* Note client */}
          {order.customerNote && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Note</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{order.customerNote}</p>
              </div>
            </div>
          )}

          {/* Résumé */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Résumé</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frais de livraison</span>
                  <span className="font-medium">{formatPrice(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-xl text-primary-600">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {canCancel && (
          <div className="p-6 border-t bg-gray-50">
            <Button
              variant="danger"
              fullWidth
              onClick={() => {
                onCancel(order);
                onClose();
              }}
            >
              Annuler la commande
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsModal;