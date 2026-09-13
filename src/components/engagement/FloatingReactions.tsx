"use client";

import React, { useState } from "react";

interface Reaction {
  id: number;
  emoji: string;
  left: number;
}

export default function FloatingReactions() {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const left = 20 + Math.random() * 60; // randomized horizontal placement

    setReactions((prev) => [...prev, { id, emoji, left }]);

    // Remove particle after animation (2.2s)
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  };

  return (
    <>
      {/* Floating particles container */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {reactions.map((r) => (
          <span
            key={r.id}
            className="absolute bottom-16 text-3xl select-none animate-float-up pointer-events-none"
            style={{
              left: `${r.left}%`,
              animation: "floatUp 2.2s cubic-bezier(0.25, 1, 0.5, 1) forwards",
            }}
          >
            {r.emoji}
          </span>
        ))}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1.5 rounded-full bg-slate-900/80 backdrop-blur-md px-3 py-1.5 border border-slate-700 shadow-xl">
        <button
          onClick={() => triggerReaction("👏")}
          className="hover:scale-130 active:scale-95 transition text-lg p-1"
          title="Aplaudir"
        >
          👏
        </button>
        <button
          onClick={() => triggerReaction("❤️")}
          className="hover:scale-130 active:scale-95 transition text-lg p-1"
          title="Coração"
        >
          ❤️
        </button>
        <button
          onClick={() => triggerReaction("🔥")}
          className="hover:scale-130 active:scale-95 transition text-lg p-1"
          title="Fogo"
        >
          🔥
        </button>
        <button
          onClick={() => triggerReaction("💡")}
          className="hover:scale-130 active:scale-95 transition text-lg p-1"
          title="Ideia"
        >
          💡
        </button>
        <button
          onClick={() => triggerReaction("🚀")}
          className="hover:scale-130 active:scale-95 transition text-lg p-1"
          title="Foguete"
        >
          🚀
        </button>
      </div>

      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(0.8) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: translateY(-200px) scale(1.3) rotate(-10deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-420px) scale(1) rotate(15deg);
          }
        }
      `}</style>
    </>
  );
}
