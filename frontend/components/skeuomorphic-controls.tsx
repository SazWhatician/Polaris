"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Zap, ShieldAlert, Gem, Flame } from "lucide-react";

const THEMES = [
  { id: "dark", name: "Dark", icon: Moon, angle: 0, color: "#6366f1" },
  { id: "light", name: "Light", icon: Sun, angle: 60, color: "#38bdf8" },
  { id: "theme-gold", name: "Gold", icon: Zap, angle: 120, color: "#facc15" },
  { id: "theme-emerald", name: "Emerald", icon: ShieldAlert, angle: 180, color: "#34d399" },
  { id: "theme-sapphire", name: "Sapphire", icon: Gem, angle: 240, color: "#60a5fa" },
  { id: "theme-crimson", name: "Crimson", icon: Flame, angle: 300, color: "#fb7185" },
];

/**
 * Skeuomorphic 3D Rotary Switch Dial Knob
 * Allows users to turn a physical-style rotary knob to select themes.
 */
export function ThemeDial() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const currentIdx = THEMES.findIndex((t) => t.id === theme);
  const activeIdx = currentIdx >= 0 ? currentIdx : 0;
  const activeTheme = THEMES[activeIdx]!;

  const handleNext = () => {
    const nextIdx = (activeIdx + 1) % THEMES.length;
    const target = THEMES[nextIdx]!;
    setTheme(target.id);
  };

  return (
    <div className="flex items-center gap-3 skeuo-card px-4 py-2 select-none shadow-xl">
      {/* Rotary Dial Knob */}
      <div className="flex flex-col items-center">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Theme Dial
        </span>
        <button
          onClick={handleNext}
          className="relative w-12 h-12 rounded-full skeuo-button border-2 border-white/20 shadow-2xl flex items-center justify-center group active:scale-95 transition-all cursor-pointer"
          title="Click to Turn Theme Dial"
          style={{
            background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.25) 0%, rgba(0,0,0,0.6) 100%), var(--skeuo-btn-bg)",
          }}
        >
          {/* Dial Ticks Outer Ring */}
          <div className="absolute inset-0 rounded-full border border-white/30" />

          {/* Rotating Pointer Notch */}
          <div
            className="absolute inset-0 flex justify-center pt-1 transition-transform duration-300 ease-out"
            style={{ transform: `rotate(${activeTheme.angle}deg)` }}
          >
            <div
              className="w-1.5 h-3.5 rounded-full shadow-md border border-white/60"
              style={{ backgroundColor: activeTheme.color }}
            />
          </div>

          {/* Center Cap */}
          <div className="w-5 h-5 rounded-full bg-slate-900/80 border border-white/30 shadow-inner flex items-center justify-center">
            <div
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: activeTheme.color }}
            />
          </div>
        </button>
      </div>

      {/* Active Theme Telemetry Display */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <span style={{ color: activeTheme.color }}>●</span>
          <span>{activeTheme.name} Mode</span>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase">
          {activeTheme.angle}° Position
        </span>
      </div>
    </div>
  );
}

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
