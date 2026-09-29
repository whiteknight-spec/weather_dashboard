import { getAqiCategory } from '../utils/weather';

export default function AirQualityCard({ aqiData }) {
  if (!aqiData) return null;

  const aqi = aqiData.us_aqi;
  const category = getAqiCategory(aqi);

  // Pollutant thresholds for progress bar percentage
  const pollutants = [
    { label: 'PM2.5', value: aqiData.pm2_5, max: 100, unit: 'μg/m³', desc: 'Fine inhalable particles' },
    { label: 'PM10',  value: aqiData.pm10,  max: 150, unit: 'μg/m³', desc: 'Coarse dust & pollen' },
    { label: 'Ozone', value: aqiData.ozone, max: 180, unit: 'μg/m³', desc: 'Ground-level O₃' },
    { label: 'NO₂',   value: aqiData.nitrogen_dioxide, max: 80, unit: 'μg/m³', desc: 'Nitrogen dioxide' },
  ];

  return (
    <section className="aqi-card" aria-label="Air Quality Index">
      <div className="aqi-card__header">
        <div className="aqi-card__title-row">
          <span className="aqi-card__icon">{category.icon}</span>
          <h3 className="section-title" style={{ margin: 0 }}>Air Quality Index (AQI)</h3>
        </div>
        <span
          className="aqi-card__badge"
          style={{ color: category.color, background: category.bg, borderColor: category.color }}
        >
          {category.level}
        </span>
      </div>

      <div className="aqi-card__body">
        {/* Left: Big AQI Gauge Score */}
        <div className="aqi-card__hero">
          <div className="aqi-card__gauge" style={{ '--aqi-color': category.color }}>
            <span className="aqi-card__number">{aqi != null ? Math.round(aqi) : '--'}</span>
            <span className="aqi-card__unit">US AQI</span>
          </div>
          <div className="aqi-card__advice-box" style={{ borderColor: category.color }}>
            <span className="aqi-card__advice-title">Health Recommendation</span>
            <p className="aqi-card__advice-text">{category.advice}</p>
          </div>
        </div>

        {/* Right: Key Pollutants breakdown */}
        <div className="aqi-card__pollutants">
          <div className="aqi-card__pollutant-title">Primary Atmospheric Pollutants</div>
          <div className="aqi-card__pollutant-list">
            {pollutants.map((p) => {
              const val = p.value != null ? Math.round(p.value) : '--';
              const pct = p.value != null ? Math.min(100, Math.round((p.value / p.max) * 100)) : 0;
              return (
                <div key={p.label} className="aqi-card__pollutant-item">
                  <div className="aqi-card__pollutant-info">
                    <span className="aqi-card__pollutant-name">{p.label}</span>
                    <span className="aqi-card__pollutant-val">
                      {val} <small>{p.unit}</small>
                    </span>
                  </div>
                  <div className="aqi-card__progress-track">
                    <div
                      className="aqi-card__progress-bar"
                      style={{
                        width: `${pct}%`,
                        background:
                          pct > 70
                            ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                            : pct > 40
                            ? 'linear-gradient(90deg, #10b981, #f59e0b)'
                            : '#10b981',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
