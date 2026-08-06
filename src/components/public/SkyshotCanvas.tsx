import React, { useEffect, useRef } from 'react';

interface Rocket {
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetY: number;
  speed: number;
  color: string;
  trail: { x: number; y: number }[];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  gravity: number;
  friction: number;
}

const PALETTES = [
  ['#f59e0b', '#fbbf24', '#fef08a', '#ffffff'], // Gold & Warm White
  ['#ef4444', '#f87171', '#fca5a5', '#ffffff'], // Crimson Red & Silver
  ['#10b981', '#34d399', '#a7f3d0', '#fbbf24'], // Emerald & Gold
  ['#3b82f6', '#60a5fa', '#bfdbfe', '#ffffff'], // Royal Sapphire & White
  ['#8b5cf6', '#c084fc', '#f472b6', '#fbbf24'], // Violet & Fuchsia
];

export const SkyshotCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const rockets: Rocket[] = [];
    const particles: Particle[] = [];

    const spawnRocket = () => {
      const launchX = Math.random() * (width * 0.8) + width * 0.1;
      const targetY = Math.random() * (height * 0.45) + height * 0.1;
      const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      const color = palette[0];

      rockets.push({
        x: launchX,
        y: height,
        startX: launchX,
        startY: height,
        targetY,
        speed: Math.random() * 3 + 7,
        color,
        trail: [],
      });
    };

    const explode = (x: number, y: number, colorScheme: string[]) => {
      const particleCount = Math.floor(Math.random() * 40) + 60; // 60-100 stars per skyshot burst
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 1.5;
        const color = colorScheme[Math.floor(Math.random() * colorScheme.length)];

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.012,
          size: Math.random() * 2.5 + 1.5,
          gravity: 0.08,
          friction: 0.96,
        });
      }
    };

    let lastSpawn = 0;

    const render = (time: number) => {
      // Semi-transparent clear to produce realistic fading light trails
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';

      // Auto spawn skyshots at natural cadence
      if (time - lastSpawn > Math.random() * 800 + 600) {
        spawnRocket();
        lastSpawn = time;
      }

      // Update & Render Rockets (Rising Trails)
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 8) r.trail.shift();

        // Move Rocket upwards
        r.y -= r.speed;

        // Draw Trail
        ctx.beginPath();
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2.5;
        if (r.trail.length > 1) {
          ctx.moveTo(r.trail[0].x, r.trail[0].y);
          for (let t = 1; t < r.trail.length; t++) {
            ctx.lineTo(r.trail[t].x, r.trail[t].y);
          }
          ctx.stroke();
        }

        // Draw Rocket Head Glow
        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Check Burst Height
        if (r.y <= r.targetY) {
          const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
          explode(r.x, r.y, palette);
          rockets.splice(i, 1);
        }
      }

      // Update & Render Explosion Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra outer glow ring for large sparkles
        if (p.size > 2) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
    />
  );
};
