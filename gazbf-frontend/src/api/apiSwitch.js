// ==========================================
// FICHIER: src/api/apiSwitch.js
// Permet de basculer entre API réelle et Mock
// ==========================================

import mockApi from './mockApi';
import authService from './authService';
import productService from './productService';
import addressService from './addressService';
import orderService from './orderService';
import subscriptionService from './subscriptionService';
import sellerService from './sellerService';

// ⚠️ CONFIGURATION : Changer à false pour utiliser l'API réelle
const USE_MOCK_API = true;

// Log pour savoir quel mode est actif
console.log(`🔧 API Mode: ${USE_MOCK_API ? 'MOCK (Test)' : 'REAL (Production)'}`);

// Services adaptés
export const api = {
  auth: USE_MOCK_API ? mockApi.auth : authService,
  products: USE_MOCK_API ? mockApi.products : productService,
  addresses: USE_MOCK_API ? mockApi.addresses : addressService,
  orders: USE_MOCK_API ? mockApi.orders : orderService,
  seller: USE_MOCK_API ? mockApi.seller : sellerService,  
  subscriptions: USE_MOCK_API ? mockApi.subscriptions : subscriptionService,
  
  // ✅ SERVICES ADMIN - Utilisent directement mockApi
  adminAuth: mockApi.adminAuth,
  adminStats: mockApi.adminStats,
  admin: mockApi.admin
};

export default api;