// ==========================================
// FICHIER: src/components/seller/ProductFormModal.jsx
// ==========================================
import React, { useState } from 'react';
import { X, Package } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';
import { BOTTLE_TYPES, BRANDS } from '../../constants';
import sellerService from '../../api/sellerService';

const ProductFormModal = ({ product, onClose, onSuccess }) => {
  const isEdit = !!product;

  const [formData, setFormData] = useState({
    bottleType: product?.bottleType || '6kg',
    brand: product?.brand || 'Shell Gaz',
    price: product?.price ? String(Math.round(product.price)) : '',
    quantity: product?.quantity || '',
    productImage: product?.productImage || ''
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  // ✅ Filtre strict : n'autorise que les chiffres 0-9, aucun séparateur possible
  const handlePriceChange = (e) => {
    const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, price: onlyDigits }));
    if (errors.price) setErrors(prev => ({ ...prev, price: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.price || parseInt(formData.price) <= 0) newErrors.price = 'Prix invalide';
    if (formData.quantity === '' || parseInt(formData.quantity) < 0) newErrors.quantity = 'Quantité invalide';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setAlert(null);

    try {
      const productData = {
        ...formData,
        price: parseInt(formData.price),
        quantity: parseInt(formData.quantity)
      };

      const response = isEdit
        ? await sellerService.updateProduct(product.id, productData)
        : await sellerService.createProduct(productData);

      if (response.success) {
        setAlert({ 
          type: 'success', 
          message: isEdit ? 'Produit mis à jour' : 'Produit créé avec succès' 
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors de l\'opération'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        
        {/* Header */}
        <div className="gradient-gazbf p-6">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full transition-colors text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Package className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold">
                {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
            </div>
            <p className="text-white/90 text-sm">
              {isEdit ? 'Mettez à jour les informations' : 'Ajoutez un produit à votre stock'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {alert && (
            <Alert 
              type={alert.type} 
              message={alert.message} 
              onClose={() => setAlert(null)} 
              className="mb-4" 
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type de bouteille */}
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">
                Type de bouteille <span className="text-primary-600">*</span>
              </label>
              <select
                name="bottleType"
                value={formData.bottleType}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-medium"
                disabled={isEdit}
              >
                {BOTTLE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {isEdit && (
                <p className="text-xs text-neutral-500 mt-2">⚠️ Le type ne peut pas être modifié</p>
              )}
            </div>

            {/* Marque */}
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">
                Marque <span className="text-primary-600">*</span>
              </label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-medium"
                disabled={isEdit}
              >
                {BRANDS.map(brand => (
                  <option key={brand.value} value={brand.value}>{brand.label}</option>
                ))}
              </select>
              {isEdit && (
                <p className="text-xs text-neutral-500 mt-2">⚠️ La marque ne peut pas être modifiée</p>
              )}
            </div>

            {/* ✅ Prix — champ texte filtré, seuls les chiffres passent */}
            <div>
              <label className="block text-sm font-bold text-neutral-900 mb-2">
                Prix unitaire (FCFA) <span className="text-primary-600">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="price"
                placeholder="6000"
                value={formData.price}
                onChange={handlePriceChange}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-medium ${
                  errors.price ? 'border-red-400' : 'border-neutral-200'
                }`}
              />
              {errors.price && (
                <p className="text-xs text-red-500 mt-1">{errors.price}</p>
              )}
            </div>

            {/* Quantité */}
            <Input
              label="Quantité en stock"
              name="quantity"
              type="number"
              placeholder="20"
              value={formData.quantity}
              onChange={handleChange}
              error={errors.quantity}
              min="0"
              required
              helpText="Statut automatique: >5 = Disponible, 1-5 = Limité, 0 = Rupture"
            />
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-neutral-100 bg-neutral-50">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button 
              variant="gradient" 
              fullWidth 
              loading={loading} 
              onClick={handleSubmit}
              className="h-12 text-base font-bold shadow-gazbf-lg"
            >
              {isEdit ? 'Mettre à jour' : 'Créer le produit'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductFormModal;