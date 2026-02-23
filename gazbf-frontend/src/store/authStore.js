// ==========================================
// FICHIER: src/store/authStore.js
// Store d'authentification UNIFIÉ (clients, revendeurs, admins, agents)
// ✅ CORRECTION: Gestion du rôle 'agent'
// ==========================================

import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  // ✅ LOGIN UNIVERSEL - Gère tous les rôles (client, revendeur, admin, agent)
  login: (token, user) => {
    console.log('🔐 Store login appelé:', { 
      hasToken: !!token, 
      tokenLength: token?.length,
      role: user?.role,
      userId: user?.id 
    });

    if (!token || !user) {
      console.error('❌ Token ou user manquant');
      return;
    }

    // ✅ Sauvegarder selon le rôle
    if (user.role === 'admin') {
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(user));
    } else if (user.role === 'agent') {
      // ✅ NOUVEAU: Stocker spécifiquement pour les agents
      localStorage.setItem('agentToken', token);
      localStorage.setItem('agentUser', JSON.stringify(user));
    } else {
      // Client ou revendeur
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }

    set({
      user,
      token,
      isAuthenticated: true
    });

    console.log('✅ Login store réussi:', { role: user.role, id: user.id });
  },

  // ✅ ALIAS pour compatibilité avec le code existant
  setAuth: (user, token) => {
    get().login(token, user);
  },

  // ✅ LOGOUT
  logout: () => {
    // Nettoyer tous les tokens possibles
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('agentToken');
    localStorage.removeItem('agentUser');
    
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false 
    });

    console.log('👋 Déconnexion effectuée');
  },

  // ✅ UPDATE USER
  updateUser: (userData) => {
    const currentUser = get().user;
    const updatedUser = { ...currentUser, ...userData };
    
    // Sauvegarder selon le rôle
    if (updatedUser.role === 'admin') {
      localStorage.setItem('adminUser', JSON.stringify(updatedUser));
    } else if (updatedUser.role === 'agent') {
      localStorage.setItem('agentUser', JSON.stringify(updatedUser));
    } else {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    set({ user: updatedUser });
  },

  // ✅ INIT - Restaurer la session au démarrage
  initAuth: () => {
    // 1. Vérifier session admin
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (adminToken && adminUser) {
      try {
        const user = JSON.parse(adminUser);
        set({
          token: adminToken,
          user,
          isAuthenticated: true
        });
        console.log('🔄 Session admin restaurée:', user.username);
        return;
      } catch (error) {
        console.error('❌ Erreur restauration session admin:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    }

    // 2. ✅ NOUVEAU: Vérifier session agent
    const agentToken = localStorage.getItem('agentToken');
    const agentUser = localStorage.getItem('agentUser');

    if (agentToken && agentUser) {
      try {
        const user = JSON.parse(agentUser);
        set({
          token: agentToken,
          user,
          isAuthenticated: true
        });
        console.log('🔄 Session agent restaurée:', user.agentCode);
        return;
      } catch (error) {
        console.error('❌ Erreur restauration session agent:', error);
        localStorage.removeItem('agentToken');
        localStorage.removeItem('agentUser');
      }
    }

    // 3. Vérifier session client/revendeur
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const userData = JSON.parse(user);
        set({
          token,
          user: userData,
          isAuthenticated: true
        });
        console.log('🔄 Session restaurée:', userData.role);
      } catch (error) {
        console.error('❌ Erreur restauration session:', error);
        localStorage.clear();
      }
    }
  }
}));

export default useAuthStore;