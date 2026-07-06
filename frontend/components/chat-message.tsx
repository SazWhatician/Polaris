"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Citation } from "@/lib/api/chat";

interface Props {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  streaming?: boolean;
}

export function ChatMessage({ role, content, citations, streaming }: Props) {
  const [openCitation, setOpenCitation] = useState<Citation | null>(null);

  return (
    <div
      className={cn(
        "flex w-full",
        role === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 text-sm",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        <div className="whitespace-pre-wrap break-words">
          {content}
          {streaming && (
            <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-current align-middle" />
          )}
        </div>

        {citations && citations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-current/10 pt-2">
            {citations.map((c, i) => (
              <button
                key={`${c.document_id}-${c.page_number}-${c.chunk_index}`}
                onClick={() => setOpenCitation(c)}
                className="cursor-pointer"
                type="button"
                aria-label={`Open citation ${i + 1}`}
              >
                <Badge variant="outline" className="hover:bg-background/50">
                  #{i + 1} · {c.document_filename}, p.{c.page_number}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={openCitation !== null} onOpenChange={(o) => !o && setOpenCitation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="truncate">
              {openCitation?.document_filename}
            </DialogTitle>
            <DialogDescription>
              Page {openCitation?.page_number} · similarity{" "}
              {openCitation ? (openCitation.score * 100).toFixed(1) : ""}%
            </DialogDescription>
          </DialogHeader>
          <pre className="whitespace-pre-wrap break-words rounded-md bg-muted/40 p-3 font-mono text-sm">
            {openCitation?.text}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
