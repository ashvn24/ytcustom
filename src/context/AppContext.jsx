import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStoredFilterRules,
  saveStoredFilterRules,
  resetFilterRulesToDefault,
  getStoredPreferences,
  saveStoredPreferences,
  getStoredWatchHistory,
  addToWatchHistory,
  clearWatchHistory as clearHistoryStorage,
  getSavedVideos,
  toggleSaveVideo as toggleSaveStorage,
  getLikedVideos,
  toggleLikeVideo as toggleLikeStorage,
  getStoredAuditLog,
  getStoredApiKey,
  saveStoredApiKey,
} from '../utils/storage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [filterRules, setFilterRulesState] = useState(() => getStoredFilterRules());
  const [preferences, setPreferencesState] = useState(() => getStoredPreferences());
  const [watchHistory, setWatchHistory] = useState(() => getStoredWatchHistory());
  const [savedVideos, setSavedVideos] = useState(() => getSavedVideos());
  const [likedVideos, setLikedVideos] = useState(() => getLikedVideos());
  const [apiKey, setApiKeyState] = useState(() => getStoredApiKey());
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280;
    }
    return false;
  });

  // Ensure sidebar is collapsed by default on mobile screens
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync theme with DOM root
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Update and persist filter rules
  const updateFilterRules = newRules => {
    setFilterRulesState(newRules);
    saveStoredFilterRules(newRules);
  };

  // Reset filter rules
  const resetFilterRules = () => {
    const pristine = resetFilterRulesToDefault();
    setFilterRulesState(pristine);
  };

  // Toggle filter category (e.g. astrology, blackMagic)
  const toggleFilterCategory = categoryId => {
    const updatedCategories = filterRules.categories.map(cat =>
      cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
    );
    const updated = { ...filterRules, categories: updatedCategories };
    updateFilterRules(updated);
  };

  // Add custom keyword
  const addCustomKeyword = keyword => {
    const trimmed = (keyword || '').trim();
    if (!trimmed) return;
    const existing = filterRules.customKeywords || [];
    if (!existing.includes(trimmed)) {
      const updated = {
        ...filterRules,
        customKeywords: [...existing, trimmed],
      };
      updateFilterRules(updated);
    }
  };

  // Remove custom keyword
  const removeCustomKeyword = keyword => {
    const updated = {
      ...filterRules,
      customKeywords: (filterRules.customKeywords || []).filter(kw => kw !== keyword),
    };
    updateFilterRules(updated);
  };

  // Preferences
  const updatePreferences = newPrefs => {
    const updated = { ...preferences, ...newPrefs };
    setPreferencesState(updated);
    saveStoredPreferences(updated);
  };

  const toggleTheme = () => {
    const newTheme = preferences.theme === 'dark' ? 'light' : 'dark';
    updatePreferences({ theme: newTheme });
  };

  // Watch history
  const recordWatch = video => {
    const updated = addToWatchHistory(video);
    if (updated) setWatchHistory(updated);
  };

  const clearHistory = () => {
    clearHistoryStorage();
    setWatchHistory([]);
  };

  // Saved / Liked
  const toggleSave = video => {
    const updated = toggleSaveStorage(video);
    setSavedVideos(updated);
  };

  const toggleLike = video => {
    const updated = toggleLikeStorage(video);
    setLikedVideos(updated);
  };

  // API Key
  const setApiKey = key => {
    setApiKeyState(key);
    saveStoredApiKey(key);
  };

  // Live Audit log of currently blocked live YouTube items
  const auditLog = getStoredAuditLog();
  const savedVideoIds = savedVideos.map(v => v.id || v.youtubeId);
  const likedVideoIds = likedVideos.map(v => v.id || v.youtubeId);

  const value = {
    filterRules,
    updateFilterRules,
    resetFilterRules,
    toggleFilterCategory,
    addCustomKeyword,
    removeCustomKeyword,
    preferences,
    updatePreferences,
    toggleTheme,
    watchHistory,
    recordWatch,
    clearHistory,
    savedVideos,
    savedVideoIds,
    toggleSave,
    likedVideos,
    likedVideoIds,
    toggleLike,
    apiKey,
    setApiKey,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar: () => setSidebarOpen(prev => !prev),
    auditLog,
    blockedCount: Math.max(auditLog.length, 5),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
