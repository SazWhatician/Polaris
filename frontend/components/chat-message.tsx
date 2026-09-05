"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import Image from "next/image";
import {
  Sparkles,
  Copy,
  Check,
  FileText,
  User,
  ChevronRight,
  Volume2,
  VolumeX,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import katex from "katex";

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
  if (cleaned) return cleaned;

  if (raw.includes("<think>") && !raw.includes("</think>")) {
    return "";
  }

  return raw.trim();
}

/**
 * Strip markdown and LaTeX notation for clean, natural speech pronunciation
 */
function getSpokenText(markdown: string): string {
  return markdown
    .replace(/<[^>]+>/g, "")
    .replace(/\$\$[\s\S]*?\$\$/g, " mathematical equation ")
    .replace(/\$([^\$]+)\$/g, "$1")
    .replace(/\[#?\s*\d+\]/g, "")
    .replace(/[*#`_~]/g, "")
    .replace(/[-*+]\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize Greek and common math symbols to standard LaTeX commands
 */
function normalizeMathToLatex(mathStr: string): string {
  return mathStr
    // Normalize Unicode non-breaking spaces and narrow spaces to standard spaces
    .replace(/[\u00A0\u202F\u2007\u200B]/g, " ")
    .replace(/Δ/g, "\\Delta ")
    .replace(/δ/g, "\\delta ")
    .replace(/α/g, "\\alpha ")
    .replace(/β/g, "\\beta ")
    .replace(/γ/g, "\\gamma ")
    .replace(/θ/g, "\\theta ")
    .replace(/λ/g, "\\lambda ")
    .replace(/μ/g, "\\mu ")
    .replace(/σ/g, "\\sigma ")
    .replace(/π/g, "\\pi ")
    .replace(/ω/g, "\\omega ")
    .replace(/ε/g, "\\epsilon ")
    .replace(/∇/g, "\\nabla ")
    .replace(/∂/g, "\\partial ")
    .replace(/∑/g, "\\sum ")
    .replace(/∫/g, "\\int ")
    .replace(/≠/g, "\\neq ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/±/g, "\\pm ")
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ")
    .replace(/→/g, "\\to ");
}

/**
 * Render LaTeX math string with KaTeX safely
 */
function renderKatexHtml(math: string, displayMode: boolean = false): string {
  try {
    const normalized = normalizeMathToLatex(math.trim());
    return katex.renderToString(normalized, {
      displayMode,
      throwOnError: false,
      output: "htmlAndMathml",
    });
  } catch {
    return math;
  }
}

/**
 * Helper to check if backtick content represents a mathematical formula
 */
function isMathExpression(str: string): boolean {
  return (
    str.includes("=") ||
    str.includes("\\") ||
    str.includes("Δ") ||
    str.includes("δ") ||
    str.includes("α") ||
    str.includes("β") ||
    str.includes("σ") ||
    str.includes("λ") ||
    str.includes("+") ||
    str.includes("-") ||
    str.includes("*") ||
    str.includes("/") ||
    str.includes("^") ||
    str.includes("_")
  );
}

/**
 * Dedicated Interactive Formula Display Card with Double-Bezel Hardware Architecture
 */
function MathBlock({ math }: { math: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyMath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(math);
    setCopied(true);
    toast.success("LaTeX formula copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-5 p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/30 via-purple-500/25 to-sky-500/30 dark:from-indigo-500/40 dark:via-purple-500/25 dark:to-sky-500/30 shadow-[0_8px_30px_-8px_rgba(99,102,241,0.12)] transition-all hover:shadow-[0_8px_36px_-6px_rgba(99,102,241,0.22)]">
      <div className="rounded-[calc(1rem-1px)] bg-gradient-to-b from-indigo-50/50 via-white/90 to-purple-50/30 dark:from-zinc-900/90 dark:via-zinc-950/95 dark:to-indigo-950/30 backdrop-blur-xl p-4 sm:p-5 relative overflow-hidden">
        {/* Subtle ambient light gradient in the corner */}
        <div className="pointer-events-none absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-2xl" />

        {/* Top Bar with Equation Tag & Copy LaTeX Button */}
        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-indigo-500/10 dark:border-white/[0.06] text-[10px] font-mono select-none">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold tracking-wider uppercase text-[9px]">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Formal Mathematical Model
          </span>
          <button
            type="button"
            onClick={handleCopyMath}
            className="opacity-80 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-foreground bg-white/60 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 border border-indigo-500/15 shadow-2xs"
            title="Copy raw LaTeX formula"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 font-sans font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="font-sans">Copy LaTeX</span>
              </>
            )}
          </button>
        </div>

        {/* Rendered Math Formula with KaTeX */}
        <div
          className="overflow-x-auto py-3 text-center text-slate-900 dark:text-zinc-100 text-sm sm:text-base leading-relaxed tracking-wide select-text font-serif"
          dangerouslySetInnerHTML={{ __html: renderKatexHtml(math, true) }}
        />
      </div>
    </div>
  );
}

/**
 * Concept & Definition Callout Box with Luxury Academic Styling
 */
function ConceptCard({
  title,
  content,
  citations,
  onCitationClick,
}: {
  title: string;
  content: string;
  citations?: Citation[];
  onCitationClick: (c: Citation) => void;
}) {
  return (
    <div className="relative group my-4 p-[1.5px] rounded-2xl bg-gradient-to-br from-indigo-500/35 via-purple-500/20 to-sky-500/20 dark:from-indigo-500/40 dark:via-purple-500/25 dark:to-white/10 shadow-sm">
      <div className="rounded-[calc(1rem-1.5px)] bg-gradient-to-br from-indigo-50/50 via-white/80 to-purple-50/20 dark:from-indigo-950/30 dark:via-zinc-950/70 dark:to-purple-950/20 backdrop-blur-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2 select-none">
          <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <BookOpen className="w-3.5 h-3.5" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-indigo-600 dark:text-indigo-400">
            {title}
          </span>
        </div>
        <div className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-zinc-200 font-normal">
          {renderInlineContent(content, citations, onCitationClick)}
        </div>
      </div>
    </div>
  );
}

/**
 * Equation Variable Breakdown / Legend Guide
 */
function EquationLegend({
  content,
  citations,
  onCitationClick,
}: {
  content: string;
  citations?: Citation[];
  onCitationClick: (c: Citation) => void;
}) {
  return (
    <div className="my-2.5 px-3.5 py-2.5 rounded-xl bg-indigo-500/[0.04] dark:bg-indigo-500/[0.07] border border-indigo-500/15 dark:border-indigo-500/20 text-xs sm:text-[13px] text-slate-700 dark:text-zinc-300 leading-relaxed flex items-start gap-2.5">
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mt-0.5 select-none shrink-0 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
        Where
      </span>
      <div className="flex-1">
        {renderInlineContent(content, citations, onCitationClick)}
      </div>
    </div>
  );
}

/**
 * Render inline text with LaTeX ($...$), citations ([#1]), backticks (`...`), bold (**...**), and italics (*...*)
 */
function renderInlineContent(
  text: string,
  citations?: Citation[],
  onCitationClick?: (citation: Citation) => void
): ReactNode[] {
  // Master regex pattern for:
  // 1. Block Math: $$...$$
  // 2. Inline Math: $...$
  // 3. Citations: [#N] or [N]
  // 4. Inline Code / Math in backticks: `...`
  // 1. Block Math: $$...$$ or \[...\]
  // 2. Inline Math: $...$ or \(...\)
  // 3. Citations: [#N] or [N]
  // 4. Inline Code / Math in backticks: `...`
  // 5. Bold: **...**
  // 6. Italic: *...*
  const pattern = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([^\)\n]+?\\\)|\^|\[#?\s*\d+\]|`[^`\n]+`|\*\*[^\*\n]+?\*\*|\*[^\*\n]+?\*)/g;

  const parts = text.split(pattern);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. Block Math $$...$$ or \[...\]
    if (
      (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) ||
      (part.startsWith("\\[") && part.endsWith("\\]") && part.length > 4)
    ) {
      const math = part.slice(2, -2);
      return <MathBlock key={`block-math-${index}`} math={math} />;
    }

    // 2. Inline Math $...$ or \(...\)
    if (
      (part.startsWith("$") && part.endsWith("$") && part.length > 2) ||
      (part.startsWith("\\(") && part.endsWith("\\)") && part.length > 4)
    ) {
      const math = part.startsWith("$") ? part.slice(1, -1) : part.slice(2, -2);
      return (
        <span
          key={`inline-math-${index}`}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-indigo-500/[0.08] dark:bg-indigo-400/[0.14] border border-indigo-500/25 dark:border-indigo-400/30 text-indigo-950 dark:text-indigo-200 text-[13px] sm:text-[13.5px] leading-tight align-baseline font-serif shadow-2xs select-text hover:bg-indigo-500/15 dark:hover:bg-indigo-400/20 transition-colors cursor-default"
          dangerouslySetInnerHTML={{ __html: renderKatexHtml(math, false) }}
        />
      );
    }

    // 3. Citation tag [#N]
    const citeMatch = part.match(/\[#?\s*(\d+)\]/);
    if (citeMatch && citeMatch[1]) {
      const citeNum = parseInt(citeMatch[1], 10);
      const targetCitation =
        citations && citations[citeNum - 1]
          ? citations[citeNum - 1]
          : citations?.find((c, idx) => idx + 1 === citeNum || c.chunk_index + 1 === citeNum);

      return (
        <button
          key={`cite-${index}`}
          type="button"
          onClick={() => targetCitation && onCitationClick?.(targetCitation)}
          className={`inline-flex items-center gap-0.5 mx-0.5 px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold transition-all align-baseline ${
            targetCitation
              ? "bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-primary/15 dark:from-purple-500/25 dark:via-indigo-500/25 dark:to-primary/25 text-purple-600 dark:text-purple-300 hover:from-purple-500/30 hover:to-primary/30 border border-purple-500/30 hover:border-purple-500/50 hover:scale-105 active:scale-95 cursor-pointer shadow-2xs hover:shadow-[0_0_8px_rgba(168,85,247,0.4)]"
              : "bg-muted text-muted-foreground border border-border/40 cursor-default"
          }`}
          title={
            targetCitation
              ? `Source #${citeNum}: ${targetCitation.document_filename} (p. ${targetCitation.page_number})`
              : `Citation #${citeNum}`
          }
        >
          <span className="text-[8px] opacity-70">#</span>
          <span>{citeNum}</span>
        </button>
      );
    }

    // 4. Backticks `...` (Render as KaTeX formula if math symbols exist, else inline code)
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      const inner = part.slice(1, -1);
      if (isMathExpression(inner)) {
        return (
          <span
            key={`math-backtick-${index}`}
            className="inline-block px-1.5 py-0.5 rounded-md bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-foreground font-mono text-xs shadow-2xs"
            dangerouslySetInnerHTML={{ __html: renderKatexHtml(inner, false) }}
          />
        );
      }
      return (
        <code
          key={`code-${index}`}
          className="px-1.5 py-0.5 rounded-md bg-muted/80 text-foreground font-mono text-[11px] border border-border/60"
        >
          {inner}
        </code>
      );
    }

    // 5. Bold **...**
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={`bold-${index}`} className="font-semibold text-foreground tracking-tight">
          {renderInlineContent(inner, citations, onCitationClick)}
        </strong>
      );
    }

    // 6. Italic *...*
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={`italic-${index}`} className="italic text-foreground/90">
          {renderInlineContent(inner, citations, onCitationClick)}
        </em>
      );
    }

    // Standard raw text
    return part;
  });
}

/**
 * Structured Markdown & LaTeX Parser Component
 */
function MarkdownAnswerView({
  content,
  citations,
  onCitationClick,
}: {
  content: string;
  citations?: Citation[];
  onCitationClick: (citation: Citation) => void;
}) {
  const renderedBlocks = useMemo(() => {
    if (!content) return null;

    const lines = content.split("\n");
    const blocks: ReactNode[] = [];
    let listBuffer: { items: { text: string; isSub: boolean }[] } | null = null;
    let codeBuffer: { lang: string; lines: string[] } | null = null;
    let mathBuffer: string[] | null = null;

    const flushList = () => {
      if (!listBuffer || listBuffer.items.length === 0) {
        listBuffer = null;
        return;
      }
      blocks.push(
        <ul
          key={`ul-${blocks.length}`}
          className="my-3 space-y-2 text-xs sm:text-sm text-slate-800 dark:text-zinc-200"
        >
          {listBuffer.items.map((item, i) => {
            const kvMatch = item.text.match(/^\*\*([^*]+)\*\*[:\s]+(.*)/);
            return (
              <li
                key={i}
                className={`leading-relaxed flex items-start gap-2.5 ${
                  item.isSub
                    ? "ml-5 pl-3.5 border-l-2 border-indigo-500/20 dark:border-indigo-400/25 text-slate-700 dark:text-zinc-300 py-0.5"
                    : "pl-0.5 py-0.5"
                }`}
              >
                <span
                  className={`inline-block mt-2 flex-shrink-0 ${
                    item.isSub
                      ? "w-1.5 h-1.5 rounded-xs rotate-45 bg-indigo-400/70"
                      : "w-2 h-2 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                  }`}
                />
                <div className="flex-1">
                  {kvMatch ? (
                    <div>
                      <span className="font-semibold text-foreground tracking-tight">
                        {kvMatch[1]}:
                      </span>{" "}
                      <span className="text-slate-800 dark:text-zinc-200">
                        {renderInlineContent(kvMatch[2] || "", citations, onCitationClick)}
                      </span>
                    </div>
                  ) : (
                    renderInlineContent(item.text, citations, onCitationClick)
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      );
      listBuffer = null;
    };

    const flushCode = () => {
      if (!codeBuffer) return;
      const codeText = codeBuffer.lines.join("\n");
      blocks.push(
        <div
          key={`code-block-${blocks.length}`}
          className="my-3 rounded-xl overflow-hidden border border-border/70 bg-zinc-950 text-zinc-100 shadow-md font-mono text-xs"
        >
          {codeBuffer.lang && (
            <div className="px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              {codeBuffer.lang}
            </div>
          )}
          <pre className="p-3.5 overflow-x-auto text-xs leading-relaxed text-zinc-200">
            <code>{codeText}</code>
          </pre>
        </div>
      );
      codeBuffer = null;
    };

    const flushMath = () => {
      if (!mathBuffer) return;
      const mathContent = mathBuffer.join("\n").trim();
      if (mathContent) {
        blocks.push(
          <MathBlock key={`block-math-${blocks.length}`} math={mathContent} />
        );
      }
      mathBuffer = null;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      const trimmed = line.trim();

      // 1. Inside multiline code block ```
      if (codeBuffer) {
        if (trimmed.startsWith("```")) {
          flushCode();
        } else {
          codeBuffer.lines.push(line);
        }
        continue;
      }

      // 2. Inside multiline math block $$ or \[
      if (mathBuffer) {
        if (trimmed.endsWith("$$") || trimmed === "$$" || trimmed.endsWith("\\]") || trimmed === "\\]") {
          const remaining = trimmed.replace(/(\$\$|\\\])\s*$/, "").trim();
          if (remaining) mathBuffer.push(remaining);
          flushMath();
        } else {
          mathBuffer.push(line);
        }
        continue;
      }

      // 3. Start of code block ```
      if (trimmed.startsWith("```")) {
        flushList();
        flushMath();
        const lang = trimmed.slice(3).trim();
        codeBuffer = { lang, lines: [] };
        continue;
      }

      // 4. Block math $$...$$ or \[...\]
      if (trimmed.startsWith("$$") || trimmed.startsWith("\\[")) {
        flushList();
        const isBracket = trimmed.startsWith("\\[");
        const closingTag = isBracket ? "\\]" : "$$";
        // Check if it closes on the same line and has content inside
        if (trimmed.endsWith(closingTag) && trimmed.length > 4) {
          const mathContent = trimmed.slice(2, -2).trim();
          blocks.push(
            <MathBlock key={`block-math-${blocks.length}`} math={mathContent} />
          );
          continue;
        }
        // Multiline math block begins
        mathBuffer = [];
        const afterStart = trimmed.slice(2).trim();
        if (afterStart) mathBuffer.push(afterStart);
        continue;
      }

      // 5. Empty line
      if (!trimmed) {
        flushList();
        continue;
      }

      // 6. Horizontal divider (---, ___, ***)
      if (/^(\-{3,}|\_{3,}|\*{3,})$/.test(trimmed)) {
        flushList();
        blocks.push(
          <div key={`hr-${blocks.length}`} className="my-6 flex items-center gap-3 select-none">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/70 to-border/20" />
            <span className="text-[9px] uppercase font-mono tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
              <Sparkles className="w-2.5 h-2.5 text-primary" />
              Polaris Synthesis
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-border/20 via-border/70 to-transparent" />
          </div>
        );
        continue;
      }

      // 7. Headings
      if (trimmed.startsWith("### ")) {
        flushList();
        blocks.push(
          <h3
            key={`h3-${i}`}
            className="text-sm sm:text-base font-bold text-foreground mt-4.5 mb-2 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary/80 flex-shrink-0" />
            <span>{renderInlineContent(trimmed.slice(4), citations, onCitationClick)}</span>
          </h3>
        );
        continue;
      }
      if (trimmed.startsWith("## ")) {
        flushList();
        blocks.push(
          <h2
            key={`h2-${i}`}
            className="text-base sm:text-lg font-black tracking-tight text-foreground mt-6 mb-3 pb-2.5 border-b border-border/50 flex items-center gap-2.5"
          >
            <span className="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-primary via-purple-500 to-indigo-500 shadow-xs flex-shrink-0" />
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text">
              {renderInlineContent(trimmed.slice(3), citations, onCitationClick)}
            </span>
          </h2>
        );
        continue;
      }
      if (trimmed.startsWith("# ")) {
        flushList();
        blocks.push(
          <h1
            key={`h1-${i}`}
            className="text-lg sm:text-xl font-black text-foreground mt-6 mb-3 pb-2.5 border-b border-border/60 flex items-center gap-2.5"
          >
            <span className="w-2 h-5.5 rounded-full bg-gradient-to-b from-primary to-purple-600 shadow-xs flex-shrink-0" />
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text">
              {renderInlineContent(trimmed.slice(2), citations, onCitationClick)}
            </span>
          </h1>
        );
        continue;
      }

      // 8. Concept / Definition Callout Detection
      // Matches **Definition**, **Key Concept**, **Theorem**, **Intuition**, etc.
      const conceptMatch = trimmed.match(/^\*\*(Definition|Key Concept|Theorem|Core Principle|Intuition|Takeaway|Summary|Overview)\*\*[:\s]*(.*)/i);
      if (conceptMatch && conceptMatch[1]) {
        flushList();
        const conceptType = conceptMatch[1];
        let conceptBody = conceptMatch[2]?.trim() || "";

        // If body is empty on this line, grab the next non-empty line
        if (!conceptBody && i + 1 < lines.length) {
          const nextTrimmed = lines[i + 1]?.trim() || "";
          if (nextTrimmed && !nextTrimmed.startsWith("#") && !nextTrimmed.startsWith("-") && !nextTrimmed.startsWith("$$")) {
            conceptBody = nextTrimmed;
            i++; // consume next line
          }
        }

        blocks.push(
          <ConceptCard
            key={`concept-${i}`}
            title={conceptType}
            content={conceptBody}
            citations={citations}
            onCitationClick={onCitationClick}
          />
        );
        continue;
      }

      // 9. Where / Equation Legend Detection
      if (/^where\s+/i.test(trimmed)) {
        flushList();
        const whereContent = trimmed.replace(/^where\s+/i, "").trim();
        blocks.push(
          <EquationLegend
            key={`legend-${i}`}
            content={whereContent}
            citations={citations}
            onCitationClick={onCitationClick}
          />
        );
        continue;
      }

      // 10. Standalone Bold Subsection Heading (e.g., **Key Characteristics**)
      const standaloneHeadingMatch = trimmed.match(/^\*\*([^*]+)\*\*$/);
      if (standaloneHeadingMatch && standaloneHeadingMatch[1]) {
        flushList();
        blocks.push(
          <div key={`subhead-${i}`} className="mt-5 mb-2.5 flex items-center gap-2 select-none">
            <span className="w-1.5 h-3.5 rounded-full bg-indigo-500/80 shadow-xs" />
            <span className="text-xs sm:text-[13px] font-bold tracking-tight text-foreground font-sans">
              {standaloneHeadingMatch[1]}
            </span>
          </div>
        );
        continue;
      }

      // 11. Bullet list items (including indented sub-items)
      const bulletMatch = line.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.*)/);
      if (bulletMatch && bulletMatch[1] !== undefined && bulletMatch[2] !== undefined) {
        const indent = bulletMatch[1].length;
        const text = bulletMatch[2];
        const isSub = indent >= 2;
        if (!listBuffer) {
          listBuffer = { items: [] };
        }
        listBuffer.items.push({ text, isSub });
        continue;
      }

      // 12. Continuous indented text under a bullet item
      if (listBuffer && (line.startsWith("  ") || line.startsWith("\t"))) {
        const lastItem = listBuffer.items[listBuffer.items.length - 1];
        if (lastItem) {
          lastItem.text += " " + trimmed;
          continue;
        }
      }

      // 13. Standard Paragraph
      flushList();
      blocks.push(
        <p
          key={`p-${i}`}
          className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-zinc-200 my-2"
        >
          {renderInlineContent(line, citations, onCitationClick)}
        </p>
      );
    }

    flushList();
    flushCode();
    flushMath();

    return blocks;
  }, [content, citations, onCitationClick]);

  return <div className="space-y-1">{renderedBlocks}</div>;
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
  const [speaking, setSpeaking] = useState(false);

  const cleaned = role === "assistant" ? cleanModelAnswer(content) : content;
  const displayAnswer = !streaming && !cleaned && content ? content.trim() : cleaned;
  const isThinking = role === "assistant" && streaming && !displayAnswer;

  // Cleanup speech synthesis if component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Answer copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported on this device");
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const spokenText = getSpokenText(displayAnswer);
    if (!spokenText) return;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  // --- USER MESSAGE BUBBLE ---
  if (role === "user") {
    return (
      <div className="flex w-full justify-end items-end gap-2.5 my-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col items-end max-w-[84%] sm:max-w-[72%]">
          <div className="relative px-4.5 py-3 rounded-2xl rounded-br-xs bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-lg shadow-indigo-500/15 border border-indigo-400/30 text-xs sm:text-sm leading-relaxed font-normal break-words selection:bg-white/30 selection:text-white">
            <div className="whitespace-pre-wrap">{content}</div>
          </div>

          {timestamp && (
            <span className="text-[10px] font-mono text-muted-foreground/70 mt-1 mr-1">
              {timestamp}
            </span>
          )}
        </div>

        <div className="w-7 h-7 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0 mb-4 shadow-xs">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  // --- ASSISTANT MESSAGE BUBBLE (Double-Bezel Hardware Architecture) ---
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

      {/* Assistant Outer Bezel */}
      <div className="flex flex-col max-w-[94%] sm:max-w-[86%] w-full space-y-2">
        <div className="relative p-[1.5px] rounded-3xl rounded-tl-sm bg-gradient-to-b from-indigo-500/25 via-border/60 to-border/20 dark:from-indigo-500/35 dark:via-white/10 dark:to-white/5 shadow-2xl shadow-indigo-950/15">
          {/* Assistant Inner Card */}
          <div className="rounded-[calc(1.5rem-1.5px)] rounded-tl-none bg-white/[0.97] dark:bg-zinc-950/[0.94] backdrop-blur-2xl p-5 sm:p-6 text-slate-900 dark:text-zinc-100 relative overflow-hidden">
            {/* Ambient soft glow aura in top-right corner */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />

            {/* Header Row: Bot Identity + Model Tag + Audio + Copy */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/70 dark:border-white/[0.08] text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs tracking-wide bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-primary inline" />
                  POLARIS ACADEMIC RAG
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Grounding Verified</span>
                </span>
                <span className="hidden sm:inline text-[10px] text-muted-foreground font-mono">
                  {modelName}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {timestamp && (
                  <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline mr-1">
                    {timestamp}
                  </span>
                )}

                {/* Read Aloud (TTS) Button */}
                {displayAnswer && !isThinking && (
                  <button
                    type="button"
                    onClick={toggleSpeech}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      speaking
                        ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40 animate-pulse"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border-transparent"
                    }`}
                    title={speaking ? "Stop reading aloud" : "Read answer aloud"}
                  >
                    {speaking ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Copy Answer Button */}
                {displayAnswer && !isThinking && (
                  <button
                    type="button"
                    onClick={() => handleCopy(displayAnswer)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors border border-transparent"
                    title="Copy full synthesis"
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
              <div className="py-4 px-1 flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
                    Synthesizing response from indexed course documents...
                  </span>
                </div>
                <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-gradient-to-r from-primary via-purple-500 to-cyan-400 rounded-full animate-pulse" />
                </div>
              </div>
            ) : (
              /* Rich Formatted Markdown + LaTeX + Citations View */
              <div className="leading-relaxed">
                <MarkdownAnswerView
                  content={displayAnswer}
                  citations={citations}
                  onCitationClick={(c) => setOpenCitation(c)}
                />
                {streaming && (
                  <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary animate-pulse align-middle" />
                )}
              </div>
            )}

            {/* Citations & Evidence Pill Badges Footer */}
            {citations && citations.length > 0 && !isThinking && (
              <div className="mt-5 pt-3.5 border-t border-slate-200/70 dark:border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between text-[10px] font-mono tracking-wider uppercase text-muted-foreground">
                  <span className="flex items-center gap-1.5 text-primary font-bold">
                    <FileText className="w-3.5 h-3.5" />
                    Grounded Course Evidence ({citations.length} sources)
                  </span>
                  <span className="text-[9px]">Click badge to inspect page chunk</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-0.5">
                  {citations.map((c, i) => (
                    <button
                      key={`${c.document_id}-${c.page_number}-${c.chunk_index}`}
                      onClick={() => setOpenCitation(c)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono bg-white/60 dark:bg-zinc-900/80 hover:bg-primary/10 text-foreground hover:text-primary border border-slate-200/80 dark:border-white/10 hover:border-primary/40 transition-all cursor-pointer group shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                      type="button"
                      title={`Inspect citation from ${c.document_filename}, page ${c.page_number}`}
                    >
                      <span className="w-5 h-5 rounded-md bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px]">
                        #{i + 1}
                      </span>
                      <span className="font-medium truncate max-w-[130px] sm:max-w-[170px]">
                        {c.document_filename}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                        p.{c.page_number}
                      </span>
                      {c.score > 0 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                          {(c.score * 100).toFixed(0)}% match
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Citation Preview Modal Dialog */}
      <Dialog open={openCitation !== null} onOpenChange={(o) => !o && setOpenCitation(null)}>
        <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-2xl border-border/80 text-foreground">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase font-bold">
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
