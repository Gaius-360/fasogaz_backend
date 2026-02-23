// ==========================================
// FICHIER: src/pages/client/Reviews.jsx (NOUVEAU)
// ==========================================
import React, { useState, useEffect } from 'react';
import { Star, Loader2, MessageSquare, Calendar } from 'lucide-react';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import { formatDate } from '../../utils/helpers';

const Reviews = () => {
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [alert, setAlert] = useState(null);

  // Données de démonstration
  const demoReviews = [
    {
      id: 1,
      sellerName: 'Dépôt Wend Konta',
      rating: 5,
      comment: 'Excellent service, livraison rapide !',
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      sellerName: 'Gaz Express',
      rating: 4,
      comment: 'Bon prix et produits de qualité',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  useEffect(() => {
    // Simuler le chargement
    setTimeout(() => {
      setReviews(demoReviews);
      setLoading(false);
    }, 500);
  }, []);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${
          index < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Mes Avis
        </h1>
        <p className="text-gray-600">
          {reviews.length} avis laissé{reviews.length > 1 ? 's' : ''}
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun avis
            </h3>
            <p className="text-gray-600">
              Vous n'avez pas encore laissé d'avis
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {review.sellerName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-sm text-gray-500">
                      {review.rating}/5
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(review.createdAt)}</span>
                </div>
              </div>

              {review.comment && (
                <p className="text-gray-700 bg-gray-50 rounded-lg p-4">
                  "{review.comment}"
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
