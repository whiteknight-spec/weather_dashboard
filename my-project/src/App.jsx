import { useState } from 'react';
import './App.css';

/**
 * Geocode a city name via the Open-Meteo Geocoding API.
 * Returns the first matching result or null.
 */
async function geocodeCity(cityName) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cityName
  )}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding request failed');
  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;
  return data.results[0];
}

/**
 * Fetch current weather for given coordinates from Open-Meteo.
 */
async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather request failed');
  return res.json();
}

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weather, setWeather] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setWeather(null);

    try {
      const geo = await geocodeCity(trimmed);
      if (!geo) {
        setError(`City "${trimmed}" not found. Please try another name.`);
        setLoading(false);
        return;
      }

      const data = await fetchWeather(geo.latitude, geo.longitude);
      setWeather({
        city: geo.name,
        country: geo.country ?? '',
        latitude: geo.latitude,
        longitude: geo.longitude,
        temperature: data.current_weather.temperature,
        windSpeed: data.current_weather.windspeed,
      });
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard">
      {/* ── Header ──────────────────────────────────── */}
      <header className="dashboard__header">
        <h1 className="dashboard__title">Weather Dashboard</h1>
        <p className="dashboard__subtitle">
          Search any city for real-time conditions
        </p>
      </header>

      {/* ── Search ──────────────────────────────────── */}
      <form className="search-form" onSubmit={handleSearch}>
        <input
          id="city-input"
          className="search-form__input"
          type="text"
          placeholder="Enter a city name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        <button
          id="search-btn"
          className="search-form__btn"
          type="submit"
          disabled={loading || !query.trim()}
        >
          Search
        </button>
      </form>

      {/* ── Loading ─────────────────────────────────── */}
      {loading && (
        <div className="loading" role="status">
          <div className="loading__spinner" />
          <p className="loading__text">Fetching weather data…</p>
        </div>
      )}

      {/* ── Error ───────────────────────────────────── */}
      {error && (
        <p id="error-message" className="error" role="alert">
          {error}
        </p>
      )}

      {/* ── Weather Card ────────────────────────────── */}
      {weather && (
        <section className="weather-card" aria-label="Weather results">
          <h2 className="weather-card__city">
            {weather.city}{weather.country ? `, ${weather.country}` : ''}
          </h2>
          <p className="weather-card__coords">
            {weather.latitude.toFixed(2)}°N, {weather.longitude.toFixed(2)}°E
          </p>

          <div className="weather-card__metrics">
            <div className="metric">
              <p className="metric__label">Temperature</p>
              <p className="metric__value">
                {weather.temperature}
                <span className="metric__unit">°C</span>
              </p>
            </div>
            <div className="metric">
              <p className="metric__label">Wind Speed</p>
              <p className="metric__value">
                {weather.windSpeed}
                <span className="metric__unit"> km/h</span>
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
