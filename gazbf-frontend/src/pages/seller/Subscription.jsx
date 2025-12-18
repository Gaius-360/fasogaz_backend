// ==========================================
// FICHIER: src/pages/seller/Subscription.jsx
// ==========================================
import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Loader2, Clock, AlertCircle, Calendar, Zap } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import { formatDate, formatPrice } from '../../utils/helpers';

const SellerSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPlans, setShowPlans] = useState(false);
  const [alert, setAlert] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
  api.subscriptions.getMySubscription(),
  api.subscriptions.getPlans('revendeur')
]);

      if (subRes.success) {
        setSubscription(subRes.data);
      }

      if (plansRes.success) {
        setPlans(plansRes.data);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement'
      });
    } finally {
      setLoading(false);
      setLoadingSubscription(false);
    }
  };

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);
    setAlert(null);
    setProcessingPayment(true);

    try {
      const response = await api.subscriptions.createSubscription({
        planId: plan.id
      });

      if (response.success) {
        const { transactionRef, paymentUrl } = response.data;

        setAlert({
          type: 'info',
          message: `Redirection vers le paiement... Réf: ${transactionRef}`
        });

        // Simulation: Confirmer après 2 secondes
        setTimeout(async () => {
          try {
            const confirmRes = await api.subscriptions.confirmPayment(
              transactionRef,
              `EXT-${Date.now()}`
            );

            if (confirmRes.success) {
              setAlert({
                type: 'success',
                message: 'Abonnement activé avec succès !'
              });
              loadData();
              setShowPlans(false);
            }
          } catch (error) {
            setAlert({
              type: 'error',
              message: 'Erreur lors de la confirmation du paiement'
            });
          } finally {
            setProcessingPayment(false);
          }
        }, 2000);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors de la souscription'
      });
      setProcessingPayment(false);
    }
  };

  // Fonctionnalités spécifiques aux plans revendeur
  const getPlanFeatures = (planType) => {
    const features = {
      monthly: [
        '✅ Visibilité sur la carte pendant 30 jours',
        '✅ Gestion illimitée des produits',
        '✅ Réception illimitée de commandes',
        '✅ Statistiques détaillées',
        '✅ Gestion de la base clients',
        '✅ Support client prioritaire',
        '✅ Badge "Revendeur vérifié"'
      ],
      quarterly: [
        '✅ Visibilité sur la carte pendant 90 jours',
        '✅ Gestion illimitée des produits',
        '✅ Réception illimitée de commandes',
        '✅ Statistiques détaillées',
        '✅ Gestion de la base clients',
        '✅ Support client prioritaire',
        '✅ Badge "Revendeur vérifié"',
        '✅ Boost de visibilité (apparaître en 1er)',
        '💰 Économisez 15%'
      ],
      yearly: [
        '✅ Visibilité sur la carte pendant 365 jours',
        '✅ Gestion illimitée des produits',
        '✅ Réception illimitée de commandes',
        '✅ Statistiques détaillées avancées',
        '✅ Gestion de la base clients',
        '✅ Support client VIP 24/7',
        '✅ Badge "Revendeur Premium"',
        '✅ Boost de visibilité permanent',
        '✅ Outil de marketing intégré',
        '✅ Analyse des tendances',
        '💰 Économisez 30% + 2 mois offerts'
      ]
    };

    return features[planType] || [];
  };

  if (loadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-secondary-600 mx-auto mb-4" />
          <p className="text-gray-600">Vérification de votre abonnement...</p>
        </div>
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
          Mon Abonnement Professionnel
        </h1>
        <p className="text-gray-600">
          Gérez votre abonnement revendeur GAZBF
        </p>
      </div>

      {/* Abonnement actuel */}
      {subscription?.subscription ? (
        <Card>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Abonnement Actif
              </h2>
              <p className="text-gray-600">
                Plan {subscription.subscription.planType === 'monthly' ? 'Mensuel' :
                       subscription.subscription.planType === 'quarterly' ? 'Trimestriel' :
                       'Annuel'}
              </p>
            </div>
            {subscription.subscription.isActive ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Actif
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                Expiré
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Date de début</span>
              </div>
              <p className="font-semibold text-gray-900">
                {formatDate(subscription.subscription.startDate)}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Date d'expiration</span>
              </div>
              <p className="font-semibold text-gray-900">
                {formatDate(subscription.subscription.endDate)}
              </p>
            </div>
          </div>

          {subscription.status.willExpireSoon && (
            <Alert
              type="warning"
              title="Expiration proche"
              message={`Votre abonnement expire dans ${subscription.status.daysRemaining} jour(s). Renouvelez-le pour continuer à recevoir des commandes.`}
              className="mb-4"
            />
          )}

          {subscription.status.isExpired && (
            <Alert
              type="error"
              title="Abonnement expiré"
              message="Votre dépôt n'est plus visible sur la carte. Renouvelez votre abonnement pour continuer à recevoir des commandes."
              className="mb-4"
            />
          )}

          <Button
            variant="primary"
            fullWidth
            onClick={() => setShowPlans(!showPlans)}
          >
            {showPlans ? 'Masquer les plans' : 'Renouveler / Changer de plan'}
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-8">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Aucun abonnement actif
            </h2>
            <p className="text-gray-600 mb-6">
              Choisissez un plan pour que votre dépôt soit visible sur la carte
            </p>
            <Button
              variant="primary"
              onClick={() => setShowPlans(true)}
            >
              Voir les plans
            </Button>
          </div>
        </Card>
      )}

      {/* Plans disponibles */}
      {(showPlans || !subscription?.subscription?.isActive) && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">
            Plans Professionnels
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isPopular = plan.planType === 'quarterly';
              const isPremium = plan.planType === 'yearly';
              const features = getPlanFeatures(plan.planType);

              return (
                <Card 
                  key={plan.id} 
                  className={
                    isPremium ? 'border-2 border-secondary-600 relative' :
                    isPopular ? 'border-2 border-primary-600' : ''
                  }
                >
                  {isPremium && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-xs font-bold">
                        👑 MEILLEURE OFFRE
                      </span>
                    </div>
                  )}
                  
                  {isPopular && !isPremium && (
                    <div className="mb-4">
                      <span className="px-3 py-1 bg-primary-600 text-white rounded-full text-xs font-medium">
                        ⭐ Populaire
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.planType === 'monthly' ? 'Mensuel' :
                     plan.planType === 'quarterly' ? 'Trimestriel' :
                     'Annuel'}
                  </h3>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-600">
                      /{plan.planType === 'monthly' ? 'mois' :
                        plan.planType === 'quarterly' ? 'trimestre' :
                        'an'}
                    </span>
                    {plan.planType !== 'monthly' && (
                      <p className="text-sm text-green-600 mt-1">
                        {plan.planType === 'quarterly' ? 'Économisez 15%' : 'Économisez 30%'}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isPremium ? 'secondary' : isPopular ? 'primary' : 'outline'}
                    fullWidth
                    onClick={() => handleSelectPlan(plan)}
                    loading={processingPayment && selectedPlan?.id === plan.id}
                    disabled={processingPayment}
                  >
                    {isPremium ? '👑 Choisir Premium' : 'Choisir ce plan'}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Avantages de l'abonnement */}
      <Card className="bg-gradient-to-r from-secondary-50 to-primary-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          🎯 Pourquoi s'abonner ?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Visibilité maximale</p>
              <p className="text-sm text-gray-600">Votre dépôt apparaît sur la carte et dans les recherches</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Commandes en ligne</p>
              <p className="text-sm text-gray-600">Recevez et gérez les commandes depuis l'application</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Outils de gestion</p>
              <p className="text-sm text-gray-600">Stock, clients, statistiques tout en un</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Croissance assurée</p>
              <p className="text-sm text-gray-600">Augmentez vos ventes de 40% en moyenne</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Historique des transactions */}
      {subscription?.transactions && subscription.transactions.length > 0 && (
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Historique des paiements
          </h2>

          <div className="space-y-3">
            {subscription.transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.plan?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatPrice(transaction.amount)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    transaction.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : transaction.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status === 'completed' ? 'Payé' :
                     transaction.status === 'pending' ? 'En attente' :
                     'Échoué'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SellerSubscription;