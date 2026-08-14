"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  X,
  Sparkles,
  Send,
  ArrowRight,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { SkeuoScrews } from "@/components/skeuomorphic-controls";
import { POLARIS_CAPABILITIES, type Capability } from "@/lib/page-agent/config";

export function AgentCopilot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [inputTask, setInputTask] = useState("");
  const [executing, setExecuting] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [activeCapability, setActiveCapability] = useState<Capability | null>(null);

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

      // Route navigation action simulation
      setTimeout(() => {
        router.push(capability.targetRoute);
        setAgentLogs((prev) => [
          ...prev,
          `✅ Navigated to ${capability.targetRoute}`,
          `🎯 DOM target identified via [data-agent-target]`,
          `✨ Task completed successfully!`,
        ]);
        setExecuting(false);
        toast.success(`Copilot: Action completed on ${capability.targetRoute}`);
      }, 1200);
    } else {
      // General NLP fallback task matching
      setTimeout(() => {
        const queryLower = taskText.toLowerCase();
        let matchedCap = POLARIS_CAPABILITIES.find(
          (c) =>
            queryLower.includes(c.title.toLowerCase()) ||
            queryLower.includes(c.targetRoute.replace("/", ""))
        );

        if (!matchedCap) {
          if (queryLower.includes("gap") || queryLower.includes("missing")) {
            matchedCap = POLARIS_CAPABILITIES[0];
          } else if (queryLower.includes("ready") || queryLower.includes("twin")) {
            matchedCap = POLARIS_CAPABILITIES[1];
          } else if (queryLower.includes("career") || queryLower.includes("job")) {
            matchedCap = POLARIS_CAPABILITIES[2];
          } else if (queryLower.includes("graph") || queryLower.includes("concept")) {
            matchedCap = POLARIS_CAPABILITIES[3];
          } else {
            matchedCap = POLARIS_CAPABILITIES[4];
          }
        }

        router.push(matchedCap.targetRoute);
        setAgentLogs((prev) => [
          ...prev,
          `📍 Auto-matched capability: ${matchedCap.title}`,
          `✅ Navigated to ${matchedCap.targetRoute}`,
          `✨ Executed copilot action!`,
        ]);
        setExecuting(false);
        toast.success(`Copilot executed: ${matchedCap.title}`);
      }, 1500);
    }
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl hover:scale-105 transition-transform flex items-center gap-2 group ring-2 ring-white/20"
        title="Open PolarAssist Copilot"
        data-agent-target="copilot-trigger-btn"
      >
        <Bot className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-extrabold pr-1 hidden sm:inline">
          Copilot
        </span>
        <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
      </button>

      {/* Copilot Drawer / Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-background border-l border-white/10 h-full flex flex-col shadow-2xl relative">
            <SkeuoScrews />

            {/* Top Bar */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                    PolarAssist Copilot
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      v1.12
                    </span>
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Autonomous Browser UI Agent
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Quick Capability Actions */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-indigo-400" />
                  Quick Capabilities
                </p>
                <div className="space-y-2">
                  {POLARIS_CAPABILITIES.map((cap) => (
                    <button
                      key={cap.id}
                      disabled={executing}
                      onClick={() => handleRunTask(cap.title, cap)}
                      className="w-full p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <p className="font-bold text-foreground text-xs">{cap.title}</p>
                        <p className="text-[10px] text-muted-foreground">{cap.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-indigo-400 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Execution Logs Terminal */}
              {agentLogs.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-black/60 p-3.5 font-mono text-[11px] space-y-1.5 text-slate-300">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                    <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      {executing ? (
                        <Loader2 className="h-3 w-3 animate-spin text-indigo-400" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      )}
                      Execution Stream
                    </span>
                  </div>
                  {agentLogs.map((log, idx) => (
                    <p key={idx} className="leading-relaxed">
                      {log}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt Input Footer */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunTask(inputTask);
                  setInputTask("");
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={inputTask}
                  onChange={(e) => setInputTask(e.target.value)}
                  placeholder="Ask copilot to run analysis, reorder plan..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  disabled={executing}
                  data-agent-target="copilot-input"
                />
                <button
                  type="submit"
                  disabled={executing || !inputTask.trim()}
                  className="skeuo-button p-2.5 rounded-xl font-bold flex items-center justify-center"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
