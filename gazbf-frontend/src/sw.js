// ==========================================
// FICHIER: src/sw.js
// Service Worker — Précache Workbox + Push Notifications
// ==========================================
import { precacheAndRoute } from 'workbox-precaching'

// Vite injecte ici automatiquement la liste des assets au build
precacheAndRoute(self.__WB_MANIFEST || [])

// ── Activation immédiate sans attendre l'ancienne version ────
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()))

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS PUSH
// ─────────────────────────────────────────────────────────────

const EMOJI_MAP = {
  new_order:              '🛒',
  order_accepted:         '✅',
  order_rejected:         '❌',
  order_completed:        '✅',
  order_cancelled:        '⚠️',
  order_expiring_warning: '⏰',
  order_expired:          '⌛',
  seller_order_expired:   '⚠️',
  stock_alert:            '📦',
  subscription_expiring:  '⚠️',
  subscription_expired:   '🚨',
  grace_period:           '⏰',
  review_received:        '⭐',
  system:                 'ℹ️',
}

// ── Réception d'un push ───────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = {
    title:          'FasoGaz',
    message:        'Vous avez une nouvelle notification',
    icon:           '/icons/icon-192x192.png',
    badge:          '/icons/badge-72x72.png',
    url:            '/',
    priority:       'medium',
    type:           'system',
    notificationId: null,
  }

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() }
    } catch {
      payload.message = event.data.text()
    }
  }

  const emoji    = EMOJI_MAP[payload.type] || 'ℹ️'
  const isUrgent = ['urgent', 'high'].includes(payload.priority)

  const options = {
    body:               payload.message,
    icon:               '/icons/icon-192x192.png',
    badge:              '/icons/badge-72x72.png',
    vibrate:            isUrgent ? [300, 100, 300, 100, 300] : [200, 100, 200],
    tag:                payload.type || 'fasogaz-notif',
    renotify:           true,
    requireInteraction: isUrgent,
    silent:             false,
    timestamp:          Date.now(),
    data: {
      url:            payload.url || '/',
      notificationId: payload.notificationId,
      type:           payload.type,
    },
    actions: getActions(payload.type),
  }

  event.waitUntil(
    self.registration.showNotification(`${emoji} ${payload.title}`, options)
  )
})

// ── Clic sur une notification ─────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  const { action, notification } = event
  notification.close()

  if (action === 'dismiss') return

  const targetUrl = notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus()
            client.navigate(targetUrl)
            return
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl)
      })
  )
})

// ── Fermeture d'une notification ──────────────────────────────
self.addEventListener('notificationclose', (event) => {
  const { type } = event.notification.data || {}
  console.log(`[SW] Notification fermée (type: ${type})`)
})

// ── Boutons d'action selon le type ───────────────────────────
function getActions(type) {
  const orderActions = [
    { action: 'view',    title: '👁 Voir la commande' },
    { action: 'dismiss', title: 'Ignorer' },
  ]
  const detailActions = [
    { action: 'view', title: '👁 Voir les détails' },
  ]

  const map = {
    new_order:              orderActions,
    order_expiring_warning: orderActions,
    order_accepted:         detailActions,
    order_rejected:         detailActions,
    order_completed:        detailActions,
    order_expired:          detailActions,
    seller_order_expired:   detailActions,
    stock_alert:            detailActions,
    subscription_expiring:  detailActions,
    subscription_expired:   detailActions,
    grace_period:           detailActions,
    review_received:        detailActions,
  }

  return map[type] || []
}