import React, { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';

const PricingPlanModal = ({ onSave, onClose, plan }) => {
  const [data, setData] = useState(plan || {
    target: 'client',
    name: '',
    code: '',
    duration: { value: 30, unit: 'days' },
    price: 0,
    discount: { type: 'percentage', value: 0 },
    trial: { enabled: false, days: 0 },
    limits: {},
    autoRenew: true,
    active: true
  });

  const update = (key, value) =>
    setData(prev => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-xl space-y-4">

        <Input label="Nom du plan" value={data.name}
          onChange={e => update('name', e.target.value)} />

        <Input label="Code interne" value={data.code}
          onChange={e => update('code', e.target.value)} />

        <Input label="Prix (FCFA)" type="number" value={data.price}
          onChange={e => update('price', e.target.value)} />

        <div className="flex gap-3">
          <Input label="Durée" type="number"
            value={data.duration.value}
            onChange={e =>
              update('duration', { ...data.duration, value: e.target.value })
            } />
          <select
            className="border rounded px-3 py-2"
            value={data.duration.unit}
            onChange={e =>
              update('duration', { ...data.duration, unit: e.target.value })
            }
          >
            <option value="days">Jours</option>
            <option value="weeks">Semaines</option>
            <option value="months">Mois</option>
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => onSave(data)}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
};

export default PricingPlanModal;
