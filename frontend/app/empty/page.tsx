"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Layers,
  Compass,
  Search,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";
import { EmptyState, EmptyStateVariant } from "@/components/ui/empty-state";
import { CrystalGlow } from "@/components/ui/crystal-glow";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

const VARIANTS: { id: EmptyStateVariant; label: string; icon: React.ReactNode }[] = [
  { id: "syllabus", label: "Syllabus Empty", icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: "documents", label: "Documents Empty", icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "graph", label: "Topology Empty", icon: <Layers className="w-3.5 h-3.5" /> },
  { id: "gaps", label: "Gap Matrix Empty", icon: <Compass className="w-3.5 h-3.5" /> },
  { id: "search", label: "Search Zero Results", icon: <Search className="w-3.5 h-3.5" /> },
  { id: "general", label: "General Fallback", icon: <FolderOpen className="w-3.5 h-3.5" /> },
];

export default function EmptyStatePage() {
  const [activeVariant, setActiveVariant] = useState<EmptyStateVariant>("syllabus");

  return (
    <div className="min-h-screen bg-black text-foreground selection:bg-primary/30 selection:text-foreground">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 space-y-12">
        {/* Top Breadcrumb & Page Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-8">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Workspace</span>
            </Link>

            <div className="flex items-center gap-3 pt-1">
              <CrystalGlow as="h1" fontSize={28} fontWeight={900} className="tracking-tight">
                Academic Empty State Matrix
              </CrystalGlow>
              <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-mono uppercase tracking-wider">
                Interactive State View
              </span>
            </div>

            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl font-light">
              Preview and verify Polaris zero-data states across vector retrieval, syllabus parsing, concept topologies, and search matrices.
            </p>
          </div>
        </div>

        {/* Variant Selectors */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl w-fit">
          {VARIANTS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveVariant(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                activeVariant === tab.id
                  ? "bg-white text-black font-bold shadow-md scale-102"
                  : "text-muted-foreground hover:text-white hover:bg-white/[0.06]"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Empty State Display Container */}
        <div className="py-12 px-4 rounded-3xl border border-white/5 bg-radial from-white/[0.02] to-transparent min-h-[440px] flex items-center justify-center">
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
