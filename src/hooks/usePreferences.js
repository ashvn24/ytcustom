import { useApp } from '../context/AppContext';

/**
 * Custom hook providing user preferences, theme, and saved videos
 */
export function usePreferences() {
  const {
    preferences,
    updatePreferences,
    toggleTheme,
    savedVideoIds,
    toggleSave,
    likedVideoIds,
    toggleLike,
    watchHistory,
    clearHistory,
    recordWatch,
  } = useApp();

  return {
    preferences,
    theme: preferences.theme,
    toggleTheme,
    preferredCategories: preferences.preferredCategories,
    setPreferredCategories: cats => updatePreferences({ preferredCategories: cats }),
    savedVideoIds,
    toggleSave,
    isSaved: id => savedVideoIds.includes(id),
    likedVideoIds,
    toggleLike,
    isLiked: id => likedVideoIds.includes(id),
    watchHistory,
    clearHistory,
    recordWatch,
  };
}
