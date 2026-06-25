// utils/validators.js

export const validateName = (name) => {
  if (!name) return "Name is required.";
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Minimum 2 characters.";
  if (trimmed.length > 50) return "Maximum 50 characters.";
  if (!/^[A-Za-z\s]+$/.test(trimmed)) return "Name must contain only letters and spaces.";
  return null;
};

export const validateMobile = (mobile) => {
  if (!mobile) return "Mobile number is required.";
  if (!/^\d{10}$/.test(mobile)) return "Must be exactly 10 digits, only numeric values allowed.";
  return null;
};

export const validateEmail = (email) => {
  if (!email) return "Email address is required.";
  if (email.length > 100) return "Maximum 100 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Please enter a valid email address (example@domain.com).";
  return null;
};

export const validatePassword = (pwd) => {
  if (!pwd) return "Password is required.";
  if (pwd.length < 8) return "Minimum 8 characters.";
  if (pwd.length > 20) return "Maximum 20 characters.";
  if (/\s/.test(pwd)) return "Spaces are not allowed.";
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial)
    return "Must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.";
  return null;
};

export const validateConfirmPassword = (confirm, pwd) => {
  if (!confirm) return "Please confirm your password.";
  if (confirm !== pwd) return "Passwords do not match.";
  return null;
};

export const validateTerms = (accepted) => {
  if (!accepted) return "Please accept the Terms and Conditions to continue.";
  return null;
};