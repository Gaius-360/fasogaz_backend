// ==========================================
// FICHIER: src/utils/validation.js
// ==========================================

/**
 * Valider un numéro de téléphone burkinabè
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return 'Le numéro de téléphone est requis';
  }
  
  // Enlever les espaces
  const cleaned = phone.replace(/\s/g, '');
  
  // Format acceptés:
  // +226XXXXXXXX (12 caractères)
  // 226XXXXXXXX (11 caractères)
  // 0XXXXXXXX (9 caractères)
  const regex = /^(\+?226)?[0567]\d{7}$/;
  
  if (!regex.test(cleaned)) {
    return 'Numéro de téléphone invalide. Format: +226XXXXXXXX';
  }
  
  return null;
};

/**
 * Valider un mot de passe
 */
export const validatePassword = (password) => {
  if (!password) {
    return 'Le mot de passe est requis';
  }
  
  if (password.length < 8) {
    return 'Le mot de passe doit contenir au moins 8 caractères';
  }
  
  // Au moins une lettre
  if (!/[a-zA-Z]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une lettre';
  }
  
  // Au moins un chiffre
  if (!/\d/.test(password)) {
    return 'Le mot de passe doit contenir au moins un chiffre';
  }
  
  return null;
};

/**
 * Valider un email
 */
export const validateEmail = (email) => {
  if (!email) {
    return null; // Email optionnel
  }
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!regex.test(email)) {
    return 'Adresse email invalide';
  }
  
  return null;
};

/**
 * Valider un champ requis
 */
export const validateRequired = (value, fieldName = 'Ce champ') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} est requis`;
  }
  return null;
};

/**
 * Valider une longueur minimale
 */
export const validateMinLength = (value, minLength, fieldName = 'Ce champ') => {
  if (!value) {
    return null;
  }
  
  if (value.length < minLength) {
    return `${fieldName} doit contenir au moins ${minLength} caractères`;
  }
  
  return null;
};

/**
 * Valider une longueur maximale
 */
export const validateMaxLength = (value, maxLength, fieldName = 'Ce champ') => {
  if (!value) {
    return null;
  }
  
  if (value.length > maxLength) {
    return `${fieldName} ne doit pas dépasser ${maxLength} caractères`;
  }
  
  return null;
};

/**
 * Valider un nombre
 */
export const validateNumber = (value, fieldName = 'Ce champ') => {
  if (!value && value !== 0) {
    return null;
  }
  
  if (isNaN(value)) {
    return `${fieldName} doit être un nombre`;
  }
  
  return null;
};

/**
 * Valider un nombre positif
 */
export const validatePositiveNumber = (value, fieldName = 'Ce champ') => {
  const numberError = validateNumber(value, fieldName);
  if (numberError) return numberError;
  
  if (Number(value) < 0) {
    return `${fieldName} doit être positif`;
  }
  
  return null;
};

/**
 * Valider un prix
 */
export const validatePrice = (price) => {
  if (!price && price !== 0) {
    return 'Le prix est requis';
  }
  
  const priceNum = Number(price);
  
  if (isNaN(priceNum)) {
    return 'Le prix doit être un nombre';
  }
  
  if (priceNum < 0) {
    return 'Le prix ne peut pas être négatif';
  }
  
  if (priceNum > 100000000) {
    return 'Le prix est trop élevé';
  }
  
  return null;
};

/**
 * Valider une quantité
 */
export const validateQuantity = (quantity) => {
  if (quantity === undefined || quantity === null || quantity === '') {
    return 'La quantité est requise';
  }
  
  const qtyNum = Number(quantity);
  
  if (isNaN(qtyNum)) {
    return 'La quantité doit être un nombre';
  }
  
  if (!Number.isInteger(qtyNum)) {
    return 'La quantité doit être un nombre entier';
  }
  
  if (qtyNum < 0) {
    return 'La quantité ne peut pas être négative';
  }
  
  if (qtyNum > 10000) {
    return 'La quantité est trop élevée';
  }
  
  return null;
};

/**
 * Valider une URL
 */
export const validateUrl = (url) => {
  if (!url) {
    return null; // URL optionnelle
  }
  
  try {
    new URL(url);
    return null;
  } catch (error) {
    return 'URL invalide';
  }
};

/**
 * Valider une date
 */
export const validateDate = (date, fieldName = 'La date') => {
  if (!date) {
    return `${fieldName} est requise`;
  }
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return `${fieldName} est invalide`;
  }
  
  return null;
};

/**
 * Valider une date future
 */
export const validateFutureDate = (date, fieldName = 'La date') => {
  const dateError = validateDate(date, fieldName);
  if (dateError) return dateError;
  
  const dateObj = new Date(date);
  const now = new Date();
  
  if (dateObj < now) {
    return `${fieldName} doit être dans le futur`;
  }
  
  return null;
};

/**
 * Valider un fichier image
 */
export const validateImage = (file) => {
  if (!file) {
    return null; // Image optionnelle
  }
  
  // Vérifier le type
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return 'Format d\'image non supporté. Utilisez JPG, PNG ou WEBP';
  }
  
  // Vérifier la taille (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return 'L\'image ne doit pas dépasser 5MB';
  }
  
  return null;
};

/**
 * Valider des coordonnées GPS
 */
export const validateCoordinates = (latitude, longitude) => {
  if (latitude === undefined || latitude === null) {
    return 'La latitude est requise';
  }
  
  if (longitude === undefined || longitude === null) {
    return 'La longitude est requise';
  }
  
  const lat = Number(latitude);
  const lon = Number(longitude);
  
  if (isNaN(lat) || isNaN(lon)) {
    return 'Coordonnées GPS invalides';
  }
  
  if (lat < -90 || lat > 90) {
    return 'Latitude invalide (doit être entre -90 et 90)';
  }
  
  if (lon < -180 || lon > 180) {
    return 'Longitude invalide (doit être entre -180 et 180)';
  }
  
  return null;
};

/**
 * Valider un OTP
 */
export const validateOTP = (otp) => {
  if (!otp) {
    return 'Le code OTP est requis';
  }
  
  if (!/^\d{6}$/.test(otp)) {
    return 'Le code OTP doit contenir exactement 6 chiffres';
  }
  
  return null;
};

/**
 * Valider l'égalité de deux valeurs
 */
export const validateMatch = (value1, value2, fieldName = 'Les champs') => {
  if (value1 !== value2) {
    return `${fieldName} ne correspondent pas`;
  }
  return null;
};