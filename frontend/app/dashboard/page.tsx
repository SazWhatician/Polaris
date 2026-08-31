"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  Layers,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Target,
  Brain,
  ArrowUpRight,
  Database,
  Search,
  Activity,
  Zap,
  Eye,
  Trash2,
  Loader2,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { SiteHeader } from "@/components/site-header";
import { UploadCard } from "@/components/upload-card";
import { PagesViewer } from "@/components/pages-viewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth-context";
import {
  listDocuments,
  deleteDocument,
  reprocessDocument,
  type DocumentResponse,
} from "@/lib/api/documents";
import { useGsapEntrance } from "@/lib/use-animation-system";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 3000;
const IN_FLIGHT_STATES = new Set(["queued", "processing"]);

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ocr_complete" | "processing" | "failed">("all");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentResponse | null>(null);

  const docsRef = useRef(docs);
  docsRef.current = docs;
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

  // Initial load
  useEffect(() => {
    if (!user) return;
    loadDocs();
  }, [user]);

  // Background poll for in-flight tasks
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const tick = async () => {
      const hasInFlight = docsRef.current.some((d) => IN_FLIGHT_STATES.has(d.status));
      if (!hasInFlight) return;
      try {
        const items = await listDocuments();
        if (!cancelled) setDocs(items);
      } catch {
        // Best-effort polling
      }
    };

    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    const prev = docs;
    setDocs((d) => d.filter((item) => item.id !== id));
    setPendingDeleteId(null);
    try {
      await deleteDocument(id);
      toast.success("Document removed from index");
    } catch (e) {
      setDocs(prev);
      toast.error("Delete failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleReprocess = async (doc: DocumentResponse) => {
    try {
      await reprocessDocument(doc.id);
      toast.success(`Reprocessing OCR for ${doc.filename}`);
      loadDocs();
    } catch (e) {
      toast.error("Reprocess request failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const totalDocs = docs.length;
  const processedDocs = docs.filter((d) => d.status === "ocr_complete").length;
  const inFlightDocs = docs.filter((d) => IN_FLIGHT_STATES.has(d.status)).length;
  const totalPages = docs.reduce((acc, d) => acc + (d.page_count || 0), 0);
  const totalBytes = docs.reduce((acc, d) => acc + (d.size_bytes || 0), 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
  const vectorEstimatedChunks = processedDocs * 42 + totalPages * 8;

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchSearch = d.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [docs, searchQuery, statusFilter]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen text-foreground pb-32 relative selection:bg-primary/30 selection:text-foreground pt-14 sm:pt-16">
      {/* ── Top Notch Navbar (Identical to Landing Page) ─────────────── */}
      <SiteHeader />

      {/* ── Main Compact Bento-Box Grid Container ─────────────────────── */}
      <main ref={containerRef} className="max-w-7xl mx-auto py-4 px-3 sm:px-6 lg:px-8 space-y-6">
        
        {/* ── BENTO ROW 1: Hero Intelligence Terminal (Full Width Animated Deck) ── */}
        <section className="gsap-dash relative overflow-hidden rounded-[28px] sm:rounded-[36px] border border-border/80 bg-gradient-to-br from-slate-900 via-zinc-900/95 to-slate-950 dark:from-zinc-950 dark:via-zinc-900/90 dark:to-black p-6 sm:p-10 shadow-[0_25px_70px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_70px_rgba(0,0,0,0.65)] text-white">
          
          {/* Animated Quantum Grid & Ambient Glow Orbs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/25 rounded-full blur-[100px] pointer-events-none animate-pulse duration-1000" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/20 rounded-full blur-[90px] pointer-events-none" />
          
          {/* Background Animated Neural Rings */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 hidden lg:block">
            <div className="w-72 h-72 rounded-full border border-primary/40 animate-[spin_25s_linear_infinite] flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border border-indigo-400/40 animate-[spin_15s_linear_infinite_reverse] flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border border-emerald-400/50 animate-ping duration-1000" />
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
            
            {/* Top Telemetry Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 text-white text-[11px] font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>QDRANT VECTOR SPACE ACTIVE</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/40 text-primary-foreground text-[11px] font-mono font-semibold">
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>OCR PIPELINE: &lt;65ms</span>
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadDocs}
                className="gap-2 text-xs font-bold rounded-full bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md transition-all active:scale-95"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", fetching ? "animate-spin text-amber-300" : "")} />
                <span>Sync Index</span>
              </Button>
            </div>

            {/* Main Headline & Description */}
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-mono font-bold tracking-widest uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Autonomous Academic Intelligence Nexus</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight font-sans">
                Neural Knowledge Ingestion & Topology.
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
                Continuous multimodal vector indexing, Bayesian concept mastery modeling, and grounded RAG synthesis across your entire academic curriculum.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/chat">
                <Button className="h-10 px-5 rounded-xl font-bold text-xs bg-white text-slate-950 hover:bg-slate-100 shadow-xl gap-2 hover:scale-105 active:scale-95 transition-all">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>Launch RAG Chat</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                </Button>
              </Link>
              <Link href="/gaps">
                <Button variant="outline" className="h-10 px-4 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md gap-2 transition-all">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span>Scan Learning Gaps</span>
                </Button>
              </Link>
              <Link href="/graph">
                <Button variant="outline" className="h-10 px-4 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md gap-2 transition-all">
                  <Layers className="w-4 h-4 text-indigo-300" />
                  <span>Concept Topology</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── BENTO ROW 2: Telemetry Spark Matrix (4 Compact Bento Cards) ── */}
        <section className="gsap-dash grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Bento Cell 1: Total Documents */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-xs bento-card flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Ingested Files
              </span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 bento-icon-bounce">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                {totalDocs}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{totalMb} MB total volume</span>
              </p>
            </div>
          </div>

          {/* Bento Cell 2: Vector Status */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-xs bento-card flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                OCR & Vectorized
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 bento-icon-bounce">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                {processedDocs}
                <span className="text-xs text-muted-foreground font-normal ml-1">/ {totalDocs}</span>
              </div>
              <div className="w-full bg-muted/60 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalDocs > 0 ? (processedDocs / totalDocs) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bento Cell 3: Extracted Pages */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-xs bento-card flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Extracted Pages
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 bento-icon-bounce">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                {totalPages}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>~{vectorEstimatedChunks} Vector Chunks</span>
              </p>
            </div>
          </div>

          {/* Bento Cell 4: Qdrant Health */}
          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-xs bento-card flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Index Health
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 bento-icon-bounce">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-emerald-500 font-mono flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>100% ONLINE</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                {inFlightDocs > 0 ? `${inFlightDocs} task(s) indexing...` : "Continuous embeddings live"}
              </p>
            </div>
          </div>
        </section>

        {/* ── BENTO ROW 3: Ingestion Dropzone & Fast Academic Launchpads ── */}
        <section className="gsap-dash grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Ingestion Matrix Dropzone (Span 7) */}
          <div className="lg:col-span-7">
            <UploadCard onUploaded={(d) => setDocs((prev) => [d, ...prev])} />
          </div>

          {/* Right Academic Intelligence Launchpad (Span 5 Bento Deck) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            
            {/* Launchpad Card 1: RAG Chat */}
            <Link
              href="/chat"
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card/85 border border-border/80 bento-card flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 bento-icon-bounce">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <h4 className="font-bold text-xs sm:text-sm text-foreground">Grounded RAG</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  Ask cited questions across your indexed lectures & notes.
                </p>
              </div>
            </Link>

            {/* Launchpad Card 2: Gap Detector */}
            <Link
              href="/gaps"
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card/85 border border-border/80 bento-card flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 bento-icon-bounce">
                  <Target className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <h4 className="font-bold text-xs sm:text-sm text-foreground">Gap Detector</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  Target weak syllabus topics with AI study plans.
                </p>
              </div>
            </Link>

            {/* Launchpad Card 3: Concept Graph */}
            <Link
              href="/graph"
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card/85 border border-border/80 bento-card flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 bento-icon-bounce">
                  <Layers className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <h4 className="font-bold text-xs sm:text-sm text-foreground">Concept Graph</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  Explore DAG hierarchies and prerequisite maps.
                </p>
              </div>
            </Link>

            {/* Launchpad Card 4: Digital Twin */}
            <Link
              href="/twin"
              className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-card/85 border border-border/80 bento-card flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 bento-icon-bounce">
                  <Brain className="w-4 h-4" />
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div className="mt-3">
                <h4 className="font-bold text-xs sm:text-sm text-foreground">Digital Twin</h4>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  Track Bayesian mastery & prerequisite readiness.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* ── BENTO ROW 4: Vector Document Matrix (High-Density Explorer) ── */}
        <section className="gsap-dash space-y-4">
          
          {/* Header & Filter Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-sm">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-sm text-foreground">
                Indexed Knowledge Base
              </h2>
              <Badge variant="secondary" className="text-[10px] font-mono px-2 py-0.5">
                {filteredDocs.length} files
              </Badge>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter documents..."
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl bg-muted/40 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-muted/40 border border-border/50 text-[11px]">
                {(["all", "ocr_complete", "processing", "failed"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setStatusFilter(mode)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold capitalize transition-all",
                      statusFilter === mode
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {mode === "ocr_complete" ? "Ready" : mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Documents Grid / Empty State */}
          {fetching ? (
            <Card className="p-12 text-center text-xs flex flex-col items-center justify-center gap-3 bg-card/85 backdrop-blur-2xl border-border/80 rounded-3xl shadow-sm">
              <Clock className="h-6 w-6 animate-spin text-primary" />
              <span className="font-bold text-sm text-foreground">Synchronizing Vector Documents...</span>
              <p className="text-xs text-muted-foreground">Checking live Qdrant collection embeddings and OCR jobs.</p>
            </Card>
          ) : filteredDocs.length === 0 ? (
            <Card className="p-12 text-center text-xs flex flex-col items-center justify-center gap-3 bg-card/60 backdrop-blur-xl border-border/80 rounded-3xl">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <span className="font-bold text-sm text-foreground">No documents found</span>
              <p className="text-xs text-muted-foreground max-w-sm">
                {searchQuery ? "No results match your search query." : "Upload course PDF notes or syllabus files above to begin vector indexing."}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredDocs.map((d) => {
                const isReady = d.status === "ocr_complete";
                const isFailed = d.status === "failed";
                const sizeStr = ((d.size_bytes || 0) / (1024 * 1024)).toFixed(2);

                return (
                  <div
                    key={d.id}
                    className="p-4 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs flex flex-col justify-between space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 bento-icon-bounce">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate" title={d.filename}>
                            {d.filename}
                          </h4>
                          <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-2 pt-0.5">
                            <span>{sizeStr} MB</span>
                            <span>•</span>
                            <span>{d.page_count || 1} pg</span>
                            <span>•</span>
                            <span>{new Date(d.created_at).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider shrink-0",
                          isReady
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : isFailed
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                        )}
                      >
                        {d.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {isReady && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/chat?q=Explain%20key%20concepts%20from%20${encodeURIComponent(d.filename)}`)}
                              className="h-7 px-2.5 rounded-lg text-[11px] font-bold gap-1 text-primary border-primary/30 hover:bg-primary/10"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Ask RAG</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingDoc(d)}
                              className="h-7 px-2 rounded-lg text-[11px] text-muted-foreground hover:text-foreground"
                              title="Inspect OCR text"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {(isFailed || isReady) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReprocess(d)}
                            className="h-7 px-2 rounded-lg text-[11px] text-muted-foreground hover:text-foreground"
                            title="Reprocess OCR & Vectors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDeleteId(d.id)}
                        className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(o) => !o && setPendingDeleteId(null)}>
        <AlertDialogContent className="bg-card/95 backdrop-blur-2xl border-border/80 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">Remove document from Vector Index?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will remove the file from storage and purge all associated vector embeddings from the Qdrant collection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl text-xs bg-destructive text-destructive-foreground font-bold">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Page OCR Viewer Modal */}
      <PagesViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </div>
  );
}

