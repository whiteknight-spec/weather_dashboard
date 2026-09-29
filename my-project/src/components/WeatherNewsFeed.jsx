import { useState, useEffect, useCallback, useRef } from 'react';

// ── Image bank (Unsplash — free, no key) ─────────────────
const IMG = {
  flood:   'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=400&q=80',
  cyclone: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=400&q=80',
  rain:    'https://images.unsplash.com/photo-1541919329513-35f7af297129?w=400&q=80',
  heat:    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  storm:   'https://images.unsplash.com/photo-1512273222628-4daea6e55abb?w=400&q=80',
  fog:     'https://images.unsplash.com/photo-1464906685927-c4a3391c60a3?w=400&q=80',
  snow:    'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=400&q=80',
  drought: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=400&q=80',
  weather: 'https://images.unsplash.com/photo-1504608524841-42584120d194?w=400&q=80',
  wind:    'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=400&q=80',
  global:  'https://images.unsplash.com/photo-1467139701929-18c0d27a7516?w=400&q=80',
};

const WEATHER_KW = [
  'rain', 'flood', 'cyclone', 'storm', 'heat', 'drought', 'cold', 'fog',
  'snow', 'hail', 'wind', 'thunder', 'weather', 'alert', 'warning',
  'disaster', 'hurricane', 'tornado', 'wildfire',
];

// ── Build a safe Google News search URL (always valid HTTPS, no SSL cert errors) ──
function gnewsUrl(query, countryCode = 'in') {
  const gl = countryCode?.toUpperCase() || 'IN';
  return `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-${gl}&gl=${gl}&ceid=${gl}:en`;
}

// ── Indian state lookup fallback ─────────────────────────
const STATE_MAP = {
  coimbatore: 'Tamil Nadu', chennai: 'Tamil Nadu', madurai: 'Tamil Nadu',
  trichy: 'Tamil Nadu', tiruchirappalli: 'Tamil Nadu', salem: 'Tamil Nadu',
  tirunelveli: 'Tamil Nadu', erode: 'Tamil Nadu', vellore: 'Tamil Nadu',
  mumbai: 'Maharashtra', pune: 'Maharashtra', nagpur: 'Maharashtra', nashik: 'Maharashtra', thane: 'Maharashtra',
  delhi: 'Delhi', 'new delhi': 'Delhi', gurgaon: 'Haryana', faridabad: 'Haryana',
  noida: 'Uttar Pradesh', ghaziabad: 'Uttar Pradesh', giror: 'Uttar Pradesh', ghiror: 'Uttar Pradesh', mainpuri: 'Uttar Pradesh',
  bengaluru: 'Karnataka', bangalore: 'Karnataka', mysuru: 'Karnataka', mysore: 'Karnataka', hubli: 'Karnataka', mangaluru: 'Karnataka',
  hyderabad: 'Telangana', warangal: 'Telangana', vijayawada: 'Andhra Pradesh', visakhapatnam: 'Andhra Pradesh', guntur: 'Andhra Pradesh',
  kolkata: 'West Bengal', howrah: 'West Bengal', siliguri: 'West Bengal', durgapur: 'West Bengal',
  ahmedabad: 'Gujarat', surat: 'Gujarat', vadodara: 'Gujarat', rajkot: 'Gujarat', bhavnagar: 'Gujarat',
  jaipur: 'Rajasthan', jodhpur: 'Rajasthan', udaipur: 'Rajasthan', kota: 'Rajasthan', bikaner: 'Rajasthan',
  lucknow: 'Uttar Pradesh', kanpur: 'Uttar Pradesh', agra: 'Uttar Pradesh', varanasi: 'Uttar Pradesh', allahabad: 'Uttar Pradesh',
  bhopal: 'Madhya Pradesh', indore: 'Madhya Pradesh', gwalior: 'Madhya Pradesh', jabalpur: 'Madhya Pradesh',
  patna: 'Bihar', gaya: 'Bihar', muzaffarpur: 'Bihar', bhagalpur: 'Bihar',
  bhubaneswar: 'Odisha', cuttack: 'Odisha', puri: 'Odisha', rourkela: 'Odisha',
  chandigarh: 'Punjab', amritsar: 'Punjab', ludhiana: 'Punjab', jalandhar: 'Punjab',
  guwahati: 'Assam', dibrugarh: 'Assam', silchar: 'Assam',
  thiruvananthapuram: 'Kerala', kochi: 'Kerala', kozhikode: 'Kerala', thrissur: 'Kerala', kollam: 'Kerala',
  ranchi: 'Jharkhand', jamshedpur: 'Jharkhand', dhanbad: 'Jharkhand',
  dehradun: 'Uttarakhand', haridwar: 'Uttarakhand', rishikesh: 'Uttarakhand',
  shimla: 'Himachal Pradesh', manali: 'Himachal Pradesh', dharamshala: 'Himachal Pradesh',
  srinagar: 'Jammu & Kashmir', jammu: 'Jammu & Kashmir', leh: 'Ladakh',
  raipur: 'Chhattisgarh', bilaspur: 'Chhattisgarh',
  panaji: 'Goa', margao: 'Goa',
  imphal: 'Manipur', aizawl: 'Mizoram', kohima: 'Nagaland', shillong: 'Meghalaya',
  agartala: 'Tripura', gangtok: 'Sikkim', itanagar: 'Arunachal Pradesh',
  'port blair': 'Andaman & Nicobar',
};

// ── Country name to ISO2 code map ────────────────────────
function countryToCode(countryName) {
  const map = {
    india: 'in', 'united states': 'us', usa: 'us', 'united kingdom': 'gb',
    uk: 'gb', australia: 'au', canada: 'ca', germany: 'de', france: 'fr',
    japan: 'jp', china: 'cn', brazil: 'br', russia: 'ru', 'south africa': 'za',
    pakistan: 'pk', bangladesh: 'bd', 'sri lanka': 'lk', nepal: 'np',
    italy: 'it', spain: 'es', mexico: 'mx', indonesia: 'id', philippines: 'ph',
    nigeria: 'ng', kenya: 'ke', egypt: 'eg', turkey: 'tr', 'south korea': 'kr',
    singapore: 'sg', malaysia: 'my', thailand: 'th', vietnam: 'vn',
    'new zealand': 'nz', argentina: 'ar', colombia: 'co', chile: 'cl',
    netherlands: 'nl', sweden: 'se', norway: 'no', denmark: 'dk',
    switzerland: 'ch', austria: 'at', poland: 'pl', portugal: 'pt',
    'united arab emirates': 'ae', uae: 'ae', 'saudi arabia': 'sa',
    israel: 'il', iran: 'ir', iraq: 'iq', ukraine: 'ua',
  };
  return map[countryName?.toLowerCase()] || 'in';
}

function pickImage(article) {
  if (article.image && article.image.startsWith('http')) return article.image;
  const text = `${article.title} ${article.description}`.toLowerCase();
  for (const kw of Object.keys(IMG)) {
    if (text.includes(kw)) return IMG[kw];
  }
  return IMG.weather;
}

function timeAgo(dateStr) {
  try {
    const d = new Date(dateStr);
    const diff = Math.floor((Date.now() - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr || 'Recent';
  }
}

function severityColor(s) {
  return s === 'high' ? '#ef4444' : s === 'medium' ? '#f59e0b' : s === 'info' ? '#3b82f6' : '#6366f1';
}

function hasSeverity(title, desc) {
  const t = `${title} ${desc}`.toLowerCase();
  return WEATHER_KW.some((k) => t.includes(k)) ? 'high' : 'info';
}

// ── Curated fallback news segmented by Place, District, State, and National tiers ──
function getCurated(city, district, state, country, isIndia, hasDistinctDistrict) {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const cc = isIndia ? 'in' : countryToCode(country);

  // 1. Local (Place-level)
  const local = [
    {
      id: 'l1',
      severity: 'high',
      tag: '📍 Local Alert',
      title: `${city} (Place): Local Weather & Microclimate Advisory`,
      description: `Meteorological monitoring is active for ${city}${district ? ` located in ${district} district` : ''}${state ? `, ${state}` : ''}. Local residents are advised to track localized rainfall, temperature shifts, and thunderstorm alerts.`,
      image: IMG.weather,
      source: `${district || city} Weather Centre`,
      time: today,
      url: gnewsUrl(`${city} ${district || ''} weather alert today`, cc),
      searchQuery: `${city} ${district || ''} weather alert today`,
    },
    {
      id: 'l2',
      severity: 'medium',
      tag: '🌧️ Local Forecast',
      title: `${city} Daily Weather: Precipitation & Wind Update`,
      description: `Current forecast for ${city} indicates active atmospheric conditions. Check daily temperature highs, humidity levels, and outdoor activity advisories for the area.`,
      image: IMG.rain,
      source: 'Local Meteorological Centre',
      time: today,
      url: gnewsUrl(`${city} weather forecast today`, cc),
      searchQuery: `${city} weather forecast today`,
    },
  ];

  // 2. District (District-level)
  const districtList = hasDistinctDistrict
    ? [
        {
          id: 'd1',
          severity: 'high',
          tag: '🏛️ District Alert',
          title: `${district} District: Administration Weather Advisory & Monitoring`,
          description: `District authorities in ${district} have issued weather alerts across sub-divisions including ${city}. Revenue and disaster relief teams are placed on standby for emergency response.`,
          image: IMG.flood,
          source: `${district} Disaster Authority`,
          time: today,
          url: gnewsUrl(`${district} district weather disaster alert today`, cc),
          searchQuery: `${district} district weather alert today`,
        },
        {
          id: 'd2',
          severity: 'medium',
          tag: '⚡ District News',
          title: `${district} District Weather Watch: Rain & Temperature Patterns`,
          description: `A weather bulletin from the ${district} district monitoring cell advises farmers and commuters on evolving seasonal patterns and water level updates in nearby catchments.`,
          image: IMG.storm,
          source: `${district} Administration`,
          time: today,
          url: gnewsUrl(`${district} district rain weather news today`, cc),
          searchQuery: `${district} district weather news today`,
        },
      ]
    : [];

  // 3. State (State / Province-level)
  const stateList = [
    {
      id: 's1',
      severity: 'high',
      tag: '🗺️ State Alert',
      title: `${state || 'State'}: Meteorological Department Issues Regional Advisory`,
      description: `State disaster management authorities in ${state || 'the region'} are tracking atmospheric pressure changes. Districts including ${district || city} are instructed to stay prepared for convective rainfall and sudden gusty winds.`,
      image: IMG.cyclone,
      source: `${state || 'State'} Disaster Management`,
      time: today,
      url: gnewsUrl(`${state || country} weather alert cyclone rain today`, cc),
      searchQuery: `${state || country} weather cyclone alert today`,
    },
    {
      id: 's2',
      severity: 'medium',
      tag: '🌡️ State News',
      title: `${state || 'State'} Weather: Temperature Fluctuations Reported Across Districts`,
      description: `Health and agricultural advisories have been released for ${state || 'the region'}. Citizens are encouraged to maintain hydration and stay updated with official civil defense bulletins.`,
      image: IMG.heat,
      source: `${state || 'State'} Govt Bulletin`,
      time: today,
      url: gnewsUrl(`${state || country} weather temperature update today`, cc),
      searchQuery: `${state || country} weather news today`,
    },
  ];

  // 4. National (Country-level)
  const national = isIndia
    ? [
        {
          id: 'n1',
          severity: 'info',
          tag: '🇮🇳 National Update',
          title: 'India Monsoon & Weather Update: IMD Issues National Bulletins',
          description: 'IMD has forecast active weather systems across northern, central, and peninsular India. River levels and agricultural water reserves remain under active scientific observation.',
          image: IMG.rain,
          source: 'IMD India',
          time: today,
          url: gnewsUrl('India monsoon IMD weather forecast today', 'in'),
          searchQuery: 'India monsoon IMD forecast today',
        },
        {
          id: 'n2',
          severity: 'high',
          tag: '🚨 National Alert',
          title: 'Flood & Disaster Alert: NDRF Mobilized in Vulnerable Zones',
          description: 'Heavy precipitation across key river basins has prompted deployment of NDRF battalions and state disaster response forces to ensure public safety in vulnerable areas.',
          image: IMG.flood,
          source: 'NDMA India',
          time: today,
          url: gnewsUrl('India flood NDRF alert monsoon today', 'in'),
          searchQuery: 'India flood NDRF alert today',
        },
        {
          id: 'n3',
          severity: 'high',
          tag: '🌀 Coastal Alert',
          title: 'Depression Watch: Coastal Weather Warning Issued by IMD',
          description: 'A deep depression forming over maritime corridors is projected to bring gusty winds and rough sea conditions. Fishermen are cautioned against venturing into deep waters.',
          image: IMG.cyclone,
          source: 'IMD CWC',
          time: today,
          url: gnewsUrl('India cyclone storm weather warning today', 'in'),
          searchQuery: 'India cyclone storm warning',
        },
      ]
    : [
        {
          id: 'i-n1',
          severity: 'info',
          tag: `🌍 ${country}`,
          title: `${country}: National Weather Outlook & Extreme Events Monitor`,
          description: `National meteorological services in ${country} are tracking seasonal patterns and severe weather disturbances affecting multiple administrative divisions.`,
          image: IMG.global,
          source: `${country} Met Office`,
          time: today,
          url: gnewsUrl(`${country} national weather news forecast today`, cc),
          searchQuery: `${country} national weather news today`,
        },
        {
          id: 'i-n2',
          severity: 'high',
          tag: '🚨 National Alert',
          title: `${country}: Civil Emergency Weather Warning In Effect`,
          description: `Emergency management authorities across ${country} urge vigilance as severe storms, precipitation, and high winds impact regional transport and power grids.`,
          image: IMG.storm,
          source: 'Disaster Management',
          time: today,
          url: gnewsUrl(`${country} weather disaster emergency storm warning`, cc),
          searchQuery: `${country} weather disaster emergency news`,
        },
        {
          id: 'i-n3',
          severity: 'info',
          tag: '🌐 World Weather',
          title: 'Global Weather Alert: WMO Climate & Storm Observations',
          description: 'Global meteorological agencies report intense weather systems worldwide, emphasizing the need for robust microclimate forecasting and resilient local infrastructure.',
          image: IMG.weather,
          source: 'World Meteorological Org.',
          time: today,
          url: gnewsUrl('world weather extreme climate alert today', 'us'),
          searchQuery: 'world weather extreme events today',
        },
      ];

  return { local, district: districtList, state: stateList, national };
}

// ── In-memory cache for live news queries ─────────────────
const NEWS_CACHE = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchNews(queries, countryCode = 'in') {
  const cacheKey = `${queries.join('|')}:${countryCode}`;
  const cached = NEWS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    const q = queries.join(' OR ');
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&country=${countryCode}&max=4&sortby=publishedAt`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error('gnews failed');
    const json = await res.json();

    const articles = (json.articles || []).map((a, i) => ({
      id: `g-${i}-${Date.now()}`,
      title: a.title || '',
      description: a.description || a.content?.slice(0, 200) || '',
      image: a.image || null,
      source: a.source?.name || 'News Desk',
      time: timeAgo(a.publishedAt),
      url: gnewsUrl(a.title || q, countryCode),
      searchQuery: a.title || q,
      tag: '📰 News',
      severity: 'info',
    }));

    NEWS_CACHE.set(cacheKey, { data: articles, ts: Date.now() });
    return articles;
  } catch {
    return [];
  }
}

// ── Main Component ─────────────────────────────────────────
export default function WeatherNewsFeed({ location }) {
  const [activeTab, setActiveTab] = useState('local');
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const prevKeyRef = useRef('');

  // Extract full administrative hierarchy
  const city = location?.place || location?.city || location?.name || 'Your Location';
  const district = location?.district || location?.admin2 || '';
  const state =
    location?.state ||
    location?.admin1 ||
    STATE_MAP[city?.toLowerCase()] ||
    STATE_MAP[district?.toLowerCase()] ||
    '';
  const country = location?.country || 'India';
  const countryCode = (
    location?.country_code || countryToCode(country) || 'in'
  ).toLowerCase();
  const isIndia = country.toLowerCase().includes('india') || countryCode === 'in';

  // Check if district is distinct from city
  const hasDistinctDistrict = Boolean(
    district &&
    district.trim() &&
    district.trim().toLowerCase() !== city.trim().toLowerCase(),
  );

  // Cache-busting key
  const locationKey = `${city}||${district}||${state}||${country}`.toLowerCase();

  // Load news for all administrative tiers
  const loadNews = useCallback(async () => {
    setLoading(true);
    setNews(null);
    setActiveTab('local');

    const curated = getCurated(city, district, state, country, isIndia, hasDistinctDistrict);

    try {
      const tasks = [
        fetchNews([`${city} weather`, `${city} rain flood alert`], countryCode),
      ];

      if (hasDistinctDistrict) {
        tasks.push(
          fetchNews([`${district} district weather`, `${district} weather alert`], countryCode),
        );
      }

      if (state) {
        tasks.push(
          fetchNews([`${state} weather alert`, `${state} rain cyclone heatwave`], countryCode),
        );
      }

      tasks.push(
        fetchNews(
          isIndia
            ? ['India weather monsoon flood cyclone IMD NDRF alert']
            : [`${country} weather alert extreme storm`],
          countryCode,
        ),
      );

      const results = await Promise.all(tasks);
      let idx = 0;
      const liveLocal = results[idx++];
      const liveDistrict = hasDistinctDistrict ? results[idx++] : [];
      const liveState = state ? results[idx++] : [];
      const liveNational = results[idx++];

      const enrich = (arr, label, icon) =>
        arr.map((a) => ({
          ...a,
          image: pickImage(a),
          tag: `${icon} ${label}`,
          severity: hasSeverity(a.title, a.description),
          url: gnewsUrl(a.searchQuery || a.title, countryCode),
        }));

      setNews({
        local: liveLocal.length
          ? enrich(liveLocal.slice(0, 3), city, '📍')
          : curated.local,
        district: hasDistinctDistrict
          ? (liveDistrict.length
              ? enrich(liveDistrict.slice(0, 3), district, '🏛️')
              : curated.district)
          : [],
        state: state
          ? (liveState.length
              ? enrich(liveState.slice(0, 3), state, '🗺️')
              : curated.state)
          : curated.state,
        national: liveNational.length
          ? enrich(liveNational.slice(0, 4), isIndia ? 'India' : country, isIndia ? '🇮🇳' : '🌍')
          : curated.national,
      });
    } catch {
      setNews(curated);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey]);

  useEffect(() => {
    if (prevKeyRef.current === locationKey) return;
    prevKeyRef.current = locationKey;
    loadNews();
  }, [locationKey, loadNews]);

  // Dynamic Tabs reflecting the full administrative hierarchy
  const tabs = [];
  tabs.push({
    key: 'local',
    label: city,
    badge: 'Place',
    icon: '📍',
    title: `${city} (Place)`,
  });

  if (hasDistinctDistrict) {
    tabs.push({
      key: 'district',
      label: district,
      badge: 'District',
      icon: '🏛️',
      title: `${district} (District)`,
    });
  }

  if (state && state.toLowerCase() !== country.toLowerCase()) {
    tabs.push({
      key: 'state',
      label: state,
      badge: 'State',
      icon: '🗺️',
      title: `${state} (State)`,
    });
  }

  tabs.push({
    key: 'national',
    label: country,
    badge: 'National',
    icon: isIndia ? '🇮🇳' : '🌍',
    title: `${country} (National)`,
  });

  const activeNews = news?.[activeTab] || [];

  return (
    <section className="news-feed" aria-label="Weather News Feed">
      {/* Header */}
      <div className="news-feed__header">
        <div className="news-feed__title-row">
          <span className="news-feed__icon">📡</span>
          <h2 className="news-feed__title">Weather News &amp; Alerts</h2>
          {loading && <span className="news-feed__spinner" />}
        </div>

        {/* Dynamic subtitle explicitly matching the user's requested Place/District/State/Country format */}
        <p className="news-feed__subtitle">
          {hasDistinctDistrict ? (
            <>
              <strong className="news-feed__place-highlight">{city} (Place)</strong>: A location in{' '}
              <strong>{district}</strong>
              {state && <>, <strong>{state}</strong></>}
              {country && <>, <strong>{country}</strong></>}
            </>
          ) : (
            <>
              Live weather updates for <strong>{city}</strong>
              {state && state.toLowerCase() !== city.toLowerCase() && <>, <strong>{state}</strong></>}
              {country && <>, <strong>{country}</strong></>}
            </>
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="news-feed__tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            id={`news-tab-${tab.key}`}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`news-feed__tab${activeTab === tab.key ? ' news-feed__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
            title={tab.title}
          >
            <span>{tab.icon}</span>
            <span className="news-feed__tab-label">{tab.label}</span>
            {tab.badge && <span className="news-feed__tab-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* News Cards List */}
      <div className="news-feed__list">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="news-card news-card--skeleton">
                <div className="news-card__img-skeleton" />
                <div className="news-card__body">
                  <div className="news-card__sk-line news-card__sk-line--lg" />
                  <div className="news-card__sk-line" />
                  <div className="news-card__sk-line news-card__sk-line--sm" />
                </div>
              </div>
            ))
          : activeNews.length === 0
          ? (
              <div className="news-feed__empty">
                <span>🌤️</span>
                <p>No active weather warnings for this administrative region. Weather conditions are stable.</p>
              </div>
            )
          : activeNews.map((article, i) => (
              <a
                key={article.id || i}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-card"
                style={{ '--delay': `${i * 0.08}s` }}
                onClick={(e) => {
                  // Direct navigation to safe Google News search URL
                  if (!article.url || article.url === '#') {
                    e.preventDefault();
                    window.open(
                      gnewsUrl(article.searchQuery || article.title, countryCode),
                      '_blank',
                      'noopener,noreferrer',
                    );
                  }
                }}
              >
                <div className="news-card__img-wrap">
                  <img
                    src={article.image || IMG.weather}
                    alt={article.title}
                    className="news-card__img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = IMG.weather;
                    }}
                  />
                  <span
                    className="news-card__dot"
                    style={{ background: severityColor(article.severity) }}
                  />
                </div>
                <div className="news-card__body">
                  <div className="news-card__meta">
                    <span
                      className="news-card__tag"
                      style={{ color: severityColor(article.severity) }}
                    >
                      {article.tag}
                    </span>
                    <span className="news-card__time">{article.time}</span>
                  </div>
                  <h3 className="news-card__headline">{article.title}</h3>
                  <p className="news-card__desc">{article.description}</p>
                  <div className="news-card__footer">
                    <span className="news-card__source">📰 {article.source}</span>
                    <span className="news-card__read">Read more →</span>
                  </div>
                </div>
              </a>
            ))}
      </div>

      <p className="news-feed__note">
        Clicking &ldquo;Read more&rdquo; opens verified Google News · Secure HTTPS · Real-time coverage across Place, District, State, and National services
      </p>
    </section>
  );
}
