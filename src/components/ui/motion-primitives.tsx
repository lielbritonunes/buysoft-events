"use client";

import React from "react";
import {
  motion,
  useReducedMotion,
  AnimatePresence,
  type Variants,
  type Transition,
} from "motion/react";

/* ─────────────────────────────────────────────────
   Spring presets — Apple-like physics defaults
   ───────────────────────────────────────────────── */

export const springs = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 },
  gentle: { type: "spring" as const, stiffness: 200, damping: 24, mass: 1 },
  bouncy: { type: "spring" as const, stiffness: 300, damping: 15, mass: 0.8 },
  slow: { type: "spring" as const, stiffness: 100, damping: 20, mass: 1.2 },
} satisfies Record<string, Transition>;

/* ─────────────────────────────────────────────────
   FadeIn — scroll-reveal with spring
   ───────────────────────────────────────────────── */

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  once?: boolean;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  distance = 24,
  once = true,
}: FadeInProps) {
  const reduce = useReducedMotion();

  const directionOffset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  };

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, ...directionOffset[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{
        ...springs.gentle,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   StaggerChildren — staggered fade-in container
   ───────────────────────────────────────────────── */

interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
};

export function StaggerChildren({
  children,
  className,
  once = true,
}: StaggerChildrenProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.1 }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   ScaleOnHover — hover physics for cards
   ───────────────────────────────────────────────── */

interface ScaleOnHoverProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
  glowColor?: string;
}

export function ScaleOnHover({
  children,
  className,
  scale = 1.02,
}: ScaleOnHoverProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      whileHover={reduce ? undefined : { scale, y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={springs.snappy}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────
   AnimatedTabs — tab switch with layout animation
   ───────────────────────────────────────────────── */

interface AnimatedTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  className?: string;
  variant?: "pills" | "underline";
}

export function AnimatedTabs({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  variant = "pills",
}: AnimatedTabsProps) {
  const layoutId = React.useId();

  return (
    <div
      className={`
        flex items-center gap-1
        ${variant === "pills" ? "rounded-xl bg-slate-100/80 backdrop-blur-sm p-1" : "border-b border-slate-200/60"}
        ${className}
      `}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
              transition-colors duration-200
              ${
                variant === "pills"
                  ? isActive
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                  : isActive
                    ? "text-[#00b4fb]"
                    : "text-slate-500 hover:text-slate-700"
              }
            `}
          >
            {/* Active indicator */}
            {isActive && variant === "pills" && (
              <motion.div
                layoutId={`tab-indicator-${layoutId}`}
                className="absolute inset-0 rounded-lg bg-white shadow-sm"
                style={{
                  boxShadow:
                    "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                }}
                transition={springs.snappy}
              />
            )}
            {isActive && variant === "underline" && (
              <motion.div
                layoutId={`tab-underline-${layoutId}`}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00b4fb] rounded-full"
                transition={springs.snappy}
              />
            )}

            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   ModalTransition — modal enter/exit with spring
   ───────────────────────────────────────────────── */

interface ModalTransitionProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeStyles = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
  full: "max-w-[calc(100vw-2rem)]",
};

export function ModalTransition({
  isOpen,
  onClose,
  children,
  className = "",
  size = "md",
}: ModalTransitionProps) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal content */}
          <motion.div
            initial={
              reduce
                ? false
                : { opacity: 0, scale: 0.95, y: 10 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 4 }}
            transition={springs.snappy}
            className={`
              relative w-full ${sizeStyles[size]}
              bg-white/85 backdrop-blur-2xl
              rounded-2xl
              border border-white/30
              shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)]
              overflow-hidden
              ${className}
            `}
            style={{
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.3)
              `,
            }}
          >
            {/* Top edge highlight */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.8) 70%, transparent)",
              }}
            />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────────
   CountUp — animated number counter
   ───────────────────────────────────────────────── */

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUp({
  value,
  duration = 1.2,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
}: CountUpProps) {
  const [display, setDisplay] = React.useState(0);
  const reduce = useReducedMotion();

  React.useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }

    const startTime = performance.now();
    const startValue = display;

    function animate(currentTime: number) {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * eased;

      setDisplay(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, reduce]);

  return (
    <span className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────────────
   Skeleton — shimmer loading placeholder
   ───────────────────────────────────────────────── */

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  lines?: number;
}

export function Skeleton({
  className = "",
  variant = "text",
  lines = 1,
}: SkeletonProps) {
  const baseClass =
    "animate-pulse bg-gradient-to-r from-slate-200/80 via-slate-100/60 to-slate-200/80 bg-[length:200%_100%]";

  const variantClass = {
    text: "h-4 rounded-md",
    circular: "rounded-full aspect-square",
    rectangular: "rounded-xl",
  };

  if (lines > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClass} ${variantClass[variant]} ${className}`}
            style={{ width: i === lines - 1 ? "60%" : "100%" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`${baseClass} ${variantClass[variant]} ${className}`} />
  );
}
