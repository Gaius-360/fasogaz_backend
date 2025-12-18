// ==========================================
// FICHIER: src/store/authStore.js
// Store d'authentification UNIFIÉ (clients, revendeurs, admins)
// ==========================================

import { create } from 'zustand';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  // ✅ LOGIN UNIVERSEL - Gère tous les rôles (client, revendeur, admin)
  login: (token, user) => {
    // Sauvegarder selon le rôle
    if (user.role === 'admin') {
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminUser', JSON.stringify(user));
    } else {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }

    set({
      user,
      token,
      isAuthenticated: true
    });

    console.log('✅ Login réussi:', { role: user.role, username: user.username || user.phone });
  },

  // ✅ ALIAS pour compatibilité avec le code existant
  setAuth: (user, token) => {
    get().login(token, user);
  },

  // ✅ LOGOUT
  logout: () => {
    // Nettoyer tous les tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
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
    } else {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    set({ user: updatedUser });
  },

  // ✅ INIT - Restaurer la session au démarrage
  initAuth: () => {
    // Vérifier d'abord si c'est un admin
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

    // Sinon vérifier session client/revendeur
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