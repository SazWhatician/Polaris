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
        "relative p-6 sm:p-8 rounded-3xl bg-card/75 border border-border/80 backdrop-blur-2xl shadow-xl overflow-hidden transition-all duration-300",
        className
      )}
    >
      {/* Top subtle gradient highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      
      {/* Ambient background glow */}
      <div className="absolute -right-24 -top-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          {/* Icon Box with Glassmorphism */}
          <div className="relative p-3.5 sm:p-4 rounded-2xl bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0 shadow-lg group">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 transition-transform duration-300 group-hover:scale-110" />
            <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="space-y-1.5 min-w-0">
            {/* Category / Breadcrumb Pill */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping inline-block" />
                {category}
              </span>

              {badgeText && (
                <span
                  className={cn(
                    "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                    badgeStyles[badgeVariant]
                  )}
                >
                  {badgeText}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent truncate">
              {title}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-normal leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Right Actions Slot */}
        {actions && (
          <div className="flex items-center flex-wrap gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
