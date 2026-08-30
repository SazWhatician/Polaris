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
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-8 z-50 hidden xl:block transition-all duration-300 pointer-events-auto"
      >
        {rightExpanded ? (
          <div className="relative w-[340px] p-6 rounded-[34px] bg-white/40 dark:bg-white/20 text-white border border-white/50 backdrop-blur-2xl shadow-[0_30px_70px_rgba(0,0,0,0.3)] transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Header: Title + Shortcut Badge + Arrow Action Button */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                  <h4
                    id="corner-widget-copilot-title"
                    data-testid="corner-widget-copilot-title"
                    className="text-lg font-bold text-white tracking-tight drop-shadow-sm"
                  >
                    Polaris Copilot AI
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-white/90 font-medium">Shortcut:</span>
                  <kbd className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-white/25 text-white font-mono text-[10.5px] font-bold border border-white/30 shadow-xs">
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
                className="w-9 h-9 rounded-full bg-white text-[#181d3d] flex items-center justify-center transition-transform hover:scale-110 shadow-md group shrink-0"
                title="Launch Copilot (Ctrl+K)"
                aria-label="Launch Copilot"
              >
                <ArrowUpRight className="h-4 w-4 group-hover:rotate-12 transition-transform stroke-[2.2]" />
              </button>
            </div>

            {/* Description text */}
            <p className="text-[11.5px] leading-relaxed text-white/90 font-medium my-3.5 drop-shadow-xs">
              Press <strong className="text-white font-bold underline decoration-amber-300 decoration-2">Ctrl+K</strong> anywhere to summon Copilot. Search lecture notes, query course concepts, generate summaries, or navigate across tools instantly.
            </p>

            {/* Feature Tags Grid */}
            <div className="flex flex-col gap-1 text-[11px] text-white/95 font-medium pb-4 border-b border-white/20">
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
                    isLiked ? "text-rose-400 font-bold" : ""
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
                    isBookmarked ? "text-amber-300 font-bold" : ""
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
                  className="p-1 hover:text-white transition-colors"
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
                className="p-1 text-white/70 hover:text-white transition-colors"
                title="Minimize Widget"
                aria-label="Minimize Widget"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Floating Polaris Circular Badge */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#1b1c44] text-white border-2 border-white/60 flex items-center justify-center shadow-xl font-black text-lg">
              ✦
            </div>
          </div>
        ) : (
          /* Minimized Lightbulb Trigger */
          <div className="relative group/copilotbulb flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <button
              id="corner-widget-btn-expand"
              data-testid="corner-widget-btn-expand"
              type="button"
              onClick={() => setRightExpanded(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[#f4f7fb]/95 dark:bg-[#1a1f33]/95 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_25px_rgba(99,102,241,0.3)] text-primary hover:scale-110 active:scale-95 transition-all duration-200"
              aria-label="Expand Copilot (Ctrl+K)"
              title="Expand Copilot (Ctrl+K)"
            >
              <Lightbulb className="w-5 h-5 fill-primary/20 stroke-[2.2] animate-pulse text-indigo-400" />
            </button>
            <div className="absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover/copilotbulb:opacity-100 transition-all duration-200 -translate-x-1 group-hover/copilotbulb:translate-x-0 shadow-xl z-50">
              Copilot AI (Ctrl+K)
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
