"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { useAnimeCounter } from "@/lib/use-animation-system";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  numericValue?: number;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  tag?: string;
  colorScheme?: "primary" | "emerald" | "purple" | "amber" | "rose";
  className?: string;
}

export function StatCard({
  label,
  value,
  numericValue,
  suffix = "",
  prefix = "",
  icon: Icon,
  trend,
  trendPositive = true,
  tag,
  colorScheme = "primary",
  className,
}: StatCardProps) {
  // If a numeric value is provided, animate it smoothly with Anime.js
  const targetNum =
    typeof numericValue === "number" ? numericValue : typeof value === "number" ? value : null;
  const animatedNumber = useAnimeCounter(targetNum ?? 0, 1000);
  const displayVal = targetNum !== null ? `${prefix}${animatedNumber}${suffix}` : value;

  const colorVariants = {
    primary: "text-primary bg-primary/10 border-primary/20",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <div
      className={cn(
        "liquid-glass group relative flex select-none flex-col justify-between rounded-3xl p-5",
        className,
      )}
    >
      {/* Top subtle highlight line */}
      <div className="absolute left-0 right-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="truncate font-mono text-xl font-black tracking-tight text-foreground sm:text-2xl">
            {displayVal}
          </p>

          {(trend || tag) && (
            <div className="flex items-center gap-1.5 pt-0.5">
              {trend && (
                <span
                  className={cn(
                    "py-0.2 rounded-md px-1.5 font-mono text-[9px] font-bold",
                    trendPositive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  )}
                >
                  {trend}
                </span>
              )}
              {tag && <span className="font-mono text-[9px] text-muted-foreground">{tag}</span>}
            </div>
          )}
        </div>

        {/* Icon tile */}
        <div
          className={cn(
            "bento-icon-bounce shadow-xs flex shrink-0 items-center justify-center rounded-xl border p-2.5",
            colorVariants[colorScheme],
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
