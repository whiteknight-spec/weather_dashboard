import { useState, useEffect, useCallback } from 'react';
import { getCountryFlag } from '../utils/weather';

const STORAGE_KEY = 'ws_favorites_v1';

const DEFAULT_FAVORITES = [
  { name: 'Coimbatore', place: 'Coimbatore', district: 'Coimbatore', state: 'Tamil Nadu', country: 'India', country_code: 'IN', latitude: 11.0168, longitude: 76.9558 },
  { name: 'Chennai', place: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', country: 'India', country_code: 'IN', latitude: 13.0878, longitude: 80.2785 },
  { name: 'Giror', place: 'Giror', district: 'Mainpuri', state: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 27.1893, longitude: 78.7998 },
  { name: 'London', place: 'London', district: 'Greater London', state: 'England', country: 'United Kingdom', country_code: 'GB', latitude: 51.5085, longitude: -0.1257 },
];

export default function FavoritesBar({ activeLocation, onSelectLocation }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    } catch {
      return DEFAULT_FAVORITES;
    }
  });

  // Save to localStorage
  const saveFavorites = (list) => {
    setFavorites(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // storage quota or private browsing
    }
  };

  const activeName = (activeLocation?.place || activeLocation?.city || activeLocation?.name || '').toLowerCase();
  const isPinned = favorites.some((f) => (f.place || f.name || f.city || '').toLowerCase() === activeName);

  const togglePinCurrent = useCallback(() => {
    if (!activeLocation) return;
    const name = activeLocation.place || activeLocation.city || activeLocation.name || 'Current Spot';

    if (isPinned) {
      const next = favorites.filter((f) => (f.place || f.name || f.city || '').toLowerCase() !== name.toLowerCase());
      saveFavorites(next);
    } else {
      const newItem = {
        name,
        place: name,
        district: activeLocation.district || '',
        state: activeLocation.state || '',
        country: activeLocation.country || '',
        country_code: activeLocation.country_code || '',
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude,
      };
      saveFavorites([newItem, ...favorites].slice(0, 10));
    }
  }, [activeLocation, isPinned, favorites]);

  const handleRemove = (e, nameToRemove) => {
    e.stopPropagation();
    const next = favorites.filter((f) => (f.place || f.name || f.city || '').toLowerCase() !== nameToRemove.toLowerCase());
    saveFavorites(next);
  };

  return (
    <div className="favorites-bar" aria-label="Pinned Favorite Places">
      <div className="favorites-bar__scroll">
        {/* Toggle Pin Button for Current Spot */}
        <button
          type="button"
          className={`favorites-bar__pin-btn${isPinned ? ' favorites-bar__pin-btn--pinned' : ''}`}
          onClick={togglePinCurrent}
          title={isPinned ? 'Remove current location from pinned favorites' : 'Pin current location to favorites bar'}
        >
          <span className="favorites-bar__star">{isPinned ? '★' : '☆'}</span>
          <span>{isPinned ? 'Pinned' : 'Pin Location'}</span>
        </button>

        {/* Favorite Pills */}
        <div className="favorites-bar__pills">
          {favorites.map((fav, i) => {
            const flag = getCountryFlag(fav.country_code);
            const title = fav.place || fav.name || 'City';
            const sub = fav.district && fav.district.toLowerCase() !== title.toLowerCase() ? fav.district : fav.country;
            const isActive = (fav.place || fav.name || '').toLowerCase() === activeName;

            return (
              <div
                key={`${fav.name}-${i}`}
                role="button"
                tabIndex={0}
                className={`favorites-bar__pill${isActive ? ' favorites-bar__pill--active' : ''}`}
                onClick={() => onSelectLocation(fav)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectLocation(fav);
                  }
                }}
                title={`Switch to ${title}${sub ? `, ${sub}` : ''}`}
              >
                <span className="favorites-bar__flag">{flag}</span>
                <span className="favorites-bar__name">{title}</span>
                {sub && <span className="favorites-bar__sub">({sub})</span>}
                <button
                  type="button"
                  className="favorites-bar__remove"
                  onClick={(e) => handleRemove(e, title)}
                  title={`Remove ${title} from favorites`}
                  aria-label={`Remove ${title}`}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
