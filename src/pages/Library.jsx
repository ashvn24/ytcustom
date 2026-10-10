import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bookmark, History, Heart, Trash2, ShieldCheck } from 'lucide-react';
import VideoGrid from '../components/VideoGrid';
import { useApp } from '../context/AppContext';
import { filterVideos } from '../utils/contentFilter';

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'saved';
  const [activeTab, setActiveTab] = useState(activeTabParam);

  const {
    filterRules,
    watchHistory,
    clearHistory,
    savedVideos,
    likedVideos,
  } = useApp();

  const handleTabChange = tab => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Safe Watch History (strictly filtered before display)
  const safeHistory = useMemo(() => {
    return filterVideos(watchHistory, filterRules);
  }, [watchHistory, filterRules]);

  // Safe Saved Live Videos (strictly filtered before display)
  const safeSaved = useMemo(() => {
    return filterVideos(savedVideos, filterRules);
  }, [savedVideos, filterRules]);

  // Safe Liked Live Videos (strictly filtered before display)
  const safeLiked = useMemo(() => {
    return filterVideos(likedVideos, filterRules);
  }, [likedVideos, filterRules]);

  return (
    <div className="space-y-6 pt-3 md:pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Personal Library
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>Saved videos and history are strictly pre-filtered by your safety policies.</span>
          </p>
        </div>

        {/* Clear History button if on history tab */}
        {activeTab === 'history' && safeHistory.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-red-600 bg-red-500/10 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Watch History</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <button
          type="button"
          onClick={() => handleTabChange('saved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'saved'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Videos ({safeSaved.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'history'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Watch History ({safeHistory.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('liked')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-colors ${
            activeTab === 'liked'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Liked Videos ({safeLiked.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'saved' && (
          <VideoGrid
            videos={safeSaved}
            emptyTitle="No saved live videos yet"
            emptyDescription="Click the bookmark icon on any live video to save it for quick access here."
          />
        )}

        {activeTab === 'history' && (
          <VideoGrid
            videos={safeHistory}
            emptyTitle="Your watch history is clear"
            emptyDescription="Live videos you watch will show up here. You can clear history anytime."
          />
        )}

        {activeTab === 'liked' && (
          <VideoGrid
            videos={safeLiked}
            emptyTitle="No liked videos yet"
            emptyDescription="Show appreciation for sacred chants and informative videos by liking them."
          />
        )}
      </div>
    </div>
  );
}
