// ==========================================
// FICHIER: src/components/seller/OrderDetailsModal.jsx
// Modal détails commande avec couleurs FasoGaz - VERSION CORRIGÉE
// ==========================================
import React, { useState } from 'react';
import { 
  X, MapPin, Phone, Package, Clock, User, 
  Navigation, ExternalLink, Share2, MessageCircle,
  Copy, CheckCircle, AlertCircle
} from 'lucide-react';
import Button from '../common/Button';
import { formatPrice, formatDateTime } from '../../utils/helpers';
import { ORDER_STATUS } from '../../constants';

const OrderDetailsModal = ({ order, onClose, isSeller = false, onUpdateStatus }) => {
  const [copied, setCopied] = useState(false);
  const status = ORDER_STATUS[order.status];

  const statusColors = {
    yellow: 'bg-secondary-100 text-secondary-800 border-secondary-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    green: 'bg-accent-100 text-accent-800 border-accent-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    gray: 'bg-neutral-100 text-neutral-800 border-neutral-300'
  };

  const handleCopyCoordinates = () => {
    if (order.deliveryAddress?.latitude && order.deliveryAddress?.longitude) {
      const coords = `${order.deliveryAddress.latitude}, ${order.deliveryAddress.longitude}`;
      navigator.clipboard.writeText(coords);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenGoogleMaps = () => {
    if (order.deliveryAddress?.latitude && order.deliveryAddress?.longitude) {
      const url = `https://www.google.com/maps?q=${order.deliveryAddress.latitude},${order.deliveryAddress.longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleShareWhatsApp = () => {
    if (!order.deliveryAddress?.latitude || !order.deliveryAddress?.longitude) return;

    const customerName = `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim();
    const customerPhone = order.customer?.phone || 'Non renseigné';
    const address = order.deliveryAddress.fullAddress || `${order.deliveryAddress.quarter}, ${order.deliveryAddress.city}`;
    const coords = `${order.deliveryAddress.latitude}, ${order.deliveryAddress.longitude}`;
    const googleMapsLink = `https://www.google.com/maps?q=${coords}`;

    const message = `🚚 *NOUVELLE LIVRAISON*

📦 *Commande:* #${order.orderNumber}
👤 *Client:* ${customerName}
📞 *Téléphone:* ${customerPhone}

📍 *Adresse de livraison:*
${address}

🗺️ *Coordonnées GPS:*
${coords}

🔗 *Lien Google Maps:*
${googleMapsLink}

💰 *Montant:* ${formatPrice(order.total)}

${order.customerNote ? `💬 *Note client:*\n${order.customerNote}` : ''}

Merci ! 🙏`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleContactCustomer = () => {
    if (!order.customer?.phone) return;

    const phone = order.customer.phone.replace(/\D/g, '');
    const message = `Bonjour ${order.customer.firstName}, concernant votre commande #${order.orderNumber}...`;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div 
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden"
        style={{ maxHeight: '95vh' }}
      >
        
        {/* Header avec gradient */}
        <div className="relative gradient-gazbf p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-all text-white hover:scale-110"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  Commande #{order.orderNumber}
                </h2>
                <p className="text-white/90 text-sm">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${statusColors[status.color]} bg-white`}>
                {status.icon} {status.label}
              </span>
              {order.deliveryMode === 'delivery' ? (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                  🚚 Livraison
                </span>
              ) : (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                  📦 Retrait sur place
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div 
          className="p-6 space-y-6 overflow-y-auto"
          style={{ maxHeight: 'calc(95vh - 240px)' }}
        >
          
          {/* Informations Client */}
          <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-5 border-2 border-primary-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-500 rounded-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-neutral-900 text-lg">
                Informations Client
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-neutral-500" />
                <span className="font-bold text-neutral-900">
                  {order.customer?.firstName} {order.customer?.lastName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-neutral-500" />
                  <span className="text-neutral-700 font-medium">{order.customer?.phone}</span>
                </div>
                {isSeller && order.customer?.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleContactCustomer}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Contacter
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Adresse de Livraison avec GPS */}
          {order.deliveryMode === 'delivery' && order.deliveryAddress && (
            <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-xl p-5 border-2 border-accent-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent-500 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-neutral-900 text-lg">
                  Adresse de Livraison
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-accent-200">
                  <p className="font-bold text-neutral-900 mb-1">
                    {order.deliveryAddress.label}
                  </p>
                  <p className="text-sm text-neutral-700">
                    {order.deliveryAddress.fullAddress}
                  </p>
                  {order.deliveryAddress.additionalInfo && (
                    <p className="text-sm text-neutral-600 mt-2 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      {order.deliveryAddress.additionalInfo}
                    </p>
                  )}
                </div>

                {order.deliveryAddress.latitude && order.deliveryAddress.longitude && (
                  <>
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-accent-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Navigation className="h-5 w-5 text-accent-600" />
                          <span className="font-bold text-neutral-900">
                            Coordonnées GPS
                          </span>
                        </div>
                        <span className="text-xs bg-accent-100 text-accent-700 px-2 py-1 rounded font-bold">
                          Précis
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Latitude:</span>
                          <span className="font-mono font-bold text-neutral-900">
                            {parseFloat(order.deliveryAddress.latitude).toFixed(6)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Longitude:</span>
                          <span className="font-mono font-bold text-neutral-900">
                            {parseFloat(order.deliveryAddress.longitude).toFixed(6)}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={handleCopyCoordinates}
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2 text-accent-600" />
                            Coordonnées copiées !
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copier les coordonnées
                          </>
                        )}
                      </Button>
                    </div>

                    {isSeller && (
                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          variant="accent"
                          fullWidth
                          onClick={handleOpenGoogleMaps}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Ouvrir dans Google Maps
                        </Button>

                        <Button
                          variant="outline"
                          fullWidth
                          onClick={handleShareWhatsApp}
                          className="border-accent-500 text-accent-700 hover:bg-accent-50"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Partager via WhatsApp
                        </Button>

                        <p className="text-xs text-center text-neutral-600 mt-1">
                          💡 Partagez la localisation avec votre livreur
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Note du client */}
          {order.customerNote && (
            <div className="bg-primary-50 rounded-xl p-4 border-2 border-primary-200">
              <p className="text-xs text-primary-600 font-bold mb-2">
                💬 Note du client:
              </p>
              <p className="text-sm text-neutral-900">{order.customerNote}</p>
            </div>
          )}

          {/* Produits */}
          <div className="bg-neutral-50 rounded-xl p-5 border-2 border-neutral-200">
            <h3 className="font-bold text-neutral-900 text-lg mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-600" />
              Produits commandés
            </h3>
            
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white rounded-lg p-4 flex items-center justify-between border-2 border-neutral-200"
                >
                  <div className="flex-1">
                    <p className="font-bold text-neutral-900">
                      {item.product?.brand} {item.product?.bottleType}
                    </p>
                    <p className="text-sm text-neutral-600 font-medium">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent text-lg">
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Récapitulatif */}
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-5 border-2 border-neutral-200">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600 font-medium">Sous-total</span>
                <span className="font-bold text-neutral-900">{formatPrice(order.subtotal)}</span>
              </div>
              
              {order.deliveryMode === 'delivery' && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 font-medium">Frais de livraison</span>
                  <span className="font-bold text-neutral-900">
                    {order.deliveryFee > 0 ? formatPrice(order.deliveryFee) : 'Gratuit'}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t-2 border-neutral-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-neutral-900">Total</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Temps estimé */}
          {order.estimatedTime && order.status !== 'completed' && (
            <div className="bg-secondary-50 rounded-xl p-4 border-2 border-secondary-200 flex items-center gap-3">
              <Clock className="h-5 w-5 text-secondary-600" />
              <div>
                <p className="text-sm font-bold text-secondary-900">
                  Temps estimé: {order.estimatedTime} minutes
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-neutral-200 bg-neutral-50">
          <Button
            variant="outline"
            fullWidth
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;