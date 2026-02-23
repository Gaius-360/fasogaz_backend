// ==========================================
// FICHIER: src/components/client/TermsModal.jsx
// ==========================================
import React from 'react';
import { X } from 'lucide-react';

const TermsModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 max-h-[85vh] bg-white rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Conditions d'utilisation
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6 leading-relaxed text-gray-700">
          <p className="text-sm text-gray-500">
            Dernière mise à jour : 01/01/2026
          </p>

          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              1. Objet
            </h3>
            <p>
              Les présentes conditions ont pour objet de définir les modalités
              d'accès et d'utilisation du site par tout utilisateur.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              2. Accès au site
            </h3>
            <p>
              Le site est accessible gratuitement à tout utilisateur disposant
              d'un accès à Internet. Les frais liés à l'accès sont à la charge
              de l'utilisateur.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              3. Responsabilité
            </h3>
            <p>
              L'éditeur ne saurait être tenu responsable des interruptions,
              erreurs ou dommages résultant de l'utilisation du site.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              4. Propriété intellectuelle
            </h3>
            <p>
              L'ensemble des contenus présents sur le site est protégé par le
              droit de la propriété intellectuelle. Toute reproduction est
              interdite sans autorisation.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              5. Données personnelles
            </h3>
            <p>
              Le traitement des données personnelles est détaillé dans la
              Politique de confidentialité.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              6. Modification des conditions
            </h3>
            <p>
              Les présentes conditions peuvent être modifiées à tout moment.
              L'utilisateur est invité à les consulter régulièrement.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;