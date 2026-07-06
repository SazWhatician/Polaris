"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    <Card>
      <CardHeader>
        <CardTitle>Upload a document</CardTitle>
        <CardDescription>PDF, JPEG, PNG, WebP — up to 50 MiB. Stored privately.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
        />
        <Button onClick={onPick} disabled={busy} className="w-fit">
          <Upload className="mr-2 h-4 w-4" />
          {busy ? `Uploading… ${progress ?? 0}%` : "Choose file"}
        </Button>
        {busy && progress !== null && (
          <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
