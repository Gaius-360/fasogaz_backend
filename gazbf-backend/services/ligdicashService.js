// ==========================================
// FICHIER: services/ligdicashService.js
// Service de gestion des paiements LigdiCash
// ==========================================

const axios = require('axios');
const crypto = require('crypto');

class LigdiCashService {
  constructor() {
    this.apiKey = process.env.LIGDICASH_API_KEY;
    this.authToken = process.env.LIGDICASH_AUTH_TOKEN;
    this.apiUrl = process.env.LIGDICASH_API_URL;
    this.checkoutUrl = process.env.LIGDICASH_CHECKOUT_URL;
    this.simulationMode = process.env.LIGDICASH_SIMULATION_MODE === 'true';
    
    console.log(`🔧 LigdiCash initialisé - Mode: ${this.simulationMode ? 'SIMULATION' : 'PRODUCTION'}`);
  }

  /**
   * Créer une requête de paiement
   * @param {Object} paymentData - Données du paiement
   * @returns {Promise<Object>} - URL de paiement et token
   */
  async createPayment(paymentData) {
    try {
      const {
        amount,
        description,
        customerName,
        customerEmail,
        customerPhone,
        orderId,
        metadata = {}
      } = paymentData;

      // Validation
      if (!amount || amount <= 0) {
        throw new Error('Montant invalide');
      }

      if (!customerPhone) {
        throw new Error('Numéro de téléphone requis');
      }

      // En mode simulation, retourner une URL de test
      if (this.simulationMode) {
        console.log('🧪 MODE SIMULATION - Génération paiement test');
        return this.generateSimulationPayment(paymentData);
      }

      // Préparer les données pour LigdiCash
      const ligdicashData = {
        commande: {
          invoice: {
            token: this.authToken,
            items: [{
              name: description || 'Paiement',
              description: description || 'Paiement sur FasoGaz',
              quantity: 1,
              unit_price: amount,
              total_price: amount
            }],
            total_amount: amount,
            devise: 'XOF',
            description: description || 'Paiement',
            customer: customerName || 'Client',
            customer_firstname: customerName ? customerName.split(' ')[0] : 'Client',
            customer_lastname: customerName ? customerName.split(' ').slice(1).join(' ') : '',
            customer_email: customerEmail || '',
            external_id: orderId || this.generateOrderId(),
            otp: customerPhone
          },
          store: {
            name: 'FasoGaz',
            website_url: process.env.APP_URL
          },
          actions: {
            cancel_url: process.env.LIGDICASH_CANCEL_URL,
            return_url: process.env.LIGDICASH_RETURN_URL,
            callback_url: process.env.LIGDICASH_CALLBACK_URL
          },
          custom_data: {
            ...metadata,
            orderId: orderId || this.generateOrderId(),
            timestamp: Date.now()
          }
        }
      };

      console.log('📤 Envoi requête LigdiCash:', {
        amount,
        orderId: ligdicashData.commande.invoice.external_id,
        phone: customerPhone
      });

      // Appel API LigdiCash
      const response = await axios.post(
        `${this.apiUrl}/invoice/create`,
        ligdicashData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Apikey': this.apiKey,
            'Authorization': `Bearer ${this.authToken}`
          },
          timeout: 30000 // 30 secondes
        }
      );

      if (!response.data || !response.data.response_code === '00') {
        throw new Error(response.data?.response_text || 'Erreur création paiement');
      }

      const paymentToken = response.data.token;
      const paymentUrl = `${this.checkoutUrl}/${paymentToken}`;

      console.log('✅ Paiement créé:', {
        token: paymentToken,
        url: paymentUrl
      });

      return {
        success: true,
        token: paymentToken,
        paymentUrl,
        orderId: ligdicashData.commande.invoice.external_id
      };

    } catch (error) {
      console.error('❌ Erreur création paiement LigdiCash:', error.message);
      
      // En cas d'erreur en mode développement, basculer en simulation
      if (this.simulationMode || process.env.NODE_ENV === 'development') {
        console.log('⚠️ Basculement en mode simulation suite à erreur');
        return this.generateSimulationPayment(paymentData);
      }

      throw new Error(error.response?.data?.message || error.message);
    }
  }

  /**
   * Générer un paiement de simulation (mode test)
   */
  generateSimulationPayment(paymentData) {
    const simulationToken = this.generateSimulationToken();
    const orderId = paymentData.orderId || this.generateOrderId();

    console.log('🧪 Paiement simulation généré:', {
      token: simulationToken,
      orderId,
      amount: paymentData.amount
    });

    return {
      success: true,
      token: simulationToken,
      paymentUrl: `${process.env.BACKEND_URL}/api/payments/simulation/${simulationToken}`,
      orderId,
      isSimulation: true
    };
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async checkPaymentStatus(token) {
    try {
      // En mode simulation
      if (this.simulationMode || token.startsWith('SIM_')) {
        return this.getSimulationStatus(token);
      }

      // Appel API réel LigdiCash
      const response = await axios.get(
        `${this.apiUrl}/invoice/status`,
        {
          params: { token },
          headers: {
            'Apikey': this.apiKey,
            'Authorization': `Bearer ${this.authToken}`
          }
        }
      );

      return {
        success: true,
        status: response.data.status,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Erreur vérification statut:', error.message);
      throw error;
    }
  }

  /**
   * Obtenir le statut d'un paiement simulation
   */
  getSimulationStatus(token) {
    // En simulation, retourner toujours "en attente"
    // Le statut sera mis à jour manuellement via la page de simulation
    return {
      success: true,
      status: 'pending',
      isSimulation: true,
      token
    };
  }

  /**
   * Vérifier la signature du callback (webhook)
   */
  verifyWebhookSignature(payload, signature) {
    const hash = crypto
      .createHmac('sha256', this.authToken)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  /**
   * Générer un ID de commande unique
   */
  generateOrderId() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Générer un token de simulation
   */
  generateSimulationToken() {
    return `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 12).toUpperCase()}`;
  }
}

module.exports = new LigdiCashService();