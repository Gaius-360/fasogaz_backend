// ==========================================
// FICHIER: src/pages/admin/AdminAgents.jsx
// Gestion complète des agents terrain
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  ToggleLeft,
  ToggleRight,
  Link2,
  Eye,
  Calendar,
  TrendingUp,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import { formatDate } from '../../utils/helpers';

const AdminAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    isActive: 'all',
    agentZone: 'all'
  });

  // Modal états
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  // Form data pour création (SANS MOT DE PASSE)
  const [formData, setFormData] = useState({
    phone: '+226',
    firstName: '',
    lastName: '',
    email: '',
    agentZone: ''
  });

  // ==========================================
  // CHARGEMENT DES AGENTS
  // ==========================================
  useEffect(() => {
    loadAgents();
  }, [filters]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.isActive !== 'all') {
        params.isActive = filters.isActive;
      }
      if (filters.agentZone !== 'all') {
        params.agentZone = filters.agentZone;
      }

      const response = await api.admin.agents.getAll(params);
      
      if (response.success) {
        let agentsList = response.data.agents;
        
        // Filtrer par recherche
        if (filters.search) {
          const search = filters.search.toLowerCase();
          agentsList = agentsList.filter(agent => 
            agent.firstName?.toLowerCase().includes(search) ||
            agent.lastName?.toLowerCase().includes(search) ||
            agent.phone?.includes(search) ||
            agent.agentCode?.toLowerCase().includes(search)
          );
        }
        
        setAgents(agentsList);
      }
    } catch (error) {
      console.error('❌ Erreur chargement agents:', error);
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des agents'
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CRÉER UN AGENT
  // ==========================================
  const handleCreateAgent = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await api.admin.agents.create(formData);
      
      if (response.success) {
        const newAgentCode = response.data.agentCode;
        
        setAlert({
          type: 'success',
          message: (
            <div>
              <p className="font-semibold mb-2">Agent créé avec succès !</p>
              <div className="bg-white/10 rounded p-2 flex items-center justify-between">
                <span className="font-mono text-sm">Code: {newAgentCode}</span>
                <button
                  onClick={() => copyToClipboard(newAgentCode)}
                  className="ml-2 p-1 hover:bg-white/20 rounded"
                >
                  {copiedCode === newAgentCode ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs mt-2">Communiquez ce code à l'agent</p>
            </div>
          )
        });
        
        setShowCreateModal(false);
        setFormData({
          phone: '+226',
          firstName: '',
          lastName: '',
          email: '',
          agentZone: ''
        });
        
        loadAgents();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors de la création'
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // COPIER LE CODE AGENT
  // ==========================================
  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ==========================================
  // VOIR DÉTAILS AGENT
  // ==========================================
  const handleViewAgent = async (agentId) => {
    try {
      const response = await api.admin.agents.getById(agentId);
      
      if (response.success) {
        setSelectedAgent(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du chargement des détails'
      });
    }
  };

  // ==========================================
  // TOGGLE STATUS
  // ==========================================
  const handleToggleStatus = async (agentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir changer le statut de cet agent ?')) {
      return;
    }
    
    try {
      const response = await api.admin.agents.toggleStatus(agentId);
      
      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Statut modifié avec succès'
        });
        loadAgents();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors de la modification'
      });
    }
  };

  // ==========================================
  // SUPPRIMER AGENT
  // ==========================================
  const handleDeleteAgent = async (agentId, agentName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'agent ${agentName} ?`)) {
      return;
    }
    
    try {
      const response = await api.admin.agents.delete(agentId);
      
      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Agent supprimé avec succès'
        });
        loadAgents();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors de la suppression'
      });
    }
  };

  // ==========================================
  // RÉGÉNÉRER CODE AGENT
  // ==========================================
  const handleRegenerateCode = async (agentId, agentName) => {
    if (!window.confirm(`Régénérer le code de ${agentName} ?\n\nL'ancien code ne fonctionnera plus !`)) {
      return;
    }
    
    try {
      const response = await api.admin.agents.regenerateCode(agentId);
      
      if (response.success) {
        const newCode = response.data.newCode;
        
        setAlert({
          type: 'success',
          message: (
            <div>
              <p className="font-semibold mb-2">Code régénéré avec succès !</p>
              <div className="bg-white/10 rounded p-2 flex items-center justify-between">
                <span className="font-mono text-sm">Nouveau code: {newCode}</span>
                <button
                  onClick={() => copyToClipboard(newCode)}
                  className="ml-2 p-1 hover:bg-white/20 rounded"
                >
                  {copiedCode === newCode ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )
        });
        
        loadAgents();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors de la régénération'
      });
    }
  };

  // ==========================================
  // ZONES DISPONIBLES
  // ==========================================
  const zones = [
    'Ouagadougou',
    'Bobo-Dioulasso'
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des agents</h1>
          <p className="text-gray-600">Gérez vos agents terrain et leurs invitations</p>
        </div>
        <Button
          variant="primary"
          icon={UserPlus}
          onClick={() => setShowCreateModal(true)}
        >
          Créer un agent
        </Button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Statut */}
          <select
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>

          {/* Zone */}
          <select
            value={filters.agentZone}
            onChange={(e) => setFilters({ ...filters, agentZone: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Toutes les zones</option>
            {zones.map(zone => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>

          {/* Stats rapides */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{agents.length} agent(s)</span>
          </div>
        </div>
      </div>

      {/* Liste des agents */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun agent trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Zone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Invitations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {agent.firstName} {agent.lastName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-500 font-mono">
                            {agent.agentCode}
                          </p>
                          <button
                            onClick={() => copyToClipboard(agent.agentCode)}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="Copier le code"
                          >
                            {copiedCode === agent.agentCode ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          {agent.phone}
                        </div>
                        {agent.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4" />
                            {agent.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {agent.agentZone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">
                            {agent.invitationStats?.total || 0}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {agent.invitationStats?.used || 0} utilisées
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        agent.isAgentActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.isAgentActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewAgent(agent.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Voir détails"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleRegenerateCode(agent.id, `${agent.firstName} ${agent.lastName}`)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Régénérer le code"
                        >
                          <RefreshCw className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(agent.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title={agent.isAgentActive ? 'Désactiver' : 'Activer'}
                        >
                          {agent.isAgentActive ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent.id, `${agent.firstName} ${agent.lastName}`)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal création agent */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Créer un nouvel agent
            </h3>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    let value = e.target.value;
                    if (!value.startsWith('+226')) {
                      value = '+226';
                    }
                    setFormData({ ...formData, phone: value });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (optionnel)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone d'affectation *
                </label>
                <select
                  value={formData.agentZone}
                  onChange={(e) => setFormData({ ...formData, agentZone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Sélectionner une zone</option>
                  {zones.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>

              {/* Info importante */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Note:</strong> Un code agent unique sera généré automatiquement. 
                  L'agent l'utilisera pour se connecter.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      phone: '+226',
                      firstName: '',
                      lastName: '',
                      email: '',
                      agentZone: ''
                    });
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  Créer l'agent
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Détails de l'agent
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Informations agent */}
            <div className="space-y-6">
              {/* Identité */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Informations personnelles</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Code agent</p>
                    <p className="font-medium">{selectedAgent.agentCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nom complet</p>
                    <p className="font-medium">
                      {selectedAgent.firstName} {selectedAgent.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedAgent.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedAgent.email || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Zone</p>
                    <p className="font-medium">{selectedAgent.agentZone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      selectedAgent.isAgentActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedAgent.isAgentActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistiques invitations */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Statistiques d'invitations</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 mb-1">Total</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedAgent.stats?.totalInvitations || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 mb-1">Utilisées</p>
                    <p className="text-2xl font-bold text-green-900">
                      {selectedAgent.stats?.usedInvitations || 0}
                    </p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-yellow-600 mb-1">Actives</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {selectedAgent.stats?.activeInvitations || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dernières invitations */}
              {selectedAgent.invitations && selectedAgent.invitations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Dernières invitations</h4>
                  <div className="space-y-2">
                    {selectedAgent.invitations.slice(0, 5).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(inv.createdAt)}
                          </p>
                          {inv.seller && (
                            <p className="text-xs text-gray-600">
                              Utilisé par: {inv.seller.businessName}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          inv.status === 'used'
                            ? 'bg-green-100 text-green-800'
                            : inv.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.status === 'used' ? 'Utilisé' :
                           inv.status === 'active' ? 'Actif' : 'Expiré'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowDetailModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAgents;