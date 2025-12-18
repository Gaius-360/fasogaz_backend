// src/pages/admin/AdminLogin.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
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

      // 🔥 LOGIN CENTRALISÉ
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
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
            <Shield className="h-10 w-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Administration GAZBF
          </h1>
          <p className="text-primary-100">
            Accès réservé aux administrateurs
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
              className="mb-6"
            />
          )}

          {/* TEST ONLY */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <strong>Test :</strong><br />
                admin / Admin@2025
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nom d'utilisateur"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              icon={User}
              required
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
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
            >
              <Shield className="h-5 w-5 mr-2" />
              Se connecter
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-white text-sm"
          >
            ← Retour à l’accueil
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
