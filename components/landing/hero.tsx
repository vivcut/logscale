"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { ArrowUp } from "@/components/icons";
import { Button } from "@/components/ui/button";

// --- STATS CONFIGURATION ---
const STATS = [
  { value: "600+", label: "startups use us" },
  { value: "2 min", label: "to live workspace" },
  { value: "99.9%", label: "uptime" },
];

const PREVIEW_ROWS = [
  { status: "completed", title: "Anonymous voting", votes: 511 },
  { status: "in-progress", title: "Custom domains", votes: 342 },
  { status: "planned", title: "Slack notifications", votes: 128 },
];

const STATUS_DOT: Record<string, string> = {
  completed: "bg-emerald-500",
  "in-progress": "bg-chart-1",
  planned: "bg-muted-foreground",
};

// Generates a crisp, anti-aliased round circle texture for perfectly round stars
function createCircleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

// --- CLEAN INTERACTIVE FLOATING STARS ---
function CleanStars() {
  const pointsRef = React.useRef<THREE.Points>(null);
  const { pointer, viewport } = useThree();
  const count = 1000; 

  const starTexture = React.useMemo(() => createCircleTexture(), []);

  // Targets to decouple direct mouse snapping for a smooth drag glide
  const smoothPointer = React.useRef({ x: 0, y: 0 });

  // Generate random positions, unique drift factors, sizes, and original track matrices
  const { positions, driftFactors, initialPositions, starSizes } = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    const factors = new Float32Array(count * 3);
    const initPos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      const x = (Math.random() - 0.5) * 26;
      const y = (Math.random() - 0.5) * 18;
      const z = (Math.random() - 0.5) * 8;

      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;

      initPos[i3] = x;
      initPos[i3 + 1] = y;
      initPos[i3 + 2] = z;

      // Perfectly balanced micro-drift speeds (Noticeable but slow and premium)
      factors[i3] = (Math.random() - 0.5) * 0.0015;
      factors[i3 + 1] = (Math.random() - 0.5) * 0.0015;
      factors[i3 + 2] = (Math.random() - 0.5) * 0.0005;

      // Small and elegant micro-varied dimensions
      sizes[i] = 0.03 + Math.random() * 0.06;
    }
    return { positions: pos, driftFactors: factors, initialPositions: initPos, starSizes: sizes };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const time = state.clock.getElapsedTime();

    // Heavy lerping introduces maximum physics inertia to ease out quick jerks
    smoothPointer.current.x = THREE.MathUtils.lerp(smoothPointer.current.x, pointer.x, 0.01);
    smoothPointer.current.y = THREE.MathUtils.lerp(smoothPointer.current.y, pointer.y, 0.01);

    // Map interpolated coordinate track boundaries
    const targetX = smoothPointer.current.x * (viewport.width / 2);
    const targetY = smoothPointer.current.y * (viewport.height / 2);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // 1. Calculate Base Ambient Drift + Wave cycles
      const moveX = driftFactors[i3] + Math.sin(time * 0.05 + i) * 0.0002;
      const moveY = driftFactors[i3 + 1] + Math.cos(time * 0.05 + i) * 0.0002;
      const moveZ = driftFactors[i3 + 2];

      // Mutate baseline position anchors so ambient movement doesn't get canceled out
      initialPositions[i3] += moveX;
      initialPositions[i3 + 1] += moveY;
      initialPositions[i3 + 2] += moveZ;

      // Apply the movement to the current render coordinates
      posAttr.array[i3] += moveX;
      posAttr.array[i3 + 1] += moveY;
      posAttr.array[i3 + 2] += moveZ;

      let x = posAttr.array[i3];
      let y = posAttr.array[i3 + 1];

      // 2. Slow Orbiting Interactive "Swish" Physics
      const dx = x - targetX;
      const dy = y - targetY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 5) {
        const pullStrength = (5 - distance) * 0.0004;
        posAttr.array[i3] += -dy * pullStrength;
        posAttr.array[i3 + 1] += dx * pullStrength;
      } else {
        // Smoothly ease back toward their naturally drifting anchor points
        posAttr.array[i3] += (initialPositions[i3] - x) * 0.01;
        posAttr.array[i3 + 1] += (initialPositions[i3 + 1] - y) * 0.01;
      }

      // Continuous loop seamless container spatial re-wraps
      if (posAttr.array[i3] > 14) { posAttr.array[i3] = -14; initialPositions[i3] = -14; }
      if (posAttr.array[i3] < -14) { posAttr.array[i3] = 14; initialPositions[i3] = 14; }
      if (posAttr.array[i3 + 1] > 10) { posAttr.array[i3 + 1] = -10; initialPositions[i3 + 1] = -10; }
      if (posAttr.array[i3 + 1] < -10) { posAttr.array[i3 + 1] = 10; initialPositions[i3 + 1] = 10; }
    }

    posAttr.needsUpdate = true;

    // Fluid, muted parallax camera adjustments
    pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, smoothPointer.current.y * 0.015, 0.005);
    pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, smoothPointer.current.x * 0.015, 0.005);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[starSizes, 1]}
        />
      </bufferGeometry>
      {/* Perfectly rounded tiny star nodes */}
      <pointsMaterial
        map={starTexture}
        color="#ffffff"
        size={0.12} 
        sizeAttenuation={true}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function AmbientBackground({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <CleanStars />
      </Canvas>
    </div>
  );
}

// --- MAIN HERO COMPONENT ---
export function Hero() {
  const reduce = useReducedMotion();

  const fade = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.7,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <section className="relative isolate overflow-hidden bg-black">
      {/* Dynamic Ambient Background Component */}
      <AmbientBackground className="pointer-events-none opacity-50 absolute inset-0 -z-10 h-full w-full" />

      {/* Modern subtle radial glow centered behind your copy */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(75%_60%_at_50%_20%,oklch(1_0_0/0.04)_0%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-b from-transparent to-background"
      />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-28 pt-36 text-center md:pt-44">
        <motion.h1
          {...fade(0.08)}
          className="mt-7 max-w-4xl text-balance text-5xl leading-[1.05] tracking-tight md:text-[88px]"
        >
          Let your users know 
          <br />
          what's going on
        </motion.h1>

        <motion.p
          {...fade(0.16)}
          className="mt-10 max-w-xl text-balance text-xl text-white"
        >
          Feedback boards, kanban roadmaps, changelogs, surveys, and status
          pages — one sleek, high-performance workspace built for startups and
          indie developers.
        </motion.p>

        <motion.div
          {...fade(0.24)}
          className="mt-12 flex flex-col gap-3 sm:flex-row"
        >
          <Button size="lg" asChild>
            <Link href="/login">
              Start for free
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">Explore features</Link>
          </Button>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          {...fade(0.5)}
          className="mt-26 grid w-full max-w-2xl grid-cols-3 space-x-2 bg-transparent overflow-hidden"
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 bg-card px-3 py-5"
            >
              <span className="text-xl font-medium tracking-tight md:text-3xl">
                {s.value}
              </span>
              <span className="text-center text-xs text-muted-foreground">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// --- SUB-COMPONENTS ---
function FloatingPreview({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      animate={reduce ? undefined : { y: [0, -10, 0] }}
      transition={
        reduce
          ? undefined
          : { duration: 6, repeat: Infinity, ease: "easeInOut" }
      }
      className="overflow-hidden rounded-2xl border border-border bg-card/80 text-left shadow-2xl shadow-black/40 backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-destructive/70" />
        <span className="size-2.5 rounded-full bg-chart-4/70" />
        <span className="size-2.5 rounded-full bg-emerald-500/70" />
        <span className="ml-3 font-mono text-xs text-muted-foreground">
          tothemoon.app/roadmap
        </span>
      </div>
      <div className="flex items-center justify-between px-5 pb-3 pt-4">
        <span className="text-sm font-semibold tracking-tight">
          What&apos;s shipping next
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          sorted by upvotes
        </span>
      </div>
      <div className="px-2 pb-3">
        {PREVIEW_ROWS.map((r) => (
          <div
            key={r.title}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-secondary/60"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`size-2 rounded-full ${STATUS_DOT[r.status]}`}
              />
              <span className="text-sm font-medium">{r.title}</span>
              <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
                {r.status}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-xs tabular-nums">
              <ArrowUp className="size-3" />
              {r.votes}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}