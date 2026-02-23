// ==========================================
// FICHIER: src/constants/index.js
// ==========================================
export const BOTTLE_TYPES = [
  { value: '3kg', label: '3 kg' },
  { value: '6kg', label: '6 kg' },
  { value: '12kg', label: '12 kg' }
  
];

export const BRANDS = [
  { value: 'Shell Gaz', label: 'Shell Gaz', color: '#FFD700' },
  { value: 'Total', label: 'Total', color: '#FF0000' },
  { value: 'Oryx', label: 'Oryx', color: '#FF6600' },
  { value: 'Sodigaz', label: 'Sodigaz', color: '#00CC66' },
  { value: 'PeGaz', label: 'PeGaz', color: '#9933FF' }
];

export const CITIES = [
  { value: 'Ouagadougou', label: 'Ouagadougou' },
  { value: 'Bobo-Dioulasso', label: 'Bobo-Dioulasso' }
];

export const ORDER_STATUS = {
  pending: { label: 'En attente', color: 'yellow', icon: '⏳' },
  accepted: { label: 'Acceptée', color: 'blue', icon: '✅' },
  in_delivery: { label: 'En livraison', color: 'indigo', icon: '🚚' },
  completed: { label: 'Complétée', color: 'green', icon: '✅' },
  cancelled: { label: 'Annulée', color: 'gray', icon: '❌' },
  rejected: { label: 'Rejetée', color: 'red', icon: '❌' },
  expired: { label: 'Expirée', color: 'red', icon: '⏰' }
};