// ==========================================
// FICHIER: src/api/index.js
// Export centralisé de tous les services
// ==========================================

export { pricingService } from './pricingService';
export { subscriptionService } from './subscriptionService';
export { accessService } from './accessService';

// Regroupement pour import facile
export const api = {
  pricing: pricingService,
  subscriptions: subscriptionService,
  access: accessService
};