// ==========================================
// FICHIER: src/components/seller/OpeningHoursEditor.jsx
// Éditeur d'heures d'ouverture avec couleurs FasoGaz
// ==========================================
import React, { useState, useEffect } from 'react';
import { Clock, Save, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Button from '../common/Button';

const OpeningHoursEditor = ({ 
  initialHours, 
  onSave, 
  onCancel, 
  loading 
}) => {
  const [openingHours, setOpeningHours] = useState({
    isOpen24_7: false,
    isClosed: false,
    schedule: {
      monday: { enabled: true, open: '08:00', close: '20:00' },
      tuesday: { enabled: true, open: '08:00', close: '20:00' },
      wednesday: { enabled: true, open: '08:00', close: '20:00' },
      thursday: { enabled: true, open: '08:00', close: '20:00' },
      friday: { enabled: true, open: '08:00', close: '20:00' },
      saturday: { enabled: true, open: '08:00', close: '18:00' },
      sunday: { enabled: false, open: '09:00', close: '13:00' }
    }
  });

  useEffect(() => {
    if (initialHours) {
      setOpeningHours(initialHours);
    }
  }, [initialHours]);

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

  const handleToggleDay = (day) => {
    setOpeningHours(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          enabled: !prev.schedule[day].enabled
        }
      }
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setOpeningHours(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value
        }
      }
    }));
  };

  const handleSpecialMode = (mode) => {
    if (mode === '24_7') {
      setOpeningHours(prev => ({
        ...prev,
        isOpen24_7: !prev.isOpen24_7,
        isClosed: false
      }));
    } else if (mode === 'closed') {
      setOpeningHours(prev => ({
        ...prev,
        isClosed: !prev.isClosed,
        isOpen24_7: false
      }));
    }
  };

  const handleSave = () => {
    onSave(openingHours);
  };

  return (
    <div>
      {/* Options spéciales */}
      <div className="mb-6 p-4 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl border-2 border-neutral-200 space-y-3">
        <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-600" />
          Options spéciales
        </h3>
        
        <label className="flex items-center gap-3 p-4 bg-white border-2 border-neutral-200 rounded-xl cursor-pointer hover:border-accent-300 hover:bg-accent-50 transition-all">
          <input
            type="checkbox"
            checked={openingHours.isOpen24_7}
            onChange={() => handleSpecialMode('24_7')}
            className="w-5 h-5 text-accent-600 border-neutral-300 rounded focus:ring-accent-500 cursor-pointer"
          />
          <div className="flex-1">
            <p className="font-bold text-neutral-900">Ouvert 24h/24 7j/7</p>
            <p className="text-sm text-neutral-600">Votre dépôt est toujours ouvert</p>
          </div>
          {openingHours.isOpen24_7 && (
            <CheckCircle className="h-5 w-5 text-accent-600" />
          )}
        </label>
      </div>

      {/* Planning hebdomadaire */}
      {!openingHours.isOpen24_7 && !openingHours.isClosed && (
        <div className="space-y-3">
          <h3 className="font-bold text-neutral-900 mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-secondary-600" />
            Planning hebdomadaire
          </h3>
          
          {daysOrder.map((day) => {
            const schedule = openingHours.schedule[day];
            return (
              <div 
                key={day} 
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  schedule.enabled 
                    ? 'bg-gradient-to-br from-secondary-50 to-secondary-100 border-secondary-200' 
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <label className="flex items-center gap-2 w-32">
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={() => handleToggleDay(day)}
                    className="w-4 h-4 text-secondary-600 border-neutral-300 rounded focus:ring-secondary-500 cursor-pointer"
                  />
                  <span className="font-bold text-neutral-900">{daysInFrench[day]}</span>
                </label>

                {schedule.enabled ? (
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-neutral-700 font-medium">Ouverture</label>
                      <input
                        type="time"
                        value={schedule.open}
                        onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                        className="px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-medium"
                      />
                    </div>
                    <span className="text-neutral-400 font-bold">→</span>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-neutral-700 font-medium">Fermeture</label>
                      <input
                        type="time"
                        value={schedule.close}
                        onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                        className="px-3 py-2 border-2 border-neutral-200 rounded-lg focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-neutral-400 italic flex-1 font-medium">Fermé</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t-2 border-neutral-200">
        <Button
          variant="outline"
          fullWidth
          onClick={onCancel}
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button
          variant="gradient"
          fullWidth
          onClick={handleSave}
          loading={loading}
          disabled={loading}
          className="h-12 text-base font-bold shadow-gazbf-lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default OpeningHoursEditor;