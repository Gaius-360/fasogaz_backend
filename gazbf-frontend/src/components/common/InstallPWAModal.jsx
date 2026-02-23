// ==========================================
// FICHIER: src/components/common/InstallPWAModal.jsx
// Solution professionnelle PWA Install Modal
//
// Comportement :
// - 1ère visite          → modal après 5s
// - "Plus tard"          → réapparaît dans 3 jours
// - Overlay cliqué       → réapparaît dans 3 jours
// - "Installer" accepté  → ne réapparaît jamais
// - App déjà installée   → jamais affiché
// ==========================================

import React, { useState, useEffect } from 'react';
import { Download, Share, Smartphone } from 'lucide-react';
import logo from '../../assets/logo_gazbf.png';

// ── Constantes ──────────────────────────────────────────────
const STORAGE_KEY       = 'fasogaz_pwa_install';
const DELAY_MS          = 5000;   // délai avant affichage (5s)
const REMIND_LATER_DAYS = 3;      // jours avant de réafficher

// ── Helpers localStorage ─────────────────────────────────────
const getStoredData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setStoredData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage indisponible (navigation privée) → on ignore
  }
};

// ── Logique d'affichage ───────────────────────────────────────
const shouldShowModal = () => {
  const data = getStoredData();
  if (data.installed === true) return false; // déjà installé
  if (data.remindAfter) {
    const remindDate = new Date(data.remindAfter);
    if (new Date() < remindDate) return false; // dans le délai "plus tard"
  }
  return true;
};

// ── Composant ─────────────────────────────────────────────────
const InstallPWAModal = () => {
  const [showModal, setShowModal]           = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [deviceType, setDeviceType]         = useState('other'); // 'ios' | 'android' | 'other'
  const [installing, setInstalling]         = useState(false);

  useEffect(() => {
    // 1. App déjà installée (mode standalone) → ne rien faire
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setStoredData({ ...getStoredData(), installed: true });
      return;
    }

    // 2. Détecter le type d'appareil
    const isIOS     = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    setDeviceType(isIOS ? 'ios' : isAndroid ? 'android' : 'other');

    // 3. Capturer le prompt natif Android/Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Écouter si l'app est installée pendant la session
    const handleAppInstalled = () => {
      setStoredData({ ...getStoredData(), installed: true });
      setShowModal(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. Vérifier si on doit afficher, puis attendre le délai
    let timer;
    if (shouldShowModal()) {
      timer = setTimeout(() => setShowModal(true), DELAY_MS);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // ── Actions utilisateur ──────────────────────────────────────

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Android/Chrome : prompt natif
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setStoredData({ ...getStoredData(), installed: true });
          setShowModal(false);
        } else {
          // Refus de l'installation native → réafficher dans 3 jours
          handleRemindLater();
        }
      } catch {
        // erreur silencieuse
      } finally {
        setInstalling(false);
        setDeferredPrompt(null);
      }
    } else {
      // iOS / desktop : l'utilisateur a lu les instructions
      setStoredData({ ...getStoredData(), installed: true });
      setShowModal(false);
    }
  };

  // "Plus tard" → réafficher dans REMIND_LATER_DAYS jours
  const handleRemindLater = () => {
    const remindAfter = new Date();
    remindAfter.setDate(remindAfter.getDate() + REMIND_LATER_DAYS);
    setStoredData({ ...getStoredData(), remindAfter: remindAfter.toISOString() });
    setShowModal(false);
  };

  if (!showModal) return null;

  // ── Contenu adapté par appareil ──────────────────────────────
  const content = {
    ios: {
      instruction: (
        <div className="flex flex-col gap-2.5 text-sm text-gray-600 bg-orange-50 rounded-xl p-4 text-left mb-6">
          <p className="font-semibold text-gray-800 mb-0.5">Comment installer :</p>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
            <span>Appuyez sur <Share className="inline h-3.5 w-3.5 text-blue-500" /> <strong>Partager</strong> en bas de Safari</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
            <span>Sélectionnez <strong>« Sur l'écran d'accueil »</strong></span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
            <span>Appuyez sur <strong>« Ajouter »</strong></span>
          </div>
        </div>
      ),
      btnLabel: "J'ai compris",
    },
    android: {
      instruction: (
        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          Installez l'application sur votre écran d'accueil pour un accès rapide, même sans connexion.
        </p>
      ),
      btnLabel: installing ? 'Installation...' : 'Installer maintenant',
    },
    other: {
      instruction: (
        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          Accédez rapidement à FasoGaz depuis votre écran d'accueil ou votre bureau.
        </p>
      ),
      btnLabel: 'Installer maintenant',
    },
  }[deviceType];

  // ── Rendu ────────────────────────────────────────────────────
  return (
    <>
      {/* Overlay — clic = "Plus tard" */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={handleRemindLater}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-modal-title"
        className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden pointer-events-auto pwa-modal-enter">

          {/* Bandeau coloré haut */}
          <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400" />

          {/* Corps */}
          <div className="p-7 pt-6 text-center">

            {/* Icône app */}
            <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-orange-100 rounded-2xl shadow-md flex items-center justify-center mb-4 mx-auto ring-4 ring-orange-100">
              <img src={logo} alt="FasoGaz" className="w-14 h-14 object-contain" />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-semibold mb-3">
              <Smartphone className="h-3 w-3" />
              Application gratuite
            </div>

            {/* Titre */}
            <h3 id="pwa-modal-title" className="text-2xl font-extrabold text-gray-900 mb-2">
              Installer FasoGaz
            </h3>

            {/* Instruction adaptée au device */}
            {content.instruction}

            {/* Bouton principal */}
            <button
              onClick={handleInstall}
              disabled={installing}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-bold text-base hover:shadow-xl hover:scale-[1.02] active:scale-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5" />
              {content.btnLabel}
            </button>

            {/* Bouton "Plus tard" */}
            <button
              onClick={handleRemindLater}
              className="mt-3 w-full px-6 py-2.5 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors hover:bg-gray-50 rounded-xl"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pwa-enter {
          from { transform: translateY(24px) scale(0.96); opacity: 0; }
          to   { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        .pwa-modal-enter {
          animation: pwa-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </>
  );
};

export default InstallPWAModal;