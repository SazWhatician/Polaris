"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Layers,
  Search,
  Sparkles,
  ArrowRight,
  FolderOpen,
  Compass,
} from "lucide-react";
import { CrystalGlow } from "@/components/ui/crystal-glow";
import { cn } from "@/lib/utils";

export type EmptyStateVariant =
  | "syllabus"
  | "documents"
  | "graph"
  | "gaps"
  | "search"
  | "general";

export interface EmptyStateAction {
  label: string;
  href?: React.ComponentProps<typeof Link>["href"];
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  icon?: React.ReactNode;
  className?: string;
}

const VARIANT_DEFAULTS: Record<
  EmptyStateVariant,
  {
    icon: React.ReactNode;
    title: string;
    description: string;
    glowClass: string;
  }
> = {
  syllabus: {
    icon: <BookOpen className="w-8 h-8 text-primary" />,
    title: "No Course Syllabi Uploaded",
    description:
      "Upload your university course syllabus to automatically extract topic hierarchies, prerequisite trees, and revision milestones.",
    glowClass: "from-primary/20 via-purple-500/10 to-transparent",
  },
  documents: {
    icon: <FileText className="w-8 h-8 text-cyan-400" />,
    title: "Document Index is Empty",
    description:
      "Index your lecture notes, textbook PDFs, or lecture slides to enable grounded citation searches with bounding-box verification.",
    glowClass: "from-cyan-500/20 via-blue-500/10 to-transparent",
  },
  graph: {
    icon: <Layers className="w-8 h-8 text-purple-400" />,
    title: "Knowledge Topology Unmapped",
    description:
      "No concept clusters have been indexed yet. Ingest your course materials to visualize interconnected prerequisite pathways in real time.",
    glowClass: "from-purple-500/20 via-indigo-500/10 to-transparent",
  },
  gaps: {
    icon: <Compass className="w-8 h-8 text-amber-400" />,
    title: "Diagnostic Matrix Clear",
    description:
      "Run your first diagnostic gap scan to identify missing foundation concepts and obtain targeted video lecture recommendations.",
    glowClass: "from-amber-500/20 via-rose-500/10 to-transparent",
  },
  search: {
    icon: <Search className="w-8 h-8 text-slate-400" />,
    title: "No Matching Coordinates Found",
    description:
      "We couldn't locate any indexed citations matching your query. Try broadening your terms or upload additional study materials.",
    glowClass: "from-white/10 via-slate-500/5 to-transparent",
  },
  general: {
    icon: <FolderOpen className="w-8 h-8 text-primary" />,
    title: "Nothing Here Yet",
    description:
      "This section is waiting for academic data. Start by creating a plan or importing course materials.",
    glowClass: "from-primary/20 via-purple-500/10 to-transparent",
  },
};

export function EmptyState({
  variant = "general",
  title,
  description,
  primaryAction,
  secondaryAction,
  icon,
  className,
}: EmptyStateProps) {
  const defaults = VARIANT_DEFAULTS[variant];

  const resolvedIcon = icon ?? defaults.icon;
  const resolvedTitle = title ?? defaults.title;
  const resolvedDescription = description ?? defaults.description;

  return (
    <div
      data-testid={`empty-state-${variant}`}
      className={cn(
        "relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto border border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl transition-all",
        className
      )}
    >
      {/* Background Atmospheric Radial Glow */}
      <div
        className={cn(
          "absolute -inset-10 bg-gradient-to-b opacity-50 blur-3xl pointer-events-none -z-10",
          defaults.glowClass
        )}
      />

      {/* Center Icon Orb */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-white/[0.06] border border-white/15 flex items-center justify-center shadow-xl backdrop-blur-md group hover:scale-105 transition-transform duration-300">
          {resolvedIcon}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black/80 border border-white/20 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <CrystalGlow as="h3" fontSize={22} fontWeight={800} className="tracking-tight">
          {resolvedTitle}
        </CrystalGlow>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-md font-light mb-8">
        {resolvedDescription}
      </p>

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction &&
            (primaryAction.href ? (
              <Link
                href={primaryAction.href}
                className="px-5 py-2.5 rounded-2xl bg-white text-black font-bold text-xs flex items-center gap-2 hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <span>{primaryAction.label}</span>
                {primaryAction.icon ?? <ArrowRight className="w-4 h-4" />}
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="px-5 py-2.5 rounded-2xl bg-white text-black font-bold text-xs flex items-center gap-2 hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
              >
                <span>{primaryAction.label}</span>
                {primaryAction.icon ?? <ArrowRight className="w-4 h-4" />}
              </button>
            ))}

          {secondaryAction &&
            (secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="px-4 py-2.5 rounded-2xl border border-white/15 bg-white/[0.04] text-foreground font-semibold text-xs hover:bg-white/[0.08] transition-colors"
              >
                <span>{secondaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="px-4 py-2.5 rounded-2xl border border-white/15 bg-white/[0.04] text-foreground font-semibold text-xs hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <span>{secondaryAction.label}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
