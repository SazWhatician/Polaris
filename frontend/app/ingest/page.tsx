"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  FileText,
  Clock,
  Layers,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Search,
  Eye,
  Trash2,
  Database,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { UploadCard } from "@/components/upload-card";
import { PagesViewer } from "@/components/pages-viewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
const IN_FLIGHT_STATES = new Set(["queued", "processing", "indexing"]);

export default function IngestPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [fetching, setFetching] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ready" | "processing" | "failed">(
    "all",
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentResponse | null>(null);

  const docsRef = useRef(docs);
  docsRef.current = docs;
  const containerRef = useGsapEntrance(".gsap-ingest", 0.04);

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
  const processedDocs = docs.filter(
    (d) => d.status === "ocr_complete" || d.status === "indexed",
  ).length;
  const inFlightDocs = docs.filter((d) => IN_FLIGHT_STATES.has(d.status)).length;
  const totalPages = docs.reduce((acc, d) => acc + (d.page_count || 0), 0);
  const totalBytes = docs.reduce((acc, d) => acc + (d.size_bytes || 0), 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
  const vectorEstimatedChunks = processedDocs * 42 + totalPages * 8;

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchSearch = d.filename.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "ready"
          ? d.status === "ocr_complete" || d.status === "indexed"
          : statusFilter === "processing"
            ? IN_FLIGHT_STATES.has(d.status)
            : d.status === statusFilter);
      return matchSearch && matchStatus;
    });
  }, [docs, searchQuery, statusFilter]);

  if (loading || !user) return null;

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-32 pt-14 text-foreground selection:bg-primary/30 selection:text-foreground sm:pt-16">
      {/* ── Ambient Fluid Liquid Caustic Spheres (iOS/visionOS Glass Glow) ── */}
      <div className="ambient-liquid-glow -left-24 -top-24 h-[500px] w-[500px] bg-indigo-500/20" />
      <div className="ambient-liquid-glow -right-32 top-[40%] h-[550px] w-[550px] bg-purple-500/15" />
      <div className="ambient-liquid-glow bg-emerald-500/12 bottom-12 left-[25%] h-[600px] w-[600px]" />

      <SiteHeader />

      <main
        ref={containerRef}
        className="relative z-10 mx-auto max-w-7xl space-y-6 px-3 py-4 sm:px-6 lg:px-8"
      >
        {/* Page Header */}
        <div className="gsap-ingest">
          <PageHeader
            category="COURSE MATERIALS // DOCUMENT PIPELINE"
            title="Course Notes & Document Ingestion Studio"
            description="Upload lecture slides, textbooks, and syllabus PDFs for GPU OCR extraction, vector chunking, and semantic indexation."
            icon={FileText}
            badgeText="Qdrant Vector Engine"
            badgeVariant="indigo"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={loadDocs}
                disabled={fetching}
                className="gap-2 rounded-2xl border-white/20 bg-white/10 text-xs font-bold backdrop-blur-xl hover:bg-white/15 dark:bg-white/5"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", fetching && "animate-spin text-primary")} />
                <span>{fetching ? "Refreshing..." : "Sync Index"}</span>
              </Button>
            }
          />
        </div>

        {/* Telemetry Stats Matrix */}
        <div className="gsap-ingest grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Ingested Course Files"
            numericValue={totalDocs}
            value={totalDocs.toString()}
            icon={FileText}
            colorScheme="primary"
            trend={inFlightDocs > 0 ? `${inFlightDocs} OCR in flight` : "Index Up to Date"}
            trendPositive={inFlightDocs === 0}
            tag="Vector Indexed"
          />

          <StatCard
            label="Indexed Pages"
            numericValue={totalPages}
            value={totalPages.toString()}
            icon={Layers}
            colorScheme="purple"
            trend={
              totalDocs > 0
                ? `${(totalPages / Math.max(1, totalDocs)).toFixed(1)} avg/doc`
                : "0 pages"
            }
            trendPositive
            tag="OCR OCRv2"
          />

          <StatCard
            label="Vector Embeddings"
            numericValue={vectorEstimatedChunks}
            value={vectorEstimatedChunks > 0 ? vectorEstimatedChunks.toLocaleString() : "0"}
            icon={Database}
            colorScheme="emerald"
            trend="Dense Semantic Chunks"
            trendPositive
            tag="bge-large"
          />

          <StatCard
            label="Storage Ingested"
            numericValue={parseFloat(totalMb) || 0}
            value={`${totalMb} MB`}
            icon={Clock}
            colorScheme="amber"
            trend="Encrypted Store"
            trendPositive
            tag="Direct Cloud"
          />
        </div>

        {/* Ingestion Dropzone Studio */}
        <div className="gsap-ingest space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Multi-File Ingestion Pipeline</span>
            </h2>
            <span className="font-mono text-[11px] text-muted-foreground">
              Supported formats: PDF, Slides (PDF)
            </span>
          </div>

          <UploadCard onUploadComplete={loadDocs} />
        </div>

        {/* Vector Document Explorer Matrix */}
        <div className="gsap-ingest space-y-4">
          <div className="flex flex-col justify-between gap-3 border-b border-border/40 pb-3 md:flex-row md:items-center">
            <div>
              <h2 className="flex items-center gap-2 font-mono text-base font-bold uppercase tracking-wider text-foreground sm:text-lg">
                <Database className="h-4 w-4 text-primary" />
                <span>Indexed Vector Knowledge Base ({filteredDocs.length})</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                All indexed course materials ready for Grounded RAG Chat queries and Knowledge Graph
                extraction.
              </p>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 shadow-xs w-48 rounded-xl border border-border/60 bg-muted/40 py-1.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-60"
                />
              </div>

              <div className="flex items-center rounded-xl border border-border/60 bg-muted/40 p-1 text-xs">
                {(["all", "ready", "processing", "failed"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setStatusFilter(mode)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 font-bold capitalize transition-all",
                      statusFilter === mode
                        ? "shadow-xs bg-background text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Documents Grid / Empty State */}
          {fetching ? (
            <Card className="shadow-xs flex flex-col items-center justify-center gap-3 rounded-3xl border-border/80 bg-card/85 p-12 text-center text-xs backdrop-blur-2xl">
              <Clock className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm font-bold text-foreground">
                Synchronizing Vector Documents...
              </span>
              <p className="text-xs text-muted-foreground">
                Checking live Qdrant collection embeddings and OCR jobs.
              </p>
            </Card>
          ) : filteredDocs.length === 0 ? (
            <Card className="flex flex-col items-center justify-center gap-3 rounded-3xl border-border/80 bg-card/60 p-12 text-center text-xs backdrop-blur-xl">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <span className="text-sm font-bold text-foreground">No documents found</span>
              <p className="max-w-sm text-xs text-muted-foreground">
                {searchQuery
                  ? "No results match your search query."
                  : "Upload course PDF notes or syllabus files above to begin vector indexing."}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocs.map((d) => {
                const isReady = d.status === "ocr_complete" || d.status === "indexed";
                const isFailed = d.status === "failed";
                const sizeStr = ((d.size_bytes || 0) / (1024 * 1024)).toFixed(2);

                return (
                  <div
                    key={d.id}
                    className="bento-card shadow-xs group flex flex-col justify-between space-y-3 rounded-2xl border border-border/80 bg-card/85 p-4 backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="bento-icon-bounce shrink-0 rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4
                            className="truncate text-xs font-bold text-foreground"
                            title={d.filename}
                          >
                            {d.filename}
                          </h4>
                          <p className="flex items-center gap-2 pt-0.5 font-mono text-[10px] text-muted-foreground">
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
                          "shrink-0 rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
                          isReady
                            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                            : isFailed
                              ? "border border-rose-500/20 bg-rose-500/10 text-rose-500"
                              : "animate-pulse border border-amber-500/20 bg-amber-500/10 text-amber-500",
                        )}
                      >
                        {d.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 border-t border-border/40 pt-2">
                      <div className="flex items-center gap-1.5">
                        {isReady && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/chat?q=Explain%20key%20concepts%20from%20${encodeURIComponent(d.filename)}`,
                                )
                              }
                              className="h-7 gap-1 rounded-lg border-primary/30 px-2.5 text-[11px] font-bold text-primary hover:bg-primary/10"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Ask RAG</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingDoc(d)}
                              className="h-7 rounded-lg px-2 text-[11px] text-muted-foreground hover:text-foreground"
                              title="Inspect OCR text"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {(isFailed || isReady) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReprocess(d)}
                            className="h-7 rounded-lg px-2 text-[11px] text-muted-foreground hover:text-foreground"
                            title="Reprocess OCR & Vectors"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingDeleteId(d.id)}
                        className="h-7 rounded-lg px-2 text-[11px] text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-500"
                        title="Delete document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent className="rounded-3xl border-border/80 bg-card/95 backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Remove Document from Vector Index?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will delete the document, its extracted OCR text, and all associated dense vector
              embeddings from Qdrant. Grounded RAG Chat answers will no longer reference this
              document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
            >
              Delete from Index
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pages OCR Viewer Modal */}
      <PagesViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </div>
  );
}
