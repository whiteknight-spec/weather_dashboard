import { getWeatherInfo, formatDayName, convertTemp, tempUnit } from '../utils/weather';

/**
 * 7-day daily forecast with temperature range bars
 * scaled to the week's overall min/max.
 */
export default function DailyForecast({ days, units, currentTemp }) {
  if (!days || days.length === 0) return null;

  const weekMin = Math.min(...days.map((d) => d.tempMin));
  const weekMax = Math.max(...days.map((d) => d.tempMax));
  const weekRange = weekMax - weekMin || 1;

  // Temperature to color hue mapping for Apple Weather style gradient
  const getTempColor = (t) => {
    if (t < 5) return '#38bdf8';   // cyan
    if (t < 18) return '#22d3ee';  // teal
    if (t < 25) return '#34d399';  // green
    if (t < 30) return '#facc15';  // yellow
    if (t < 36) return '#fb923c';  // orange
    return '#f87171';              // red
  };

  return (
    <section className="apple-card daily-forecast" aria-label="7-day forecast">
      <div className="apple-card__header">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="apple-card__title">7-DAY FORECAST</span>
      </div>

      <div className="daily__list">
        {days.map((day, i) => {
          const info = getWeatherInfo(day.weatherCode);
          const leftPct  = ((day.tempMin - weekMin) / weekRange) * 100;
          const widthPct = Math.max(((day.tempMax - day.tempMin) / weekRange) * 100, 8);

          const minColor = getTempColor(day.tempMin);
          const maxColor = getTempColor(day.tempMax);

          // Position of current temperature dot on Today's bar
          let dotPct = null;
          if (i === 0 && currentTemp != null) {
            const clamped = Math.max(day.tempMin, Math.min(day.tempMax, currentTemp));
            const dayRange = day.tempMax - day.tempMin || 1;
            dotPct = ((clamped - day.tempMin) / dayRange) * 100;
          }

          return (
            <div className="daily__row" key={day.date} style={{ animationDelay: `${i * 50}ms` }}>
              <span className="daily__day">{formatDayName(day.date, i)}</span>
              <span className="daily__icon" role="img" aria-label={info.description}>
                {info.icon}
              </span>
              <span className="daily__lo">{convertTemp(day.tempMin, units)}°</span>
              <div className="daily__bar-track">
                <div
                  className="daily__bar"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${minColor}, ${maxColor})`,
                  }}
                >
                  {dotPct != null && (
                    <span
                      className="daily__current-dot"
                      style={{ left: `${dotPct}%` }}
                      title={`Current: ${convertTemp(currentTemp, units)}°`}
                    />
                  )}
                </div>
              </div>
              <span className="daily__hi">{convertTemp(day.tempMax, units)}°</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
