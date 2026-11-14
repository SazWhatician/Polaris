"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, Layers, Compass, Search, FolderOpen, ArrowLeft } from "lucide-react";
import { EmptyState, EmptyStateVariant } from "@/components/ui/empty-state";
import { CrystalGlow } from "@/components/ui/crystal-glow";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

const VARIANTS: { id: EmptyStateVariant; label: string; icon: React.ReactNode }[] = [
  { id: "syllabus", label: "Syllabus Empty", icon: <BookOpen className="h-3.5 w-3.5" /> },
  { id: "documents", label: "Documents Empty", icon: <FileText className="h-3.5 w-3.5" /> },
  { id: "graph", label: "Topology Empty", icon: <Layers className="h-3.5 w-3.5" /> },
  { id: "gaps", label: "Gap Matrix Empty", icon: <Compass className="h-3.5 w-3.5" /> },
  { id: "search", label: "Search Zero Results", icon: <Search className="h-3.5 w-3.5" /> },
  { id: "general", label: "General Fallback", icon: <FolderOpen className="h-3.5 w-3.5" /> },
];

export default function EmptyStatePage() {
  const [activeVariant, setActiveVariant] = useState<EmptyStateVariant>("syllabus");

  return (
    <div className="min-h-screen bg-black text-foreground selection:bg-primary/30 selection:text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 sm:py-20">
        {/* Top Breadcrumb & Page Info */}
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Workspace</span>
            </Link>

            <div className="flex items-center gap-3 pt-1">
              <CrystalGlow as="h1" fontSize={28} fontWeight={900} className="tracking-tight">
                Academic Empty State Matrix
              </CrystalGlow>
              <span className="rounded-full border border-primary/30 bg-primary/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">
                Interactive State View
              </span>
            </div>

            <p className="max-w-xl text-xs font-light text-muted-foreground sm:text-sm">
              Preview and verify Polaris zero-data states across vector retrieval, syllabus parsing,
              concept topologies, and search matrices.
            </p>
          </div>
        </div>

        {/* Variant Selectors */}
        <div className="flex w-fit flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-xl">
          {VARIANTS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveVariant(tab.id)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                activeVariant === tab.id
                  ? "scale-102 bg-white font-bold text-black shadow-md"
                  : "text-muted-foreground hover:bg-white/[0.06] hover:text-white",
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Empty State Display Container */}
        <div className="bg-radial flex min-h-[440px] items-center justify-center rounded-3xl border border-white/5 from-white/[0.02] to-transparent px-4 py-12">
          {activeVariant === "syllabus" && (
            <EmptyState
              variant="syllabus"
              primaryAction={{
                label: "Upload Syllabus PDF",
                href: "/syllabus",
              }}
              secondaryAction={{
                label: "Load Sample Math Syllabus",
                href: "/syllabus?demo=true",
              }}
            />
          )}

          {activeVariant === "documents" && (
            <EmptyState
              variant="documents"
              primaryAction={{
                label: "Ingest Coursework",
                href: "/ingest",
              }}
              secondaryAction={{
                label: "Supported Formats Guide",
                href: "/chat",
              }}
            />
          )}

          {activeVariant === "graph" && (
            <EmptyState
              variant="graph"
              primaryAction={{
                label: "Generate Topology",
                href: "/graph",
              }}
              secondaryAction={{
                label: "Explore Knowledge Mesh",
                href: "/dashboard",
              }}
            />
          )}

          {activeVariant === "gaps" && (
            <EmptyState
              variant="gaps"
              primaryAction={{
                label: "Run Diagnostic Scan",
                href: "/gaps",
              }}
              secondaryAction={{
                label: "View Recommended Lectures",
                href: "/resources",
              }}
            />
          )}

          {activeVariant === "search" && (
            <EmptyState
              variant="search"
              primaryAction={{
                label: "Clear Search Filters",
                onClick: () => setActiveVariant("general"),
              }}
              secondaryAction={{
                label: "Ask Polaris Copilot",
                href: "/chat",
              }}
            />
          )}

          {activeVariant === "general" && (
            <EmptyState
              variant="general"
              primaryAction={{
                label: "Create Revision Plan",
                href: "/plan",
              }}
              secondaryAction={{
                label: "Back to Home",
                href: "/",
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
