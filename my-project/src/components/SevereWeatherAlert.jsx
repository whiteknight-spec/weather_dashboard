import { useState } from 'react';

export default function SevereWeatherAlert({ weatherData }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!weatherData || dismissed) return null;

  const { current, location } = weatherData;
  const code = current.weatherCode;
  const wind = current.windSpeed;
  const temp = current.temperature;
  const rainProb = current.precipProbability;
  const place = location.place || location.city || 'your area';
  const region = [location.district, location.state].filter(Boolean).join(', ');

  let alert = null;

  // 1. Thunderstorm & Hail
  if ([95, 96, 99].includes(code)) {
    alert = {
      level: 'danger',
      badge: '🚨 Severe Thunderstorm Warning',
      headline: `Thunderstorm & Electrical Lightning Active over ${place}`,
      description: `Meteorological radars report convective thunderstorm cells over ${place}${region ? ` (${region})` : ''}. Sudden lightning strikes, wind gusts, and localized hail are expected.`,
      precautions: [
        'Seek shelter in an enclosed, sturdy building immediately.',
        'Avoid tall trees, utility poles, and open elevated grounds.',
        'Unplug delicate electronic appliances and stay clear of corded devices.',
      ],
    };
  }
  // 2. Torrential / Violent Rainfall
  else if ([65, 67, 82].includes(code) || (rainProb >= 85 && current.humidity > 85)) {
    alert = {
      level: 'warning',
      badge: '🌧️ Heavy Rainfall & Waterlogging Alert',
      headline: `Heavy Precipitation & Flash Flood Risk near ${place}`,
      description: `Persistent heavy showers have elevated waterlogging risks across low-lying roads and agricultural areas in ${place}${region ? ` (${region})` : ''}.`,
      precautions: [
        'Avoid traveling through flooded underpasses and waterlogged roads.',
        'Keep emergency battery lights and power backups ready.',
        'Keep livestock and vehicles on elevated ground.',
      ],
    };
  }
  // 3. High Gale / Wind Hazard
  else if (wind >= 45) {
    alert = {
      level: 'warning',
      badge: '💨 High Wind Advisory',
      headline: `Damaging Winds of ${Math.round(wind)} km/h Detected`,
      description: `High atmospheric pressure gradient is producing gusty winds over ${place}${region ? ` (${region})` : ''}. Minor structural damage and tree fall hazards possible.`,
      precautions: [
        'Secure outdoor loose items, awnings, and rooftop furniture.',
        'Exercise extreme caution while driving high-profile vehicles.',
        'Stay clear of old walls, tin sheets, and overhead cables.',
      ],
    };
  }
  // 4. Extreme Heatwave
  else if (temp >= 40) {
    alert = {
      level: 'caution',
      badge: '🌡️ Severe Heatwave Warning',
      headline: `Extreme Heat Alert: Temperature Reached ${Math.round(temp)}°C`,
      description: `Severe heatwave conditions prevail over ${place}${region ? ` (${region})` : ''}. Risk of heat exhaustion and heatstroke is elevated during afternoon hours.`,
      precautions: [
        'Stay indoors between 12:00 PM and 4:00 PM.',
        'Drink plenty of oral rehydration fluids, water, and buttermilk.',
        'Never leave children or pets inside parked vehicles.',
      ],
    };
  }
  // 5. Extreme Coldwave
  else if (temp <= 4) {
    alert = {
      level: 'info',
      badge: '❄️ Coldwave & Frost Advisory',
      headline: `Near-Freezing Temperatures (${Math.round(temp)}°C) in ${place}`,
      description: `Intense cold air advection is lowering night-time temperatures across ${place}${region ? ` (${region})` : ''}. Dense ground fog and frost may affect visibility.`,
      precautions: [
        'Wear multiple thermal layers before stepping outdoors.',
        'Check tire pressure and drive with fog lights during night and early dawn.',
        'Ensure warm shelter for elderly family members and pets.',
      ],
    };
  }

  if (!alert) return null;

  return (
    <aside className={`severe-alert severe-alert--${alert.level}`} role="alert" aria-live="assertive">
      <div className="severe-alert__main">
        <span className="severe-alert__beacon" aria-hidden="true" />
        <div className="severe-alert__content">
          <div className="severe-alert__badge-row">
            <span className="severe-alert__badge">{alert.badge}</span>
            <span className="severe-alert__target">
              📍 {place}{region ? ` · ${region}` : ''}
            </span>
          </div>
          <p className="severe-alert__headline">{alert.headline}</p>
          {expanded && <p className="severe-alert__desc">{alert.description}</p>}
        </div>

        <div className="severe-alert__actions">
          <button
            type="button"
            className="severe-alert__expand-btn"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            {expanded ? '▲ Hide Tips' : '▼ Safety Precautions'}
          </button>
          <button
            type="button"
            className="severe-alert__close"
            onClick={() => setDismissed(true)}
            title="Dismiss this alert"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      </div>

      {expanded && (
        <div className="severe-alert__drawer">
          <h4 className="severe-alert__drawer-title">Recommended Safety Precautions:</h4>
          <ul className="severe-alert__precautions">
            {alert.precautions.map((tip, idx) => (
              <li key={idx}>✓ {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
