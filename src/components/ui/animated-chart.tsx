"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { springs } from "./motion-primitives";

/* ─────────────────────────────────────────────────────────────
   AnimatedBarChart (Bklit-inspired spring physics bar chart)
   ───────────────────────────────────────────────────────────── */

export interface BarChartItem {
  label: string;
  value: number;
  secondaryValue?: number;
  tooltip?: string;
}

interface AnimatedBarChartProps {
  data: BarChartItem[];
  height?: number;
  unit?: string;
  showValues?: boolean;
  className?: string;
}

export function AnimatedBarChart({
  data,
  height = 180,
  unit = "",
  showValues = true,
  className = "",
}: AnimatedBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={`w-full ${className}`}>
      <div
        className="flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2"
        style={{ height }}
      >
        {data.map((item, idx) => {
          const pct = Math.max(8, (item.value / maxValue) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className="group relative flex flex-1 flex-col items-center h-full justify-end"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={springs.snappy}
                  className="absolute -top-10 z-20 whitespace-nowrap rounded-xl border border-white/80 bg-slate-900/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-md"
                >
                  {item.value} {unit}
                </motion.div>
              )}

              {/* Top value */}
              {showValues && (
                <span className="text-[10px] font-bold text-slate-400 mb-1.5 transition-colors group-hover:text-slate-900">
                  {item.value}
                </span>
              )}

              {/* Bar Container */}
              <div className="w-full max-w-[48px] h-full flex items-end">
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${pct}%`, opacity: 1 }}
                  transition={{
                    ...springs.snappy,
                    delay: idx * 0.05,
                  }}
                  whileHover={{ scaleY: 1.03 }}
                  className={`w-full rounded-t-xl transition-shadow ${
                    isHovered
                      ? "bg-gradient-to-t from-[#0084be] to-[#00b4fb] shadow-[0_4px_16px_rgba(0,180,251,0.4)]"
                      : "bg-gradient-to-t from-[#00b4fb]/80 to-[#38bdf8] shadow-[0_2px_8px_rgba(0,180,251,0.2)]"
                  }`}
                />
              </div>

              {/* X Label */}
              <span className="mt-2 text-[10px] font-semibold text-slate-500 truncate max-w-[60px] text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AnimatedAreaChart (Bklit-inspired bezier path wave chart)
   ───────────────────────────────────────────────────────────── */

export interface AreaChartPoint {
  label: string;
  value: number;
}

interface AnimatedAreaChartProps {
  data: AreaChartPoint[];
  height?: number;
  unit?: string;
  strokeColor?: string;
  className?: string;
}

export function AnimatedAreaChart({
  data,
  height = 180,
  unit = "",
  strokeColor = "#00b4fb",
  className = "",
}: AnimatedAreaChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<AreaChartPoint | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number } | null>(null);

  if (!data.length) return null;

  const width = 600;
  const paddingY = 24;
  const paddingX = 20;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = 0;

  const points = data.map((d, idx) => {
    const x = paddingX + (idx / Math.max(data.length - 1, 1)) * plotWidth;
    const y =
      paddingY +
      plotHeight -
      ((d.value - minValue) / (maxValue - minValue)) * plotHeight;
    return { x, y, data: d };
  });

  // Generate smooth SVG curve
  const pathData = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[i - 1];
    const cpX1 = prev.x + (point.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (point.x - prev.x) / 2;
    const cpY2 = point.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${point.x} ${point.y}`;
  }, "");

  const areaData = `${pathData} L ${points[points.length - 1].x} ${
    height - paddingY
  } L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Floating Hover Tooltip */}
      {hoveredPoint && hoveredPos && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.snappy}
          style={{
            left: `${(hoveredPos.x / width) * 100}%`,
            top: hoveredPos.y - 36,
          }}
          className="pointer-events-none absolute -translate-x-1/2 z-30 rounded-xl border border-white/80 bg-slate-900/90 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-md"
        >
          {hoveredPoint.label}: {hoveredPoint.value} {unit}
        </motion.div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        style={{ height }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Subtle Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = paddingY + plotHeight * ratio;
          return (
            <line
              key={i}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="rgba(226, 232, 240, 0.7)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}

        {/* Gradient Area */}
        <motion.path
          d={areaData}
          fill="url(#areaGradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Wave Path */}
        <motion.path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        {/* Interactive Points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth="2.5"
              className="transition-transform duration-200 hover:scale-150"
            />
            {/* Catchment zone for mouse hover */}
            <circle
              cx={p.x}
              cy={p.y}
              r="14"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => {
                setHoveredPoint(p.data);
                setHoveredPos({ x: p.x, y: p.y });
              }}
              onMouseLeave={() => {
                setHoveredPoint(null);
                setHoveredPos(null);
              }}
            />
          </g>
        ))}
      </svg>

      {/* X Labels */}
      <div className="flex justify-between px-2 pt-2 text-[10px] font-semibold text-slate-400">
        {data.map((d, i) => (
          <span key={i} className="truncate max-w-[70px] text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AnimatedDonutChart (Bklit-inspired percentage breakdown)
   ───────────────────────────────────────────────────────────── */

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface AnimatedDonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}

export function AnimatedDonutChart({
  segments,
  size = 170,
  strokeWidth = 18,
  centerLabel = "Total",
  centerValue,
  className = "",
}: AnimatedDonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -90;

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-6 ${className}`}>
      {/* Donut SVG */}
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(241, 245, 249, 0.8)"
            strokeWidth={strokeWidth}
          />

          {/* Segments */}
          {segments.map((seg, idx) => {
            const fraction = seg.value / total;
            const strokeDasharray = `${fraction * circumference} ${circumference}`;
            const rotation = currentAngle;
            currentAngle += fraction * 360;

            return (
              <motion.circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={0}
                strokeLinecap="round"
                transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: 0 }}
                transition={{
                  ...springs.snappy,
                  delay: idx * 0.15,
                }}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {centerLabel}
          </span>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            {centerValue !== undefined ? centerValue : total}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 text-xs">
        {segments.map((seg, idx) => {
          const pct = Math.round((seg.value / total) * 100);
          return (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-slate-600 font-semibold truncate">
                  {seg.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-bold text-slate-900">{seg.value}</span>
                <span className="text-[10px] font-medium text-slate-400">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
