"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Palette, Moon, Sun, Flame } from "lucide-react";

import { POLARIS_THEMES, THEME_ORDER, type PolarisThemeName } from "@/lib/polaris-themes";

export interface ThemeOption {
  id: PolarisThemeName;
  name: string;
  icon: React.ReactNode;
  colorDot: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "dark",        name: POLARIS_THEMES.dark.displayName,           icon: <Moon  className="h-3.5 w-3.5" />, colorDot: "bg-violet-500" },
  { id: "light",       name: POLARIS_THEMES.light.displayName,          icon: <Sun   className="h-3.5 w-3.5" />, colorDot: "bg-rose-300"    },
  { id: "theme-amber", name: POLARIS_THEMES["theme-amber"].displayName, icon: <Flame className="h-3.5 w-3.5" />, colorDot: "bg-amber-400"   },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = THEME_ORDER.includes(theme as PolarisThemeName) ? theme : "dark";

  return (
    <div className="relative inline-block text-left">
      <div className="relative flex items-center">
        <Palette className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <select
          value={current}
          onChange={(e) => setTheme(e.target.value)}
          className="h-9 pl-8 pr-7 py-1 text-xs font-bold rounded-full bg-white/80 dark:bg-zinc-900/80 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-slate-100 backdrop-blur-xl outline-none focus:ring-2 focus:ring-primary/50 shadow-md cursor-pointer transition-all hover:scale-105 appearance-none"
        >
          {THEME_OPTIONS.map((t) => (
            <option key={t.id} value={t.id} className="bg-background text-foreground font-medium py-1">
              {t.name}
            </option>
          ))}
        </select>
        <span className="absolute right-2.5 pointer-events-none text-[10px] text-muted-foreground">▼</span>
      </div>
    </div>
  );
}
