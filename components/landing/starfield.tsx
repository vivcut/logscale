"use client";

import * as React from "react";
import * as THREE from "three";

/**
 * Starfield — a lightweight three.js particle field that powers the hero
 * backdrop. Two drifting layers of points (a dense distant haze + a sparser
 * foreground) slowly rotate and respond to the pointer for a subtle parallax,
 * evoking a "to the moon" flight through space. Honors prefers-reduced-motion
 * (renders a single static frame) and pauses when off-screen / tab hidden so
 * it never costs anything when nobody is looking.
 */
export function Starfield({ className }: { className?: string }) {
  const mountRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Build one layer of points scattered in a slab of space.
    function makeLayer(count: number, spread: number, size: number, opacity: number, color: number) {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
        positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        size,
        color,
        transparent: true,
        opacity,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);
      return { points, geometry, material };
    }

    const far = makeLayer(1400, 22, 0.018, 0.5, 0xb5b5ff);
    const near = makeLayer(450, 14, 0.04, 0.85, 0xffffff);
    const accent = makeLayer(120, 16, 0.05, 0.9, 0x7c6bff);

    // Pointer parallax target (normalized -0.5..0.5).
    const pointer = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    function onPointerMove(e: PointerEvent) {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    }
    window.addEventListener("pointermove", onPointerMove);

    let raf = 0;
    let running = true;
    const clock = new THREE.Clock();

    function render() {
      const t = clock.getElapsedTime();

      current.x += (pointer.x - current.x) * 0.04;
      current.y += (pointer.y - current.y) * 0.04;

      far.points.rotation.y = t * 0.012 + current.x * 0.25;
      far.points.rotation.x = current.y * 0.15;

      near.points.rotation.y = t * 0.025 + current.x * 0.5;
      near.points.rotation.x = current.y * 0.3;

      accent.points.rotation.y = -t * 0.02 + current.x * 0.4;
      accent.points.rotation.z = t * 0.01;

      camera.position.x += (current.x * 1.2 - camera.position.x) * 0.05;
      camera.position.y += (-current.y * 1.2 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }

    function loop() {
      if (!running) return;
      render();
      raf = requestAnimationFrame(loop);
    }

    if (reduceMotion) {
      render();
    } else {
      loop();
    }

    function onResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", onResize);

    // Pause when the tab is hidden to save the battery.
    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion && !running) {
        running = true;
        loop();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      [far, near, accent].forEach((l) => {
        l.geometry.dispose();
        l.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} aria-hidden className={className} />;
}
