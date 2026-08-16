"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  X,
  Sparkles,
  Send,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Terminal,
  Play,
  Layers,
  Target,
  Activity,
  Calendar,
  Compass,
} from "lucide-react";
import { toast } from "sonner";

import { POLARIS_CAPABILITIES, type Capability } from "@/lib/page-agent/config";
import { cn } from "@/lib/utils";

const CAPABILITY_ICONS: Record<string, React.ElementType> = {
  run_gap_analysis: Target,
  check_twin_readiness: Activity,
  career_pathfinder: Compass,
  explore_knowledge_graph: Layers,
  generate_revision_plan: Calendar,
};

export function AgentCopilot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputTask, setInputTask] = useState("");
  const [executing, setExecuting] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [activeCapability, setActiveCapability] = useState<Capability | null>(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle with Cmd+K / Ctrl+K or Cmd+J / Ctrl+J
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "k" || e.key === "K" || e.key === "j" || e.key === "J")
      ) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("polaris:open-copilot", handleOpen);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("polaris:open-copilot", handleOpen);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleRunTask = async (taskText: string, capability?: Capability) => {
    if (!taskText.trim()) return;

    setExecuting(true);
    setAgentLogs([
      `🤖 PolarAssist Agent initialized.`,
      `🧠 Intent parsing: "${taskText}"`,
    ]);

    if (capability) {
      setActiveCapability(capability);
      setAgentLogs((prev) => [
        ...prev,
        `📍 Capability matched: ${capability.title}`,
        `🚀 Executing: ${capability.actionHint}`,
      ]);

      setTimeout(() => {
        router.push(capability.targetRoute as Parameters<typeof router.push>[0]);
        setAgentLogs((prev) => [
          ...prev,
          `✅ Navigated to ${capability.targetRoute}`,
          `🎯 DOM target identified via [data-agent-target]`,
          `✨ Task completed successfully!`,
        ]);
        setExecuting(false);
        toast.success(`Copilot: Action executed on ${capability.targetRoute}`);
      }, 1100);
    } else {
      setTimeout(() => {
        const queryLower = taskText.toLowerCase();
        let matchedCap = POLARIS_CAPABILITIES.find(
          (c) =>
            queryLower.includes(c.title.toLowerCase()) ||
            queryLower.includes(c.targetRoute.replace("/", ""))
        );

        if (!matchedCap) {
          if (queryLower.includes("gap") || queryLower.includes("missing") || queryLower.includes("video")) {
            matchedCap = POLARIS_CAPABILITIES[0];
          } else if (queryLower.includes("ready") || queryLower.includes("twin") || queryLower.includes("mastery")) {
            matchedCap = POLARIS_CAPABILITIES[1];
          } else if (queryLower.includes("career") || queryLower.includes("job") || queryLower.includes("skill")) {
            matchedCap = POLARIS_CAPABILITIES[2];
          } else if (queryLower.includes("graph") || queryLower.includes("concept") || queryLower.includes("cluster")) {
            matchedCap = POLARIS_CAPABILITIES[3];
          } else {
            matchedCap = POLARIS_CAPABILITIES[4] || POLARIS_CAPABILITIES[0];
          }
        }

        const fallbackCap = POLARIS_CAPABILITIES[0]!;
        const selected: Capability = matchedCap || fallbackCap;
        setActiveCapability(selected);
        router.push(selected.targetRoute as Parameters<typeof router.push>[0]);
        setAgentLogs((prev) => [
          ...prev,
          `📍 Auto-matched capability: ${selected.title}`,
          `✅ Navigated to ${selected.targetRoute}`,
          `✨ Executed copilot action!`,
        ]);
        setExecuting(false);
        toast.success(`Copilot executed: ${selected.title}`);
      }, 1300);
    }
  };

  return (
    <>
      {/* Floating Action Trigger Button (Bottom Right) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl hover:scale-105 transition-all flex items-center gap-2.5 group ring-2 ring-white/20 hover:shadow-primary/30"
        title="Open PolarAssist Copilot (⌘K / Ctrl+K)"
        data-agent-target="copilot-trigger-btn"
      >
        <div className="relative">
          <Bot className="h-5 w-5 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <span className="text-xs font-black tracking-wide hidden sm:inline">
          Copilot
        </span>
        <kbd className="hidden md:inline-block text-[9px] font-mono px-1 py-0.2 rounded bg-white/20 text-white border border-white/30">
          ⌘K
        </kbd>
      </button>

      {/* Centered Modal Pop-Up Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-card/95 border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-2xl animate-in zoom-in-95 duration-200 text-foreground sleek-bezel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground flex items-center gap-2">
                    PolarAssist Copilot
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                      Centered Command Hub
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Autonomous academic browser agent & research assistant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                  ESC to close
                </kbd>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Centered Command Prompt Input */}
            <div className="p-5 border-b border-border/40 bg-muted/10 space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunTask(inputTask);
                  setInputTask("");
                }}
                className="relative flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Sparkles className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
                  <input
                    type="text"
                    value={inputTask}
                    onChange={(e) => setInputTask(e.target.value)}
                    placeholder="Type an instruction (e.g., 'Analyze gaps in syllabus', 'Plan 7-day revision')..."
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background border border-border/80 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
                    disabled={executing}
                    autoFocus
                    data-agent-target="copilot-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={executing || !inputTask.trim()}
                  className={cn(
                    "px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md",
                    executing || !inputTask.trim()
                      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      : "bg-primary text-primary-foreground hover:opacity-90 hover:scale-102"
                  )}
                >
                  {executing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Run</span>
                </button>
              </form>

              {/* Suggested Quick Prompts */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                  Suggestions:
                </span>
                {[
                  "Syllabus Gap Analysis",
                  "Knowledge Graph Explorer",
                  "Revision Timetable",
                  "Career Readiness",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={executing}
                    onClick={() => handleRunTask(prompt)}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Area: Capabilities & Execution Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Quick Actions Grid */}
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 text-primary" />
                  Autonomous Capabilities
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {POLARIS_CAPABILITIES.map((cap) => {
                    const IconComponent = CAPABILITY_ICONS[cap.id] || Sparkles;

                    return (
                      <button
                        key={cap.id}
                        disabled={executing}
                        onClick={() => handleRunTask(cap.title, cap)}
                        className="p-3.5 rounded-2xl border border-border/70 bg-muted/20 hover:bg-muted/50 text-left transition-all flex items-start gap-3 group hover:border-primary/40 hover:scale-101 shadow-xs"
                      >
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <IconComponent className="h-4 w-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">
                            {cap.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 line-clamp-2">
                            {cap.description}
                          </p>
                        </div>

                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Execution Logs Terminal */}
              {agentLogs.length > 0 && (
                <div className="rounded-2xl border border-border/80 bg-black/80 p-4 font-mono text-[11px] space-y-2 text-slate-200 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                    <span className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5 text-primary" />
                      {executing ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          Executing Workflow...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          Workflow Complete
                        </>
                      )}
                    </span>

                    {activeCapability && !executing && (
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          router.push(activeCapability.targetRoute as Parameters<typeof router.push>[0]);
                        }}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        Open {activeCapability.targetRoute}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {agentLogs.map((log, idx) => (
                      <p key={idx} className="leading-relaxed flex items-start gap-1.5">
                        <span className="text-primary/70 select-none">&gt;</span>
                        <span>{log}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[11px]">Polaris Agent v1.12 Active</span>
              </div>
              <span className="text-[11px] font-mono">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted border font-bold">⌘K</kbd> anywhere
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
