import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Package, Loader2, AlertCircle, Plus, Navigation } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import AddAddressModal from '../../components/client/AddAddressModal';
import { api } from '../../api/apiSwitch';
import { formatPrice } from '../../utils/helpers';
import useClientStore from '../../store/clientStore';

const CreateOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { seller, products } = location.state || {};

  const { createOrder } = useClientStore();

  const [deliveryMode, setDeliveryMode] = useState('pickup');
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (!seller || !products || products.length === 0) {
      navigate('/client/map');
      return;
    }
    if (deliveryMode === 'delivery') {
      loadAddresses();
    }
  }, [deliveryMode]);

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const response = await api.addresses.getMyAddresses();
      if (response.success) {
        setAddresses(response.data);
        const defaultAddr = response.data.find(a => a.isDefault);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr.id);
        } else if (response.data.length > 0) {
          setSelectedAddress(response.data[0].id);
        }
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des adresses'
      });
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSubmitOrder = async () => {
    setAlert(null);

    if (deliveryMode === 'delivery' && !selectedAddress) {
      setAlert({
        type: 'error',
        message: 'Veuillez sélectionner une adresse de livraison'
      });
      return;
    }

    // ✅ Vérifier que l'adresse a des coordonnées GPS
    if (deliveryMode === 'delivery') {
      const address = addresses.find(a => a.id === selectedAddress);
      if (!address?.latitude || !address?.longitude) {
        setAlert({
          type: 'error',
          message: 'L\'adresse sélectionnée n\'a pas de coordonnées GPS. Veuillez la modifier.'
        });
        return;
      }
    }

    setLoading(true);

    try {
      const orderData = {
        sellerId: seller.id,
        items: products.map(p => ({
          productId: p.id,
          quantity: p.quantity
        })),
        deliveryMode,
        deliveryAddressId: deliveryMode === 'delivery' ? selectedAddress : null,
        customerNote: customerNote.trim() || null
      };

      const response = await createOrder(orderData);

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
        message: error.response?.data?.message || 'Erreur lors de la commande'
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper pour formater les coordonnées
  const formatCoordinate = (value) => {
    if (!value) return null;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? null : num.toFixed(6);
  };

  if (!seller || !products) {
    return null;
  }

  const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

// ✅ sécuriser le prix de livraison
const deliveryFee =
  deliveryMode === 'delivery'
    ? Number(seller.deliveryFee || 0)
    : 0;

// ✅ total = gaz + livraison
const total = Number(subtotal) + Number(deliveryFee);


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finaliser la commande</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mode de livraison */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Mode de récupération
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setDeliveryMode('pickup')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  deliveryMode === 'pickup'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Package className="h-6 w-6 text-primary-600" />
                  <span className="font-semibold">Retrait sur place</span>
                </div>
                <p className="text-sm text-gray-600">
                  Je viens chercher ma commande
                </p>
                <p className="text-sm font-medium text-green-600 mt-2">
                  Gratuit
                </p>
              </button>

              <button
                onClick={() => setDeliveryMode('delivery')}
                disabled={!seller.deliveryAvailable}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  deliveryMode === 'delivery'
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${!seller.deliveryAvailable && 'opacity-50 cursor-not-allowed'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-6 w-6 text-primary-600" />
                  <span className="font-semibold">Livraison à domicile</span>
                </div>
                <p className="text-sm text-gray-600">
                  {seller.deliveryAvailable
                    ? 'Le revendeur livre chez moi'
                    : 'Non disponible'}
                </p>
                {seller.deliveryAvailable && (
                  <p className="text-sm font-medium text-primary-600 mt-2">
                    {deliveryFee > 0 ? formatPrice(deliveryFee) : 'Gratuit'}
                  </p>
                )}
              </button>
            </div>
          </Card>

          {/* Adresse de livraison */}
          {deliveryMode === 'delivery' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Adresse de livraison
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddressModal(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvelle
                </Button>
              </div>

              {loadingAddresses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    Aucune adresse enregistrée
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => setShowAddressModal(true)}
                  >
                    Ajouter une adresse
                  </Button>
                </div>
              ) : (
                <>
                  {/* ✅ Info GPS */}
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Navigation className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-800">
                        <strong>Position GPS requise :</strong> Le revendeur recevra vos coordonnées GPS exactes pour une livraison précise.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {addresses.map((address) => {
                      const hasGPS = address.latitude && address.longitude;
                      
                      return (
                        <button
                          key={address.id}
                          onClick={() => setSelectedAddress(address.id)}
                          className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                            selectedAddress === address.id
                              ? 'border-primary-600 bg-primary-50'
                              : hasGPS 
                                ? 'border-gray-300 hover:border-gray-400' 
                                : 'border-yellow-300 bg-yellow-50'
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-gray-900">
                                    {address.label}
                                  </p>
                                  {address.isDefault && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                      Par défaut
                                    </span>
                                  )}
                                  {hasGPS ? (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                                      <Navigation className="h-3 w-3" />
                                      GPS
                                    </span>
                                  ) : (
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      Sans GPS
                                    </span>
                                  )}
                                </div>
                                
                                <p className="text-sm text-gray-600">
                                  {address.fullAddress}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {address.quarter}, {address.city}
                                </p>

                                {address.additionalInfo && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    💡 {address.additionalInfo}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* ✅ Coordonnées GPS */}
                            {hasGPS && (
                              <div className="pt-3 border-t border-gray-200">
                                <div className="bg-white rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Navigation className="h-4 w-4 text-green-600" />
                                    <span className="text-xs font-semibold text-gray-700">
                                      Coordonnées GPS
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-500">Lat:</span>
                                      <p className="font-mono text-gray-900">
                                        {formatCoordinate(address.latitude)}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Long:</span>
                                      <p className="font-mono text-gray-900">
                                        {formatCoordinate(address.longitude)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* ✅ Avertissement si pas de GPS */}
                            {!hasGPS && (
                              <div className="pt-3 border-t border-yellow-200">
                                <div className="bg-yellow-100 rounded-lg p-3">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-yellow-800">
                                      <p className="font-semibold mb-1">
                                        Position GPS manquante
                                      </p>
                                      <p>
                                        Cette adresse n'a pas de coordonnées GPS. 
                                        Modifiez-la pour ajouter votre position.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
          )}

          {/* Note */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Note pour le revendeur (optionnel)
            </h2>
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="Ex: Urgent, pour ce soir..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              {customerNote.length}/200 caractères
            </p>
          </Card>
        </div>

        {/* Récapitulatif */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Récapitulatif
            </h2>

            <div className="space-y-3 mb-4 pb-4 border-b">
              {products.map((product) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {product.brand} {product.bottleType} x{product.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPrice(product.price * product.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-4 pb-4 border-b">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Livraison</span>
                  <span className="font-medium">{formatPrice(deliveryFee)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Total</span>
              <span className="text-primary-600">{formatPrice(total)}</span>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={handleSubmitOrder}
              loading={loading}
            >
              {deliveryMode === 'pickup' ? 'Confirmer la réservation' : 'Confirmer la commande'}
            </Button>
          </Card>
        </div>
      </div>

      {/* Modal ajout adresse */}
      {showAddressModal && (
        <AddAddressModal
          onClose={() => setShowAddressModal(false)}
          onSuccess={() => {
            loadAddresses();
            setShowAddressModal(false);
          }}
        />
      )}
    </div>
  );
};

export default CreateOrder;