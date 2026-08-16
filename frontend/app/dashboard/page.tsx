"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Clock, CheckCircle2, Layers, RefreshCw } from "lucide-react";

import { DocumentList } from "@/components/document-list";
import { SiteHeader } from "@/components/site-header";
import { UploadCard } from "@/components/upload-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
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
    <div className="min-h-screen text-foreground pb-16">
      <SiteHeader />
      <main ref={containerRef} className="max-w-7xl mx-auto space-y-8 py-8 px-4 sm:px-6 lg:px-8">
        {/* Standardized Page Header */}
        <div className="gsap-dash">
          <PageHeader
            category="CORE WORKSPACE // INGESTION"
            title="Course Ingestion Library"
            description="Upload PDF course notes, lecture slides, and textbooks for OCR extraction, vector chunking, and grounded RAG indexing."
            icon={FileText}
            badgeText="Multi-Tenant Vector Store"
            badgeVariant="emerald"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={loadDocs}
                className="gap-2 text-xs font-bold rounded-xl border-border/80 hover:bg-muted/80"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${fetching ? "animate-spin text-primary" : ""}`} />
                <span>Refresh Index</span>
              </Button>
            }
          />
        </div>

        {/* Animated Telemetry Stat Grid */}
        <div className="gsap-dash grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            label="Total Documents"
            numericValue={totalDocs}
            value={totalDocs.toString()}
            icon={FileText}
            colorScheme="primary"
            trend="Active Files"
            trendPositive
            tag="Vectorized"
          />
          <StatCard
            label="OCR Complete & Indexed"
            numericValue={processedDocs}
            value={processedDocs.toString()}
            icon={CheckCircle2}
            colorScheme="emerald"
            trend="Ready for RAG"
            trendPositive
            tag="Qdrant Multi-Tenant"
          />
          <StatCard
            label="Extracted Pages"
            numericValue={totalPages}
            value={totalPages.toString()}
            icon={Layers}
            colorScheme="purple"
            trend="High Resolution"
            trendPositive
            tag="Chunk Indexed"
          />
        </div>

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
