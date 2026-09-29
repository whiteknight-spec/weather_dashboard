import { getAqiCategory } from '../utils/weather';

export default function AirQualityCard({ aqiData }) {
  if (!aqiData) return null;

  const aqi = aqiData.us_aqi;
  const category = getAqiCategory(aqi);

  // Position of Apple style thumb on 0-300+ scale
  const thumbPercent = Math.max(0, Math.min(100, (aqi / 300) * 100));

  const pollutants = [
    { label: 'PM2.5', value: aqiData.pm2_5, unit: 'μg/m³', max: 60 },
    { label: 'PM10',  value: aqiData.pm10,  unit: 'μg/m³', max: 100 },
    { label: 'Ozone', value: aqiData.ozone, unit: 'μg/m³', max: 120 },
    { label: 'NO₂',   value: aqiData.nitrogen_dioxide, unit: 'μg/m³', max: 50 },
  ];

  return (
    <section className="apple-card aqi-card" aria-label="Air Quality Index">
      <div className="apple-card__header">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span className="apple-card__title">AIR QUALITY</span>
      </div>

      <div className="aqi-card__main">
        <div className="aqi-card__value-row">
          <span className="aqi-card__aqi-num">{aqi != null ? Math.round(aqi) : '--'}</span>
          <span className="aqi-card__level" style={{ color: category.color }}>
            {category.level}
          </span>
        </div>

        {/* Apple Weather Continuous Spectrum Bar */}
        <div className="aqi-card__spectrum-track">
          <div className="aqi-card__spectrum-bar">
            <span
              className="aqi-card__spectrum-thumb"
              style={{ left: `${thumbPercent}%` }}
              title={`AQI ${Math.round(aqi)}`}
            />
          </div>
        </div>

        <p className="aqi-card__advice">{category.advice}</p>

        {/* Mini pollutant pills */}
        <div className="aqi-card__pollutants-grid">
          {pollutants.map((p) => (
            <div key={p.label} className="aqi-card__pollutant-pill">
              <span className="aqi-card__p-name">{p.label}</span>
              <span className="aqi-card__p-val">
                {p.value != null ? Math.round(p.value) : '--'} <small>{p.unit}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
