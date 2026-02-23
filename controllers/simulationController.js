// ==========================================
// FICHIER: controllers/simulationController.js
// ✅ FIX: Redirection correcte après simulation
// ==========================================

const { Transaction, User, Subscription, AccessPurchase, Pricing } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Page de paiement simulation
 * @route   GET /api/payments/simulation/:token
 * @access  Public
 */
exports.showSimulationPage = async (req, res) => {
  try {
    const { token } = req.params;

    const transaction = await Transaction.findOne({
      where: { ligdicashToken: token },
      include: [{ model: User, as: 'user' }]
    });

    if (!transaction) {
      return res.status(404).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:50px">
          <h2>❌ Transaction non trouvée</h2>
          <p>Token: ${token}</p>
        </body></html>
      `);
    }

    // ✅ Lire APP_URL depuis .env avec fallback
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

    console.log('🧪 Page simulation:', {
      token,
      transactionNumber: transaction.transactionNumber,
      amount: transaction.amount,
      type: transaction.type,
      appUrl,
      backendUrl
    });

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🧪 Simulation Paiement LigdiCash</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 480px;
      width: 100%;
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      text-align: center;
      color: white;
    }
    
    .simulation-badge {
      display: inline-block;
      background: rgba(251,191,36,0.9);
      color: #78350f;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 12px;
      letter-spacing: 1px;
    }
    
    .header h1 {
      font-size: 24px;
      margin-bottom: 4px;
    }
    
    .header p {
      opacity: 0.85;
      font-size: 14px;
    }
    
    .content { padding: 30px; }
    
    .payment-info {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    
    .info-row:last-child { border-bottom: none; }
    
    .info-label { color: #64748b; }
    .info-value { font-weight: 600; color: #1e293b; }
    
    .amount-display {
      text-align: center;
      padding: 20px;
      margin-bottom: 24px;
    }
    
    .amount-label {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 6px;
    }
    
    .amount-value {
      font-size: 42px;
      font-weight: 800;
      color: #10b981;
    }
    
    .amount-currency {
      font-size: 18px;
      color: #64748b;
      font-weight: 400;
    }
    
    .buttons { display: flex; flex-direction: column; gap: 12px; }
    
    button {
      padding: 16px 24px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 15px rgba(16,185,129,0.3);
    }
    
    .btn-success:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(16,185,129,0.4);
    }
    
    .btn-error {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      box-shadow: 0 4px 15px rgba(239,68,68,0.3);
    }
    
    .btn-error:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(239,68,68,0.4);
    }
    
    .btn-cancel {
      background: #f1f5f9;
      color: #64748b;
      border: 2px solid #e2e8f0;
    }
    
    .btn-cancel:hover:not(:disabled) {
      background: #e2e8f0;
    }
    
    .loading {
      display: none;
      text-align: center;
      padding: 30px;
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    
    .loading-text {
      color: #64748b;
      font-size: 15px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .note {
      margin-top: 20px;
      padding: 14px;
      background: #fef9c3;
      border: 1px solid #fde047;
      border-radius: 10px;
      font-size: 13px;
      color: #854d0e;
      display: flex;
      gap: 8px;
    }
    
    .error-box {
      display: none;
      margin-top: 16px;
      padding: 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      font-size: 13px;
      color: #b91c1c;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="simulation-badge">🧪 MODE SIMULATION</div>
      <h1>Page de Paiement Test</h1>
      <p>LigdiCash - Test Environment</p>
    </div>
    
    <div class="content">
      <div class="payment-info">
        <div class="info-row">
          <span class="info-label">Transaction</span>
          <span class="info-value" style="font-family:monospace;font-size:12px">
            ${transaction.transactionNumber}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Type</span>
          <span class="info-value">${formatTransactionType(transaction.type)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Client</span>
          <span class="info-value">
            ${transaction.user?.firstName || 'Client'} ${transaction.user?.lastName || ''}
          </span>
        </div>
        ${transaction.description ? `
        <div class="info-row">
          <span class="info-label">Description</span>
          <span class="info-value" style="font-size:12px">${transaction.description}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="amount-display">
        <div class="amount-label">Montant à payer</div>
        <div class="amount-value">
          ${new Intl.NumberFormat('fr-FR').format(transaction.amount)}
          <span class="amount-currency">FCFA</span>
        </div>
      </div>
      
      <div class="buttons" id="buttons">
        <button class="btn-success" onclick="simulatePayment('success')">
          ✅ Simuler Paiement Réussi
        </button>
        <button class="btn-error" onclick="simulatePayment('failed')">
          ❌ Simuler Paiement Échoué
        </button>
        <button class="btn-cancel" onclick="simulatePayment('cancelled')">
          ↩ Annuler le paiement
        </button>
      </div>
      
      <div class="loading" id="loading">
        <div class="spinner"></div>
        <p class="loading-text">Traitement du paiement...</p>
      </div>
      
      <div class="error-box" id="errorBox"></div>
      
      <div class="note">
        <span>💡</span>
        <span>
          <strong>Mode Test :</strong> Aucun argent réel n'est débité. 
          Simulez le résultat souhaité pour tester votre application.
        </span>
      </div>
    </div>
  </div>
  
  <script>
    // ✅ FIX: URL du backend fixe (pas depuis APP_URL)
    const BACKEND_URL = '${backendUrl}';
    const APP_URL = '${appUrl}';
    const TOKEN = '${token}';
    
    async function simulatePayment(status) {
      const buttons = document.getElementById('buttons');
      const loading = document.getElementById('loading');
      const errorBox = document.getElementById('errorBox');
      
      // Afficher le loader
      buttons.style.display = 'none';
      loading.style.display = 'block';
      errorBox.style.display = 'none';
      
      try {
        console.log('🧪 Simulation:', status);
        console.log('📡 URL backend:', BACKEND_URL);
        
        const response = await fetch(
          BACKEND_URL + '/api/payments/simulation/' + TOKEN + '/complete',
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ status })
          }
        );
        
        console.log('📥 Status HTTP:', response.status);
        
        const text = await response.text();
        console.log('📥 Réponse brute:', text);
        
        let data;
        try {
          data = JSON.parse(text);
        } catch(e) {
          throw new Error('Réponse invalide du serveur: ' + text.substring(0, 100));
        }
        
        console.log('📥 Données:', data);
        
        if (data.success && data.redirectUrl) {
          console.log('✅ Redirection vers:', data.redirectUrl);
          window.location.href = data.redirectUrl;
        } else {
          throw new Error(data.message || 'Erreur inconnue du serveur');
        }
        
      } catch (error) {
        console.error('❌ Erreur simulation:', error);
        
        loading.style.display = 'none';
        buttons.style.display = 'flex';
        buttons.style.flexDirection = 'column';
        
        errorBox.style.display = 'block';
        errorBox.textContent = '❌ Erreur: ' + error.message;
      }
    }
  </script>
</body>
</html>
    `;

    res.send(html);

  } catch (error) {
    console.error('❌ Erreur page simulation:', error);
    res.status(500).send(`
      <html><body style="font-family:sans-serif;padding:50px">
        <h2>❌ Erreur serveur</h2>
        <pre>${error.message}</pre>
      </body></html>
    `);
  }
};

/**
 * Formater le type de transaction pour l'affichage
 */
function formatTransactionType(type) {
  const types = {
    'seller_subscription': '📦 Abonnement Revendeur',
    'seller_subscription_renewal': '🔄 Renouvellement Abonnement',
    'seller_early_renewal': '⚡ Prolongation Anticipée',
    'client_access': '🔑 Accès Client 24h',
    'order_payment': '🛒 Paiement Commande'
  };
  return types[type] || type;
}

/**
 * @desc    Compléter une simulation de paiement
 * @route   POST /api/payments/simulation/:token/complete
 * @access  Public
 */
exports.completeSimulation = async (req, res) => {
  try {
    const { token } = req.params;
    const { status } = req.body;

    console.log('🧪 Complétion simulation:', { token, status });

    const appUrl = process.env.APP_URL || 'http://localhost:5173';

    const transaction = await Transaction.findOne({
      where: { ligdicashToken: token }
    });

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: `Transaction non trouvée pour token: ${token}` 
      });
    }

    console.log('✅ Transaction trouvée:', {
      id: transaction.id,
      number: transaction.transactionNumber,
      status: transaction.status,
      type: transaction.type,
      amount: transaction.amount
    });

    // ✅ Vérifier que la transaction n'est pas déjà traitée
    if (transaction.status === 'completed') {
      return res.json({
        success: true,
        redirectUrl: `${appUrl}/payment/success?transaction=${transaction.transactionNumber}`
      });
    }

    if (status === 'success') {
      await processSuccessfulPayment(transaction);

      const redirectUrl = `${appUrl}/payment/success?transaction=${transaction.transactionNumber}`;
      console.log('✅ Redirection succès:', redirectUrl);

      return res.json({
        success: true,
        redirectUrl
      });

    } else if (status === 'cancelled') {
      await transaction.update({
        status: 'cancelled',
        failureReason: 'Annulé par l\'utilisateur (simulation)',
        failedAt: new Date()
      });

      const redirectUrl = `${appUrl}/payment/cancel`;
      console.log('↩ Redirection annulation:', redirectUrl);

      return res.json({
        success: true,
        redirectUrl
      });

    } else {
      await transaction.update({
        status: 'failed',
        failureReason: 'Paiement échoué (simulation)',
        failedAt: new Date()
      });

      const redirectUrl = `${appUrl}/payment/error?message=${encodeURIComponent('Paiement échoué')}`;
      console.log('❌ Redirection échec:', redirectUrl);

      return res.json({
        success: true,
        redirectUrl
      });
    }

  } catch (error) {
    console.error('❌ Erreur complétion simulation:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Traiter un paiement réussi
 */
async function processSuccessfulPayment(transaction) {
  try {
    await transaction.update({
      status: 'completed',
      completedAt: new Date()
    });

    const metadata = transaction.metadata || {};
    const enrichedMetadata = {
      ...metadata,
      amount: transaction.amount,
      price: transaction.amount
    };

    console.log('💳 Traitement paiement réussi:', {
      type: transaction.type,
      amount: transaction.amount
    });

    if (
      transaction.type === 'seller_subscription' ||
      transaction.type === 'seller_subscription_renewal' ||
      transaction.type === 'seller_early_renewal'
    ) {
      await activateSubscription(transaction.userId, enrichedMetadata);
    } else if (transaction.type === 'client_access') {
      await activateClientAccess(transaction.userId, enrichedMetadata);
    }

    console.log(`✅ Paiement traité: ${transaction.transactionNumber}`);

  } catch (error) {
    console.error('❌ Erreur traitement paiement:', error);
    throw error;
  }
}

/**
 * Activer un abonnement revendeur
 */
async function activateSubscription(userId, metadata) {
  try {
    console.log('📝 Activation abonnement pour user:', userId);

    const pricingConfig = await Pricing.findOne({ 
      where: { targetRole: 'revendeur' }
    });

    if (!pricingConfig || !pricingConfig.isActive) {
      console.log('⚠️ Système de tarification non actif');
      return;
    }

    const planType = metadata.planType || 'monthly';
    const planConfig = pricingConfig.plans[planType];

    if (!planConfig) {
      throw new Error(`Configuration du plan "${planType}" introuvable`);
    }

    const existingSubscription = await Subscription.findOne({
      where: {
        userId,
        isActive: true,
        endDate: { [Op.gt]: new Date() }
      }
    });

    let endDate;

    if (metadata.isEarlyRenewal && existingSubscription) {
      endDate = new Date(existingSubscription.endDate);
      endDate.setDate(endDate.getDate() + planConfig.duration);

      await existingSubscription.update({
        endDate,
        hasEarlyRenewal: true
      });

      console.log(`✅ Abonnement prolongé jusqu'au ${endDate}`);
    } else {
      const startDate = new Date();
      endDate = new Date();
      endDate.setDate(endDate.getDate() + planConfig.duration);

      if (existingSubscription) {
        await existingSubscription.update({
          isActive: false,
          status: 'expired'
        });
      }

      await Subscription.create({
        userId,
        planType,
        amount: planConfig.price,
        initialAmount: planConfig.price,
        duration: planConfig.duration,
        startDate,
        endDate,
        paymentMethod: 'ligdicash',
        status: 'active',
        isActive: true,
        autoRenew: false,
        hasEarlyRenewal: false
      });

      console.log(`✅ Abonnement créé jusqu'au ${endDate}`);
    }

    await User.update(
      {
        subscriptionEndDate: endDate,
        hasActiveSubscription: true,
        hasActiveAccess: true
      },
      { where: { id: userId } }
    );

  } catch (error) {
    console.error('❌ Erreur activation abonnement:', error);
    throw error;
  }
}

/**
 * Activer un accès client 24h
 */
async function activateClientAccess(userId, metadata) {
  try {
    console.log('📝 Activation accès 24h pour user:', userId);

    const durationHours = metadata.duration || 24;
    const purchaseDate = new Date();
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + durationHours);

    let amount = metadata.amount || metadata.price;

    if (!amount) {
      const pricingConfig = await Pricing.findOne({ 
        where: { targetRole: 'client' }
      });
      amount = pricingConfig?.price || 0;
    }

    await AccessPurchase.create({
      userId,
      amount: parseFloat(amount),
      durationHours,
      purchaseDate,
      expiryDate,
      paymentMethod: 'ligdicash',
      status: 'completed',
      isActive: true
    });

    await User.update(
      {
        hasActiveAccess: true,
        accessExpiryDate: expiryDate
      },
      { where: { id: userId } }
    );

    console.log(`✅ Accès 24h activé jusqu'au ${expiryDate}`);

  } catch (error) {
    console.error('❌ Erreur activation accès:', error);
    throw error;
  }
}

module.exports = exports;