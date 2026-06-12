"use client";

import * as React from "react";

type Wave = { x: number; y: number; t: number };

/**
 * Ripple — a sleek, lightweight interactive backdrop. A faint dot grid sits in
 * the background; as the cursor moves it both lights up nearby dots (a soft
 * spotlight) and drops expanding ripple rings that ride outward and fade. Pure
 * 2D canvas, no Three.js — cheap and buttery. Honors prefers-reduced-motion
 * (static grid only) and pauses when the tab is hidden.
 */
export function Ripple({ className }: { className?: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const parent = canvas.parentElement ?? document.body;
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const GAP = 34; // px between dots
    const pointer = { x: -9999, y: -9999, active: false };
    const eased = { x: -9999, y: -9999 };
    const waves: Wave[] = [];
    let lastDrop = 0;

    // Accent color (indigo) sampled to match the rest of the page.
    const ACCENT = [124, 107, 255];

    function resize() {
      width = parent.clientWidth;
      height = parent.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;

      const now = performance.now();
      // Drop a fresh ripple at a throttled cadence while moving.
      if (!reduceMotion && now - lastDrop > 90) {
        waves.push({ x: pointer.x, y: pointer.y, t: now });
        if (waves.length > 14) waves.shift();
        lastDrop = now;
      }
    }
    function onLeave() {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);

    const SPOTLIGHT = 150; // px radius of cursor glow
    const RING_SPEED = 0.18; // px per ms
    const RING_LIFE = 1400; // ms

    function frame(now: number) {
      ctx!.clearRect(0, 0, width, height);

      // Ease the spotlight toward the pointer for smoothness.
      if (pointer.active) {
        if (eased.x < -9000) {
          eased.x = pointer.x;
          eased.y = pointer.y;
        }
        eased.x += (pointer.x - eased.x) * 0.12;
        eased.y += (pointer.y - eased.y) * 0.12;
      }

      const cols = Math.ceil(width / GAP) + 1;
      const rows = Math.ceil(height / GAP) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * GAP;
          const y = j * GAP;

          // Base dim dot.
          let alpha = 0.05;
          let size = 1;
          let r = 130;
          let g = 130;
          let b = 150;

          // Cursor spotlight contribution.
          if (pointer.active) {
            const dx = x - eased.x;
            const dy = y - eased.y;
            const dist = Math.hypot(dx, dy);
            if (dist < SPOTLIGHT) {
              const k = 1 - dist / SPOTLIGHT;
              alpha += k * 0.5;
              size += k * 1.6;
              r += (ACCENT[0] - r) * k;
              g += (ACCENT[1] - g) * k;
              b += (ACCENT[2] - b) * k;
            }
          }

          // Ripple ring contributions.
          for (let w = 0; w < waves.length; w++) {
            const age = now - waves[w].t;
            if (age > RING_LIFE) continue;
            const radius = age * RING_SPEED;
            const dx = x - waves[w].x;
            const dy = y - waves[w].y;
            const dist = Math.hypot(dx, dy);
            const band = Math.abs(dist - radius);
            if (band < 26) {
              const ring = (1 - band / 26) * (1 - age / RING_LIFE);
              alpha += ring * 0.6;
              size += ring * 1.8;
              r += (ACCENT[0] - r) * ring;
              g += (ACCENT[1] - g) * ring;
              b += (ACCENT[2] - b) * ring;
            }
          }

          if (alpha <= 0.051 && size <= 1.01) {
            // Fast path for untouched dots.
            ctx!.fillStyle = "rgba(130,130,150,0.05)";
            ctx!.fillRect(x - 0.5, y - 0.5, 1, 1);
            continue;
          }

          ctx!.beginPath();
          ctx!.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${Math.min(
            alpha,
            0.95
          )})`;
          ctx!.arc(x, y, size, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      if (running) raf = requestAnimationFrame(frame);
    }

    let raf = 0;
    let running = true;

    if (reduceMotion) {
      frame(performance.now());
      running = false;
    } else {
      raf = requestAnimationFrame(frame);
    }

    function onResize() {
      resize();
    }
    window.addEventListener("resize", onResize);

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
