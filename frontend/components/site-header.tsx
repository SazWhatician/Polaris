"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  Sparkles,
  Activity,
  ListTodo,
  Bot,
  LogOut,
  ChevronRight,
  Command,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  openSideDrawer,
  openTodoDrawer,
  openCopilotModal,
  getStoredTodos,
} from "@/lib/todo-store";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Course Ingestion Library",
  "/chat": "Grounded RAG Chat",
  "/gaps": "Gap Analysis & YouTube",
  "/plan": "Revision Timetable",
  "/graph": "Knowledge Graph",
  "/twin": "Academic Twin",
  "/pathfinder": "Career Pathfinder",
  "/syllabus": "Syllabus Intelligence",
  "/resources": "Video Resources",
};

export function SiteHeader() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [activeTodoCount, setActiveTodoCount] = useState(0);

  useEffect(() => {
    const updateTodos = () => {
      const items = getStoredTodos();
      setActiveTodoCount(items.filter((t) => !t.completed).length);
    };
    updateTodos();

    window.addEventListener("polaris:todos-updated", updateTodos);
    return () => window.removeEventListener("polaris:todos-updated", updateTodos);
  }, []);

  const currentLabel = ROUTE_LABELS[pathname] || "Workspace";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">

        {/* Left: Drawer Toggle Button & Brand / Breadcrumb */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Side Drawer Toggle Button */}
          <button
            onClick={openSideDrawer}
            className="p-2 rounded-xl border border-border/60 bg-card/80 hover:bg-muted/80 text-foreground transition-all flex items-center gap-2 group shadow-2xs hover:scale-102"
            title="Open Navigation Menu (Ctrl+B)"
            aria-label="Open Navigation Sidebar"
            data-agent-target="nav-menu-btn"
          >
            <Menu className="h-4.5 w-4.5 text-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold hidden sm:inline text-muted-foreground group-hover:text-foreground">
              Menu
            </span>
            <kbd className="hidden md:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/50">
              Ctrl+B
            </kbd>
          </button>

          {/* Brand Logo Link */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
              <Image
                src="/polaris-standalone.png"
                alt="Polaris Logo"
                width={28}
                height={28}
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <Sparkles className="h-3.5 w-3.5 text-primary absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-black text-sm tracking-wider bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent leading-tight">
                POLARIS
              </span>
            </div>
          </Link>

          {/* Current Page Breadcrumb */}
          <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-border/50 text-xs font-medium text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="font-semibold text-foreground truncate max-w-[220px]">
              {currentLabel}
            </span>
          </div>
        </div>

        {/* Right Section: Centered Copilot, To-Do List, Status, Theme & Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Centered Page Agent Copilot Trigger Button */}
          <button
            onClick={openCopilotModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all text-xs font-bold shadow-2xs group"
            title="Launch Page Agent Copilot (⌘K / Ctrl+K)"
            data-agent-target="copilot-header-btn"
          >
            <Bot className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">Copilot</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary/20 text-primary border border-primary/30">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </button>

          {/* Persistent To-Do List Trigger Button */}
          <button
            onClick={openTodoDrawer}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-card/80 hover:bg-muted/80 text-foreground transition-all text-xs font-semibold shadow-2xs group"
            title="Open Academic Tasks & To-Do List (Alt+T)"
            data-agent-target="tasks-btn"
          >
            <ListTodo className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="hidden sm:inline">Tasks</span>
            {activeTodoCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-primary text-primary-foreground font-bold leading-tight">
                {activeTodoCount}
              </span>
            )}
          </button>

          {/* RAG Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span>RAG Active</span>
          </div>

          <ThemeToggle />

          {/* User Info / Sign Out */}
          {user && (
            <div className="flex items-center gap-2 pl-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="hidden sm:flex text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 h-8 px-2.5 rounded-xl"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
