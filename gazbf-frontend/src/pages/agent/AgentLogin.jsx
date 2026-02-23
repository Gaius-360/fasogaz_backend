// ==========================================
// FICHIER: src/pages/agent/AgentLogin.jsx
// Page de connexion pour les agents terrain (CODE AGENT UNIQUEMENT)
// ✅ RESPONSIVE: Optimisé pour mobile, tablette et desktop
// ==========================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { api } from '../../api/apiSwitch';

const AgentLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [agentCode, setAgentCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [codeValid, setCodeValid] = useState(null);

  // Vérifier le code en temps réel
  const verifyCode = async (code) => {
    if (!code || code.length < 8) {
      setCodeValid(null);
      return;
    }

    try {
      setVerifying(true);
      const response = await api.agentAuth.verifyCode(code);

      if (response.success && response.data.valid) {
        setCodeValid(true);
        setError('');
      } else {
        setCodeValid(false);
        setError(response.data.message || 'Code invalide');
      }
    } catch (err) {
      setCodeValid(false);
      setError('Code invalide');
    } finally {
      setVerifying(false);
    }
  };

  const handleCodeChange = (value) => {
    const formatted = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setAgentCode(formatted);
    setError('');

    // Vérifier automatiquement si le format est correct
    if (formatted.startsWith('AG-') && formatted.length >= 11) {
      verifyCode(formatted);
    } else {
      setCodeValid(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!agentCode) {
      setError('Veuillez entrer votre code agent');
      return;
    }

    if (!agentCode.startsWith('AG-')) {
      setError('Le code agent doit commencer par AG-');
      return;
    }

    try {
      setLoading(true);

      const response = await api.agentAuth.login(agentCode);

      if (response.success) {
        login(response.data.token, response.data.agent);
        navigate('/agent/dashboard');
      }
    } catch (err) {
      console.error('❌ Erreur connexion agent:', err);
      setError(
        err.message || 
        'Code agent invalide ou compte désactivé'
      );
      setCodeValid(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Titre - Responsive */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-2xl mb-3 sm:mb-4">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Espace Agent FasoGaz
          </h1>
          <p className="text-sm sm:text-base text-white/90 px-4">
            Connectez-vous avec votre code agent
          </p>
        </div>

        {/* Formulaire - Responsive */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Code Agent - Responsive */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Agent
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={agentCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="AG-XXXXXXXX"
                  className={`
                    w-full px-3 sm:px-4 py-3 sm:py-3.5 border rounded-lg 
                    focus:outline-none focus:ring-2 
                    text-gray-900 placeholder-gray-400 
                    uppercase text-center text-base sm:text-lg font-semibold tracking-wider
                    ${codeValid === true 
                      ? 'border-green-500 focus:ring-green-500 bg-green-50' 
                      : codeValid === false 
                      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-orange-500'
                    }
                  `}
                  disabled={loading}
                  autoComplete="off"
                  autoFocus
                  maxLength={11}
                />

                {/* Indicateur de validation - Responsive */}
                {verifying && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {!verifying && codeValid === true && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                )}

                {!verifying && codeValid === false && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </div>
                )}
              </div>

              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 text-center">
                  Format: AG-XXXXXXXX
                </p>
                {codeValid === true && (
                  <p className="text-xs text-green-600 text-center font-medium">
                    ✓ Code valide
                  </p>
                )}
              </div>
            </div>

            {/* Bouton de connexion - Responsive */}
            <button
              type="submit"
              disabled={loading || !agentCode || codeValid === false}
              className={`
                w-full py-3 sm:py-3.5 px-4 rounded-lg font-medium text-sm sm:text-base
                transition-all duration-200 shadow-lg
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                ${loading || !agentCode || codeValid === false
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 hover:shadow-xl'
                }
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connexion...</span>
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Informations supplémentaires - Responsive */}
          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-200">
            <div className="space-y-2 text-center">
              <p className="text-sm text-gray-600">
                💡 Code agent oublié ?
              </p>
              <p className="text-xs sm:text-sm text-gray-500 px-2">
                Contactez votre superviseur ou l'administrateur
              </p>
            </div>
          </div>

          {/* Aide sur le format - Responsive */}
          <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 text-center leading-relaxed">
              <strong>Note:</strong> Votre code agent vous a été communiqué lors de votre création. 
              Il commence toujours par <strong>AG-</strong> suivi de 8 caractères.
            </p>
          </div>
        </div>

        {/* Mention légale - Responsive */}
        <div className="mt-5 sm:mt-6 text-center px-4">
          <p className="text-white/80 text-xs sm:text-sm">
            🔒 Espace réservé aux agents terrain FasoGaz
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentLogin;