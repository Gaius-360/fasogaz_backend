// ==========================================
// FICHIER: src/pages/auth/Login.jsx (VERSION RESPONSIVE)
// ✅ RESPONSIVE: Optimisé pour mobile (320px+), tablette et desktop
// ==========================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import useAuthStore from '../../store/authStore';
import { api } from '../../api/apiSwitch';
import logo from '../../assets/logo_gazbf.png';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'reset'
  
  const [formData, setFormData] = useState({
    phone: '+226',
    password: ''
  });

  const [resetData, setResetData] = useState({
    phone: '+226',
    otp: '',
    newPassword: '',
    confirmPassword: ''
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

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      if (!value.startsWith('+226')) {
        setResetData(prev => ({ ...prev, phone: '+226' }));
      } else {
        setResetData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setResetData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ==========================================
  // CONNEXION NORMALE
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!formData.phone || formData.phone.length < 12) {
      setAlert({
        type: 'error',
        message: 'Numéro de téléphone invalide (format: +226XXXXXXXX)'
      });
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setAlert({
        type: 'error',
        message: 'Mot de passe requis (minimum 6 caractères)'
      });
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Envoi login:', formData);
      
      const response = await api.auth.login({
        phone: formData.phone,
        password: formData.password
      });

      console.log('📥 Réponse login:', response);

      if (response.success && response.data) {
        const { token, user } = response.data;

        console.log('✅ Token:', token);
        console.log('✅ User:', user);
        
        login(token, user);

        setAlert({
          type: 'success',
          message: 'Connexion réussie ! Redirection...'
        });

        setTimeout(() => {
          if (user.role === 'client') {
            navigate('/client/map');
          } else if (user.role === 'revendeur') {
            navigate('/seller/dashboard');
          } else {
            navigate('/');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erreur login:', error);
      
      const errorMessage = error.message || 'Erreur lors de la connexion';

      setAlert({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // DEMANDE OTP POUR RÉINITIALISATION
  // ==========================================
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!resetData.phone || resetData.phone.length < 12) {
      setAlert({
        type: 'error',
        message: 'Numéro de téléphone invalide'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.forgotPassword({
        phone: resetData.phone
      });

      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Code OTP envoyé par SMS'
        });
        setMode('reset');
      }
    } catch (error) {
      console.error('❌ Erreur forgot password:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors de l\'envoi du code'
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // RÉINITIALISATION AVEC OTP
  // ==========================================
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!resetData.otp || resetData.otp.length !== 6) {
      setAlert({
        type: 'error',
        message: 'Code OTP invalide (6 chiffres)'
      });
      return;
    }

    if (!resetData.newPassword || resetData.newPassword.length < 6) {
      setAlert({
        type: 'error',
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
      return;
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      setAlert({
        type: 'error',
        message: 'Les mots de passe ne correspondent pas'
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.resetPassword({
        phone: resetData.phone,
        otp: resetData.otp,
        newPassword: resetData.newPassword
      });

      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Mot de passe réinitialisé avec succès ! Vous pouvez vous connecter.'
        });

        setTimeout(() => {
          setMode('login');
          setResetData({
            phone: '+226',
            otp: '',
            newPassword: '',
            confirmPassword: ''
          });
          setAlert(null);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Erreur reset password:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Erreur lors de la réinitialisation'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="max-w-md w-full">
        {/* Logo - Responsive */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center rounded-2xl px-4 sm:px-8 py-3 sm:py-5">
            <img
              src={logo}
              alt="FasoGaz Logo"
              className="h-12 sm:h-14 md:h-16 w-auto object-contain"
            />

            <div className="flex items-center text-2xl sm:text-3xl font-extrabold tracking-wide">
              <span className="text-red-600">F</span>
              <span className="text-yellow-500">a</span>
              <span className="text-yellow-500">s</span>
              <span className="text-green-600">o</span>
              <span className="text-red-600">G</span>
              <span className="text-yellow-500">a</span>
              <span className="text-green-600">z</span>
            </div>
          </div>
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

          {/* MODE: CONNEXION NORMALE */}
          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div className="text-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Connexion</h2>
              </div>

              <Input
                label="Numéro de téléphone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+226XXXXXXXX"
                icon={Phone}
                required
                autoFocus
              />

              <Input
                label="Mot de passe"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                icon={Lock}
                required
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>

              {/* Lien mot de passe oublié */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              {/* Séparateur */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">ou</span>
                </div>
              </div>

              {/* Lien inscription */}
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-600">
                  Pas encore de compte ?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200"
                  >
                    Créer un compte
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* MODE: DEMANDE OTP */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5 sm:space-y-6">
              <div className="mb-4 sm:mb-6">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex items-center text-gray-600 hover:text-gray-800 mb-3 sm:mb-4 text-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Retour
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mot de passe oublié</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  Entrez votre numéro de téléphone. Nous vous enverrons un code OTP par SMS.
                </p>
              </div>

              <Input
                label="Numéro de téléphone"
                name="phone"
                type="tel"
                value={resetData.phone}
                onChange={handleResetChange}
                placeholder="+226XXXXXXXX"
                icon={Phone}
                required
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le code OTP'
                )}
              </Button>
            </form>
          )}

          {/* MODE: RÉINITIALISATION AVEC OTP */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5 sm:space-y-6">
              <div className="mb-4 sm:mb-6">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="flex items-center text-gray-600 hover:text-gray-800 mb-3 sm:mb-4 text-sm"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Retour
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Réinitialiser le mot de passe</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  Entrez le code OTP reçu par SMS et votre nouveau mot de passe.
                </p>
              </div>

              <Input
                label="Code OTP (6 chiffres)"
                name="otp"
                type="text"
                value={resetData.otp}
                onChange={handleResetChange}
                placeholder="123456"
                maxLength={6}
                required
                autoFocus
              />

              <Input
                label="Nouveau mot de passe"
                name="newPassword"
                type="password"
                value={resetData.newPassword}
                onChange={handleResetChange}
                placeholder="••••••••"
                icon={Lock}
                required
              />

              <Input
                label="Confirmer le mot de passe"
                name="confirmPassword"
                type="password"
                value={resetData.confirmPassword}
                onChange={handleResetChange}
                placeholder="••••••••"
                icon={Lock}
                required
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Réinitialisation...
                  </>
                ) : (
                  'Réinitialiser le mot de passe'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;