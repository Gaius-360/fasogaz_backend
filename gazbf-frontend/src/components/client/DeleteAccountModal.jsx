// ==========================================
// FICHIER: src/components/client/DeleteAccountModal.jsx
// Modal de suppression de compte avec couleurs FasoGaz
// ==========================================
import React, { useState } from 'react';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import useAuthStore from '../../store/authStore';
import { api } from '../../api/apiSwitch';
import { useNavigate } from 'react-router-dom';

const DeleteAccountModal = ({ onClose, user }) => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const handleDelete = async () => {
    if (!password) {
      setError('Le mot de passe est requis');
      return;
    }

    if (confirmation !== 'SUPPRIMER') {
      setError('Veuillez taper exactement "SUPPRIMER" pour confirmer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.auth.deleteAccount({ password });

      if (response.success) {
        logout();
        navigate('/', { 
          state: { 
            message: 'Votre compte a été supprimé avec succès. Nous sommes désolés de vous voir partir.' 
          }
        });
      }
    } catch (err) {
      console.error('Erreur suppression compte:', err);
      setError(err.message || 'Erreur lors de la suppression du compte');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b-2 flex items-center justify-between bg-gradient-to-r from-red-500 to-red-600">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                Supprimer mon compte
              </h2>
              <p className="text-sm text-white/90">
                Cette action est irréversible
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-lg"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-red-900">
                      Attention : Cette action est définitive
                    </h3>
                    <p className="text-red-800">
                      La suppression de votre compte entraînera la perte irréversible de toutes vos données.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-neutral-900">
                  Que se passera-t-il si vous supprimez votre compte ?
                </h4>
                
                <div className="space-y-3">
                  {[
                    {
                      title: 'Suppression immédiate',
                      desc: 'Votre compte sera immédiatement désactivé et vous serez déconnecté'
                    },
                    {
                      title: 'Données supprimées',
                      desc: 'Toutes vos informations personnelles, adresses, préférences seront définitivement supprimées'
                    },
                    {
                      title: 'Accès perdu',
                      desc: 'Vous ne pourrez plus vous connecter et devrez créer un nouveau compte pour utiliser FasoGaz'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                      <Trash2 className="h-5 w-5 text-neutral-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-neutral-900">{item.title}</p>
                        <p className="text-sm text-neutral-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}

                  {user?.role === 'revendeur' && (
                    <div className="flex items-start gap-3 p-4 bg-secondary-50 rounded-xl border-2 border-secondary-200">
                      <AlertTriangle className="h-5 w-5 text-secondary-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-secondary-900">Attention revendeur</p>
                        <p className="text-sm text-secondary-800">
                          Vos produits seront retirés de la plateforme et vos commandes en cours seront annulées. 
                          Assurez-vous d'avoir terminé toutes vos commandes avant de supprimer votre compte.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
                <h4 className="font-bold text-primary-900 mb-2">
                  Vous souhaitez juste faire une pause ?
                </h4>
                <p className="text-sm text-primary-800">
                  Si vous souhaitez simplement arrêter de recevoir des notifications ou désactiver 
                  temporairement votre compte, contactez notre support. Nous pouvons vous proposer 
                  des alternatives à la suppression définitive.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-bold text-center">
                  🚨 Dernière étape avant suppression définitive
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Mot de passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  helpText="Confirmez votre identité"
                  error={error && error.includes('mot de passe') ? error : ''}
                />

                <div>
                  <label className="block text-sm font-bold text-neutral-900 mb-2">
                    Confirmation de suppression
                  </label>
                  <Input
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder='Tapez "SUPPRIMER" en majuscules'
                    helpText='Pour confirmer, tapez exactement "SUPPRIMER"'
                    error={error && error.includes('SUPPRIMER') ? error : ''}
                  />
                </div>

                {error && !error.includes('mot de passe') && !error.includes('SUPPRIMER') && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                  </div>
                )}

                <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200">
                  <p className="text-sm text-neutral-700 font-medium">
                    <strong>Compte à supprimer :</strong>
                  </p>
                  <p className="text-sm text-neutral-600 mt-1">
                    {user?.firstName} {user?.lastName} ({user?.phone})
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-neutral-100 bg-neutral-50">
          {step === 1 ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => setStep(2)}
              >
                Continuer la suppression
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                variant="danger"
                fullWidth
                onClick={handleDelete}
                loading={loading}
                disabled={loading || !password || confirmation !== 'SUPPRIMER'}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Suppression en cours...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5 mr-2" />
                    Supprimer définitivement mon compte
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setStep(1);
                  setPassword('');
                  setConfirmation('');
                  setError(null);
                }}
                disabled={loading}
              >
                Retour
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;