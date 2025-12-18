// ==========================================
// FICHIER: src/constants/index.js
// ==========================================
export const BOTTLE_TYPES = [
  { value: '6kg', label: '6 kg' },
  { value: '12kg', label: '12 kg' },
  { value: '25kg', label: '25 kg' },
  { value: '38kg', label: '38 kg' }
];

export const BRANDS = [
  { value: 'Shell Gas', label: 'Shell Gas', color: '#FFD700' },
  { value: 'Total Gas', label: 'Total Gas', color: '#FF0000' },
  { value: 'Vitogaz', label: 'Vitogaz', color: '#0066CC' },
  { value: 'Oryx Energies', label: 'Oryx Energies', color: '#FF6600' },
  { value: 'Afrigas', label: 'Afrigas', color: '#00CC66' },
  { value: 'Gazlam', label: 'Gazlam', color: '#9933FF' }
];

export const CITIES = [
  { value: 'Ouagadougou', label: 'Ouagadougou' },
  { value: 'Bobo-Dioulasso', label: 'Bobo-Dioulasso' }
];

export const ORDER_STATUS = {
  pending: { label: 'En attente', color: 'yellow', icon: '⏳' },
  accepted: { label: 'Acceptée', color: 'blue', icon: '✅' },
  preparing: { label: 'En préparation', color: 'purple', icon: '📦' },
  in_delivery: { label: 'En livraison', color: 'indigo', icon: '🚚' },
  completed: { label: 'Complétée', color: 'green', icon: '✅' },
  cancelled: { label: 'Annulée', color: 'gray', icon: '❌' },
  rejected: { label: 'Rejetée', color: 'red', icon: '❌' }
};