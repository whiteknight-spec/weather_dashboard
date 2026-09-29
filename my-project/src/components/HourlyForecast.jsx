import { getWeatherInfo, formatHour, convertTemp, tempUnit } from '../utils/weather';

/**
 * Horizontally-scrollable 24-hour forecast strip with an
 * inline SVG temperature curve layered behind the cards.
 */
export default function HourlyForecast({ hours, units }) {
  if (!hours || hours.length === 0) return null;

  const tU = tempUnit(units);

  // ── SVG temperature curve data ──────────────────────────
  const temps = hours.map((h) => h.temperature);
  const minT = Math.min(...temps) - 1;
  const maxT = Math.max(...temps) + 1;
  const rangeT = maxT - minT || 1;

  const cardW = 76;              // matches CSS --card-w
  const chartH = 48;
  const padY = 6;
  const totalW = hours.length * cardW;

  const points = temps.map((t, i) => {
    const x = i * cardW + cardW / 2;
    const y = padY + (1 - (t - minT) / rangeT) * (chartH - padY * 2);
    return [x, y];
  });

  const polyline = points.map((p) => p.join(',')).join(' ');
  const area = `${points[0][0]},${chartH} ${polyline} ${points[points.length - 1][0]},${chartH}`;

  return (
    <section className="apple-card hourly-forecast" aria-label="Hourly forecast">
      <div className="apple-card__header">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="apple-card__title">24-HOUR FORECAST</span>
      </div>

      <div className="hourly__scroll">
        {/* SVG curve behind cards */}
        <svg
          className="hourly__chart"
          viewBox={`0 0 ${totalW} ${chartH}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#hGrad)" />
          <polyline
            points={polyline}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill="var(--accent)" />
          ))}
        </svg>

        {/* Hour cards */}
        <div className="hourly__cards">
          {hours.map((h, i) => {
            const info = getWeatherInfo(h.weatherCode);
            return (
              <div className="hourly__card" key={i}>
                <span className="hourly__time">{i === 0 ? 'Now' : formatHour(h.time)}</span>
                <span className="hourly__card-icon">{info.icon}</span>
                <span className="hourly__card-temp">
                  {convertTemp(h.temperature, units)}{tU}
                </span>
                {h.precipProbability > 0 && (
                  <span className="hourly__precip">
                    💧 {h.precipProbability}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
