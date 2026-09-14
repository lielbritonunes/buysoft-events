---
version: 1.0.0
name: Buysoft Events Enterprise Design System
description: Modern enterprise SaaS aesthetic inspired by Untitled UI React and 21st.dev, respecting Buysoft Events brand identity.
colors:
  primary: "#00b4fb"
  primary_hover: "#009ce0"
  primary_light: "#e6f7fe"
  primary_glow: "rgba(0, 180, 251, 0.15)"
  background: "#f8fafc"
  surface: "#ffffff"
  surface_subtle: "#f1f5f9"
  border_subtle: "#e2e8f0"
  border_strong: "#cbd5e1"
  text_primary: "#0f172a"
  text_secondary: "#475569"
  text_muted: "#94a3b8"
  success: "#10b981"
  success_light: "#ecfdf5"
  warning: "#f59e0b"
  warning_light: "#fffbeb"
  danger: "#ef4444"
  danger_light: "#fef2f2"
typography:
  font_sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  font_mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
shadows:
  xs: "0 1px 2px 0 rgba(16, 24, 40, 0.05)"
  sm: "0 1px 3px 0 rgba(16, 24, 40, 0.1), 0 1px 2px -1px rgba(16, 24, 40, 0.1)"
  md: "0 4px 8px -2px rgba(16, 24, 40, 0.1), 0 2px 4px -2px rgba(16, 24, 40, 0.06)"
  glow: "0 0 20px -3px rgba(0, 180, 251, 0.2)"
radii:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "18px"
---

# Buysoft Events - Design Specification

## Overview
Buysoft Events combines the rigorous data hierarchy and pristine polish of **Untitled UI React** with the subtle micro-interactions, ambient gradients, and crisp tactile components of **21st.dev**. The core brand blue (`#00b4fb`) is the primary driver of interaction and focal points.

## Visual Principles

1. **Enterprise Clarity (Untitled UI)**:
   - High data legibility with crisp contrast between `#0f172a` headers, `#475569` descriptions, and `#94a3b8` metadata.
   - Clean 1px border frames (`#e2e8f0`) with subtle surface elevation.
   - Refined metric cards with status pills and micro-trend indicators.
   - Multi-state pill badges with animated indicator dots (Live, Published, Draft).

2. **Modern Micro-interactions (21st.dev)**:
   - Subtle hover elevation and ambient glow (`shadow-[0_0_20px_-3px_rgba(0,180,251,0.2)]`).
   - Smooth transitions (`transition-all duration-200 ease-out`).
   - Glassmorphism on sticky navigation bars (`bg-white/80 backdrop-blur-md`).
   - Top-edge border highlights on primary cards (`before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[#00b4fb]/40 before:to-transparent`).

3. **Color Rules & Purple Ban**:
   - **Primary**: Buysoft Cyan (`#00b4fb`) & Deep Sky Blue (`#0084be`).
   - **Dark Accents**: Slate Navy (`#090d16`, `#0f172a`).
   - **Functional Accents**: Emerald (Live/Success), Amber (Warning/Scheduled), Rose (Live Recording/Destructive).
   - **Forbidden**: AI-purple/indigo gradients are strictly banned.
