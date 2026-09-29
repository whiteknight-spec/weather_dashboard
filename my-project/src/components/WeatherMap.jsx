import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Layer definitions
const MAP_LAYERS = {
  satellite: {
    name: '🛰️ Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community',
    maxZoom: 18,
  },
  dark: {
    name: '🌙 Dark Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19,
    subdomains: 'abcd',
  },
  street: {
    name: '🗺️ Street View',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
};

/** Create custom glowing radar beacon marker */
function createPulseMarker(cityName, temp, weatherIcon) {
  return L.divIcon({
    className: 'custom-map-beacon',
    html: `
      <div class="beacon-pulse"></div>
      <div class="beacon-bubble">
        <span class="beacon-icon">${weatherIcon || '📍'}</span>
        ${temp != null ? `<span class="beacon-temp">${temp}°</span>` : ''}
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

export default function WeatherMap({
  location,
  weatherData,
  onSelectCoordinates,
  onGeolocate,
  loading = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerRef = useRef(null);
  const [activeLayerKey, setActiveLayerKey] = useState('satellite');
  const [clickNotice, setClickNotice] = useState('');

  const lat = location?.latitude ?? 13.0878;
  const lon = location?.longitude ?? 80.2785;
  const cityName = location?.city || location?.name || 'Selected Location';
  const countryName = location?.country || '';
  const temp = weatherData?.current?.temperature;
  const weatherIcon = weatherData?.current?.weatherCode != null ? '⛅' : '📍';

  // ── Initialize Map ───────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 6,
      zoomControl: false,
    });

    // Add zoom control on top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial tile layer (Satellite by default)
    const initialLayer = MAP_LAYERS.satellite;
    const tileLayer = L.tileLayer(initialLayer.url, {
      attribution: initialLayer.attribution,
      maxZoom: initialLayer.maxZoom,
      subdomains: initialLayer.subdomains || 'abc',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Initial marker
    const marker = L.marker([lat, lon], {
      icon: createPulseMarker(cityName, temp, weatherIcon),
    }).addTo(map);

    marker.bindPopup(`
      <div class="map-popup">
        <strong>${cityName}</strong>
        ${countryName ? `<p>${countryName}</p>` : ''}
        ${temp != null ? `<div class="map-popup__temp">${temp}°C</div>` : ''}
        <span class="map-popup__coords">${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E</span>
      </div>
    `);

    markerRef.current = marker;
    mapInstanceRef.current = map;

    // ── Click anywhere to find location & get weather ──────
    map.on('click', (e) => {
      const { lat: clickedLat, lng: clickedLng } = e.latlng;
      setClickNotice(`Checking weather for ${clickedLat.toFixed(2)}°, ${clickedLng.toFixed(2)}°…`);

      // Move marker immediately
      marker.setLatLng([clickedLat, clickedLng]);
      marker.setIcon(createPulseMarker('Selected Spot', null, '🎯'));

      marker
        .bindPopup(`
          <div class="map-popup">
            <strong>🎯 Selected Pin</strong>
            <p>${clickedLat.toFixed(3)}°, ${clickedLng.toFixed(3)}°</p>
            <span class="map-popup__fetching">Fetching live weather…</span>
          </div>
        `)
        .openPopup();

      if (onSelectCoordinates) {
        onSelectCoordinates(clickedLat, clickedLng);
      }

      setTimeout(() => setClickNotice(''), 3000);
    });

    // Invalidate size once container settles
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // ── Switch Tile Layers (Satellite / Dark / Street) ────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const layerConfig = MAP_LAYERS[activeLayerKey];

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
      subdomains: layerConfig.subdomains || 'abc',
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [activeLayerKey]);

  // ── Update Marker & Pan when location prop updates ────────
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    const map = mapInstanceRef.current;
    const marker = markerRef.current;

    marker.setLatLng([lat, lon]);
    marker.setIcon(createPulseMarker(cityName, temp, weatherIcon));

    marker.bindPopup(`
      <div class="map-popup">
        <strong>${cityName}</strong>
        ${countryName ? `<p>${countryName}</p>` : ''}
        ${temp != null ? `<div class="map-popup__temp">${temp}°C</div>` : ''}
        <span class="map-popup__coords">${lat.toFixed(2)}°, ${lon.toFixed(2)}°</span>
      </div>
    `);

    // Smoothly fly to location
    map.flyTo([lat, lon], Math.max(map.getZoom(), 7), {
      duration: 1.2,
    });
  }, [lat, lon, cityName, temp, countryName, weatherIcon]);

  // Reset view to current city
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([lat, lon], 8, { duration: 1 });
  };

  return (
    <div className="weather-map-card">
      {/* Header with Title and Mode Switcher */}
      <div className="weather-map-card__header">
        <div className="weather-map-card__title">
          <span className="weather-map-card__live-icon">📡</span>
          <span className="weather-map-card__heading">Live Satellite & Map</span>
        </div>

        {/* Layer Switcher buttons */}
        <div className="weather-map-card__layers" role="tablist">
          {Object.entries(MAP_LAYERS).map(([key, config]) => (
            <button
              key={key}
              type="button"
              className={`weather-map-card__layer-btn${
                activeLayerKey === key ? ' weather-map-card__layer-btn--active' : ''
              }`}
              onClick={() => setActiveLayerKey(key)}
              title={`Switch to ${config.name}`}
            >
              {config.name}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="weather-map-card__viewport" ref={mapContainerRef}>
        {/* Floating Quick Action Overlay */}
        <div className="weather-map-card__overlay-bar">
          <button
            type="button"
            className="weather-map-card__action-btn"
            onClick={onGeolocate}
            disabled={loading}
            title="Locate my GPS position"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="14"
              height="14"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
            <span>Live GPS</span>
          </button>

          <button
            type="button"
            className="weather-map-card__action-btn"
            onClick={handleRecenter}
            title="Recenter on current city"
          >
            🎯 Focus City
          </button>
        </div>

        {/* Search Helper Pill */}
        <div className="weather-map-card__click-helper">
          <span>👆 Click anywhere on satellite map to get live weather</span>
        </div>

        {/* Temporary click toast notice */}
        {clickNotice && (
          <div className="weather-map-card__toast" role="status">
            <span>{clickNotice}</span>
          </div>
        )}
      </div>
    </div>
  );
}
