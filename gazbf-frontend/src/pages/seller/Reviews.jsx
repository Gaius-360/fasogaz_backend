// ==========================================
// FICHIER: src/pages/seller/Reviews.jsx (AVEC CONTRÔLE D'ACCÈS)
// ==========================================
import React, { useState, useEffect } from 'react';
import { Star, Loader2, MessageCircle } from 'lucide-react';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils/helpers';
import useSellerStore from '../../store/sellerStore';
import useSellerAccess from '../../hooks/useSellerAccess';
import SubscriptionRequired from '../../components/seller/SubscriptionRequired';
import SellerAccessBanner from '../../components/seller/SellerAccessBanner';

const Reviews = () => {
  const { 
    reviews, 
    loading: reviewsLoading, 
    error, 
    fetchMyReviews, 
    respondToReview,
    clearError 
  } = useSellerStore();

  const { loading: accessLoading, accessStatus, pricingConfig, hasAccess, needsSubscription } = useSellerAccess();

  const [stats, setStats] = useState(null);
  const [alert, setAlert] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hasAccess && !accessLoading) {
      loadReviews();
    }
  }, [hasAccess, accessLoading]);

  useEffect(() => {
    if (error) {
      setAlert({
        type: 'error',
        message: error
      });
      clearError();
    }
  }, [error]);

  useEffect(() => {
    if (reviews.length > 0) {
      calculateStats();
    }
  }, [reviews]);

  const loadReviews = async () => {
    try {
      await fetchMyReviews();
    } catch (err) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des avis'
      });
    }
  };

  const calculateStats = () => {
    const total = reviews.length;
    const average = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

    const distribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    setStats({ total, average, distribution });
  };

  const handleRespond = (review) => {
    setRespondingTo(review);
    setResponse(review.sellerResponse || '');
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      setAlert({
        type: 'error',
        message: 'La réponse ne peut pas être vide'
      });
      return;
    }

    setSubmitting(true);
    try {
      await respondToReview(respondingTo.id, response);
      
      setAlert({
        type: 'success',
        message: 'Réponse ajoutée avec succès'
      });
      setRespondingTo(null);
      setResponse('');
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Erreur lors de l\'envoi'
      });
    } finally {
      setSubmitting(false);
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

  // Afficher le loader pendant la vérification de l'accès
  if (accessLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary-600 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-600">Vérification de votre accès...</p>
        </div>
      </div>
    );
  }

  // Afficher l'écran de blocage si pas d'accès
  if (needsSubscription) {
    return (
      <SubscriptionRequired 
        accessStatus={accessStatus}
        pricingConfig={pricingConfig}
      />
    );
  }

  if (reviewsLoading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-600" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="space-y-4 sm:space-y-6">
        {/* Bannière de statut d'accès */}
        <SellerAccessBanner 
          accessStatus={accessStatus}
          pricingConfig={pricingConfig}
        />

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Avis Clients
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {reviews.length} avis reçu{reviews.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* ==========================================
            STATISTIQUES AVEC COULEURS DÉGRADÉES
            ========================================== */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Note moyenne */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border-2 border-yellow-300 p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base sm:text-lg text-yellow-900">⭐ Note moyenne</h3>
                <div className="text-3xl sm:text-4xl font-bold text-yellow-600">
                  {stats.average.toFixed(1)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {renderStars(Math.round(stats.average))}
                <span className="text-xs sm:text-sm text-yellow-700 font-medium">
                  ({stats.total} avis)
                </span>
              </div>
            </div>

            {/* Distribution */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300 p-4 sm:p-6 shadow-sm">
              <h3 className="font-bold text-base sm:text-lg text-blue-900 mb-4">📊 Distribution</h3>
              <div className="space-y-2 sm:space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm text-blue-700 font-semibold w-6 sm:w-8">{rating}★</span>
                    <div className="flex-1 bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: stats.total > 0
                            ? `${(stats.distribution[rating] / stats.total) * 100}%`
                            : '0%'
                        }}
                      ></div>
                    </div>
                    <span className="text-xs sm:text-sm text-blue-700 font-semibold w-6 sm:w-8 text-right">
                      {stats.distribution[rating]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border-2 border-neutral-200 p-8 sm:p-12 text-center">
            <MessageCircle className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Aucun avis pour le moment
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              Les avis apparaîtront ici après les commandes complétées
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border-2 border-neutral-200 p-4 sm:p-6 shadow-sm hover:border-neutral-300 transition-colors">
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                      {review.customer?.firstName} {review.customer?.lastName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {renderStars(review.rating)}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 bg-gradient-to-br from-gray-50 to-neutral-50 rounded-lg p-3 sm:p-4 border border-neutral-200">
                    "{review.comment}"
                  </p>
                )}

                {review.sellerResponse ? (
                  <div className="bg-gradient-to-br from-secondary-50 to-accent-50 border-l-4 border-secondary-600 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm font-bold text-secondary-900 mb-1 sm:mb-2">
                      💬 Votre réponse :
                    </p>
                    <p className="text-xs sm:text-sm text-secondary-800">
                      {review.sellerResponse}
                    </p>
                    <p className="text-xs text-secondary-600 mt-2">
                      {formatDate(review.respondedAt)}
                    </p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRespond(review)}
                    className="text-xs sm:text-sm"
                  >
                    💬 Répondre à cet avis
                  </Button>
                )}

                <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-neutral-200">
                  📦 Commande #{review.order?.orderNumber}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==========================================
            MODAL DE RÉPONSE
            ========================================== */}
        {respondingTo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                💬 Répondre à l'avis
              </h3>
              
              {/* Aperçu de l'avis */}
              <div className="mb-4 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-neutral-50 rounded-lg border-2 border-neutral-200">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(respondingTo.rating)}
                </div>
                <p className="text-xs sm:text-sm text-gray-700">
                  {respondingTo.comment}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Par {respondingTo.customer?.firstName} {respondingTo.customer?.lastName}
                </p>
              </div>

              {/* Zone de texte */}
              <div className="mb-4">
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Écrivez votre réponse..."
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 text-sm sm:text-base transition-all"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {response.length}/500 caractères
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRespondingTo(null);
                    setResponse('');
                  }}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSubmitResponse}
                  loading={submitting}
                >
                  Envoyer la réponse
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;