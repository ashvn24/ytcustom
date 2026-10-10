import React, { useState, useEffect } from 'react';
import {
  Flame,
  ThumbsUp,
  Bookmark,
  Share2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { videoProvider } from '../services/videoProvider';
import { useApp } from '../context/AppContext';
import { usePreferences } from '../hooks/usePreferences';

export default function Shorts() {
  const { filterRules, preferences } = useApp();
  const { isLiked, toggleLike, isSaved, toggleSave } = usePreferences();
  const [safeShorts, setSafeShorts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [embedError, setEmbedError] = useState(null);

  const loadLiveShorts = async () => {
    setLoading(true);
    try {
      const live = await videoProvider.getLiveHomeVideos(filterRules, preferences, false);
      setSafeShorts(live.slice(0, 10));
    } catch (e) {
      setSafeShorts(videoProvider.getHomeVideos(filterRules, preferences).slice(0, 10));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveShorts();
  }, [filterRules]);

  const currentVideo = safeShorts[currentIndex];

  useEffect(() => {
    setEmbedError(null);
  }, [currentIndex]);

  // Catch embedded YouTube errors via postMessage
  useEffect(() => {
    const handleMessage = event => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (data && data.event === 'onError') {
          const code = Number(data.info);
          if (code === 101 || code === 150) {
            setEmbedError({
              type: 'OWNER_RESTRICTED',
              message: 'Embedding restricted by owner.',
            });
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentVideo?.youtubeId]);

  const handleNext = () => {
    if (currentIndex < safeShorts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs text-neutral-500 font-semibold">Pulling live YouTube Shorts...</span>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-lg font-bold">No Shorts available in current filter</h2>
      </div>
    );
  }

  const liked = isLiked(currentVideo.id);
  const saved = isSaved(currentVideo.id);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] max-w-md mx-auto py-2">
      {/* Short Card */}
      <div className="relative w-full aspect-[9/16] max-h-[720px] rounded-3xl overflow-hidden bg-black shadow-2xl border border-neutral-800 flex flex-col justify-between p-4 group">
        {/* Background / Video Player */}
        <iframe
          src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?autoplay=1&controls=1&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(
            window.location.origin
          )}`}
          title={currentVideo.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          className="absolute inset-0 w-full h-full border-0 pointer-events-auto"
        />

        {embedError && (
          <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Playback Restricted by Creator</h3>
            <p className="text-xs text-neutral-300">
              The owner of this Short has disabled external embedding.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-[220px] pt-2">
              {currentIndex < safeShorts.length - 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 rounded-full bg-red-600 text-white font-semibold text-xs shadow-lg"
                >
                  Play Next Short
                </button>
              )}
            </div>
          </div>
        )}

        {/* Top Bar with Shield Tag */}
        <div className="relative z-10 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-white text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>Live YouTube Short</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white text-[10px] font-medium">
            <ShieldCheck className="w-3 h-3 text-neutral-300" /> Filter Active
          </div>
        </div>

        {/* Right Floating Actions */}
        <div className="absolute right-3 bottom-20 z-10 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => toggleLike(currentVideo.id)}
            className={`w-11 h-11 rounded-full flex flex-col items-center justify-center transition-all ${
              liked
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-black/60 backdrop-blur text-white hover:bg-black/80'
            }`}
          >
            <ThumbsUp className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => toggleSave(currentVideo.id)}
            className={`w-11 h-11 rounded-full flex flex-col items-center justify-center transition-all ${
              saved
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-black/60 backdrop-blur text-white hover:bg-black/80'
            }`}
          >
            <Bookmark className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/watch/${currentVideo.id}`
              );
            }}
            className="w-11 h-11 rounded-full bg-black/60 backdrop-blur text-white hover:bg-black/80 flex items-center justify-center transition-colors"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Overlay Text */}
        <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent -mx-4 -mb-4 p-4 pt-10 text-white pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <img
              src={currentVideo.channelAvatar}
              alt={currentVideo.channel}
              className="w-8 h-8 rounded-full border border-white/40 object-cover"
            />
            <span className="font-semibold text-xs">{currentVideo.channel}</span>
            {currentVideo.isDevotional && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/20 backdrop-blur text-white font-medium">
                Devotional
              </span>
            )}
          </div>
          <h3 className="font-bold text-sm line-clamp-2 leading-snug">
            {currentVideo.title}
          </h3>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-4 mt-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-full bg-neutral-200 dark:bg-neutral-800 disabled:opacity-30 text-xs font-semibold transition-colors"
        >
          <ChevronUp className="w-4 h-4" />
          <span>Previous</span>
        </button>
        <span className="text-xs text-neutral-500">
          {currentIndex + 1} of {safeShorts.length}
        </span>
        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex === safeShorts.length - 1}
          className="flex items-center gap-1 px-4 py-2 rounded-full bg-neutral-200 dark:bg-neutral-800 disabled:opacity-30 text-xs font-semibold transition-colors"
        >
          <span>Next</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
