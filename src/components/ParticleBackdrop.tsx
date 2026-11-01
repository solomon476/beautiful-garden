import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  alpha: number;
  alphaSpeed: number;
  hue: number;
}

export const ParticleBackdrop: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate floating firefly and star particles
    const particleCount = Math.min(45, Math.floor((width * height) / 22000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 1.2,
        speedX: (Math.random() - 0.5) * 0.45,
        speedY: -Math.random() * 0.4 - 0.1,
        alpha: Math.random() * 0.7 + 0.3,
        alphaSpeed: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        hue: Math.random() > 0.35 ? 48 : 330, // Golden fireflies & soft rose sparkles
      });
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw and update each particle
      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.x += p.speedX;
          p.y += p.speedY;
          p.alpha += p.alphaSpeed;

          if (p.alpha > 0.95 || p.alpha < 0.2) {
            p.alphaSpeed = -p.alphaSpeed;
          }

          // Loop boundaries smoothly
          if (p.y < -10) p.y = height + 10;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        // Glow halo
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.5);
        glow.addColorStop(0, `hsla(${p.hue}, 95%, 75%, ${p.alpha})`);
        glow.addColorStop(0.5, `hsla(${p.hue}, 90%, 65%, ${p.alpha * 0.4})`);
        glow.addColorStop(1, `hsla(${p.hue}, 90%, 60%, 0)`);

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Core bright point
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.alpha + 0.2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="garden-backdrop-container">
      {/* High-res backdrop image */}
      <img
        src="/assets/dreamy_night_garden.jpg"
        alt="Romantic Dreamy Night Garden"
        className="garden-backdrop-image"
      />
      {/* Twilight atmospheric overlay */}
      <div className="garden-overlay-gradient" />
      {/* Live fireflies and starlight canvas */}
      <canvas ref={canvasRef} className="particle-canvas" />

      {/* Floating flower petals simulation */}
      <div className="floating-petals-container" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="floating-petal"
            style={{
              left: `${15 + i * 16}%`,
              animationDuration: `${14 + i * 3}s`,
              animationDelay: `${i * 2.5}s`,
              width: `${12 + (i % 3) * 4}px`,
              height: `${16 + (i % 3) * 5}px`,
              background: i % 2 === 0 ? '#fbcfe8' : '#fda4af',
              borderRadius: '50% 0 50% 50%',
              transform: 'rotate(-45deg)',
              boxShadow: '0 0 10px rgba(244, 114, 182, 0.4)',
            }}
          />
        ))}
      </div>
    </div>
  );
};
