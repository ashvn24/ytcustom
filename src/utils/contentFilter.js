import { normalizeText, matchesKeyword } from './textNormalization';

/**
 * Checks if a video has sufficient metadata to determine safety.
 */
export function hasInsufficientMetadata(video) {
  if (!video) return true;
  const title = (video.title || '').trim();
  const description = (video.description || '').trim();
  const tags = Array.isArray(video.tags) ? video.tags : [];
  
  // Need at least a descriptive title (> 5 chars)
  if (title.length < 5) return true;
  return false;
}

/**
 * Checks if content possesses educational / debunking context (e.g., science debunking astrology myths).
 */
export function hasEducationalContext(normalizedText, whitelistedTerms = []) {
  if (!normalizedText || !whitelistedTerms.length) return false;
  return whitelistedTerms.some(term => {
    const normalizedTerm = normalizeText(term, true);
    return normalizedText.includes(normalizedTerm);
  });
}

/**
 * Analyzes a single video object against current filter configuration.
 *
 * @param {Object} video - Video object containing title, description, tags, etc.
 * @param {Object} filterConfig - Complete filter configuration (categories, customKeywords, options)
 * @returns {Object} { blocked: boolean, reason: string | null, category: string | null, matchedKeyword: string | null }
 */
export function analyzeVideo(video, filterConfig) {
  if (!video) {
    return { blocked: true, reason: 'Empty or invalid video object', category: 'invalid', matchedKeyword: null };
  }

  const {
    strictMode = false,
    allowEducationalDebunking = true,
    blockIfInsufficientMetadata = false,
    categories = [],
    customKeywords = [],
    whitelistedEducationalTerms = [],
  } = filterConfig || {};

  // Check 1: Insufficient metadata policy
  if (blockIfInsufficientMetadata && hasInsufficientMetadata(video)) {
    return {
      blocked: true,
      reason: 'Insufficient metadata to verify content safety policy',
      category: 'insufficient_metadata',
      matchedKeyword: null,
    };
  }

  // Build combined searchable text corpus from video metadata
  const title = video.title || '';
  const description = video.description || '';
  const tagsText = Array.isArray(video.tags) ? video.tags.join(' ') : (video.tags || '');
  const category = video.category || '';
  const subCategory = video.subCategory || '';
  const channel = video.channel || '';

  const rawCorpus = `${title} ${description} ${tagsText} ${category} ${subCategory} ${channel}`;
  const normalizedText = normalizeText(rawCorpus, true);

  // Check 2: Educational / Debunking exemption (unless strictMode is enabled)
  if (!strictMode && allowEducationalDebunking) {
    if (hasEducationalContext(normalizedText, whitelistedEducationalTerms)) {
      // Whitelisted for scientific / debunking context
      return {
        blocked: false,
        reason: 'Allowed under educational/debunking exemption',
        category: null,
        matchedKeyword: null,
        isEducationalExemption: true,
      };
    }
  }

  // Check 3: Predefined Filter Categories
  for (const cat of categories) {
    if (cat.enabled && Array.isArray(cat.keywords)) {
      for (const kw of cat.keywords) {
        if (matchesKeyword(normalizedText, kw)) {
          return {
            blocked: true,
            reason: `Blocked by rule: "${kw}" in category "${cat.name}"`,
            category: cat.id,
            matchedKeyword: kw,
          };
        }
      }
    }
  }

  // Check 4: User-defined Custom Keywords
  if (Array.isArray(customKeywords)) {
    for (const kw of customKeywords) {
      if (kw && matchesKeyword(normalizedText, kw)) {
        return {
          blocked: true,
          reason: `Blocked by custom user rule: "${kw}"`,
          category: 'custom',
          matchedKeyword: kw,
        };
      }
    }
  }

  return {
    blocked: false,
    reason: null,
    category: null,
    matchedKeyword: null,
  };
}

/**
 * Centralized filter function applied before rendering any video collection.
 *
 * @param {Array<Object>} videos - Raw list of video objects
 * @param {Object} filterConfig - Active filter configuration
 * @returns {Array<Object>} Safe, filtered videos
 */
export function filterVideos(videos, filterConfig) {
  if (!Array.isArray(videos)) return [];
  return videos.filter(video => {
    const analysis = analyzeVideo(video, filterConfig);
    return !analysis.blocked;
  });
}

/**
 * Filters search query autocomplete suggestions to prevent blocked search terms or leakages.
 *
 * @param {Array<string>} suggestions - List of autocomplete search terms
 * @param {Object} filterConfig - Active filter configuration
 * @returns {Array<string>} Filtered suggestions
 */
export function filterSearchSuggestions(suggestions, filterConfig) {
  if (!Array.isArray(suggestions)) return [];

  return suggestions.filter(suggestion => {
    const dummyVideo = { title: suggestion, description: '', tags: [] };
    const analysis = analyzeVideo(dummyVideo, filterConfig);
    return !analysis.blocked;
  });
}

/**
 * Generates an audit log of all blocked videos with detailed diagnostics.
 *
 * @param {Array<Object>} videos - Complete collection of videos
 * @param {Object} filterConfig - Active filter configuration
 * @returns {Array<Object>} List of blocked items with analysis metadata
 */
export function getFilterAuditLog(videos, filterConfig) {
  if (!Array.isArray(videos)) return [];

  const auditLog = [];
  for (const video of videos) {
    const analysis = analyzeVideo(video, filterConfig);
    if (analysis.blocked) {
      auditLog.push({
        video,
        analysis,
        timestamp: new Date().toISOString(),
      });
    }
  }
  return auditLog;
}
