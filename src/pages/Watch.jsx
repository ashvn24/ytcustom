import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ThumbsUp,
  Share2,
  Bookmark,
  Music,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  AlertOctagon,
  AlertTriangle,
  Play,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import VideoCard from '../components/VideoCard';
import { videoProvider } from '../services/videoProvider';
import { useApp } from '../context/AppContext';
import { usePreferences } from '../hooks/usePreferences';

export default function Watch() {
  const { id } = useParams();
  const { filterRules } = useApp();
  const {
    isLiked,
    toggleLike,
    isSaved,
    toggleSave,
    recordWatch,
  } = usePreferences();

  const [currentVideo, setCurrentVideo] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [blockAnalysis, setBlockAnalysis] = useState(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [shareToast, setShareToast] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [embedError, setEmbedError] = useState(null);
  const [useMirrorPlayer, setUseMirrorPlayer] = useState(false);

  // Fetch video asynchronously
  useEffect(() => {
    let isMounted = true;
    async function loadVideoData() {
      setLoadError(null);
      setBlockAnalysis(null);
      setCurrentVideo(null);
      setEmbedError(null);
      setUseMirrorPlayer(false);

      const res = await videoProvider.getVideoByIdAsync(id, filterRules);
      if (!isMounted) return;

      if (res.error === 'BLOCKED') {
        setLoadError('BLOCKED');
        setBlockAnalysis(res.analysis);
      } else if (res.error === 'NOT_FOUND' || !res.video) {
        setLoadError('NOT_FOUND');
      } else {
        setCurrentVideo(res.video);
        if (res.video.isEmbedRestricted) {
          setEmbedError({
            type: 'OWNER_RESTRICTED',
            message: 'Playback on external websites has been disabled by the video owner.',
          });
        }
        recordWatch(res.video);
        window.scrollTo(0, 0);

        // Load live related videos from YouTube
        videoProvider.getRelatedVideosAsync(res.video, filterRules).then(rel => {
          if (isMounted) setRelatedVideos(rel);
        });

        // Load live comments from YouTube Data API v3 (filtered with guardrails)
        setLoadingComments(true);
        videoProvider.getLiveComments(res.video.youtubeId, filterRules).then(liveComms => {
          if (!isMounted) return;
          if (liveComms && liveComms.length > 0) {
            setComments(liveComms);
          } else {
            // Default fallback safe comments if YouTube comments are disabled or empty
            setComments([
              {
                id: 'c1',
                author: 'Aaditya Sharma',
                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
                publishedAt: '2 days ago',
                text: 'Such immense peace listening to this sacred chant. Truly elevates the spirit!',
                likes: 42,
              },
              {
                id: 'c2',
                author: 'Lakshmi Nair',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
                publishedAt: '1 week ago',
                text: 'Wonderful pronunciation and divine melody. Thank you for this clean platform!',
                likes: 19,
              },
            ]);
          }
          setLoadingComments(false);
        });
      }
    }

    loadVideoData();
    return () => {
      isMounted = false;
    };
  }, [id, filterRules]);

  // Catch embedded YouTube player errors posted by the iframe
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
              code,
              message: 'Playback on other websites has been disabled by the video owner.',
            });
          } else if (code === 100) {
            setEmbedError({
              type: 'NOT_FOUND',
              code,
              message: 'This video is unavailable or removed.',
            });
          } else if (code === 2 || code === 5) {
            setEmbedError({
              type: 'PLAYER_ERROR',
              code,
              message: 'Embedded player error.',
            });
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentVideo?.youtubeId]);

  // Handle Share link copy
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  // Add comment
  const handleAddComment = e => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: 'You',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      publishedAt: 'Just now',
      text: commentText.trim(),
      likes: 0,
    };
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  // Blocked Interception
  if (loadError === 'BLOCKED') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="p-8 rounded-3xl bg-red-50 dark:bg-red-950/40 border-2 border-red-500/40 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Video unavailable
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            This video is not available due to active safety filters.
          </p>

          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-red-200 dark:border-red-800 text-left text-xs space-y-2">
            <div className="font-semibold text-neutral-800 dark:text-neutral-200">
              Guardrail Trigger Details:
            </div>
            <div className="text-neutral-600 dark:text-neutral-400">
              &bull; <strong>Reason:</strong> {blockAnalysis?.reason || 'Restricted category match'}
            </div>
            <div className="text-neutral-600 dark:text-neutral-400">
              &bull; <strong>Matched Term:</strong> &quot;{blockAnalysis?.matchedKeyword || 'Rule'}&quot;
            </div>
            <div className="text-neutral-600 dark:text-neutral-400">
              &bull; <strong>Category:</strong> {blockAnalysis?.category}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-4">
            <Link
              to="/"
              className="px-5 py-2.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-semibold hover:opacity-90"
            >
              Return to Safe Feed
            </Link>
            <Link
              to="/settings"
              className="px-5 py-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-semibold hover:bg-neutral-300 dark:hover:bg-neutral-700"
            >
              Review Guardrail Rules
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (loadError === 'NOT_FOUND' || (!currentVideo && !loadError)) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Video Not Available</h2>
        <p className="text-sm text-neutral-500">
          The requested video could not be loaded or was restricted.
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-full bg-red-600 text-white font-semibold text-sm"
        >
          Back to Safe Home Feed
        </Link>
      </div>
    );
  }

  const liked = isLiked(currentVideo.id);
  const saved = isSaved(currentVideo.id);

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto pt-2 md:pt-4">
      {/* Left Column: Player & Metadata */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Responsive Video Player */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl">
          {useMirrorPlayer ? (
            <div className="relative w-full h-full">
              <div className="absolute top-2 left-2 z-20 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-600/90 text-white text-[10px] font-bold backdrop-blur shadow">
                  Mirror Stream
                </span>
                <button
                  type="button"
                  onClick={() => setUseMirrorPlayer(false)}
                  className="px-2.5 py-1 rounded-full bg-black/80 hover:bg-black text-white text-[10px] font-semibold backdrop-blur transition border border-neutral-700"
                >
                  Switch to Standard Player
                </button>
              </div>
              <iframe
                src={`https://yewtu.be/embed/${currentVideo.youtubeId}?autoplay=1`}
                title={currentVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <>
              <iframe
                src={`https://www.youtube.com/embed/${currentVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(
                  window.location.origin
                )}`}
                title={currentVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />

              {embedError && (
                <div className="absolute inset-0 bg-neutral-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center z-10 space-y-3.5">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center ring-4 ring-red-500/10">
                    <AlertTriangle className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h3 className="text-sm md:text-base font-bold text-white">
                      Playback Restricted by Video Owner
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed px-2">
                      The creator <span className="text-white font-medium">({currentVideo.channel})</span> has disabled external embedded streaming for this track.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setUseMirrorPlayer(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-lg"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Play with Alternative Mirror</span>
                    </button>
                    {relatedVideos.length > 0 && (
                      <Link
                        to={`/watch/${relatedVideos[0].id || relatedVideos[0].youtubeId}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition border border-neutral-700"
                      >
                        <span>Play Next Safe Video</span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Player utility status row */}
        <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1 -mt-2">
          <span>YouTube ID: {currentVideo.youtubeId}</span>
          <button
            type="button"
            onClick={() =>
              setEmbedError(prev =>
                prev ? null : { type: 'MANUAL', message: 'Playback restricted' }
              )
            }
            className="hover:underline text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
          >
            {embedError ? 'Dismiss Notice' : 'Video not playing?'}
          </button>
        </div>

        {/* Title */}
        <div className="space-y-2">
          {currentVideo.isDevotional && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-semibold">
              <Music className="w-3.5 h-3.5 text-neutral-500" />
              <span>{currentVideo.subCategory || 'Devotional'}</span>
            </div>
          )}
          <h1 className="text-lg md:text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
            {currentVideo.title}
          </h1>
        </div>

        {/* Channel Row & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <img
              src={currentVideo.channelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={currentVideo.channel}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover border border-neutral-300 dark:border-neutral-700"
            />
            <div>
              <div className="flex items-center gap-1 font-bold text-sm md:text-base text-neutral-900 dark:text-neutral-100">
                <span>{currentVideo.channel}</span>
                <CheckCircle2 className="w-4 h-4 text-neutral-400" />
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                YouTube Creator
              </span>
            </div>
            <button
              type="button"
              className="ml-3 px-4 py-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs hover:opacity-90 transition-opacity"
            >
              Subscribe
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleLike(currentVideo)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                liked
                  ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span>{liked ? 'Liked' : 'Like'}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSave(currentVideo)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                saved
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
              <span>{saved ? 'Saved' : 'Save'}</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              {shareToast && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-neutral-900 text-white text-xs whitespace-nowrap shadow-lg">
                  Link copied!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description Box */}
        <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-xs md:text-sm">
          <div className="flex items-center gap-2 font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            <span>{currentVideo.views}</span>
            <span>&bull;</span>
            <span>{currentVideo.publishedAt}</span>
            {currentVideo.category && (
              <>
                <span>&bull;</span>
                <span className="text-red-600 dark:text-red-400">{currentVideo.category}</span>
              </>
            )}
          </div>

          <p
            className={`text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line ${
              !descriptionExpanded ? 'line-clamp-3' : ''
            }`}
          >
            {currentVideo.description}
          </p>

          <button
            type="button"
            onClick={() => setDescriptionExpanded(!descriptionExpanded)}
            className="mt-2 font-semibold text-neutral-900 dark:text-white flex items-center gap-1 hover:underline text-xs"
          >
            {descriptionExpanded ? (
              <>
                Show less <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Show more <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Live Comments Section */}
        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-base md:text-lg">
              <MessageSquare className="w-5 h-5" />
              <span>{comments.length} Comments</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Comments Filtered</span>
            </div>
          </div>

          {/* Add comment */}
          <form onSubmit={handleAddComment} className="flex gap-3 items-start">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
              alt="You"
              className="w-9 h-9 rounded-full object-cover"
            />
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a family-friendly comment..."
                className="w-full pb-1 text-sm bg-transparent border-b border-neutral-300 dark:border-neutral-700 focus:outline-none focus:border-red-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-4 py-1.5 rounded-full bg-red-600 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1"
                >
                  <span>Comment</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          {loadingComments ? (
            <div className="space-y-3 animate-pulse pt-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4" />
                    <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3 text-xs md:text-sm">
                  <img
                    src={c.avatar}
                    alt={c.author}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {c.author}
                      </span>
                      <span className="text-[11px] text-neutral-500">{c.publishedAt}</span>
                    </div>
                    <p
                      className="text-neutral-700 dark:text-neutral-300 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: c.text }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Filtered Related Videos */}
      <div className="lg:w-80 xl:w-96 shrink-0 space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <span>Related Recommendations</span>
          </h3>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Guardrail Active
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {relatedVideos.map(rel => (
            <VideoCard key={rel.id} video={rel} layout="list" />
          ))}
        </div>
      </div>
    </div>
  );
}
