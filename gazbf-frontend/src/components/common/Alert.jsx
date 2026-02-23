// ==========================================
// FICHIER: src/components/common/Alert.jsx
// Alertes avec couleurs FasoGaz
// ==========================================
import React from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import clsx from 'clsx';

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose,
  className = '' 
}) => {
  const types = {
    success: {
      bg: 'bg-accent-50',
      border: 'border-accent-200',
      icon: CheckCircle2,
      iconColor: 'text-accent-600',
      titleColor: 'text-accent-900',
      messageColor: 'text-accent-800',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: XCircle,
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      messageColor: 'text-red-800',
    },
    warning: {
      bg: 'bg-secondary-50',
      border: 'border-secondary-200',
      icon: AlertCircle,
      iconColor: 'text-secondary-600',
      titleColor: 'text-secondary-900',
      messageColor: 'text-secondary-800',
    },
    info: {
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      icon: Info,
      iconColor: 'text-primary-600',
      titleColor: 'text-primary-900',
      messageColor: 'text-primary-800',
    },
  };

  const config = types[type];
  const Icon = config.icon;

  return (
    <div className={clsx(
      'p-4 rounded-lg border-2',
      config.bg,
      config.border,
      className
    )}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={clsx('h-5 w-5', config.iconColor)} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={clsx('text-sm font-bold', config.titleColor)}>
              {title}
            </h3>
          )}
          {message && (
            <div className={clsx('text-sm', title ? 'mt-2' : '', config.messageColor)}>
              {message}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={clsx(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
                config.iconColor,
                'hover:bg-opacity-20 hover:bg-neutral-900'
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;