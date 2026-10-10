import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Heart, CheckCircle2, Play } from 'lucide-react';
import { usePreferences } from '../hooks/usePreferences';

export default function VideoCard({ video, layout = 'grid' }) {
  const { isSaved, toggleSave, isLiked, toggleLike } = usePreferences();

  if (!video) return null;

  const saved = isSaved(video.id);
  const liked = isLiked(video.id);

  // Compact horizontal list layout (for search results or related videos)
  if (layout === 'list') {
    return (
      <div className="group flex flex-col sm:flex-row gap-3 w-full p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-youtube-hover transition-colors">
        {/* Thumbnail container */}
        <Link
          to={`/watch/${video.id}`}
          className="relative aspect-video w-full sm:w-48 md:w-56 shrink-0 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800"
        >
          <img
            src={video.thumbnail}
            alt={video.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>
          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-black/80 text-white">
            {video.duration || '12:00'}
          </span>
        </Link>

        {/* Video info */}
        <div className="flex flex-col flex-1 justify-between py-1 min-w-0">
          <div>
            <Link to={`/watch/${video.id}`}>
              <h3 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-red-600 dark:group-hover:text-red-400 line-clamp-2 transition-colors">
                {video.title}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-medium hover:text-neutral-900 dark:hover:text-neutral-200 flex items-center gap-1">
                {video.channel}
                <CheckCircle2 className="w-3 h-3 text-neutral-400" />
              </span>
              <span>&bull;</span>
              <span>{video.views}</span>
              <span>&bull;</span>
              <span>{video.publishedAt}</span>
            </div>
            {video.description && (
              <p className="hidden sm:block text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
                {video.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                toggleSave(video);
              }}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                saved
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={saved ? 'Remove from Saved' : 'Save for later'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
              <span className="text-[11px]">{saved ? 'Saved' : 'Save'}</span>
            </button>
            <button
              type="button"
              onClick={e => {
                e.preventDefault();
                toggleLike(video);
              }}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                liked
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={liked ? 'Liked' : 'Like'}
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
              <span className="text-[11px]">{liked ? 'Liked' : 'Like'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Grid Layout
  return (
    <div className="group flex flex-col w-full rounded-2xl overflow-hidden hover:bg-neutral-100/70 dark:hover:bg-youtube-hover/60 p-2 -m-2 transition-all duration-200">
      {/* Thumbnail */}
      <Link
        to={`/watch/${video.id}`}
        className="relative aspect-video w-full rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-sm"
      >
        <img
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 fill-white ml-0.5" />
          </div>
        </div>
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-black/85 text-white tracking-wide">
          {video.duration || '12:00'}
        </span>
      </Link>

      {/* Details Row */}
      <div className="flex gap-3 mt-3 items-start">
        {/* Channel Avatar */}
        <Link to={`/watch/${video.id}`} className="shrink-0 mt-0.5">
          <img
            src={video.channelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={video.channel}
            className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
          />
        </Link>

        {/* Text information */}
        <div className="flex flex-col flex-1 min-w-0">
          <Link to={`/watch/${video.id}`}>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              {video.title}
            </h3>
          </Link>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
            <span className="truncate hover:text-neutral-900 dark:hover:text-neutral-200">
              {video.channel}
            </span>
            <CheckCircle2 className="w-3 h-3 text-neutral-400 shrink-0" />
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
            <span>{video.views}</span>
            <span>&bull;</span>
            <span>{video.publishedAt}</span>
          </div>
        </div>

        {/* Quick bookmark */}
        <button
          type="button"
          onClick={() => toggleSave(video)}
          className={`p-1.5 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors opacity-0 group-hover:opacity-100 ${
            saved ? 'text-blue-500 opacity-100' : 'text-neutral-400'
          }`}
          title={saved ? 'Remove from Saved' : 'Save for later'}
        >
          <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}
