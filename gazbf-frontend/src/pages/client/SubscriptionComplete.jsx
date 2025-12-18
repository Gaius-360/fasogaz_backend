import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Loader2, Clock, AlertCircle, Calendar } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import { formatDate, formatPrice } from '../../utils/helpers';

const SubscriptionComplete = () => {
  const [loading, setLoading] = useState(true);
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
  api.subscriptions.getPlans('client')
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
    }
  };

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);
    setAlert(null);
    setProcessingPayment(true);

    try {
      // Créer l'abonnement
      const response = await api.subscriptions.createSubscription({
  planId: plan.id
});

      if (response.success) {
        const { transactionRef, paymentUrl } = response.data;

        // Rediriger vers la page de paiement (simulation)
        setAlert({
          type: 'info',
          message: `Redirection vers le paiement... Réf: ${transactionRef}`
        });

        // Dans une vraie implémentation, rediriger vers paymentUrl
        // window.location.href = paymentUrl;

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

  const getPlanFeatures = (planType) => {
    const features = {
      weekly: [
        'Accès à la carte pendant 7 jours',
        'Recherche de revendeurs illimitée',
        'Commandes en ligne',
        'Support client'
      ],
      monthly: [
        'Accès à la carte pendant 30 jours',
        'Recherche de revendeurs illimitée',
        'Commandes en ligne',
        'Historique des commandes',
        'Support client prioritaire',
        'Notifications push'
      ],
      yearly: [
        'Accès à la carte pendant 365 jours',
        'Recherche de revendeurs illimitée',
        'Commandes en ligne',
        'Historique des commandes',
        'Support client VIP',
        'Notifications push',
        'Remises exclusives',
        '2 mois offerts'
      ]
    };

    return features[planType] || [];
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
          Mon Abonnement
        </h1>
        <p className="text-gray-600">
          Gérez votre abonnement GAZBF
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
                Plan {subscription.subscription.planType === 'weekly' ? 'Hebdomadaire' :
                       subscription.subscription.planType === 'monthly' ? 'Mensuel' :
                       'Annuel'}
              </p>
            </div>
            {subscription.subscription.isActive ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
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
              message={`Votre abonnement expire dans ${subscription.status.daysRemaining} jour(s)`}
              className="mb-4"
            />
          )}

          {subscription.status.isExpired && (
            <Alert
              type="error"
              title="Abonnement expiré"
              message="Renouvelez votre abonnement pour continuer à utiliser GAZBF"
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
              Choisissez un plan pour accéder à toutes les fonctionnalités
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
            Plans disponibles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isPopular = plan.planType === 'monthly';
              const features = getPlanFeatures(plan.planType);

              return (
                <Card key={plan.id} className={isPopular ? 'border-2 border-primary-600' : ''}>
                  {isPopular && (
                    <div className="mb-4">
                      <span className="px-3 py-1 bg-primary-600 text-white rounded-full text-xs font-medium">
                        ⭐ Populaire
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {plan.planType === 'weekly' ? 'Hebdomadaire' :
                     plan.planType === 'monthly' ? 'Mensuel' :
                     'Annuel'}
                  </h3>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price)}
                    </span>
                    <span className="text-gray-600">
                      /{plan.planType === 'weekly' ? 'semaine' :
                        plan.planType === 'monthly' ? 'mois' :
                        'an'}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isPopular ? 'primary' : 'outline'}
                    fullWidth
                    onClick={() => handleSelectPlan(plan)}
                    loading={processingPayment && selectedPlan?.id === plan.id}
                    disabled={processingPayment}
                  >
                    Choisir ce plan
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}

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

export default SubscriptionComplete;