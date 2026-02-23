// ==========================================
// FICHIER: src/hooks/usePushNotifications.js
// Hook React — gestion complète abonnement push
// ==========================================
import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/apiSwitch'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

const usePushNotifications = () => {
  const [isSupported, setIsSupported]   = useState(false)
  const [permission, setPermission]     = useState('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading]       = useState(false)
  const [error, setError]               = useState(null)

  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager'   in window    &&
      'Notification'  in window

    setIsSupported(supported)

    if (supported) {
      setPermission(Notification.permission)
      checkExistingSubscription()
    }
  }, [])

  const checkExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    } catch (err) {
      console.error('[Push] Vérification abonnement:', err)
    }
  }

  // ── ✅ On attend le SW enregistré par vite-plugin-pwa ──────
  // Plus besoin de faire navigator.serviceWorker.register() manuellement.
  const getSW = async () => {
    const reg = await navigator.serviceWorker.ready
    if (!reg) throw new Error('[SW] Service Worker non disponible')
    return reg
  }

  // ── S'abonner aux notifications push ──────────────────────
  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Les notifications push ne sont pas supportées sur cet appareil.')
      return false
    }
    if (!VAPID_PUBLIC_KEY) {
      console.error('[Push] VITE_VAPID_PUBLIC_KEY manquante dans .env')
      setError('Configuration serveur incorrecte. Contactez l\'administrateur.')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. Demander la permission
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setError('Permission refusée. Activez les notifications dans les paramètres.')
        return false
      }

      // 2. Récupérer le SW déjà enregistré par vite-plugin-pwa
      const registration = await getSW()

      // 3. Créer l'abonnement push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // 4. Envoyer l'abonnement au serveur
      const subJson = subscription.toJSON()
      await api.push.subscribe({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth:   subJson.keys.auth,
        },
      })

      setIsSubscribed(true)
      console.log('[Push] ✅ Abonnement activé')
      return true

    } catch (err) {
      console.error('[Push] Erreur abonnement:', err)
      setError('Impossible d\'activer les notifications. Réessayez.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  // ── Se désabonner ─────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()

      if (sub) {
        await api.push.unsubscribe({ endpoint: sub.endpoint })
        await sub.unsubscribe()
      }

      setIsSubscribed(false)
      console.log('[Push] ✅ Désabonnement effectué')
      return true

    } catch (err) {
      console.error('[Push] Erreur désabonnement:', err)
      setError('Impossible de désactiver les notifications.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  }
}

export default usePushNotifications