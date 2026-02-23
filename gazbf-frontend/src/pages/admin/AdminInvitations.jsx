// ==========================================
// FICHIER: src/pages/admin/AdminInvitations.jsx
// Vue d'ensemble de toutes les invitations
// ✅ CORRIGÉ - Utilisation correcte de l'API
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  Link2,
  Filter,
  Download,
  Eye,
  Ban,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Calendar,
  Users,
  TrendingUp,
  Copy,
  Check
} from 'lucide-react';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import { formatDate } from '../../utils/helpers';

const AdminInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    period: '30days'
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================
  useEffect(() => {
    loadInvitations();
    loadStats();
  }, [filters.status]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.status !== 'all') {
        params.status = filters.status;
      }

      // ✅ CORRECTION : Utiliser le bon endpoint API
      const response = await api.invitations.getMyInvitations(params);
      
      if (response.success) {
        let invList = response.data.invitations;
        
        // Filtrer par recherche
        if (filters.search) {
          const search = filters.search.toLowerCase();
          invList = invList.filter(inv =>
            inv.token?.toLowerCase().includes(search) ||
            inv.generator?.agentCode?.toLowerCase().includes(search) ||
            inv.seller?.businessName?.toLowerCase().includes(search)
          );
        }
        
        setInvitations(invList);
      }
    } catch (error) {
      console.error('❌ Erreur chargement invitations:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors du chargement'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // ✅ CORRECTION : Utiliser le bon endpoint
      const response = await api.invitations.getStats(filters.period);
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('❌ Erreur stats:', error);
      // Ne pas afficher d'erreur si c'est juste les stats qui échouent
    }
  };

  // ==========================================
  // COPIER LIEN
  // ==========================================
  const handleCopyLink = async (token) => {
    const url = `${window.location.origin}/register-revendeur?token=${token}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(token);
      setTimeout(() => setCopiedId(null), 2000);
      
      setAlert({
        type: 'success',
        message: 'Lien copié dans le presse-papier'
      });
    } catch (error) {
      console.error('❌ Erreur copie:', error);
      setAlert({
        type: 'error',
        message: 'Erreur lors de la copie'
      });
    }
  };

  // ==========================================
  // RÉVOQUER INVITATION
  // ==========================================
  const handleRevokeInvitation = async (invId) => {
    const reason = window.prompt('Raison de la révocation :');
    if (!reason) return;
    
    try {
      // ✅ CORRECTION : Utiliser le bon endpoint
      const response = await api.invitations.revoke(invId, reason);
      
      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Invitation révoquée avec succès'
        });
        loadInvitations();
        loadStats();
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors de la révocation'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invitations revendeurs</h1>
          <p className="text-gray-600">Suivez toutes les invitations générées</p>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-blue-600">Total généré</p>
              <Link2 className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">
              {stats.global?.totalGenerated || 0}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-green-600">Utilisées</p>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">
              {stats.global?.totalUsed || 0}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Taux: {stats.global?.conversionRate || 0}%
            </p>
          </div>

          <div className="bg-yellow-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-yellow-600">Actives</p>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-900">
              {stats.global?.totalActive || 0}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Expirées</p>
              <XCircle className="h-5 w-5 text-gray-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.global?.totalExpired || 0}
            </p>
          </div>
        </div>
      )}

      {/* Top agents */}
      {stats?.topAgents && stats.topAgents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            Top agents recruteurs
          </h3>
          <div className="space-y-3">
            {stats.topAgents.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-600">
                      #{index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {item.agent?.firstName} {item.agent?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{item.agent?.agentCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{item.recruits}</p>
                  <p className="text-xs text-gray-500">recrutements</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                loadInvitations();
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Statut */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="used">Utilisées</option>
            <option value="expired">Expirées</option>
            <option value="revoked">Révoquées</option>
          </select>

          {/* Période stats */}
          <select
            value={filters.period}
            onChange={(e) => {
              setFilters({ ...filters, period: e.target.value });
              loadStats();
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="7days">7 derniers jours</option>
            <option value="30days">30 derniers jours</option>
            <option value="90days">90 derniers jours</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-12">
            <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune invitation trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Généré par
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Expiration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Utilisé par
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {inv.generator ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {inv.generator.firstName} {inv.generator.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {inv.generator.agentCode || 'Admin'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        inv.status === 'used'
                          ? 'bg-green-100 text-green-800'
                          : inv.status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : inv.status === 'expired'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {inv.status === 'used' ? 'Utilisé' :
                         inv.status === 'active' ? 'Actif' :
                         inv.status === 'expired' ? 'Expiré' : 'Révoqué'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(inv.expiresAt)}
                    </td>
                    <td className="px-6 py-4">
                      {inv.seller ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {inv.seller.businessName}
                          </p>
                          <p className="text-xs text-gray-500">{inv.seller.phone}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {inv.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleCopyLink(inv.token)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Copier le lien"
                            >
                              {copiedId === inv.token ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                            <button
                              onClick={() => handleRevokeInvitation(inv.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Révoquer"
                            >
                              <Ban className="h-4 w-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInvitations;