"use client";

import React, { useRef, useId } from "react";

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  intensity?: "subtle" | "medium" | "strong";
  variant?: "card" | "navbar" | "modal" | "pill" | "input";
  hoverGlow?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

const intensityMap = {
  subtle: { blur: 12, scale: 6, opacity: 0.55 },
  medium: { blur: 20, scale: 10, opacity: 0.65 },
  strong: { blur: 30, scale: 14, opacity: 0.75 },
};

const variantStyles: Record<string, string> = {
  card: "rounded-2xl p-5",
  navbar: "rounded-none",
  modal: "rounded-3xl p-8",
  pill: "rounded-full px-4 py-1.5",
  input: "rounded-xl px-4 py-3",
};

export function LiquidGlass({
  children,
  className = "",
  intensity = "medium",
  variant = "card",
  hoverGlow = true,
  as: Component = "div",
}: LiquidGlassProps) {
  const filterId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const config = intensityMap[intensity];

  const Wrapper = Component as React.ElementType;

  return (
    <>
      {/* SVG displacement filter — Apple Liquid Glass refraction effect */}
      <svg
        aria-hidden="true"
        className="absolute h-0 w-0 overflow-hidden"
        style={{ position: "absolute", width: 0, height: 0 }}
      >
        <defs>
          <filter id={`liquid-glass-${filterId}`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="3"
              seed="1"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={config.scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <Wrapper
        ref={containerRef}
        className={`
          relative overflow-hidden
          ${variantStyles[variant] || variantStyles.card}
          ${className}
        `}
        style={{
          backdropFilter: `blur(${config.blur}px) saturate(1.8)`,
          WebkitBackdropFilter: `blur(${config.blur}px) saturate(1.8)`,
          background: `rgba(255, 255, 255, ${config.opacity})`,
        }}
      >
        {/* Top edge highlight — refractive light simulation */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.8) 70%, transparent 100%)",
          }}
        />

        {/* Inner border glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        />

        {/* Outer shadow — frosted depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            boxShadow: `
              0 4px 24px -4px rgba(0, 0, 0, 0.06),
              0 1px 4px -1px rgba(0, 0, 0, 0.04)
            `,
          }}
        />

        {/* Hover glow overlay */}
        {hoverGlow && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 hover-parent-glow"
            style={{
              boxShadow: "0 0 30px -5px rgba(0, 180, 251, 0.15)",
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </Wrapper>
    </>
  );
}

/* Glass Input — consistent with liquid glass system */
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function GlassInput({
  label,
  error,
  icon,
  className = "",
  ...props
}: GlassInputProps) {
  const inputId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#00b4fb]">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full rounded-xl px-4 py-3 text-sm text-slate-900
            bg-white/70 backdrop-blur-sm
            border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]
            outline-none
            transition-all duration-200 ease-out
            placeholder:text-slate-400
            focus:bg-white/90 focus:border-[#00b4fb]/40
            focus:shadow-[0_0_0_3px_rgba(0,180,251,0.1),inset_0_1px_0_rgba(255,255,255,0.3)]
            ${icon ? "pl-10" : ""}
            ${error ? "border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

/* Glass Button — consistent with liquid glass system */
interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function GlassButton({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  disabled,
  ...props
}: GlassButtonProps) {
  const sizeStyles = {
    sm: "px-3.5 py-2 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3.5 text-base gap-2.5",
  };

  const variantStyles = {
    primary: `
      bg-[#00b4fb] text-white font-semibold
      shadow-[0_1px_2px_rgba(0,180,251,0.3),inset_0_1px_0_rgba(255,255,255,0.25)]
      hover:bg-[#009ce0] hover:shadow-[0_4px_16px_rgba(0,180,251,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]
      active:scale-[0.98] active:shadow-[0_1px_2px_rgba(0,180,251,0.2)]
    `,
    secondary: `
      bg-white/70 backdrop-blur-sm text-slate-800 font-semibold
      border border-white/40 shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]
      hover:bg-white/90 hover:border-slate-200
      active:scale-[0.98]
    `,
    ghost: `
      bg-transparent text-slate-600 font-medium
      hover:bg-white/50 hover:text-slate-900
      active:scale-[0.98]
    `,
    danger: `
      bg-red-500/90 text-white font-semibold
      shadow-[0_1px_2px_rgba(239,68,68,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]
      hover:bg-red-600 hover:shadow-[0_4px_16px_rgba(239,68,68,0.3)]
      active:scale-[0.98]
    `,
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center rounded-xl
        transition-all duration-200 ease-out
        disabled:opacity-50 disabled:pointer-events-none
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
