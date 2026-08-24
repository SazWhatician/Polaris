"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Copy,
  Check,
  FileText,
  User,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Citation } from "@/lib/api/chat";

interface Props {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  streaming?: boolean;
  timestamp?: string;
  modelName?: string;
}

/**
 * Filter out internal model monologue / <think> tags / checklists
 * so only the direct, helpful answer is presented to the user.
 */
export function cleanModelAnswer(raw: string): string {
  if (!raw) return "";
  let text = raw;

  // 1. Remove complete <think>...</think> blocks
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // 2. If text still has <think>, check if there is an unclosed tag
  if (text.includes("<think>")) {
    const startIdx = text.indexOf("<think>");
    const endIdx = text.indexOf("</think>");
    if (endIdx !== -1) {
      text = text.slice(0, startIdx) + " " + text.slice(endIdx + 8);
    } else {
      text = text.slice(0, startIdx);
    }
  }

  // 3. Strip rule-checking checklists or meta-evaluation text if emitted
  const ruleCheckKeywords = [
    "Check against rules:",
    "Rules check:",
    "Rule validation:",
    "Verification against rules:",
  ];
  for (const kw of ruleCheckKeywords) {
    const idx = text.indexOf(kw);
    if (idx !== -1) {
      text = text.slice(0, idx);
    }
  }

  const cleaned = text.trim();
  // If cleaned output has text, return it.
  if (cleaned) return cleaned;

  // If streaming and currently inside <think>, return empty to show loader
  if (raw.includes("<think>") && !raw.includes("</think>")) {
    return "";
  }

  // Otherwise return raw trimmed content so answer is never lost
  return raw.trim();
}

export function ChatMessage({
  role,
  content,
  citations,
  streaming,
  timestamp,
  modelName = "Groq Llama-3.1 70B",
}: Props) {
  const [openCitation, setOpenCitation] = useState<Citation | null>(null);
  const [copied, setCopied] = useState(false);

  const cleaned = role === "assistant" ? cleanModelAnswer(content) : content;
  // If stream finished and cleaned is empty, guarantee fallback to raw content
  const displayAnswer = !streaming && !cleaned && content ? content.trim() : cleaned;
  const isThinking = role === "assistant" && streaming && !displayAnswer;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Answer copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // --- USER MESSAGE BUBBLE ---
  if (role === "user") {
    return (
      <div className="flex w-full justify-end items-end gap-2.5 my-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col items-end max-w-[84%] sm:max-w-[72%]">
          {/* User Bubble */}
          <div className="relative px-4.5 py-3 rounded-2xl rounded-br-xs bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-lg shadow-indigo-500/15 border border-indigo-400/30 text-xs sm:text-sm leading-relaxed font-normal break-words selection:bg-white/30 selection:text-white">
            <div className="whitespace-pre-wrap">{content}</div>
          </div>

          {/* User Subtitle Info */}
          {timestamp && (
            <span className="text-[10px] font-mono text-muted-foreground/70 mt-1 mr-1">
              {timestamp}
            </span>
          )}
        </div>

        {/* User Icon Badge */}
        <div className="w-7 h-7 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0 mb-4 shadow-xs">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  // --- ASSISTANT MESSAGE BUBBLE ---
  return (
    <div className="flex w-full justify-start items-start gap-3 my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Bot Standalone Emblem Avatar */}
      <div className="relative w-8 h-8 rounded-xl bg-white/[0.06] dark:bg-white/[0.08] border border-white/20 dark:border-white/15 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md mt-0.5">
        <Image
          src="/polaris-standalone.png"
          alt="Polaris AI"
          width={22}
          height={22}
          className="object-contain"
        />
        {streaming && (
          <span className="absolute inset-0 bg-primary/20 animate-pulse rounded-xl" />
        )}
      </div>

      {/* Assistant Card */}
      <div className="flex flex-col max-w-[92%] sm:max-w-[84%] w-full space-y-2">
        <div className="relative p-4 sm:p-5 rounded-2xl rounded-tl-xs bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl text-slate-900 dark:text-zinc-100">
          
          {/* Header Row: Bot Identity + Model Tag + Copy Button */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/70 dark:border-white/[0.08] text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs tracking-wide bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                POLARIS AI
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Grounded RAG</span>
              </span>
              <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono">
                {modelName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {timestamp && (
                <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
                  {timestamp}
                </span>
              )}
              {displayAnswer && !isThinking && (
                <button
                  type="button"
                  onClick={() => handleCopy(displayAnswer)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  title="Copy answer"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Thinking / Retrieval Animated Loader */}
          {isThinking ? (
            <div className="py-3 px-1 flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                </div>
                <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
                  Analyzing indexed notes & synthesizing answer...
                </span>
              </div>
              <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-gradient-to-r from-primary via-purple-500 to-cyan-400 rounded-full animate-pulse" />
              </div>
            </div>
          ) : (
            /* Answer Text */
            <div className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-zinc-200 whitespace-pre-wrap break-words font-normal">
              {displayAnswer}
              {streaming && (
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Citations & Evidence Pill Badges */}
          {citations && citations.length > 0 && !isThinking && (
            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono tracking-wider uppercase text-muted-foreground">
                <span className="flex items-center gap-1 text-primary font-bold">
                  <FileText className="w-3 h-3" />
                  Verified Citations ({citations.length})
                </span>
                <span className="text-[9px]">Click badge to inspect source</span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {citations.map((c, i) => (
                  <button
                    key={`${c.document_id}-${c.page_number}-${c.chunk_index}`}
                    onClick={() => setOpenCitation(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 hover:border-primary/40 transition-all cursor-pointer group shadow-2xs hover:scale-102"
                    type="button"
                    title={`Inspect citation from ${c.document_filename}, page ${c.page_number}`}
                  >
                    <span className="font-bold text-primary/80">#{i + 1}</span>
                    <span className="font-medium truncate max-w-[140px] sm:max-w-[180px]">
                      {c.document_filename}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-primary/20 text-primary font-semibold">
                      p.{c.page_number}
                    </span>
                    <ChevronRight className="w-3 h-3 text-primary/50 group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Citation Preview Modal Dialog */}
      <Dialog open={openCitation !== null} onOpenChange={(o) => !o && setOpenCitation(null)}>
        <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-2xl border-border/80 text-foreground">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase">
              <FileText className="w-4 h-4" />
              <span>Grounded Document Provenance</span>
            </div>
            <DialogTitle className="text-base font-bold truncate pt-1">
              {openCitation?.document_filename}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono">
              Page {openCitation?.page_number} · Match Similarity:{" "}
              <span className="text-emerald-500 font-bold">
                {openCitation ? (openCitation.score * 100).toFixed(1) : ""}%
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            <p className="text-[11px] font-mono text-muted-foreground uppercase">Extracted Page Chunk Excerpt:</p>
            <div className="max-h-60 overflow-y-auto p-3.5 rounded-xl bg-muted/40 border border-border/60 font-mono text-xs leading-relaxed text-foreground select-text whitespace-pre-wrap">
              {openCitation?.text}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
