// ==========================================
// FICHIER: src/components/common/Button.jsx
// Boutons avec couleurs FasoGaz
// ==========================================
import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:scale-95 shadow-gazbf hover:shadow-gazbf-lg',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-400 active:scale-95',
    accent: 'bg-accent-600 text-white hover:bg-accent-700 focus:ring-accent-500 active:scale-95',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500 active:scale-95',
    ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:scale-95',
    gradient: 'gradient-gazbf text-white hover:opacity-90 focus:ring-primary-500 active:scale-95 shadow-gazbf-lg',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        baseClasses,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;