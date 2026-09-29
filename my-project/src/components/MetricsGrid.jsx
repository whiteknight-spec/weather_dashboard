import { getWindDirection, getUvLevel } from '../utils/weather';

/**
 * 2×3 detail-metric cards — humidity, UV index, pressure,
 * visibility, precipitation probability, and wind direction.
 */
export default function MetricsGrid({ current }) {
  const uvInfo = getUvLevel(current.uvIndex);
  const visMiles = (current.visibility / 1000).toFixed(1);
  const windDir = getWindDirection(current.windDirection);

  const metrics = [
    {
      icon: '💧',
      label: 'Humidity',
      value: `${Math.round(current.humidity)}`,
      unit: '%',
      extra: current.humidity > 70 ? 'High' : current.humidity < 30 ? 'Low' : 'Normal',
    },
    {
      icon: '☀️',
      label: 'UV Index',
      value: `${Math.round(current.uvIndex)}`,
      unit: '',
      extra: uvInfo.level,
      extraColor: uvInfo.color,
    },
    {
      icon: '🌡️',
      label: 'Pressure',
      value: `${Math.round(current.pressure)}`,
      unit: 'hPa',
    },
    {
      icon: '👁️',
      label: 'Visibility',
      value: visMiles,
      unit: 'km',
    },
    {
      icon: '🌧️',
      label: 'Precipitation',
      value: `${Math.round(current.precipProbability)}`,
      unit: '%',
      extra: current.precipProbability > 60 ? 'Likely' : current.precipProbability > 30 ? 'Possible' : 'Unlikely',
    },
    {
      icon: '🧭',
      label: 'Wind Direction',
      value: windDir,
      unit: '',
      extra: `${Math.round(current.windDirection)}°`,
    },
  ];

  return (
    <section className="metrics" aria-label="Weather details">
      <h3 className="section-title">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M6 20V4M18 20v-6"/></svg>
        Weather Details
      </h3>

      <div className="metrics__grid">
        {metrics.map((m, i) => (
          <div className="metrics__card" key={m.label} style={{ animationDelay: `${i * 70}ms` }}>
            <span className="metrics__icon">{m.icon}</span>
            <span className="metrics__label">{m.label}</span>
            <div className="metrics__value-row">
              <span className="metrics__value">{m.value}</span>
              {m.unit && <span className="metrics__unit">{m.unit}</span>}
            </div>
            {m.extra && (
              <span className="metrics__extra" style={m.extraColor ? { color: m.extraColor } : undefined}>
                {m.extra}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
