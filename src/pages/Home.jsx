import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import CategoryChips from '../components/CategoryChips';
import VideoGrid from '../components/VideoGrid';
import { videoProvider } from '../services/videoProvider';
import { useApp } from '../context/AppContext';

export default function Home() {
  const { filterRules, preferences, blockedCount } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotification, setRefreshNotification] = useState(false);

  // Categories list for chips
  const categoriesList = [
    { name: 'All', isDevotional: false },
    { name: 'Shiva Devotional', isDevotional: true },
    { name: 'Health Benefits', isDevotional: false },
    { name: 'Cooking & Recipes', isDevotional: false },
    { name: 'Thyroid Care & Cure', isDevotional: false },
    { name: 'Menopause Guide', isDevotional: false },
    { name: 'Good Living Habits', isDevotional: false },
    { name: 'Krishna Bhajans', isDevotional: true },
    { name: 'Ayyappa Devotional', isDevotional: true },
    { name: 'Malayalam Devotional', isDevotional: true },
    { name: 'Hindu Devotional', isDevotional: true },
    { name: 'Sanskrit Mantras', isDevotional: true },
    { name: 'Temple Instrumental', isDevotional: true },
    { name: 'Nature & Wildlife', isDevotional: false },
    { name: 'Educational & Science', isDevotional: false },
  ];

  // Fetch live YouTube feed based on category with forceFresh = true
  const loadVideos = async (forceFresh = true) => {
    if (forceFresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      let liveList = [];
      if (selectedCategory === 'All') {
        liveList = await videoProvider.getLiveHomeVideos(filterRules, preferences, forceFresh);
      } else if (selectedCategory === 'Hindu Devotional') {
        liveList = await videoProvider.getLiveDevotionalVideos(filterRules, 'All', forceFresh);
      } else if (selectedCategory === 'Shiva Devotional') {
        liveList = await videoProvider.getLiveDevotionalVideos(filterRules, 'Shiva Devotional', forceFresh);
      } else {
        liveList = await videoProvider.getLiveCategoryVideos(selectedCategory, filterRules, forceFresh);
      }
      setVideos(liveList);
      if (forceFresh) {
        setRefreshNotification(true);
        setTimeout(() => setRefreshNotification(false), 2500);
      }
    } catch (e) {
      console.warn('Error fetching live YouTube stream, using cached/fallback feed', e);
      setVideos(videoProvider.getHomeVideos(filterRules, preferences));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Run on mount or when category/filter rules change
  useEffect(() => {
    loadVideos(true);
  }, [selectedCategory, filterRules, preferences]);

  const handleRefresh = () => {
    loadVideos(true);
  };

  // Top featured devotional track for spotlight banner
  const featuredDevotional = videos.find(v => v.isDevotional) || null;

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Category Chips Bar */}
      <div className="sticky top-14 md:top-16 z-20 bg-white/95 dark:bg-youtube-dark/95 backdrop-blur -mx-3 md:-mx-6 px-3 md:px-6 py-1 border-b border-neutral-100 dark:border-neutral-800">
        <CategoryChips
          categories={categoriesList}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Main Video Section Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {selectedCategory === 'All' ? 'Recommended' : `${selectedCategory}`}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400">
              {videos.length} videos &bull; {blockedCount} filtered
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors shadow-sm"
              title="Pull fresh dynamic feed from YouTube"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-500' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
            </button>
          </div>
        </div>

        {/* Refresh Toast Notification */}
        {refreshNotification && (
          <div className="mb-4 p-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs flex items-center gap-2 animate-fadeIn shadow-md">
            <CheckCircle2 className="w-4 h-4 text-white dark:text-neutral-900 shrink-0" />
            <span>Refreshed! Fresh live YouTube recommendations fetched.</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-video bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
                <div className="flex gap-3">
                  <div className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <VideoGrid
            videos={videos}
            layout="grid"
            emptyTitle={`No safe videos found in ${selectedCategory}`}
            emptyDescription="All matched items were filtered by active guardrails or no items were returned."
          />
        )}
      </div>
    </div>
  );
}
