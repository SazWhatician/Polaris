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
  {
    id: "dark",
    name: POLARIS_THEMES.dark.displayName,
    icon: <Moon className="h-3.5 w-3.5" />,
    colorDot: "bg-violet-500",
  },
  {
    id: "light",
    name: POLARIS_THEMES.light.displayName,
    icon: <Sun className="h-3.5 w-3.5" />,
    colorDot: "bg-rose-300",
  },
  {
    id: "theme-amber",
    name: POLARIS_THEMES["theme-amber"].displayName,
    icon: <Flame className="h-3.5 w-3.5" />,
    colorDot: "bg-amber-400",
  },
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
        <Palette className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <select
          value={current}
          onChange={(e) => setTheme(e.target.value)}
          className="h-9 cursor-pointer appearance-none rounded-full border border-slate-300 bg-white/80 py-1 pl-8 pr-7 text-xs font-bold text-slate-900 shadow-md outline-none backdrop-blur-xl transition-all hover:scale-105 focus:ring-2 focus:ring-primary/50 dark:border-white/15 dark:bg-zinc-900/80 dark:text-slate-100"
        >
          {THEME_OPTIONS.map((t) => (
            <option
              key={t.id}
              value={t.id}
              className="bg-background py-1 font-medium text-foreground"
            >
              {t.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 text-[10px] text-muted-foreground">
          ▼
        </span>
      </div>
    </div>
  );
}
