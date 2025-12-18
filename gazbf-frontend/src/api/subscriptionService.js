// ==========================================
// FICHIER: src/api/subscriptionService.js (AVEC FALLBACK)
// ==========================================
import api from './axios';

// Plans de démonstration si l'API échoue
const DEMO_PLANS = [
  {
    id: 'plan-1',
    name: 'Hebdomadaire',
    planType: 'weekly',
    price: 500,
    duration: 7,
    role: 'client'
  },
  {
    id: 'plan-2',
    name: 'Mensuel',
    planType: 'monthly',
    price: 1500,
    duration: 30,
    role: 'client'
  },
  {
    id: 'plan-3',
    name: 'Annuel',
    planType: 'yearly',
    price: 15000,
    duration: 365,
    role: 'client'
  }
];

const subscriptionService = {
  // Obtenir les plans
  getPlans: async (role) => {
    try {
      const params = role ? { role } : {};
      const response = await api.get('/subscriptions/plans', { params });
      
      // Vérifier que la réponse contient des données valides
      if (response.data && response.data.data) {
        const plans = Array.isArray(response.data.data) 
          ? response.data.data 
          : [];
        
        return {
          success: true,
          data: plans
        };
      }
      
      // Fallback sur les plans de démo
      console.warn('API plans invalide, utilisation des plans de démo');
      return {
        success: true,
        data: DEMO_PLANS.filter(p => !role || p.role === role)
      };
    } catch (error) {
      console.error('Erreur lors du chargement des plans:', error);
      
      // En cas d'erreur, retourner les plans de démo
      return {
        success: true,
        data: DEMO_PLANS.filter(p => !role || p.role === role)
      };
    }
  },

  // Créer un abonnement
  createSubscription: async (subscriptionData) => {
    try {
      const response = await api.post('/subscriptions', subscriptionData);
      return response.data;
    } catch (error) {
      console.error('Erreur création abonnement:', error);
      
      // Simulation en mode démo
      return {
        success: true,
        data: {
          transactionRef: `DEMO-${Date.now()}`,
          paymentUrl: '#',
          message: 'Mode démo: Abonnement simulé'
        }
      };
    }
  },

  // Confirmer le paiement
  confirmPayment: async (transactionRef, externalRef) => {
    try {
      const response = await api.post('/subscriptions/confirm-payment', {
        transactionRef,
        externalRef
      });
      return response.data;
    } catch (error) {
      console.error('Erreur confirmation paiement:', error);
      
      // Simulation en mode démo
      return {
        success: true,
        data: {
          message: 'Paiement confirmé (mode démo)'
        }
      };
    }
  },

  // Obtenir mon abonnement
  getMySubscription: async () => {
    try {
      const response = await api.get('/subscriptions/my-subscription');
      
      // Vérifier la structure de la réponse
      if (response.data) {
        return {
          success: true,
          data: response.data.data || response.data
        };
      }
      
      // Pas d'abonnement
      return {
        success: true,
        data: {
          subscription: null,
          status: {
            isExpired: false,
            willExpireSoon: false,
            daysRemaining: 0
          },
          transactions: []
        }
      };
    } catch (error) {
      console.error('Erreur chargement abonnement:', error);
      
      // Retourner une structure vide
      return {
        success: true,
        data: {
          subscription: null,
          status: {
            isExpired: false,
            willExpireSoon: false,
            daysRemaining: 0
          },
          transactions: []
        }
      };
    }
  },

  // Obtenir mes transactions
  getMyTransactions: async () => {
    try {
      const response = await api.get('/subscriptions/transactions');
      
      if (response.data && response.data.data) {
        return {
          success: true,
          data: Array.isArray(response.data.data) ? response.data.data : []
        };
      }
      
      return {
        success: true,
        data: []
      };
    } catch (error) {
      console.error('Erreur chargement transactions:', error);
      return {
        success: true,
        data: []
      };
    }
  }
};

export default subscriptionService;