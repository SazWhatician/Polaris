"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { uploadDocument, type DocumentResponse } from "@/lib/api/documents";
import { Button } from "@/components/ui/button";

const ACCEPTED = "application/pdf,image/jpeg,image/png,image/webp";
const MAX_BYTES = 500 * 1024 * 1024; // 500 MiB limit

interface Props {
  onUploaded?: (doc: DocumentResponse) => void;
  onUploadComplete?: () => void;
}

export function UploadCard({ onUploaded, onUploadComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const onPick = () => inputRef.current?.click();

  const onFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error("File too large", { description: "Limit is 500 MiB." });
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      const doc = await uploadDocument(file, (pct) => setProgress(Math.round(pct)));
      toast.success("Document uploaded & queued for OCR indexing", { description: file.name });
      if (onUploaded) onUploaded(doc);
      if (onUploadComplete) onUploadComplete();
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void onFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`liquid-glass relative overflow-hidden rounded-3xl p-6 transition-all duration-300 sm:p-7 ${
        dragOver ? "scale-[1.015] border-primary/80 bg-white/10 ring-2 ring-primary/40" : ""
      }`}
    >
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="shadow-xs bento-icon-bounce flex shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 p-3.5 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground sm:text-base">
              Upload Course Materials
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[9px] text-primary">
                PDF & Slides
              </span>
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Drag & drop lecture notes, syllabus or click to browse. Supports PDF, JPEG, PNG up to
              500 MiB.
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-3 sm:w-auto">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />

          <Button
            onClick={onPick}
            disabled={busy}
            className="hover:scale-102 w-full gap-2 rounded-2xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 sm:w-auto"
          >
            <Upload className="h-4 w-4" />
            <span>{busy ? `Uploading… ${progress ?? 0}%` : "Select Document"}</span>
          </Button>
        </div>
      </div>

      {busy && progress !== null && (
        <div className="mt-4 space-y-2 border-t border-border/40 pt-4">
          <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
            <span>OCR Extraction & Vector Chunking</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
