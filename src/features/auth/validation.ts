// Mirrors AuthViewModel.validateEmail / validatePassword and the username rules in
// SignUpView.swift so an account created on any platform passes on every platform.

const EMAIL_REGEX = /^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,64}$/;

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(trimmed)) return false;
  const [, domain] = trimmed.split("@");
  const parts = domain.split(".");
  return parts.length >= 2 && parts[parts.length - 2].length >= 2;
}

export interface PasswordChecks {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
}

export function checkPassword(password: string): PasswordChecks & { isValid: boolean; met: number } {
  const checks: PasswordChecks = {
    minLength: password.length >= 8,
    uppercase: /\p{Lu}/u.test(password),
    lowercase: /\p{Ll}/u.test(password),
    number: /\p{Nd}/u.test(password),
  };
  const met = Object.values(checks).filter(Boolean).length;
  return { ...checks, isValid: met === 4, met };
}

export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export type UsernameIssue = "too-short" | "invalid-chars" | null;

export function usernameIssue(raw: string): UsernameIssue {
  const username = raw.trim().toLowerCase();
  if (username.length < 3) return "too-short";
  if (!/^[a-z0-9_]+$/.test(username)) return "invalid-chars";
  return null;
}

export const USERNAME_ISSUE_MESSAGES = {
  "too-short": "Must be at least 3 characters.",
  "invalid-chars": "Letters, numbers, and underscores only.",
} as const;

export const USERNAME_TAKEN_MESSAGE = "That username is already taken.";
