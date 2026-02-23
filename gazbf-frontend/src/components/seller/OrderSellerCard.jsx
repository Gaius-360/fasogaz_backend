// ==========================================
// FICHIER: src/components/seller/OrderSellerCard.jsx - VERSION COMPLÈTE AVEC EXPIRATION
// ✅ SIMPLIFIÉ: Suppression de l'état `preparing`
// ✅ NOUVEAU: Timer d'expiration pour les commandes pending
//
// FLUX RETRAIT SUR PLACE : pending → accepted → completed
// FLUX LIVRAISON         : pending → accepted → in_delivery → completed
// ==========================================
import React, { useState } from 'react';
import { Clock, MapPin, Phone, CheckCircle, XCircle, Send, Copy, Navigation, MessageCircle, Share2 } from 'lucide-react';
import Button from '../common/Button';
import OrderExpirationTimer from '../common/OrderExpirationTimer';
import { formatPrice, formatDateTime } from '../../utils/helpers';
import { ORDER_STATUS } from '../../constants';

const OrderSellerCard = ({ order, onAccept, onReject, onViewDetails, onUpdateStatus, onComplete }) => {
  const [showDeliveryShare, setShowDeliveryShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const status = ORDER_STATUS[order.status];
  const isPending = order.status === 'pending';

  // ✅ Peut progresser depuis `accepted` ou `in_delivery`
  const canProgress = ['accepted', 'in_delivery'].includes(order.status);

  // ✅ Bouton "Partager avec livreur" : uniquement livraison + statut accepted
  //    (c'est le bon moment : commande acceptée, le livreur doit partir)
  const showDeliveryButton = order.deliveryMode === 'delivery' &&
                             order.status === 'accepted';

  const statusColors = {
    yellow: 'bg-secondary-100 text-secondary-800 border-secondary-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    green: 'bg-accent-100 text-accent-800 border-accent-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    gray: 'bg-neutral-100 text-neutral-800 border-neutral-300'
  };

  // ✅ TRANSITIONS SIMPLIFIÉES :
  //   pickup  : accepted → completed
  //   delivery: accepted → in_delivery → completed
  const getNextStatus = () => {
    if (order.status === 'accepted') {
      return order.deliveryMode === 'delivery' ? 'in_delivery' : 'completed';
    }
    if (order.status === 'in_delivery') {
      return 'completed';
    }
    return null;
  };

  const handleProgressOrder = () => {
    const nextStatus = getNextStatus();
    if (nextStatus && onUpdateStatus) {
      onUpdateStatus(order.id, nextStatus);
    }
  };

  // ✅ NOUVEAU: Gérer l'expiration de la commande
  const handleExpired = () => {
    console.log(`⏰ Commande ${order.orderNumber} expirée - rechargement suggéré`);
    // Optionnel: recharger les commandes ou afficher un message
    // Vous pouvez passer une fonction onRefresh depuis le parent si besoin
  };

  // ==========================================
  // FONCTIONS DE PARTAGE LIVREUR
  // ==========================================

  const getGoogleMapsLink = () => {
    const { latitude, longitude } = order.deliveryAddress || {};
    if (!latitude || !longitude) {
      console.warn('Coordonnées GPS non disponibles pour la commande:', order.id);
      return null;
    }
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  };

  const getDeliveryMessage = () => {
    const customer = order.customer || {};
    const address = order.deliveryAddress || {};
    const mapsLink = getGoogleMapsLink();

    const items = order.items?.map(item =>
      `• ${item.product?.brand} ${item.product?.bottleType} x${item.quantity}`
    ).join('\n') || '';

    const addressLines = [
      address.street ? `Rue: ${address.street}` : '',
      address.landmark ? `Repère: ${address.landmark}` : '',
      address.additionalInfo ? `Info: ${address.additionalInfo}` : ''
    ].filter(Boolean).join('\n');

    return `🚚 *NOUVELLE LIVRAISON FasoGaz*

📦 Commande: #${order.orderNumber}
💰 Montant: ${formatPrice(order.total)}

👤 *CLIENT*
Nom: ${customer.firstName} ${customer.lastName}
📞 Tél: ${customer.phone}

🗺️ *NAVIGATION*
${mapsLink ? mapsLink : 'Coordonnées non disponibles'}

🛒 *ARTICLES À LIVRER*
${items}
${order.customerNote ? `\n💬 *NOTE CLIENT*\n${order.customerNote}` : ''}

⏰ Commande passée: ${formatDateTime(order.createdAt)}`;
  };

  const shareViaWhatsApp = () => {
    const message = getDeliveryMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyDeliveryInfo = async () => {
    try {
      await navigator.clipboard.writeText(getDeliveryMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur copie:', err);
      alert('Erreur lors de la copie');
    }
  };

  const openInGoogleMaps = () => {
    const link = getGoogleMapsLink();
    if (link) {
      window.open(link, '_blank');
    } else {
      alert('Coordonnées GPS non disponibles pour cette adresse');
    }
  };

  // ✅ LIBELLÉS DU BOUTON DE PROGRESSION — plus de "Commencer la préparation"
  const getProgressLabel = () => {
    if (order.status === 'accepted' && order.deliveryMode === 'delivery') return 'Départ en livraison';
    if (order.status === 'accepted' && order.deliveryMode === 'pickup')   return 'Prêt pour retrait';
    if (order.status === 'in_delivery')                                    return 'Marquer comme livrée';
    return null;
  };

  return (
    <div className={`bg-white rounded-xl border-2 p-4 transition-all ${
      isPending
        ? 'border-secondary-300 shadow-gazbf animate-pulse-subtle'
        : 'border-neutral-200 hover:border-neutral-300'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-neutral-600 font-medium">#{order.orderNumber}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${statusColors[status.color]}`}>
          {status.icon} {status.label}
        </span>
      </div>

      {/* Client */}
      <div className="mb-4 pb-4 border-b-2 border-neutral-100">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-bold text-neutral-900">
              {order.customer?.firstName} {order.customer?.lastName}
            </p>
            <p className="text-sm text-neutral-600 flex items-center gap-2 mt-1">
              <Phone className="h-3.5 w-3.5 text-primary-500" />
              {order.customer?.phone}
            </p>
            {order.deliveryMode === 'delivery' && order.deliveryAddress && (
              <p className="text-sm text-neutral-600 flex items-center gap-2 mt-1">
                <MapPin className="h-3.5 w-3.5 text-accent-500" />
                {order.deliveryAddress.quarter}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-4 space-y-2 bg-neutral-50 rounded-lg p-3">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-neutral-700 font-medium">
              {item.product?.brand} {item.product?.bottleType} x{item.quantity}
            </span>
            <span className="font-bold text-neutral-900">{formatPrice(item.subtotal)}</span>
          </div>
        ))}
      </div>

      {/* Note client */}
      {order.customerNote && (
        <div className="mb-4 p-3 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg border-2 border-primary-200">
          <p className="text-xs text-primary-600 font-bold mb-1">💬 Note du client:</p>
          <p className="text-sm text-neutral-900">{order.customerNote}</p>
        </div>
      )}

      {/* ==========================================
          ✅ NOUVEAU: TIMER D'EXPIRATION
          Afficher uniquement pour les commandes pending avec expiresAt
          ========================================== */}
      {isPending && order.expiresAt && (
        <OrderExpirationTimer 
          expiresAt={order.expiresAt}
          onExpired={handleExpired}
        />
      )}

      {/* Total */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-neutral-100">
        <span className="text-sm text-neutral-700 font-bold">Total</span>
        <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
          {formatPrice(order.total)}
        </span>
      </div>

      {/* ==========================================
          PANNEAU DE PARTAGE LIVREUR
          ========================================== */}
      {showDeliveryShare && showDeliveryButton && (
        <div className="mb-4 p-4 bg-gradient-to-br from-accent-50 to-primary-50 rounded-lg border-2 border-accent-300 space-y-3 animate-slide-down">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-accent-900 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Envoyer au livreur
            </h4>
            <button
              onClick={() => setShowDeliveryShare(false)}
              className="text-neutral-500 hover:text-neutral-700 transition-colors"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button variant="accent" fullWidth onClick={shareViaWhatsApp}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Envoyer via WhatsApp
            </Button>

            {getGoogleMapsLink() && (
              <Button variant="primary" fullWidth onClick={openInGoogleMaps}>
                <Navigation className="h-4 w-4 mr-2" />
                Ouvrir dans Google Maps
              </Button>
            )}

            <Button variant="outline" fullWidth onClick={copyDeliveryInfo}>
              <Copy className="h-4 w-4 mr-2" />
              {copied ? '✓ Copié !' : 'Copier les détails'}
            </Button>
          </div>

          {/* Prévisualisation du message */}
          <div className="mt-3 p-3 bg-white rounded-lg border border-accent-200">
            <p className="text-xs text-neutral-600 mb-2 font-medium">Aperçu du message:</p>
            <pre className="text-xs text-neutral-700 whitespace-pre-wrap font-mono bg-neutral-50 p-2 rounded max-h-40 overflow-y-auto">
              {getDeliveryMessage()}
            </pre>
          </div>

          <p className="text-xs text-neutral-600 italic">
            💡 Le livreur recevra un lien Google Maps cliquable pour éviter les erreurs de saisie
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {/* Accepter / Rejeter — uniquement en attente */}
        {isPending && (
          <div className="flex gap-2">
            <Button variant="accent" fullWidth onClick={() => onAccept(order)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Accepter
            </Button>
            <Button variant="danger" onClick={() => onReject(order)}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Partager avec le livreur — livraison acceptée uniquement */}
        {showDeliveryButton && (
          <Button
            variant="accent"
            fullWidth
            onClick={() => setShowDeliveryShare(!showDeliveryShare)}
            className="font-bold shadow-gazbf"
          >
            <Send className="h-4 w-4 mr-2" />
            {showDeliveryShare ? 'Masquer partage' : 'Partager avec livreur'}
          </Button>
        )}

        {/* Bouton de progression principale */}
        {canProgress && (
          <Button
            variant="gradient"
            fullWidth
            onClick={handleProgressOrder}
            className="font-bold shadow-gazbf"
          >
            {getProgressLabel()}
          </Button>
        )}

        <Button variant="outline" fullWidth onClick={() => onViewDetails(order)}>
          Voir les détails
        </Button>
      </div>
    </div>
  );
};

export default OrderSellerCard;