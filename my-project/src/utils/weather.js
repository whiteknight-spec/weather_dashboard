// ── Weather Code Mappings (WMO codes) ─────────────────────
const WEATHER_CODES = {
  0:  { description: 'Clear Sky',                icon: '☀️',  group: 'clear'   },
  1:  { description: 'Mainly Clear',             icon: '🌤️', group: 'clear'   },
  2:  { description: 'Partly Cloudy',            icon: '⛅',  group: 'clouds'  },
  3:  { description: 'Overcast',                 icon: '☁️',  group: 'clouds'  },
  45: { description: 'Foggy',                    icon: '🌫️', group: 'fog'     },
  48: { description: 'Rime Fog',                 icon: '🌫️', group: 'fog'     },
  51: { description: 'Light Drizzle',            icon: '🌦️', group: 'drizzle' },
  53: { description: 'Moderate Drizzle',         icon: '🌦️', group: 'drizzle' },
  55: { description: 'Dense Drizzle',            icon: '🌧️', group: 'rain'    },
  56: { description: 'Light Freezing Drizzle',   icon: '🌧️', group: 'rain'    },
  57: { description: 'Dense Freezing Drizzle',   icon: '🌧️', group: 'rain'    },
  61: { description: 'Slight Rain',              icon: '🌦️', group: 'rain'    },
  63: { description: 'Moderate Rain',            icon: '🌧️', group: 'rain'    },
  65: { description: 'Heavy Rain',               icon: '🌧️', group: 'rain'    },
  66: { description: 'Light Freezing Rain',      icon: '🌧️', group: 'rain'    },
  67: { description: 'Heavy Freezing Rain',      icon: '🌧️', group: 'rain'    },
  71: { description: 'Slight Snow',              icon: '🌨️', group: 'snow'    },
  73: { description: 'Moderate Snow',            icon: '❄️',  group: 'snow'    },
  75: { description: 'Heavy Snow',               icon: '❄️',  group: 'snow'    },
  77: { description: 'Snow Grains',              icon: '❄️',  group: 'snow'    },
  80: { description: 'Slight Showers',           icon: '🌦️', group: 'rain'    },
  81: { description: 'Moderate Showers',         icon: '🌧️', group: 'rain'    },
  82: { description: 'Violent Showers',          icon: '🌧️', group: 'rain'    },
  85: { description: 'Slight Snow Showers',      icon: '🌨️', group: 'snow'    },
  86: { description: 'Heavy Snow Showers',       icon: '🌨️', group: 'snow'    },
  95: { description: 'Thunderstorm',             icon: '⛈️',  group: 'thunder' },
  96: { description: 'Thunderstorm with Hail',   icon: '⛈️',  group: 'thunder' },
  99: { description: 'Heavy Hail Thunderstorm',  icon: '⛈️',  group: 'thunder' },
};

const NIGHT_OVERRIDES = { clear: '🌙', clouds: '☁️' };

/** Look up icon, description, and theme group for a WMO weather code. */
export function getWeatherInfo(code, isDay = 1) {
  const info = WEATHER_CODES[code] || { description: 'Unknown', icon: '🌡️', group: 'default' };
  if (!isDay && NIGHT_OVERRIDES[info.group]) {
    return { ...info, icon: NIGHT_OVERRIDES[info.group] };
  }
  return info;
}

/** Determine the CSS theme name for the dynamic background. */
export function getWeatherTheme(code, isDay) {
  if (!isDay) return 'night';
  const info = WEATHER_CODES[code];
  return info?.group || 'default';
}

// ── Country Flag & Geocoding Helpers ───────────────────────

/** Convert 2-letter ISO country code (e.g. "IN", "US") to emoji flag 🇮🇳, 🇺🇸 */
export function getCountryFlag(countryCode) {
  if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) {
    return '📍';
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/** Format coordinates nicely: e.g. "13.09°N, 80.28°E" */
export function formatCoordinates(lat, lon) {
  if (lat == null || lon == null) return '';
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}

/** Format population numbers nicely: e.g. 4681087 -> "4.7M", 150000 -> "150K" */
export function formatPopulation(num) {
  if (!num || isNaN(num)) return null;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`;
  return String(num);
}

/** Curated popular cities for quick selection */
export const POPULAR_CITIES = [
  { id: 'pop-1', name: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', country: 'India', country_code: 'IN', admin1: 'Tamil Nadu', admin2: 'Chennai', latitude: 13.0878, longitude: 80.2785, timezone: 'Asia/Kolkata' },
  { id: 'pop-2', name: 'London', district: 'Greater London', state: 'England', country: 'United Kingdom', country_code: 'GB', admin1: 'England', admin2: 'Greater London', latitude: 51.5085, longitude: -0.1257, timezone: 'Europe/London' },
  { id: 'pop-3', name: 'New York', district: 'New York County', state: 'New York', country: 'United States', country_code: 'US', admin1: 'New York', admin2: 'New York County', latitude: 40.7143, longitude: -74.006, timezone: 'America/New_York' },
  { id: 'pop-4', name: 'Tokyo', district: 'Tokyo', state: 'Kanto', country: 'Japan', country_code: 'JP', admin1: 'Tokyo', admin2: 'Tokyo', latitude: 35.6895, longitude: 139.6917, timezone: 'Asia/Tokyo' },
  { id: 'pop-5', name: 'Dubai', district: 'Dubai', state: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', admin1: 'Dubai', admin2: 'Dubai', latitude: 25.0772, longitude: 55.3093, timezone: 'Asia/Dubai' },
  { id: 'pop-6', name: 'Singapore', district: 'Singapore', state: 'Singapore', country: 'Singapore', country_code: 'SG', admin1: '', admin2: '', latitude: 1.2897, longitude: 103.8501, timezone: 'Asia/Singapore' },
  { id: 'pop-7', name: 'Paris', district: 'Paris', state: 'Île-de-France', country: 'France', country_code: 'FR', admin1: 'Île-de-France', admin2: 'Paris', latitude: 48.8534, longitude: 2.3488, timezone: 'Europe/Paris' },
  { id: 'pop-8', name: 'Sydney', district: 'Sydney', state: 'New South Wales', country: 'Australia', country_code: 'AU', admin1: 'New South Wales', admin2: 'Sydney', latitude: -33.8679, longitude: 151.2073, timezone: 'Australia/Sydney' },
];

// ── API Functions ─────────────────────────────────────────

const GEO_URL  = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

/** Clean district string by stripping repetitive "district", "county", etc. */
function cleanDistrict(raw) {
  if (!raw) return '';
  return raw
    .replace(/\s+district$/i, '')
    .replace(/\s+county$/i, '')
    .trim();
}

/** Search cities by name — combines Open-Meteo & Nominatim for global coverage of small villages, districts & cities. */
export async function searchCities(query, signal) {
  if (!query || query.trim().length < 2) return [];
  const trimmed = query.trim();

  const [omRes, nomRes] = await Promise.allSettled([
    fetch(
      `${GEO_URL}?name=${encodeURIComponent(trimmed)}&count=6&language=en&format=json`,
      { signal },
    ).then((r) => (r.ok ? r.json() : null)),
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&addressdetails=1&limit=6`,
      {
        signal,
        headers: { 'Accept-Language': 'en', 'User-Agent': 'WeatherScope/1.0' },
      },
    ).then((r) => (r.ok ? r.json() : null)),
  ]);

  const list = [];
  const seen = new Set();

  const add = (item) => {
    // Unique key by name + rounded lat/lon to deduplicate
    const key = `${item.name}-${Math.round(item.latitude * 10)}-${Math.round(item.longitude * 10)}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      list.push(item);
    }
  };

  // Add Nominatim results (great for villages, taluks, sub-districts like Giror in Mainpuri)
  if (nomRes.status === 'fulfilled' && Array.isArray(nomRes.value)) {
    for (const d of nomRes.value) {
      const a = d.address || {};
      const place =
        a.village ||
        a.town ||
        a.city ||
        a.municipality ||
        a.suburb ||
        a.hamlet ||
        d.name;
      const district = cleanDistrict(
        a.state_district || a.county || a.district || a.city_district || '',
      );
      const state = a.state || a.province || a.region || '';
      const country = a.country || '';
      const country_code = (a.country_code || '').toUpperCase();
      const lat = parseFloat(d.lat);
      const lon = parseFloat(d.lon);

      if (!isNaN(lat) && !isNaN(lon)) {
        add({
          id: `nom-${d.place_id}`,
          name: place,
          place,
          district,
          admin2: district,
          state,
          admin1: state,
          country,
          country_code,
          latitude: lat,
          longitude: lon,
        });
      }
    }
  }

  // Add Open-Meteo results
  if (omRes.status === 'fulfilled' && Array.isArray(omRes.value?.results)) {
    for (const r of omRes.value.results) {
      const district = cleanDistrict(r.admin2 || '');
      add({
        id: `om-${r.id}`,
        name: r.name,
        place: r.name,
        district,
        admin2: district,
        state: r.admin1 || '',
        admin1: r.admin1 || '',
        country: r.country || '',
        country_code: (r.country_code || '').toUpperCase(),
        latitude: r.latitude,
        longitude: r.longitude,
        population: r.population,
      });
    }
  }

  // Rank exact / prefix matches of query at the top
  const qLower = trimmed.toLowerCase();
  list.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aScore = aName === qLower ? -2 : aName.startsWith(qLower) ? -1 : 0;
    const bScore = bName === qLower ? -2 : bName.startsWith(qLower) ? -1 : 0;
    return aScore - bScore;
  });

  return list;
}

/** Fetch comprehensive weather data for a lat/lon pair. */
export async function fetchWeatherData(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current_weather: 'true',
    hourly:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weathercode,windspeed_10m,surface_pressure,visibility,uv_index',
    daily:
      'weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,windspeed_10m_max,uv_index_max',
    timezone: 'auto',
    forecast_days: 7,
  });
  const res = await fetch(`${WEATHER_URL}?${params}`);
  if (!res.ok) throw new Error('Weather request failed');
  return res.json();
}

/** Reverse-geocode lat/lon to a complete administrative hierarchy: Place, District, State, Country. */
export async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
    {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'WeatherScope/1.0',
      },
    },
  );
  if (!res.ok) throw new Error('Reverse geocoding failed');
  const d = await res.json();
  const addr = d.address || {};

  const placeName =
    addr.village ||
    addr.town ||
    addr.city ||
    addr.municipality ||
    addr.hamlet ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.locality ||
    d.name ||
    'Your Location';

  const district = cleanDistrict(
    addr.state_district ||
    addr.county ||
    addr.district ||
    addr.city_district ||
    '',
  );

  const state =
    addr.state ||
    addr.province ||
    addr.region ||
    '';

  const country = addr.country || '';
  const countryCode = (addr.country_code || '').toUpperCase();

  return {
    name: placeName,
    city: placeName,
    place: placeName,
    district,
    admin2: district,
    state,
    admin1: state,
    country,
    country_code: countryCode,
    latitude: Number(lat),
    longitude: Number(lon),
    displayName: d.display_name || '',
  };
}

// ── Data Processing ───────────────────────────────────────

/** Transform raw API data + location into a clean, component-ready shape. */
export function processWeatherData(apiData, location) {
  const { current_weather, hourly, daily } = apiData;

  // Find current hour index by matching current_weather.time
  const currentTime = current_weather.time; // e.g. "2024-01-15T14:00"
  let startIdx = hourly.time.indexOf(currentTime);
  if (startIdx === -1) startIdx = 0;

  // Detailed values for the current hour
  const ci = startIdx;

  // Next 24 hours
  const hourlyData = [];
  for (let i = startIdx; i < Math.min(startIdx + 24, hourly.time.length); i++) {
    hourlyData.push({
      time: hourly.time[i],
      temperature: hourly.temperature_2m[i],
      weatherCode: hourly.weathercode[i],
      precipProbability: hourly.precipitation_probability[i],
      windSpeed: hourly.windspeed_10m[i],
      humidity: hourly.relative_humidity_2m[i],
    });
  }

  // 7-day daily
  const dailyData = daily.time.map((date, i) => ({
    date,
    tempMax: daily.temperature_2m_max[i],
    tempMin: daily.temperature_2m_min[i],
    weatherCode: daily.weathercode[i],
    precipSum: daily.precipitation_sum[i],
    windMax: daily.windspeed_10m_max[i],
    uvMax: daily.uv_index_max[i],
    sunrise: daily.sunrise[i],
    sunset: daily.sunset[i],
  }));

  const placeName = location.place || location.name || location.city || 'Your Location';
  const district = cleanDistrict(location.district || location.admin2 || '');
  const state = location.state || location.admin1 || '';
  const country = location.country || '';
  const countryCode = (location.country_code || '').toUpperCase();

  return {
    location: {
      city: placeName,
      name: placeName,
      place: placeName,
      district,
      admin2: district,
      state,
      admin1: state,
      country,
      country_code: countryCode,
      latitude: location.latitude,
      longitude: location.longitude,
    },
    current: {
      temperature: current_weather.temperature,
      feelsLike: hourly.apparent_temperature[ci] ?? current_weather.temperature,
      weatherCode: current_weather.weathercode,
      windSpeed: current_weather.windspeed,
      windDirection: current_weather.winddirection,
      isDay: current_weather.is_day,
      humidity: hourly.relative_humidity_2m[ci] ?? 0,
      uvIndex: hourly.uv_index[ci] ?? 0,
      pressure: hourly.surface_pressure[ci] ?? 0,
      visibility: hourly.visibility[ci] ?? 0,
      precipProbability: hourly.precipitation_probability[ci] ?? 0,
    },
    sunrise: extractTime(dailyData[0]?.sunrise),
    sunset: extractTime(dailyData[0]?.sunset),
    hourly: hourlyData,
    daily: dailyData,
  };
}

// ── Helpers ───────────────────────────────────────────────

function extractTime(iso) {
  if (!iso) return '--:--';
  const t = iso.split('T')[1];
  return t ? t.slice(0, 5) : '--:--';
}

/** "14:00" → "2 PM" */
export function formatHour(timeStr) {
  const h = parseInt(timeStr.split('T')[1]?.split(':')[0] || '0', 10);
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

/** Index 0 → "Today", others → "Mon", "Tue", etc. */
export function formatDayName(dateStr, index) {
  if (index === 0) return 'Today';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

/** Degrees → compass direction string. */
export function getWindDirection(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

/** UV index → severity label and color. */
export function getUvLevel(uv) {
  if (uv <= 2)  return { level: 'Low',       color: '#4ade80' };
  if (uv <= 5)  return { level: 'Moderate',  color: '#fbbf24' };
  if (uv <= 7)  return { level: 'High',      color: '#f97316' };
  if (uv <= 10) return { level: 'Very High', color: '#ef4444' };
  return { level: 'Extreme', color: '#a855f7' };
}

/** Convert °C → °F when units === 'fahrenheit'. */
export function convertTemp(c, units) {
  return units === 'fahrenheit' ? Math.round(c * 9 / 5 + 32) : Math.round(c);
}

/** Convert km/h → mph when units === 'fahrenheit'. */
export function convertWind(kmh, units) {
  return units === 'fahrenheit' ? Math.round(kmh * 0.621371) : Math.round(kmh);
}

export function tempUnit(u)  { return u === 'celsius' ? '°C' : '°F'; }
export function windUnit(u)  { return u === 'celsius' ? 'km/h' : 'mph'; }

// ── Air Quality API & Category Helpers ─────────────────────
const AQI_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export async function fetchAirQuality(lat, lon) {
  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
    });
    const res = await fetch(`${AQI_URL}?${params}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('AQI fetch failed');
    const data = await res.json();
    return data.current || null;
  } catch {
    return null;
  }
}

export function getAqiCategory(aqi) {
  if (aqi == null) {
    return {
      level: 'Data Pending',
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      advice: 'Air quality reading is currently calibrating for this coordinate.',
      icon: '🌫️',
    };
  }
  if (aqi <= 50) {
    return {
      level: 'Good',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      advice: 'Air quality is satisfactory. Safe for all outdoor activities and exercise.',
      icon: '🍃',
    };
  }
  if (aqi <= 100) {
    return {
      level: 'Moderate',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      advice: 'Air quality is acceptable. Very sensitive individuals may consider reducing prolonged outdoor exertion.',
      icon: '🌤️',
    };
  }
  if (aqi <= 150) {
    return {
      level: 'Unhealthy for Sensitive Groups',
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.15)',
      advice: 'Children, the elderly, and those with respiratory conditions should limit prolonged outdoor activity.',
      icon: '😷',
    };
  }
  if (aqi <= 200) {
    return {
      level: 'Unhealthy',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      advice: 'Everyone may experience health effects. Limit strenuous outdoor workouts and keep windows closed.',
      icon: '⚠️',
    };
  }
  if (aqi <= 300) {
    return {
      level: 'Very Unhealthy',
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.15)',
      advice: 'Health alert: risk of health effects increased for everyone. Consider wearing a protective mask outdoors.',
      icon: '🚨',
    };
  }
  return {
    level: 'Hazardous',
    color: '#e11d48',
    bg: 'rgba(225, 29, 72, 0.25)',
    advice: 'Emergency warning: entire population is at high risk. Avoid all physical outdoor activity.',
    icon: '☣️',
  };
}

// ── Live Weather Radar via RainViewer API ─────────────────
export async function fetchRadarInfo() {
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error('Radar API failed');
    const json = await res.json();
    const past = json.radar?.past || [];
    const latest = past[past.length - 1];
    if (latest && json.host) {
      return {
        tileUrl: `${json.host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`,
        time: latest.time,
        allFrames: past.slice(-5).map((f) => `${json.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`),
      };
    }
    return null;
  } catch {
    return null;
  }
}
