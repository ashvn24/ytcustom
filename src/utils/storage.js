import defaultFilterRules from '../data/filterRules.json';

const STORAGE_KEYS = {
  FILTER_RULES: 'pureview_filter_rules_v1_1',
  USER_PREFERENCES: 'pureview_preferences_v1',
  WATCH_HISTORY: 'pureview_watch_history_v1',
  SAVED_VIDEOS: 'pureview_saved_videos_v2',
  LIKED_VIDEOS: 'pureview_liked_videos_v2',
  BLOCKED_AUDIT_LOG: 'pureview_blocked_audit_log_v1',
  API_KEY: 'pureview_yt_api_key_v1',
};

// Default Active YouTube Data API v3 Key
export const DEFAULT_YOUTUBE_API_KEY = 'AIzaSyB7kzw7YJGGb95Ope-mnAcgq43W0ppVSP8';

// Default User Preferences
export const DEFAULT_PREFERENCES = {
  theme: 'dark',
  preferredCategories: [
    'Hindu Devotional',
    'Educational & Science',
    'Programming & Technology',
    'Nature & Wildlife',
    'Cooking & Food',
  ],
};

/**
 * Loads stored filter rules or initializes from filterRules.json
 */
export function getStoredFilterRules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FILTER_RULES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version !== defaultFilterRules.version) {
        parsed.categories = defaultFilterRules.categories;
        parsed.version = defaultFilterRules.version;
        saveStoredFilterRules(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading filter rules from localStorage', err);
  }

  const initial = {
    version: defaultFilterRules.version,
    strictMode: defaultFilterRules.defaultSettings.strictMode,
    allowEducationalDebunking: defaultFilterRules.defaultSettings.allowEducationalDebunking,
    blockIfInsufficientMetadata: defaultFilterRules.defaultSettings.blockIfInsufficientMetadata,
    categories: defaultFilterRules.categories,
    customKeywords: defaultFilterRules.customKeywords || [],
    whitelistedEducationalTerms: defaultFilterRules.whitelistedEducationalTerms || [],
  };

  saveStoredFilterRules(initial);
  return initial;
}

export function saveStoredFilterRules(rules) {
  try {
    localStorage.setItem(STORAGE_KEYS.FILTER_RULES, JSON.stringify(rules));
  } catch (err) {
    console.error('Error saving filter rules to localStorage', err);
  }
}

export function resetFilterRulesToDefault() {
  const initial = {
    version: defaultFilterRules.version,
    strictMode: defaultFilterRules.defaultSettings.strictMode,
    allowEducationalDebunking: defaultFilterRules.defaultSettings.allowEducationalDebunking,
    blockIfInsufficientMetadata: defaultFilterRules.defaultSettings.blockIfInsufficientMetadata,
    categories: defaultFilterRules.categories,
    customKeywords: [],
    whitelistedEducationalTerms: defaultFilterRules.whitelistedEducationalTerms,
  };
  saveStoredFilterRules(initial);
  return initial;
}

export function getStoredPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error reading preferences from localStorage', err);
  }
  return DEFAULT_PREFERENCES;
}

export function saveStoredPreferences(prefs) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs));
  } catch (err) {
    console.error('Error saving preferences to localStorage', err);
  }
}

/**
 * Watch History
 */
export function getStoredWatchHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addToWatchHistory(video) {
  if (!video || !video.id) return;
  try {
    const history = getStoredWatchHistory();
    const filtered = history.filter(v => v.id !== video.id && v.youtubeId !== video.youtubeId);
    const updated = [
      {
        ...video,
        watchedAt: new Date().toISOString(),
      },
      ...filtered,
    ].slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error(e);
  }
}

export function clearWatchHistory() {
  try {
    localStorage.removeItem(STORAGE_KEYS.WATCH_HISTORY);
  } catch (e) {}
}

/**
 * Saved Live Videos
 */
export function getSavedVideos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_VIDEOS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function toggleSaveVideo(video) {
  if (!video) return [];
  try {
    const videoId = typeof video === 'string' ? video : video.id;
    const saved = getSavedVideos();
    const exists = saved.some(v => v.id === videoId || v.youtubeId === videoId);

    let updated = [];
    if (exists) {
      updated = saved.filter(v => v.id !== videoId && v.youtubeId !== videoId);
    } else {
      const videoObj = typeof video === 'object' ? video : { id: videoId, youtubeId: videoId, title: 'Saved Video' };
      updated = [videoObj, ...saved];
    }
    localStorage.setItem(STORAGE_KEYS.SAVED_VIDEOS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

/**
 * Liked Live Videos
 */
export function getLikedVideos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LIKED_VIDEOS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function toggleLikeVideo(video) {
  if (!video) return [];
  try {
    const videoId = typeof video === 'string' ? video : video.id;
    const liked = getLikedVideos();
    const exists = liked.some(v => v.id === videoId || v.youtubeId === videoId);

    let updated = [];
    if (exists) {
      updated = liked.filter(v => v.id !== videoId && v.youtubeId !== videoId);
    } else {
      const videoObj = typeof video === 'object' ? video : { id: videoId, youtubeId: videoId, title: 'Liked Video' };
      updated = [videoObj, ...liked];
    }
    localStorage.setItem(STORAGE_KEYS.LIKED_VIDEOS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

/**
 * Live Blocked Audit Log
 */
export function getStoredAuditLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BLOCKED_AUDIT_LOG);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addBlockedAuditEntry(video, analysis) {
  if (!video) return;
  try {
    const log = getStoredAuditLog();
    const videoId = video.id || video.youtubeId || video.title;
    // Don't duplicate in log
    if (log.some(item => (item.video?.id || item.video?.youtubeId) === videoId)) return log;

    const updated = [
      {
        video,
        analysis,
        timestamp: new Date().toISOString(),
      },
      ...log,
    ].slice(0, 150); // keep last 150 blocked items
    localStorage.setItem(STORAGE_KEYS.BLOCKED_AUDIT_LOG, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

/**
 * API Key
 */
export function getStoredApiKey() {
  try {
    const key = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (key !== null && key.trim() !== '') {
      return key.trim();
    }
  } catch (e) {}
  return DEFAULT_YOUTUBE_API_KEY;
}

export function saveStoredApiKey(apiKey) {
  try {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey.trim());
    } else {
      localStorage.setItem(STORAGE_KEYS.API_KEY, '');
    }
  } catch (e) {}
}
