// ==========================================
// FICHIER: src/api/addressService.js
// ==========================================
import api from './axios';

const addressService = {
  // Obtenir mes adresses
  getMyAddresses: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },

  // Créer une adresse
  createAddress: async (addressData) => {
    const response = await api.post('/addresses', addressData);
    return response.data;
  },

  // Mettre à jour une adresse
  updateAddress: async (id, addressData) => {
    const response = await api.put(`/addresses/${id}`, addressData);
    return response.data;
  },

  // Supprimer une adresse
  deleteAddress: async (id) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  }
};

export default addressService;