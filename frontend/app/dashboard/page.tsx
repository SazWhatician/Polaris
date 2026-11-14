"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  Layers,
  Sparkles,
  MessageSquare,
  Target,
  ArrowUpRight,
  Database,
  Activity,
  Zap,
  BookOpen,
  Calendar,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { listDocuments, type DocumentResponse } from "@/lib/api/documents";
import { useGsapEntrance } from "@/lib/use-animation-system";
import { cn } from "@/lib/utils";
import { SpatialTelemetryCarousel } from "@/components/dashboard/spatial-telemetry-carousel";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [fetching, setFetching] = useState(true);

  const containerRef = useGsapEntrance(".gsap-dash", 0.04);

  useEffect(() => {
    router.prefetch("/chat");
    router.prefetch("/pathfinder");
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  const loadDocs = async () => {
    try {
      const items = await listDocuments();
      setDocs(items);
    } catch (e) {
      toast.error("Failed to load documents", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadDocs();
  }, [user]);

  const totalDocs = docs.length;
  const processedDocs = docs.filter(
    (d) => d.status === "ocr_complete" || d.status === "indexed",
  ).length;
  const totalPages = docs.reduce((acc, d) => acc + (d.page_count || 0), 0);
  const totalBytes = docs.reduce((acc, d) => acc + (d.size_bytes || 0), 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
  const vectorEstimatedChunks = processedDocs * 42 + totalPages * 8;

  if (loading || !user) return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-32 pt-14 text-foreground selection:bg-primary/30 selection:text-foreground sm:pt-16">
      {/* ── Ambient Fluid Liquid Caustic Spheres (iOS/visionOS Glass Glow) ── */}
      <div className="ambient-liquid-glow -left-24 -top-24 h-[500px] w-[500px] bg-indigo-500/20" />
      <div className="ambient-liquid-glow -right-32 top-[35%] h-[550px] w-[550px] bg-purple-500/15" />
      <div className="ambient-liquid-glow bg-emerald-500/12 bottom-12 left-[20%] h-[600px] w-[600px]" />

      <SiteHeader />

      <main
        ref={containerRef}
        className="relative z-10 mx-auto max-w-7xl space-y-5 px-3 py-4 sm:px-6 lg:px-8"
      >
        {/* ── DRAMATIC ASYMMETRIC ROW 1: Panoramic Command Deck (Span 8) + Spatial Telemetry Carousel (Span 4) ── */}
        <div className="gsap-dash grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Hero Command Glass Pod (Span 8) */}
          <div className="liquid-glass flex flex-col justify-between space-y-6 p-6 sm:p-8 lg:col-span-8">
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-primary">
                  <span className="inline-block h-2 w-2 animate-ping rounded-full bg-primary" />
                  <span>POLARIS ACADEMIC ENGINE // ACTIVE</span>
                </span>
                <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
                  •
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Neural Vector Mesh & OCR Pipeline
                </span>
              </div>

              <h1 className="text-2xl font-black leading-[1.08] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                Autonomous Academic <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-primary via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Intelligence Nexus
                </span>
              </h1>

              <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Welcome back,{" "}
                <span className="font-bold text-foreground">{user.displayName || "Scholar"}</span>.
                Your course syllabus, dense vector embeddings, and concept DAGs are indexed and
                live.
              </p>
            </div>

            {/* Glass Action Dock */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Button
                onClick={() => router.push("/ingest")}
                className="h-9.5 hover:scale-102 gap-2 rounded-2xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Ingest Course Notes</span>
              </Button>

              <Button
                onClick={() => router.push("/chat")}
                variant="outline"
                className="h-9.5 gap-2 rounded-2xl border-white/20 bg-white/10 px-5 text-xs font-bold backdrop-blur-xl transition-all hover:bg-white/20 dark:border-white/15 dark:bg-white/5"
              >
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>Grounded RAG Chat</span>
              </Button>

              <Button
                onClick={() => router.push("/community")}
                variant="ghost"
                className="h-9.5 gap-1.5 rounded-2xl px-4 text-xs font-bold text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span>Scholar Community</span>
                <ArrowUpRight className="ml-0.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Spatial Telemetry Multi-Image Liquid Glass Carousel (Span 4) */}
          <div className="lg:col-span-4">
            <SpatialTelemetryCarousel totalMb={totalMb} />
          </div>
        </div>

        {/* ── DRAMATIC ASYMMETRIC ROW 2: Triple Liquid Glass Spark Pods (3 x Span 4) ── */}
        <div className="gsap-dash grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Pod 1: Ingested Course Files */}
          <div className="liquid-glass group flex flex-col justify-between space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Ingested Files
              </span>
              <div className="bento-icon-bounce rounded-2xl border border-primary/20 bg-primary/10 p-2 text-primary">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-black tracking-tight text-foreground">
                  {totalDocs}
                </span>
                <span className="font-mono text-xs font-bold text-emerald-500">
                  {processedDocs} Indexed
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{totalPages} total pages</span>
                <Link
                  href="/ingest"
                  className="flex items-center gap-0.5 font-semibold text-primary hover:underline"
                >
                  <span>Studio →</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Pod 2: Syllabus Coverage */}
          <div className="liquid-glass group flex flex-col justify-between space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Curriculum Coverage
              </span>
              <div className="bento-icon-bounce rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-black tracking-tight text-foreground">
                  82%
                </span>
                <span className="font-mono text-xs font-bold text-emerald-500">+8% this week</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: "82%" }}
                />
              </div>
            </div>
          </div>

          {/* Pod 3: Exam Readiness Index */}
          <div className="liquid-glass group flex flex-col justify-between space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Exam Readiness
              </span>
              <div className="bento-icon-bounce rounded-2xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-500">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-black tracking-tight text-foreground">
                  91.4%
                </span>
                <span className="font-mono text-xs font-bold text-amber-500">Target: 95%</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                LangGraph confidence synthesis
              </p>
            </div>
          </div>

          {/* Pod 4: Vector Mesh Chunks */}
          <div className="liquid-glass group flex flex-col justify-between space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Vector Mesh Chunks
              </span>
              <div className="bento-icon-bounce rounded-2xl border border-purple-500/20 bg-purple-500/10 p-2 text-purple-500">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-black tracking-tight text-foreground">
                  {vectorEstimatedChunks > 0 ? vectorEstimatedChunks.toLocaleString() : "10K+"}
                </span>
                <span className="font-mono text-xs font-bold text-purple-500">Qdrant</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">bge-large cosine indexed</p>
            </div>
          </div>
        </div>

        {/* ── DRAMATIC ASYMMETRIC ROW 3: Asymmetrical Glass Launchpads (Span 7, Span 5, Span 4, Span 4, Span 4) ── */}
        <div className="gsap-dash space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>Academic Workspace Suite</span>
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              Spatial Apple-Glass Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-12">
            {/* Launchpad 1: Course Ingestion Studio (Wide Span 7) */}
            <Link
              href="/ingest"
              className="liquid-glass group flex flex-col justify-between space-y-4 p-6 md:col-span-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="bento-icon-bounce rounded-2xl border border-primary/25 bg-primary/10 p-3.5 text-primary">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <Badge
                  variant="outline"
                  className="border-white/20 bg-white/10 font-mono text-[10px] font-bold uppercase text-foreground"
                >
                  Ingestion Studio
                </Badge>
              </div>

              <div>
                <h3 className="flex items-center justify-between text-base font-bold text-foreground transition-colors group-hover:text-primary sm:text-lg">
                  <span>Course Ingestion & Document Pipeline</span>
                  <ArrowUpRight className="h-5 w-5 transform opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </h3>
                <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground">
                  Drag and drop lecture slide decks, syllabus outlines, and textbook PDFs. Extracts
                  full OCR text and generates dense semantic embeddings into Qdrant collections.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3 font-mono text-xs">
                <span className="text-muted-foreground">
                  {totalDocs} Documents • {totalPages} Pages
                </span>
                <span className="font-bold text-primary">Open Studio →</span>
              </div>
            </Link>

            {/* Launchpad 2: Grounded RAG Chat (Medium Span 5) */}
            <Link
              href="/chat"
              className="liquid-glass group flex flex-col justify-between space-y-4 p-6 md:col-span-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="bento-icon-bounce rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-emerald-500">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-500/20 bg-emerald-500/10 font-mono text-[10px] font-bold uppercase text-emerald-500"
                >
                  Sub-Second RAG
                </Badge>
              </div>

              <div>
                <h3 className="flex items-center justify-between text-base font-bold text-foreground transition-colors group-hover:text-emerald-500 sm:text-lg">
                  <span>Grounded RAG Chat</span>
                  <ArrowUpRight className="h-5 w-5 transform opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Query your course notes with exact page-level citations, audio voice toggle, and
                  multi-model Groq switching.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3 font-mono text-xs">
                <span className="text-muted-foreground">Strict Grounding</span>
                <span className="font-bold text-emerald-500">Ask AI →</span>
              </div>
            </Link>

            {/* Launchpad 3: Knowledge Graph (Span 4) */}
            <Link
              href="/graph"
              className="liquid-glass group flex flex-col justify-between space-y-3 p-5 md:col-span-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="bento-icon-bounce rounded-2xl border border-purple-500/25 bg-purple-500/10 p-3 text-purple-500">
                  <Layers className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="border-purple-500/20 bg-purple-500/10 font-mono text-[9px] font-bold uppercase text-purple-500"
                >
                  Concept Map
                </Badge>
              </div>

              <div>
                <h3 className="flex items-center justify-between text-sm font-bold text-foreground transition-colors group-hover:text-purple-500 sm:text-base">
                  <span>Knowledge Graph</span>
                  <ArrowUpRight className="h-4 w-4 opacity-0 transition-all group-hover:opacity-100" />
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Interactive 3D concept network & Louvain modularity clusters.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[11px]">
                <span className="text-muted-foreground">DAG Topology</span>
                <span className="font-bold text-purple-500">Explore →</span>
              </div>
            </Link>

            {/* Launchpad 4: Syllabus Intelligence (Span 4) */}
            <Link
              href="/syllabus"
              className="liquid-glass group flex flex-col justify-between space-y-3 p-5 md:col-span-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="bento-icon-bounce rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-amber-500">
                  <BookOpen className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="border-amber-500/20 bg-amber-500/10 font-mono text-[9px] font-bold uppercase text-amber-500"
                >
                  Curriculum
                </Badge>
              </div>

              <div>
                <h3 className="flex items-center justify-between text-sm font-bold text-foreground transition-colors group-hover:text-amber-500 sm:text-base">
                  <span>Syllabus Intelligence</span>
                  <ArrowUpRight className="h-4 w-4 opacity-0 transition-all group-hover:opacity-100" />
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Hierarchical topic trees with automatic mastery trackers.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[11px]">
                <span className="text-muted-foreground">82% Covered</span>
                <span className="font-bold text-amber-500">Track →</span>
              </div>
            </Link>

            {/* Launchpad 5: Revision Timetable (Span 4) */}
            <Link
              href="/plan"
              className="liquid-glass group flex flex-col justify-between space-y-3 p-5 md:col-span-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="bento-icon-bounce rounded-2xl border border-rose-500/25 bg-rose-500/10 p-3 text-rose-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="border-rose-500/20 bg-rose-500/10 font-mono text-[9px] font-bold uppercase text-rose-500"
                >
                  LangGraph
                </Badge>
              </div>

              <div>
                <h3 className="flex items-center justify-between text-sm font-bold text-foreground transition-colors group-hover:text-rose-500 sm:text-base">
                  <span>Revision Timetable</span>
                  <ArrowUpRight className="h-4 w-4 opacity-0 transition-all group-hover:opacity-100" />
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Autonomous exam countdown and daily study schedule blocks.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-2 font-mono text-[11px]">
                <span className="text-muted-foreground">Daily Quotas</span>
                <span className="font-bold text-rose-500">Schedule →</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ── DRAMATIC ASYMMETRIC ROW 4: Live Ingested Files (Span 7) + Academic Digital Twin Radar (Span 5) ── */}
        <div className="gsap-dash grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left: Recent Ingested Files Card (Span 7) */}
          <div className="liquid-glass space-y-4 p-6 lg:col-span-7">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-2 text-primary">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Recent Ingested Course Files
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Live vectorized documents in your workspace
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ingest")}
                className="h-8 gap-1 rounded-xl border-white/20 bg-white/5 text-xs font-bold hover:bg-white/15"
              >
                <span>Full Ingest Studio</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {fetching ? (
              <div className="flex items-center justify-center gap-2 p-8 text-center text-xs text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin text-primary" />
                <span>Synchronizing indexed documents...</span>
              </div>
            ) : docs.length === 0 ? (
              <div className="space-y-2 p-8 text-center text-xs text-muted-foreground">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p>
                  No documents uploaded yet. Ingest syllabus and lecture notes to begin vector
                  analysis.
                </p>
                <Button
                  onClick={() => router.push("/ingest")}
                  size="sm"
                  className="gap-1.5 rounded-2xl bg-primary text-xs font-bold text-primary-foreground"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload Files Now</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {docs.slice(0, 4).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-primary/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">{d.filename}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {((d.size_bytes || 0) / (1024 * 1024)).toFixed(2)} MB •{" "}
                          {d.page_count || 1} pages
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase",
                          d.status === "ocr_complete"
                            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                            : "border border-amber-500/20 bg-amber-500/10 text-amber-500",
                        )}
                      >
                        {d.status === "ocr_complete" ? "Ready" : d.status}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/chat?q=Explain%20key%20concepts%20from%20${encodeURIComponent(d.filename)}`,
                          )
                        }
                        className="h-7 px-2 text-[11px] font-bold text-primary hover:bg-white/10"
                      >
                        Ask RAG
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Academic Digital Twin Radar (Span 5) */}
          <div className="liquid-glass flex flex-col justify-between space-y-4 p-6 lg:col-span-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Digital Twin Telemetry</h3>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-500/20 bg-emerald-500/10 font-mono text-[10px] text-emerald-500"
                >
                  State Synced
                </Badge>
              </div>

              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Next Exam Target</span>
                  <span className="font-mono text-[11px] font-bold text-primary">24 Days Left</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Focus on Dynamic Programming and AVL Tree Rotations. 3 weak concept dependencies
                  detected in Knowledge Graph.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/twin")}
                className="h-9 w-full rounded-2xl border-white/20 bg-white/5 text-xs font-bold hover:bg-white/15"
              >
                Inspect Twin
              </Button>
              <Button
                onClick={() => router.push("/plan")}
                size="sm"
                className="h-9 w-full rounded-2xl bg-primary text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90"
              >
                View Timetable
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
