import { getWeatherInfo, formatDayName, convertTemp, tempUnit } from '../utils/weather';

/**
 * 7-day daily forecast with temperature range bars
 * scaled to the week's overall min/max.
 */
export default function DailyForecast({ days, units }) {
  if (!days || days.length === 0) return null;

  const tU = tempUnit(units);
  const weekMin = Math.min(...days.map((d) => d.tempMin));
  const weekMax = Math.max(...days.map((d) => d.tempMax));
  const weekRange = weekMax - weekMin || 1;

  return (
    <section className="daily" aria-label="7-day forecast">
      <h3 className="section-title">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        7-Day Forecast
      </h3>

      <div className="daily__list">
        {days.map((day, i) => {
          const info = getWeatherInfo(day.weatherCode);
          const leftPct  = ((day.tempMin - weekMin) / weekRange) * 100;
          const widthPct = ((day.tempMax - day.tempMin) / weekRange) * 100;

          return (
            <div className="daily__row" key={day.date} style={{ animationDelay: `${i * 60}ms` }}>
              <span className="daily__day">{formatDayName(day.date, i)}</span>
              <span className="daily__icon">{info.icon}</span>
              <span className="daily__lo">{convertTemp(day.tempMin, units)}°</span>
              <div className="daily__bar-track">
                <div
                  className="daily__bar"
                  style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 6)}%` }}
                />
              </div>
              <span className="daily__hi">{convertTemp(day.tempMax, units)}°</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
