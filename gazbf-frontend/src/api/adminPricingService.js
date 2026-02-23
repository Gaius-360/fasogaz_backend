import apiClient from './apiClient';

export default {
  getPlans: (target) =>
    apiClient.get(`/admin/pricing?target=${target}`),

  create: (data) =>
    apiClient.post('/admin/pricing', data),

  update: (id, data) =>
    apiClient.put(`/admin/pricing/${id}`, data),

  remove: (id) =>
    apiClient.delete(`/admin/pricing/${id}`)
};
