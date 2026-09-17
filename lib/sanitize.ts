/**
 * Quickly Livraison — Input Sanitization & Security Utilities
 * Protects against XSS, control characters, prototype pollution, and malformed inputs.
 */

export interface SanitizeTextOptions {
  maxLength?: number;
  allowMultiline?: boolean;
  stripHtml?: boolean;
  trim?: boolean;
}

/**
 * Strips HTML tags and script-like elements to prevent XSS.
 */
export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Removes dangerous non-printable ASCII / Unicode control characters.
 * Keeps standard whitespace like \n, \r, \t when multiline is allowed.
 */
export function stripControlCharacters(input: string, allowMultiline = true): string {
  if (!input || typeof input !== 'string') return '';
  // Unicode NFKC normalization decomposes homoglyphs and compatibility characters
  const normalized = input.normalize('NFKC');

  if (allowMultiline) {
    // Preserve \t (\x09), \n (\x0A), \r (\x0D), remove all other ASCII control chars
    return normalized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }
  // Strip all control characters including newlines
  return normalized.replace(/[\x00-\x1F\x7F]/g, ' ');
}

/**
 * Generic text sanitizer for notes, instructions, names, addresses.
 */
export function sanitizeText(value: unknown, options: SanitizeTextOptions = {}): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') {
    value = String(value);
  }

  const {
    maxLength = 1000,
    allowMultiline = true,
    stripHtml = true,
    trim = true,
  } = options;

  let text = value as string;

  // 1. Strip HTML if requested
  if (stripHtml) {
    text = stripHtmlTags(text);
  }

  // 2. Strip dangerous control characters
  text = stripControlCharacters(text, allowMultiline);

  // 3. Normalize multiple whitespace
  if (allowMultiline) {
    // Collapse 3+ consecutive newlines into 2
    text = text.replace(/\n{3,}/g, '\n\n');
    // Collapse multiple horizontal spaces/tabs into a single space
    text = text.replace(/[ \t]{2,}/g, ' ');
  } else {
    text = text.replace(/\s{2,}/g, ' ');
  }

  // 4. Trim leading/trailing whitespace
  if (trim) {
    text = text.trim();
  }

  // 5. Enforce max length
  if (maxLength > 0 && text.length > maxLength) {
    text = text.substring(0, maxLength);
  }

  return text;
}

/**
 * Sanitizes an email address (trims, strips tags, lowercases, removes invalid spaces).
 */
export function sanitizeEmail(value: unknown): string {
  if (!value || typeof value !== 'string') return '';
  const cleaned = sanitizeText(value, {
    maxLength: 254,
    allowMultiline: false,
    stripHtml: true,
    trim: true,
  }).toLowerCase();

  // Remove any internal spaces or invalid control characters
  return cleaned.replace(/\s+/g, '');
}

/**
 * Validates and normalizes phone numbers (Moroccan 06/07/+212 or international E.164).
 */
export function sanitizePhone(value: unknown): string {
  if (!value || typeof value !== 'string') return '';
  const raw = value.trim();

  // Strip all non-digit and non-plus characters
  const clean = raw.replace(/[^\d+]/g, '');

  // 1. Local Moroccan: 06XXXXXXXX or 07XXXXXXXX (10 digits) -> +212XXXXXXXXX
  if (/^0[67]\d{8}$/.test(clean)) {
    return '+212' + clean.substring(1);
  }

  // 2. Without leading +: 2126XXXXXXXX or 2127XXXXXXXX
  if (/^212[67]\d{8}$/.test(clean)) {
    return '+' + clean;
  }

  // 3. With leading 00: 002126XXXXXXXX
  if (/^00212[67]\d{8}$/.test(clean)) {
    return '+' + clean.substring(2);
  }

  // 4. Full international Moroccan format: +2126XXXXXXXX
  if (/^\+212[67]\d{8}$/.test(clean)) {
    return clean;
  }

  // 5. General international mobile format: +[country_code][number] (8-15 digits)
  if (/^\+[1-9]\d{7,14}$/.test(clean)) {
    return clean;
  }

  // If no prefix, return cleaned digits (max 15)
  return clean.substring(0, 16);
}

/**
 * Sanitizes person or business names (preserves letters, spaces, hyphens, apostrophes).
 */
export function sanitizeName(value: unknown, maxLength = 100): string {
  if (!value || typeof value !== 'string') return '';
  const text = sanitizeText(value, {
    maxLength,
    allowMultiline: false,
    stripHtml: true,
    trim: true,
  });
  // Strip brackets, angle brackets, braces, and control punctuation
  return text.replace(/[<>{}[\]\\;`~]/g, '');
}

/**
 * Sanitizes addresses and location notes.
 */
export function sanitizeAddress(value: unknown, maxLength = 300): string {
  if (!value || typeof value !== 'string') return '';
  return sanitizeText(value, {
    maxLength,
    allowMultiline: false,
    stripHtml: true,
    trim: true,
  }).replace(/[<>{}[\]\\;`~]/g, '');
}

/**
 * Sanitizes search queries (prevents query injection, regex breakouts).
 */
export function sanitizeSearchQuery(value: unknown, maxLength = 100): string {
  if (!value || typeof value !== 'string') return '';
  const text = sanitizeText(value, {
    maxLength,
    allowMultiline: false,
    stripHtml: true,
    trim: true,
  });
  // Neutralize SQL-like wildcards or regex meta characters if entered excessively
  return text.replace(/[%_\\]/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Sanitizes a numeric value with bounds checking.
 */
export function sanitizeNumber(
  value: unknown,
  fallback = 0,
  min?: number,
  max?: number
): number {
  if (value === null || value === undefined) return fallback;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num) || !isFinite(num)) return fallback;

  let bounded = num;
  if (min !== undefined && bounded < min) bounded = min;
  if (max !== undefined && bounded > max) bounded = max;
  return bounded;
}

/**
 * Sanitizes an OTP code (digits only, max 6 digits).
 */
export function sanitizeOtp(value: unknown): string {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/\D/g, '').substring(0, 6);
}

/**
 * Recursively sanitizes all string properties in an object or array.
 * Protects against prototype pollution and deeply nested untrusted payloads.
 */
export function sanitizeObject<T>(input: T, depth = 0): T {
  if (depth > 10) return input; // Guard against deep recursion
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    return sanitizeText(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item, depth + 1)) as unknown as T;
  }

  if (typeof input === 'object' && input.constructor === Object) {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(input)) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      result[key] = sanitizeObject(val, depth + 1);
    }
    return result as T;
  }

  return input;
}

