// ==========================================
// FICHIER: src/pages/auth/Register.jsx
// ==========================================
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, User, MapPin, Building2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import Card from '../../components/common/Card';
import { api } from '../../api/apiSwitch';
import { validatePhone, validatePassword, validateRequired } from '../../utils/validation';

const Register = () => {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Infos de base, 2: OTP
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'client',
    firstName: '',
    lastName: '',
    city: 'Ouagadougou',
    // Pour revendeurs
    businessName: '',
    quarter: ''
  });
  
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState('');
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
    
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;
    
    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    
    const firstNameError = validateRequired(formData.firstName, 'Prénom');
    if (firstNameError) newErrors.firstName = firstNameError;
    
    const lastNameError = validateRequired(formData.lastName, 'Nom');
    if (lastNameError) newErrors.lastName = lastNameError;
    
    if (formData.role === 'revendeur') {
      const businessNameError = validateRequired(formData.businessName, 'Nom du dépôt');
      if (businessNameError) newErrors.businessName = businessNameError;
      
      const quarterError = validateRequired(formData.quarter, 'Quartier');
      if (quarterError) newErrors.quarter = quarterError;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert(null);
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
     const response = await api.auth.register(formData);
      
      if (response.success) {
        setUserId(response.data.userId);
        setAlert({
          type: 'success',
          message: 'Inscription réussie ! Un code de vérification a été envoyé par SMS.'
        });
        setStep(2);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Erreur lors de l\'inscription'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setAlert(null);
    
    if (!otp || otp.length !== 6) {
      setAlert({
        type: 'error',
        message: 'Veuillez entrer un code à 6 chiffres'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.auth.verifyOTP(formData.phone, otp);
      
      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Compte vérifié avec succès !'
        });
        
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Code incorrect'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setAlert(null);
    setLoading(true);
    
    try {
     const response = await api.auth.resendOTP(formData.phone);
      
      if (response.success) {
        setAlert({
          type: 'success',
          message: 'Un nouveau code a été envoyé par SMS'
        });
      }
    } catch (error) {
      setAlert({
        type: 'error',
        message: 'Erreur lors du renvoi du code'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">GAZBF</h1>
          <p className="text-gray-600">Créez votre compte</p>
        </div>

        <Card>
          {step === 1 ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Inscription</h2>
              
              {alert && (
                <Alert
                  type={alert.type}
                  message={alert.message}
                  onClose={() => setAlert(null)}
                  className="mb-4"
                />
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Sélection du rôle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Je suis
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: 'client' }))}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        formData.role === 'client'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <User className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                      <span className="font-medium">Client</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, role: 'revendeur' }))}
                      className={`p-4 border-2 rounded-lg text-center transition-colors ${
                        formData.role === 'revendeur'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-secondary-600" />
                      <span className="font-medium">Revendeur</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Prénom"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                    required
                  />
                  
                  <Input
                    label="Nom"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                    required
                  />
                </div>

                <Input
                  label="Téléphone"
                  name="phone"
                  type="tel"
                  placeholder="+226XXXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  icon={Phone}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Ouagadougou">Ouagadougou</option>
                    <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
                  </select>
                </div>

                {formData.role === 'revendeur' && (
                  <>
                    <Input
                      label="Nom du dépôt"
                      name="businessName"
                      placeholder="Ex: Dépôt Wend Konta"
                      value={formData.businessName}
                      onChange={handleChange}
                      error={errors.businessName}
                      icon={Building2}
                      required
                    />
                    
                    <Input
                      label="Quartier"
                      name="quarter"
                      placeholder="Ex: Gounghin"
                      value={formData.quarter}
                      onChange={handleChange}
                      error={errors.quarter}
                      icon={MapPin}
                      required
                    />
                  </>
                )}

                <Input
                  label="Mot de passe"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  icon={Lock}
                  helpText="Au moins 8 caractères, une lettre et un chiffre"
                  required
                />

                <Input
                  label="Confirmer le mot de passe"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  icon={Lock}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                  className="mt-6"
                >
                  S'inscrire
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Vous avez déjà un compte ?{' '}
                  <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                    Se connecter
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérification</h2>
              <p className="text-gray-600 mb-6">
                Entrez le code à 6 chiffres envoyé au {formData.phone}
              </p>
              
              {alert && (
                <Alert
                  type={alert.type}
                  message={alert.message}
                  onClose={() => setAlert(null)}
                  className="mb-4"
                />
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <Input
                  label="Code OTP"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  Vérifier
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={handleResendOTP}
                  disabled={loading}
                >
                  Renvoyer le code
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Register;