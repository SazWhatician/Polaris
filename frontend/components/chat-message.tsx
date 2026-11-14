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
  return (
    mathStr
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
      .replace(/→/g, "\\to ")
  );
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
    <div className="group relative my-5 rounded-2xl bg-gradient-to-r from-indigo-500/30 via-purple-500/25 to-sky-500/30 p-[1px] shadow-[0_8px_30px_-8px_rgba(99,102,241,0.12)] transition-all hover:shadow-[0_8px_36px_-6px_rgba(99,102,241,0.22)] dark:from-indigo-500/40 dark:via-purple-500/25 dark:to-sky-500/30">
      <div className="relative overflow-hidden rounded-[calc(1rem-1px)] bg-gradient-to-b from-indigo-50/50 via-white/90 to-purple-50/30 p-4 backdrop-blur-xl dark:from-zinc-900/90 dark:via-zinc-950/95 dark:to-indigo-950/30 sm:p-5">
        {/* Subtle ambient light gradient in the corner */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-indigo-500/10 blur-2xl dark:bg-indigo-500/15" />

        {/* Top Bar with Equation Tag & Copy LaTeX Button */}
        <div className="mb-2 flex select-none items-center justify-between border-b border-indigo-500/10 pb-2.5 font-mono text-[10px] dark:border-white/[0.06]">
          <span className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
            Formal Mathematical Model
          </span>
          <button
            type="button"
            onClick={handleCopyMath}
            className="shadow-2xs inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/15 bg-white/60 px-2.5 py-1 text-[10px] font-medium text-muted-foreground opacity-80 transition-opacity hover:bg-white/90 hover:text-foreground group-hover:opacity-100 dark:bg-white/5 dark:hover:bg-white/10"
            title="Copy raw LaTeX formula"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="font-sans font-medium text-emerald-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span className="font-sans">Copy LaTeX</span>
              </>
            )}
          </button>
        </div>

        {/* Rendered Math Formula with KaTeX */}
        <div
          className="select-text overflow-x-auto py-3 text-center font-serif text-sm leading-relaxed tracking-wide text-slate-900 dark:text-zinc-100 sm:text-base"
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
    <div className="group relative my-4 rounded-2xl bg-gradient-to-br from-indigo-500/35 via-purple-500/20 to-sky-500/20 p-[1.5px] shadow-sm dark:from-indigo-500/40 dark:via-purple-500/25 dark:to-white/10">
      <div className="rounded-[calc(1rem-1.5px)] bg-gradient-to-br from-indigo-50/50 via-white/80 to-purple-50/20 p-4 backdrop-blur-xl dark:from-indigo-950/30 dark:via-zinc-950/70 dark:to-purple-950/20 sm:p-5">
        <div className="mb-2 flex select-none items-center gap-2">
          <span className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-1 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="h-3.5 w-3.5" />
          </span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            {title}
          </span>
        </div>
        <div className="text-xs font-normal leading-relaxed text-slate-800 dark:text-zinc-200 sm:text-sm">
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
    <div className="my-2.5 flex items-start gap-2.5 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.04] px-3.5 py-2.5 text-xs leading-relaxed text-slate-700 dark:border-indigo-500/20 dark:bg-indigo-500/[0.07] dark:text-zinc-300 sm:text-[13px]">
      <span className="mt-0.5 shrink-0 select-none rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
        Where
      </span>
      <div className="flex-1">{renderInlineContent(content, citations, onCitationClick)}</div>
    </div>
  );
}

/**
 * Render inline text with LaTeX ($...$), citations ([#1]), backticks (`...`), bold (**...**), and italics (*...*)
 */
function renderInlineContent(
  text: string,
  citations?: Citation[],
  onCitationClick?: (citation: Citation) => void,
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
  const pattern =
    /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([^\)\n]+?\\\)|\^|\[#?\s*\d+\]|`[^`\n]+`|\*\*[^\*\n]+?\*\*|\*[^\*\n]+?\*)/g;

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
          className="shadow-2xs mx-0.5 inline-flex cursor-default select-text items-center rounded-md border border-indigo-500/25 bg-indigo-500/[0.08] px-1.5 py-0.5 align-baseline font-serif text-[13px] leading-tight text-indigo-950 transition-colors hover:bg-indigo-500/15 dark:border-indigo-400/30 dark:bg-indigo-400/[0.14] dark:text-indigo-200 dark:hover:bg-indigo-400/20 sm:text-[13.5px]"
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
          className={`mx-0.5 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 align-baseline font-mono text-[10px] font-bold transition-all ${
            targetCitation
              ? "shadow-2xs cursor-pointer border border-purple-500/30 bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-primary/15 text-purple-600 hover:scale-105 hover:border-purple-500/50 hover:from-purple-500/30 hover:to-primary/30 hover:shadow-[0_0_8px_rgba(168,85,247,0.4)] active:scale-95 dark:from-purple-500/25 dark:via-indigo-500/25 dark:to-primary/25 dark:text-purple-300"
              : "cursor-default border border-border/40 bg-muted text-muted-foreground"
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
            className="shadow-2xs inline-block rounded-md border border-indigo-200/60 bg-indigo-50/80 px-1.5 py-0.5 font-mono text-xs text-foreground dark:border-indigo-800/40 dark:bg-indigo-950/40"
            dangerouslySetInnerHTML={{ __html: renderKatexHtml(inner, false) }}
          />
        );
      }
      return (
        <code
          key={`code-${index}`}
          className="rounded-md border border-border/60 bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] text-foreground"
        >
          {inner}
        </code>
      );
    }

    // 5. Bold **...**
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      const inner = part.slice(2, -2);
      return (
        <strong key={`bold-${index}`} className="font-semibold tracking-tight text-foreground">
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
          className="my-3 space-y-2 text-xs text-slate-800 dark:text-zinc-200 sm:text-sm"
        >
          {listBuffer.items.map((item, i) => {
            const kvMatch = item.text.match(/^\*\*([^*]+)\*\*[:\s]+(.*)/);
            return (
              <li
                key={i}
                className={`flex items-start gap-2.5 leading-relaxed ${
                  item.isSub
                    ? "ml-5 border-l-2 border-indigo-500/20 py-0.5 pl-3.5 text-slate-700 dark:border-indigo-400/25 dark:text-zinc-300"
                    : "py-0.5 pl-0.5"
                }`}
              >
                <span
                  className={`mt-2 inline-block flex-shrink-0 ${
                    item.isSub
                      ? "rounded-xs h-1.5 w-1.5 rotate-45 bg-indigo-400/70"
                      : "h-2 w-2 rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                  }`}
                />
                <div className="flex-1">
                  {kvMatch ? (
                    <div>
                      <span className="font-semibold tracking-tight text-foreground">
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
        </ul>,
      );
      listBuffer = null;
    };

    const flushCode = () => {
      if (!codeBuffer) return;
      const codeText = codeBuffer.lines.join("\n");
      blocks.push(
        <div
          key={`code-block-${blocks.length}`}
          className="my-3 overflow-hidden rounded-xl border border-border/70 bg-zinc-950 font-mono text-xs text-zinc-100 shadow-md"
        >
          {codeBuffer.lang && (
            <div className="border-b border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {codeBuffer.lang}
            </div>
          )}
          <pre className="overflow-x-auto p-3.5 text-xs leading-relaxed text-zinc-200">
            <code>{codeText}</code>
          </pre>
        </div>,
      );
      codeBuffer = null;
    };

    const flushMath = () => {
      if (!mathBuffer) return;
      const mathContent = mathBuffer.join("\n").trim();
      if (mathContent) {
        blocks.push(<MathBlock key={`block-math-${blocks.length}`} math={mathContent} />);
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
        if (
          trimmed.endsWith("$$") ||
          trimmed === "$$" ||
          trimmed.endsWith("\\]") ||
          trimmed === "\\]"
        ) {
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
          blocks.push(<MathBlock key={`block-math-${blocks.length}`} math={mathContent} />);
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
          <div key={`hr-${blocks.length}`} className="my-6 flex select-none items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/70 to-border/20" />
            <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
              <Sparkles className="h-2.5 w-2.5 text-primary" />
              Polaris Synthesis
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-border/20 via-border/70 to-transparent" />
          </div>,
        );
        continue;
      }

      // 7. Headings
      if (trimmed.startsWith("### ")) {
        flushList();
        blocks.push(
          <h3
            key={`h3-${i}`}
            className="mt-4.5 mb-2 flex items-center gap-2 text-sm font-bold text-foreground sm:text-base"
          >
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/80" />
            <span>{renderInlineContent(trimmed.slice(4), citations, onCitationClick)}</span>
          </h3>,
        );
        continue;
      }
      if (trimmed.startsWith("## ")) {
        flushList();
        blocks.push(
          <h2
            key={`h2-${i}`}
            className="mb-3 mt-6 flex items-center gap-2.5 border-b border-border/50 pb-2.5 text-base font-black tracking-tight text-foreground sm:text-lg"
          >
            <span className="h-4.5 shadow-xs w-1.5 flex-shrink-0 rounded-full bg-gradient-to-b from-primary via-purple-500 to-indigo-500" />
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text">
              {renderInlineContent(trimmed.slice(3), citations, onCitationClick)}
            </span>
          </h2>,
        );
        continue;
      }
      if (trimmed.startsWith("# ")) {
        flushList();
        blocks.push(
          <h1
            key={`h1-${i}`}
            className="mb-3 mt-6 flex items-center gap-2.5 border-b border-border/60 pb-2.5 text-lg font-black text-foreground sm:text-xl"
          >
            <span className="h-5.5 shadow-xs w-2 flex-shrink-0 rounded-full bg-gradient-to-b from-primary to-purple-600" />
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text">
              {renderInlineContent(trimmed.slice(2), citations, onCitationClick)}
            </span>
          </h1>,
        );
        continue;
      }

      // 8. Concept / Definition Callout Detection
      // Matches **Definition**, **Key Concept**, **Theorem**, **Intuition**, etc.
      const conceptMatch = trimmed.match(
        /^\*\*(Definition|Key Concept|Theorem|Core Principle|Intuition|Takeaway|Summary|Overview)\*\*[:\s]*(.*)/i,
      );
      if (conceptMatch && conceptMatch[1]) {
        flushList();
        const conceptType = conceptMatch[1];
        let conceptBody = conceptMatch[2]?.trim() || "";

        // If body is empty on this line, grab the next non-empty line
        if (!conceptBody && i + 1 < lines.length) {
          const nextTrimmed = lines[i + 1]?.trim() || "";
          if (
            nextTrimmed &&
            !nextTrimmed.startsWith("#") &&
            !nextTrimmed.startsWith("-") &&
            !nextTrimmed.startsWith("$$")
          ) {
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
          />,
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
          />,
        );
        continue;
      }

      // 10. Standalone Bold Subsection Heading (e.g., **Key Characteristics**)
      const standaloneHeadingMatch = trimmed.match(/^\*\*([^*]+)\*\*$/);
      if (standaloneHeadingMatch && standaloneHeadingMatch[1]) {
        flushList();
        blocks.push(
          <div key={`subhead-${i}`} className="mb-2.5 mt-5 flex select-none items-center gap-2">
            <span className="shadow-xs h-3.5 w-1.5 rounded-full bg-indigo-500/80" />
            <span className="font-sans text-xs font-bold tracking-tight text-foreground sm:text-[13px]">
              {standaloneHeadingMatch[1]}
            </span>
          </div>,
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
        <div
          key={`p-${i}`}
          className="my-2 text-xs leading-relaxed text-slate-800 dark:text-zinc-200 sm:text-sm"
        >
          {renderInlineContent(line, citations, onCitationClick)}
        </div>,
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
      <div className="my-3 flex w-full items-end justify-end gap-2.5 duration-300 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex max-w-[84%] flex-col items-end sm:max-w-[72%]">
          <div className="px-4.5 rounded-br-xs relative break-words rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 py-3 text-xs font-normal leading-relaxed text-white shadow-lg shadow-indigo-500/15 selection:bg-white/30 selection:text-white sm:text-sm">
            <div className="whitespace-pre-wrap">{content}</div>
          </div>

          {timestamp && (
            <span className="mr-1 mt-1 font-mono text-[10px] text-muted-foreground/70">
              {timestamp}
            </span>
          )}
        </div>

        <div className="shadow-xs mb-4 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-400">
          <User className="h-3.5 w-3.5" />
        </div>
      </div>
    );
  }

  // --- ASSISTANT MESSAGE BUBBLE (Double-Bezel Hardware Architecture) ---
  return (
    <div className="my-4 flex w-full items-start justify-start gap-3 duration-300 animate-in fade-in slide-in-from-bottom-2">
      {/* Bot Standalone Emblem Avatar */}
      <div className="relative mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/[0.06] shadow-md dark:border-white/15 dark:bg-white/[0.08]">
        <Image
          src="/polaris-standalone.png"
          alt="Polaris AI"
          width={22}
          height={22}
          className="object-contain"
        />
        {streaming && <span className="absolute inset-0 animate-pulse rounded-xl bg-primary/20" />}
      </div>

      {/* Assistant Outer Bezel */}
      <div className="flex w-full max-w-[94%] flex-col space-y-2 sm:max-w-[86%]">
        <div className="relative rounded-3xl rounded-tl-sm bg-gradient-to-b from-indigo-500/25 via-border/60 to-border/20 p-[1.5px] shadow-2xl shadow-indigo-950/15 dark:from-indigo-500/35 dark:via-white/10 dark:to-white/5">
          {/* Assistant Inner Card */}
          <div className="relative overflow-hidden rounded-[calc(1.5rem-1.5px)] rounded-tl-none bg-white/[0.97] p-5 text-slate-900 backdrop-blur-2xl dark:bg-zinc-950/[0.94] dark:text-zinc-100 sm:p-6">
            {/* Ambient soft glow aura in top-right corner */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl" />

            {/* Header Row: Bot Identity + Model Tag + Audio + Copy */}
            <div className="mb-3 flex items-center justify-between border-b border-slate-200/70 pb-3 text-xs dark:border-white/[0.08]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-xs font-bold tracking-wide text-transparent">
                  <GraduationCap className="inline h-3.5 w-3.5 text-primary" />
                  POLARIS ACADEMIC RAG
                </span>
                <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span>Grounding Verified</span>
                </span>
                <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
                  {modelName}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {timestamp && (
                  <span className="mr-1 hidden font-mono text-[10px] text-muted-foreground sm:inline">
                    {timestamp}
                  </span>
                )}

                {/* Read Aloud (TTS) Button */}
                {displayAnswer && !isThinking && (
                  <button
                    type="button"
                    onClick={toggleSpeech}
                    className={`rounded-lg border p-1.5 transition-colors ${
                      speaking
                        ? "animate-pulse border-indigo-500/40 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                    title={speaking ? "Stop reading aloud" : "Read answer aloud"}
                  >
                    {speaking ? (
                      <VolumeX className="h-3.5 w-3.5" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}

                {/* Copy Answer Button */}
                {displayAnswer && !isThinking && (
                  <button
                    type="button"
                    onClick={() => handleCopy(displayAnswer)}
                    className="rounded-lg border border-transparent p-1.5 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    title="Copy full synthesis"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Thinking / Retrieval Animated Loader */}
            {isThinking ? (
              <div className="flex flex-col gap-2.5 px-1 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-purple-500 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
                  </div>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
                    Synthesizing response from indexed course documents...
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted/50">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-primary via-purple-500 to-cyan-400" />
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
                  <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-primary align-middle" />
                )}
              </div>
            )}

            {/* Citations & Evidence Pill Badges Footer */}
            {citations && citations.length > 0 && !isThinking && (
              <div className="mt-5 space-y-2.5 border-t border-slate-200/70 pt-3.5 dark:border-white/[0.08]">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-bold text-primary">
                    <FileText className="h-3.5 w-3.5" />
                    Grounded Course Evidence ({citations.length} sources)
                  </span>
                  <span className="text-[9px]">Click badge to inspect page chunk</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-0.5">
                  {citations.map((c, i) => (
                    <button
                      key={`${c.document_id}-${c.page_number}-${c.chunk_index}`}
                      onClick={() => setOpenCitation(c)}
                      className="shadow-2xs group inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/60 px-3 py-1.5 font-mono text-[11px] text-foreground transition-all hover:scale-[1.02] hover:border-primary/40 hover:bg-primary/10 hover:text-primary active:scale-[0.98] dark:border-white/10 dark:bg-zinc-900/80"
                      type="button"
                      title={`Inspect citation from ${c.document_filename}, page ${c.page_number}`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
                        #{i + 1}
                      </span>
                      <span className="max-w-[130px] truncate font-medium sm:max-w-[170px]">
                        {c.document_filename}
                      </span>
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        p.{c.page_number}
                      </span>
                      {c.score > 0 && (
                        <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                          {(c.score * 100).toFixed(0)}% match
                        </span>
                      )}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
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
        <DialogContent className="border-border/80 bg-card/95 text-foreground backdrop-blur-2xl sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-primary">
              <FileText className="h-4 w-4" />
              <span>Grounded Document Provenance</span>
            </div>
            <DialogTitle className="truncate pt-1 text-base font-bold">
              {openCitation?.document_filename}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Page {openCitation?.page_number} · Match Similarity:{" "}
              <span className="font-bold text-emerald-500">
                {openCitation ? (openCitation.score * 100).toFixed(1) : ""}%
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Extracted Page Chunk Excerpt:
            </p>
            <div className="max-h-60 select-text overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-muted/40 p-3.5 font-mono text-xs leading-relaxed text-foreground">
              {openCitation?.text}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
