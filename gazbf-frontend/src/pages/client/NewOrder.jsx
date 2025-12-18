// ==========================================
// FICHIER: src/pages/client/NewOrder.jsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import AddressSelector from '../../components/client/AddressSelector';
import Input from '../../components/common/Input';
import orderService from '../../api/orderService';
import addressService from '../../api/addressService';
import { formatPrice } from '../../utils/helpers';

const NewOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { seller, products } = location.state || {};

  const [step, setStep] = useState(1); // 1: Mode, 2: Adresse, 3: Confirmation
  const [deliveryMode, setDeliveryMode] = useState('pickup');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [customerNote, setCustomerNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    if (!seller || !products || products.length === 0) {
      navigate('/client/map');
    }
  }, [seller, products, navigate]);

  if (!seller || !products) {
    return null;
  }

  const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const deliveryFee = deliveryMode === 'delivery' ? (seller.deliveryFee || 0) : 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async () => {
    if (deliveryMode === 'delivery' && !selectedAddressId) {
      setAlert({
        type: 'error',
        message: 'Veuillez sélectionner une adresse de livraison'
      });
      return;
    }

    setLoading(true);
    setAlert(null);

    try {
      const orderData = {
        sellerId: seller.id,
        items: products.map(p => ({
          productId: p.id,
          quantity: p.quantity
        })),
        deliveryMode,
        deliveryAddressId: deliveryMode === 'delivery' ? selectedAddressId : null,
        customerNote: customerNote.trim() || null
      };

      const response = await orderService.createOrder(orderData);

      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Commande envoyée avec succès !'
        });

        setTimeout(() => {
          navigate('/client/orders');
        }, 1500);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors de la création de la commande'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle commande</h1>
          <p className="text-gray-600">{seller.businessName}</p>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-1 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Mode de livraison */}
      {step === 1 && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Mode de récupération
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setDeliveryMode('pickup')}
              className={`p-6 rounded-lg border-2 transition-colors ${
                deliveryMode === 'pickup'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Package className="h-12 w-12 mx-auto mb-3 text-primary-600" />
              <h3 className="font-semibold text-lg mb-2">Retrait sur place</h3>
              <p className="text-sm text-gray-600">
                Je viens chercher ma commande
              </p>
              <p className="text-sm font-medium text-primary-600 mt-2">
                Gratuit
              </p>
            </button>

            <button
              onClick={() => setDeliveryMode('delivery')}
              disabled={!seller.deliveryAvailable}
              className={`p-6 rounded-lg border-2 transition-colors ${
                deliveryMode === 'delivery'
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${!seller.deliveryAvailable && 'opacity-50 cursor-not-allowed'}`}
            >
              <MapPin className="h-12 w-12 mx-auto mb-3 text-secondary-600" />
              <h3 className="font-semibold text-lg mb-2">Livraison à domicile</h3>
              <p className="text-sm text-gray-600">
                Le revendeur livre chez moi
              </p>
              {seller.deliveryAvailable ? (
                <p className="text-sm font-medium text-secondary-600 mt-2">
                  {seller.deliveryFee > 0 ? formatPrice(seller.deliveryFee) : 'Gratuit'}
                </p>
              ) : (
                <p className="text-sm text-red-600 mt-2">
                  Non disponible
                </p>
              )}
            </button>
          </div>

          <div className="mt-6">
            <Button
              variant="primary"
              fullWidth
              onClick={() => setStep(2)}
            >
              Continuer
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Adresse (si livraison) */}
      {step === 2 && (
        <Card>
          {deliveryMode === 'delivery' ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Adresse de livraison
              </h2>
              <AddressSelector
                selectedAddressId={selectedAddressId}
                onSelectAddress={setSelectedAddressId}
                onAddNew={() => setShowAddressForm(true)}
              />
            </>
          ) : (
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Retrait sur place
              </h2>
              <p className="text-gray-600 mb-2">
                {seller.businessName}
              </p>
              <p className="text-sm text-gray-500">
                {seller.quarter}, {seller.city}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
            >
              Retour
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => setStep(3)}
              disabled={deliveryMode === 'delivery' && !selectedAddressId}
            >
              Continuer
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Récapitulatif de la commande
            </h2>

            {/* Produits */}
            <div className="space-y-3 mb-6">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between py-3 border-b">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {product.brand} - {product.bottleType}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(product.price)} x {product.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatPrice(product.price * product.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Mode */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Mode de récupération
              </p>
              <p className="text-gray-900">
                {deliveryMode === 'delivery' ? '🚚 Livraison à domicile' : '📦 Retrait sur place'}
              </p>
            </div>

            {/* Note optionnelle */}
            <div>
              <Input
                label="Note (optionnel)"
                placeholder="Ex: Urgent, pour ce soir SVP"
                value={customerNote}
                onChange={(e) => setCustomerNote(e.target.value)}
                helpText="Ajoutez des précisions pour le revendeur"
              />
            </div>
          </Card>

          {/* Total */}
          <Card>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Frais de livraison</span>
                  <span className="font-medium">{formatPrice(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-2xl text-primary-600">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
              >
                Retour
              </Button>
              <Button
                variant="primary"
                fullWidth
                loading={loading}
                onClick={handleSubmit}
              >
                Envoyer la commande
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NewOrder;
