// ==========================================
// FICHIER: src/components/seller/SubscriptionRequired.jsx
// Composant de blocage pour les pages revendeur sans abonnement
// ==========================================
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CreditCard, Clock, Gift, TrendingUp, CheckCircle } from 'lucide-react';
import Button from '../common/Button';

const SubscriptionRequired = ({ 
  accessStatus = null,
  pricingConfig = null 
}) => {
  const navigate = useNavigate();

  // Si le système est désactivé, ne rien afficher
  if (!pricingConfig?.isActive) {
    return null;
  }

  // Si l'utilisateur a un accès actif, ne rien afficher
  if (accessStatus?.hasAccess) {
    return null;
  }

  const handleSubscribe = () => {
    navigate('/seller/subscription');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        
        {/* Card principale */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header avec icône */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-8 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="h-10 w-10 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🔒 Abonnement requis
            </h1>
            <p className="text-orange-100 text-lg">
              Votre accès a expiré. Renouvelez pour continuer.
            </p>
          </div>

          {/* Contenu */}
          <div className="p-8">
            
            {/* Message d'information */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    Votre période d'accès est terminée
                  </h3>
                  <p className="text-yellow-800 text-sm mb-3">
                    Pour continuer à utiliser votre espace revendeur et rester visible sur la carte, 
                    vous devez souscrire à un abonnement.
                  </p>
                  <ul className="text-yellow-800 text-sm space-y-1">
                    <li>• Votre dépôt n'est plus visible par les clients</li>
                    <li>• Vous ne pouvez plus gérer vos produits et commandes</li>
                    <li>• Vos statistiques sont désactivées</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Avantages de l'abonnement */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                🎯 Ce que vous retrouverez avec un abonnement
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: <TrendingUp className="h-8 w-8 text-green-600" />,
                    title: 'Visibilité maximale',
                    description: 'Votre dépôt apparaît sur la carte interactive consultée par des milliers de clients'
                  },
                  {
                    icon: <CheckCircle className="h-8 w-8 text-blue-600" />,
                    title: 'Gestion complète',
                    description: 'Gérez vos produits, commandes, clients et statistiques en temps réel'
                  },
                  {
                    icon: <CreditCard className="h-8 w-8 text-purple-600" />,
                    title: 'Paiements sécurisés',
                    description: 'Recevez les commandes et paiements directement via la plateforme'
                  },
                  {
                    icon: <Gift className="h-8 w-8 text-orange-600" />,
                    title: 'Outils marketing',
                    description: 'Avis clients et notifications pour booster vos ventes'
                  }
                ].map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Période d'essai gratuite (si disponible) */}
            {pricingConfig?.freeTrialDays > 0 && !accessStatus?.freeTrialUsed && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Gift className="h-8 w-8 text-purple-600" />
                  <h3 className="text-xl font-bold text-purple-900">
                    🎁 Essai gratuit disponible !
                  </h3>
                </div>
                <p className="text-purple-800 mb-4">
                  Profitez de <strong>{pricingConfig.freeTrialDays} jours d'essai gratuit</strong> pour 
                  tester toutes les fonctionnalités premium sans engagement.
                </p>
                <div className="flex items-center gap-2 text-sm text-purple-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>Aucune carte bancaire requise</span>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="text-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubscribe}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-12 py-4 text-lg font-semibold shadow-xl"
              >
                <CreditCard className="h-6 w-6 mr-3" />
                Voir les plans d'abonnement
              </Button>
              
              <p className="text-sm text-gray-500 mt-4">
                Abonnement accessible à tout le monde • Annulation possible à tout moment
              </p>
            </div>

            {/* Support */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Une question ? Besoin d'aide ?{' '}
                <a 
                  href="mailto:support@fasogaz.com" 
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Contactez notre support
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Information supplémentaire */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            💡 <strong>Astuce :</strong> Plus de 80% de nos revendeurs constatent une augmentation 
            de leurs ventes dans les 30 premiers jours
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRequired;