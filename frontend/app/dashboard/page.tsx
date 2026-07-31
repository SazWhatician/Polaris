"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, CheckCircle2, Clock, Sparkles, Activity, Layers, ArrowRight, MessageSquare, Target, Calendar } from "lucide-react";
import Link from "next/link";

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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <SiteHeader />
      <main ref={containerRef} className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-8">
        
        {/* Step-by-Step Workflow Pipeline Banner */}
        <div className="gsap-dash glass-card-glow p-5 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-indigo-400 font-semibold uppercase tracking-wider mb-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Polaris AI 4-Step Academic Workflow</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100">Step 1: Upload Course Notes & Syllabus PDFs</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/chat"
                className="glass-button text-xs py-2 px-4 text-white font-medium flex items-center gap-1.5"
              >
                <span>Proceed to Grounded Chat</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <WorkflowStep active number="1" label="Upload Notes & Syllabus" href="/dashboard" icon={<FileText className="h-3.5 w-3.5 text-indigo-400" />} />
            <WorkflowStep number="2" label="Grounded RAG Chat" href="/chat" icon={<MessageSquare className="h-3.5 w-3.5 text-purple-400" />} />
            <WorkflowStep number="3" label="Gaps & YT Videos" href="/gaps" icon={<Target className="h-3.5 w-3.5 text-pink-400" />} />
            <WorkflowStep number="4" label="Revision Planner" href="/plan" icon={<Calendar className="h-3.5 w-3.5 text-cyan-400" />} />
          </div>
        </div>

        {/* Header Block */}
        <div className="gsap-dash flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Course Ingestion Library
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Upload PDF course notes & textbooks for OCR extraction, vector chunking, and grounded RAG indexing.
            </p>
          </div>

          <div className="glass-badge flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Qdrant Multi-Tenant Active</span>
          </div>
        </div>

        {/* Sleek Telemetry Stats Grid */}
        <div className="gsap-dash grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SleekStatCard
            icon={<FileText className="h-5 w-5 text-indigo-400" />}
            label="Total Documents"
            value={totalDocs.toString()}
          />
          <SleekStatCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            label="OCR Complete & Indexed"
            value={processedDocs.toString()}
          />
          <SleekStatCard
            icon={<Layers className="h-5 w-5 text-purple-400" />}
            label="Extracted Pages"
            value={totalPages.toString()}
          />
        </div>

        {/* Upload Card */}
        <div className="gsap-dash">
          <UploadCard onUploaded={(d) => setDocs((prev) => [d, ...prev])} />
        </div>

        {/* Document List */}
        <div className="gsap-dash">
          {fetching ? (
            <div className="glass-card p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-3">
              <Clock className="h-4 w-4 animate-spin text-indigo-400" />
              <span>Fetching Document Index...</span>
            </div>
          ) : (
            <DocumentList docs={docs} onChange={setDocs} />
          )}
        </div>
      </main>
    </div>
  );
}

function WorkflowStep({
  number,
  label,
  href,
  icon,
  active = false,
}: {
  number: string;
  label: string;
  href: React.ComponentProps<typeof Link>["href"];
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
        active
          ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 font-semibold"
          : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/70"
      }`}
    >
      <span className={`w-5 h-5 rounded-full text-[11px] font-mono font-bold flex items-center justify-center ${
        active ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"
      }`}>
        {number}
      </span>
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SleekStatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60">{icon}</div>
        <div>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
      </div>
    </div>
  );
}
