// ==========================================
// FICHIER: src/components/seller/SellerAccessBanner.jsx
// Bannière d'information sur le statut d'accès
// ==========================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, Gift, Zap, CreditCard } from 'lucide-react';
import Button from '../common/Button';

const SellerAccessBanner = ({ accessStatus, pricingConfig }) => {
  const navigate = useNavigate();

  // Ne rien afficher si le système est désactivé
  if (!pricingConfig?.isActive) {
    return null;
  }

  // Ne rien afficher si pas d'accès actif
  if (!accessStatus?.hasAccess) {
    return null;
  }

  // Période d'essai gratuite
  if (accessStatus.type === 'free_trial') {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gift className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-purple-900 mb-1">
                🎁 Période d'essai gratuite
              </h3>
              <p className="text-sm text-purple-800 mb-2">
                Vous profitez actuellement de <strong>{pricingConfig.freeTrialDays} jours d'essai gratuit</strong>. 
                Plus que <strong className="text-purple-600">{accessStatus.daysRemaining} jours</strong> pour 
                tester toutes les fonctionnalités.
              </p>
              <div className="flex items-center gap-2 text-xs text-purple-700">
                <Clock className="h-3 w-3" />
                <span>Expire le {new Date(accessStatus.endDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/seller/subscription')}
            className="border-purple-300 text-purple-700 hover:bg-purple-100 flex-shrink-0"
          >
            Voir les plans
          </Button>
        </div>
      </div>
    );
  }

  // Période de grâce (urgent)
  if (accessStatus.type === 'grace_period') {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-300 rounded-xl p-4 mb-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-orange-900 mb-1">
                ⚠️ Période de grâce - Action requise
              </h3>
              <p className="text-sm text-orange-800 mb-2">
                Votre abonnement a expiré ! Il vous reste <strong className="text-orange-600">{accessStatus.daysRemaining} jours</strong> pour 
                renouveler sans perdre votre visibilité et vos données.
              </p>
              <div className="bg-orange-100 rounded-lg p-2 text-xs text-orange-800 mb-2">
                ⏰ Après cette période, votre dépôt ne sera plus visible et vous perdrez l'accès à vos statistiques
              </div>
              <div className="flex items-center gap-2 text-xs text-orange-700">
                <Clock className="h-3 w-3" />
                <span>Expire le {new Date(accessStatus.endDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/seller/subscription')}
            className="bg-orange-600 hover:bg-orange-700 flex-shrink-0"
          >
            <CreditCard className="h-4 w-4 mr-1" />
            Renouveler
          </Button>
        </div>
      </div>
    );
  }

  // Abonnement actif avec avertissement si proche de l'expiration
  if (accessStatus.type === 'active_subscription') {
    const isExpiringSoon = accessStatus.daysRemaining <= 7;

    return (
      <div className={`rounded-xl p-4 mb-6 border-2 ${
        isExpiringSoon 
          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300'
          : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isExpiringSoon ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              {isExpiringSoon ? (
                <Clock className="h-5 w-5 text-yellow-600" />
              ) : (
                <Zap className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-bold mb-1 ${
                isExpiringSoon ? 'text-yellow-900' : 'text-green-900'
              }`}>
                {isExpiringSoon ? '⏰ Abonnement expire bientôt' : '✅ Abonnement actif'}
              </h3>
              <p className={`text-sm mb-2 ${
                isExpiringSoon ? 'text-yellow-800' : 'text-green-800'
              }`}>
                {isExpiringSoon ? (
                  <>
                    Votre abonnement expire dans <strong className="text-yellow-600">{accessStatus.daysRemaining} jours</strong>. 
                    Renouvelez maintenant pour éviter toute interruption.
                  </>
                ) : (
                  <>
                    Votre dépôt est visible sur la carte. Encore <strong>{accessStatus.daysRemaining} jours</strong> d'accès.
                  </>
                )}
              </p>
              <div className={`flex items-center gap-2 text-xs ${
                isExpiringSoon ? 'text-yellow-700' : 'text-green-700'
              }`}>
                <Clock className="h-3 w-3" />
                <span>Expire le {new Date(accessStatus.endDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
          {isExpiringSoon && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/seller/subscription')}
              className="bg-yellow-600 hover:bg-yellow-700 flex-shrink-0"
            >
              Renouveler
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default SellerAccessBanner;