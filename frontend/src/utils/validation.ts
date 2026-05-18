/** Simple validators used by forms. */

export function isEmail(value: string): boolean {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isStrongEnoughPassword(value: string): boolean {
  return typeof value === "string" && value.length >= 6;
}

export function isNonEmpty(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
