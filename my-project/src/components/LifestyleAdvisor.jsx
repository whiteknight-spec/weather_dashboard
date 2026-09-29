export default function LifestyleAdvisor({ weatherData, aqiData }) {
  if (!weatherData) return null;

  const current = weatherData.current;
  const temp = current.temperature;
  const rainProb = current.precipProbability || 0;
  const wind = current.windSpeed;
  const uv = current.uvIndex;
  const aqi = aqiData?.us_aqi;

  // 1. Outfit recommendation
  let outfit = { title: 'T-Shirt & Shorts', desc: 'Warm and comfortable. Lightweight breathable cotton.', icon: '👕' };
  if (temp < 10) {
    outfit = { title: 'Heavy Winter Layers', desc: 'Thick thermal coat, sweater, gloves, and warm socks.', icon: '🧥' };
  } else if (temp < 20) {
    outfit = { title: 'Light Jacket / Hoodie', desc: 'Pleasantly cool. A comfortable jacket or cardigan.', icon: '🧥' };
  } else if (temp > 35) {
    outfit = { title: 'Ultralight Breathable', desc: 'Very hot! Loose linen or cotton, sunglasses & sunhat.', icon: '🩳' };
  }

  // 2. Umbrella recommendation
  let umbrella = { status: 'Not Needed', desc: 'Dry skies ahead. Leave the umbrella at home.', icon: '☀️', color: '#10b981' };
  if (rainProb >= 70 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(current.weatherCode)) {
    umbrella = { status: 'Carry Umbrella!', desc: `${rainProb}% chance of rain. Keep rain gear handy.`, icon: '☂️', color: '#38bdf8' };
  } else if (rainProb >= 30) {
    umbrella = { status: 'Consider Bringing', desc: 'Isolated showers possible. Keep a compact umbrella.', icon: '🌂', color: '#f59e0b' };
  }

  // 3. Outdoor Fitness / Running index
  let running = { status: 'Ideal for Running', desc: 'Great temperature and mild winds for outdoor exercise.', icon: '🏃', color: '#10b981' };
  if (rainProb > 60) {
    running = { status: 'Wet Track / Avoid', desc: 'Slippery roads and precipitation expected.', icon: '🌧️', color: '#ef4444' };
  } else if (temp > 36 || (aqi && aqi > 150)) {
    running = { status: 'Exercise Indoors', desc: 'High heat or elevated pollution levels.', icon: '🏠', color: '#f59e0b' };
  } else if (temp < 6) {
    running = { status: 'Chilly Run', desc: 'Wear windbreakers and warm up well before running.', icon: '🧤', color: '#60a5fa' };
  }

  // 4. Car Wash Recommendation
  let carWash = { status: 'Good Day to Wash', desc: 'No rain expected for the next 48 hours.', icon: '🚗', color: '#10b981' };
  if (rainProb >= 40) {
    carWash = { status: 'Postpone Washing', desc: 'Rain showers likely to spoil clean paint.', icon: '🌧️', color: '#f59e0b' };
  }

  // 5. Sunscreen Advice
  let sunscreen = { status: 'Low UV', desc: 'Minimal sun protection required.', icon: '🧴', color: '#10b981' };
  if (uv >= 8) {
    sunscreen = { status: 'SPF 50+ Crucial', desc: 'Extreme UV! Reapply every 2 hours, seek shade.', icon: '☀️', color: '#ef4444' };
  } else if (uv >= 5) {
    sunscreen = { status: 'SPF 30+ Recommended', desc: 'Moderate to high UV. Wear sunglasses & sunscreen.', icon: '🕶️', color: '#f59e0b' };
  }

  const advisors = [
    { title: 'OUTFIT ADVISOR', ...outfit },
    { title: 'UMBRELLA', ...umbrella },
    { title: 'OUTDOOR FITNESS', ...running },
    { title: 'SUN PROTECTION', ...sunscreen },
    { title: 'CAR WASH', ...carWash },
  ];

  return (
    <section className="apple-card lifestyle-card" aria-label="Lifestyle and Daily Activities Advisor">
      <div className="apple-card__header">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78L12 20.66l7.65-7.65.77-.78a5.4 5.4 0 0 0 0-7.65Z" />
        </svg>
        <span className="apple-card__title">SMART LIFESTYLE & ACTIVITY ADVISOR</span>
      </div>

      <div className="lifestyle__grid">
        {advisors.map((item, idx) => (
          <div key={idx} className="lifestyle__item">
            <span className="lifestyle__icon">{item.icon}</span>
            <div className="lifestyle__content">
              <span className="lifestyle__tag">{item.title}</span>
              <div className="lifestyle__status" style={item.color ? { color: item.color } : undefined}>
                {item.status || item.title}
              </div>
              <p className="lifestyle__desc">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
