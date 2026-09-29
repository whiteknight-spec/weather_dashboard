import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/** Procedural fallback canvas texture if network texture is delayed */
function createProceduralEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0, '#0a1628');
  oceanGrad.addColorStop(0.5, '#0e2444');
  oceanGrad.addColorStop(1, '#0a1628');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Grid lines (lat / lon)
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
  ctx.lineWidth = 1;
  for (let y = 0; y <= 512; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }
  for (let x = 0; x <= 1024; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  // Stylized landmass blobs for continents
  ctx.fillStyle = '#1e3a8a';
  const drawContinent = (cx, cy, rx, ry) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  // North America
  drawContinent(260, 180, 110, 70);
  // South America
  drawContinent(320, 340, 60, 95);
  // Europe
  drawContinent(520, 160, 55, 45);
  // Africa
  drawContinent(530, 270, 70, 90);
  // Asia
  drawContinent(720, 190, 140, 85);
  // India
  drawContinent(680, 240, 40, 50);
  // Australia
  drawContinent(840, 370, 70, 55);

  return new THREE.CanvasTexture(canvas);
}

/** Convert latitude and longitude to 3D Cartesian coordinates on a sphere */
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export default function GlobeViewer({ location, weatherData }) {
  const mountRef = useRef(null);
  const globeGroupRef = useRef(null);
  const markerRef = useRef(null);
  const pulseRingRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);
  const [focused, setFocused] = useState(false);

  const cityName = location?.city || location?.name || 'Earth';
  const countryName = location?.country || '';
  const lat = location?.latitude ?? 13.0878;
  const lon = location?.longitude ?? 80.2785;
  const temp = weatherData?.current?.temperature;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 280;

    // ── Scene, Camera, Renderer ──────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // ── Lighting ──────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const blueRimLight = new THREE.DirectionalLight(0x6366f1, 1.5);
    blueRimLight.position.set(-5, -2, -3);
    scene.add(blueRimLight);

    // ── Globe Group ───────────────────────────────────────
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Earth Sphere
    const earthRadius = 1.5;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

    // Initial material with procedural texture
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: createProceduralEarthTexture(),
      roughness: 0.7,
      metalness: 0.1,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // Load high-resolution photographic earth texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_atmos_2048.jpg',
      (texture) => {
        earthMaterial.map = texture;
        earthMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback procedural texture already loaded
      },
    );

    // Clouds Sphere (slightly larger)
    const cloudsGeometry = new THREE.SphereGeometry(earthRadius + 0.02, 48, 48);
    const cloudsMaterial = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      color: 0xffffff,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    globeGroup.add(cloudsMesh);

    textureLoader.load(
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/planets/earth_clouds_1024.png',
      (cloudTexture) => {
        cloudsMaterial.map = cloudTexture;
        cloudsMaterial.needsUpdate = true;
      },
    );

    // Atmospheric outer glow
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius + 0.08, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // ── Location Marker Beacon ─────────────────────────────
    const markerGroup = new THREE.Group();
    globeGroup.add(markerGroup);
    markerRef.current = markerGroup;

    // Glowing dot
    const pinGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    const pinMaterial = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const pinMesh = new THREE.Mesh(pinGeometry, pinMaterial);
    markerGroup.add(pinMesh);

    // Pulsing outer ring
    const ringGeometry = new THREE.RingGeometry(0.05, 0.075, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const pulseRing = new THREE.Mesh(ringGeometry, ringMaterial);
    markerGroup.add(pulseRing);
    pulseRingRef.current = pulseRing;

    // Stem pointing to surface
    const stemGeometry = new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8);
    const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const stemMesh = new THREE.Mesh(stemGeometry, stemMaterial);
    markerGroup.add(stemMesh);

    // Update marker location
    const updateMarkerPosition = (latitude, longitude) => {
      const pos = latLonToVector3(latitude, longitude, earthRadius + 0.02);
      markerGroup.position.copy(pos);
      markerGroup.lookAt(pos.clone().multiplyScalar(2));
    };

    updateMarkerPosition(lat, lon);

    // Rotate globe initially so the active city faces the camera
    const targetRotY = -((lon + 90) * Math.PI) / 180;
    const targetRotX = (lat * Math.PI) / 180;
    globeGroup.rotation.y = targetRotY;
    globeGroup.rotation.x = Math.max(-0.6, Math.min(0.6, targetRotX));

    // ── Mouse & Touch Drag Interactions ────────────────────
    const onMouseDown = (e) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e) => {
      if (!isDraggingRef.current || !globeGroupRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      globeGroupRef.current.rotation.y += deltaX * 0.005;
      globeGroupRef.current.rotation.x = Math.max(
        -1.2,
        Math.min(1.2, globeGroupRef.current.rotation.x + deltaY * 0.005),
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    // Touch support
    const onTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        previousMousePositionRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const onTouchMove = (e) => {
      if (!isDraggingRef.current || !globeGroupRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
      const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

      globeGroupRef.current.rotation.y += deltaX * 0.006;
      globeGroupRef.current.rotation.x = Math.max(
        -1.2,
        Math.min(1.2, globeGroupRef.current.rotation.x + deltaY * 0.006),
      );

      previousMousePositionRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // ── Animation Loop ─────────────────────────────────────
    let animationFrameId;
    let pulseScale = 1;
    let pulseDirection = 1;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Auto-rotation if enabled and user is not dragging
      if (autoRotate && !isDraggingRef.current && globeGroupRef.current) {
        globeGroupRef.current.rotation.y += 0.002;
      }

      // Slightly faster clouds rotation for parallax
      cloudsMesh.rotation.y += 0.0006;

      // Pulse ring animation
      if (pulseRingRef.current) {
        pulseScale += 0.015 * pulseDirection;
        if (pulseScale > 1.8) pulseDirection = -1;
        if (pulseScale < 1.0) pulseDirection = 1;
        pulseRingRef.current.scale.set(pulseScale, pulseScale, 1);
        ringMaterial.opacity = 0.9 - (pulseScale - 1) * 0.8;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ── Resize Observer ────────────────────────────────────
    const resizeObserver = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        if (!entries || !entries.length) return;
        const entry = entries[0];
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && camera && renderer) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      });
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      domElement.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      cloudsGeometry.dispose();
      cloudsMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
    };
  }, [autoRotate]);

  // Update marker position and snap globe when location changes
  useEffect(() => {
    if (!globeGroupRef.current || !markerRef.current) return;

    const pos = latLonToVector3(lat, lon, 1.5 + 0.02);
    markerRef.current.position.copy(pos);
    markerRef.current.lookAt(pos.clone().multiplyScalar(2));

    // Smoothly rotate to face the new city
    const targetY = -((lon + 90) * Math.PI) / 180;
    const targetX = (lat * Math.PI) / 180;

    globeGroupRef.current.rotation.y = targetY;
    globeGroupRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, targetX));
  }, [lat, lon]);

  // Handler to center on active city
  const handleFocusCity = () => {
    if (!globeGroupRef.current) return;
    const targetY = -((lon + 90) * Math.PI) / 180;
    const targetX = (lat * Math.PI) / 180;
    globeGroupRef.current.rotation.y = targetY;
    globeGroupRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, targetX));
    setFocused(true);
    setTimeout(() => setFocused(false), 1200);
  };

  return (
    <div className="globe-card">
      <div className="globe-card__header">
        <div className="globe-card__title">
          <span className="globe-card__pulse-dot" />
          <span className="globe-card__heading">3D Earth Interactive</span>
        </div>
        <div className="globe-card__controls">
          <button
            type="button"
            className={`globe-card__btn${autoRotate ? ' globe-card__btn--active' : ''}`}
            onClick={() => setAutoRotate((prev) => !prev)}
            title={autoRotate ? 'Pause Earth Rotation' : 'Start Earth Rotation'}
          >
            {autoRotate ? '⏸ Pause' : '▶ Rotate'}
          </button>
          <button
            type="button"
            className={`globe-card__btn${focused ? ' globe-card__btn--highlight' : ''}`}
            onClick={handleFocusCity}
            title="Rotate globe to center on current city"
          >
            🎯 Center Pin
          </button>
        </div>
      </div>

      {/* 3D Canvas Mount */}
      <div className="globe-card__canvas-container" ref={mountRef}>
        <div className="globe-card__badge">
          <span className="globe-card__badge-city">
            📍 {cityName}
            {temp != null ? ` · ${temp}°` : ''}
          </span>
          <span className="globe-card__badge-coords">
            {lat.toFixed(2)}°, {lon.toFixed(2)}°
          </span>
        </div>
        <span className="globe-card__drag-hint">🖱️ Drag to rotate globe</span>
      </div>
    </div>
  );
}
