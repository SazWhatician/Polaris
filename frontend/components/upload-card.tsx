"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { uploadDocument, type DocumentResponse } from "@/lib/api/documents";
import { Card } from "@/components/ui/card";
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
      className={`relative p-6 sm:p-7 rounded-3xl liquid-glass transition-all duration-300 overflow-hidden ${
        dragOver ? "border-primary/80 ring-2 ring-primary/40 scale-[1.015] bg-white/10" : ""
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4 text-left">
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs shrink-0 bento-icon-bounce">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              Upload Course Materials
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                PDF & Slides
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Drag & drop lecture notes, syllabus or click to browse. Supports PDF, JPEG, PNG up to 500 MiB.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
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
            className="w-full sm:w-auto text-xs font-bold px-6 py-2.5 rounded-2xl shadow-md gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-102"
          >
            <Upload className="h-4 w-4" />
            <span>{busy ? `Uploading… ${progress ?? 0}%` : "Select Document"}</span>
          </Button>
        </div>
      </div>

      {busy && progress !== null && (
        <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span>OCR Extraction & Vector Chunking</span>
            <span className="text-primary font-bold">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
