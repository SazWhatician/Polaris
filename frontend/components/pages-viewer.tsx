"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listPages, type DocumentResponse, type PageItem } from "@/lib/api/documents";

interface Props {
  doc: DocumentResponse | null;
  onClose: () => void;
}

export function PagesViewer({ doc, onClose }: Props) {
  const [pages, setPages] = useState<PageItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doc) {
      setPages(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const items = await listPages(doc.id);
        if (!cancelled) setPages(items);
      } catch (e) {
        toast.error("Failed to load pages", {
          description: e instanceof Error ? e.message : String(e),
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc]);

  return (
    <Dialog open={doc !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">{doc?.filename}</DialogTitle>
          <DialogDescription>
            {pages
              ? `${pages.length} page${pages.length === 1 ? "" : "s"} · OCR engine: ${pages[0]?.ocr_engine ?? "—"}`
              : "Loading pages…"}
          </DialogDescription>
        </DialogHeader>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {pages && pages.length === 0 && (
          <p className="text-sm text-muted-foreground">No pages extracted yet.</p>
        )}
        {pages && pages.length > 0 && (
          <div className="space-y-4">
            {pages.map((p) => (
              <div key={p.page_number} className="rounded-md border bg-muted/30 p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Page {p.page_number}</span>
                  <span>confidence {(p.confidence * 100).toFixed(1)}%</span>
                </div>
                <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                  {p.text || "(empty)"}
                </pre>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
