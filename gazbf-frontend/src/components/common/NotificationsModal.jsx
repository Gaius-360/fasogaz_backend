import React, { useEffect, useState } from 'react';
import { X, Eye, Trash2, Bell } from 'lucide-react';
import { api } from '../../api/apiSwitch';
import { formatDateTime } from '../../utils/helpers';

const NotificationsModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAll();
    }
  }, [isOpen]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await api.notifications.getMyNotifications({ limit: 100 });
      if (res.success) {
        setNotifications(res.data.notifications);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    await api.notifications.markAsRead(id);
    setNotifications(n =>
      n.map(x => x.id === id ? { ...x, isRead: true } : x)
    );
  };

  const remove = async (id) => {
    await api.notifications.deleteNotification(id);
    setNotifications(n => n.filter(x => x.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">Toutes les notifications</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-10">Chargement...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">
              <Bell className="mx-auto mb-2" />
              Aucune notification
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-4 rounded-lg border ${
                  !n.isRead ? 'bg-primary-50/40' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{n.title}</h4>
                    <p className="text-sm text-neutral-600">{n.message}</p>
                    <span className="text-xs text-neutral-400">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="p-1 hover:bg-primary-100 rounded"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => remove(n.id)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
