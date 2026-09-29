import { getWindDirection, getUvLevel } from '../utils/weather';

/**
 * 2×3 detail-metric cards — humidity, UV index, pressure,
 * visibility, precipitation probability, and wind direction.
 */
export default function MetricsGrid({ current, sunrise, sunset, units = 'celsius' }) {
  if (!current) return null;

  const uvInfo = getUvLevel(current.uvIndex);
  const visKm = (current.visibility / 1000).toFixed(1);
  const windDir = getWindDirection(current.windDirection);

  // Dew point approximation: T - ((100 - RH) / 5)
  const dewPoint = Math.round(current.temperature - (100 - current.humidity) / 5);

  const bentoCards = [
    {
      title: 'UV INDEX',
      icon: '☀️',
      val: `${Math.round(current.uvIndex)}`,
      unit: '',
      level: uvInfo.level,
      levelColor: uvInfo.color,
      desc: current.uvIndex <= 2 ? 'Low for the rest of the day.' : current.uvIndex <= 5 ? 'Moderate. Wear sunglasses on bright days.' : 'Very high. Seek shade during midday.',
    },
    {
      title: 'WIND',
      icon: '💨',
      val: `${Math.round(current.windSpeed)}`,
      unit: 'km/h',
      level: `${windDir} (${Math.round(current.windDirection)}°)`,
      desc: current.windSpeed > 35 ? 'Strong gusty winds present.' : 'Gentle to moderate atmospheric breeze.',
    },
    {
      title: 'SUNSET & SUNRISE',
      icon: '🌅',
      val: current.isDay ? (sunset || '18:15') : (sunrise || '06:10'),
      unit: '',
      level: current.isDay ? 'Sunset' : 'Sunrise',
      desc: current.isDay ? `Sunrise was at ${sunrise || '06:10'}` : `Sunset was at ${sunset || '18:15'}`,
    },
    {
      title: 'HUMIDITY',
      icon: '💧',
      val: `${Math.round(current.humidity)}`,
      unit: '%',
      level: current.humidity > 70 ? 'High Moisture' : current.humidity < 35 ? 'Dry Air' : 'Comfortable',
      desc: `The dew point is ${dewPoint}° right now.`,
    },
    {
      title: 'FEELS LIKE',
      icon: '🌡️',
      val: `${Math.round(current.feelsLike)}`,
      unit: '°',
      level: Math.abs(current.feelsLike - current.temperature) < 1 ? 'Similar to actual' : current.feelsLike > current.temperature ? 'Warmer due to humidity' : 'Cooler due to wind',
      desc: `Actual temperature is ${Math.round(current.temperature)}°.`,
    },
    {
      title: 'VISIBILITY',
      icon: '👁️',
      val: `${visKm}`,
      unit: 'km',
      level: current.visibility >= 9000 ? 'Clear' : current.visibility >= 5000 ? 'Moderate' : 'Haze / Mist',
      desc: current.visibility >= 9000 ? 'Perfectly clear view across the horizon.' : 'Slight haze or atmospheric dust.',
    },
    {
      title: 'PRESSURE',
      icon: '⏲️',
      val: `${Math.round(current.pressure)}`,
      unit: 'hPa',
      level: current.pressure > 1013 ? 'High' : 'Normal',
      desc: 'Atmospheric pressure is steady.',
    },
    {
      title: 'PRECIPITATION',
      icon: '🌧️',
      val: `${Math.round(current.precipProbability)}`,
      unit: '%',
      level: current.precipProbability > 60 ? 'Rain Likely' : current.precipProbability > 20 ? 'Isolated Showers' : 'Dry Conditions',
      desc: current.precipProbability > 0 ? 'Rain expected in next few hours.' : 'No precipitation expected in the near term.',
    },
  ];

  return (
    <section className="apple-bento-grid" aria-label="Weather metrics">
      {bentoCards.map((card, i) => (
        <div className="apple-card bento-card" key={card.title} style={{ animationDelay: `${i * 40}ms` }}>
          <div className="apple-card__header">
            <span className="bento-card__icon">{card.icon}</span>
            <span className="apple-card__title">{card.title}</span>
          </div>

          <div className="bento-card__val-row">
            <span className="bento-card__val">{card.val}</span>
            {card.unit && <span className="bento-card__unit">{card.unit}</span>}
          </div>

          {card.level && (
            <div className="bento-card__level" style={card.levelColor ? { color: card.levelColor } : undefined}>
              {card.level}
            </div>
          )}

          <p className="bento-card__desc">{card.desc}</p>
        </div>
      ))}
    </section>
  );
}
