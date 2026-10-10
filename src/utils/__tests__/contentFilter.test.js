import { describe, it, expect } from 'vitest';
import { normalizeText, matchesKeyword } from '../textNormalization';
import { analyzeVideo, filterVideos, filterSearchSuggestions } from '../contentFilter';
import defaultRules from '../../data/filterRules.json';

describe('Text Normalization', () => {
  it('should normalize uppercase, extra spaces, and accents', () => {
    const raw = '  Daily  HÓROSCOPE   Predictions!  ';
    const normalized = normalizeText(raw);
    expect(normalized).toBe('daily horoscope predictions');
  });

  it('should remove invisible zero-width characters and punctuation', () => {
    const raw = 'black\u200Bmagic--witchcraft_spell!';
    const normalized = normalizeText(raw);
    expect(normalized).toBe('blackmagic witchcraft spell');
  });

  it('should translate common leetspeak substitutions', () => {
    const raw = 'bl@ck m@gic v4shik@r@n';
    const normalized = normalizeText(raw, true);
    expect(normalized).toBe('black magic vashikaran');
  });

  it('should preserve Malayalam Unicode characters', () => {
    const malayalam = 'സമ്പൂർണ്ണ രാശിഫലം മലയാളം';
    const normalized = normalizeText(malayalam);
    expect(normalized).toContain('രാശിഫലം');
  });
});

describe('Keyword Matching Logic', () => {
  it('should match English keywords with word boundaries', () => {
    const text = normalizeText('here is your daily horoscope prediction today');
    expect(matchesKeyword(text, 'horoscope')).toBe(true);
  });

  it('should NOT match false positives where keyword is merely a substring of an unrelated word', () => {
    // "astronomy" should not be matched by "astro" unless "astronomy" itself is blocked
    const text = normalizeText('deep astronomy and space physics exploration');
    expect(matchesKeyword(text, 'astro')).toBe(false);
  });

  it('should match Malayalam script keywords correctly', () => {
    const text = normalizeText('ഈ മാസത്തെ സമ്പൂർണ്ണ നാൾഫലം ഫലങ്ങൾ');
    expect(matchesKeyword(text, 'നാൾഫലം')).toBe(true);
  });

  it('should match Manglish keywords correctly', () => {
    const text = normalizeText('koodothram maranam lakshanam');
    expect(matchesKeyword(text, 'koodothram')).toBe(true);
  });
});

describe('Centralized Content Filtering Engine', () => {
  const sampleConfig = {
    ...defaultRules.defaultSettings,
    categories: defaultRules.categories,
    customKeywords: ['customblockedword'],
    whitelistedEducationalTerms: defaultRules.whitelistedEducationalTerms,
  };

  it('blocks English astrology videos', () => {
    const video = {
      id: 'test-1',
      title: '2026 Yearly Horoscope and Zodiac Forecast',
      description: 'Find out what the planets say about your future',
      tags: ['zodiac', 'astrology', 'horoscope'],
    };
    const result = analyzeVideo(video, sampleConfig);
    expect(result.blocked).toBe(true);
    expect(result.category).toBe('astrology');
  });

  it('blocks Malayalam astrology videos using Malayalam script', () => {
    const video = {
      id: 'test-2',
      title: 'ഈ വർഷത്തെ നാൾഫലം സമ്പൂർണ്ണ ഫലങ്ങൾ',
      description: 'ജ്യോതിഷ പ്രവചനം ജാതകം ഫലം',
      tags: ['നാൾഫലം'],
    };
    const result = analyzeVideo(video, sampleConfig);
    expect(result.blocked).toBe(true);
    expect(result.category).toBe('astrology');
  });

  it('blocks Manglish occult and black magic content', () => {
    const video = {
      id: 'test-3',
      title: 'How to do vashikaran and koodothram rituals',
      description: 'Spells to control enemy feelings',
      tags: ['vashikaran', 'koodothram'],
    };
    const result = analyzeVideo(video, sampleConfig);
    expect(result.blocked).toBe(true);
  });

  it('blocks videos matching user custom keywords', () => {
    const video = {
      id: 'test-4',
      title: 'A video mentioning customblockedword inside the text',
      description: 'Nothing else',
      tags: [],
    };
    const result = analyzeVideo(video, sampleConfig);
    expect(result.blocked).toBe(true);
    expect(result.category).toBe('custom');
  });

  it('allows safe Hindu devotional videos without false triggers', () => {
    const video = {
      id: 'test-devotional',
      title: 'Maha Mrityunjaya Mantra 108 Times Chanting',
      description: 'Vedic Shiva mantra for vitality and divine grace',
      tags: ['shiva', 'mantra', 'vedic', 'meditation'],
      category: 'Hindu Devotional',
    };
    const result = analyzeVideo(video, sampleConfig);
    expect(result.blocked).toBe(false);
  });

  it('allows science videos that explain astronomy without astrology', () => {
    const video = {
      id: 'test-science',
      title: 'James Webb Space Telescope Explores Ancient Galaxies',
      description: 'Cosmic observations of stellar physics and astrophysics',
      tags: ['astronomy', 'space', 'science', 'jwst'],
      category: 'Educational & Science',
    };
    const result = analyzeVideo(video, sampleConfig);
    expect(result.blocked).toBe(false);
  });

  it('honors educational debunking exemption when enabled', () => {
    const video = {
      id: 'test-debunk',
      title: 'Debunking Astrology Myths with Science and Astronomy',
      description: 'A rationalist examination of superstitious fortune telling and why it is not scientific',
      tags: ['debunking', 'rationalist', 'science'],
      category: 'Educational & Science',
    };
    const result = analyzeVideo(video, sampleConfig);
    expect(result.blocked).toBe(false);
    expect(result.isEducationalExemption).toBe(true);
  });

  it('correctly filters a batch of videos', () => {
    const videos = [
      { id: '1', title: 'Soothing Krishna Flute Bhajan', description: 'Peaceful' },
      { id: '2', title: 'Daily Horoscope and Tarot Reading', description: 'Zodiac' },
      { id: '3', title: 'Authentic Kerala Sadya Recipe', description: 'Food' },
      { id: '4', title: 'Black Magic Spell to Hex Enemy', description: 'Occult' },
    ];
    const safeVideos = filterVideos(videos, sampleConfig);
    expect(safeVideos).toHaveLength(2);
    expect(safeVideos.map(v => v.id)).toEqual(['1', '3']);
  });

  it('filters search autocomplete suggestions strictly', () => {
    const suggestions = [
      'krishna bhajans',
      'horoscope predictions',
      'react tutorial',
      'vashikaran mantra',
      'malayalam devotional songs',
      'black magic rituals',
    ];
    const filtered = filterSearchSuggestions(suggestions, sampleConfig);
    expect(filtered).toEqual([
      'krishna bhajans',
      'react tutorial',
      'malayalam devotional songs',
    ]);
  });

  it('blocks videos with insufficient metadata when policy is enabled', () => {
    const strictMetadataConfig = {
      ...sampleConfig,
      blockIfInsufficientMetadata: true,
    };
    const sparseVideo = {
      id: 'sparse-1',
      title: 'Hi',
      description: '',
      tags: [],
    };
    const result = analyzeVideo(sparseVideo, strictMetadataConfig);
    expect(result.blocked).toBe(true);
    expect(result.category).toBe('insufficient_metadata');
  });

  it('detects leetspeak obfuscation in blocked keywords', () => {
    const video = {
      id: 'obfuscated-1',
      title: 'Secret bl@ck m@gic ritual to gain power',
      description: 'Hidden occult rites',
    };
    const result = analyzeVideo(video, sampleConfig);
    expect(result.blocked).toBe(true);
  });

  it('blocks various Malayalam horoscope and astrological terms', () => {
    const termsToTest = [
      '2026 സമ്പൂർണ്ണ വാർഷിക രാശിഫലം',
      'വിവാഹ പൊരുത്തം അറിയാൻ ജാതകക്കുറിപ്പ് പരിശോധന',
      'കവടിനിരത്ത് പ്രശ്നം വെയ്പ്പ് ഫലങ്ങൾ',
      'ചൊവ്വാദോഷം പരിഹാരം അറിയാം',
      'ഏഴരശ്ശനി കണ്ടകശ്ശനി ദോഷ പരിഹാരങ്ങൾ',
      'ഈ മാസത്തെ നക്ഷത്രഫലം പ്രവചനം',
      'കൈരേഖ സാമുദ്രിക ശാസ്ത്രം രഹസ്യങ്ങൾ',
    ];

    for (const title of termsToTest) {
      const video = { id: 'test-ml', title, description: '' };
      const res = analyzeVideo(video, sampleConfig);
      expect(res.blocked).toBe(true);
      expect(res.category).toBe('astrology');
    }
  });

  it('blocks Malayalam black magic and occult terms', () => {
    const occultTerms = [
      'കൂടോത്ര ലക്ഷണങ്ങൾ എങ്ങനെ തിരിച്ചറിയാം കൂടോത്രക്രിയ',
      'ശത്രുസംഹാരം മന്ത്രവാദം രഹസ്യ ക്രിയകൾ',
      'സ്ത്രീ വശീകരണ തൈലം വശീകരണ മന്ത്രം',
      'പ്രേതബാധ ബാധ ഒഴിപ്പിക്കൽ ദുർമന്ത്രവാദം',
      'ഒടിയൻ സേവ ചാത്തൻ സേവ മന്ത്രവാദ രഹസ്യം',
    ];

    for (const title of occultTerms) {
      const video = { id: 'test-occult', title, description: '' };
      const res = analyzeVideo(video, sampleConfig);
      expect(res.blocked).toBe(true);
    }
  });

  it('blocks Manglish transliterations of Malayalam astrological terms', () => {
    const manglishTerms = [
      'jathakaporutham nokkunna vidham',
      'ezharashani dosham pariharam',
      'koodothrakriya lakshanam',
      'vashikaranathailam prayogam',
      'varshikarashiphalam 2026 predictions',
    ];

    for (const title of manglishTerms) {
      const video = { id: 'test-manglish', title, description: '' };
      const res = analyzeVideo(video, sampleConfig);
      expect(res.blocked).toBe(true);
    }
  });
});
