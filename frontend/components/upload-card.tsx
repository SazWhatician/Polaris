"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { uploadDocument, type DocumentResponse } from "@/lib/api/documents";

const ACCEPTED = "application/pdf,image/jpeg,image/png,image/webp";
const MAX_BYTES = 50 * 1024 * 1024;

interface Props {
  onUploaded: (doc: DocumentResponse) => void;
}

export function UploadCard({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const onPick = () => inputRef.current?.click();

  const onFile = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error("File too large", { description: "Limit is 50 MiB." });
      return;
    }
    setBusy(true);
    setProgress(0);
    try {
      const doc = await uploadDocument(file, (pct) => setProgress(Math.round(pct)));
      toast.success("Uploaded", { description: file.name });
      onUploaded(doc);
    } catch (e) {
      toast.error("Upload failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="skeuo-card p-6 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-foreground tracking-wide">Upload a Course Document</h3>
        <p className="text-xs text-muted-foreground mt-1">PDF, JPEG, PNG, WebP — up to 50 MiB. Stored privately.</p>
      </div>

      <div className="flex flex-col gap-3">
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
        <button onClick={onPick} disabled={busy} className="skeuo-button w-fit text-xs px-5 py-2.5 font-bold">
          <Upload className="mr-2 h-4 w-4" />
          {busy ? `Uploading… ${progress ?? 0}%` : "Choose File"}
        </button>
        {busy && progress !== null && (
          <div className="h-2 w-full overflow-hidden skeuo-inset p-0.5">
            <div
              className="h-full bg-indigo-500 rounded transition-all shadow-sm"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
      </div>
    </div>
  );
}
