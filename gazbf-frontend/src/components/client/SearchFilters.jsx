// ==========================================
// FICHIER: src/components/client/SearchFilters.jsx
// ==========================================
import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import Button from '../common/Button';
import { BOTTLE_TYPES, BRANDS } from '../../constants';

const SearchFilters = ({ onApplyFilters, initialFilters = {} }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    bottleType: initialFilters.bottleType || '',
    brand: initialFilters.brand || '',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    radius: initialFilters.radius || '10'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    setShowFilters(false);
  };

  const handleReset = () => {
    const resetFilters = {
      bottleType: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      radius: '10'
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== '10').length;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {/* Bouton filtres */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex-1"
        >
          <Filter className="h-5 w-5 mr-2" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Panel de filtres */}
      {showFilters && (
        <div className="mt-4 space-y-4 pt-4 border-t">
          {/* Type de bouteille */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de bouteille
            </label>
            <select
              name="bottleType"
              value={filters.bottleType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les types</option>
              {BOTTLE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Marque */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marque
            </label>
            <select
              name="brand"
              value={filters.brand}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Toutes les marques</option>
              {BRANDS.map(brand => (
                <option key={brand.value} value={brand.value}>
                  {brand.label}
                </option>
              ))}
            </select>
          </div>

          {/* Fourchette de prix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fourchette de prix (FCFA)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                name="minPrice"
                placeholder="Min"
                value={filters.minPrice}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                name="maxPrice"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Rayon de recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rayon de recherche: {filters.radius} km
            </label>
            <input
              type="range"
              name="radius"
              min="1"
              max="20"
              value={filters.radius}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              fullWidth
              onClick={handleApply}
            >
              Appliquer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
