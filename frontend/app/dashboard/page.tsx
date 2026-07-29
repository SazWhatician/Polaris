"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, CheckCircle2, Clock, Sparkles, Terminal, Activity, Layers } from "lucide-react";

import { DocumentList } from "@/components/document-list";
import { SiteHeader } from "@/components/site-header";
import { UploadCard } from "@/components/upload-card";
import { useAuth } from "@/lib/auth-context";
import { listDocuments, type DocumentResponse } from "@/lib/api/documents";
import { useGsapEntrance } from "@/lib/use-gsap-animations";

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

  // Initial load.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const items = await listDocuments();
        if (!cancelled) setDocs(items);
      } catch (e) {
        toast.error("Failed to load documents", {
          description: e instanceof Error ? e.message : String(e),
        });
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Background poll
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
        // Polling best-effort
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
    <div className="min-h-screen bg-background text-foreground pb-16">
      <SiteHeader />
      <main ref={containerRef} className="container max-w-5xl space-y-8 py-10 px-4 sm:px-8">
        
        {/* Header Block */}
        <div className="gsap-dash flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-indigo-500/40 pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-indigo-400 font-bold mb-1">
              <Terminal className="h-4 w-4" />
              <span>[WORKSPACE // DOCUMENTS_LIBRARY]</span>
            </div>
            <h1 className="text-3xl font-black font-mono tracking-tight uppercase">
              Academic Documents
            </h1>
            <p className="text-slate-400 font-mono text-xs mt-1">
              Upload PDF course notes & textbooks for OCR extraction, vector chunking, & RAG indexing.
            </p>
          </div>

          <div className="brutal-badge flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>STORAGE_RULES_VERIFIED</span>
          </div>
        </div>

        {/* Brutalist Telemetry Stats Grid */}
        <div className="gsap-dash grid grid-cols-1 sm:grid-cols-3 gap-4">
          <BrutalStatCard
            icon={<FileText className="h-5 w-5 text-indigo-400" />}
            label="Total Documents"
            value={totalDocs.toString()}
            code="DOC_COUNT"
          />
          <BrutalStatCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            label="OCR Complete & Indexed"
            value={processedDocs.toString()}
            code="RAG_READY"
          />
          <BrutalStatCard
            icon={<Layers className="h-5 w-5 text-purple-400" />}
            label="Extracted Pages"
            value={totalPages.toString()}
            code="PAGE_TOTAL"
          />
        </div>

        {/* Upload Card */}
        <div className="gsap-dash">
          <UploadCard onUploaded={(d) => setDocs((prev) => [d, ...prev])} />
        </div>

        {/* Document List */}
        <div className="gsap-dash">
          {fetching ? (
            <div className="brutal-card p-8 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-3">
              <Clock className="h-4 w-4 animate-spin text-indigo-400" />
              <span>FETCHING_DOCUMENTS_STREAM…</span>
            </div>
          ) : (
            <DocumentList docs={docs} onChange={setDocs} />
          )}
        </div>
      </main>
    </div>
  );
}

function BrutalStatCard({
  icon,
  label,
  value,
  code,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  code: string;
}) {
  return (
    <div className="brutal-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 border border-slate-800 bg-white/5">{icon}</div>
        <div>
          <p className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
          <p className="font-mono text-2xl font-black text-slate-100">{value}</p>
        </div>
      </div>
      <span className="font-mono text-[9px] text-indigo-400 font-bold">[{code}]</span>
    </div>
  );
}
