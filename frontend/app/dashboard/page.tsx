"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Clock, CheckCircle2, Layers, RefreshCw } from "lucide-react";

import { DocumentList } from "@/components/document-list";
import { SiteHeader } from "@/components/site-header";
import { UploadCard } from "@/components/upload-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { listDocuments, type DocumentResponse } from "@/lib/api/documents";
import { useGsapEntrance } from "@/lib/use-animation-system";

const POLL_INTERVAL_MS = 3000;
const IN_FLIGHT_STATES = new Set(["queued", "processing"]);

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [fetching, setFetching] = useState(true);
  const docsRef = useRef(docs);
  docsRef.current = docs;
  const containerRef = useGsapEntrance(".gsap-dash", 0.05);

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

  if (loading || !user) return null;

  const totalDocs = docs.length;
  const processedDocs = docs.filter((d) => d.status === "ocr_complete").length;
  const totalPages = docs.reduce((acc, d) => acc + (d.page_count || 0), 0);

  return (
    <div className="min-h-screen text-foreground pb-36 relative selection:bg-primary/30 selection:text-foreground">
      {/* ── Top Floating Navigation Capsule + Left Rail + Corner Features ── */}
      <SiteHeader />

      {/* ── Main Full Page Container ───────────────────────────────── */}
      <main ref={containerRef} className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Editorial Hero Scene (Exact Match to "New Way Of Living") */}
        <section className="gsap-dash relative overflow-hidden rounded-[40px] sm:rounded-[48px] border-2 border-white/30 dark:border-white/15 bg-gradient-to-b from-sky-900/30 via-slate-900/60 to-black/80 shadow-[0_30px_90px_rgba(0,0,0,0.4)] p-8 sm:p-14 min-h-[380px] sm:min-h-[440px] flex flex-col justify-between">
          
          {/* Subtle architectural background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,200,150,0.18),transparent_60%)] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Row / Category Pill */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Tenant Vector Space</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadDocs}
              className="gap-2 text-xs font-bold rounded-full bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-md"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${fetching ? "animate-spin text-amber-300" : ""}`} />
              <span>Refresh Index</span>
            </Button>
          </div>

          {/* Center: Big Title + Description */}
          <div className="relative z-10 max-w-2xl my-6 sm:my-10 space-y-4">
            <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-white font-sans drop-shadow-md">
              New Way Of Living
            </h1>
            <p className="text-sm sm:text-base text-white/85 font-medium leading-relaxed drop-shadow-xs max-w-xl">
              Discover extraordinary properties available for purchase or rent. Whether you're seeking a dream home or a unique investment, our curated listings offer the most exceptional options worldwide.
            </p>
          </div>

          {/* Quick Metrics Banner */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/15">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white font-mono">{totalDocs}</p>
                <p className="text-xs text-white/70">Total Documents</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white font-mono">{processedDocs}</p>
                <p className="text-xs text-white/70">OCR & Vector Indexed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/20 backdrop-blur-md text-purple-300 border border-purple-500/30">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-white font-mono">{totalPages}</p>
                <p className="text-xs text-white/70">Extracted Pages</p>
              </div>
            </div>
          </div>
        </section>

        {/* Upload Card */}
        <div className="gsap-dash">
          <UploadCard onUploaded={(d) => setDocs((prev) => [d, ...prev])} />
        </div>

        {/* Document List */}
        <div className="gsap-dash">
          {fetching ? (
            <Card className="p-12 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-3 bg-card/75 backdrop-blur-2xl border-border/80 rounded-3xl">
              <Clock className="h-6 w-6 animate-spin text-primary" />
              <span className="font-semibold text-sm text-foreground">Fetching Document Index...</span>
              <p className="text-xs text-muted-foreground">Synchronizing vector status with Qdrant collection</p>
            </Card>
          ) : (
            <DocumentList docs={docs} onChange={setDocs} />
          )}
        </div>
      </main>
    </div>
  );
}
