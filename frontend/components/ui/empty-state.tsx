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

export type EmptyStateVariant = "syllabus" | "documents" | "graph" | "gaps" | "search" | "general";

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
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: "No Course Syllabi Uploaded",
    description:
      "Upload your university course syllabus to automatically extract topic hierarchies, prerequisite trees, and revision milestones.",
    glowClass: "from-primary/20 via-purple-500/10 to-transparent",
  },
  documents: {
    icon: <FileText className="h-8 w-8 text-cyan-400" />,
    title: "Document Index is Empty",
    description:
      "Index your lecture notes, textbook PDFs, or lecture slides to enable grounded citation searches with bounding-box verification.",
    glowClass: "from-cyan-500/20 via-blue-500/10 to-transparent",
  },
  graph: {
    icon: <Layers className="h-8 w-8 text-purple-400" />,
    title: "Knowledge Topology Unmapped",
    description:
      "No concept clusters have been indexed yet. Ingest your course materials to visualize interconnected prerequisite pathways in real time.",
    glowClass: "from-purple-500/20 via-indigo-500/10 to-transparent",
  },
  gaps: {
    icon: <Compass className="h-8 w-8 text-amber-400" />,
    title: "Diagnostic Matrix Clear",
    description:
      "Run your first diagnostic gap scan to identify missing foundation concepts and obtain targeted video lecture recommendations.",
    glowClass: "from-amber-500/20 via-rose-500/10 to-transparent",
  },
  search: {
    icon: <Search className="h-8 w-8 text-slate-400" />,
    title: "No Matching Coordinates Found",
    description:
      "We couldn't locate any indexed citations matching your query. Try broadening your terms or upload additional study materials.",
    glowClass: "from-white/10 via-slate-500/5 to-transparent",
  },
  general: {
    icon: <FolderOpen className="h-8 w-8 text-primary" />,
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
        "relative mx-auto flex max-w-xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-card/60 p-8 text-center shadow-2xl backdrop-blur-xl transition-all sm:p-12",
        className,
      )}
    >
      {/* Background Atmospheric Radial Glow */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-10 -z-10 bg-gradient-to-b opacity-50 blur-3xl",
          defaults.glowClass,
        )}
      />

      {/* Center Icon Orb */}
      <div className="relative mb-6">
        <div className="group flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-white/[0.06] shadow-xl backdrop-blur-md transition-transform duration-300 hover:scale-105">
          {resolvedIcon}
        </div>
        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/80">
          <Sparkles className="h-3 w-3 animate-pulse text-amber-300" />
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <CrystalGlow as="h3" fontSize={22} fontWeight={800} className="tracking-tight">
          {resolvedTitle}
        </CrystalGlow>
      </div>

      {/* Description */}
      <p className="mb-8 max-w-md text-xs font-light leading-relaxed text-muted-foreground sm:text-sm">
        {resolvedDescription}
      </p>

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction &&
            (primaryAction.href ? (
              <Link
                href={primaryAction.href}
                className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-black shadow-lg transition-all hover:scale-105 hover:bg-slate-200 active:scale-95"
              >
                <span>{primaryAction.label}</span>
                {primaryAction.icon ?? <ArrowRight className="h-4 w-4" />}
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-bold text-black shadow-lg transition-all hover:scale-105 hover:bg-slate-200 active:scale-95"
              >
                <span>{primaryAction.label}</span>
                {primaryAction.icon ?? <ArrowRight className="h-4 w-4" />}
              </button>
            ))}

          {secondaryAction &&
            (secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-white/[0.08]"
              >
                <span>{secondaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="cursor-pointer rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-white/[0.08]"
              >
                <span>{secondaryAction.label}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
