// ==========================================
// FICHIER: src/components/seller/ProductFormModal.jsx
// ==========================================
import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';
import { BOTTLE_TYPES, BRANDS } from '../../constants';
import sellerService from '../../api/sellerService';

const ProductFormModal = ({ product, onClose, onSuccess }) => {
  const isEdit = !!product;

  const [formData, setFormData] = useState({
    bottleType: product?.bottleType || '6kg',
    brand: product?.brand || 'Shell Gas',
    price: product?.price || '',
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

  const validate = () => {
    const newErrors = {};
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Prix invalide';
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
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity)
      };

      const response = isEdit
        ? await sellerService.updateProduct(product.id, productData)
        : await sellerService.createProduct(productData);

      if (response.success) {
        setAlert({ type: 'success', message: isEdit ? 'Produit mis à jour' : 'Produit créé avec succès' });
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Modifier le produit' : 'Nouveau produit'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} className="mb-4" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Bottle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de bouteille <span className="text-red-500">*</span>
              </label>
              <select
                name="bottleType"
                value={formData.bottleType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
                disabled={isEdit}
              >
                {BOTTLE_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
              {isEdit && <p className="text-xs text-gray-500 mt-1">Le type ne peut pas être modifié</p>}
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marque <span className="text-red-500">*</span>
              </label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
                disabled={isEdit}
              >
                {BRANDS.map(brand => <option key={brand.value} value={brand.value}>{brand.label}</option>)}
              </select>
              {isEdit && <p className="text-xs text-gray-500 mt-1">La marque ne peut pas être modifiée</p>}
            </div>

            {/* Price */}
            <Input
              label="Prix unitaire (FCFA)"
              name="price"
              type="number"
              placeholder="6000"
              value={formData.price}
              onChange={handleChange}
              error={errors.price}
              min="0"
              step="100"
              required
            />

            {/* Quantity */}
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

            {/* Product Image */}
            <Input
              label="URL de l'image (optionnel)"
              name="productImage"
              type="url"
              placeholder="https://exemple.com/image.jpg"
              value={formData.productImage}
              onChange={handleChange}
              helpText="URL d'une image du produit"
            />
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button variant="primary" fullWidth loading={loading} onClick={handleSubmit}>
              {isEdit ? 'Mettre à jour' : 'Créer le produit'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductFormModal;
