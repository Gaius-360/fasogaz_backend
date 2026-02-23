// ==========================================
// FICHIER: src/pages/auth/Register.jsx
// ✅ CLIENTS UNIQUEMENT - Inscription directe sans OTP
// ✅ RESPONSIVE: Optimisé pour mobile (320px+), tablette et desktop
// ==========================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Lock, Building2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import useAuthStore from '../../store/authStore';
import { api } from '../../api/apiSwitch';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [formData, setFormData] = useState({
    phone: '+226',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    city: ''
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      if (!value.startsWith('+226')) {
        setFormData(prev => ({ ...prev, phone: '+226' }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ==========================================
  // SOUMISSION INSCRIPTION CLIENT — Connexion directe sans OTP
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    // Validation
    if (!formData.phone || formData.phone.length < 12) {
      setAlert({ type: 'error', message: 'Numéro de téléphone invalide' });
      return;
    }

    if (formData.password.length < 6) {
      setAlert({ type: 'error', message: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setAlert({ type: 'error', message: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (!formData.firstName || !formData.lastName) {
      setAlert({ type: 'error', message: 'Prénom et nom requis' });
      return;
    }

    if (!formData.city) {
      setAlert({ type: 'error', message: 'Veuillez sélectionner une ville' });
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Envoi inscription CLIENT:', formData);

      const response = await api.auth.register({
        phone: formData.phone,
        password: formData.password,
        role: 'client',
        firstName: formData.firstName,
        lastName: formData.lastName,
        city: formData.city
      });

      console.log('📥 Réponse inscription:', response);

      if (response.success) {
        const { token, user } = response.data;

        // ✅ Connexion directe — plus besoin d'OTP
        login(token, user);
        navigate('/client/map');
      }
    } catch (error) {
      console.error('❌ Erreur inscription:', error);

      const errorMessage = error.response?.data?.message
        || error.message
        || 'Erreur lors de l\'inscription';

      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="max-w-md w-full">

        {/* Titre - Responsive */}
        <div className="text-center mb-6 sm:mb-8 px-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Créer un compte client
          </h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            Rejoignez FasoGaz et trouvez du gaz près de chez vous
          </p>
        </div>

        {/* Formulaire - Responsive */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 md:p-8">

          {alert && (
            <Alert
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
              className="mb-4 sm:mb-6"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Inscription Client
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Prénom"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Téléphone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+226XXXXXXXX"
              icon={Phone}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Mot de passe"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                icon={Lock}
                required
              />
              <Input
                label="Confirmer"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                icon={Lock}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                required
              >
                <option value="">Sélectionner une ville</option>
                <option value="Ouagadougou">Ouagadougou</option>
                <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
            >
              {loading ? 'Inscription...' : 'Créer mon compte'}
            </Button>

            {/* Lien vers inscription revendeur - Responsive */}
            <div className="mt-5 sm:mt-6 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2 sm:gap-3">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-semibold text-orange-900 mb-1">
                    Vous êtes revendeur ?
                  </p>
                  <p className="text-orange-700 mb-2">
                    L'inscription revendeur se fait uniquement via invitation.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/devenir-revendeur')}
                    className="text-orange-600 hover:text-orange-700 font-semibold underline"
                  >
                    En savoir plus →
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 sm:pt-4 text-center">
              <Link
                to="/login"
                className="text-xs sm:text-sm text-gray-600 hover:text-gray-900"
              >
                Déjà un compte ? <span className="font-semibold">Se connecter</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;