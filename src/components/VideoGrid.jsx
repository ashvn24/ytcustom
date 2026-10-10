import React from 'react';
import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';
import VideoCard from './VideoCard';

export default function VideoGrid({
  videos = [],
  layout = 'grid',
  emptyTitle = 'No videos found',
  emptyDescription = 'Try adjusting your search query or check our devotional recommendations.',
  showDevotionalFallback = true,
}) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 text-neutral-400">
          <Film className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          {emptyTitle}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
          {emptyDescription}
        </p>

        {showDevotionalFallback && (
          <Link
            to="/devotional"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 font-medium text-xs md:text-sm transition-all shadow-sm"
          >
            <span>Explore Devotional Music</span>
          </Link>
        )}
      </div>
    );
  }

  if (layout === 'list') {
    return (
      <div className="flex flex-col gap-3 w-full">
        {videos.map(video => (
          <VideoCard key={video.id} video={video} layout="list" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-7 w-full">
      {videos.map(video => (
        <VideoCard key={video.id} video={video} layout="grid" />
      ))}
    </div>
  );
}
