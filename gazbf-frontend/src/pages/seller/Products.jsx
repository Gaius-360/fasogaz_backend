// ==========================================
// FICHIER: src/pages/seller/Products.jsx (COMPLET)
// ==========================================
import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import ProductCard from '../../components/seller/ProductCard';
import ProductFormModal from '../../components/seller/ProductFormModal';
import { api } from '../../api/apiSwitch';

const Products = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [alert, setAlert] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.seller.getMyProducts();
      if (response.success) {
        setProducts(response.data.products);
        setStats(response.data.stats);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des produits'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Supprimer ${product.brand} ${product.bottleType} ?`)) {
      return;
    }

    try {
      const response = await api.seller.deleteProduct(product.id);
      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Produit supprimé avec succès'
        });
        loadProducts();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors de la suppression'
      });
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Gestion du Stock
          </h1>
          <p className="text-gray-600">
            {products.length} produit(s) dans votre catalogue
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Ajouter un produit
        </Button>
      </div>

      {/* Stats rapides */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600 mb-1">Total produits</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600 mb-1">Disponibles</p>
            <p className="text-2xl font-bold text-green-600">{stats.available}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600 mb-1">Stock limité</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.limited}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600 mb-1">Rupture</p>
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
          </div>
        </div>
      )}

      {/* Liste des produits */}
      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun produit
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez par ajouter des produits à votre catalogue
          </p>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <Plus className="h-5 w-5 mr-2" />
            Ajouter mon premier produit
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal formulaire */}
      {showForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={handleCloseForm}
          onSuccess={() => {
            loadProducts();
            handleCloseForm();
          }}
        />
      )}
    </div>
  );
};

export default Products;
