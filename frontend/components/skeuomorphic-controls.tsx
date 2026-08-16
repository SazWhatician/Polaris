"use client";

import { ThemeToggle } from "./theme-toggle";

/**
 * ThemeDial alias
 */
export const ThemeDial = ThemeToggle;

/**
 * SkeuoScrews - Clean null render (removed vibe-coded metal screws)
 */
export function SkeuoScrews() {
  return null;
}

/**
 * Clean Glass Telemetry VU Meter Gauge Bar
 */
export function VUMeter({ label = "Engine Telemetry", level = 85 }: { label?: string; level?: number }) {
  return (
    <div className="glass-inset p-3.5 space-y-2 text-xs select-none rounded-2xl">
      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase font-bold">
        <span>{label}</span>
        <span className="text-emerald-400 font-mono font-bold">{level}% PEAK</span>
      </div>
      
      {/* Clean Segmented LED Bar */}
      <div className="grid grid-cols-10 gap-1.5 h-2.5 p-0.5 rounded-lg bg-black/40 border border-white/5">
        {Array.from({ length: 10 }).map((_, i) => {
          const active = (i + 1) * 10 <= level;
          const isWarning = i >= 7 && i < 9;
          const isDanger = i >= 9;
          
          let color = "bg-emerald-500 shadow-emerald-500/30";
          if (isWarning) color = "bg-amber-400 shadow-amber-400/30";
          if (isDanger) color = "bg-rose-500 shadow-rose-500/30";

          return (
            <div
              key={i}
              className={`rounded-xs transition-all ${
                active ? `${color} shadow-xs opacity-100` : "bg-white/5 opacity-20"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
