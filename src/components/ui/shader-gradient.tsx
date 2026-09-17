"use client";

import React, { useRef, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────────
   ShaderGradient — WebGL-free animated gradient
   
   Inspired by React Bits Aurora/Grainient patterns.
   Uses CSS animations + layered radial gradients
   for a living, organic background without WebGL
   overhead. Colors adapted to Buysoft palette.
   ───────────────────────────────────────────────── */

interface ShaderGradientProps {
  className?: string;
  variant?: "aurora" | "mesh" | "waves";
  colors?: string[];
  speed?: "slow" | "normal" | "fast";
  intensity?: "subtle" | "medium" | "strong";
  grain?: boolean;
}

const defaultColors: Record<string, string[]> = {
  aurora: [
    "rgba(0, 180, 251, 0.4)",   // Buysoft Cyan
    "rgba(0, 132, 190, 0.35)",  // Deep Sky Blue
    "rgba(9, 13, 22, 0.2)",     // Slate Navy
    "rgba(56, 189, 248, 0.25)", // Light Sky
  ],
  mesh: [
    "rgba(0, 180, 251, 0.3)",
    "rgba(0, 132, 190, 0.25)",
    "rgba(14, 165, 233, 0.2)",
    "rgba(186, 230, 253, 0.3)",
  ],
  waves: [
    "rgba(0, 180, 251, 0.35)",
    "rgba(0, 132, 190, 0.3)",
    "rgba(2, 132, 199, 0.2)",
    "rgba(56, 189, 248, 0.15)",
  ],
};

const speedMap = {
  slow: 25,
  normal: 16,
  fast: 10,
};

export function ShaderGradient({
  className = "",
  variant = "aurora",
  colors,
  speed = "normal",
  intensity = "medium",
  grain = true,
}: ShaderGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const activeColors = colors || defaultColors[variant];
  const animDuration = speedMap[speed];

  const opacityMultiplier =
    intensity === "subtle" ? 0.6 : intensity === "strong" ? 1.3 : 1;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      ctx.clearRect(0, 0, w, h);

      // Base background
      ctx.fillStyle = "#f0f6ff";
      ctx.fillRect(0, 0, w, h);

      // Animated gradient orbs
      activeColors.forEach((color, i) => {
        const phase = (time / (animDuration * 1000)) * Math.PI * 2;
        const offset = (i / activeColors.length) * Math.PI * 2;

        const cx = w * (0.3 + 0.4 * Math.sin(phase + offset));
        const cy = h * (0.3 + 0.4 * Math.cos(phase * 0.7 + offset * 1.3));
        const radius = Math.max(w, h) * (0.3 + 0.1 * Math.sin(phase * 0.5 + i));

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "transparent");

        ctx.globalAlpha = opacityMultiplier;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      });

      ctx.globalAlpha = 1;
    },
    [activeColors, animDuration, opacityMultiplier],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    let startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const rect = canvas!.getBoundingClientRect();
      draw(ctx!, rect.width, rect.height, elapsed);
      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [draw]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />

      {/* Film grain overlay */}
      {grain && (
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />
      )}

      {/* Content rendered above gradient */}
      <div className="relative z-10 w-full h-full">{/* children slot unused — this is a background */}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   StaticGradientBg — lightweight static gradient
   for dashboard backgrounds (no animation overhead)
   ───────────────────────────────────────────────── */

interface StaticGradientBgProps {
  className?: string;
  children?: React.ReactNode;
}

export function StaticGradientBg({
  className = "",
  children,
}: StaticGradientBgProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 10% 20%, rgba(0, 180, 251, 0.06) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 85% 75%, rgba(0, 132, 190, 0.04) 0%, transparent 50%),
          radial-gradient(ellipse 70% 40% at 50% 10%, rgba(186, 230, 253, 0.08) 0%, transparent 60%),
          linear-gradient(180deg, #f0f6ff 0%, #f8fafc 50%, #f4f8fe 100%)
        `,
      }}
    >
      {children}
    </div>
  );
}
