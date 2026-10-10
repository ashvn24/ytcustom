import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Sun,
  Moon,
  AlertTriangle,
  CheckCircle2,
  ListFilter,
  Eye,
  Sliders,
  History,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePreferences } from '../hooks/usePreferences';

export default function Settings() {
  const {
    filterRules,
    updateFilterRules,
    resetFilterRules,
    toggleFilterCategory,
    addCustomKeyword,
    removeCustomKeyword,
    preferences,
    updatePreferences,
    toggleTheme,
    clearHistory,
    auditLog,
    blockedCount,
  } = useApp();

  const [activeTab, setActiveTab] = useState('rules');
  const [newKeyword, setNewKeyword] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  const showNotification = (msg, isError = false) => {
    setStatusMessage({ msg, isError });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Add custom keyword handler
  const handleAddCustomKeyword = e => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    addCustomKeyword(newKeyword.trim());
    newKeyword && showNotification(`Added custom keyword "${newKeyword.trim()}"`);
    setNewKeyword('');
  };

  // Toggle category preference
  const togglePreferredCategory = catName => {
    const current = preferences.preferredCategories || [];
    const updated = current.includes(catName)
      ? current.filter(c => c !== catName)
      : [...current, catName];
    updatePreferences({ preferredCategories: updated });
  };

  // Export JSON configuration
  const handleExportConfig = () => {
    const data = {
      filterRules,
      preferences,
      exportedAt: new Date().toISOString(),
      app: 'YouTube',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-filter-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Configuration exported successfully!');
  };

  // Import JSON configuration
  const handleImportConfig = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.filterRules) {
          updateFilterRules(imported.filterRules);
        }
        if (imported.preferences) {
          updatePreferences(imported.preferences);
        }
        showNotification('Settings successfully imported!');
      } catch (err) {
        showNotification('Invalid JSON file format', true);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  const allAvailableCategories = [
    'Cooking & Recipes',
    'Health Benefits',
    'Thyroid Care & Cure',
    'Menopause Guide',
    'Good Living Habits',
    'Hindu Devotional',
    'Nature & Wildlife',
    'Educational & Science',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-3 md:pt-4">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Content Filtering &amp; Settings
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Strict client-side filtering rules, category preferences, and privacy controls.
            </p>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 transition-all ${
            statusMessage.isError
              ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
              : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-white dark:text-neutral-900" />
          <span>{statusMessage.msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'rules'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Filter Rules &amp; Groups</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'custom'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Custom Keywords ({filterRules.customKeywords?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'audit'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Shield Audit Log ({blockedCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'preferences'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Preferences &amp; Storage</span>
        </button>
      </div>

      {/* Tab: Predefined Filter Categories & Strictness */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Policy strictness toggles */}
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              Filtering Strictness &amp; Policies
            </h3>

            {/* Strict Mode Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Aggressive Strict Mode (Zero Tolerance)
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Blocks any video even if mentioned in educational or historical contexts.
                </div>
              </div>
              <input
                type="checkbox"
                checked={filterRules.strictMode || false}
                onChange={e =>
                  updateFilterRules({ ...filterRules, strictMode: e.target.checked })
                }
                className="w-5 h-5 accent-red-600 rounded cursor-pointer"
              />
            </div>

            {/* Allow Educational / Debunking Context */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Exempt Educational &amp; Debunking Documentaries
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Allows videos that scientifically expose astrology or black magic scams.
                </div>
              </div>
              <input
                type="checkbox"
                disabled={filterRules.strictMode}
                checked={filterRules.allowEducationalDebunking ?? true}
                onChange={e =>
                  updateFilterRules({
                    ...filterRules,
                    allowEducationalDebunking: e.target.checked,
                  })
                }
                className="w-5 h-5 accent-red-600 rounded cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Missing metadata */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60">
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Exclude Videos with Insufficient Metadata
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Excludes videos with sparse descriptions until safety can be verified.
                </div>
              </div>
              <input
                type="checkbox"
                checked={filterRules.blockIfInsufficientMetadata || false}
                onChange={e =>
                  updateFilterRules({
                    ...filterRules,
                    blockIfInsufficientMetadata: e.target.checked,
                  })
                }
                className="w-5 h-5 accent-red-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Predefined Filter Groups */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              Predefined Blocked Categories
            </h3>

            {filterRules.categories.map(cat => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      {cat.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold">
                      {cat.keywords.length} keywords
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {cat.description}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                    {cat.keywords.slice(0, 15).map(kw => (
                      <span
                        key={kw}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                      >
                        {kw}
                      </span>
                    ))}
                    {cat.keywords.length > 15 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-neutral-400 italic">
                        +{cat.keywords.length - 15} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 pt-1">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cat.enabled}
                      onChange={() => toggleFilterCategory(cat.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                resetFilterRules();
                showNotification('Filter rules reset to defaults!');
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-red-500 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset All Rules to Default</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab: Custom Keywords */}
      {activeTab === 'custom' && (
        <div className="space-y-6">
          <form onSubmit={handleAddCustomKeyword} className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              placeholder="Add custom blocked phrase (e.g. 'crystal ball', 'chovva dosham')..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={!newKeyword.trim()}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Block Phrase</span>
            </button>
          </form>

          <div>
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 mb-3">
              Your Custom Blocked Keywords
            </h3>

            {(!filterRules.customKeywords || filterRules.customKeywords.length === 0) ? (
              <div className="p-8 text-center text-xs text-neutral-500 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl">
                No custom keywords added yet. Use the input above to add phrases you wish to block.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filterRules.customKeywords.map(kw => (
                  <div
                    key={kw}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-medium"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomKeyword(kw)}
                      className="p-0.5 hover:text-red-700 dark:hover:text-red-200"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Shield Audit Log */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Blocked Items Audit Log
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Shows all items currently intercepted and prevented from rendering on any discovery feed.
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-red-600">{auditLog.length}</span>
              <span className="text-xs text-neutral-500"> live items intercepted</span>
            </div>
          </div>

          {auditLog.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 border rounded-2xl">
              No videos currently blocked by the active rules.
            </div>
          ) : (
            <div className="space-y-3">
              {auditLog.map(({ video, analysis }, idx) => (
                <div
                  key={video.id || idx}
                  className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-3 items-start justify-between shadow-sm"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                      {video.title}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                      {video.description}
                    </div>
                    <div className="pt-1 flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-medium">
                        Matched: &quot;{analysis.matchedKeyword || 'Rule'}&quot;
                      </span>
                      <span className="text-neutral-400">&bull;</span>
                      <span className="text-neutral-500 dark:text-neutral-400">
                        Category: {analysis.category}
                      </span>
                    </div>
                  </div>

                  <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-red-500/20 text-red-600 font-semibold">
                    BLOCKED
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Preferences & Storage */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Theme selector */}
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Interface Theme
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Currently using {preferences.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </div>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-semibold text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              {preferences.theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  <span>Switch to Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-500" />
                  <span>Switch to Dark</span>
                </>
              )}
            </button>
          </div>

          {/* Preferred Categories */}
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div>
              <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Preferred Content Recommendations
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                These categories receive priority ranking in your feed without overriding safety filters.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {allAvailableCategories.map(cat => {
                const checked = preferences.preferredCategories?.includes(cat);
                return (
                  <label
                    key={cat}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePreferredCategory(cat)}
                      className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                      {cat}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Watch History Controls */}
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Clear Local Watch History
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Removes all watched video traces from your browser storage.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                clearHistory();
                showNotification('Watch history cleared!');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-500/10 hover:bg-red-500/20 transition-colors"
            >
              Clear History
            </button>
          </div>

          {/* Export & Import Configuration */}
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div>
              <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Configuration Backup &amp; Transfer
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Export or import custom keywords, preferences, and rule definitions.
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportConfig}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export Configuration JSON</span>
              </button>

              <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Import Configuration JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportConfig}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* LocalStorage persistence notice */}
          <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/40 text-xs text-neutral-500 dark:text-neutral-400 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Persistence Notice:</strong> All preferences and custom keyword rules are saved directly in your browser&apos;s LocalStorage. If you clear your browser site data or cookies, saved preferences may be reset to default. You can use the Export button above to keep a backup.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
