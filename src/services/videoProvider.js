import { filterVideos, analyzeVideo } from '../utils/contentFilter';
import { getStoredApiKey, addBlockedAuditEntry } from '../utils/storage';

// High-health public Invidious mirror endpoints for secondary fallback
const INVIDIOUS_ENDPOINTS = [
  'https://invidious.f5.si',
  'https://inv.nadeko.net',
  'https://yewtu.be',
  'https://vid.puffyan.us',
  'https://inv.tux.pizza',
];

/**
 * Format ISO 8601 duration (e.g. PT4M42S -> 4:42, PT1H12M5S -> 1:12:05)
 */
function parseISODuration(d) {
  if (!d) return 'Live';
  const match = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 'Stream';
  const h = parseInt(match[1] || 0, 10);
  const m = parseInt(match[2] || 0, 10);
  const s = parseInt(match[3] || 0, 10);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Format view count numbers to readable string
 */
function formatViews(n) {
  if (!n || isNaN(n)) return 'Live Stream';
  const num = typeof n === 'string' ? parseInt(n, 10) : n;
  if (isNaN(num)) return 'Live Stream';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K views`;
  return `${num} views`;
}

/**
 * Randomize array order
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Filters a collection of live YouTube videos and records any blocked items to audit log
 */
function filterAndAuditLiveVideos(videos, filterConfig) {
  if (!Array.isArray(videos)) return [];
  const safe = [];
  for (const video of videos) {
    const analysis = analyzeVideo(video, filterConfig);
    if (analysis.blocked) {
      addBlockedAuditEntry(video, analysis);
    } else {
      safe.push(video);
    }
  }
  return safe;
}

/**
 * Normalizes an item returned from official YouTube Data API v3
 */
function normalizeYouTubeApiItem(item, details = null, defaultCategory = 'YouTube Feed', isDevotional = false) {
  const snippet = item.snippet || {};
  const videoId = typeof item.id === 'object' ? item.id.videoId : item.id;
  const duration = details?.contentDetails?.duration ? parseISODuration(details.contentDetails.duration) : 'Online';
  const views = details?.statistics?.viewCount ? formatViews(details.statistics.viewCount) : 'YouTube Stream';
  const isEmbedRestricted = details?.status?.embeddable === false;

  return {
    id: `yt-${videoId}`,
    title: snippet.title || 'Untitled Video',
    description: snippet.description || '',
    channel: snippet.channelTitle || 'YouTube Creator',
    channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    thumbnail:
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    youtubeId: videoId,
    duration,
    views,
    publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt).toLocaleDateString() : 'Recent',
    category: defaultCategory,
    subCategory: defaultCategory,
    tags: snippet.tags || [],
    isDevotional: isDevotional || defaultCategory.toLowerCase().includes('devotional'),
    isLiveFeed: true,
    isEmbedRestricted,
  };
}

/**
 * Fetches videos directly from official YouTube Data API v3 and enriches with duration & views.
 * Strictly filters out videos where embedding on external sites has been disabled by the owner.
 */
async function fetchYouTubeDataApi(query, maxResults = 12, defaultCategory = 'YouTube', isDevotional = false) {
  const apiKey = getStoredApiKey();
  if (!apiKey) return null;

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(
      query
    )}&type=video&videoEmbeddable=true&key=${apiKey}`;

    const res = await fetch(searchUrl);
    if (!res.ok) {
      console.warn('YouTube Data API Search response error:', res.status);
      return null;
    }

    const data = await res.json();
    const items = data.items || [];
    if (items.length === 0) return [];

    const videoIds = items.map(it => (typeof it.id === 'object' ? it.id.videoId : it.id)).filter(Boolean);

    let detailsMap = {};
    if (videoIds.length > 0) {
      try {
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,status&id=${videoIds.join(
          ','
        )}&key=${apiKey}`;
        const detailsRes = await fetch(detailsUrl);
        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          for (const d of detailsData.items || []) {
            detailsMap[d.id] = d;
          }
        }
      } catch (err) {}
    }

    return items
      .filter(item => {
        const vid = typeof item.id === 'object' ? item.id.videoId : item.id;
        const details = detailsMap[vid];
        // Strictly filter out any video where the owner disabled external website playback!
        if (details?.status?.embeddable === false) {
          return false;
        }
        return true;
      })
      .map(item => {
        const vid = typeof item.id === 'object' ? item.id.videoId : item.id;
        return normalizeYouTubeApiItem(item, detailsMap[vid], defaultCategory, isDevotional);
      });
  } catch (err) {
    console.warn('YouTube Data API fetch exception:', err);
    return null;
  }
}

/**
 * Secondary fallback: Invidious public mirror
 */
async function fetchFromInvidious(query, defaultCategory = 'General', isDevotional = false) {
  for (const endpoint of INVIDIOUS_ENDPOINTS) {
    try {
      const url = `${endpoint}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map(item => {
            const videoId = item.videoId || item.id;
            return {
              id: `yt-${videoId}`,
              title: item.title || 'Untitled Video',
              description: item.description || '',
              channel: item.author || 'YouTube Channel',
              channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
              thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              youtubeId: videoId,
              duration: item.lengthSeconds ? `${Math.floor(item.lengthSeconds / 60)}:${String(item.lengthSeconds % 60).padStart(2, '0')}` : 'Online',
              views: formatViews(item.viewCount),
              publishedAt: item.publishedText || 'Recently added',
              category: defaultCategory,
              subCategory: defaultCategory,
              tags: item.keywords || [],
              isDevotional: isDevotional || defaultCategory.toLowerCase().includes('devotional'),
              isLiveFeed: true,
            };
          });
        }
      }
    } catch (e) {}
  }
  return null;
}

// In-memory cache for fast back/forward navigation
const liveCache = new Map();

/**
 * Rich rotational topic pools for dynamic live YouTube recommendations
 */
const DEVOTIONAL_ROTATION_POOL = [
  'Krishna bhajans soulful flute divine',
  'Shiva tandava stotram har har shambhu om namah shivaya',
  'Ayyappa devotional songs harivarasanam swamiye saranam',
  'Mahishasura mardini stotram devi durga stuti',
  'Hanuman chalisa powerful sacred sankatmochan chant',
  'Maha mrityunjaya mantra 108 times sacred chanting meditation',
  'Guruvayurappa Krishna songs Malayalam devotional',
  'South Indian temple nadaswaram thavil auspicious raga',
  'Ganesha pancharatnam stotra vinayaka',
  'Vishnu sahasranamam stotra MS Subbulakshmi',
  'Venkateswara suprabhatam sacred dawn prayer',
  'Achyutam keshavam radhe radhe krishna kirtan',
  'Lalitha sahasranamam devi stuti sacred',
  'Kani kaanum neram Guruvayur unnikrishnan devotional',
  'Carnatic classical instrumental veena flute',
];

const CATEGORY_ROTATION_POOLS = {
  'Hindu Devotional': DEVOTIONAL_ROTATION_POOL,
  'Krishna Bhajans': [
    'Krishna bhajans soulful flute divine melody',
    'Achyutam keshavam radhe radhe krishna bhajan',
    'Shri krishna govind hare murari peaceful bhajan',
    'Hare krishna kirtan meditation flute',
  ],
  'Shiva Devotional': [
    'Shiva tandava stotram sacred chants Har Har Shambhu',
    'Maha mrityunjaya mantra 108 times sacred chanting meditation T-Series',
    'Shiv kailasho ke vasi Anuradha Paudwal shiv bhajan',
    'Om namah shivaya peaceful meditation chants Lord Shiva',
    'Shiva stuti stotram bilwashtakam lingashtakam sacred chants',
    'Namo namo shankara Kedarnath Shiva devotional song Amit Trivedi',
    'Shiva tandava stotram Agam Aggarwal divine Mahadev chant',
    'Shiv aarti karpura gauram karunavataram divine bhajan',
    'Bolo har har har Shiva devotional track powerful',
    'Shiv amritwani Anuradha Paudwal complete sacred bhajan',
    'Shiv tandav stotram with lyrics Sanskrit Mahadev stuti',
    'Rameshwaram Kashi Kedarnath sacred Shiva temple chants',
  ],
  'Ayyappa Devotional': [
    'Swamiye saranam ayyappa harivarasanam songs',
    'Pallikkettu sabarimalaikku veeramani ayyappa',
    'Malayalam ayyappa devotional songs Yesudas',
    'Sabarimala sannidhanam temple chants',
  ],
  'Devi & Durga Stutis': [
    'Mahishasura mardini stotram divine shakti',
    'Lalitha sahasranamam stotram devi chant',
    'Aigiri nandini durga stuti powerful',
    'Devi stotram sacred feminine peace',
  ],
  'Malayalam Devotional': [
    'Malayalam hindu devotional songs K J Yesudas',
    'Guruvayurappa krishna devotional songs Malayalam',
    'Kani kaanum neram Guruvayur unnikrishnan',
    'Sabarimala ayyappa devotional songs Malayalam',
  ],
  'Hanuman Chalisa': [
    'Hanuman chalisa sacred recitation 108',
    'Bajrang baan sankatmochan hanuman ashtak',
    'Powerful hanuman chalisa meditative peace',
  ],
  'Sanskrit Mantras': [
    'Sanskrit mantras stotras vedic 108 chanting',
    'Gayatri mantra 108 times peaceful meditation',
    'Maha mrityunjaya mantra authentic pronunciation',
    'Surya mantra 108 vedic dawn chants',
  ],
  'Temple Instrumental': [
    'South indian temple nadaswaram thavil mangala vadhyam',
    'Carnatic classical instrumental veena flute',
    'Kerala temple chenda melam panchavadyam rhythm',
    'Divine bansuri flute temple meditation',
  ],
  'Educational & Science': [
    'James webb space telescope cosmic discoveries astrophysics',
    'Quantum physics cosmos universe documentary',
    'Deep space galaxies origins science exploration',
    'Neurobiology human brain cognition science',
  ],
  'Programming & Technology': [
    'Modern web development React 19 architecture 2026',
    'TypeScript advanced design software engineering',
    'Cloud computing system design architecture',
    'Next generation frontend tools development',
  ],
  'AI & Machine Learning': [
    'Artificial intelligence transformer deep learning llm',
    'Neural networks machine learning architecture guide',
    'Generative AI multimodal models computer vision',
  ],
  'Nature & Wildlife': [
    'Western ghats rainforest 4k wildlife nature documentary',
    'Himalayas untamed mountain ecosystem wildlife 4k',
    'Silent valley Kerala rainforest biodiversity',
    'Ocean marine life coral reefs 4k documentary',
  ],
  'Cooking & Recipes': [
    'healthy Indian cooking recipes authentic wholesome dinner',
    'easy healthy cooking lunch dinner recipes tutorial',
    'traditional Kerala sadya cooking vegetarian dishes',
    'quick nutritious meal prep healthy food recipes',
    'village cooking traditional Indian recipes wholesome food',
    'South Indian breakfast recipes healthy cooking',
  ],
  'Cooking & Food': [
    'healthy Indian cooking recipes authentic wholesome dinner',
    'traditional Kerala sadya cooking vegetarian dishes',
    'quick nutritious meal prep healthy food recipes',
  ],
  'Health Benefits': [
    'health benefits superfoods nutrition daily science backed doctor',
    '10 amazing health benefits of morning warm water lemon honey doctor',
    'amazing health benefits amla turmeric ginger moringa nutrition',
    'health benefits of daily walking 30 minutes longevity doctor',
    'gut health microbiome best foods for digestion doctor advice',
    'scientifically proven health benefits longevity diet nutrition',
    'powerful health benefits of daily yoga pranayama deep breathing',
    'evidence based nutrition health benefits daily routine doctor',
    'health benefits of pumpkin seeds walnuts almonds omega 3',
    'top foods for liver detox natural health benefits doctor guide',
    'health benefits of intermittent fasting autophagy cellular repair',
    'daily superfoods to boost immunity and energy naturally doctor',
  ],
  'Thyroid Care & Cure': [
    'what is thyroid symptoms hypothyroidism hyperthyroidism causes',
    'how to cure thyroid naturally diet yoga home remedies',
    'foods to eat and avoid for thyroid health nutrition doctor',
    'hypothyroidism reversal natural home remedies lifestyle diet',
    'yoga asanas for thyroid gland healing and exercises',
  ],
  'Thyroid Care': [
    'what is thyroid symptoms hypothyroidism causes doctor guide',
    'how to cure thyroid naturally diet yoga home remedies',
    'foods to eat and avoid for thyroid health nutrition',
  ],
  'Menopause Guide': [
    'what is menopause perimenopause symptoms causes explanation doctor',
    'how to manage menopause naturally hot flashes hormone balance',
    'perimenopause stages signs symptoms women health doctor advice',
    'menopause relief diet nutrition exercise lifestyle tips',
    'everything you need to know about menopause women health',
  ],
  'Good Living Habits': [
    'good living habits for healthy life longevity daily routine',
    'daily healthy living habits morning routine lifestyle doctor',
    'healthy living habits sleep nutrition stress relief longevity',
    'small daily habits that will change your health lifestyle',
    'science of healthy living habits circadian rhythm longevity doctor',
  ],
  'Healthy Habits': [
    'good living habits for healthy life longevity daily routine',
    'daily healthy habits morning routine for mind and body',
  ],
  'Productivity & Habits': [
    'Deep work sustained focus habits neurobiology',
    'Atomic habits daily routine discipline productivity',
    'Flow state concentration technique masterclass',
  ],
};

export const videoProvider = {
  /**
   * Fetches 100% Live Home Feed from YouTube using YouTube Data API v3.
   * Curates a rich balanced mix of cooking, health benefits, thyroid care,
   * menopause guides, good living habits, and sacred devotional chants.
   */
  async getLiveHomeVideos(filterConfig, preferences, forceFresh = true) {
    const cacheKey = `home_${preferences?.preferredCategories?.join('_') || 'default'}`;

    if (!forceFresh && liveCache.has(cacheKey)) {
      const cached = liveCache.get(cacheKey);
      return filterAndAuditLiveVideos(cached, filterConfig);
    }

    let liveItems = [];

    // 1. Cooking & Recipes query
    const cookingPool = CATEGORY_ROTATION_POOLS['Cooking & Recipes'];
    const cookingQuery = cookingPool[Math.floor(Math.random() * cookingPool.length)];

    // 2. Health Benefits & Nutrition query (High priority)
    const healthPool = CATEGORY_ROTATION_POOLS['Health Benefits'];
    const healthQuery = healthPool[Math.floor(Math.random() * healthPool.length)];

    // 3. Lord Shiva Devotional query (High priority)
    const shivaPool = CATEGORY_ROTATION_POOLS['Shiva Devotional'];
    const shivaQuery = shivaPool[Math.floor(Math.random() * shivaPool.length)];

    // 4. Thyroid Care & Cure query
    const thyroidPool = CATEGORY_ROTATION_POOLS['Thyroid Care & Cure'];
    const thyroidQuery = thyroidPool[Math.floor(Math.random() * thyroidPool.length)];

    // 5. Menopause Guide query
    const menopausePool = CATEGORY_ROTATION_POOLS['Menopause Guide'];
    const menopauseQuery = menopausePool[Math.floor(Math.random() * menopausePool.length)];

    // 6. Good Living Habits query
    const habitsPool = CATEGORY_ROTATION_POOLS['Good Living Habits'];
    const habitsQuery = habitsPool[Math.floor(Math.random() * habitsPool.length)];

    // 7. General Sacred Hindu Devotional query
    const devQuery = DEVOTIONAL_ROTATION_POOL[Math.floor(Math.random() * DEVOTIONAL_ROTATION_POOL.length)];

    try {
      const [cookingRes, healthRes, shivaRes, thyroidRes, menopauseRes, habitsRes, devRes] = await Promise.all([
        fetchYouTubeDataApi(cookingQuery, 4, 'Cooking & Recipes', false),
        fetchYouTubeDataApi(healthQuery, 5, 'Health Benefits', false),
        fetchYouTubeDataApi(shivaQuery, 5, 'Shiva Devotional', true),
        fetchYouTubeDataApi(thyroidQuery, 3, 'Thyroid Care & Cure', false),
        fetchYouTubeDataApi(menopauseQuery, 3, 'Menopause Guide', false),
        fetchYouTubeDataApi(habitsQuery, 3, 'Good Living Habits', false),
        fetchYouTubeDataApi(devQuery, 3, 'Hindu Devotional', true),
      ]);

      if (cookingRes?.length) liveItems.push(...cookingRes);
      if (healthRes?.length) liveItems.push(...healthRes);
      if (shivaRes?.length) liveItems.push(...shivaRes);
      if (thyroidRes?.length) liveItems.push(...thyroidRes);
      if (menopauseRes?.length) liveItems.push(...menopauseRes);
      if (habitsRes?.length) liveItems.push(...habitsRes);
      if (devRes?.length) liveItems.push(...devRes);
    } catch (e) {
      console.warn('Error fetching live home sections:', e);
    }

    // Secondary fallback to public mirror if API quota exceeded or empty
    if (liveItems.length === 0) {
      const fallbackTopics = [
        { q: cookingQuery, cat: 'Cooking & Recipes', dev: false },
        { q: healthQuery, cat: 'Health Benefits', dev: false },
        { q: shivaQuery, cat: 'Shiva Devotional', dev: true },
        { q: thyroidQuery, cat: 'Thyroid Care & Cure', dev: false },
        { q: menopauseQuery, cat: 'Menopause Guide', dev: false },
        { q: habitsQuery, cat: 'Good Living Habits', dev: false },
        { q: devQuery, cat: 'Hindu Devotional', dev: true },
      ];

      for (const t of fallbackTopics) {
        const res = await fetchFromInvidious(t.q, t.cat, t.dev);
        if (res && res.length > 0) {
          liveItems.push(...res.slice(0, 3));
        }
      }
    }

    const shuffled = shuffleArray(liveItems);
    const unique = [];
    const seen = new Set();
    for (const item of shuffled) {
      if (!seen.has(item.youtubeId)) {
        seen.add(item.youtubeId);
        unique.push(item);
      }
    }

    liveCache.set(cacheKey, unique);
    // STRICT FILTERING GUARDRAIL BEFORE RETURNING!
    return filterAndAuditLiveVideos(unique, filterConfig);
  },

  /**
   * Fetches 100% Live Devotional Feed directly from YouTube Data API v3
   */
  async getLiveDevotionalVideos(filterConfig, subCategory = 'All', forceFresh = true) {
    const cacheKey = `dev_${subCategory}`;

    if (!forceFresh && liveCache.has(cacheKey)) {
      const cached = liveCache.get(cacheKey);
      return filterAndAuditLiveVideos(cached, filterConfig);
    }

    const pool = CATEGORY_ROTATION_POOLS[subCategory] || DEVOTIONAL_ROTATION_POOL;
    const dynamicQuery = pool[Math.floor(Math.random() * pool.length)];

    let liveResults = await fetchYouTubeDataApi(dynamicQuery, 18, subCategory, true);

    if (!liveResults || liveResults.length === 0) {
      liveResults = await fetchFromInvidious(dynamicQuery, subCategory, true);
    }

    const shuffled = shuffleArray(liveResults || []);
    const unique = [];
    const seen = new Set();
    for (const item of shuffled) {
      if (!seen.has(item.youtubeId)) {
        seen.add(item.youtubeId);
        unique.push(item);
      }
    }

    liveCache.set(cacheKey, unique);
    return filterAndAuditLiveVideos(unique, filterConfig);
  },

  /**
   * Fetches 100% Live Category Feed with dynamic rotation
   */
  async getLiveCategoryVideos(categoryName, filterConfig, forceFresh = true) {
    const cacheKey = `cat_${categoryName}`;

    if (!forceFresh && liveCache.has(cacheKey)) {
      const cached = liveCache.get(cacheKey);
      return filterAndAuditLiveVideos(cached, filterConfig);
    }

    const pool = CATEGORY_ROTATION_POOLS[categoryName] || [`${categoryName} high quality 2026`];
    const query = pool[Math.floor(Math.random() * pool.length)];
    const isDev = categoryName.toLowerCase().includes('devotional') || categoryName.toLowerCase().includes('bhajan');

    let liveResults = await fetchYouTubeDataApi(query, 18, categoryName, isDev);
    if (!liveResults || liveResults.length === 0) {
      liveResults = await fetchFromInvidious(query, categoryName, isDev);
    }

    const shuffled = shuffleArray(liveResults || []);
    const unique = [];
    const seen = new Set();
    for (const item of shuffled) {
      if (!seen.has(item.youtubeId)) {
        seen.add(item.youtubeId);
        unique.push(item);
      }
    }

    liveCache.set(cacheKey, unique);
    return filterAndAuditLiveVideos(unique, filterConfig);
  },

  /**
   * Fetches Live Comments from YouTube and strictly filters them with guardrails!
   */
  async getLiveComments(videoId, filterConfig) {
    const apiKey = getStoredApiKey();
    if (!apiKey || !videoId) return [];

    try {
      const cleanId = videoId.replace('yt-', '');
      const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${cleanId}&maxResults=25&key=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      const rawComments = (data.items || []).map(item => {
        const top = item.snippet?.topLevelComment?.snippet || {};
        return {
          id: item.id,
          author: top.authorDisplayName || 'YouTube Viewer',
          avatar: top.authorProfileImageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
          text: top.textDisplay || '',
          publishedAt: top.publishedAt ? new Date(top.publishedAt).toLocaleDateString() : 'Recent',
          likes: top.likeCount || 0,
        };
      });

      // FILTER COMMENTS AGAINST GUARDRAILS!
      return rawComments.filter(comment => {
        const dummy = { title: comment.text, description: '' };
        const analysis = analyzeVideo(dummy, filterConfig);
        return !analysis.blocked;
      });
    } catch (e) {
      console.warn('Error fetching YouTube comments:', e);
      return [];
    }
  },

  async getVideoByIdAsync(id, filterConfig) {
    let found = null;
    for (const list of liveCache.values()) {
      const inCache = list.find(v => v.id === id || v.youtubeId === id);
      if (inCache) {
        found = inCache;
        break;
      }
    }

    if (found) {
      const analysis = analyzeVideo(found, filterConfig);
      if (analysis.blocked) {
        return { error: 'BLOCKED', analysis, video: null };
      }
      return { error: null, video: found };
    }

    const cleanYtId = id.replace('yt-', '');
    const apiKey = getStoredApiKey();
    if (apiKey && cleanYtId.length === 11) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${cleanYtId}&key=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const item = data.items[0];
            const normalized = normalizeYouTubeApiItem(item, item, 'YouTube Live');
            if (item.status && item.status.embeddable === false) {
              normalized.isEmbedRestricted = true;
            }
            const analysis = analyzeVideo(normalized, filterConfig);
            if (analysis.blocked) {
              return { error: 'BLOCKED', analysis, video: null };
            }
            return { error: null, video: normalized };
          }
        }
      } catch (e) {}
    }

    if (id.startsWith('yt-') || id.length === 11) {
      const placeholder = {
        id: `yt-${cleanYtId}`,
        title: `YouTube Video (${cleanYtId})`,
        description: 'Live video stream from YouTube.',
        channel: 'YouTube Creator',
        channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        thumbnail: `https://i.ytimg.com/vi/${cleanYtId}/hqdefault.jpg`,
        youtubeId: cleanYtId,
        duration: 'Stream',
        views: 'Live Stream',
        publishedAt: 'Recent',
        category: 'Live Stream',
        tags: [],
      };
      const analysis = analyzeVideo(placeholder, filterConfig);
      if (analysis.blocked) {
        return { error: 'BLOCKED', analysis, video: null };
      }
      return { error: null, video: placeholder };
    }

    return { error: 'NOT_FOUND', video: null };
  },

  async getRelatedVideosAsync(currentVideo, filterConfig, limit = 8) {
    if (!currentVideo) return [];

    const apiKey = getStoredApiKey();
    if (apiKey && currentVideo.title) {
      const query = `${currentVideo.category || ''} ${currentVideo.title.slice(0, 40)}`;
      const apiResults = await fetchYouTubeDataApi(query, 12, currentVideo.category, currentVideo.isDevotional);
      if (apiResults && apiResults.length > 0) {
        const safe = filterAndAuditLiveVideos(apiResults, filterConfig).filter(
          v => v.youtubeId !== currentVideo.youtubeId
        );
        if (safe.length > 0) return shuffleArray(safe).slice(0, limit);
      }
    }

    let pool = [];
    for (const list of liveCache.values()) {
      pool.push(...list);
    }

    const candidates = pool.filter(v => v.id !== currentVideo.id && v.youtubeId !== currentVideo.youtubeId);
    const safe = filterAndAuditLiveVideos(candidates, filterConfig);
    return shuffleArray(safe).slice(0, limit);
  },

  async searchVideos(query, filterConfig) {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      return { source: 'youtube_live', videos: [], rawCount: 0, blockedCount: 0 };
    }

    const apiResults = await fetchYouTubeDataApi(trimmed, 25, 'YouTube Live Search', trimmed.toLowerCase().includes('devotional'));
    if (apiResults && apiResults.length > 0) {
      const filtered = filterAndAuditLiveVideos(apiResults, filterConfig);
      return {
        source: 'youtube_data_api_v3',
        videos: filtered,
        rawCount: apiResults.length,
        blockedCount: apiResults.length - filtered.length,
      };
    }

    const liveSearchResults = await fetchFromInvidious(trimmed, 'Live YouTube Search', trimmed.toLowerCase().includes('devotional'));
    if (liveSearchResults && liveSearchResults.length > 0) {
      const filtered = filterAndAuditLiveVideos(liveSearchResults, filterConfig);
      return {
        source: 'live_youtube_stream',
        videos: filtered,
        rawCount: liveSearchResults.length,
        blockedCount: liveSearchResults.length - filtered.length,
      };
    }

    return {
      source: 'youtube_live',
      videos: [],
      rawCount: 0,
      blockedCount: 0,
    };
  },

  getAutocompleteSuggestions(input, filterConfig) {
    if (!input || input.trim().length < 2) return [];
    const query = input.trim().toLowerCase();
    const candidates = [
      'Maha Mrityunjaya Mantra 108',
      'Achyutam Keshavam Krishna Bhajan',
      'Harivarasanam Swamiye Saranam Ayyappa',
      'Kani Kaanum Neram Guruvayurappa',
      'Mahishasura Mardini Stotram Devi Durga',
      'Hanuman Chalisa sacred recitation',
      'Shiva Tandava Stotram',
      'Temple Nadaswaram Thavil Raga',
      'Ganesha Pancharatnam',
      'Vishnu Sahasranamam 1000 names',
      'Malayalam devotional songs 2026',
      'Carnatic classical vocal live',
      'React 19 tutorial complete course',
      'Large Language Models Transformer architecture',
      'James Webb Space Telescope discoveries',
      'Western Ghats 4K rainforest documentary',
      'Brihadeeswarar Temple architecture Thanjavur',
      'Deep Work focus technique',
      'Authentic Kerala Sadya Feast recipes',
      'Daily horoscope predictions 2026',
      'Malayalam jathakam rashiphalam',
      'Black magic rituals and witchcraft',
      'Vashikaran love spell',
      'നാൾഫലം രാശിഫലം മലയാളം',
      'കൂടോത്രം മാരണം വശീകരണം',
    ];

    const matching = candidates.filter(term => term.toLowerCase().includes(query));
    return matching.filter(suggestion => {
      const dummy = { title: suggestion };
      const analysis = analyzeVideo(dummy, filterConfig);
      return !analysis.blocked;
    });
  },

  getHomeVideos(filterConfig, preferences) {
    for (const list of liveCache.values()) {
      if (list && list.length > 0) {
        return filterAndAuditLiveVideos(list, filterConfig);
      }
    }

    const curatedFallback = [
      {
        id: 'yt-ShivaTandavStotram',
        title: 'Shiva Tandava Stotram - Divine Har Har Shambhu Chants',
        description: 'Powerful and sacred chanting of Shiva Tandava Stotram by Agam Aggarwal with Sanskrit lyrics and divine vibrations.',
        channel: 'Agam Aggarwal',
        channelAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100',
        thumbnail: 'https://images.unsplash.com/photo-1567591414240-e1451f25b290?w=600',
        youtubeId: 'Qm_OUmbfJvI',
        duration: '10:20',
        views: '12M views',
        publishedAt: 'Recent',
        category: 'Shiva Devotional',
        subCategory: 'Shiva Devotional',
        tags: ['shiva', 'shiva tandava', 'mahadev', 'stotram'],
        isDevotional: true,
      },
      {
        id: 'yt-MahaMrityunjaya108',
        title: 'Maha Mrityunjaya Mantra 108 Times with Lyrics - Sacred Shiva Chant',
        description: 'Sacred Maha Mrityunjaya Mantra chanting 108 times for health, peace, longevity and divine protection.',
        channel: 'T-Series Bhakti Sagar',
        channelAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100',
        thumbnail: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600',
        youtubeId: 'BMDLRW1iDpI',
        duration: '45:15',
        views: '18M views',
        publishedAt: 'Recent',
        category: 'Shiva Devotional',
        subCategory: 'Shiva Devotional',
        tags: ['maha mrityunjaya', 'shiva', 'mantra', '108 times'],
        isDevotional: true,
      },
      {
        id: 'yt-HealthBenefitsAmla',
        title: 'Amla Benefits: What Happens When You Have Amla Everyday',
        description: 'Doctor explains the incredible health benefits of amla, turmeric, and ginger for immunity, gut health and longevity.',
        channel: 'The Yoga Institute',
        channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        thumbnail: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600',
        youtubeId: 'onjRMc1Zfwk',
        duration: '12:45',
        views: '450K views',
        publishedAt: 'Recent',
        category: 'Health Benefits',
        subCategory: 'Health Benefits',
        tags: ['health benefits', 'amla', 'nutrition', 'superfoods'],
        isDevotional: false,
      },
      {
        id: 'yt-GutHealthDiet',
        title: 'Foods for Gut Health & Microbiome - Doctor Explains Daily Routine',
        description: 'The science behind gut health, prebiotics and probiotics. How fixing your gut changes digestion, energy and mood.',
        channel: 'Dr. Gut Wellness',
        channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600',
        youtubeId: 'onjRMc1Zfwk',
        duration: '14:20',
        views: '890K views',
        publishedAt: 'Recent',
        category: 'Health Benefits',
        subCategory: 'Health Benefits',
        tags: ['gut health', 'health benefits', 'microbiome', 'nutrition'],
        isDevotional: false,
      },
      {
        id: 'yt-ShivKailashoKeVasi',
        title: 'Shiv Kailasho Ke Vasi - Anuradha Paudwal Sacred Bhajan',
        description: 'Soulful and divine Shiv bhajan describing Lord Shiva of Kailash Parvat with devotional devotion and peaceful melody.',
        channel: 'T-Series Bhakti Sagar',
        channelAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100',
        thumbnail: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=600',
        youtubeId: 'BMDLRW1iDpI',
        duration: '7:55',
        views: '3.1M views',
        publishedAt: 'Recent',
        category: 'Shiva Devotional',
        subCategory: 'Shiva Devotional',
        tags: ['shiv bhajan', 'kailash', 'anuradha paudwal', 'shiva'],
        isDevotional: true,
      },
      {
        id: 'yt-WalkingLongevity',
        title: 'What 30 Minutes of Walking Does to Your Entire Body - Science Backed',
        description: 'Neuroscience and cardiology research showing the massive health benefits of daily brisk walking on cardiovascular health and lifespan.',
        channel: 'Medical Science Guide',
        channelAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        thumbnail: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600',
        youtubeId: 'pd0EHPZXq9E',
        duration: '11:10',
        views: '1.4M views',
        publishedAt: 'Recent',
        category: 'Health Benefits',
        subCategory: 'Health Benefits',
        tags: ['health benefits', 'walking', 'longevity', 'habits'],
        isDevotional: false,
      },
      {
        id: 'yt-NamoNamoShankara',
        title: 'Namo Namo - Kedarnath Lord Shiva Devotional Song',
        description: 'Praise and reverence to Lord Shiva Shankara with majestic Kedarnath Himalayan visuals and devotion.',
        channel: 'Zee Music Company',
        channelAvatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=100',
        thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600',
        youtubeId: 'dx4Teh-nv3A',
        duration: '5:32',
        views: '95M views',
        publishedAt: 'Recent',
        category: 'Shiva Devotional',
        subCategory: 'Shiva Devotional',
        tags: ['namo namo', 'kedarnath', 'shiva', 'mahadev'],
        isDevotional: true,
      },
      {
        id: 'yt-ThyroidDietGuide',
        title: 'What is Thyroid & How to Reverse Symptoms Naturally with Diet',
        description: 'Comprehensive endocrinologist guide covering hypothyroidism, foods to eat and avoid, and selenium-rich nutrition.',
        channel: 'The Yoga Institute',
        channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        thumbnail: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600',
        youtubeId: 'onjRMc1Zfwk',
        duration: '16:05',
        views: '720K views',
        publishedAt: 'Recent',
        category: 'Thyroid Care & Cure',
        subCategory: 'Thyroid Care & Cure',
        tags: ['thyroid', 'health benefits', 'nutrition', 'cure'],
        isDevotional: false,
      },
    ];

    return filterAndAuditLiveVideos(curatedFallback, filterConfig);
  },

  getDevotionalVideos(filterConfig, subCategory = 'All') {
    return this.getHomeVideos(filterConfig).filter(v => v.isDevotional);
  },
};
