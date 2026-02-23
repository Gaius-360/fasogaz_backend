// ==========================================
// FICHIER: src/components/client/SearchFilters.jsx (VERSION AVEC BLOCAGE)
// Filtres verrouillés si pas d'accès client
// ==========================================
import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, MapPin, Tag, DollarSign, Zap, Lock } from 'lucide-react';
import Button from '../common/Button';
import { BOTTLE_TYPES, BRANDS } from '../../constants';

const SearchFilters = ({ 
  onApplyFilters, 
  initialFilters = {}, 
  maxRadius = 10,
  hasAccess = false,
  accessType = 'none'
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    bottleType: initialFilters.bottleType || '',
    brand: initialFilters.brand || '',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    radius: initialFilters.radius || '10'
  });

  // ✅ Vérifier si les filtres doivent être bloqués
  // hasAccess = true : client a un accès actif
  // accessType = 'free' : système désactivé (gratuit)
  const filtersLocked = !hasAccess && accessType !== 'free';

  const handleChange = (e) => {
    if (filtersLocked) return; // ✅ Bloquer si verrouillé
    
    const { name, value } = e.target;
    
    if (name === 'radius') {
      const numValue = parseFloat(value) || 1;
      const limitedValue = Math.min(numValue, maxRadius);
      setFilters(prev => ({ ...prev, [name]: limitedValue.toString() }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleApply = () => {
    if (filtersLocked) return;
    
    const limitedFilters = {
      ...filters,
      radius: Math.min(parseFloat(filters.radius) || maxRadius, maxRadius).toString()
    };
    
    onApplyFilters(limitedFilters);
    setShowFilters(false);
  };

  const handleReset = () => {
    if (filtersLocked) return;
    
    const resetFilters = {
      bottleType: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      radius: maxRadius.toString()
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const handleToggleFilters = () => {
    if (filtersLocked) return;
    setShowFilters(!showFilters);
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== maxRadius.toString()).length;

  return (
    <>
      {/* ✅ Styles CSS intégrés pour le slider */}
      <style>{`
        .radius-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 12px;
          border-radius: 9999px;
          outline: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s ease;
        }
        .radius-slider:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        .radius-slider:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
        .radius-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, #EF4444 0%, #F59E0B 50%, #10B981 100%);
          cursor: pointer;
          border: 4px solid white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .radius-slider::-webkit-slider-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2);
        }
        .radius-slider::-webkit-slider-thumb:active {
          transform: scale(1.15);
        }
        .radius-slider::-moz-range-thumb {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, #EF4444 0%, #F59E0B 50%, #10B981 100%);
          cursor: pointer;
          border: 4px solid white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .radius-slider::-moz-range-thumb:hover {
          transform: scale(1.25);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.2);
        }
        .radius-slider::-moz-range-thumb:active {
          transform: scale(1.15);
        }
        .radius-slider::-moz-range-track {
          height: 12px;
          border-radius: 9999px;
        }
        @keyframes pulse-slider {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
        .radius-slider:focus::-webkit-slider-thumb {
          animation: pulse-slider 2s infinite;
        }
        .radius-slider:focus::-moz-range-thumb {
          animation: pulse-slider 2s infinite;
        }
        @media (max-width: 640px) {
          .radius-slider { height: 14px; }
          .radius-slider::-webkit-slider-thumb { width: 28px; height: 28px; }
          .radius-slider::-moz-range-thumb { width: 28px; height: 28px; }
        }
      `}</style>

      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      
      {/* ✅ BANNIÈRE DE VERROUILLAGE */}
      {filtersLocked && (
        <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-300">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-amber-900 text-xs sm:text-sm mb-1">
                🔒 Filtres de recherche verrouillés
              </h3>
              <p className="text-[10px] sm:text-xs text-amber-800 mb-2">
                Achetez un accès 24h pour utiliser les filtres de recherche et trouver les meilleurs revendeurs.
              </p>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-amber-700">
                <span>💡 Avec l'accès 24h :</span>
                <span className="font-semibold">Filtres + Coordonnées + Itinéraires</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barre de filtres */}
      <div className="p-2 sm:p-3">
        <div className="flex items-center gap-2">
          <Button
            variant={filtersLocked ? "outline" : (showFilters ? "gradient" : "outline")}
            onClick={handleToggleFilters}
            disabled={filtersLocked}
            size="sm"
            className={`flex-1 relative text-xs sm:text-sm ${filtersLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {filtersLocked ? (
              <>
                <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                <span className="font-semibold">Filtres verrouillés</span>
              </>
            ) : (
              <>
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                <span className="font-semibold">Filtres</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-secondary-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </>
            )}
          </Button>
          
          {!filtersLocked && activeFiltersCount > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 sm:py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs sm:text-sm font-medium"
            >
              <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Panel de filtres (caché si verrouillé) */}
      {!filtersLocked && (
        <div className={`overflow-hidden transition-all duration-300 ${showFilters ? 'max-h-[600px]' : 'max-h-0'}`}>
          <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 border-t border-neutral-100">
            
            {/* Grille compacte */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              
              {/* Type de bouteille */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-semibold text-neutral-700">
                  <Tag className="h-3 w-3 text-primary-600" />
                  <span className="hidden sm:inline">Type</span>
                </label>
                <select
                  name="bottleType"
                  value={filters.bottleType}
                  onChange={handleChange}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Tous</option>
                  {BOTTLE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marque */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-semibold text-neutral-700">
                  <Zap className="h-3 w-3 text-secondary-600" />
                  <span className="hidden sm:inline">Marque</span>
                </label>
                <select
                  name="brand"
                  value={filters.brand}
                  onChange={handleChange}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                >
                  <option value="">Toutes</option>
                  {BRANDS.map(brand => (
                    <option key={brand.value} value={brand.value}>
                      {brand.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prix minimum */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-semibold text-neutral-700">
                  <DollarSign className="h-3 w-3 text-accent-600" />
                  <span className="hidden sm:inline">Min</span>
                </label>
                <input
                  type="number"
                  name="minPrice"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={handleChange}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Prix maximum */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-xs font-semibold text-neutral-700">
                  <DollarSign className="h-3 w-3 text-accent-600" />
                  <span className="hidden sm:inline">Max</span>
                </label>
                <input
                  type="number"
                  name="maxPrice"
                  placeholder="∞"
                  value={filters.maxPrice}
                  onChange={handleChange}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Rayon de recherche avec style amélioré */}
            <div className="space-y-3 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg p-3 sm:p-4 border-2 border-primary-200">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-bold text-neutral-800">
                  <MapPin className="h-4 w-4 text-secondary-600" />
                  Rayon de recherche
                </label>
                <span className="px-3 py-1 gradient-gazbf text-white rounded-full text-sm font-bold shadow-md">
                  {filters.radius} km
                </span>
              </div>
              
              {/* ✅ Slider personnalisé avec track visible */}
              <div className="relative pt-1">
                <input
                  type="range"
                  name="radius"
                  min="1"
                  max={maxRadius}
                  value={filters.radius}
                  onChange={handleChange}
                  className="radius-slider w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      #EF4444 0%, 
                      #F59E0B ${(filters.radius / maxRadius) * 100}%, 
                      #10B981 ${(filters.radius / maxRadius) * 100}%, 
                      #10B981 100%)`
                  }}
                />
              </div>
              
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="flex items-center gap-1 text-red-600">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  1 km
                </span>
                <span className="text-neutral-500">
                  Distance maximale
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {maxRadius} km
                </span>
              </div>
            </div>

            {/* Bouton d'application */}
            <Button
              variant="gradient"
              fullWidth
              onClick={handleApply}
              size="sm"
              className="text-xs sm:text-sm font-semibold"
            >
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
              Rechercher
            </Button>
          </div>
        </div>
      )}

      {/* Résumé des filtres actifs (caché si verrouillé) */}
      {!filtersLocked && activeFiltersCount > 0 && !showFilters && (
        <div className="px-2 sm:px-3 pb-2 sm:pb-3 flex flex-wrap gap-1.5">
          {filters.bottleType && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-[10px] sm:text-xs font-semibold">
              <Tag className="h-2.5 w-2.5" />
              {BOTTLE_TYPES.find(t => t.value === filters.bottleType)?.label}
            </span>
          )}
          {filters.brand && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full text-[10px] sm:text-xs font-semibold">
              <Zap className="h-2.5 w-2.5" />
              {BRANDS.find(b => b.value === filters.brand)?.label}
            </span>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-accent-100 text-accent-700 rounded-full text-[10px] sm:text-xs font-semibold">
              <DollarSign className="h-2.5 w-2.5" />
              {filters.minPrice || '0'}-{filters.maxPrice || '∞'}
            </span>
          )}
          {filters.radius !== maxRadius.toString() && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded-full text-[10px] sm:text-xs font-semibold">
              <MapPin className="h-2.5 w-2.5" />
              {filters.radius}km
            </span>
          )}
        </div>
      )}
    </div>
    </>
  );
};

export default SearchFilters;