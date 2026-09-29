import { useState, useRef } from 'react';
import { getWeatherInfo, formatHour, convertTemp, tempUnit, convertWind, windUnit } from '../utils/weather';

export default function InteractiveHourlyChart({ hours, units }) {
  const [activeMetric, setActiveMetric] = useState('temp'); // 'temp' | 'precip' | 'wind'
  const [hoveredIdx, setHoveredIdx] = useState(0);
  const containerRef = useRef(null);

  if (!hours || hours.length === 0) return null;

  const tU = tempUnit(units);
  const wU = windUnit(units);
  const activeHour = hours[hoveredIdx] || hours[0];
  const activeInfo = getWeatherInfo(activeHour.weatherCode);

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 160;
  const paddingX = 24;
  const paddingY = 24;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  // Extract metric arrays
  const temps = hours.map((h) => convertTemp(h.temperature, units));
  const precips = hours.map((h) => h.precipProbability || 0);
  const winds = hours.map((h) => convertWind(h.windSpeed, units));

  let dataValues = temps;
  let unitLabel = tU;
  let strokeColor = '#38bdf8'; // Cyan
  let fillColor = 'rgba(56, 189, 248, 0.22)';

  if (activeMetric === 'precip') {
    dataValues = precips;
    unitLabel = '%';
    strokeColor = '#60a5fa'; // Blue
    fillColor = 'rgba(96, 165, 250, 0.25)';
  } else if (activeMetric === 'wind') {
    dataValues = winds;
    unitLabel = ` ${wU}`;
    strokeColor = '#a78bfa'; // Purple
    fillColor = 'rgba(167, 139, 250, 0.22)';
  }

  const minVal = Math.min(...dataValues);
  const maxVal = Math.max(...dataValues);
  const range = maxVal - minVal || 1;

  // Compute points
  const points = dataValues.map((val, i) => {
    const x = paddingX + (i / (hours.length - 1)) * plotWidth;
    const y = paddingY + plotHeight - ((val - minVal) / range) * plotHeight;
    return { x, y, val };
  });

  // Create smooth cubic bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  // Handle scrubber tracking
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, (clientX - paddingX) / plotWidth));
    const idx = Math.round(pct * (hours.length - 1));
    setHoveredIdx(idx);
  };

  const currentPt = points[hoveredIdx] || points[0];

  return (
    <section className="apple-card hourly-chart-card" aria-label="Interactive 24-Hour Weather Chart">
      <div className="hourly-chart__top">
        <div className="apple-card__header" style={{ marginBottom: 0 }}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="apple-card__title">24-HOUR INTERACTIVE RADIAL CHART</span>
        </div>

        {/* Metric Segmented Toggle */}
        <div className="apple-segmented-toggle">
          <button
            type="button"
            className={`apple-seg-btn${activeMetric === 'temp' ? ' apple-seg-btn--active' : ''}`}
            onClick={() => setActiveMetric('temp')}
          >
            🌡️ Temp
          </button>
          <button
            type="button"
            className={`apple-seg-btn${activeMetric === 'precip' ? ' apple-seg-btn--active' : ''}`}
            onClick={() => setActiveMetric('precip')}
          >
            💧 Rain
          </button>
          <button
            type="button"
            className={`apple-seg-btn${activeMetric === 'wind' ? ' apple-seg-btn--active' : ''}`}
            onClick={() => setActiveMetric('wind')}
          >
            💨 Wind
          </button>
        </div>
      </div>

      {/* Floating Scrubbed Inspection Pill */}
      <div className="hourly-chart__inspector">
        <div className="inspector__time">
          <span>{hoveredIdx === 0 ? 'Now' : formatHour(activeHour.time)}</span>
          <span className="inspector__icon">{activeInfo.icon}</span>
        </div>
        <div className="inspector__metrics">
          <span className="inspector__pill">
            <strong>{convertTemp(activeHour.temperature, units)}{tU}</strong>
          </span>
          <span className="inspector__pill">
            💧 {activeHour.precipProbability || 0}% Rain
          </span>
          <span className="inspector__pill">
            💨 {convertWind(activeHour.windSpeed, units)} {wU}
          </span>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div
        ref={containerRef}
        className="hourly-chart__canvas-wrap"
        onMouseMove={handleMouseMove}
        onTouchMove={(e) => {
          if (e.touches[0]) handleMouseMove(e.touches[0]);
        }}
      >
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="hourly-chart__svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background area fill */}
          <path d={areaD} fill="url(#chartGrad)" />

          {/* Smooth bezier spline */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Vertical scrubber line */}
          <line
            x1={currentPt.x}
            y1={0}
            x2={currentPt.x}
            y2={svgHeight}
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Glowing scrubber node */}
          <circle cx={currentPt.x} cy={currentPt.y} r="6" fill="#ffffff" stroke={strokeColor} strokeWidth="3" />
        </svg>

        {/* X-Axis Hour Ticks */}
        <div className="hourly-chart__ticks">
          {hours.filter((_, i) => i % 3 === 0).map((h, i) => (
            <span key={i} className="hourly-chart__tick">
              {i === 0 ? 'Now' : formatHour(h.time)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
