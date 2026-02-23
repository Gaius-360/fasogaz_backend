// ==========================================
// FICHIER: src/components/common/Toast.jsx
// Notifications toast avec couleurs FasoGaz
// ==========================================
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

const Toast = ({ id, type = 'info', message, duration = 5000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const types = {
    success: {
      bg: 'bg-accent-50',
      border: 'border-accent-500',
      icon: CheckCircle,
      iconColor: 'text-accent-600',
      textColor: 'text-accent-900'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      icon: XCircle,
      iconColor: 'text-red-600',
      textColor: 'text-red-900'
    },
    warning: {
      bg: 'bg-secondary-50',
      border: 'border-secondary-500',
      icon: AlertCircle,
      iconColor: 'text-secondary-600',
      textColor: 'text-secondary-900'
    },
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-500',
      icon: Info,
      iconColor: 'text-primary-600',
      textColor: 'text-primary-900'
    }
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div
      className={`${config.bg} ${config.border} border-l-4 p-4 rounded-lg shadow-lg min-w-[300px] max-w-md animate-slide-in-right`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <p className={`flex-1 text-sm font-medium ${config.textColor}`}>{message}</p>
        <button
          onClick={() => onClose(id)}
          className={`${config.iconColor} hover:opacity-70 transition-opacity`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;