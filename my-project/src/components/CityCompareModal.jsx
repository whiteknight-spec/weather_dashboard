import { useState } from 'react';
import { searchCities, fetchWeatherData, fetchAirQuality, processWeatherData, getWeatherInfo, convertTemp, tempUnit } from '../utils/weather';

export default function CityCompareModal({ currentLocation, currentWeather, currentAqi, units, isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [compareAqi, setCompareAqi] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const tU = tempUnit(units);

  const handleSearchCompare = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    try {
      const results = await searchCities(query.trim());
      if (!results.length) {
        setError(`City "${query}" not found.`);
        setLoading(false);
        return;
      }
      const target = results[0];
      const [wRes, aqiRes] = await Promise.all([
        fetchWeatherData(target.latitude, target.longitude),
        fetchAirQuality(target.latitude, target.longitude),
      ]);
      const processed = processWeatherData(wRes, target);
      setCompareData(processed);
      setCompareAqi(aqiRes);
    } catch {
      setError('Failed to fetch data for comparison.');
    } finally {
      setLoading(false);
    }
  };

  const c1 = currentWeather?.current;
  const c2 = compareData?.current;

  return (
    <div className="compare-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="apple-card compare-modal" onClick={(e) => e.stopPropagation()}>
        <div className="compare-modal__header">
          <div className="apple-card__header" style={{ marginBottom: 0 }}>
            <span className="apple-card__title">⚖️ SIDE-BY-SIDE CITY COMPARISON</span>
          </div>
          <button type="button" className="compare-modal__close" onClick={onClose} aria-label="Close comparison">
            ✕
          </button>
        </div>

        {/* Search for City 2 */}
        <form onSubmit={handleSearchCompare} className="compare-search-form">
          <input
            type="text"
            className="compare-search-input"
            placeholder="Search second city to compare (e.g. Coimbatore, London, Delhi)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="apple-pill-btn apple-pill-btn--active" disabled={loading}>
            {loading ? 'Comparing…' : 'Compare'}
          </button>
        </form>

        {error && <p className="compare-error">{error}</p>}

        {/* Side-by-side display */}
        <div className="compare-grid">
          {/* City 1 (Current) */}
          <div className="compare-col">
            <span className="compare-col__badge">Current Location</span>
            <h3 className="compare-col__title">{currentLocation?.city || currentLocation?.name}</h3>
            <span className="compare-col__country">{currentLocation?.state ? `${currentLocation.state}, ` : ''}{currentLocation?.country}</span>

            {c1 && (
              <div className="compare-col__stats">
                <div className="compare-stat-row">
                  <span>Temperature</span>
                  <strong>{convertTemp(c1.temperature, units)}{tU}</strong>
                </div>
                <div className="compare-stat-row">
                  <span>Condition</span>
                  <strong>{getWeatherInfo(c1.weatherCode, c1.isDay).description}</strong>
                </div>
                <div className="compare-stat-row">
                  <span>Feels Like</span>
                  <strong>{convertTemp(c1.feelsLike, units)}{tU}</strong>
                </div>
                <div className="compare-stat-row">
                  <span>Rain Chance</span>
                  <strong>{c1.precipProbability || 0}%</strong>
                </div>
                <div className="compare-stat-row">
                  <span>Humidity</span>
                  <strong>{Math.round(c1.humidity)}%</strong>
                </div>
                <div className="compare-stat-row">
                  <span>Air Quality</span>
                  <strong>{currentAqi ? `AQI ${Math.round(currentAqi.us_aqi)}` : '--'}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="compare-divider" />

          {/* City 2 (Target) */}
          <div className="compare-col">
            <span className="compare-col__badge compare-col__badge--target">Comparison Target</span>
            {compareData ? (
              <>
                <h3 className="compare-col__title">{compareData.location.city}</h3>
                <span className="compare-col__country">{compareData.location.state ? `${compareData.location.state}, ` : ''}{compareData.location.country}</span>

                {c2 && (
                  <div className="compare-col__stats">
                    <div className="compare-stat-row">
                      <span>Temperature</span>
                      <strong style={{ color: c2.temperature > c1?.temperature ? '#fb923c' : '#38bdf8' }}>
                        {convertTemp(c2.temperature, units)}{tU}
                      </strong>
                    </div>
                    <div className="compare-stat-row">
                      <span>Condition</span>
                      <strong>{getWeatherInfo(c2.weatherCode, c2.isDay).description}</strong>
                    </div>
                    <div className="compare-stat-row">
                      <span>Feels Like</span>
                      <strong>{convertTemp(c2.feelsLike, units)}{tU}</strong>
                    </div>
                    <div className="compare-stat-row">
                      <span>Rain Chance</span>
                      <strong>{c2.precipProbability || 0}%</strong>
                    </div>
                    <div className="compare-stat-row">
                      <span>Humidity</span>
                      <strong>{Math.round(c2.humidity)}%</strong>
                    </div>
                    <div className="compare-stat-row">
                      <span>Air Quality</span>
                      <strong>{compareAqi ? `AQI ${Math.round(compareAqi.us_aqi)}` : '--'}</strong>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="compare-empty">
                <span>🔍</span>
                <p>Type a second city above to compare weather side by side.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
