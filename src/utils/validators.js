export const validateEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Enter a valid email address'

export const validatePassword = (v) =>
  v.length >= 8 ? null : 'Password must be at least 8 characters'

export const validateConfirmPassword = (password, confirm) =>
  password === confirm ? null : 'Passwords do not match'

export const validateRequired = (v, label) =>
  v?.trim() ? null : `${label} is required`
