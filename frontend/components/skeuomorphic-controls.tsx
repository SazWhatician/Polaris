"use client";

import { ThemeToggle } from "./theme-toggle";

/**
 * Ponytail Refactoring: ThemeDial maps directly to the unified Radio Knob ThemeToggle.
 */
export const ThemeDial = ThemeToggle;

/**
 * Skeuomorphic Corner Metal Screws Accent
 */
export function SkeuoScrews() {
  return (
    <>
      <div className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-slate-400 to-slate-700 border border-white/40 shadow-inner flex items-center justify-center pointer-events-none opacity-70">
        <div className="w-1.5 h-[1px] bg-slate-900 rotate-45" />
      </div>
      <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-slate-400 to-slate-700 border border-white/40 shadow-inner flex items-center justify-center pointer-events-none opacity-70">
        <div className="w-1.5 h-[1px] bg-slate-900 -rotate-45" />
      </div>
      <div className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-slate-400 to-slate-700 border border-white/40 shadow-inner flex items-center justify-center pointer-events-none opacity-70">
        <div className="w-1.5 h-[1px] bg-slate-900 -rotate-12" />
      </div>
      <div className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-slate-400 to-slate-700 border border-white/40 shadow-inner flex items-center justify-center pointer-events-none opacity-70">
        <div className="w-1.5 h-[1px] bg-slate-900 rotate-60" />
      </div>
    </>
  );
}

/**
 * Skeuomorphic Analog Telemetry VU Meter Gauge Bar
 */
export function VUMeter({ label = "Engine Telemetry", level = 85 }: { label?: string; level?: number }) {
  return (
    <div className="skeuo-inset p-3 space-y-1.5 text-xs select-none">
      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase font-bold">
        <span>{label}</span>
        <span className="text-emerald-400 font-mono">{level}% PEAK</span>
      </div>
      
      {/* Segmented LED Bar */}
      <div className="grid grid-cols-10 gap-1 h-3 p-0.5 skeuo-inset bg-black/40">
        {Array.from({ length: 10 }).map((_, i) => {
          const active = (i + 1) * 10 <= level;
          const isWarning = i >= 7 && i < 9;
          const isDanger = i >= 9;
          
          let color = "bg-emerald-500 shadow-emerald-500/50";
          if (isWarning) color = "bg-amber-400 shadow-amber-400/50";
          if (isDanger) color = "bg-rose-500 shadow-rose-500/50";

          return (
            <div
              key={i}
              className={`rounded-xs transition-all ${
                active ? `${color} shadow-sm opacity-100` : "bg-white/5 opacity-20"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
