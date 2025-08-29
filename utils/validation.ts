/**
 * Validates a Turkish Citizen ID Number (TC Kimlik Numarası).
 * @param s The TCKN string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
export function isValidTCKN(s: string | null | undefined): boolean {
  if (!s || !/^\d{11}$/.test(s) || s[0] === '0') return false;
  const digits = s.split('').map(Number);
  const odd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const even = digits[1] + digits[3] + digits[5] + digits[7];
  const d10 = (((odd * 7) - even) % 10 + 10) % 10; // Robust modulo for negative numbers
  const d11 = (digits.slice(0, 10).reduce((a, b) => a + b, 0)) % 10;
  return digits[9] === d10 && digits[10] === d11;
}

/**
 * Normalizes a Turkish phone number to +90 format.
 * @param p The phone number string to normalize.
 * @returns {string} The normalized phone number or the original string if invalid.
 */
export function normalizePhone(p: string | null | undefined): string {
  if (!p) return '';
  const d = p.replace(/\D+/g, '');
  if (d.startsWith('90') && d.length === 12) return '+' + d;
  if (d.length === 11 && d.startsWith('0')) return '+90' + d.substring(1);
  if (d.length === 10) return '+90' + d;
  return p; // Return original if it's not a recognizable Turkish number
}
