// ==========================================
// FICHIER: src/components/common/MobileResponsiveUtils.jsx
// Composants et utilitaires pour responsivité mobile
// ==========================================
import React from 'react';

// Container responsive avec padding adaptatif
export const ResponsiveContainer = ({ children, className = '' }) => {
  return (
    <div className={`px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
};

// Grille responsive adaptative
export const ResponsiveGrid = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className = '' 
}) => {
  const gapClass = `gap-${gap}`;
  const gridClass = `grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`;
  
  return (
    <div className={`grid ${gridClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
};

// Card responsive avec meilleur espacement mobile
export const MobileCard = ({ children, className = '', padding = true }) => {
  const paddingClass = padding ? 'p-4 sm:p-6' : '';
  return (
    <div className={`bg-white rounded-lg border shadow-sm ${paddingClass} ${className}`}>
      {children}
    </div>
  );
};

// Header de section responsive
export const SectionHeader = ({ 
  title, 
  subtitle, 
  action,
  className = '' 
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 ${className}`}>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 w-full sm:w-auto">
          {action}
        </div>
      )}
    </div>
  );
};

// Stats Card responsive
export const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color = 'blue',
  className = '' 
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
    secondary: 'text-secondary-600 bg-secondary-100'
  };

  return (
    <MobileCard className={className}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-600 truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
            {value}
          </p>
        </div>
      </div>
    </MobileCard>
  );
};

// Filtres responsive avec scroll horizontal mobile
export const MobileFilterBar = ({ filters, activeFilter, onFilterChange }) => {
  return (
    <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 min-w-max sm:min-w-0">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              activeFilter === filter.value
                ? 'bg-secondary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span className="ml-1.5 opacity-75">({filter.count})</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Modal responsive fullscreen sur mobile
export const ResponsiveModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  footer,
  size = 'default' // 'small', 'default', 'large'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'sm:max-w-md',
    default: 'sm:max-w-lg',
    large: 'sm:max-w-2xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div 
        className={`
          bg-white 
          w-full 
          ${sizeClasses[size]}
          rounded-t-2xl sm:rounded-xl 
          max-h-[90vh] sm:max-h-[85vh]
          flex flex-col
          animate-slide-up sm:animate-none
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 pr-4">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 -mr-2 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content avec scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t p-4 sm:p-6 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Bouton mobile-friendly avec taille adaptative
export const ResponsiveButton = ({ 
  children, 
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  icon: Icon,
  loading = false,
  disabled = false,
  onClick,
  className = ''
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-secondary-600 text-white hover:bg-secondary-700',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    default: 'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base',
    lg: 'px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="hidden sm:inline">Chargement...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />}
          <span className="truncate">{children}</span>
        </>
      )}
    </button>
  );
};

// Empty state responsive
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '' 
}) => {
  return (
    <MobileCard className={`text-center py-8 sm:py-12 ${className}`}>
      <Icon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
        {description}
      </p>
      {action && (
        <div className="flex justify-center px-4">
          {action}
        </div>
      )}
    </MobileCard>
  );
};

// Tableau responsive qui devient des cards sur mobile
export const ResponsiveTable = ({ columns, data, renderMobileCard }) => {
  return (
    <>
      {/* Vue desktop - tableau classique */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue mobile - cards */}
      <div className="lg:hidden space-y-3">
        {data.map((row, i) => (
          <MobileCard key={i}>
            {renderMobileCard(row)}
          </MobileCard>
        ))}
      </div>
    </>
  );
};

// Info row responsive (label + valeur)
export const InfoRow = ({ label, value, icon: Icon }) => {
  return (
    <div className="flex items-center justify-between py-2 sm:py-3">
      <div className="flex items-center gap-2 text-gray-600 flex-1 min-w-0">
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
        <span className="text-sm truncate">{label}</span>
      </div>
      <span className="font-semibold text-gray-900 text-sm sm:text-base ml-2 flex-shrink-0">
        {value}
      </span>
    </div>
  );
};

// Badge responsive
export const ResponsiveBadge = ({ children, color = 'gray', size = 'default' }) => {
  const colorClasses = {
    gray: 'bg-gray-100 text-gray-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    default: 'px-2 py-1 sm:px-3 text-xs sm:text-sm'
  };

  return (
    <span className={`inline-block rounded-full font-medium whitespace-nowrap ${colorClasses[color]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};

export default {
  ResponsiveContainer,
  ResponsiveGrid,
  MobileCard,
  SectionHeader,
  StatCard,
  MobileFilterBar,
  ResponsiveModal,
  ResponsiveButton,
  EmptyState,
  ResponsiveTable,
  InfoRow,
  ResponsiveBadge
};