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
  Brain,
  ArrowUpRight,
  Database,
  Activity,
  Zap,
  BookOpen,
  Calendar,
  UploadCloud,
  Cpu,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import {
  listDocuments,
  type DocumentResponse,
} from "@/lib/api/documents";
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
  const processedDocs = docs.filter((d) => d.status === "ocr_complete").length;
  const totalPages = docs.reduce((acc, d) => acc + (d.page_count || 0), 0);
  const totalBytes = docs.reduce((acc, d) => acc + (d.size_bytes || 0), 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
  const vectorEstimatedChunks = processedDocs * 42 + totalPages * 8;

  if (loading || !user) return null;

  return (
    <div className="relative min-h-screen text-foreground pb-32 pt-14 sm:pt-16 overflow-x-hidden selection:bg-primary/30 selection:text-foreground">
      {/* ── Ambient Fluid Liquid Caustic Spheres (iOS/visionOS Glass Glow) ── */}
      <div className="ambient-liquid-glow -top-24 -left-24 w-[500px] h-[500px] bg-indigo-500/20" />
      <div className="ambient-liquid-glow top-[35%] -right-32 w-[550px] h-[550px] bg-purple-500/15" />
      <div className="ambient-liquid-glow bottom-12 left-[20%] w-[600px] h-[600px] bg-emerald-500/12" />

      <SiteHeader />

      <main ref={containerRef} className="relative z-10 max-w-7xl mx-auto space-y-5 py-4 px-3 sm:px-6 lg:px-8">
        
        {/* ── DRAMATIC ASYMMETRIC ROW 1: Panoramic Command Deck (Span 8) + Spatial Telemetry Carousel (Span 4) ── */}
        <div className="gsap-dash grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Hero Command Glass Pod (Span 8) */}
          <div className="lg:col-span-8 liquid-glass p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary font-mono text-[10px] font-bold tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping inline-block" />
                  <span>POLARIS ACADEMIC ENGINE // ACTIVE</span>
                </span>
                <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">•</span>
                <span className="text-[11px] font-mono text-muted-foreground">Neural Vector Mesh & OCR Pipeline</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.08]">
                Autonomous Academic <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-primary via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Intelligence Nexus
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
                Welcome back, <span className="font-bold text-foreground">{user.displayName || "Scholar"}</span>. Your course syllabus, dense vector embeddings, and concept DAGs are indexed and live.
              </p>
            </div>

            {/* Glass Action Dock */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Button
                onClick={() => router.push("/ingest")}
                className="rounded-2xl font-bold text-xs h-9.5 px-5 gap-2 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all hover:scale-102"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Ingest Course Notes</span>
              </Button>

              <Button
                onClick={() => router.push("/chat")}
                variant="outline"
                className="rounded-2xl font-bold text-xs h-9.5 px-5 gap-2 border-white/20 dark:border-white/15 bg-white/10 dark:bg-white/5 hover:bg-white/20 backdrop-blur-xl transition-all"
              >
                <MessageSquare className="w-4 h-4 text-primary" />
                <span>Grounded RAG Chat</span>
              </Button>

              <Button
                onClick={() => router.push("/community")}
                variant="ghost"
                className="rounded-2xl font-bold text-xs h-9.5 px-4 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Scholar Community</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </div>
          </div>

          {/* Spatial Telemetry Multi-Image Liquid Glass Carousel (Span 4) */}
          <div className="lg:col-span-4">
            <SpatialTelemetryCarousel totalMb={totalMb} />
          </div>

        </div>

        {/* ── DRAMATIC ASYMMETRIC ROW 2: Triple Liquid Glass Spark Pods (3 x Span 4) ── */}
        <div className="gsap-dash grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Pod 1: Ingested Course Files */}
          <div className="liquid-glass p-5 flex flex-col justify-between space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase tracking-wider">
                Ingested Files
              </span>
              <div className="p-2 rounded-2xl bg-primary/10 text-primary border border-primary/20 bento-icon-bounce">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                  {totalDocs}
                </span>
                <span className="text-xs font-mono text-emerald-500 font-bold">
                  {processedDocs} Indexed
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                <span>{totalPages} total pages</span>
                <Link href="/ingest" className="text-primary hover:underline font-semibold flex items-center gap-0.5">
                  <span>Studio →</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Pod 2: Syllabus Coverage */}
          <div className="liquid-glass p-5 flex flex-col justify-between space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase tracking-wider">
                Curriculum Coverage
              </span>
              <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 bento-icon-bounce">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                  82%
                </span>
                <span className="text-xs font-mono text-emerald-500 font-bold">
                  +8% this week
                </span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: "82%" }} />
              </div>
            </div>
          </div>

          {/* Pod 3: Exam Readiness Index */}
          <div className="liquid-glass p-5 flex flex-col justify-between space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase tracking-wider">
                Exam Readiness
              </span>
              <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 bento-icon-bounce">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                  91.4%
                </span>
                <span className="text-xs font-mono text-amber-500 font-bold">
                  Target: 95%
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                LangGraph confidence synthesis
              </p>
            </div>
          </div>

          {/* Pod 4: Vector Mesh Chunks */}
          <div className="liquid-glass p-5 flex flex-col justify-between space-y-3 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-muted-foreground font-bold uppercase tracking-wider">
                Vector Mesh Chunks
              </span>
              <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 bento-icon-bounce">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono tracking-tight text-foreground">
                  {vectorEstimatedChunks > 0 ? vectorEstimatedChunks.toLocaleString() : "10K+"}
                </span>
                <span className="text-xs font-mono text-purple-500 font-bold">
                  Qdrant
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                bge-large cosine indexed
              </p>
            </div>
          </div>

        </div>

        {/* ── DRAMATIC ASYMMETRIC ROW 3: Asymmetrical Glass Launchpads (Span 7, Span 5, Span 4, Span 4, Span 4) ── */}
        <div className="gsap-dash space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Academic Workspace Suite</span>
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">Spatial Apple-Glass Architecture</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            
            {/* Launchpad 1: Course Ingestion Studio (Wide Span 7) */}
            <Link
              href="/ingest"
              className="md:col-span-7 liquid-glass p-6 flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="p-3.5 rounded-2xl bg-primary/10 text-primary border border-primary/25 bento-icon-bounce">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="text-[10px] font-mono font-bold uppercase bg-white/10 border-white/20 text-foreground">
                  Ingestion Studio
                </Badge>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>Course Ingestion & Document Pipeline</span>
                  <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-lg">
                  Drag and drop lecture slide decks, syllabus outlines, and textbook PDFs. Extracts full OCR text and generates dense semantic embeddings into Qdrant collections.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">{totalDocs} Documents • {totalPages} Pages</span>
                <span className="text-primary font-bold">Open Studio →</span>
              </div>
            </Link>

            {/* Launchpad 2: Grounded RAG Chat (Medium Span 5) */}
            <Link
              href="/chat"
              className="md:col-span-5 liquid-glass p-6 flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 bento-icon-bounce">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="text-[10px] font-mono font-bold uppercase bg-emerald-500/10 border-emerald-500/20 text-emerald-500">
                  Sub-Second RAG
                </Badge>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-emerald-500 transition-colors flex items-center justify-between">
                  <span>Grounded RAG Chat</span>
                  <ArrowUpRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Query your course notes with exact page-level citations, audio voice toggle, and multi-model Groq switching.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Strict Grounding</span>
                <span className="text-emerald-500 font-bold">Ask AI →</span>
              </div>
            </Link>

            {/* Launchpad 3: Knowledge Graph (Span 4) */}
            <Link
              href="/graph"
              className="md:col-span-4 liquid-glass p-5 flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/25 bento-icon-bounce">
                  <Layers className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[9px] font-mono font-bold uppercase bg-purple-500/10 border-purple-500/20 text-purple-500">
                  Concept Map
                </Badge>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-purple-500 transition-colors flex items-center justify-between">
                  <span>Knowledge Graph</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Interactive 3D concept network & Louvain modularity clusters.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground">DAG Topology</span>
                <span className="text-purple-500 font-bold">Explore →</span>
              </div>
            </Link>

            {/* Launchpad 4: Syllabus Intelligence (Span 4) */}
            <Link
              href="/syllabus"
              className="md:col-span-4 liquid-glass p-5 flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25 bento-icon-bounce">
                  <BookOpen className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[9px] font-mono font-bold uppercase bg-amber-500/10 border-amber-500/20 text-amber-500">
                  Curriculum
                </Badge>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-amber-500 transition-colors flex items-center justify-between">
                  <span>Syllabus Intelligence</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Hierarchical topic trees with automatic mastery trackers.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground">82% Covered</span>
                <span className="text-amber-500 font-bold">Track →</span>
              </div>
            </Link>

            {/* Launchpad 5: Revision Timetable (Span 4) */}
            <Link
              href="/plan"
              className="md:col-span-4 liquid-glass p-5 flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/25 bento-icon-bounce">
                  <Calendar className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[9px] font-mono font-bold uppercase bg-rose-500/10 border-rose-500/20 text-rose-500">
                  LangGraph
                </Badge>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-rose-500 transition-colors flex items-center justify-between">
                  <span>Revision Timetable</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Autonomous exam countdown and daily study schedule blocks.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                <span className="text-muted-foreground">Daily Quotas</span>
                <span className="text-rose-500 font-bold">Schedule →</span>
              </div>
            </Link>

          </div>
        </div>

        {/* ── DRAMATIC ASYMMETRIC ROW 4: Live Ingested Files (Span 7) + Academic Digital Twin Radar (Span 5) ── */}
        <div className="gsap-dash grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left: Recent Ingested Files Card (Span 7) */}
          <div className="lg:col-span-7 liquid-glass p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Recent Ingested Course Files</h3>
                  <p className="text-[11px] text-muted-foreground">Live vectorized documents in your workspace</p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/ingest")}
                className="h-8 text-xs font-bold gap-1 rounded-xl border-white/20 bg-white/5 hover:bg-white/15"
              >
                <span>Full Ingest Studio</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {fetching ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-spin text-primary" />
                <span>Synchronizing indexed documents...</span>
              </div>
            ) : docs.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p>No documents uploaded yet. Ingest syllabus and lecture notes to begin vector analysis.</p>
                <Button
                  onClick={() => router.push("/ingest")}
                  size="sm"
                  className="rounded-2xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Files Now</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {docs.slice(0, 4).map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{d.filename}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {((d.size_bytes || 0) / (1024 * 1024)).toFixed(2)} MB • {d.page_count || 1} pages
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase",
                        d.status === "ocr_complete"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      )}>
                        {d.status === "ocr_complete" ? "Ready" : d.status}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/chat?q=Explain%20key%20concepts%20from%20${encodeURIComponent(d.filename)}`)}
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
          <div className="lg:col-span-5 liquid-glass p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Digital Twin Telemetry</h3>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
                  State Synced
                </Badge>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">Next Exam Target</span>
                  <span className="font-mono text-[11px] text-primary font-bold">24 Days Left</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Focus on Dynamic Programming and AVL Tree Rotations. 3 weak concept dependencies detected in Knowledge Graph.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/twin")}
                className="w-full text-xs font-bold rounded-2xl h-9 border-white/20 bg-white/5 hover:bg-white/15"
              >
                Inspect Twin
              </Button>
              <Button
                onClick={() => router.push("/plan")}
                size="sm"
                className="w-full text-xs font-bold rounded-2xl h-9 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
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
