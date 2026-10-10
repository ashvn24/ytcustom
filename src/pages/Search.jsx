import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Grid, List } from 'lucide-react';
import VideoGrid from '../components/VideoGrid';
import { videoProvider } from '../services/videoProvider';
import { useApp } from '../context/AppContext';
import { analyzeVideo } from '../utils/contentFilter';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { filterRules } = useApp();

  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    async function executeSearch() {
      setLoading(true);

      // Check if query itself matches blocked rules
      const testDummy = { title: query };
      const queryAnalysis = analyzeVideo(testDummy, filterRules);

      if (queryAnalysis.blocked) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      // Execute search through provider (which strictly filters results before returning)
      const res = await videoProvider.searchVideos(query, filterRules);
      setSearchResults(res.videos || []);
      setLoading(false);
    }

    executeSearch();
  }, [query, filterRules]);

  return (
    <div className="space-y-6 pt-3 md:pt-4">
      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4 max-w-4xl">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 animate-pulse">
              <div className="w-full sm:w-64 aspect-video bg-neutral-200 dark:bg-neutral-800 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-4/5" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-2/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : searchResults.length === 0 ? (
        /* Standard YouTube 0 Search Results Found Page */
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-5">
            <SearchIcon className="w-10 h-10" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            No results found
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
            Try different keywords or remove search filters
          </p>
        </div>
      ) : (
        /* Results View */
        <div>
          {/* Search Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Results for &quot;{query}&quot;
            </h1>

            {/* Layout switcher */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <VideoGrid
            videos={searchResults}
            layout={viewMode}
            showDevotionalFallback={false}
          />
        </div>
      )}
    </div>
  );
}
