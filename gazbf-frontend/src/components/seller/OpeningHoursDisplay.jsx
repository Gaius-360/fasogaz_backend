// ==========================================
// FICHIER: src/components/seller/OpeningHoursDisplay.jsx
// Affichage heures d'ouverture avec couleurs FasoGaz
// ==========================================
import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const OpeningHoursDisplay = ({ openingHours }) => {
  const daysInFrench = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  };

  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  if (!openingHours) {
    return (
      <div className="mb-6">
        <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-600" />
          Heures d'ouverture
        </h3>
        <div className="bg-neutral-50 rounded-xl p-4 border-2 border-neutral-200">
          <p className="text-neutral-500 text-sm">Horaires non communiqués</p>
        </div>
      </div>
    );
  }

  const getCurrentStatus = () => {
    if (openingHours.isClosed) {
      return { 
        isOpen: false, 
        icon: XCircle,
        text: 'Fermé définitivement', 
        color: 'bg-red-50 text-red-900 border-red-300',
        iconColor: 'text-red-600'
      };
    }
    
    if (openingHours.isOpen24_7) {
      return { 
        isOpen: true, 
        icon: CheckCircle,
        text: 'Ouvert 24h/24 7j/7', 
        color: 'bg-accent-50 text-accent-900 border-accent-300',
        iconColor: 'text-accent-600'
      };
    }

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const todaySchedule = openingHours.schedule?.[currentDay];
    
    if (!todaySchedule || !todaySchedule.enabled) {
      let nextOpenDay = null;
      for (let i = 1; i <= 7; i++) {
        const nextDay = dayNames[(now.getDay() + i) % 7];
        if (openingHours.schedule?.[nextDay]?.enabled) {
          nextOpenDay = { day: daysInFrench[nextDay], time: openingHours.schedule[nextDay].open };
          break;
        }
      }
      
      return { 
        isOpen: false, 
        icon: XCircle,
        text: nextOpenDay 
          ? `Fermé aujourd'hui • Ouvre ${nextOpenDay.day} à ${nextOpenDay.time}`
          : 'Fermé aujourd\'hui',
        color: 'bg-neutral-50 text-neutral-900 border-neutral-300',
        iconColor: 'text-neutral-600'
      };
    }
    
    if (currentTime >= todaySchedule.open && currentTime < todaySchedule.close) {
      return { 
        isOpen: true, 
        icon: CheckCircle,
        text: `Ouvert • Ferme à ${todaySchedule.close}`, 
        color: 'bg-accent-50 text-accent-900 border-accent-300',
        iconColor: 'text-accent-600'
      };
    }
    
    if (currentTime < todaySchedule.open) {
      return { 
        isOpen: false, 
        icon: AlertCircle,
        text: `Fermé • Ouvre aujourd'hui à ${todaySchedule.open}`, 
        color: 'bg-secondary-50 text-secondary-900 border-secondary-300',
        iconColor: 'text-secondary-600'
      };
    }
    
    let nextOpenDay = null;
    for (let i = 1; i <= 7; i++) {
      const nextDay = dayNames[(now.getDay() + i) % 7];
      if (openingHours.schedule?.[nextDay]?.enabled) {
        nextOpenDay = { day: daysInFrench[nextDay], time: openingHours.schedule[nextDay].open };
        break;
      }
    }
    
    return { 
      isOpen: false, 
      icon: XCircle,
      text: nextOpenDay 
        ? `Fermé • Ouvre ${nextOpenDay.day} à ${nextOpenDay.time}`
        : 'Fermé',
      color: 'bg-neutral-50 text-neutral-900 border-neutral-300',
      iconColor: 'text-neutral-600'
    };
  };

  const status = getCurrentStatus();
  const StatusIcon = status.icon;

  return (
    <div className="mb-6">
      <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
        <Clock className="h-5 w-5 text-primary-600" />
        Heures d'ouverture
      </h3>

      {/* Statut actuel */}
      <div className={`p-5 rounded-xl border-2 ${status.color}`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`h-6 w-6 ${status.iconColor}`} />
          <div>
            <p className="font-bold text-lg">{status.text}</p>
            <p className="text-sm opacity-80 mt-1">
              {status.isOpen ? '✓ Disponible pour commander' : '⚠️ Commandes fermées'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Badge compact pour SellerCard
const OpeningStatusBadge = ({ openingHours }) => {
  if (!openingHours) return null;

  const getCurrentStatus = () => {
    if (openingHours.isClosed) {
      return { isOpen: false, text: 'Fermé', color: 'bg-red-100 text-red-700' };
    }
    
    if (openingHours.isOpen24_7) {
      return { isOpen: true, text: 'Ouvert 24/7', color: 'bg-accent-100 text-accent-700' };
    }

    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const todaySchedule = openingHours.schedule?.[currentDay];
    
    if (!todaySchedule || !todaySchedule.enabled) {
      return { isOpen: false, text: 'Fermé', color: 'bg-neutral-100 text-neutral-700' };
    }
    
    if (currentTime >= todaySchedule.open && currentTime < todaySchedule.close) {
      return { isOpen: true, text: `Ouvert jusqu'à ${todaySchedule.close}`, color: 'bg-accent-100 text-accent-700' };
    }
    
    if (currentTime < todaySchedule.open) {
      return { isOpen: false, text: `Ouvre à ${todaySchedule.open}`, color: 'bg-secondary-100 text-secondary-700' };
    }
    
    return { isOpen: false, text: 'Fermé', color: 'bg-neutral-100 text-neutral-700' };
  };

  const status = getCurrentStatus();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${status.color}`}>
      <span className={`w-2 h-2 rounded-full ${status.isOpen ? 'bg-accent-600' : 'bg-neutral-400'}`}></span>
      {status.text}
    </span>
  );
};

export { OpeningHoursDisplay, OpeningStatusBadge };
export default OpeningHoursDisplay;