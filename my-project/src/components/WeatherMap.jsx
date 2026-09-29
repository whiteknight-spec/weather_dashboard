import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchRadarInfo } from '../utils/weather';

// Layer definitions with native zoom and tile buffering
const MAP_LAYERS = {
  satellite: {
    name: '🛰️ Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; DigitalGlobe, GeoEye, Earthstar Geographics',
    maxNativeZoom: 18,
    maxZoom: 19,
    minZoom: 2,
  },
  dark: {
    name: '🌙 Dark Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxNativeZoom: 19,
    maxZoom: 20,
    minZoom: 2,
    subdomains: 'abcd',
  },
  street: {
    name: '🗺️ Street View',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxNativeZoom: 19,
    maxZoom: 20,
    minZoom: 2,
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

  // States
  const [activeLayerKey, setActiveLayerKey] = useState('satellite');
  const [clickNotice, setClickNotice] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(6);
  const [showRadar, setShowRadar] = useState(false);
  const [radarLoading, setRadarLoading] = useState(false);
  const radarLayerRef = useRef(null);

  // Drag-vs-Click detection refs (prevents drag release from accidentally selecting a place!)
  const isDraggingRef = useRef(false);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(0);

  const lat = location?.latitude ?? 13.0878;
  const lon = location?.longitude ?? 80.2785;
  const cityName = location?.place || location?.city || location?.name || 'Selected Location';
  const countryName = location?.country || '';
  const temp = weatherData?.current?.temperature;
  const weatherIcon = weatherData?.current?.weatherCode != null ? '⛅' : '📍';

  // ── Initialize Map with Enhanced Dragging & Smooth Zooming ─
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 6,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false, // We render modern accessible custom controls
      zoomSnap: 0.5,      // Silky smooth half-step zooming
      zoomDelta: 0.5,     // Buttons zoom smoothly in 0.5 steps
      wheelPxPerZoomLevel: 100, // Smooth trackpad pinch & scroll wheel
      wheelDebounceTime: 40,
      worldCopyJump: true, // Smooth, seamless continuous dragging left to right across the world
      inertia: true,
      inertiaDeceleration: 2600,
      inertiaMaxSpeed: 2200,
      easeLinearity: 0.2,
      preferCanvas: true,
    });

    // Initial tile layer (Satellite by default)
    const initialConfig = MAP_LAYERS.satellite;
    const tileLayer = L.tileLayer(initialConfig.url, {
      attribution: initialConfig.attribution,
      maxNativeZoom: initialConfig.maxNativeZoom,
      maxZoom: initialConfig.maxZoom,
      minZoom: initialConfig.minZoom,
      subdomains: initialConfig.subdomains || 'abc',
      keepBuffer: 6,       // Preload tiles in all directions for lag-free panning
      updateWhenZooming: false,
      updateWhenIdle: true,
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
        <span class="map-popup__coords">${lat.toFixed(2)}°, ${lon.toFixed(2)}°</span>
      </div>
    `);

    markerRef.current = marker;
    mapInstanceRef.current = map;

    // Track zoom level changes for UI badge
    map.on('zoomend', () => {
      setZoomLevel(Math.round(map.getZoom() * 2) / 2);
    });

    // Track dragging to completely prevent accidental clicks while panning
    map.on('movestart', () => {
      isDraggingRef.current = true;
    });

    map.on('moveend', () => {
      lastMoveTimeRef.current = Date.now();
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 250);
    });

    // ── Mouse down tracker to measure drag distance ─────────
    const container = mapContainerRef.current;
    const handleMouseDown = (e) => {
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    };
    container.addEventListener('mousedown', handleMouseDown, { passive: true });
    container.addEventListener('touchstart', (e) => {
      if (e.touches[0]) {
        mouseDownPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    // ── Click anywhere to choose a location & get weather ──
    map.on('click', (e) => {
      // 1. If currently dragging, ignore click
      if (isDraggingRef.current) return;

      // 2. If finished dragging less than 250ms ago, ignore click
      if (Date.now() - lastMoveTimeRef.current < 250) return;

      // 3. If mouse moved more than 7px between down and click, it was a drag!
      const originalEvent = e.originalEvent;
      if (originalEvent) {
        const clientX = originalEvent.clientX ?? (originalEvent.changedTouches?.[0]?.clientX ?? 0);
        const clientY = originalEvent.clientY ?? (originalEvent.changedTouches?.[0]?.clientY ?? 0);
        const dist = Math.hypot(
          clientX - mouseDownPosRef.current.x,
          clientY - mouseDownPosRef.current.y,
        );
        if (dist > 7) return; // Ignore drag release
      }

      // Deliberate click: select location
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

      setTimeout(() => setClickNotice(''), 3500);
    });

    // Invalidate size once container settles
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
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
      maxNativeZoom: layerConfig.maxNativeZoom,
      maxZoom: layerConfig.maxZoom,
      minZoom: layerConfig.minZoom,
      subdomains: layerConfig.subdomains || 'abc',
      keepBuffer: 6,
      updateWhenZooming: false,
      updateWhenIdle: true,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [activeLayerKey]);

  // ── Live Weather Radar Overlay (RainViewer) ───────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (radarLayerRef.current) {
      map.removeLayer(radarLayerRef.current);
      radarLayerRef.current = null;
    }

    if (showRadar) {
      setRadarLoading(true);
      fetchRadarInfo()
        .then((info) => {
          if (info && info.tileUrl && mapInstanceRef.current) {
            const rLayer = L.tileLayer(info.tileUrl, {
              opacity: 0.65,
              zIndex: 600,
              maxZoom: 19,
            }).addTo(mapInstanceRef.current);
            radarLayerRef.current = rLayer;
          }
        })
        .finally(() => {
          setRadarLoading(false);
        });
    }

    return () => {
      if (radarLayerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(radarLayerRef.current);
        radarLayerRef.current = null;
      }
    };
  }, [showRadar]);

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

    // Smoothly fly to new city location
    map.flyTo([lat, lon], Math.max(map.getZoom(), 7.5), {
      duration: 1.2,
    });
  }, [lat, lon, cityName, temp, countryName, weatherIcon]);

  // ── Quick Controls Handlers ──────────────────────────────
  const handleZoomIn = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomIn(1);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomOut(1);
  }, []);

  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([lat, lon], 8, { duration: 1.1 });
  }, [lat, lon]);

  const handleWorldView = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([20, 0], 2.5, { duration: 1.2 });
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ pan: false });
      }
    }, 320);
  }, []);

  return (
    <div className={`weather-map-card${isExpanded ? ' weather-map-card--expanded' : ''}`}>
      {/* Header with Title and Mode Switcher */}
      <div className="weather-map-card__header">
        <div className="weather-map-card__title">
          <span className="weather-map-card__live-icon">📡</span>
          <span className="weather-map-card__heading">Live Satellite &amp; Interactive Map</span>
          <span className="weather-map-card__zoom-badge" title="Current Zoom Level">
            {zoomLevel >= 12 ? '🔍 Local View' : zoomLevel >= 7 ? '🏙️ Regional' : '🌍 Continental'} · {zoomLevel}x
          </span>
        </div>

        {/* Layer Switcher & Expand buttons */}
        <div className="weather-map-card__header-right">
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

          {/* Live Rain Radar Toggle */}
          <button
            type="button"
            className={`weather-map-card__radar-btn${showRadar ? ' weather-map-card__radar-btn--active' : ''}`}
            onClick={() => setShowRadar((prev) => !prev)}
            title={showRadar ? 'Turn off Live Rain Radar overlay' : 'Overlay live precipitation radar (RainViewer)'}
          >
            <span>{radarLoading ? '⏳' : '🌧️'}</span>
            <span>{showRadar ? 'Radar: ON' : 'Rain Radar'}</span>
          </button>

          <button
            type="button"
            className="weather-map-card__expand-btn"
            onClick={handleToggleExpand}
            title={isExpanded ? 'Compact map view' : 'Expand map canvas for easier dragging and zooming'}
          >
            {isExpanded ? '⤡ Compact' : '⤢ Expand Map'}
          </button>
        </div>
      </div>

      {/* Map Viewport Container */}
      <div className="weather-map-card__viewport" ref={mapContainerRef}>
        {/* Radar Intensity Legend */}
        {showRadar && (
          <div className="weather-map-card__radar-legend" aria-label="Precipitation Radar Legend">
            <span className="weather-map-card__legend-title">🌧️ Radar:</span>
            <span className="weather-map-card__legend-bar" />
            <span className="weather-map-card__legend-text">Light ➔ Heavy Rain</span>
          </div>
        )}
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
            title="Center map on current city"
          >
            🎯 Focus City
          </button>

          <button
            type="button"
            className="weather-map-card__action-btn"
            onClick={handleWorldView}
            title="Zoom out to Global Overview"
          >
            🌍 Global
          </button>
        </div>

        {/* Dedicated Modern Floating Zoom Buttons (Top-Right) */}
        <div className="weather-map-card__zoom-bar" aria-label="Map Zoom Controls">
          <button
            type="button"
            className="weather-map-card__zoom-btn"
            onClick={handleZoomIn}
            title="Zoom in (+)"
            aria-label="Zoom in"
          >
            +
          </button>
          <div className="weather-map-card__zoom-divider" />
          <button
            type="button"
            className="weather-map-card__zoom-btn"
            onClick={handleZoomOut}
            title="Zoom out (−)"
            aria-label="Zoom out"
          >
            −
          </button>
        </div>

        {/* Informative Helper Pill at Bottom */}
        <div className="weather-map-card__click-helper">
          <span>✋ Drag left/right to explore smoothly · 👆 Click any place to get live weather</span>
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
