/**
 * Form Validation Utilities
 * Provides comprehensive validation for user inputs
 */

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  // Basic email regex - checks for @ and . in reasonable positions
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address (e.g., you@example.com)' };
  }

  if (trimmed.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' };
  }

  return { valid: true, value: trimmed.toLowerCase() };
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password is too long (max 128 characters)' };
  }

  // Check for at least one letter and one number for better security
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { valid: false, error: 'Password must contain at least one letter and one number' };
  }

  return { valid: true, value: password };
}

/**
 * Validate South African phone number
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 0) {
    return { valid: false, error: 'Phone number is required' };
  }

  // SA numbers: 10 digits (0XX XXX XXXX) or 11 with country code (27XX XXX XXXX)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    // Valid SA number: 0XX XXX XXXX
    return { valid: true, value: cleaned };
  }

  if (cleaned.length === 11 && cleaned.startsWith('27')) {
    // Valid SA number with country code: 27XX XXX XXXX
    return { valid: true, value: cleaned };
  }

  if (cleaned.length === 9) {
    // Missing leading 0, add it
    return { valid: true, value: '0' + cleaned };
  }

  return {
    valid: false,
    error: 'Please enter a valid SA phone number (e.g., 0821234567 or 27821234567)'
  };
}

/**
 * Validate person name (first, last, customer name, etc.)
 */
export function validateName(name, fieldName = 'Name') {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: `${fieldName} is too long (max 100 characters)` };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;

  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate store/business name
 */
export function validateStoreName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Store name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Store name is required' };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'Store name must be at least 2 characters' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Store name is too long (max 50 characters)' };
  }

  // Allow letters, numbers, spaces, and common punctuation
  const storeNameRegex = /^[a-zA-Z0-9\s\-'&.]+$/;

  if (!storeNameRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Store name can only contain letters, numbers, spaces, and basic punctuation (- \' & .)'
    };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate that two passwords match
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }

  return { valid: true };
}

/**
 * Validate a number/amount
 */
export function validateAmount(amount, fieldName = 'Amount') {
  if (amount === null || amount === undefined || amount === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const num = Number(amount);

  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (num < 0) {
    return { valid: false, error: `${fieldName} cannot be negative` };
  }

  if (num > 1000000) {
    return { valid: false, error: `${fieldName} is too large` };
  }

  return { valid: true, value: num };
}

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags and encode special characters
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validate multiple fields at once
 * Returns { valid: boolean, errors: object }
 */
export function validateForm(fields) {
  const errors = {};
  let isValid = true;

  Object.keys(fields).forEach(fieldName => {
    const field = fields[fieldName];
    const result = field.validator(field.value);

    if (!result.valid) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  });

  return { valid: isValid, errors };
}
