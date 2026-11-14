"use client";

import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  Heart,
  Bookmark,
  Share2,
  ChevronDown,
  Sparkles,
  Command,
  Zap,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { openCopilotModal } from "@/lib/todo-store";

export function DesignerCornerFeatures() {
  const [rightExpanded, setRightExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(4.8);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("polaris_copilot_seen");
      if (!seen) {
        setRightExpanded(true);
        sessionStorage.setItem("polaris_copilot_seen", "true");
      }
    }
  }, []);

  const handleToggleLike = () => {
    setIsLiked((prev) => {
      const next = !prev;
      setLikeCount((c) => (next ? +(c + 0.1).toFixed(1) : +(c - 0.1).toFixed(1)));
      if (next) toast.success("Copilot pinned to favorites!");
      return next;
    });
  };

  const handleToggleBookmark = () => {
    setIsBookmarked((prev) => {
      const next = !prev;
      if (next) toast.success("Copilot shortcut saved!");
      return next;
    });
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Workspace link copied to clipboard!");
    }
  };

  return (
    <>
      {/* ── Bottom-Right Frosted Glass Context Card (Polaris Copilot Shortcut) ── */}
      <aside
        id="corner-widget-copilot"
        data-testid="corner-widget-copilot"
        aria-label="Polaris Copilot Shortcut Widget"
        className="pointer-events-auto fixed bottom-4 right-4 z-50 hidden transition-all duration-300 sm:bottom-6 sm:right-8 xl:block"
      >
        {rightExpanded ? (
          <div className="relative w-[340px] rounded-[34px] border border-white/50 bg-white/40 p-6 text-white shadow-[0_30px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 dark:bg-white/20">
            {/* Header: Title + Shortcut Badge + Arrow Action Button */}
            <div className="mb-1 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
                  <h4
                    id="corner-widget-copilot-title"
                    data-testid="corner-widget-copilot-title"
                    className="text-lg font-bold tracking-tight text-white drop-shadow-sm"
                  >
                    Polaris Copilot AI
                  </h4>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-white/90">Shortcut:</span>
                  <kbd className="shadow-xs inline-flex items-center gap-0.5 rounded-md border border-white/30 bg-white/25 px-2 py-0.5 font-mono text-[10.5px] font-bold text-white">
                    <Command className="h-2.5 w-2.5" />
                    <span>Ctrl + K</span>
                  </kbd>
                </div>
              </div>

              <button
                id="corner-widget-btn-launch-copilot"
                data-testid="corner-widget-btn-launch-copilot"
                type="button"
                onClick={openCopilotModal}
                className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#181d3d] shadow-md transition-transform hover:scale-110"
                title="Launch Copilot (Ctrl+K)"
                aria-label="Launch Copilot"
              >
                <ArrowUpRight className="h-4 w-4 stroke-[2.2] transition-transform group-hover:rotate-12" />
              </button>
            </div>

            {/* Description text */}
            <p className="drop-shadow-xs my-3.5 text-[11.5px] font-medium leading-relaxed text-white/90">
              Press{" "}
              <strong className="font-bold text-white underline decoration-amber-300 decoration-2">
                Ctrl+K
              </strong>{" "}
              anywhere to summon Copilot. Search lecture notes, query course concepts, generate
              summaries, or navigate across tools instantly.
            </p>

            {/* Feature Tags Grid */}
            <div className="flex flex-col gap-1 border-b border-white/20 pb-4 text-[11px] font-medium text-white/95">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-300" />
                  Instant Semantic Search
                </span>
                <span>·</span>
                <span>Grounded RAG</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <span>Multi-Model Inference</span>
                <span>·</span>
                <span>Cited PDF Passages</span>
              </div>
            </div>

            {/* Footer: Heart, Bookmark, Share, Minimize */}
            <div className="flex items-center justify-between pt-3 text-white/90">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <button
                  id="corner-widget-btn-like"
                  data-testid="corner-widget-btn-like"
                  type="button"
                  onClick={handleToggleLike}
                  aria-label="Like Copilot"
                  className={cn(
                    "flex items-center gap-1.5 transition-colors hover:text-white",
                    isLiked ? "font-bold text-rose-400" : "",
                  )}
                  title="Like"
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-rose-400")} />
                  <span>{likeCount}k</span>
                </button>

                <button
                  id="corner-widget-btn-bookmark"
                  data-testid="corner-widget-btn-bookmark"
                  type="button"
                  onClick={handleToggleBookmark}
                  aria-label="Bookmark shortcut"
                  className={cn(
                    "flex items-center gap-1 transition-colors hover:text-white",
                    isBookmarked ? "font-bold text-amber-300" : "",
                  )}
                  title="Bookmark"
                >
                  <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-amber-300")} />
                  <span>Pinned</span>
                </button>

                <button
                  id="corner-widget-btn-share"
                  data-testid="corner-widget-btn-share"
                  type="button"
                  onClick={handleShare}
                  aria-label="Share workspace"
                  className="p-1 transition-colors hover:text-white"
                  title="Share"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>

              {/* Minimize button */}
              <button
                id="corner-widget-btn-minimize"
                data-testid="corner-widget-btn-minimize"
                type="button"
                onClick={() => setRightExpanded(false)}
                className="p-1 text-white/70 transition-colors hover:text-white"
                title="Minimize Widget"
                aria-label="Minimize Widget"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Floating Polaris Circular Badge */}
            <div className="absolute -bottom-5 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white/60 bg-[#1b1c44] text-lg font-black text-white shadow-xl">
              ✦
            </div>
          </div>
        ) : (
          /* Minimized Lightbulb Trigger */
          <div className="group/copilotbulb relative flex items-center justify-center duration-200 animate-in fade-in zoom-in-95">
            <button
              id="corner-widget-btn-expand"
              data-testid="corner-widget-btn-expand"
              type="button"
              onClick={() => setRightExpanded(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-[#f4f7fb]/95 text-primary shadow-[0_8px_25px_rgba(99,102,241,0.3)] backdrop-blur-2xl transition-all duration-200 hover:scale-110 active:scale-95 dark:border-white/10 dark:bg-[#1a1f33]/95"
              aria-label="Expand Copilot (Ctrl+K)"
              title="Expand Copilot (Ctrl+K)"
            >
              <Lightbulb className="h-5 w-5 animate-pulse fill-primary/20 stroke-[2.2] text-indigo-400" />
            </button>
            <div className="pointer-events-none absolute right-full z-50 mr-3 -translate-x-1 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-xl transition-all duration-200 group-hover/copilotbulb:translate-x-0 group-hover/copilotbulb:opacity-100 dark:bg-white dark:text-slate-900">
              Copilot AI (Ctrl+K)
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
