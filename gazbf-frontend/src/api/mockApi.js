// ==========================================
// FICHIER COMPLET: src/api/mockApi.js
// Remplacer TOUT le contenu du fichier mockApi.js par ce code
// ==========================================

// Données de test
const mockData = {
  users: [

    // CLIENT TEST
    {
      id: 'user-1',
      phone: '+22670123456',
      password: 'Test1234',
      firstName: 'Jean',
      lastName: 'Ouédraogo',
      email: 'jean@test.com',
      role: 'client',
      city: 'Ouagadougou',
      isVerified: true,
      createdAt: new Date().toISOString()
    },
    // REVENDEUR TEST
    {
      id: 'seller-user-1',
      phone: '+22670123477',
      password: 'Test1234',
      firstName: 'Test',
      lastName: 'Revendeur',
      email: 'revendeur@gazbf.com',
      role: 'revendeur',
      city: 'Ouagadougou',
      businessName: 'Dépôt Test GAZBF',
      quarter: 'Gounghin',
      latitude: 12.3714,
      longitude: -1.5197,
      isVerified: true,
      validationStatus: 'approved',
      deliveryAvailable: true,
      deliveryFee: 500,
      totalOrders: 15,
      completedOrders: 12,
      averageRating: 4.7,
      totalReviews: 8,
      createdAt: new Date(Date.now() - 90 * 86400000).toISOString()
    },
    // Clients pour tests revendeur
    { id: 'client-1', phone: '+22671111111', firstName: 'Alice', lastName: 'Dupont', role: 'client' },
    { id: 'client-2', phone: '+22672222222', firstName: 'Bob', lastName: 'Martin', role: 'client' }
  ],
  
  sellers: [
    { id: 'seller-1', businessName: 'Dépôt Wend Konta', phone: '+22670111111', quarter: 'Gounghin', city: 'Ouagadougou', latitude: 12.3714, longitude: -1.5197, deliveryAvailable: true, deliveryFee: 500, averageRating: 4.5, totalReviews: 25 },
    { id: 'seller-2', businessName: 'Gaz Express Ouaga', phone: '+22670222222', quarter: 'Cissin', city: 'Ouagadougou', latitude: 12.3678, longitude: -1.5289, deliveryAvailable: true, deliveryFee: 1000, averageRating: 4.8, totalReviews: 42 },
    { id: 'seller-user-1', businessName: 'Dépôt Test GAZBF', phone: '+22670123477', quarter: 'Gounghin', city: 'Ouagadougou', latitude: 12.3714, longitude: -1.5197, deliveryAvailable: true, deliveryFee: 500, averageRating: 4.7, totalReviews: 8 }
  ],
  
  products: [
    // Produits autres revendeurs (pour recherche client)
    { id: 'prod-1', sellerId: 'seller-1', brand: 'Shell Gas', bottleType: '6kg', price: 4500, quantity: 20, status: 'available', viewCount: 45 },
    { id: 'prod-2', sellerId: 'seller-1', brand: 'Shell Gas', bottleType: '12kg', price: 8500, quantity: 15, status: 'available', viewCount: 62 },
    // Produits revendeur test
    { id: 'prod-s1', sellerId: 'seller-user-1', brand: 'Shell Gas', bottleType: '6kg', price: 6000, quantity: 15, status: 'available', viewCount: 45, orderCount: 12, createdAt: new Date(Date.now() - 80 * 86400000).toISOString() },
    { id: 'prod-s2', sellerId: 'seller-user-1', brand: 'Total Gas', bottleType: '12kg', price: 11000, quantity: 8, status: 'available', viewCount: 38, orderCount: 9, createdAt: new Date(Date.now() - 75 * 86400000).toISOString() },
    { id: 'prod-s3', sellerId: 'seller-user-1', brand: 'Vitogaz', bottleType: '25kg', price: 20000, quantity: 3, status: 'limited', viewCount: 22, orderCount: 5, createdAt: new Date(Date.now() - 70 * 86400000).toISOString() },
    { id: 'prod-s4', sellerId: 'seller-user-1', brand: 'Afrigas', bottleType: '6kg', price: 5500, quantity: 0, status: 'out_of_stock', viewCount: 15, orderCount: 0, createdAt: new Date(Date.now() - 65 * 86400000).toISOString() }
  ],
  
  addresses: [
    { id: 'addr-1', userId: 'user-1', label: 'Maison', city: 'Ouagadougou', quarter: 'Gounghin', fullAddress: 'Rue 12.45, près du marché', latitude: 12.3714, longitude: -1.5197, isDefault: true }
  ],
  
  orders: [
    // Commandes CLIENT
    { id: 'order-1', orderNumber: 'ORD-20250101-001', userId: 'user-1', customerId: 'user-1', sellerId: 'seller-1', items: [{ id: 'item-1', productId: 'prod-1', quantity: 2, unitPrice: 4500, subtotal: 9000 }], subtotal: 9000, deliveryFee: 500, total: 9500, deliveryMode: 'delivery', deliveryAddressId: 'addr-1', status: 'pending', customerNote: 'Livrer avant 18h', createdAt: new Date(Date.now() - 3600000).toISOString() },
    // Commandes REVENDEUR (reçues)
    { id: 'order-s1', orderNumber: 'ORD-20250114-001', customerId: 'client-1', sellerId: 'seller-user-1', items: [{ id: 'item-s1', productId: 'prod-s1', quantity: 2, unitPrice: 6000, subtotal: 12000 }], subtotal: 12000, deliveryFee: 500, total: 12500, deliveryMode: 'delivery', deliveryAddress: { label: 'Maison', fullAddress: 'Rue 12.45', quarter: 'Gounghin', city: 'Ouagadougou' }, customerNote: 'Urgent', status: 'pending', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'order-s2', orderNumber: 'ORD-20250114-002', customerId: 'client-2', sellerId: 'seller-user-1', items: [{ id: 'item-s2', productId: 'prod-s2', quantity: 1, unitPrice: 11000, subtotal: 11000 }], subtotal: 11000, deliveryFee: 0, total: 11000, deliveryMode: 'pickup', status: 'accepted', estimatedTime: 20, acceptedAt: new Date(Date.now() - 1 * 3600000).toISOString(), createdAt: new Date(Date.now() - 3 * 3600000).toISOString() },
    { id: 'order-s3', orderNumber: 'ORD-20250110-015', customerId: 'client-2', sellerId: 'seller-user-1', items: [{ id: 'item-s3', productId: 'prod-s1', quantity: 3, unitPrice: 6000, subtotal: 18000 }], subtotal: 18000, deliveryFee: 0, total: 18000, deliveryMode: 'pickup', status: 'completed', estimatedTime: 15, acceptedAt: new Date(Date.now() - 96 * 3600000).toISOString(), completedAt: new Date(Date.now() - 95 * 3600000).toISOString(), createdAt: new Date(Date.now() - 97 * 3600000).toISOString() }
  ],
  
  reviews: [
    { id: 'review-1', customerId: 'client-1', sellerId: 'seller-user-1', orderId: 'order-s3', rating: 5, comment: 'Excellent service !', createdAt: new Date(Date.now() - 95 * 3600000).toISOString() },
    { id: 'review-2', customerId: 'client-2', sellerId: 'seller-user-1', rating: 4, comment: 'Bon service', createdAt: new Date(Date.now() - 240 * 3600000).toISOString() }
  ],
  
  subscriptionPlans: [
    { id: 'plan-1', name: 'Hebdomadaire', planType: 'weekly', price: 500, duration: 7, role: 'client', isActive: true },
    { id: 'plan-2', name: 'Mensuel', planType: 'monthly', price: 1500, duration: 30, role: 'client', isActive: true },
    { id: 'plan-3', name: 'Annuel', planType: 'yearly', price: 15000, duration: 365, role: 'client', isActive: true },
    { id: 'plan-seller-1', name: 'Mensuel Pro', planType: 'monthly', price: 5000, duration: 30, role: 'revendeur', isActive: true },
    { id: 'plan-seller-2', name: 'Trimestriel Pro', planType: 'quarterly', price: 12750, duration: 90, role: 'revendeur', isActive: true },
    { id: 'plan-seller-3', name: 'Annuel Premium', planType: 'yearly', price: 42000, duration: 365, role: 'revendeur', isActive: true }
  ],
  
  subscriptions: [
    { id: 'sub-1', userId: 'user-1', planId: 'plan-2', planType: 'monthly', startDate: new Date(Date.now() - 86400000 * 5).toISOString(), endDate: new Date(Date.now() + 86400000 * 25).toISOString(), isActive: true, autoRenew: false },
    { id: 'sub-seller-1', userId: 'seller-user-1', planId: 'plan-seller-2', planType: 'quarterly', startDate: new Date(Date.now() - 86400000 * 15).toISOString(), endDate: new Date(Date.now() + 86400000 * 75).toISOString(), isActive: true, autoRenew: false }
  ],
  
  transactions: [
    { id: 'trans-1', userId: 'user-1', planId: 'plan-2', subscriptionId: 'sub-1', amount: 1500, transactionRef: 'TXN-20241226-001', status: 'completed', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 'trans-seller-1', userId: 'seller-user-1', planId: 'plan-seller-2', subscriptionId: 'sub-seller-1', amount: 12750, transactionRef: 'TXN-20241230-005', status: 'completed', createdAt: new Date(Date.now() - 86400000 * 15).toISOString() }
  ]
};

// Helpers
const findById = (array, id) => array.find(item => item.id === id);
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));
const enrichOrder = (order) => ({
  ...order,
  customer: findById(mockData.users, order.customerId),
  seller: findById(mockData.sellers, order.sellerId),
  items: order.items.map(item => ({ ...item, product: findById(mockData.products, item.productId) }))
});

// AUTH (Commun)
export const mockAuthService = {
  login: async (phone, password) => {
    await delay();
    const user = mockData.users.find(u => u.phone === phone && u.password === password);
    if (!user) throw new Error('Identifiants incorrects');
    return { success: true, data: { user, token: `mock-token-${Date.now()}` } };
  },
  register: async (userData) => {
    await delay();
    if (mockData.users.find(u => u.phone === userData.phone)) throw new Error('Numéro déjà utilisé');
    const newUser = { id: generateId('user'), ...userData, isVerified: false, validationStatus: userData.role === 'revendeur' ? 'pending' : undefined, createdAt: new Date().toISOString() };
    mockData.users.push(newUser);
    return { success: true, data: { userId: newUser.id } };
  },
  verifyOTP: async (phone, otp) => { await delay(); const user = mockData.users.find(u => u.phone === phone); if (user) user.isVerified = true; return { success: true }; },
  updateProfile: async (userData) => { await delay(); const user = mockData.users.find(u => u.id === 'user-1' || u.id === 'seller-user-1'); if (user) Object.assign(user, userData); return { success: true, data: user }; }
};

// PRODUITS (Search client)
export const mockProductService = {
  searchProducts: async (params) => {
    await delay(800);
    let products = [...mockData.products];
    if (params.bottleType) products = products.filter(p => p.bottleType === params.bottleType);
    if (params.brand) products = products.filter(p => p.brand === params.brand);
    if (params.minPrice) products = products.filter(p => p.price >= parseFloat(params.minPrice));
    if (params.maxPrice) products = products.filter(p => p.price <= parseFloat(params.maxPrice));
    const enrichedProducts = products.map(product => {
      const seller = findById(mockData.sellers, product.sellerId);
      let distance = null;
      if (params.latitude && params.longitude && seller) {
        const R = 6371, dLat = (seller.latitude - params.latitude) * Math.PI / 180, dLon = (seller.longitude - params.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(params.latitude * Math.PI / 180) * Math.cos(seller.latitude * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
      }
      return { ...product, seller, distance };
    });
    let finalProducts = params.radius && params.latitude ? enrichedProducts.filter(p => p.distance !== null && p.distance <= parseFloat(params.radius)) : enrichedProducts;
    if (params.latitude) finalProducts.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    return { success: true, data: { products: finalProducts, total: finalProducts.length } };
  }
};

// ADRESSES (Client)
export const mockAddressService = {
  getMyAddresses: async () => { await delay(); return { success: true, data: mockData.addresses.filter(a => a.userId === 'user-1') }; },
  createAddress: async (addressData) => { await delay(); if (addressData.isDefault) mockData.addresses.forEach(a => { if (a.userId === 'user-1') a.isDefault = false; }); const newAddress = { id: generateId('addr'), userId: 'user-1', ...addressData, createdAt: new Date().toISOString() }; mockData.addresses.push(newAddress); return { success: true, data: newAddress }; },
  updateAddress: async (id, addressData) => { await delay(); const address = findById(mockData.addresses, id); if (!address) throw new Error('Adresse non trouvée'); if (addressData.isDefault) mockData.addresses.forEach(a => { if (a.userId === 'user-1' && a.id !== id) a.isDefault = false; }); Object.assign(address, addressData); return { success: true, data: address }; },
  deleteAddress: async (id) => { await delay(); const index = mockData.addresses.findIndex(a => a.id === id); if (index > -1) mockData.addresses.splice(index, 1); return { success: true }; }
};

// COMMANDES (Client)
export const mockOrderService = {
  createOrder: async (orderData) => { await delay(1000); const enrichedItems = orderData.items.map(item => { const product = findById(mockData.products, item.productId); return { id: generateId('item'), ...item, unitPrice: product.price, subtotal: product.price * item.quantity, product }; }); const subtotal = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0); const seller = findById(mockData.sellers, orderData.sellerId); const deliveryFee = orderData.deliveryMode === 'delivery' ? seller.deliveryFee : 0; const newOrder = { id: generateId('order'), orderNumber: `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, userId: 'user-1', customerId: 'user-1', sellerId: orderData.sellerId, items: enrichedItems, subtotal, deliveryFee, total: subtotal + deliveryFee, deliveryMode: orderData.deliveryMode, deliveryAddressId: orderData.deliveryAddressId, customerNote: orderData.customerNote, status: 'pending', createdAt: new Date().toISOString(), seller, deliveryAddress: orderData.deliveryAddressId ? findById(mockData.addresses, orderData.deliveryAddressId) : null }; mockData.orders.unshift(newOrder); return { success: true, data: newOrder }; },
  getMyOrders: async (status) => { await delay(); let orders = mockData.orders.filter(o => o.userId === 'user-1'); if (status) orders = orders.filter(o => o.status === status); return { success: true, data: orders.map(order => ({ ...order, seller: findById(mockData.sellers, order.sellerId), deliveryAddress: order.deliveryAddressId ? findById(mockData.addresses, order.deliveryAddressId) : null })) }; },
  cancelOrder: async (orderId) => { await delay(); const order = findById(mockData.orders, orderId); if (!order) throw new Error('Commande non trouvée'); order.status = 'cancelled'; order.cancelledAt = new Date().toISOString(); return { success: true, data: order }; }
};

// REVENDEUR - PRODUITS
export const mockSellerService = {
  getMyProducts: async () => { await delay(); const products = mockData.products.filter(p => p.sellerId === 'seller-user-1'); return { success: true, data: { products, stats: { total: products.length, available: products.filter(p => p.status === 'available').length, limited: products.filter(p => p.status === 'limited').length, outOfStock: products.filter(p => p.status === 'out_of_stock').length } } }; },
  createProduct: async (productData) => { await delay(800); if (mockData.products.find(p => p.sellerId === 'seller-user-1' && p.bottleType === productData.bottleType && p.brand === productData.brand)) throw new Error('Produit existe déjà'); let status = productData.quantity === 0 ? 'out_of_stock' : productData.quantity <= 5 ? 'limited' : 'available'; const newProduct = { id: generateId('prod-s'), sellerId: 'seller-user-1', ...productData, status, viewCount: 0, orderCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; mockData.products.push(newProduct); return { success: true, data: newProduct }; },
  updateProduct: async (id, productData) => { await delay(600); const product = findById(mockData.products, id); if (!product) throw new Error('Produit non trouvé'); let status = product.status; if (productData.quantity !== undefined) status = productData.quantity === 0 ? 'out_of_stock' : productData.quantity <= 5 ? 'limited' : 'available'; Object.assign(product, { ...productData, status, updatedAt: new Date().toISOString() }); return { success: true, data: product }; },
  deleteProduct: async (id) => { await delay(400); const index = mockData.products.findIndex(p => p.id === id); if (index === -1) throw new Error('Produit non trouvé'); mockData.products.splice(index, 1); return { success: true }; },
  // COMMANDES REÇUES
  getReceivedOrders: async (status) => { await delay(700); let orders = mockData.orders.filter(o => o.sellerId === 'seller-user-1'); if (status) orders = orders.filter(o => o.status === status); const enrichedOrders = orders.map(enrichOrder).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); const stats = { pending: orders.filter(o => o.status === 'pending').length, accepted: orders.filter(o => o.status === 'accepted').length, preparing: orders.filter(o => o.status === 'preparing').length, inDelivery: orders.filter(o => o.status === 'in_delivery').length, completed: orders.filter(o => o.status === 'completed').length, cancelled: orders.filter(o => o.status === 'cancelled').length, rejected: orders.filter(o => o.status === 'rejected').length, totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0) }; return { success: true, data: { orders: enrichedOrders, stats } }; },
  acceptOrder: async (orderId, estimatedTime) => { await delay(800); const order = findById(mockData.orders, orderId); if (!order || order.status !== 'pending') throw new Error('Impossible d\'accepter'); order.status = 'accepted'; order.estimatedTime = estimatedTime; order.acceptedAt = new Date().toISOString(); return { success: true, data: enrichOrder(order) }; },
  rejectOrder: async (orderId, rejectionReason) => { await delay(800); const order = findById(mockData.orders, orderId); if (!order || order.status !== 'pending') throw new Error('Impossible de rejeter'); order.status = 'rejected'; order.rejectionReason = rejectionReason; order.rejectedAt = new Date().toISOString(); return { success: true, data: enrichOrder(order) }; },
  updateOrderStatus: async (orderId, newStatus) => { await delay(600); const order = findById(mockData.orders, orderId); if (!order) throw new Error('Commande non trouvée'); const validTransitions = { 'accepted': ['preparing'], 'preparing': ['in_delivery'], 'in_delivery': ['completed'] }; if (!validTransitions[order.status]?.includes(newStatus)) throw new Error('Transition invalide'); order.status = newStatus; if (newStatus === 'completed') order.completedAt = new Date().toISOString(); return { success: true, data: enrichOrder(order) }; },
  // AVIS
  getReceivedReviews: async () => { await delay(600); const reviews = mockData.reviews.filter(r => r.sellerId === 'seller-user-1').map(review => ({ ...review, customer: findById(mockData.users, review.customerId), order: findById(mockData.orders, review.orderId) })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0; return { success: true, data: { reviews, stats: { total: reviews.length, average: parseFloat(average.toFixed(1)), distribution: { 5: reviews.filter(r => r.rating === 5).length, 4: reviews.filter(r => r.rating === 4).length, 3: reviews.filter(r => r.rating === 3).length, 2: reviews.filter(r => r.rating === 2).length, 1: reviews.filter(r => r.rating === 1).length } } } }; }
};

// ABONNEMENTS
export const mockSubscriptionService = {
  getPlans: async (role) => { await delay(); return { success: true, data: mockData.subscriptionPlans.filter(p => !role || p.role === role) }; },
  getMySubscription: async () => { 
    await delay(); 
    const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 'user-1';
    const subscription = mockData.subscriptions.find(s => s.userId === userId); 
    if (!subscription) return { success: true, data: { subscription: null, status: { isExpired: false, willExpireSoon: false, daysRemaining: 0 }, transactions: [] } }; 
    const enrichedSub = { ...subscription, plan: findById(mockData.subscriptionPlans, subscription.planId) }; 
    const now = new Date(), endDate = new Date(subscription.endDate), daysRemaining = Math.ceil((endDate - now) / 86400000); 
    enrichedSub.isActive = daysRemaining >= 0;
    return { success: true, data: { subscription: enrichedSub, status: { isExpired: daysRemaining < 0, willExpireSoon: daysRemaining > 0 && daysRemaining <= 7, daysRemaining: Math.max(0, daysRemaining) }, transactions: mockData.transactions.filter(t => t.userId === userId).map(t => ({ ...t, plan: findById(mockData.subscriptionPlans, t.planId) })) } }; 
  },
  createSubscription: async (subscriptionData) => { await delay(1000); const plan = findById(mockData.subscriptionPlans, subscriptionData.planId); if (!plan) throw new Error('Plan non trouvé'); return { success: true, data: { transactionRef: `TXN-${Date.now()}`, paymentUrl: '#', message: 'Redirection paiement' } }; },
  confirmPayment: async (transactionRef, externalRef) => { await delay(1500); const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 'user-1'; let subscription = mockData.subscriptions.find(s => s.userId === userId); const now = new Date(); if (!subscription) { subscription = { id: generateId('sub'), userId, planId: 'plan-2', planType: 'monthly', startDate: now.toISOString(), endDate: new Date(now.getTime() + 30 * 86400000).toISOString(), isActive: true, autoRenew: false }; mockData.subscriptions.push(subscription); } else { const endDate = new Date(subscription.endDate); const newEndDate = endDate > now ? endDate : now; newEndDate.setDate(newEndDate.getDate() + 30); subscription.endDate = newEndDate.toISOString(); subscription.isActive = true; } const transaction = { id: generateId('trans'), userId, planId: subscription.planId, subscriptionId: subscription.id, amount: 1500, transactionRef, externalRef, status: 'completed', paymentMethod: 'mobile_money', createdAt: now.toISOString() }; mockData.transactions.push(transaction); return { success: true, data: { message: 'Paiement confirmé', subscription, transaction } }; }
};


// DONNÉES ADMIN (à ajouter dans mockData)
const adminData = {
  // Compte super-admin par défaut
  admin: {
    id: 'admin-1',
    username: 'admin',
    password: 'Admin@2025', // À CHANGER EN PRODUCTION
    email: 'admin@gazbf.bf',
    firstName: 'Administrateur',
    lastName: 'GAZBF',
    role: 'super_admin',
    createdAt: new Date('2025-01-01').toISOString(),
    lastLogin: null,
    permissions: [
      'manage_users',
      'manage_sellers',
      'manage_orders',
      'manage_transactions',
      'manage_subscriptions',
      'manage_settings',
      'view_analytics',
      'manage_admins'
    ]
  }
};

// SERVICE ADMIN AUTH (à ajouter dans les exports)
export const mockAdminAuthService = {
  login: async (username, password) => {
    await delay(800);
    
    if (username !== adminData.admin.username || password !== adminData.admin.password) {
      throw new Error('Identifiants administrateur incorrects');
    }
    
    // Mettre à jour la dernière connexion
    adminData.admin.lastLogin = new Date().toISOString();
    
    return {
      success: true,
      data: {
        admin: {
          id: adminData.admin.id,
          username: adminData.admin.username,
          email: adminData.admin.email,
          firstName: adminData.admin.firstName,
          lastName: adminData.admin.lastName,
          role: adminData.admin.role,
          permissions: adminData.admin.permissions
        },
        token: `admin-token-${Date.now()}`
      }
    };
  },

  getProfile: async () => {
    await delay(400);
    return {
      success: true,
      data: {
        id: adminData.admin.id,
        username: adminData.admin.username,
        email: adminData.admin.email,
        firstName: adminData.admin.firstName,
        lastName: adminData.admin.lastName,
        role: adminData.admin.role,
        permissions: adminData.admin.permissions,
        lastLogin: adminData.admin.lastLogin
      }
    };
  },

  changePassword: async (currentPassword, newPassword) => {
    await delay(600);
    
    if (currentPassword !== adminData.admin.password) {
      throw new Error('Mot de passe actuel incorrect');
    }
    
    if (newPassword.length < 8) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères');
    }
    
    // Mettre à jour le mot de passe
    adminData.admin.password = newPassword;
    
    return {
      success: true,
      message: 'Mot de passe modifié avec succès'
    };
  }
};

// SERVICE ADMIN STATS (statistiques pour le dashboard)
export const mockAdminStatsService = {
  getDashboardStats: async () => {
    await delay(1000);
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth - 1;
    
    return {
      success: true,
      data: {
        users: {
          total: 1247,
          clients: 1158,
          sellers: 89,
          growth: 15,
          newThisMonth: 89
        },
        revenue: {
          today: 45000,
          thisMonth: 890000,
          lastMonth: 773913,
          growth: 15,
          bySource: {
            clients: 285000,
            sellers: 605000
          }
        },
        orders: {
          today: 156,
          thisMonth: 3421,
          successRate: 87,
          avgProcessingTime: 18
        },
        subscriptions: {
          activeClients: 856,
          activeSellers: 67,
          clientRate: 69,
          sellerRate: 75,
          expiringIn3Days: 156
        },
        validation: {
          pending: 11,
          validated: 78,
          rejected: 0,
          validationRate: 88
        },
        activity: {
          dailyConnections: 2340,
          engagement: 'high'
        },
        alerts: {
          critical: [
            {
              id: 1,
              type: 'validation_pending',
              message: '11 demandes de validation en attente (>48h)',
              count: 11,
              priority: 'high'
            }
          ],
          warnings: [
            {
              id: 2,
              type: 'expiring_subscriptions',
              message: '156 abonnements expirent dans 3 jours',
              count: 156,
              priority: 'medium'
            }
          ]
        }
      }
    };
  },

  getRevenueChart: async (period = '30days') => {
    await delay(600);
    
    // Générer des données pour les 30 derniers jours
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        clients: Math.floor(Math.random() * 15000) + 5000,
        sellers: Math.floor(Math.random() * 25000) + 15000,
        total: 0
      });
      data[data.length - 1].total = data[data.length - 1].clients + data[data.length - 1].sellers;
    }
    
    return {
      success: true,
      data
    };
  }
};

// MOCK ADMIN SERVICES
export const mockAdminServices = {
  // ============ REVENDEURS ============
  sellers: {
    getAll: async (filters = {}) => {
      await delay(700);
      let sellers = mockData.sellers.map(seller => {
        const user = mockData.users.find(u => u.id === seller.id);
        return { ...seller, ...user };
      });

      // Appliquer les filtres
      if (filters.city) sellers = sellers.filter(s => s.city === filters.city);
      if (filters.status) {
        if (filters.status === 'active') sellers = sellers.filter(s => s.validationStatus === 'approved');
        if (filters.status === 'pending') sellers = sellers.filter(s => s.validationStatus === 'pending');
        if (filters.status === 'suspended') sellers = sellers.filter(s => s.validationStatus === 'suspended');
      }

      return { success: true, data: sellers };
    },

    getPending: async () => {
      await delay(600);
      const pending = mockData.users.filter(u => u.role === 'revendeur' && u.validationStatus === 'pending');
      return { success: true, data: pending };
    },

    getById: async (id) => {
      await delay(400);
      const user = mockData.users.find(u => u.id === id);
      const seller = mockData.sellers.find(s => s.id === id);
      const products = mockData.products.filter(p => p.sellerId === id);
      const orders = mockData.orders.filter(o => o.sellerId === id);
      const reviews = mockData.reviews.filter(r => r.sellerId === id);

      return {
        success: true,
        data: {
          ...user,
          ...seller,
          products,
          stats: {
            totalOrders: orders.length,
            completedOrders: orders.filter(o => o.status === 'completed').length,
            totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
            averageRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
            totalReviews: reviews.length
          }
        }
      };
    },

    validate: async (id, message) => {
      await delay(800);
      const user = mockData.users.find(u => u.id === id);
      if (!user) throw new Error('Revendeur non trouvé');
      user.validationStatus = 'approved';
      user.isVerified = true;
      return { success: true, message: 'Revendeur validé avec succès' };
    },

    reject: async (id, reason, message) => {
      await delay(800);
      const user = mockData.users.find(u => u.id === id);
      if (!user) throw new Error('Revendeur non trouvé');
      user.validationStatus = 'rejected';
      user.rejectionReason = reason;
      user.rejectionMessage = message;
      return { success: true, message: 'Demande rejetée' };
    },

    suspend: async (id, reason, duration) => {
      await delay(600);
      const user = mockData.users.find(u => u.id === id);
      if (!user) throw new Error('Revendeur non trouvé');
      user.validationStatus = 'suspended';
      user.suspensionReason = reason;
      user.suspendedUntil = duration === 'indefinite' ? null : new Date(Date.now() + duration * 86400000).toISOString();
      return { success: true, message: 'Revendeur suspendu' };
    },

    reactivate: async (id) => {
      await delay(500);
      const user = mockData.users.find(u => u.id === id);
      if (!user) throw new Error('Revendeur non trouvé');
      user.validationStatus = 'approved';
      user.suspensionReason = null;
      user.suspendedUntil = null;
      return { success: true, message: 'Revendeur réactivé' };
    },

    delete: async (id) => {
      await delay(600);
      const userIndex = mockData.users.findIndex(u => u.id === id);
      if (userIndex > -1) mockData.users.splice(userIndex, 1);
      const sellerIndex = mockData.sellers.findIndex(s => s.id === id);
      if (sellerIndex > -1) mockData.sellers.splice(sellerIndex, 1);
      return { success: true, message: 'Revendeur supprimé' };
    }
  },

  // ============ CLIENTS ============
  clients: {
    getAll: async (filters = {}) => {
      await delay(700);
      let clients = mockData.users.filter(u => u.role === 'client');

      // Enrichir avec stats
      clients = clients.map(client => {
        const orders = mockData.orders.filter(o => o.customerId === client.id);
        const subscription = mockData.subscriptions.find(s => s.userId === client.id);
        return {
          ...client,
          stats: {
            totalOrders: orders.length,
            totalSpent: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
            lastOrder: orders.length > 0 ? orders[0].createdAt : null
          },
          subscription
        };
      });

      // Appliquer filtres
      if (filters.city) clients = clients.filter(c => c.city === filters.city);
      if (filters.status) {
        if (filters.status === 'active') clients = clients.filter(c => c.subscription?.isActive);
        if (filters.status === 'blocked') clients = clients.filter(c => c.isBlocked);
      }

      return { success: true, data: clients };
    },

    getById: async (id) => {
      await delay(500);
      const client = mockData.users.find(u => u.id === id);
      if (!client) throw new Error('Client non trouvé');
      
      const orders = mockData.orders.filter(o => o.customerId === id);
      const subscription = mockData.subscriptions.find(s => s.userId === id);
      const addresses = mockData.addresses.filter(a => a.userId === id);
      
      return {
        success: true,
        data: {
          ...client,
          orders,
          subscription,
          addresses,
          stats: {
            totalOrders: orders.length,
            completedOrders: orders.filter(o => o.status === 'completed').length,
            totalSpent: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
            avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0
          }
        }
      };
    },

    block: async (id, reason) => {
      await delay(600);
      const user = mockData.users.find(u => u.id === id);
      if (!user) throw new Error('Client non trouvé');
      user.isBlocked = true;
      user.blockReason = reason;
      user.blockedAt = new Date().toISOString();
      return { success: true, message: 'Client bloqué' };
    },

    unblock: async (id) => {
      await delay(500);
      const user = mockData.users.find(u => u.id === id);
      if (!user) throw new Error('Client non trouvé');
      user.isBlocked = false;
      user.blockReason = null;
      user.blockedAt = null;
      return { success: true, message: 'Client débloqué' };
    },

    delete: async (id) => {
      await delay(700);
      const index = mockData.users.findIndex(u => u.id === id);
      if (index > -1) mockData.users.splice(index, 1);
      return { success: true, message: 'Client supprimé' };
    }
  },

  // ============ COMMANDES ============
  orders: {
    getAll: async (filters = {}) => {
      await delay(800);
      let orders = [...mockData.orders];

      // Appliquer filtres
      if (filters.status) orders = orders.filter(o => o.status === filters.status);
      if (filters.city) {
        orders = orders.filter(o => {
          const seller = mockData.sellers.find(s => s.id === o.sellerId);
          return seller?.city === filters.city;
        });
      }

      // Enrichir
      orders = orders.map(enrichOrder);

      return { success: true, data: orders };
    },

    getById: async (id) => {
      await delay(400);
      const order = mockData.orders.find(o => o.id === id);
      if (!order) throw new Error('Commande non trouvée');
      return { success: true, data: enrichOrder(order) };
    },

    getStats: async (period) => {
      await delay(600);
      const now = new Date();
      let orders = [...mockData.orders];

      // Filtrer par période
      if (period === 'today') {
        orders = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.toDateString() === now.toDateString();
        });
      } else if (period === 'month') {
        orders = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        });
      }

      return {
        success: true,
        data: {
          total: orders.length,
          completed: orders.filter(o => o.status === 'completed').length,
          pending: orders.filter(o => o.status === 'pending').length,
          cancelled: orders.filter(o => o.status === 'cancelled').length,
          totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0),
          avgOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0
        }
      };
    }
  },

  // ============ TRANSACTIONS ============
  transactions: {
    getAll: async (filters = {}) => {
      await delay(700);
      let transactions = [...mockData.transactions];

      // Appliquer filtres
      if (filters.status) transactions = transactions.filter(t => t.status === filters.status);
      if (filters.type) {
        if (filters.type === 'client') {
          transactions = transactions.filter(t => {
            const user = mockData.users.find(u => u.id === t.userId);
            return user?.role === 'client';
          });
        } else if (filters.type === 'seller') {
          transactions = transactions.filter(t => {
            const user = mockData.users.find(u => u.id === t.userId);
            return user?.role === 'revendeur';
          });
        }
      }

      // Enrichir
      transactions = transactions.map(t => ({
        ...t,
        user: mockData.users.find(u => u.id === t.userId),
        plan: mockData.subscriptionPlans.find(p => p.id === t.planId)
      }));

      return { success: true, data: transactions };
    },

    validate: async (id) => {
      await delay(600);
      const transaction = mockData.transactions.find(t => t.id === id);
      if (!transaction) throw new Error('Transaction non trouvée');
      transaction.status = 'completed';
      transaction.validatedAt = new Date().toISOString();
      return { success: true, message: 'Transaction validée' };
    },

    getStats: async (period) => {
      await delay(600);
      const now = new Date();
      let transactions = mockData.transactions.filter(t => t.status === 'completed');

      // Filtrer par période
      if (period === 'today') {
        transactions = transactions.filter(t => {
          const tDate = new Date(t.createdAt);
          return tDate.toDateString() === now.toDateString();
        });
      } else if (period === 'month') {
        transactions = transactions.filter(t => {
          const tDate = new Date(t.createdAt);
          return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        });
      }

      const clientTransactions = transactions.filter(t => {
        const user = mockData.users.find(u => u.id === t.userId);
        return user?.role === 'client';
      });

      const sellerTransactions = transactions.filter(t => {
        const user = mockData.users.find(u => u.id === t.userId);
        return user?.role === 'revendeur';
      });

      return {
        success: true,
        data: {
          total: transactions.reduce((sum, t) => sum + t.amount, 0),
          count: transactions.length,
          clients: {
            total: clientTransactions.reduce((sum, t) => sum + t.amount, 0),
            count: clientTransactions.length
          },
          sellers: {
            total: sellerTransactions.reduce((sum, t) => sum + t.amount, 0),
            count: sellerTransactions.length
          }
        }
      };
    }
  },

  // ============ PORTEFEUILLE ============
  wallet: {
    getBalance: async () => {
      await delay(500);
      const allTransactions = mockData.transactions.filter(t => t.status === 'completed');
      const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      return {
        success: true,
        data: {
          balance: totalRevenue,
          totalRevenue,
          thisMonth: allTransactions
            .filter(t => new Date(t.createdAt).getMonth() === new Date().getMonth())
            .reduce((sum, t) => sum + t.amount, 0)
        }
      };
    },

    getWithdrawals: async () => {
      await delay(400);
      return { success: true, data: [] };
    },

    withdraw: async (amount, method, details) => {
      await delay(1000);
      return { success: true, message: 'Demande de retrait envoyée' };
    }
  },

  // ============ PARAMÈTRES ============
  settings: {
    get: async () => {
      await delay(400);
      return {
        success: true,
        data: {
          platformName: 'GAZBF',
          version: '2.0',
          supportPhone: '+226 XX XX XX XX',
          supportEmail: 'support@gazbf.bf',
          validationDelay: 48,
          autoValidation: false
        }
      };
    },

    update: async (settings) => {
      await delay(600);
      return { success: true, message: 'Paramètres mis à jour' };
    },

    getPricing: async () => {
      await delay(400);
      return {
        success: true,
        data: {
          client: {
            weekly: 250,
            monthly: 800
          },
          seller: {
            discovery: 0,
            standard: 3000,
            pro: 7000,
            enterprise: 15000
          }
        }
      };
    },

    updatePricing: async (pricing) => {
      await delay(600);
      return { success: true, message: 'Tarifs mis à jour' };
    }
  }
};

// Modifier l'export par défaut pour inclure admin
export default {
  auth: mockAuthService,
  products: mockProductService,
  addresses: mockAddressService,
  orders: mockOrderService,
  seller: mockSellerService,
  subscriptions: mockSubscriptionService,

  adminAuth: mockAdminAuthService,
  adminStats: mockAdminStatsService,
  admin: mockAdminServices
};