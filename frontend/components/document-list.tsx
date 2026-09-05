"use client";

import { Eye, FileText, Image as ImageIcon, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PagesViewer } from "@/components/pages-viewer";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deleteDocument,
  reprocessDocument,
  type DocumentResponse,
  type DocumentStatus,
} from "@/lib/api/documents";

interface Props {
  docs: DocumentResponse[];
  onChange: (docs: DocumentResponse[]) => void;
}

export function DocumentList({ docs, onChange }: Props) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<DocumentResponse | null>(null);

  const onConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    const idToDelete = pendingDeleteId;
    const previous = docs;
    onChange(docs.filter((d) => d.id !== idToDelete));
    setPendingDeleteId(null);
    try {
      await deleteDocument(idToDelete);
      toast.success("Deleted");
    } catch (e) {
      onChange(previous);
      toast.error("Delete failed", { description: e instanceof Error ? e.message : String(e) });
    }
  };

  const onReprocess = async (doc: DocumentResponse) => {
    const previous = docs;
    onChange(docs.map((d) => (d.id === doc.id ? { ...d, status: "queued" as const } : d)));
    try {
      const updated = await reprocessDocument(doc.id);
      onChange(previous.map((d) => (d.id === doc.id ? updated : d)));
      toast.success("Reprocessing");
    } catch (e) {
      onChange(previous);
      toast.error("Reprocess failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  if (docs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your documents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No documents yet. Upload one above.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your documents ({docs.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {docs.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <IconForMime mime={d.mime_type} />
                <div className="min-w-0">
                  <div className="truncate font-medium" title={d.filename}>
                    {d.filename}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatBytes(d.size_bytes)} ·{" "}
                    {new Date(d.created_at).toLocaleString()}
                    {d.page_count != null && ` · ${d.page_count} page${d.page_count === 1 ? "" : "s"}`}
                  </div>
                  {d.error && (
                    <div
                      className="mt-1 truncate text-xs text-destructive"
                      title={d.error}
                    >
                      {d.error}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={d.status} />
                {(d.status === "ocr_complete" || d.status === "indexed") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="View extracted text"
                    onClick={() => setViewing(d)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {(d.status === "failed" || d.status === "ocr_complete" || d.status === "indexed") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Reprocess"
                    onClick={() => onReprocess(d)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${d.filename}`}
                  onClick={() => setPendingDeleteId(d.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(o) => !o && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the file from storage and the metadata from your dashboard. It cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PagesViewer doc={viewing} onClose={() => setViewing(null)} />
    </>
  );
}

function IconForMime({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-muted-foreground" />;
  return <FileText className="h-5 w-5 text-muted-foreground" />;
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  if (status === "queued" || status === "processing" || status === "indexing") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        {status}
      </Badge>
    );
  }
  const isComplete = status === "ocr_complete" || status === "indexed";
  const variant: Parameters<typeof Badge>[0]["variant"] =
    status === "failed" ? "destructive" : isComplete ? "default" : "secondary";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MiB`;
}
