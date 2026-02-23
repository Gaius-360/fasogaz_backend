// ==========================================
// FICHIER: src/components/common/Card.jsx
// Cards avec couleurs FasoGaz
// ==========================================
import React from 'react';
import clsx from 'clsx';

const Card = ({ 
  children, 
  className = '',
  padding = true,
  variant = 'default',
  ...props 
}) => {
  const variants = {
    default: 'bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow',
    gazbf: 'bg-gradient-to-br from-white to-primary-50 rounded-xl shadow-gazbf border-2 border-primary-100 hover:shadow-gazbf-lg transition-all',
    accent: 'bg-gradient-to-br from-white to-accent-50 rounded-xl shadow-sm border-2 border-accent-100 hover:shadow-md transition-all',
  };

  return (
    <div
      className={clsx(
        variants[variant],
        padding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;