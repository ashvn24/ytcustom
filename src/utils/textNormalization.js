/**
 * Text normalization utilities for robust, multi-language content filtering.
 * Supports English, Malayalam (Unicode), Manglish transliterations, and leetspeak de-obfuscation.
 */

// Common leetspeak substitutions within words (e.g. bl@ck m@gic, v4shikaran)
const LEET_REPLACEMENTS = [
  { pattern: /@/g, replacement: 'a' },
  { pattern: /4/g, replacement: 'a' },
  { pattern: /8/g, replacement: 'b' },
  { pattern: /3/g, replacement: 'e' },
  { pattern: /1/g, replacement: 'i' },
  { pattern: /0/g, replacement: 'o' },
  { pattern: /\$/g, replacement: 's' },
  { pattern: /5/g, replacement: 's' },
  { pattern: /7/g, replacement: 't' },
];

/**
 * Normalizes text for keyword matching:
 * 1. Removes invisible characters & zero-width joiners
 * 2. Normalizes Latin diacritics (without corrupting Indic \p{M} vowel signs)
 * 3. Converts to lowercase
 * 4. Leetspeak translation for Latin alphabets
 * 5. Punctuation removal while preserving letters, Indic vowel marks (\p{M}), numbers, and spaces
 * 6. Collapsing extra whitespace
 *
 * @param {string} text - Raw input string
 * @param {boolean} aggressive - Whether to apply aggressive leetspeak normalization
 * @returns {string} Normalized string
 */
export function normalizeText(text, aggressive = true) {
  if (!text || typeof text !== 'string') return '';

  let normalized = text;

  // 1. Remove zero-width spaces, soft hyphens, and invisible Unicode chars
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');

  // 2. Normalize to NFC to compose characters cleanly
  try {
    normalized = normalized.normalize('NFC');
  } catch (e) {
    // Fallback if environment doesn't support NFC
  }

  // 3. Strip Latin diacritics only (e.g. é -> e, à -> a) without touching Indic scripts
  // Latin letters with accents: \u00C0-\u024F
  try {
    // Only apply NFD to Latin character ranges
    normalized = normalized.replace(/[\u00C0-\u024F]/g, match => {
      return match.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    });
  } catch (e) {
    // Safe fallback
  }

  // 4. Convert to lowercase
  normalized = normalized.toLowerCase();

  // 5. Replace dashes and underscores with spaces to separate compound words
  normalized = normalized.replace(/[-_]/g, ' ');

  // 6. Optional Leetspeak translation
  if (aggressive) {
    for (const { pattern, replacement } of LEET_REPLACEMENTS) {
      normalized = normalized.replace(pattern, replacement);
    }
  }

  // 7. Strip punctuation while PRESERVING letters (\p{L}), Indic combining marks & vowel signs (\p{M}), numbers (\p{N}), and spaces (\s)
  normalized = normalized.replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ');

  // 8. Collapse multiple whitespace characters into a single space and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Checks whether target text matches any blocked keyword or phrase.
 * Handles boundary checking for Latin characters while respecting regional scripts.
 *
 * @param {string} normalizedText - The pre-normalized text to search within
 * @param {string} keyword - The keyword or phrase to search for
 * @returns {boolean} True if matched
 */
export function matchesKeyword(normalizedText, keyword) {
  if (!normalizedText || !keyword) return false;

  const normalizedKeyword = normalizeText(keyword, true);
  if (!normalizedKeyword) return false;

  // If keyword contains non-Latin characters (e.g. Malayalam: \u0D00-\u0D7F), perform substring search
  const isNonLatin = /[^\u0000-\u007F]/.test(normalizedKeyword);

  if (isNonLatin) {
    return normalizedText.includes(normalizedKeyword);
  }

  // For Latin / English / Manglish, use word-boundary matching so that:
  // "astronomy" doesn't match "astro" (unless "astronomy" is explicitly blocked)
  // "saturn planet" doesn't match "turn"
  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, 'i');

  return regex.test(normalizedText);
}
