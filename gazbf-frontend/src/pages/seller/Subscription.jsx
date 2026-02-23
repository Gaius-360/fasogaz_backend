// ==========================================
// FICHIER: src/pages/seller/SellerSubscription.jsx
// Page d'abonnement revendeur avec paiement LigdiCash
// ==========================================

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Loader2, Clock, AlertCircle, Calendar, Zap, Gift, Store, Trash2, RefreshCw, X } from 'lucide-react';
import { api } from '../../api/apiSwitch';
import { usePayment } from '../../hooks/usePayment';

const SellerSubscription = () => {
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('ligdicash');
  const [showPlans, setShowPlans] = useState(false);
  const [changePlanConfirm, setChangePlanConfirm] = useState(null);
  
  const [showEarlyRenewalModal, setShowEarlyRenewalModal] = useState(false);
  
  const [pricingConfig, setPricingConfig] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [accessStatus, setAccessStatus] = useState(null);

  // Hook de paiement
  const { loading: paymentLoading, error: paymentError, initiatePayment, clearError } = usePayment();

  useEffect(() => {
    loadData();
  }, []);

  // Afficher les erreurs de paiement
  useEffect(() => {
    if (paymentError) {
      setAlert({
        type: 'error',
        message: paymentError
      });
    }
  }, [paymentError]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPricingConfig(),
        loadSubscription(),
        loadAccessStatus()
      ]);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des données'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPricingConfig = async () => {
    try {
      const response = await api.pricing.getRevendeurConfig();
      
      if (!response?.success) {
        throw new Error('Erreur lors du chargement de la configuration');
      }

      const config = response.data;
      setPricingConfig(config);
      
      const plans = [];
      
      if (config.plans) {
        Object.entries(config.plans).forEach(([key, plan]) => {
          if (plan.enabled && plan.price > 0) {
            const planData = {
              id: `${key}_seller`,
              type: key,
              name: getPlanName(key),
              price: plan.price,
              duration: plan.duration,
              durationText: getDurationText(plan.duration),
              popular: key === 'quarterly',
              premium: key === 'yearly'
            };
            
            const monthlyPrice = config.plans.monthly?.price || 0;
            if (monthlyPrice > 0) {
              if (key === 'quarterly') {
                planData.savings = (monthlyPrice * 3) - plan.price;
              } else if (key === 'yearly') {
                planData.savings = (monthlyPrice * 12) - plan.price;
              }
            }
            
            plans.push(planData);
          }
        });
      }
      
      setAvailablePlans(plans);
      
    } catch (error) {
      console.error('Erreur chargement config revendeur:', error);
      setPricingConfig({ isActive: false });
      setAvailablePlans([]);
    }
  };

  const loadSubscription = async () => {
    try {
      const response = await api.subscriptions.getMySubscription();
      
      if (response?.success && response.data) {
        setSubscription(response.data);
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Erreur chargement abonnement:', error);
      setSubscription(null);
    }
  };

  const loadAccessStatus = async () => {
    try {
      const response = await api.pricing.getAccessStatus();
      
      if (response?.success && response.data) {
        setAccessStatus(response.data);
      } else {
        setAccessStatus(null);
      }
    } catch (error) {
      console.error('Erreur chargement statut:', error);
      setAccessStatus(null);
    }
  };

  const getPlanName = (type) => {
    const names = {
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
      quarterly: 'Trimestriel',
      yearly: 'Annuel Premium'
    };
    return names[type] || type;
  };

  const getDurationText = (duration) => {
    if (duration === 7) return '7 jours';
    if (duration === 30) return '30 jours';
    if (duration === 90) return '90 jours';
    if (duration === 365) return '365 jours';
    return `${duration} jours`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * ✅ NOUVEAU: Initier le paiement via LigdiCash
   */
  const handleSubscribe = async (plan) => {
    // Vérifier s'il y a un changement de plan nécessitant confirmation
    if (subscription?.isActive && !changePlanConfirm) {
      setChangePlanConfirm({
        plan,
        currentSubscription: subscription,
        message: `Vous avez déjà un abonnement ${getPlanName(subscription.planType)} actif. Voulez-vous le remplacer ?`
      });
      return;
    }

    setSelectedPlan(plan.id);
    clearError();

    try {
      console.log('💳 Lancement paiement pour:', plan);

      // Préparer les métadonnées
      const metadata = {
        planType: plan.type,
        duration: plan.duration,
        planName: plan.name,
        forceChange: changePlanConfirm ? true : false
      };

      // Initier le paiement (redirection automatique vers LigdiCash)
      await initiatePayment(plan.price, 'subscription', metadata);

      // Note: Le code après ne sera jamais exécuté car l'utilisateur sera redirigé
      // La gestion du retour se fera via les pages de callback

    } catch (error) {
      console.error('❌ Erreur abonnement:', error);
      setSelectedPlan(null);
      // L'erreur est déjà gérée par le hook usePayment
    }
  };

  /**
   * ✅ NOUVEAU: Renouvellement anticipé via LigdiCash
   */
  const handleEarlyRenewal = async () => {
    if (!subscription) {
      setAlert({
        type: 'error',
        message: 'Aucun abonnement actif'
      });
      return;
    }

    setShowEarlyRenewalModal(false);
    clearError();
    
    try {
      const planConfig = pricingConfig?.plans[subscription.planType];
      
      if (!planConfig) {
        throw new Error('Configuration du plan introuvable');
      }

      console.log('💳 Lancement renouvellement anticipé');

      const metadata = {
        planType: subscription.planType,
        duration: planConfig.duration,
        isEarlyRenewal: true,
        currentEndDate: subscription.endDate
      };

      // Initier le paiement pour le renouvellement
      await initiatePayment(planConfig.price, 'subscription', metadata);

    } catch (error) {
      console.error('❌ Erreur renouvellement:', error);
      setShowEarlyRenewalModal(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('⚠️ ATTENTION : Votre abonnement sera supprimé IMMÉDIATEMENT et votre dépôt ne sera plus visible. Êtes-vous absolument sûr ?')) {
      return;
    }

    try {
      const response = await api.subscriptions.deleteSubscription();
      
      if (response?.success) {
        setAlert({
          type: 'success',
          message: 'Abonnement supprimé immédiatement. Votre dépôt n\'est plus visible.'
        });
        await loadData();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors de la suppression'
      });
    }
  };

  // ÉTATS DE CHARGEMENT
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Vérification de votre abonnement...</p>
        </div>
      </div>
    );
  }

  if (!pricingConfig?.isActive) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 sm:p-8 text-center border-2 border-green-200">
          <Store className="h-12 w-12 sm:h-16 sm:w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            🎉 Visibilité Gratuite Illimitée
          </h2>
          <p className="text-gray-700 text-base sm:text-lg mb-4">
            Votre dépôt est visible gratuitement sur la carte sans limite de temps !
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium text-sm sm:text-base">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            Aucun abonnement requis
          </div>
        </div>
      </div>
    );
  }

  const hasActiveSubscription = subscription?.isActive;

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      
      {/* En-tête */}
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Mon Abonnement Professionnel
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Gérez votre visibilité et votre abonnement revendeur
        </p>
      </div>

      {/* ✅ Badge mode simulation (si applicable) */}
      {import.meta.env.VITE_LIGDICASH_SIMULATION === 'true' && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="font-bold text-yellow-900 mb-1">
                🧪 Mode Test Activé
              </p>
              <p className="text-sm text-yellow-800">
                Les paiements sont simulés. Aucun argent réel ne sera débité.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerte */}
      {alert && (
        <div className={`p-3 sm:p-4 rounded-lg border flex items-start gap-2 sm:gap-3 ${
          alert.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          {alert.type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p className={`flex-1 text-sm sm:text-base ${alert.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {alert.message}
          </p>
          <button
            onClick={() => setAlert(null)}
            className="ml-auto text-gray-500 hover:text-gray-700 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modal de prolongation */}
      {showEarlyRenewalModal && subscription && pricingConfig?.plans[subscription.planType] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Prolonger l'abonnement
              </h3>
              <button
                onClick={() => setShowEarlyRenewalModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <p className="font-semibold text-blue-900 text-sm sm:text-base">
                    Prolongation de {pricingConfig.plans[subscription.planType].duration} jours
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-blue-800 mb-2">
                Votre abonnement sera prolongé jusqu'au{' '}
                <strong className="block sm:inline mt-1 sm:mt-0">
                  {new Date(
                    new Date(subscription.endDate).getTime() + 
                    pricingConfig.plans[subscription.planType].duration * 24 * 60 * 60 * 1000
                  ).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </strong>
              </p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                {formatPrice(pricingConfig.plans[subscription.planType].price)}
              </p>
            </div>

            {/* ✅ Info paiement LigdiCash */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-medium text-gray-700">Paiement sécurisé via LigdiCash</p>
              </div>
              <p className="text-xs text-gray-600">
                Vous serez redirigé vers la page de paiement pour finaliser avec Orange Money ou Moov Money
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowEarlyRenewalModal(false)}
                disabled={paymentLoading}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 text-sm sm:text-base"
              >
                Annuler
              </button>
              <button
                onClick={handleEarlyRenewal}
                disabled={paymentLoading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Redirection...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Payer maintenant
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation changement de plan */}
      {changePlanConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4 sm:mb-6">
              <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Confirmer le changement de plan
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                {changePlanConfirm.message}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-yellow-800 mb-2">
                <strong>Plan actuel :</strong> {getPlanName(changePlanConfirm.currentSubscription?.planType)}
              </p>
              <p className="text-xs sm:text-sm text-yellow-800">
                <strong>Nouveau plan :</strong> {changePlanConfirm.plan.name}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setChangePlanConfirm(null)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm sm:text-base"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const plan = changePlanConfirm.plan;
                  setChangePlanConfirm(null);
                  handleSubscribe(plan);
                }}
                disabled={paymentLoading}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50 text-sm sm:text-base"
              >
                {paymentLoading ? 'Redirection...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statut d'accès */}
      {accessStatus && accessStatus.hasAccess && (
        <div className={`rounded-xl p-4 sm:p-6 border-2 ${
          accessStatus.type === 'free_trial' 
            ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'
            : accessStatus.type === 'grace_period'
            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
            : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              accessStatus.type === 'free_trial' ? 'bg-purple-100' :
              accessStatus.type === 'grace_period' ? 'bg-yellow-100' :
              'bg-green-100'
            }`}>
              {accessStatus.type === 'free_trial' ? (
                <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              ) : accessStatus.type === 'grace_period' ? (
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              ) : (
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              )}
            </div>
            
            <div className="flex-1 w-full">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                {accessStatus.type === 'free_trial' && `🎁 ${pricingConfig.freeTrialDays} jours d'essai gratuit`}
                {accessStatus.type === 'grace_period' && '⏰ Période de Grâce'}
                {accessStatus.type === 'active_subscription' && '✅ Abonnement Actif'}
              </h3>
              <p className="text-sm sm:text-base text-gray-700 mb-2 sm:mb-3">
                {accessStatus.type === 'free_trial' && 
                  `Votre dépôt est visible gratuitement pendant encore ${accessStatus.daysRemaining} jours !`
                }
                {accessStatus.type === 'grace_period' && 
                  `Vous avez ${accessStatus.daysRemaining} jours pour renouveler sans perdre votre visibilité`
                }
                {accessStatus.type === 'active_subscription' && 
                  `Votre dépôt est visible sur la carte. Encore ${accessStatus.daysRemaining} jours d'accès.`
                }
              </p>
              
              {accessStatus.endDate && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Expire le {formatDate(accessStatus.endDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Abonnement actif */}
      {hasActiveSubscription ? (
        <div className="bg-white rounded-xl border-2 border-orange-200 p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                  Plan {getPlanName(subscription.planType)}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Actif depuis le {formatDate(subscription.startDate)}
                </p>
                {subscription.hasEarlyRenewal && (
                  <span className="inline-block mt-1 sm:mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Déjà prolongé
                  </span>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-xl sm:text-2xl font-bold text-orange-600">
                {formatPrice(subscription.amount)}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                /{getDurationText(subscription.duration)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Date de début</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">
                {formatDate(subscription.startDate)}
              </p>
            </div>

            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Date d'expiration</span>
              </div>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">
                {formatDate(subscription.endDate)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
            {!subscription.hasEarlyRenewal && (
              <button
                onClick={() => setShowEarlyRenewalModal(true)}
                disabled={paymentLoading}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition flex items-center justify-center gap-2 text-sm sm:text-base min-w-0"
              >
                {paymentLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                    <span className="hidden sm:inline">Redirection...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Prolonger maintenant</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setShowPlans(!showPlans)}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition text-sm sm:text-base"
            >
              {showPlans ? 'Masquer les plans' : 'Changer de plan'}
            </button>
            <button
              onClick={handleDelete}
              disabled={paymentLoading}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Trash2 className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Supprimer</span>
              <span className="sm:hidden">Supprimer</span>
            </button>
          </div>
        </div>
      ) : (
        accessStatus?.type !== 'free_trial' && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sm:p-8 text-center">
            <Store className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Aucun abonnement actif
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Choisissez un plan pour que votre dépôt soit visible sur la carte
            </p>
            <button
              onClick={() => setShowPlans(true)}
              className="px-6 sm:px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition text-sm sm:text-base"
            >
              Voir les plans disponibles
            </button>
          </div>
        )
      )}

      {/* Sélection des plans */}
      {(showPlans || !hasActiveSubscription) && availablePlans.length > 0 && accessStatus?.type !== 'free_trial' && (
        <>
          {/* Info paiement */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-blue-900 mb-1">
                  💳 Paiement sécurisé via LigdiCash
                </h3>
                <p className="text-sm text-blue-700 mb-2">
                  Vous serez redirigé vers une page de paiement sécurisée pour finaliser votre abonnement
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-blue-600">
                  <span className="flex items-center gap-1">
                    <span className="text-lg">🟠</span> Orange Money
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-lg">🔵</span> Moov Money
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Grille des plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border-2 p-4 sm:p-6 relative transition-transform hover:scale-105 ${
                  plan.premium ? 'border-orange-600 shadow-xl' :
                  plan.popular ? 'border-blue-600 shadow-lg' : 
                  'border-gray-200'
                }`}
              >
                {plan.premium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 sm:px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-xs font-bold whitespace-nowrap">
                      👑 MEILLEURE OFFRE
                    </span>
                  </div>
                )}
                
                {plan.popular && !plan.premium && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                      ⭐ Populaire
                    </span>
                  </div>
                )}

                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                    {plan.name}
                  </h3>
                  <div className="mb-2 sm:mb-3">
                    <span className="text-3xl sm:text-4xl font-bold text-orange-600">
                      {formatPrice(plan.price)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-base sm:text-lg mb-2 sm:mb-3">{plan.durationText}</p>
                  {plan.savings > 0 && (
                    <p className="text-green-600 font-medium text-sm sm:text-base">
                      Économisez {formatPrice(plan.savings)}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={paymentLoading && selectedPlan === plan.id}
                  className={`w-full px-4 sm:px-6 py-3 rounded-lg font-medium transition text-sm sm:text-base ${
                    plan.premium
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
                      : plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {paymentLoading && selectedPlan === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden sm:inline">Redirection...</span>
                    </span>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 inline mr-2" />
                      {plan.premium ? '👑 Payer' : 'Payer maintenant'}
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Message aucun plan */}
      {!hasActiveSubscription && availablePlans.length === 0 && pricingConfig?.isActive && accessStatus?.type !== 'free_trial' && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 sm:p-8 text-center">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            Aucun plan disponible
          </h3>
          <p className="text-sm sm:text-base text-gray-700">
            Les plans d'abonnement sont en cours de configuration. Revenez plus tard.
          </p>
        </div>
      )}

      {/* Avantages */}
      {availablePlans.length > 0 && accessStatus?.type !== 'free_trial' && (
        <div className="bg-gradient-to-r from-orange-50 to-blue-50 rounded-xl p-4 sm:p-6 border">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
            🎯 Pourquoi s'abonner ?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              { icon: '👁️', title: 'Visibilité maximale', desc: 'Votre dépôt apparaît sur la carte interactive' },
              { icon: '📱', title: 'Commandes en ligne', desc: 'Recevez et gérez les commandes clients' },
              { icon: '📊', title: 'Outils de gestion', desc: 'Stock, clients, statistiques avancées' },
              { icon: '📈', title: 'Croissance assurée', desc: '+40% de ventes en moyenne avec un abonnement' }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 sm:gap-3">
                <div className="text-xl sm:text-2xl flex-shrink-0">{item.icon}</div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{item.title}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerSubscription;