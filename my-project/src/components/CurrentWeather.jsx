import { getWeatherInfo, convertTemp, convertWind, tempUnit, windUnit } from '../utils/weather';

/**
 * Hero section showing the current conditions —
 * large temperature, condition, feels-like, wind, and sunrise/sunset.
 */
export default function CurrentWeather({ data, units }) {
  const { location, current, sunrise, sunset } = data;
  const info = getWeatherInfo(current.weatherCode, current.isDay);

  const temp      = convertTemp(current.temperature, units);
  const feels     = convertTemp(current.feelsLike, units);
  const wind      = convertWind(current.windSpeed, units);
  const tUnit     = tempUnit(units);
  const wUnit     = windUnit(units);

  return (
    <section className="current" aria-label="Current weather">
      {/* Left: location + condition */}
      <div className="current__info">
        <h2 className="current__city">{location.city}</h2>
        <p className="current__country">{location.country}</p>
        <p className="current__condition">{info.description}</p>

        <div className="current__meta">
          <span>Feels like {feels}{tUnit}</span>
          <span className="current__meta-dot">·</span>
          <span>Wind {wind} {wUnit}</span>
        </div>

        <div className="current__sun">
          <span className="current__sun-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
            {sunrise}
          </span>
          <span className="current__sun-item">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            {sunset}
          </span>
        </div>
      </div>

      {/* Right: big temp + icon */}
      <div className="current__hero">
        <span className="current__icon" role="img" aria-label={info.description}>
          {info.icon}
        </span>
        <div className="current__temp-wrap">
          <span className="current__temp">{temp}</span>
          <span className="current__temp-unit">{tUnit}</span>
        </div>
      </div>
    </section>
  );
}
