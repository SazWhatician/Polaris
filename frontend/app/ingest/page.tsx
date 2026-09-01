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
const IN_FLIGHT_STATES = new Set(["queued", "processing"]);

export default function IngestPage() {
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
    <div className="relative min-h-screen text-foreground pb-32 pt-14 sm:pt-16 overflow-x-hidden selection:bg-primary/30 selection:text-foreground">
      {/* ── Ambient Fluid Liquid Caustic Spheres (iOS/visionOS Glass Glow) ── */}
      <div className="ambient-liquid-glow -top-24 -left-24 w-[500px] h-[500px] bg-indigo-500/20" />
      <div className="ambient-liquid-glow top-[40%] -right-32 w-[550px] h-[550px] bg-purple-500/15" />
      <div className="ambient-liquid-glow bottom-12 left-[25%] w-[600px] h-[600px] bg-emerald-500/12" />

      <SiteHeader />

      <main ref={containerRef} className="relative z-10 max-w-7xl mx-auto space-y-6 py-4 px-3 sm:px-6 lg:px-8">
        
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
                className="gap-2 text-xs font-bold rounded-2xl border-white/20 bg-white/10 dark:bg-white/5 hover:bg-white/15 backdrop-blur-xl"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", fetching && "animate-spin text-primary")} />
                <span>{fetching ? "Refreshing..." : "Sync Index"}</span>
              </Button>
            }
          />
        </div>

        {/* Telemetry Stats Matrix */}
        <div className="gsap-ingest grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
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
            trend={totalDocs > 0 ? `${(totalPages / Math.max(1, totalDocs)).toFixed(1)} avg/doc` : "0 pages"}
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
            <h2 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Multi-File Ingestion Pipeline</span>
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">Supported formats: PDF, Slides (PDF)</span>
          </div>

          <UploadCard onUploadComplete={loadDocs} />
        </div>

        {/* Vector Document Explorer Matrix */}
        <div className="gsap-ingest space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/40 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                <Database className="h-4 w-4 text-primary" />
                <span>Indexed Vector Knowledge Base ({filteredDocs.length})</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                All indexed course materials ready for Grounded RAG Chat queries and Knowledge Graph extraction.
              </p>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 pr-3 py-1.5 text-xs rounded-xl bg-muted/40 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-60 shadow-xs"
                />
              </div>

              <div className="flex items-center p-1 rounded-xl bg-muted/40 border border-border/60 text-xs">
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
            <Card className="p-12 text-center text-xs flex flex-col items-center justify-center gap-3 bg-card/85 backdrop-blur-2xl border-border/80 rounded-3xl shadow-xs">
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
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : isFailed
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
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
                        className="h-7 px-2 rounded-lg text-[11px] text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/10"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-border/80 bg-card/95 backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Remove Document from Vector Index?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              This will delete the document, its extracted OCR text, and all associated dense vector embeddings from Qdrant. Grounded RAG Chat answers will no longer reference this document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
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
