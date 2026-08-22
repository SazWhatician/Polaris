"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  X,
  Sparkles,
  ArrowRight,
  Terminal,
  Play,
  Pause,
  Square,
  ChevronDown,
  ChevronUp,
  Eye,
  Zap,
  MousePointer,
  GripHorizontal,
  RotateCcw,
  CheckCircle2,
  Activity,
  Layers,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import {
  pageController,
  type DOMActionStep,
} from "@/lib/page-agent/page-controller";
import { virtualCursor } from "@/lib/page-agent/virtual-cursor";
import {
  type InteractiveElementNode,
} from "@/lib/page-agent/dom-tree";
import {
  addTodo,
  deleteTodo,
  updateTodo,
  clearCompletedTodos,
  getStoredTodos,
  openTodoDrawer,
  type TodoItem,
  type TodoPriority,
  type TodoCategory,
} from "@/lib/todo-store";
import { cn } from "@/lib/utils";

interface TodoActionPlan {
  todosToAdd?: Array<{ title: string; priority?: TodoPriority; category?: TodoCategory; dueDate?: string }>;
  todosToDelete?: string[];
  todosToComplete?: string[];
  clearCompleted?: boolean;
}

interface ReasoningPhases {
  perception?: string;
  intent?: string;
  plan?: string;
  verify?: string;
  rawThought?: string;
}

const SAMPLE_COMMANDS = [
  {
    title: "Navigate Syllabus -> Open Menu -> Open Chat",
    prompt: "navigate to syllabus and open menu and open rag chat",
    badge: "Compound",
  },
  {
    title: "Open Menu & Open Grounded RAG Chat",
    prompt: "open navigation menu and click on grounded rag chat",
    badge: "DOM Cursor",
  },
  {
    title: "Add Quantum Mechanics Revision Task",
    prompt: "open tasks and add a high priority revision task for Quantum Mechanics",
    badge: "Tasks",
  },
  {
    title: "Delete Quantum Mechanics Task",
    prompt: "delete the quantum mechanics task",
    badge: "Delete",
  },
];

function applyTodoModifications(plan: TodoActionPlan): {
  created: TodoItem[];
  deleted: TodoItem[];
  completed: TodoItem[];
  messages: string[];
} {
  const created: TodoItem[] = [];
  const deleted: TodoItem[] = [];
  const completed: TodoItem[] = [];
  const messages: string[] = [];

  if (plan.clearCompleted) {
    const current = getStoredTodos();
    const completedItems = current.filter((t) => t.completed);
    if (completedItems.length > 0) {
      clearCompletedTodos();
      deleted.push(...completedItems);
      messages.push(`Cleared ${completedItems.length} completed task(s).`);
    }
  }

  if (plan.todosToDelete && plan.todosToDelete.length > 0) {
    for (const target of plan.todosToDelete) {
      if (!target) continue;
      const targetClean = target.trim().toLowerCase();
      const current = getStoredTodos();

      if (targetClean === "all" || targetClean === "everything") {
        current.forEach((t) => {
          deleteTodo(t.id);
          deleted.push(t);
        });
        messages.push(`Removed all ${current.length} tasks from drawer.`);
        continue;
      }

      if (targetClean === "last" || targetClean === "recent" || targetClean === "task" || targetClean === "the task" || !targetClean) {
        const lastItem = current[current.length - 1];
        if (lastItem) {
          deleteTodo(lastItem.id);
          deleted.push(lastItem);
          messages.push(`Removed "${lastItem.title}"`);
        }
        continue;
      }

      const matched = current.find(
        (t) =>
          t.id.toLowerCase() === targetClean ||
          t.title.toLowerCase() === targetClean ||
          t.title.toLowerCase().includes(targetClean) ||
          targetClean.includes(t.title.toLowerCase())
      );

      if (matched && !deleted.some((d) => d.id === matched.id)) {
        deleteTodo(matched.id);
        deleted.push(matched);
        messages.push(`Removed "${matched.title}"`);
      }
    }
  }

  if (plan.todosToComplete && plan.todosToComplete.length > 0) {
    for (const target of plan.todosToComplete) {
      if (!target) continue;
      const targetClean = target.trim().toLowerCase();
      const current = getStoredTodos();

      if (targetClean === "all") {
        current.forEach((t) => {
          if (!t.completed) {
            updateTodo(t.id, { completed: true });
            completed.push({ ...t, completed: true });
          }
        });
        messages.push(`Marked all tasks as completed.`);
        continue;
      }

      if (targetClean === "last" || targetClean === "recent" || targetClean === "task" || !targetClean) {
        const lastUncompleted = [...current].reverse().find((t) => !t.completed);
        if (lastUncompleted) {
          updateTodo(lastUncompleted.id, { completed: true });
          completed.push({ ...lastUncompleted, completed: true });
          messages.push(`Marked "${lastUncompleted.title}" as completed.`);
        }
        continue;
      }

      const matched = current.find(
        (t) =>
          t.id.toLowerCase() === targetClean ||
          t.title.toLowerCase() === targetClean ||
          t.title.toLowerCase().includes(targetClean) ||
          targetClean.includes(t.title.toLowerCase())
      );
      if (matched && !matched.completed) {
        updateTodo(matched.id, { completed: true });
        completed.push({ ...matched, completed: true });
        messages.push(`Marked "${matched.title}" as completed.`);
      }
    }
  }

  if (plan.todosToAdd && plan.todosToAdd.length > 0) {
    for (const item of plan.todosToAdd) {
      if (!item.title?.trim()) continue;
      const priority = (["high", "medium", "low"].includes(item.priority || "")
        ? item.priority
        : "medium") as TodoPriority;
      const category = (["Syllabus", "Revision", "RAG Research", "Exam Prep", "Assignment", "General"].includes(
        item.category || ""
      )
        ? item.category
        : "General") as TodoCategory;
      const newItem = addTodo(item.title.trim(), priority, category, item.dueDate || "Today");
      created.push(newItem);
      messages.push(`Created "${newItem.title}" (${priority} priority)`);
    }
  }

  if (created.length > 0 || deleted.length > 0 || completed.length > 0 || plan.clearCompleted) {
    openTodoDrawer();
  }

  return { created, deleted, completed, messages };
}

function parseReasoningPhases(thoughtText?: string): ReasoningPhases {
  if (!thoughtText) return {};

  const phases: ReasoningPhases = { rawThought: thoughtText };
  const sentences = thoughtText.split(/(?<=\.)\s+/).filter(Boolean);

  let currentCategory: keyof ReasoningPhases | null = null;

  for (const sentence of sentences) {
    if (/Phase\s*1|PERCEPTION/i.test(sentence)) {
      currentCategory = "perception";
      phases.perception = sentence.replace(/Phase\s*1[^:]*:?\s*|PERCEPTION[^:]*:?\s*/gi, "").trim();
    } else if (/Phase\s*2|INTENT/i.test(sentence)) {
      currentCategory = "intent";
      phases.intent = sentence.replace(/Phase\s*2[^:]*:?\s*|INTENT[^:]*:?\s*/gi, "").trim();
    } else if (/Phase\s*3|PLAN/i.test(sentence)) {
      currentCategory = "plan";
      phases.plan = sentence.replace(/Phase\s*3[^:]*:?\s*|PLAN[^:]*:?\s*/gi, "").trim();
    } else if (/Phase\s*4|VERIF/i.test(sentence)) {
      currentCategory = "verify";
      phases.verify = sentence.replace(/Phase\s*4[^:]*:?\s*|VERIF[^:]*:?\s*/gi, "").trim();
    } else if (currentCategory && phases[currentCategory]) {
      phases[currentCategory] += ` ${sentence.trim()}`;
    }
  }

  return phases;
}

export function AgentCopilot() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [inputTask, setInputTask] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [currentStepDesc, setCurrentStepDesc] = useState<string | null>(null);
  const [totalStepsCount, setTotalStepsCount] = useState<number | null>(null);
  const [aiPlanSummary, setAiPlanSummary] = useState<string | null>(null);
  const [reasoningPhases, setReasoningPhases] = useState<ReasoningPhases | null>(null);
  const [showThinkingDetails, setShowThinkingDetails] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  const [detectedNodes, setDetectedNodes] = useState<InteractiveElementNode[]>([]);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  // Moveable / Draggable window state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialPosX: number; initialPosY: number }>({
    startX: 0,
    startY: 0,
    initialPosX: 0,
    initialPosY: 0,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const stopExecutionRef = useRef(false);

  // Live scan of page DOM elements
  const refreshDomScan = useCallback(() => {
    if (typeof window === "undefined") return;
    const nodes = pageController.scan();
    setDetectedNodes(nodes);
  }, []);

  useEffect(() => {
    refreshDomScan();
    const interval = setInterval(refreshDomScan, 2500);
    return () => clearInterval(interval);
  }, [pathname, refreshDomScan]);

  // Global event listener to open Copilot
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      refreshDomScan();
      setTimeout(() => inputRef.current?.focus(), 80);
    };

    window.addEventListener("polaris:open-copilot", handleOpen);
    return () => window.removeEventListener("polaris:open-copilot", handleOpen);
  }, [refreshDomScan]);

  // Global Shortcut: Ctrl+K or Cmd+K to toggle Copilot HUD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Support both Ctrl+K / Cmd+K and Ctrl+Shift+K
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen((prev) => {
          const next = !prev;
          if (next) {
            refreshDomScan();
            setTimeout(() => inputRef.current?.focus(), 80);
          } else {
            virtualCursor.hide();
          }
          return next;
        });
      }
      if (e.key === "Escape" && isOpen && !executing) {
        setIsOpen(false);
        virtualCursor.hide();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isOpen, executing, refreshDomScan]);

  // Pointer dragging handlers for moveable card
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("textarea") || target.closest("[data-no-drag]")) {
      return;
    }

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const currentX = position ? position.x : rect.left;
    const currentY = position ? position.y : rect.top;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: currentX,
      initialPosY: currentY,
    };

    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const cardWidth = cardRef.current?.offsetWidth || 560;
    const cardHeight = cardRef.current?.offsetHeight || 380;

    const newX = Math.max(12, Math.min(window.innerWidth - cardWidth - 12, dragStartRef.current.initialPosX + deltaX));
    const newY = Math.max(12, Math.min(window.innerHeight - cardHeight - 12, dragStartRef.current.initialPosY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  };

  const resetPosition = () => {
    setPosition(null);
  };

  const handleStopExecution = () => {
    stopExecutionRef.current = true;
    setExecuting(false);
    setIsPaused(false);
    setIsThinking(false);
    virtualCursor.hide();
    setCurrentStepIndex(null);
    setCurrentStepDesc(null);
    setActionStatus("Execution stopped.");
    toast.info("Agent execution stopped");
  };

  // Autonomous Multi-Step DOM Execution Engine with Virtual Cursor
  const executeAutonomousSequence = async (steps: DOMActionStep[]) => {
    if (!steps.length) return;

    setExecuting(true);
    setIsPaused(false);
    stopExecutionRef.current = false;
    setTotalStepsCount(steps.length);
    virtualCursor.show();

    for (let i = 0; i < steps.length; i++) {
      if (stopExecutionRef.current) break;

      while (isPaused && !stopExecutionRef.current) {
        await new Promise((r) => setTimeout(r, 150));
      }

      const step = steps[i];
      if (!step) continue;

      setCurrentStepIndex(i + 1);
      setCurrentStepDesc(step.description);
      setActionStatus(`Step ${i + 1}/${steps.length}: ${step.description}`);

      const stepDelay = Math.max(200, 600 / speedMultiplier);

      // 1. Navigation
      if (step.actionType === "navigate" && step.targetRoute) {
        virtualCursor.setBadge(`Nav: ${step.targetRoute}`);

        if (pathname !== step.targetRoute) {
          router.push(step.targetRoute as Parameters<typeof router.push>[0]);
          await new Promise((r) => setTimeout(r, Math.max(500, 1000 / speedMultiplier)));
          pageController.scan();
        }
        await new Promise((r) => setTimeout(r, stepDelay));
      }

      // 2. Click
      else if (step.actionType === "click") {
        const target = step.domSelector || (step.targetIndex !== undefined ? step.targetIndex : "");
        if (target) {
          await pageController.clickElementWithCursor(target, {
            label: step.cursorTargetLabel,
            speedMultiplier,
          });

          if (step.targetRoute && pathname !== step.targetRoute) {
            router.push(step.targetRoute as Parameters<typeof router.push>[0]);
            await new Promise((r) => setTimeout(r, Math.max(500, 1000 / speedMultiplier)));
            pageController.scan();
          }
          await new Promise((r) => setTimeout(r, stepDelay));
        }
      }

      // 3. Input Text
      else if (step.actionType === "input") {
        const target = step.domSelector || (step.targetIndex !== undefined ? step.targetIndex : "");
        const textVal = step.inputValue || "";
        if (target && textVal) {
          await pageController.inputTextWithCursor(target, textVal, {
            label: step.cursorTargetLabel,
            speedMultiplier,
          });
          await new Promise((r) => setTimeout(r, stepDelay));
        }
      }

      // 4. Scroll
      else if (step.actionType === "scroll") {
        await pageController.scrollPage("down", 400);
        await new Promise((r) => setTimeout(r, stepDelay));
      }

      // 5. Wait
      else if (step.actionType === "wait") {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    if (!stopExecutionRef.current) {
      setActionStatus("Sequence completed successfully.");
      toast.success("Autonomous action completed");
    }

    setExecuting(false);
    virtualCursor.hide();
    setCurrentStepIndex(null);
    setCurrentStepDesc(null);
    setTotalStepsCount(null);
  };

  // Pure LLM Agent Planner & Runner
  const handleRunTask = async (taskText: string) => {
    const query = taskText.trim();
    if (!query) return;

    const currentStoredTodos = getStoredTodos();
    const liveNodes = pageController.scan();

    setIsThinking(true);
    setExecuting(false);
    setAiPlanSummary(null);
    setReasoningPhases(null);
    setCurrentStepIndex(null);
    setCurrentStepDesc(null);
    setTotalStepsCount(null);
    stopExecutionRef.current = false;
    setActionStatus("Thinking and analyzing page state...");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8010"}/api/agent-llm/plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer demo-student-123`,
          },
          body: JSON.stringify({
            prompt: query,
            current_page: pathname,
            dom_summary: pageController.getDomPromptContext(),
            dom_targets: liveNodes.map((n) => n.dataAgentTarget).filter(Boolean),
            existing_todos: currentStoredTodos.map((t) => ({
              id: t.id,
              title: t.title,
              completed: t.completed,
              priority: t.priority,
              category: t.category,
              dueDate: t.dueDate,
            })),
            temperature: 0.1,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setIsThinking(false);

      if (data.thought) {
        const parsed = parseReasoningPhases(data.thought);
        setReasoningPhases(parsed);
      }

      // Handle Todo updates if specified in plan
      if (data.todos_to_add?.length || data.todos_to_delete?.length || data.todos_to_complete?.length || data.clear_completed_todos) {
        const todoMods = applyTodoModifications({
          todosToAdd: data.todos_to_add,
          todosToDelete: data.todos_to_delete,
          todosToComplete: data.todos_to_complete,
          clearCompleted: data.clear_completed_todos,
        });
        if (todoMods.messages.length > 0) {
          setActionStatus(todoMods.messages.join(" • "));
        }
      }

      setAiPlanSummary(data.text || null);

      if (data.steps && data.steps.length > 0) {
        await executeAutonomousSequence(data.steps);
      } else {
        setActionStatus("Action completed.");
      }
    } catch (err: unknown) {
      setIsThinking(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      setActionStatus(`Fallback execution: ${errMsg}`);

      const qLower = query.toLowerCase();

      // Fallback: Tasks deletion, addition, or completion
      if (qLower.includes("task") || qLower.includes("todo") || qLower.includes("delete") || qLower.includes("clear") || qLower.includes("add")) {
        const isDelete = qLower.includes("delete") || qLower.includes("remove") || qLower.includes("clear") || qLower.includes("trash");
        const isComplete = qLower.includes("complete") || qLower.includes("check off") || qLower.includes("finish");

        if (isDelete) {
          let target = query;
          for (const word of ["delete", "remove", "clear", "trash", "erase", "task", "the", "todo", "item", "please", "my", "a"]) {
            target = target.replace(new RegExp(`\\b${word}\\b`, "gi"), "");
          }
          target = target.trim();
          applyTodoModifications({ todosToDelete: [target || "last"] });
          await executeAutonomousSequence([{ actionType: "click", domSelector: "[data-agent-target='tasks-btn']", description: "Open Tasks Drawer", cursorTargetLabel: "Open Tasks" }]);
        } else if (isComplete) {
          applyTodoModifications({ todosToComplete: ["last"] });
          await executeAutonomousSequence([{ actionType: "click", domSelector: "[data-agent-target='tasks-btn']", description: "Open Tasks Drawer", cursorTargetLabel: "Open Tasks" }]);
        } else {
          let taskTitle = query;
          for (const word of ["open", "tasks", "task", "and", "add", "a", "revision", "for", "to-do", "todo", "create", "new", "schedule", "my", "please"]) {
            taskTitle = taskTitle.replace(new RegExp(`\\b${word}\\b`, "gi"), "");
          }
          const cleanTitle = taskTitle.trim() || "Academic Revision Goal";
          applyTodoModifications({
            todosToAdd: [{
              title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
              priority: "high",
              category: "Revision",
              dueDate: "Today",
            }],
          });
          await executeAutonomousSequence([{ actionType: "click", domSelector: "[data-agent-target='tasks-btn']", description: "Open Tasks Drawer", cursorTargetLabel: "Open Tasks" }]);
        }
      } else if (qLower.includes("menu") || qLower.includes("chat") || qLower.includes("syllabus") || qLower.includes("gaps")) {
        const fallbackSteps: DOMActionStep[] = [];
        if (qLower.includes("syllabus")) {
          fallbackSteps.push({ actionType: "navigate", targetRoute: "/syllabus", description: "Navigate to Syllabus", cursorTargetLabel: "Syllabus" });
        }
        if (qLower.includes("menu") || qLower.includes("sidebar")) {
          fallbackSteps.push({ actionType: "click", domSelector: "[data-agent-target='nav-menu-btn']", description: "Open Navigation Menu", cursorTargetLabel: "Open Menu" });
        }
        if (qLower.includes("chat") || qLower.includes("rag")) {
          fallbackSteps.push({ actionType: "click", domSelector: "[data-agent-target='nav-item-chat']", targetRoute: "/chat", description: "Click Grounded RAG Chat link", cursorTargetLabel: "Open RAG Chat" });
        }
        if (fallbackSteps.length > 0) {
          await executeAutonomousSequence(fallbackSteps);
        }
      }
    }
  };

  const handleTestElementClick = async (node: InteractiveElementNode) => {
    setActionStatus(`Testing click on #${node.index} <${node.tagName}>`);
    await pageController.clickElementWithCursor(node.element, { speedMultiplier });
    setActionStatus(`Click test finished.`);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Active Autonomous Agent Rainbow Aura Border Glow (Zero Screen Blur) */}
      {(executing || isThinking) && (
        <div className="polaris-rainbow-aura-active pointer-events-none" />
      )}

      {/* Ultra-Premium Curvy Floating & Moveable PolarAssist Card */}
      <div
        ref={cardRef}
        data-agent-ui="true"
        style={
          position
            ? { left: `${position.x}px`, top: `${position.y}px` }
            : undefined
        }
        className={cn(
          "fixed z-50 font-sans select-none transition-shadow duration-200",
          !position && "bottom-6 left-1/2 -translate-x-1/2",
          isDragging && "cursor-grabbing"
        )}
      >
        {/* Curvilinear Liquid Glow Border Wrapper */}
        <div className="rounded-[34px] p-[1.5px] bg-gradient-to-b from-sky-400/50 via-indigo-500/25 to-purple-500/40 shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_45px_rgba(56,189,248,0.22)]">
          <div
            className={cn(
              "w-[580px] max-w-[calc(100vw-32px)] bg-slate-950/90 dark:bg-black/92 rounded-[33px] backdrop-blur-3xl flex flex-col overflow-hidden text-foreground animate-in fade-in zoom-in-95 duration-200"
            )}
          >
            {/* Ambient Radial Lighting Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(56,189,248,0.12),transparent)] pointer-events-none" />

            {/* Draggable Header Bar */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="px-5 py-3 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none relative"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <GripHorizontal className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <div className="relative p-2 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0 shadow-inner">
                  <Bot className="h-4 w-4" />
                  {(executing || isThinking) && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-sky-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                      PolarAssist
                    </span>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/25">
                      Autonomous
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                    Active Page: <span className="text-sky-300 font-semibold">{pathname}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0" data-no-drag="true">
                {/* Reset to Bottom Center */}
                {position && (
                  <button
                    onClick={resetPosition}
                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                    title="Reset Position to Center"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Speed Selector */}
                <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-full p-0.5 text-[10px] font-mono">
                  <button
                    onClick={() => setSpeedMultiplier(1)}
                    className={cn(
                      "px-2 py-0.5 rounded-full transition-colors",
                      speedMultiplier === 1 ? "bg-sky-500 text-white font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Cinematic Speed (1x)"
                  >
                    1x
                  </button>
                  <button
                    onClick={() => setSpeedMultiplier(2)}
                    className={cn(
                      "px-2 py-0.5 rounded-full transition-colors",
                      speedMultiplier === 2 ? "bg-sky-500 text-white font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Fast Speed (2x)"
                  >
                    2x
                  </button>
                  <button
                    onClick={() => setSpeedMultiplier(4)}
                    className={cn(
                      "px-2 py-0.5 rounded-full transition-colors",
                      speedMultiplier === 4 ? "bg-sky-500 text-white font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Turbo Speed (4x)"
                  >
                    4x
                  </button>
                </div>

                {/* DOM Inspector Toggle */}
                <button
                  onClick={() => setShowInspector(!showInspector)}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    showInspector ? "bg-sky-500/20 text-sky-300 border border-sky-500/40" : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                  )}
                  title="Toggle DOM Inspector"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>

                {/* Close button */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    virtualCursor.hide();
                  }}
                  className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  title="Close Copilot (Esc)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Active Live Action Banner during Execution */}
            {executing && totalStepsCount && (
              <div className="px-5 py-2.5 bg-sky-500/15 border-b border-sky-500/20 flex items-center justify-between gap-3 text-xs animate-pulse">
                <div className="flex items-center gap-2 min-w-0">
                  <MousePointer className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span className="font-semibold text-sky-100 truncate text-[11.5px]">
                    Step {currentStepIndex || 1} of {totalStepsCount}: {currentStepDesc || "Actuating DOM"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0" data-no-drag="true">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-1.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-foreground"
                    title={isPaused ? "Resume" : "Pause"}
                  >
                    {isPaused ? <Play className="h-3 w-3 text-emerald-400" /> : <Pause className="h-3 w-3 text-amber-400" />}
                  </button>
                  <button
                    onClick={handleStopExecution}
                    className="p-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 hover:bg-rose-500/30 text-rose-300"
                    title="Stop Execution"
                  >
                    <Square className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Live Thinking & Reasoning UI */}
            {(isThinking || reasoningPhases || aiPlanSummary) && (
              <div className="p-4 border-b border-white/10 bg-white/[0.02] space-y-2.5 max-h-[220px] overflow-y-auto font-sans">
                {/* Thinking Indicator */}
                {isThinking && (
                  <div className="flex items-center gap-2 text-xs text-sky-300 animate-pulse font-mono">
                    <Activity className="h-3.5 w-3.5 animate-spin text-sky-400" />
                    <span>[THINKING] Formulating cognitive DOM actuation plan...</span>
                  </div>
                )}

                {/* Goal Summary */}
                {aiPlanSummary && !isThinking && (
                  <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/25 text-sky-100 text-xs flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-sky-300 font-mono text-[10px] uppercase tracking-wider block">
                        Autonomous Objective
                      </span>
                      <p className="leading-relaxed mt-0.5 text-[11.5px]">{aiPlanSummary}</p>
                    </div>
                  </div>
                )}

                {/* Reasoning Monologue Breakdown */}
                {reasoningPhases && (
                  <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden text-[11px] font-mono shadow-inner">
                    <button
                      onClick={() => setShowThinkingDetails(!showThinkingDetails)}
                      className="w-full px-3.5 py-2 bg-white/[0.03] flex items-center justify-between text-muted-foreground hover:text-foreground text-[10px] font-semibold transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Terminal className="h-3 w-3 text-sky-400" />
                        Cognitive Reasoning Process
                      </span>
                      {showThinkingDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>

                    {showThinkingDetails && (
                      <div className="p-3.5 space-y-2 text-slate-300 leading-relaxed border-t border-white/5 select-text">
                        {reasoningPhases.perception && (
                          <div className="space-y-0.5">
                            <span className="text-[9.5px] font-bold text-cyan-400 uppercase tracking-wide">
                              [PERCEPTION]
                            </span>
                            <p className="text-[10.5px] text-slate-300">{reasoningPhases.perception}</p>
                          </div>
                        )}

                        {reasoningPhases.intent && (
                          <div className="space-y-0.5">
                            <span className="text-[9.5px] font-bold text-purple-400 uppercase tracking-wide">
                              [INTENT]
                            </span>
                            <p className="text-[10.5px] text-slate-300">{reasoningPhases.intent}</p>
                          </div>
                        )}

                        {reasoningPhases.plan && (
                          <div className="space-y-0.5">
                            <span className="text-[9.5px] font-bold text-sky-400 uppercase tracking-wide">
                              [PLAN]
                            </span>
                            <p className="text-[10.5px] text-slate-300">{reasoningPhases.plan}</p>
                          </div>
                        )}

                        {reasoningPhases.verify && (
                          <div className="space-y-0.5">
                            <span className="text-[9.5px] font-bold text-emerald-400 uppercase tracking-wide">
                              [VERIFICATION]
                            </span>
                            <p className="text-[10.5px] text-slate-300">{reasoningPhases.verify}</p>
                          </div>
                        )}

                        {!reasoningPhases.perception && !reasoningPhases.intent && reasoningPhases.rawThought && (
                          <p className="text-[10.5px] text-slate-300">{reasoningPhases.rawThought}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* DOM Inspector Panel (Collapsible) */}
            {showInspector && (
              <div className="p-3.5 border-b border-white/10 bg-black/50 max-h-[180px] overflow-y-auto font-mono text-[10px] space-y-1.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/10 text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3 w-3 text-sky-400" />
                    Live DOM Nodes ({detectedNodes.length})
                  </span>
                  <button
                    onClick={refreshDomScan}
                    className="text-sky-400 hover:underline text-[9.5px]"
                  >
                    Rescan
                  </button>
                </div>
                {detectedNodes.slice(0, 15).map((node) => (
                  <div
                    key={node.index}
                    className="p-1.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-sky-500/40 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 truncate">
                      <span className="text-sky-400 font-bold mr-1">#{node.index}</span>
                      <span className="text-foreground font-semibold mr-1">&lt;{node.tagName}&gt;</span>
                      {node.dataAgentTarget && (
                        <span className="text-purple-300 mr-1">[{node.dataAgentTarget}]</span>
                      )}
                      <span className="text-muted-foreground truncate">{node.text || node.selector}</span>
                    </div>
                    <button
                      onClick={() => handleTestElementClick(node)}
                      disabled={executing}
                      className="px-2.5 py-1 rounded-full bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-white font-bold text-[9px] transition-colors shrink-0 disabled:opacity-40"
                    >
                      Click
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Preset Command Pills */}
            {!executing && !isThinking && (
              <div className="px-4 pt-3 pb-1 flex flex-wrap gap-1.5">
                {SAMPLE_COMMANDS.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputTask(cmd.prompt);
                      handleRunTask(cmd.prompt);
                    }}
                    className="px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] hover:bg-sky-500/15 hover:border-sky-500/40 text-[10.5px] font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-left group shadow-2xs"
                  >
                    <Zap className="h-3 w-3 text-sky-400 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="truncate max-w-[240px]">{cmd.title}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Interactive Agent Input Bar */}
            <div className="p-3.5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inputTask.trim() && !executing && !isThinking) {
                    handleRunTask(inputTask);
                  }
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputTask}
                    onChange={(e) => setInputTask(e.target.value)}
                    placeholder="Ask PolarAssist (e.g. 'delete quantum task', 'open menu and open rag chat')..."
                    disabled={executing || isThinking}
                    className="w-full bg-white/[0.06] border border-white/15 rounded-full pl-10 pr-16 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-sky-400/80 disabled:opacity-50 transition-all font-sans shadow-inner"
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground border border-white/10">
                    Ctrl+K
                  </kbd>
                </div>

                <button
                  type="submit"
                  disabled={executing || isThinking || !inputTask.trim()}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white font-bold text-xs hover:from-sky-400 hover:to-purple-400 transition-all flex items-center gap-1.5 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <span>Run</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              {/* Action status label */}
              {actionStatus && (
                <div className="mt-2 px-2 flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono truncate">
                  <CheckCircle2 className="h-3 w-3 text-sky-400 shrink-0" />
                  <span className="truncate">{actionStatus}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
