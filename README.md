# PureView — React-Only YouTube Stream with Strict Content Filtering

A fully responsive, YouTube-inspired video streaming web application built with **React 19, Vite, and Tailwind CSS**. Designed without any backend, database server, or custom API.

**PureView is 100% live:** Every video on the Home feed, Devotional hub, Search results, Shorts, related recommendations, and comments is pulled dynamically and directly from YouTube in real time using the YouTube Data API v3 (`AIzaSyB7kzw7YJGGb95Ope-mnAcgq43W0ppVSP8`) with open-CORS mirror fallbacks. **All static videos have been completely removed.**

Every piece of incoming YouTube content is strictly routed through our **centralized client-side guardrails** before rendering, eliminating astrology, horoscopes, black magic, occult practices, and related superstitious content.

---

## 🌟 Key Highlights & Features

### 1. 🛡️ Strict Content Filtering Guardrails (English, Malayalam & Manglish)
- **Pre-Render Interception:** Filtering happens **before rendering**, preventing blocked cards or leaks in the DOM.
- **Comprehensive Coverage:** Applied consistently to:
  - Live Home feed recommendations
  - Search results & real-time autocomplete suggestions
  - Category feeds & dedicated Devotional streams
  - Live related recommendations on playback pages
  - Shorts & vertical video feeds
  - Live YouTube comments
  - Personal Library, Watch History, and Bookmarks
- **Blocked Categories:**
  - **Astrology & Horoscopes:** Zodiac predictions, daily/weekly forecasts, birth charts (*kundli*, *jathakam*, *kundali*), *rashi phalam*, *nakshatra phalam*, *naal phalam*, tarot, palmistry, planetary remedies (*chovva dosham*, *shani dosham*), etc.
  - **Black Magic & Occult:** Witchcraft, sorcery, curses, hexes, *koodothram*, *maranam*, *sthambhanam*, *ucchatana*, dark rituals, *odiyan seva*.
  - **Supernatural Manipulation & Scams:** *Vashikaran* love spells, evil eye removal occult rites, lottery magic, instant wealth scams.
- **Multi-Language & Script Normalization:**
  - Case-insensitive matching with boundary checks to prevent false positives (e.g. *Astronomy* is allowed, *Astrology* is blocked).
  - Native Malayalam script support (e.g. രാശിഫലം, നാൾഫലം, ജാതകം, കൂടോത്രം, വശീകരണം, ഒടിയൻ സേവ, ഏഴരശ്ശനി, ചൊവ്വാദോഷം).
  - Manglish transliterations (*jathakam*, *rashiphalam*, *koodothram*, *vashikaran*, *ezharashani*, *chovvadosham*).
  - Unicode normalization (NFC composition preserving Indic vowel marks `\p{M}`).
  - Leetspeak and symbol de-obfuscation (`bl@ck m@gic`, `v4shikaran`, `a$trology`).
- **Contextual Exemption:** Whitelists scientific documentaries and rationalist educational content that debunk astrological myths.
- **Audit Log & Transparency:** View every blocked video and matched rule in the Settings Shield Audit Log.

---

### 2. 🪔 100% Live Hindu Devotional Streaming
- Dedicated **Devotional Hub** (`/devotional`) streaming live from YouTube:
  - Krishna Bhajans & Flute Melodies
  - Shiva Devotional & Shiva Tandava Stotram
  - Ayyappa Devotional & Harivarasanam
  - Devi & Durga Stutis (Mahishasura Mardini Stotram)
  - Malayalam Devotional Classics (Guruvayurappa, Yesudas, Chithra)
  - Hanuman Chalisa & Meditative Recitations
  - Sanskrit Mantras (Maha Mrityunjaya Mantra 108 Times)
  - South Indian Temple Nadaswaram & Thavil Ragas
  - Ganesha Pancharatnam & Vishnu Sahasranamam
- **Dynamic Rotation:** Results change dynamically on every reload and refresh via rotating query pools.

---

### 3. 📺 Video Playback, Live Comments & Related Streams
- **Official YouTube Player:** Plays embedded videos via YouTube no-cookie embed.
- **Shield Interceptor:** Navigating directly to a prohibited video URL halts playback immediately and displays a diagnostic block warning.
- **Live Filtered Comments:** Pulls real YouTube comment threads via `/commentThreads` and **strictly filters comments** against superstition and occult spam.
- **Filtered Related Videos:** Recommendations are generated dynamically from live YouTube searches and filtered against guardrails.
- **Interactive Actions:** Like, Save to Library, Share link (with clipboard toast).

---

### 4. ⚙️ Settings, Customization & Persistence
- **Custom Blocked Keywords:** Add or remove custom blocked words/phrases anytime.
- **Predefined Filter Groups:** Toggle individual categories on or off.
- **Strictness Modes:** Toggle between Standard and Aggressive Zero-Tolerance modes.
- **Category Preferences:** Select favorite categories to customize recommendations.
- **Dark & Light Mode:** Seamless theme toggle with persistent state.
- **Config Backup:** Export and import settings as JSON files.
- **Watch History Management:** Clear local history with one click.

---

## 🚀 Getting Started

### Installation
```bash
# In d:\youtube
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Automated Guardrail Tests
```bash
npm test
```
Runs 22 automated unit tests verifying:
- Text normalization & Unicode diacritics
- Malayalam script matching (രാശിഫലം, നാൾഫലം, ജാതകം, കൂടോത്രം, വശീകരണം, ഒടിയൻ സേവ)
- Manglish transliterations (*koodothram*, *vashikaran*, *jathakaporutham*, *ezharashani*)
- Leetspeak de-obfuscation (`bl@ck m@gic`)
- False positive prevention (*Astronomy* vs *Astrology*)
- Pre-render search autocomplete filtering
- Insufficient metadata policy handling

### Production Build
```bash
npm run build
```
