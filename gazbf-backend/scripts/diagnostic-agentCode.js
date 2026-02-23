// ==========================================
// SCRIPT DE DIAGNOSTIC: Vérifier agentCode
// ==========================================


const db = require('../models');

async function diagnoseAgentCode() {
  try {
    console.log('🔍 Diagnostic agentCode...\n');
    
    // 1. Vérifier les attributs du modèle User
    console.log('📋 Attributs du modèle User:');
    const userAttributes = Object.keys(db.User.rawAttributes);
    console.log(userAttributes);
    console.log('\n');
    
    // 2. Chercher un agent existant
    const agent = await db.User.findOne({
      where: { role: 'agent' }
    });
    
    if (!agent) {
      console.log('❌ Aucun agent trouvé dans la base');
      return;
    }
    
    console.log('✅ Agent trouvé:', agent.id);
    console.log('\n');
    
    // 3. Afficher les données brutes
    console.log('📦 Données brutes (dataValues):');
    console.log(JSON.stringify(agent.dataValues, null, 2));
    console.log('\n');
    
    // 4. Vérifier agentCode directement
    console.log('🔑 Accès direct à agentCode:');
    console.log('agent.agentCode =', agent.agentCode);
    console.log('agent.dataValues.agentCode =', agent.dataValues.agentCode);
    console.log('agent.get("agentCode") =', agent.get('agentCode'));
    console.log('\n');
    
    // 5. Test avec toJSON()
    console.log('📤 Résultat de toJSON():');
    const jsonData = agent.toJSON();
    console.log(JSON.stringify(jsonData, null, 2));
    console.log('jsonData.agentCode =', jsonData.agentCode);
    console.log('\n');
    
    // 6. Test avec attributes spécifiques
    console.log('🎯 Test avec findOne + attributes explicites:');
    const agentWithAttrs = await db.User.findOne({
      where: { role: 'agent' },
      attributes: [
        'id',
        'phone',
        'firstName',
        'lastName',
        'agentCode',
        'agentZone'
      ]
    });
    
    console.log('Données avec attributes:');
    console.log(JSON.stringify(agentWithAttrs?.dataValues, null, 2));
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le diagnostic
diagnoseAgentCode()
  .then(() => {
    console.log('\n✅ Diagnostic terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });