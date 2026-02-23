// ==========================================
// FICHIER: src/pages/client/MyReviews.jsx
// Page pour voir tous les avis donnés par le client
// ==========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Loader2, MessageCircle, ArrowLeft } from 'lucide-react';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import { formatDate, formatPrice } from '../../utils/helpers';
import { api } from '../../api/apiSwitch';

const MyReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await api.reviews.getMyReviews();
      console.log('📝 Mes avis:', response);
      setReviews(response.data || []);
    } catch (error) {
      console.error('❌ Erreur chargement avis:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors du chargement'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: 'Très décevant',
      2: 'Décevant',
      3: 'Moyen',
      4: 'Bien',
      5: 'Excellent'
    };
    return labels[rating] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de vos avis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Mes Avis
          </h1>
          <p className="text-gray-600">
            {reviews.length} avis donné{reviews.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Liste des avis */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun avis pour le moment
          </h3>
          <p className="text-gray-600 mb-6">
            Vous pourrez donner un avis après avoir reçu vos commandes
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/client/orders')}
          >
            Voir mes commandes
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
              {/* En-tête avec info revendeur */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1">
                      {review.seller?.businessName || 'Revendeur'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Commande #{review.order?.orderNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Avis donné le {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    {renderStars(review.rating)}
                    <p className="text-xs text-gray-600 mt-1">
                      {getRatingLabel(review.rating)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Mon avis */}
                {review.comment && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Mon avis :
                    </p>
                    <p className="text-gray-900 leading-relaxed bg-gray-50 rounded-lg p-4 border">
                      "{review.comment}"
                    </p>
                  </div>
                )}

                {!review.comment && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 italic">
                      Vous n'avez pas laissé de commentaire
                    </p>
                  </div>
                )}

                {/* Réponse du revendeur */}
                {review.sellerResponse ? (
                  <div className="bg-primary-50 border-l-4 border-primary-600 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-primary-900 mb-2">
                          Réponse du revendeur
                        </p>
                        <p className="text-primary-800 leading-relaxed">
                          {review.sellerResponse}
                        </p>
                        <p className="text-xs text-primary-600 mt-2">
                          Répondu le {formatDate(review.respondedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <MessageCircle className="h-4 w-4" />
                      <p className="text-sm">
                        Le revendeur n'a pas encore répondu
                      </p>
                    </div>
                  </div>
                )}

                {/* Info commande */}
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>Commande du {formatDate(review.order?.createdAt)}</p>
                    {review.order?.total && (
                      <p className="font-medium text-gray-900 mt-1">
                        Total : {formatPrice(review.order.total)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/client/orders`)}
                  >
                    Voir la commande
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bouton retour en bas */}
      {reviews.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => navigate('/client/orders')}
          >
            Retour aux commandes
          </Button>
        </div>
      )}
    </div>
  );
};

export default MyReviews;