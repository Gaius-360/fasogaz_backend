// ==========================================
// FICHIER: utils/sendSMS.js
// ==========================================
// Note: Implémentation simulée pour le développement
// À remplacer par une vraie API SMS en production

const sendSMS = async (phone, message) => {
  try {
    // TODO: Intégrer une vraie API SMS (Orange SMS API, etc.)
    console.log(`📱 SMS envoyé à ${phone}:`);
    console.log(`   Message: ${message}`);
    
    // Simuler un délai
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'SMS envoyé avec succès (mode simulation)'
    };
  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error.message);
    return {
      success: false,
      message: 'Échec de l\'envoi du SMS'
    };
  }
};

module.exports = sendSMS;