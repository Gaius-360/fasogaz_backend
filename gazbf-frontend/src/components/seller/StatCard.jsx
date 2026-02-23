// ==========================================
// FICHIER: src/components/seller/StatCard.jsx
// Carte de statistiques avec couleurs FasoGaz
// ==========================================
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'primary'
}) => {
  const colors = {
    primary: 'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 border-primary-200',
    secondary: 'bg-gradient-to-br from-secondary-50 to-secondary-100 text-secondary-600 border-secondary-200',
    accent: 'bg-gradient-to-br from-accent-50 to-accent-100 text-accent-600 border-accent-200',
    green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-600 border-green-200',
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 border-purple-200',
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-600 border-yellow-200'
  };

  const isPositive = trend === 'up';

  return (
    <div className="bg-white rounded-xl border-2 border-neutral-200 p-6 hover:shadow-gazbf transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl border-2 ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
            isPositive 
              ? 'bg-accent-100 text-accent-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="font-bold">{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-neutral-600 mb-2 font-medium">{title}</p>
        <p className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
          {value}
        </p>
      </div>
    </div>
  );
};

export default StatCard;