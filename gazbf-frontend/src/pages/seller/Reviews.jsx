// ==========================================
// FICHIER: src/pages/seller/Reviews.jsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { Star, Loader2, MessageCircle } from 'lucide-react';
import Alert from '../../components/common/Alert';
import { formatDate } from '../../utils/helpers';
import { api } from '../../api/apiSwitch';

const Reviews = () => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await api.seller.getReceivedReviews();
      if (response.success) {
        setReviews(response.data.reviews);
        setStats(response.data.stats);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des avis'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Avis Clients
        </h1>
        <p className="text-gray-600">
          {reviews.length} avis reçu{reviews.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Note moyenne</h3>
              <div className="text-4xl font-bold text-yellow-600">
                {stats.average || '0.0'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {renderStars(Math.round(parseFloat(stats.average || 0)))}
              <span className="text-sm text-gray-600">
                ({stats.total} avis)
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: stats.total > 0
                          ? `${(stats.distribution[rating] / stats.total) * 100}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {stats.distribution[rating]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Liste des avis */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun avis pour le moment
          </h3>
          <p className="text-gray-600">
            Les avis apparaîtront ici après les commandes complétées
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {review.customer?.firstName} {review.customer?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-700 mb-3">{review.comment}</p>
              )}

              <div className="text-xs text-gray-500">
                Commande #{review.order?.orderNumber}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
