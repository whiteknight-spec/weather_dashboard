import { useState, useCallback, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import FavoritesBar from './components/FavoritesBar';
import SevereWeatherAlert from './components/SevereWeatherAlert';
import AtmosphericParticles from './components/AtmosphericParticles';
import GlobeViewer from './components/GlobeViewer';
import WeatherMap from './components/WeatherMap';
import CurrentWeather from './components/CurrentWeather';
import HourlyForecast from './components/HourlyForecast';
import InteractiveHourlyChart from './components/InteractiveHourlyChart';
import DailyForecast from './components/DailyForecast';
import MetricsGrid from './components/MetricsGrid';
import AirQualityCard from './components/AirQualityCard';
import SunMoonArc from './components/SunMoonArc';
import LifestyleAdvisor from './components/LifestyleAdvisor';
import CityCompareModal from './components/CityCompareModal';
import WeatherNewsFeed from './components/WeatherNewsFeed';
import { toggleAudioAmbience } from './utils/audioAmbience';
import {
  searchCities,
  fetchWeatherData,
  fetchAirQuality,
  reverseGeocode,
  processWeatherData,
  getWeatherTheme,
} from './utils/weather';
import './App.css';

// ── Skeleton loader ────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading weather data">
      <div className="skeleton__hero">
        <div className="skeleton__line skeleton__line--xl" />
        <div className="skeleton__line skeleton__line--md" />
        <div className="skeleton__line skeleton__line--lg" />
      </div>
      <div className="skeleton__strip">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="skeleton__card" key={i} />
        ))}
      </div>
      <div className="skeleton__rows">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="skeleton__row" key={i} />
        ))}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [theme, setTheme] = useState('default');
  const [units, setUnits] = useState('celsius');
  const [aqiData, setAqiData] = useState(null);
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ws_recent') || '[]');
    } catch {
      return [];
    }
  });

  // ── Persist recent searches (with rich metadata) ─────────
  const addRecent = useCallback((location) => {
    setRecentSearches((prev) => {
      const item =
        typeof location === 'string'
          ? { name: location, country: '', country_code: '' }
          : {
              name: location.name || location.city || location.place,
              place: location.place || location.name || location.city,
              district: location.district || location.admin2 || '',
              state: location.state || location.admin1 || '',
              country: location.country || '',
              admin1: location.admin1 || location.state || '',
              admin2: location.admin2 || location.district || '',
              country_code: location.country_code || '',
              latitude: location.latitude,
              longitude: location.longitude,
            };
      const filtered = prev.filter((s) => {
        const sName = typeof s === 'string' ? s : s.name;
        return sName?.toLowerCase() !== item.name?.toLowerCase();
      });
      const next = [item, ...filtered].slice(0, 6);
      localStorage.setItem('ws_recent', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleRemoveRecent = useCallback((nameToRemove) => {
    setRecentSearches((prev) => {
      const next = prev.filter((s) => {
        const sName = typeof s === 'string' ? s : s.name;
        return sName?.toLowerCase() !== nameToRemove?.toLowerCase();
      });
      localStorage.setItem('ws_recent', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleClearRecent = useCallback(() => {
    localStorage.removeItem('ws_recent');
    setRecentSearches([]);
  }, []);

  // ── Fetch & process helper ──────────────────────────────
  const loadWeather = useCallback(
    async (location) => {
      const api = await fetchWeatherData(location.latitude, location.longitude);
      const processed = processWeatherData(api, location);
      setWeatherData(processed);
      setTheme(
        getWeatherTheme(api.current_weather.weathercode, api.current_weather.is_day),
      );
      addRecent(location);

      // Concurrently fetch live air quality data
      fetchAirQuality(location.latitude, location.longitude).then((aqi) => {
        setAqiData(aqi);
      });
    },
    [addRecent],
  );

  // ── Search by text ──────────────────────────────────────
  const handleSearch = useCallback(
    async (query) => {
      setLoading(true);
      setError('');
      setWeatherData(null);
      try {
        const results = await searchCities(query);
        if (!results.length) {
          setError(`City "${query}" not found. Please check spelling or try a nearby city.`);
          setLoading(false);
          return;
        }
        await loadWeather(results[0]);
      } catch {
        setError('Something went wrong. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    },
    [loadWeather],
  );

  // ── Select from autocomplete / quick pick ─────────────────
  const handleSelectSuggestion = useCallback(
    async (suggestion) => {
      if (suggestion.latitude != null && suggestion.longitude != null) {
        setLoading(true);
        setError('');
        setWeatherData(null);
        try {
          await loadWeather(suggestion);
        } catch {
          setError('Failed to fetch weather. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        handleSearch(suggestion.name || suggestion);
      }
    },
    [loadWeather, handleSearch],
  );

  // ── Geolocation ─────────────────────────────────────────
  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setError('');
    setWeatherData(null);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const location = await reverseGeocode(coords.latitude, coords.longitude);
          await loadWeather(location);
        } catch {
          setError('Failed to get weather for your location.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Location access was denied.');
        setLoading(false);
      },
      { timeout: 10000 },
    );
  }, [loadWeather]);

  // ── Select from map coordinates ─────────────────────────
  const handleMapSelectCoordinates = useCallback(
    async (lat, lon) => {
      setLoading(true);
      setError('');
      try {
        const location = await reverseGeocode(lat, lon);
        await loadWeather(location);
      } catch {
        const fallback = {
          name: `Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
          country: '',
          latitude: lat,
          longitude: lon,
        };
        await loadWeather(fallback);
      } finally {
        setLoading(false);
      }
    },
    [loadWeather],
  );

  // ── Auto-load default city on mount ─────────────────────
  useEffect(() => {
    const initial = recentSearches[0] || {
      name: 'Chennai',
      country: 'India',
      country_code: 'IN',
      latitude: 13.0878,
      longitude: 80.2785,
    };
    handleSelectSuggestion(initial);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toggle units ────────────────────────────────────────
  const toggleUnits = () => setUnits((u) => (u === 'celsius' ? 'fahrenheit' : 'celsius'));

  const activeLocation = weatherData?.location || {
    city: 'Chennai',
    name: 'Chennai',
    place: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    country: 'India',
    country_code: 'IN',
    latitude: 13.0878,
    longitude: 80.2785,
  };

  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [mapTab, setMapTab] = useState('map');

  // ── Toggle Web Audio nature soundscape ──────────────────
  const handleToggleAudio = () => {
    const next = toggleAudioAmbience(
      weatherData?.current?.weatherCode || 0,
      weatherData?.current?.isDay ?? 1,
    );
    setAudioEnabled(next);
  };

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="app" data-theme={theme}>
      {/* Interactive Atmospheric Weather Canvas (Rain, Snow, Thunder, Sunbeams) */}
      <AtmosphericParticles
        weatherCode={weatherData?.current?.weatherCode}
        isDay={weatherData?.current?.isDay}
        enabled={particlesEnabled}
      />

      {/* Ambient floating blobs */}
      <div className="app__ambient" aria-hidden="true" />

      {/* Apple-style Top Bar */}
      <header className="apple-header">
        <div className="apple-header__brand">
          <span className="apple-header__logo-icon">⛅</span>
          <span className="apple-header__title">Weather</span>
        </div>
        <div className="apple-header__actions">
          {/* Audio Nature Soundscape Toggle */}
          <button
            type="button"
            className={`apple-pill-btn${audioEnabled ? ' apple-pill-btn--active' : ''}`}
            onClick={handleToggleAudio}
            title={audioEnabled ? 'Mute soothing weather nature soundscape' : 'Listen to soothing procedural weather soundscape'}
          >
            {audioEnabled ? '🔊 Sound ON' : '🎧 Sound OFF'}
          </button>

          {/* Visual Particles Toggle */}
          <button
            type="button"
            className={`apple-pill-btn${particlesEnabled ? ' apple-pill-btn--active' : ''}`}
            onClick={() => setParticlesEnabled((p) => !p)}
            title={particlesEnabled ? 'Turn off atmospheric ambient particles' : 'Turn on atmospheric ambient particles'}
          >
            {particlesEnabled ? '✨ Effects ON' : '✨ Effects OFF'}
          </button>

          {/* Side-by-Side City Comparison Modal Trigger */}
          <button
            type="button"
            className="apple-pill-btn"
            onClick={() => setIsCompareOpen(true)}
            title="Compare this city with any second city side by side"
          >
            ⚖️ Compare
          </button>

          {/* Temperature Units Toggle */}
          <div className="apple-segmented-toggle" role="group" aria-label="Temperature Units">
            <button
              type="button"
              className={`apple-seg-btn${units === 'celsius' ? ' apple-seg-btn--active' : ''}`}
              onClick={() => setUnits('celsius')}
            >
              °C
            </button>
            <button
              type="button"
              className={`apple-seg-btn${units === 'fahrenheit' ? ' apple-seg-btn--active' : ''}`}
              onClick={() => setUnits('fahrenheit')}
            >
              °F
            </button>
          </div>
        </div>
      </header>

      {/* Severe Weather Emergency Warning Banner (Apple Style) */}
      <SevereWeatherAlert weatherData={weatherData} />

      {/* Search Bar (iOS Spotlight Style) */}
      <SearchBar
        onSearch={handleSearch}
        onSelectSuggestion={handleSelectSuggestion}
        onGeolocate={handleGeolocate}
        recentSearches={recentSearches}
        onRemoveRecent={handleRemoveRecent}
        onClearRecent={handleClearRecent}
        onClearError={() => setError('')}
        loading={loading}
      />

      {/* Pinned Favorites Quick-Switch Bar */}
      <FavoritesBar
        activeLocation={activeLocation}
        onSelectLocation={handleSelectSuggestion}
      />

      {/* Apple Centered Hero Weather Display */}
      {weatherData && !loading && (
        <CurrentWeather data={weatherData} units={units} />
      )}

      {/* Error Banner */}
      {error && (
        <p id="error-message" className="error-banner" role="alert">
          {error}
        </p>
      )}

      {/* Loading skeleton */}
      {loading && <SkeletonLoader />}

      {/* ── Apple Bento Grid Dashboard ── */}
      {weatherData && !loading && (
        <main className="apple-dashboard">
          {/* Left Column: Forecast & Regional News */}
          <div className="apple-dashboard__col apple-dashboard__col--primary">
            {/* 24-Hour Interactive Scrubbable Radial Chart */}
            <InteractiveHourlyChart hours={weatherData.hourly} units={units} />

            {/* 7-Day Forecast with temperature range gradient bars & Today's dot */}
            <DailyForecast
              days={weatherData.daily}
              units={units}
              currentTemp={weatherData.current?.temperature}
            />

            {/* Smart Lifestyle, Outfit & Activity Advisor */}
            <LifestyleAdvisor weatherData={weatherData} aqiData={aqiData} />

            {/* Regional Weather News Feed (Place, District, State, National) */}
            <WeatherNewsFeed
              key={`${activeLocation.city}||${activeLocation.district}||${activeLocation.state}||${activeLocation.country}`}
              location={activeLocation}
              weatherData={weatherData}
            />
          </div>

          {/* Right Column: Geo Explorer, Sun/Moon, Air Quality, Bento Metrics */}
          <div className="apple-dashboard__col apple-dashboard__col--secondary">
            {/* Geo Explorer with Apple Segmented Control */}
            <div className="apple-card geo-card" aria-label="Interactive Maps and Globe">
              <div className="geo-card__top">
                <div className="apple-card__header" style={{ marginBottom: 0 }}>
                  <span className="apple-card__title">
                    {mapTab === 'map' ? '🗺️ PRECIPITATION & RADAR MAP' : '🌐 3D EARTH GLOBE'}
                  </span>
                </div>
                <div className="apple-segmented-toggle" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mapTab === 'map'}
                    className={`apple-seg-btn${mapTab === 'map' ? ' apple-seg-btn--active' : ''}`}
                    onClick={() => setMapTab('map')}
                  >
                    🗺️ Map
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mapTab === 'globe'}
                    className={`apple-seg-btn${mapTab === 'globe' ? ' apple-seg-btn--active' : ''}`}
                    onClick={() => setMapTab('globe')}
                  >
                    🌐 3D Globe
                  </button>
                </div>
              </div>

              <div className="geo-card__body">
                {mapTab === 'map' ? (
                  <WeatherMap
                    location={activeLocation}
                    weatherData={weatherData}
                    onSelectCoordinates={handleMapSelectCoordinates}
                    onGeolocate={handleGeolocate}
                    loading={loading}
                  />
                ) : (
                  <GlobeViewer location={activeLocation} weatherData={weatherData} />
                )}
              </div>
            </div>

            {/* Celestial Sun and Moon Arc Tracker */}
            <SunMoonArc
              sunrise={weatherData.sunrise}
              sunset={weatherData.sunset}
              isDay={weatherData.current?.isDay}
            />

            {/* Air Quality Index Card */}
            <AirQualityCard aqiData={aqiData} />

            {/* Apple Bento 2x4 Weather Details Grid */}
            <MetricsGrid
              current={weatherData.current}
              sunrise={weatherData.sunrise}
              sunset={weatherData.sunset}
              units={units}
            />
          </div>
        </main>
      )}

      {/* Side-by-Side City Comparison Modal */}
      <CityCompareModal
        currentLocation={activeLocation}
        currentWeather={weatherData}
        currentAqi={aqiData}
        units={units}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />

      {/* Empty state */}
      {!weatherData && !loading && !error && (
        <div className="empty-state">
          <span className="empty-state__icon">🌍</span>
          <p className="empty-state__text">
            Search a city or use your location to see the forecast
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="app__footer">
        Powered by <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · Apple Weather Design
      </footer>
    </div>
  );
}
