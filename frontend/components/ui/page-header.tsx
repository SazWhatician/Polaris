"use client";

import React from "react";
import { Sparkles, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  category?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeVariant?: "emerald" | "indigo" | "amber" | "purple";
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  category = "ACADEMIC INTELLIGENCE",
  title,
  description,
  icon: Icon,
  badgeText,
  badgeVariant = "emerald",
  actions,
  className,
}: PageHeaderProps) {
  const badgeStyles = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/80 bg-card/75 p-6 shadow-xl backdrop-blur-2xl transition-all duration-300 sm:p-8",
        className,
      )}
    >
      {/* Top subtle gradient highlight line */}
      <div className="absolute left-0 right-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-start gap-4 sm:items-center sm:gap-5">
          {/* Icon Box with Glassmorphism */}
          <div className="group relative flex shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 p-3.5 text-primary shadow-lg sm:p-4">
            <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110 sm:h-7 sm:w-7" />
            <Sparkles className="absolute -right-1 -top-1 h-3 w-3 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
          </div>

          <div className="min-w-0 space-y-1.5">
            {/* Category / Breadcrumb Pill */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:text-[11px]">
                <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-primary" />
                {category}
              </span>

              {badgeText && (
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold",
                    badgeStyles[badgeVariant],
                  )}
                >
                  {badgeText}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="truncate bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-2xl font-black tracking-tight text-transparent sm:text-3xl lg:text-4xl">
              {title}
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl text-xs font-normal leading-relaxed text-muted-foreground sm:text-sm">
              {description}
            </p>
          </div>
        </div>

        {/* Right Actions Slot */}
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5 border-t border-border/50 pt-2 md:border-t-0 md:pt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
