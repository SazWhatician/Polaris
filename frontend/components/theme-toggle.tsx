"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { Check, Moon, Sun, Zap, ShieldAlert, Gem, Flame } from "lucide-react";

const THEMES = [
  { id: "dark", name: "Dark Obsidian", icon: Moon, color: "bg-slate-900 border-indigo-500" },
  { id: "light", name: "Light Platinum", icon: Sun, color: "bg-slate-100 border-sky-400" },
  { id: "theme-gold", name: "Cyberpunk Gold", icon: Zap, color: "bg-amber-950 border-amber-400" },
  { id: "theme-emerald", name: "Emerald Jade", icon: ShieldAlert, color: "bg-emerald-950 border-emerald-400" },
  { id: "theme-sapphire", name: "Royal Sapphire", icon: Gem, color: "bg-blue-950 border-blue-400" },
  { id: "theme-crimson", name: "Crimson Velvet", icon: Flame, color: "bg-rose-950 border-rose-400" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentThemeObj = THEMES.find((t) => t.id === theme) ?? THEMES[0]!;
  const CurrentIcon = currentThemeObj.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="skeuo-button px-3 py-1.5 text-xs flex items-center gap-2 select-none"
        title="Switch Skeuomorphic Theme"
      >
        <CurrentIcon className="h-4 w-4 text-indigo-300" />
        <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider">{currentThemeObj.name}</span>
        <div className={`w-2.5 h-2.5 rounded-full border ${currentThemeObj.color}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl skeuo-card p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 mb-1 border-b border-white/10 font-mono text-[10px] uppercase text-muted-foreground font-semibold flex items-center justify-between">
            <span>Skeuomorphic Theme</span>
            <div className="led-indicator text-emerald-400" />
          </div>
          <div className="space-y-1">
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "skeuo-inset bg-indigo-500/20 text-white font-bold"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{t.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full border ${t.color}`} />
                    {active && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
