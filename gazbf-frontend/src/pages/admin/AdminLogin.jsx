// ==========================================
// FICHIER: src/pages/admin/AdminLogin.jsx (VERSION RESPONSIVE)
// ✅ RESPONSIVE: Optimisé pour mobile (320px+), tablette et desktop
// ==========================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import { api } from '../../api/apiSwitch';
import useAuthStore from '../../store/authStore';

const AdminLogin = () => {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Nom requis';
    if (!formData.password) newErrors.password = 'Mot de passe requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setAlert(null);

    try {
      const response = await api.adminAuth.login(
        formData.username,
        formData.password
      );

      if (!response?.success) {
        throw new Error('Connexion échouée');
      }

      const { token, admin } = response.data;

      login(token, {
        ...admin,
        role: 'admin'
      });

      setAlert({
        type: 'success',
        message: 'Connexion réussie'
      });

      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 500);

    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Identifiants incorrects'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="max-w-md w-full">

        {/* Header - Responsive */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full mb-3 sm:mb-4 shadow-lg">
            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Administration FasoGaz
          </h1>
          <p className="text-sm sm:text-base text-primary-100 px-4">
            Accès réservé aux administrateurs
          </p>
        </div>

        {/* Formulaire - Responsive */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8">
          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
              className="mb-4 sm:mb-6"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <Input
              label="Nom d'utilisateur"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              icon={User}
              required
              autoComplete="username"
            />

            <Input
              label="Mot de passe"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={Lock}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
            >
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Se connecter
            </Button>
          </form>

          {/* Info sécurité - Responsive */}
          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <Lock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <p>
                Connexion sécurisée avec chiffrement de bout en bout
              </p>
            </div>
          </div>
        </div>

        {/* Retour accueil - Responsive */}
        <div className="mt-5 sm:mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-white text-sm hover:text-primary-100 transition-colors"
          >
            ← Retour à l'accueil
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;