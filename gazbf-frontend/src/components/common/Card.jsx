// ==========================================
// FICHIER: src/components/common/Card.jsx
// ==========================================
import React from 'react';
import clsx from 'clsx';

const Card = ({ 
  children, 
  className = '',
  padding = true,
  ...props 
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-sm border border-gray-200',
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