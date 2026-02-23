// ==========================================
// FICHIER: src/components/common/NotificationBell.jsx
// Cloche de notifications avec badge - VERSION CORRIGÉE MOBILE
// ==========================================
import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Eye, Trash2 } from 'lucide-react';
import { api } from '../../api/apiSwitch';
import { formatDateTime } from '../../utils/helpers';
import NotificationsModal from './NotificationsModal';


const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const [showModal, setShowModal] = useState(false);


  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh toutes les 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.notifications.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Erreur récupération count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.notifications.getMyNotifications({ limit: 3, unreadOnly: true });
      if (response.success) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.notifications.markAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur marquage notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
  try {
    await api.notifications.markAllAsRead();

    // Vide la cloche
    setNotifications([]);

    // Reset badge
    setUnreadCount(0);

  } catch (error) {
    console.error('Erreur marquage notifications:', error);
  }
};



  const handleDelete = async (notificationId) => {
    try {
      await api.notifications.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      fetchUnreadCount();
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      new_order: '🛒',
      order_accepted: '✅',
      order_rejected: '❌',
      order_completed: '✅',
      order_cancelled: '⚠️',
      stock_alert: '📦',
      subscription_expiring: '⚠️',
      subscription_expired: '🚨',
      grace_period: '⏰',
      review_received: '⭐',
      system: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'border-l-4 border-red-500 bg-red-50',
      high: 'border-l-4 border-secondary-500 bg-secondary-50',
      medium: 'border-l-4 border-blue-500 bg-blue-50',
      low: 'border-l-4 border-gray-500 bg-gray-50'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton cloche */}
      <button
        onClick={handleToggle}
        className="relative p-2 hover:bg-secondary-50 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6 text-neutral-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown - CORRIGÉ POUR MOBILE */}
      {isOpen && (
        <>
          {/* Overlay mobile uniquement */}
          <div 
            className="lg:hidden fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="fixed lg:absolute right-2 lg:right-0 top-16 lg:top-auto lg:mt-2 w-[calc(100vw-16px)] sm:w-96 max-w-md bg-white rounded-xl shadow-gazbf-lg border-2 border-neutral-200 z-50 h-[480px] max-h-[calc(100vh-80px)] flex flex-col">

            {/* Header */}
            <div className="p-4 border-b-2 border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-900">Notifications</h3>
                <p className="text-xs text-neutral-600">
                  {unreadCount} non lue{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    title="Tout marquer comme lu"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-neutral-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-neutral-600" />
                </button>
              </div>
            </div>

            {/* Liste des notifications */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y-2 divide-neutral-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-neutral-50 transition-colors ${
                        !notification.isRead ? 'bg-primary-50/30' : ''
                      } ${getPriorityColor(notification.priority)}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-bold text-sm text-neutral-900">
                              {notification.title}
                            </h4>
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="p-1 hover:bg-red-100 rounded-lg flex-shrink-0"
                              title="Supprimer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </button>
                          </div>
                          
                          <p className="text-sm text-neutral-700 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-neutral-500">
                            <span>{formatDateTime(notification.createdAt)}</span>
                            
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                Marquer lu
                              </button>
                            )}
                          </div>
                          
                          
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t-2 border-neutral-100 text-center bg-white sticky bottom-0">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowModal(true);
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Voir toutes les notifications
              </button>
            </div>

          </div>
        </>
      )}
      <NotificationsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );   

};

export default NotificationBell;