// ==========================================
// FICHIER: src/components/client/ReviewModal.jsx
// Modal d'avis avec couleurs FasoGaz
// ==========================================
import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import Button from '../common/Button';
import { formatPrice } from '../../utils/helpers';

const ReviewModal = ({ order, onClose, onSubmit, loading }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Veuillez sélectionner une note');
      return;
    }

    onSubmit({
      orderId: order.id,
      rating,
      comment: comment.trim() || null
    });
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header avec gradient */}
        <div className="sticky top-0 gradient-gazbf px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between text-white">
            <h3 className="text-xl font-bold">
              Donner un avis
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info commande */}
          <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-4 border-2 border-neutral-200">
            <p className="text-sm text-neutral-600 mb-1 font-medium">Commande #{order.orderNumber}</p>
            <p className="font-bold text-neutral-900 mb-3 text-lg">
              {order.seller?.businessName}
            </p>
            <div className="text-sm text-neutral-700 space-y-2">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {item.product?.brand} {item.product?.bottleType} x{item.quantity}
                  </span>
                  <span className="font-bold">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-neutral-200 mt-3 pt-3">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-neutral-700">Total</span>
                <span className="font-bold text-primary-600 text-lg">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-3">
              Votre note <span className="text-primary-600">*</span>
            </label>
            <div className="flex gap-2 justify-center bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-4 border-2 border-primary-100">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={loading}
                  className="focus:outline-none transition-transform hover:scale-125 disabled:opacity-50"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-secondary-400 text-secondary-500'
                        : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-center text-neutral-700 mt-3 font-bold">
                {getRatingLabel(rating)}
              </p>
            )}
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              Votre avis (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience avec ce revendeur..."
              rows={4}
              maxLength={500}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-neutral-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 resize-none disabled:bg-neutral-50 disabled:text-neutral-500 transition-all"
            />
            <p className="text-xs text-neutral-500 mt-1">
              {comment.length}/500 caractères
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t-2 border-neutral-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="gradient"
              fullWidth
              loading={loading}
              disabled={rating === 0}
            >
              {loading ? 'Publication...' : 'Publier mon avis'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;