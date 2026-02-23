// ==========================================
// FICHIER: src/store/toastStore.js
// ==========================================
import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }));

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  }
}));

// Helper functions
export const toast = {
  success: (message, duration) => {
    return useToastStore.getState().addToast({ type: 'success', message, duration });
  },
  error: (message, duration) => {
    return useToastStore.getState().addToast({ type: 'error', message, duration });
  },
  warning: (message, duration) => {
    return useToastStore.getState().addToast({ type: 'warning', message, duration });
  },
  info: (message, duration) => {
    return useToastStore.getState().addToast({ type: 'info', message, duration });
  }
};

export default useToastStore;