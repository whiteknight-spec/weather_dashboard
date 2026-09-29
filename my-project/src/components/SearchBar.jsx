import { useState, useEffect, useRef, useCallback } from 'react';
import {
  searchCities,
  getCountryFlag,
  formatCoordinates,
  formatPopulation,
  POPULAR_CITIES,
} from '../utils/weather';

/** Helper to highlight the matching query substring in text safely */
function HighlightMatch({ text, query }) {
  if (!text) return null;
  if (!query || !query.trim()) return <span>{text}</span>;

  const trimmedQuery = query.trim();
  const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === trimmedQuery.toLowerCase() ? (
          <mark key={i} className="search__highlight">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
}

export default function SearchBar({
  onSearch,
  onSelectSuggestion,
  onGeolocate,
  recentSearches = [],
  onRemoveRecent,
  onClearRecent,
  onClearError,
  loading = false,
}) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const abortCtrlRef = useRef(null);
  const wrapperRef = useRef(null);

  // Normalize recent searches to standard objects
  const normalizedRecents = recentSearches.map((item) => {
    if (typeof item === 'string') {
      return { name: item, country: '', country_code: '' };
    }
    return item;
  });

  // ── Debounced autocomplete with AbortController ───────────
  useEffect(() => {
    const trimmed = query.trim();

    // Cancel any ongoing fetch request
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
    }
    clearTimeout(debounceRef.current);

    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      setSearchAttempted(false);
      setActiveIdx(-1);
      return;
    }

    setIsSearching(true);
    setSearchAttempted(false);

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortCtrlRef.current = controller;

      try {
        const results = await searchCities(trimmed, controller.signal);
        setSuggestions(results);
        setShowDropdown(true);
        setActiveIdx(-1);
        setSearchAttempted(true);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setSuggestions([]);
          setSearchAttempted(true);
        }
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => {
      clearTimeout(debounceRef.current);
      if (abortCtrlRef.current) {
        abortCtrlRef.current.abort();
      }
    };
  }, [query]);

  // ── Global shortcut ⌘K / Ctrl+K ─────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowDropdown(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ── Click outside to close ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Input change handler ────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(true);
    if (onClearError) onClearError();
  };

  // ── Clear button ────────────────────────────────────────
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setSearchAttempted(false);
    setActiveIdx(-1);
    if (onClearError) onClearError();
    inputRef.current?.focus();
  };

  // ── Submission ──────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // If an item in dropdown is actively selected with arrow keys, choose it
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      handleSelect(suggestions[activeIdx]);
      return;
    }

    setShowDropdown(false);
    onSearch(trimmed);
  };

  const handleSelect = (city) => {
    setQuery(city.name);
    setShowDropdown(false);
    onSelectSuggestion(city);
  };

  // ── Keyboard Navigation ─────────────────────────────────
  const handleKeyDown = (e) => {
    // Escape closes dropdown
    if (e.key === 'Escape') {
      setShowDropdown(false);
      return;
    }

    if (!showDropdown) {
      if (e.key === 'ArrowDown') {
        setShowDropdown(true);
      }
      return;
    }

    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      } else if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault();
        handleSelect(suggestions[activeIdx]);
      }
    }
  };

  const hasRecents = normalizedRecents.length > 0;
  const isInputEmpty = query.trim().length === 0;
  const isTypingShort = query.trim().length > 0 && query.trim().length < 2;

  return (
    <div className="search" ref={wrapperRef}>
      <form className="search__form" onSubmit={handleSubmit} role="search">
        {/* Input Wrapper */}
        <div className="search__input-wrapper">
          {/* Left search icon */}
          <svg
            className="search__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          {/* Main search input */}
          <input
            id="city-input"
            ref={inputRef}
            className="search__input"
            type="text"
            placeholder="Search any city in the world (e.g. Chennai, London, Tokyo)..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck="false"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
            aria-controls="search-dropdown-list"
          />

          {/* Right side controls: Spinner / Clear button / ⌘K badge */}
          <div className="search__right-controls">
            {isSearching && (
              <span className="search__spinner" title="Searching..." aria-label="Searching" />
            )}

            {query.length > 0 && (
              <button
                type="button"
                className="search__clear-btn"
                onClick={handleClear}
                title="Clear search"
                aria-label="Clear search input"
              >
                ✕
              </button>
            )}

            {!query && <kbd className="search__kbd">⌘K</kbd>}
          </div>
        </div>

        {/* Geolocation Button */}
        <button
          id="geo-btn"
          type="button"
          className="search__geo-btn"
          onClick={onGeolocate}
          title="Use my current GPS location"
          aria-label="Use my current location"
          disabled={loading}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
          <span className="search__geo-text">Current Location</span>
        </button>

        {/* Submit Button */}
        <button
          id="search-btn"
          type="submit"
          className="search__btn"
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <span className="search__btn-loading">
              <span className="search__spinner search__spinner--btn" />
              Loading
            </span>
          ) : (
            'Search'
          )}
        </button>
      </form>

      {/* ── Rich Autocomplete Dropdown ─────────────────────── */}
      {showDropdown && (
        <div id="search-dropdown-list" className="search__dropdown" role="listbox">
          {/* Case 1: Searching state */}
          {isSearching && suggestions.length === 0 && (
            <div className="search__dropdown-notice">
              <span className="search__spinner" />
              <span>Looking up cities for &ldquo;{query.trim()}&rdquo;…</span>
            </div>
          )}

          {/* Case 2: Query matches found */}
          {suggestions.length > 0 && (
            <div>
              <div className="search__dropdown-header">
                <span>Matching Cities ({suggestions.length})</span>
                <span className="search__dropdown-hint">↑↓ to navigate · ↵ to select</span>
              </div>
              <ul className="search__dropdown-list">
                {suggestions.map((city, i) => {
                  const flag = getCountryFlag(city.country_code);
                  const distinctDistrict =
                    city.district && city.district.toLowerCase() !== city.name.toLowerCase()
                      ? city.district
                      : null;
                  const locationMeta = [distinctDistrict, city.admin1 || city.state, city.country]
                    .filter(Boolean)
                    .join(' · ');
                  const coords = formatCoordinates(city.latitude, city.longitude);
                  const pop = formatPopulation(city.population);

                  return (
                    <li
                      key={city.id || `${city.name}-${city.latitude}-${city.longitude}`}
                      role="option"
                      aria-selected={i === activeIdx}
                      className={`search__dropdown-item${
                        i === activeIdx ? ' search__dropdown-item--active' : ''
                      }`}
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => handleSelect(city)}
                    >
                      <div className="search__item-flag" aria-hidden="true">
                        {flag}
                      </div>
                      <div className="search__item-info">
                        <div className="search__item-title">
                          <HighlightMatch text={city.name} query={query} />
                          {city.country_code && (
                            <span className="search__item-badge">{city.country_code}</span>
                          )}
                        </div>
                        <div className="search__item-meta">
                          <HighlightMatch text={locationMeta} query={query} />
                        </div>
                      </div>
                      <div className="search__item-side">
                        {pop && <span className="search__item-pop">👥 {pop}</span>}
                        {coords && <span className="search__item-coords">{coords}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Case 3: No matches found */}
          {!isSearching && searchAttempted && suggestions.length === 0 && query.trim().length >= 2 && (
            <div className="search__dropdown-empty">
              <span className="search__empty-icon">🔍</span>
              <div className="search__empty-content">
                <strong>No cities found for &ldquo;{query.trim()}&rdquo;</strong>
                <p>Check the spelling or try searching for a major nearby city.</p>
              </div>
            </div>
          )}

          {/* Case 4: Short input notice */}
          {isTypingShort && (
            <div className="search__dropdown-notice">
              <span>Type at least 2 characters to search worldwide cities</span>
            </div>
          )}

          {/* Case 5: Zero-query state (Recent Searches + Popular Cities) */}
          {isInputEmpty && (
            <div className="search__quickpick">
              {/* Recent searches inside dropdown */}
              {hasRecents && (
                <div className="search__quickpick-section">
                  <div className="search__dropdown-header">
                    <span className="search__section-title">
                      <span className="search__section-icon">🕒</span> Recent Searches
                    </span>
                    {onClearRecent && (
                      <button
                        type="button"
                        className="search__clear-all-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearRecent();
                        }}
                      >
                        Clear history
                      </button>
                    )}
                  </div>
                  <div className="search__recents-grid">
                    {normalizedRecents.map((item, idx) => {
                      const flag = getCountryFlag(item.country_code);
                      return (
                        <div
                          key={`recent-drop-${item.name}-${idx}`}
                          className="search__recent-card"
                          onClick={() => handleSelect(item)}
                        >
                          <span className="search__recent-flag">{flag}</span>
                          <span className="search__recent-name">{item.name}</span>
                          {item.country && (
                            <span className="search__recent-sub">{item.country}</span>
                          )}
                          {onRemoveRecent && (
                            <button
                              type="button"
                              className="search__recent-delete"
                              title={`Remove ${item.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveRecent(item.name);
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Popular quick picks */}
              <div className="search__quickpick-section">
                <div className="search__dropdown-header">
                  <span className="search__section-title">
                    <span className="search__section-icon">✨</span> Popular Cities
                  </span>
                  <span className="search__dropdown-hint">Click to check weather</span>
                </div>
                <div className="search__popular-grid">
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      className="search__popular-card"
                      onClick={() => handleSelect(city)}
                    >
                      <span className="search__popular-flag">{getCountryFlag(city.country_code)}</span>
                      <div className="search__popular-text">
                        <span className="search__popular-city">{city.name}</span>
                        <span className="search__popular-country">{city.country}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Recent searches chips beneath search bar ─────────── */}
      {hasRecents && (
        <div className="search__recent" aria-label="Recent search history">
          <span className="search__recent-label">Recent:</span>
          {normalizedRecents.map((item, idx) => (
            <div key={`chip-${item.name}-${idx}`} className="search__recent-pill">
              <button
                type="button"
                className="search__recent-chip"
                onClick={() => handleSelect(item)}
                title={`Check weather for ${item.name}`}
              >
                <span className="search__chip-flag">{getCountryFlag(item.country_code)}</span>
                <span>{item.name}</span>
              </button>
              {onRemoveRecent && (
                <button
                  type="button"
                  className="search__chip-remove"
                  onClick={() => onRemoveRecent(item.name)}
                  title={`Remove ${item.name}`}
                  aria-label={`Remove ${item.name} from recent searches`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {onClearRecent && normalizedRecents.length > 2 && (
            <button
              type="button"
              className="search__recent-clear-link"
              onClick={onClearRecent}
              title="Clear all recent searches"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
