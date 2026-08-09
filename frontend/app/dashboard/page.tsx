"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Clock, Activity, CheckCircle2, Layers } from "lucide-react";

import { DocumentList } from "@/components/document-list";
import { SiteHeader } from "@/components/site-header";
import { UploadCard } from "@/components/upload-card";
import { useAuth } from "@/lib/auth-context";
import { listDocuments, type DocumentResponse } from "@/lib/api/documents";
import { useGsapEntrance } from "@/lib/use-gsap-animations";
import { Card } from "@/components/ui/card";

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
    <div className="min-h-screen text-foreground pb-16">
      <SiteHeader />
      <main ref={containerRef} className="max-w-6xl mx-auto space-y-8 py-8 px-4 sm:px-8">
        


        {/* Header Block */}
        <div className="gsap-dash flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Course Ingestion Library
            </h1>
            <p className="text-muted-foreground text-xs mt-1 font-medium">
              Upload PDF course notes & textbooks for OCR extraction, vector chunking, and grounded RAG indexing.
            </p>
          </div>

          <div className="px-3 py-1 text-xs font-semibold rounded-full border border-primary/30 text-primary bg-primary/10 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>Qdrant Multi-Tenant Active</span>
          </div>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="gsap-dash grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SleekStatCard
            icon={<FileText className="h-5 w-5 text-primary" />}
            label="Total Documents"
            value={totalDocs.toString()}
          />
          <SleekStatCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            label="OCR Complete & Indexed"
            value={processedDocs.toString()}
          />
          <SleekStatCard
            icon={<Layers className="h-5 w-5 text-purple-500" />}
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
            <Card className="p-8 text-center text-muted-foreground text-xs flex items-center justify-center gap-3">
              <Clock className="h-4 w-4 animate-spin text-primary" />
              <span>Fetching Document Index...</span>
            </Card>
          ) : (
            <DocumentList docs={docs} onChange={setDocs} />
          )}
        </div>
      </main>
    </div>
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
    <Card className="p-5 flex items-center justify-between">
      <div className="flex items-center gap-3.5">
        <div className="p-3 bg-muted/50 rounded-xl">{icon}</div>
        <div>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
}
