import { useEffect, useRef } from 'react';

export default function AtmosphericParticles({ weatherCode = 0, isDay = 1, enabled = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Determine particle mode
    let mode = 'clear';
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) {
      mode = 'rain';
    } else if ([95, 96, 99].includes(weatherCode)) {
      mode = 'thunder';
    } else if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
      mode = 'snow';
    } else if ([45, 48].includes(weatherCode)) {
      mode = 'fog';
    } else if ([2, 3].includes(weatherCode)) {
      mode = 'clouds';
    }

    // Particle pool
    const particleCount = mode === 'rain' || mode === 'thunder' ? 45 : mode === 'snow' ? 35 : 20;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        len: Math.random() * 14 + 10,
        speed: Math.random() * 4 + 4,
        rad: Math.random() * 2 + 1,
        alpha: Math.random() * 0.4 + 0.15,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    let lightningTimer = 0;
    let lightningAlpha = 0;

    const render = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Thunder sheet flash
      if (mode === 'thunder') {
        lightningTimer++;
        if (lightningTimer > 280 && Math.random() < 0.02) {
          lightningAlpha = 0.28;
          lightningTimer = 0;
        }
        if (lightningAlpha > 0) {
          ctx.fillStyle = `rgba(199, 210, 254, ${lightningAlpha})`;
          ctx.fillRect(0, 0, width, height);
          lightningAlpha -= 0.02;
        }
      }

      // Rain mode
      if (mode === 'rain' || mode === 'thunder') {
        ctx.strokeStyle = 'rgba(165, 243, 252, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (const p of particles) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + p.len);
          p.y += p.speed * 2.2;
          p.x -= 0.6;
          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        }
        ctx.stroke();
      }
      // Snow mode
      else if (mode === 'snow') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (const p of particles) {
          ctx.beginPath();
          p.swing += p.swingSpeed;
          p.x += Math.sin(p.swing) * 0.6;
          p.y += p.speed * 0.35;
          if (p.y > height) {
            p.y = -5;
            p.x = Math.random() * width;
          }
          ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Clear/Sunny mode: warm subtle floating light particles
      else {
        const pColor = isDay ? 'rgba(253, 224, 71, 0.18)' : 'rgba(199, 210, 254, 0.15)';
        ctx.fillStyle = pColor;
        for (const p of particles) {
          ctx.beginPath();
          p.swing += p.swingSpeed * 0.5;
          p.x += Math.sin(p.swing) * 0.3;
          p.y -= p.speed * 0.2;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          ctx.arc(p.x, p.y, p.rad * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [weatherCode, isDay, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="atmospheric-canvas"
      aria-hidden="true"
    />
  );
}
