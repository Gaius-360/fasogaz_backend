// ==========================================
// FICHIER: src/components/common/Input.jsx
// Inputs avec couleurs FasoGaz
// ==========================================
import React, { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(({ 
  label,
  error,
  helpText,
  icon: Icon,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
          {props.required && <span className="text-primary-600 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-neutral-400" />
          </div>
        )}
        
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors',
            Icon && 'pl-10',
            error ? 'border-red-500' : 'border-neutral-300',
            props.disabled && 'bg-neutral-50 text-neutral-500 cursor-not-allowed',
            className
          )}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helpText && !error && (
        <p className="mt-1 text-sm text-neutral-500">{helpText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;