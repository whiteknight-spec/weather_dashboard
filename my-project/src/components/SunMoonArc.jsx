import { useMemo } from 'react';

// Calculate approximate moon phase from date
function getMoonPhase(date = new Date()) {
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();

  let c = 0;
  let e = 0;
  let jd = 0;
  let b = 0;

  if (month < 3) {
    year--;
    month += 12;
  }

  ++month;
  c = 365.25 * year;
  e = 30.6 * month;
  jd = c + e + day - 694039.09; // jd is total days elapsed
  jd /= 29.5305882; // divide by the moon cycle
  b = parseInt(jd); // int(jd) -> b, take integer part of jd
  jd -= b; // subtract integer part to leave fractional part of original jd
  b = Math.round(jd * 8); // scale fraction from 0-8 and round

  if (b >= 8) b = 0; // 0 and 8 are the same so turn 8 into 0

  const phases = [
    { name: 'New Moon', icon: '🌑', illumination: '0%' },
    { name: 'Waxing Crescent', icon: '🌒', illumination: '25%' },
    { name: 'First Quarter', icon: '🌓', illumination: '50%' },
    { name: 'Waxing Gibbous', icon: '🌔', illumination: '75%' },
    { name: 'Full Moon', icon: '🌕', illumination: '100%' },
    { name: 'Waning Gibbous', icon: '🌖', illumination: '75%' },
    { name: 'Last Quarter', icon: '🌗', illumination: '50%' },
    { name: 'Waning Crescent', icon: '🌘', illumination: '25%' },
  ];

  return phases[b] || phases[0];
}

export default function SunMoonArc({ sunrise = '06:00', sunset = '18:30', isDay = 1 }) {
  const moon = useMemo(() => getMoonPhase(new Date()), []);

  // Compute position of sun on arc (0 to 1)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseTime = (str) => {
    try {
      const [h, m] = str.split(':').map(Number);
      return h * 60 + (m || 0);
    } catch {
      return 360;
    }
  };

  const riseMin = parseTime(sunrise);
  const setMin = parseTime(sunset);
  const totalDay = Math.max(1, setMin - riseMin);

  let sunProgress = 0;
  let countdownText = '';

  if (currentMinutes < riseMin) {
    sunProgress = 0;
    const diff = riseMin - currentMinutes;
    countdownText = `Sunrise in ${Math.floor(diff / 60)}h ${diff % 60}m`;
  } else if (currentMinutes > setMin) {
    sunProgress = 1;
    countdownText = `Sunset was ${Math.floor((currentMinutes - setMin) / 60)}h ago`;
  } else {
    sunProgress = (currentMinutes - riseMin) / totalDay;
    const diff = setMin - currentMinutes;
    countdownText = `${Math.floor(diff / 60)}h ${diff % 60}m of daylight remaining`;
  }

  // Arc path math (semicircle from 20,90 to 220,90 with radius 100)
  const radius = 90;
  const cx = 120;
  const cy = 100;
  const angle = Math.PI - sunProgress * Math.PI; // from PI (left) to 0 (right)
  const sunX = cx + radius * Math.cos(angle);
  const sunY = cy - radius * Math.sin(angle);

  return (
    <section className="apple-card sun-moon-card" aria-label="Sun and Moon Celestial Tracking">
      <div className="apple-card__header">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
        </svg>
        <span className="apple-card__title">SUN & MOON CELESTIAL POSITION</span>
      </div>

      <div className="sun-moon__body">
        {/* Left: Animated Solar Arc */}
        <div className="sun-arc__container">
          <svg viewBox="0 0 240 120" className="sun-arc__svg">
            <defs>
              <linearGradient id="arcGlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Dotted Horizon Line */}
            <line x1="15" y1="100" x2="225" y2="100" stroke="rgba(255, 255, 255, 0.15)" strokeDasharray="3 3" />

            {/* Inactive Arc Base */}
            <path
              d="M 30 100 A 90 90 0 0 1 210 100"
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="3"
            />

            {/* Active Solar Path */}
            <path
              d={`M 30 100 A 90 90 0 0 1 ${sunX} ${sunY}`}
              fill="none"
              stroke="url(#arcGlow)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Glowing Sun Orb */}
            <circle cx={sunX} cy={sunY} r="7" fill="#fbbf24" filter="drop-shadow(0 0 8px #f59e0b)" />
            <circle cx={sunX} cy={sunY} r="3" fill="#ffffff" />
          </svg>

          <div className="sun-arc__times">
            <div className="sun-time">
              <span className="sun-time__label">Sunrise</span>
              <span className="sun-time__val">{sunrise}</span>
            </div>
            <div className="sun-time">
              <span className="sun-time__label">Sunset</span>
              <span className="sun-time__val">{sunset}</span>
            </div>
          </div>
          <p className="sun-arc__countdown">{countdownText}</p>
        </div>

        {/* Right: Moon Phase Card */}
        <div className="moon-phase__widget">
          <div className="moon-phase__icon-wrap">
            <span className="moon-phase__emoji">{moon.icon}</span>
          </div>
          <div className="moon-phase__info">
            <span className="moon-phase__name">{moon.name}</span>
            <span className="moon-phase__illum">{moon.illumination} Illuminated</span>
          </div>
        </div>
      </div>
    </section>
  );
}
