import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Music, RefreshCw, Search } from 'lucide-react';
import VideoGrid from '../components/VideoGrid';
import { videoProvider } from '../services/videoProvider';
import { useApp } from '../context/AppContext';

export default function Devotional() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filterRules } = useApp();
  const activeParamCat = searchParams.get('cat') || 'All';
  const [selectedSubCat, setSelectedSubCat] = useState(activeParamCat);
  const [searchFilter, setSearchFilter] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const devotionalCategories = [
    { id: 'All', name: 'All Devotional' },
    { id: 'Krishna Bhajans', name: 'Krishna Bhajans' },
    { id: 'Shiva Devotional', name: 'Shiva Devotional' },
    { id: 'Ayyappa Devotional', name: 'Ayyappa Devotional' },
    { id: 'Devi & Durga Stutis', name: 'Devi & Durga Stutis' },
    { id: 'Malayalam Devotional', name: 'Malayalam Devotional' },
    { id: 'Hanuman Chalisa', name: 'Hanuman Chalisa' },
    { id: 'Sanskrit Mantras', name: 'Sanskrit Mantras' },
    { id: 'Temple Instrumental', name: 'Temple Instrumental' },
    { id: 'Vishnu & Rama Bhajans', name: 'Vishnu & Rama' },
    { id: 'Ganesha Devotional', name: 'Ganesha Devotional' },
  ];

  const handleSelectCategory = catId => {
    setSelectedSubCat(catId);
    if (catId === 'All') {
      searchParams.delete('cat');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ cat: catId });
    }
  };

  // Fetch live YouTube devotional stream
  const loadDevotionalFeed = async (forceFresh = false) => {
    if (forceFresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const liveList = await videoProvider.getLiveDevotionalVideos(
        filterRules,
        selectedSubCat,
        forceFresh
      );
      setVideos(liveList);
    } catch (e) {
      console.warn('Error fetching live devotional stream', e);
      setVideos(videoProvider.getDevotionalVideos(filterRules, selectedSubCat));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDevotionalFeed(false);
  }, [selectedSubCat, filterRules]);

  // Client search filter within loaded tracks
  const displayedVideos = searchFilter.trim()
    ? videos.filter(v => {
        const q = searchFilter.toLowerCase();
        return (
          v.title.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q) ||
          (v.tags && v.tags.some(t => t.toLowerCase().includes(q)))
        );
      })
    : videos;

  return (
    <div className="space-y-6 pt-3 md:pt-4">
      {/* Devotional Header (YouTube Topic style) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 shrink-0">
            <Music className="w-7 h-7 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Devotional
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Filtered bhajans, Vedic mantras, and sacred chants &bull; {displayedVideos.length} videos
            </p>
          </div>
        </div>

        {/* Search within devotional */}
        <div className="w-full md:w-72">
          <div className="relative">
            <input
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Search devotional songs..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-red-500"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Subcategory Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {devotionalCategories.map(cat => {
          const isSelected = selectedSubCat === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm font-semibold'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Feed section and refresh button */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base md:text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {selectedSubCat === 'All' ? 'Devotional Videos' : selectedSubCat}
          </h2>

          <button
            type="button"
            onClick={() => loadDevotionalFeed(true)}
            disabled={isRefreshing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-500' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>
        </div>

        {/* Loading skeleton or video grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="aspect-video bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-4/5" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-2/5" />
              </div>
            ))}
          </div>
        ) : (
          <VideoGrid
            videos={displayedVideos}
            layout="grid"
            emptyTitle="No devotional tracks matched your query"
            emptyDescription="Try selecting another category above or refreshing the live stream."
            showDevotionalFallback={false}
          />
        )}
      </div>
    </div>
  );
}
