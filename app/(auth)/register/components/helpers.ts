import type { PasswordScore } from "./types";

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getPasswordScore(password: string): PasswordScore {
  if (!password) return 0;

  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return Math.min(score, 4) as PasswordScore;
}
