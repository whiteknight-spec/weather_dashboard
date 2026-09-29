import { getWeatherInfo, convertTemp, convertWind, tempUnit, windUnit } from '../utils/weather';

/**
 * Hero section showing the current conditions —
 * large temperature, condition, feels-like, wind, and sunrise/sunset.
 */
export default function CurrentWeather({ data, units }) {
  const { location, current, daily } = data;
  const info = getWeatherInfo(current.weatherCode, current.isDay);

  const temp      = convertTemp(current.temperature, units);
  const feels     = convertTemp(current.feelsLike, units);
  const wind      = convertWind(current.windSpeed, units);
  const tUnit     = tempUnit(units);
  const wUnit     = windUnit(units);

  const today = daily?.[0];
  const hi = today ? convertTemp(today.tempMax, units) : null;
  const lo = today ? convertTemp(today.tempMin, units) : null;

  const district = location.district && location.district.toLowerCase() !== location.city.toLowerCase()
    ? location.district
    : null;
  const state = location.state && location.state.toLowerCase() !== location.city.toLowerCase()
    ? location.state
    : null;
  const country = location.country || '';

  const subtitleParts = [district, state, country].filter(Boolean);
  const subtitle = subtitleParts.join(', ');

  return (
    <section className="apple-hero" aria-label="Current weather">
      <div className="apple-hero__location">
        <h2 className="apple-hero__city">{location.city}</h2>
        {subtitle && (
          <p className="apple-hero__hierarchy">
            {district ? <span className="apple-hero__district-tag">{district}</span> : null}
            {state && state !== district ? <span>{state}</span> : null}
            {country && <span>{country}</span>}
          </p>
        )}
      </div>

      <div className="apple-hero__temp-group">
        <div className="apple-hero__temp-wrap">
          <span className="apple-hero__temp">{temp}</span>
          <span className="apple-hero__degree">°</span>
        </div>
        <span className="apple-hero__icon" role="img" aria-label={info.description}>
          {info.icon}
        </span>
      </div>

      <p className="apple-hero__condition">{info.description}</p>

      {(hi != null && lo != null) && (
        <div className="apple-hero__hilo">
          <span className="apple-hero__hilo-item">H: {hi}°</span>
          <span className="apple-hero__hilo-dot">·</span>
          <span className="apple-hero__hilo-item">L: {lo}°</span>
          <span className="apple-hero__hilo-dot">·</span>
          <span className="apple-hero__hilo-item">Feels {feels}°</span>
        </div>
      )}
    </section>
  );
}
