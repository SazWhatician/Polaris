"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  X,
  FileText,
  BookOpen,
  MessageSquare,
  Target,
  Sparkles,
  Calendar,
  Layers,
  Activity,
  LogOut,
  ListTodo,
  Bot,
  ChevronRight,
  LayoutGrid,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { openTodoDrawer, openCopilotModal, getStoredTodos } from "@/lib/todo-store";

interface NavGroup {
  title: string;
  items: {
    href: string;
    label: string;
    description: string;
    icon: React.ElementType;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Core Workspace",
    items: [
      {
        href: "/dashboard",
        label: "Intelligence Dashboard",
        description: "Central command nexus & telemetry",
        icon: LayoutGrid,
      },
      {
        href: "/ingest",
        label: "Course Ingestion",
        description: "PDF docs, OCR & Vector indexing",
        icon: FileText,
        badge: "Studio",
      },
      {
        href: "/syllabus",
        label: "Syllabus Intelligence",
        description: "Structured topic tree & coverage",
        icon: BookOpen,
      },
      {
        href: "/community",
        label: "Scholar Communities",
        description: "Colleges, courses, friends & study circles",
        icon: Users,
        badge: "Network",
      },
      {
        href: "/user",
        label: "User Profile & Hub",
        description: "Uploads, chat history & identity",
        icon: Sparkles,
        badge: "User",
      },
    ],
  },
  {
    title: "Academic Intelligence",
    items: [
      {
        href: "/chat",
        label: "Grounded RAG Chat",
        description: "Cited answers with page references",
        icon: MessageSquare,
        badge: "RAG",
      },
      {
        href: "/gaps",
        label: "Gaps & YouTube",
        description: "Prerequisite gaps & video recommendations",
        icon: Target,
      },
      {
        href: "/graph",
        label: "Knowledge Graph",
        description: "Interactive concept graph & clusters",
        icon: Layers,
      },
      {
        href: "/twin",
        label: "Academic Twin",
        description: "Prerequisite mastery & confidence check",
        icon: Activity,
      },
      {
        href: "/pathfinder",
        label: "Career Pathfinder",
        description: "Target role skill gap analysis",
        icon: Sparkles,
      },
    ],
  },
  {
    title: "Study Planning",
    items: [
      {
        href: "/plan",
        label: "Revision Plan",
        description: "Exam countdown & structured timetable",
        icon: Calendar,
      },
      {
        href: "/resources",
        label: "Video Resources",
        description: "Curated academic lecture library",
        icon: Sparkles,
      },
    ],
  },
];

export function NavDrawer() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTodoCount, setActiveTodoCount] = useState(0);

  useEffect(() => {
    // Update active todo count
    const updateTodos = () => {
      const items = getStoredTodos();
      setActiveTodoCount(items.filter((t) => !t.completed).length);
    };
    updateTodos();

    const handleOpenDrawer = () => setIsOpen(true);
    const handleTodosUpdated = () => updateTodos();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
      // Ctrl+B / Cmd+B to toggle sidebar drawer
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("polaris:open-drawer", handleOpenDrawer);
    window.addEventListener("polaris:todos-updated", handleTodosUpdated);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("polaris:open-drawer", handleOpenDrawer);
      window.removeEventListener("polaris:todos-updated", handleTodosUpdated);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Drawer Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-80 sm:w-88 bg-card/95 border-r border-border/80 p-0 flex flex-col shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out text-foreground",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Navigation Sidebar"
      >
        {/* Drawer Brand Header */}
        <div className="p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 group"
          >
            <div className="relative w-9 h-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 shadow-sm">
              <Image
                src="/polaris-standalone.png"
                alt="Polaris Logo"
                width={30}
                height={30}
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <Sparkles className="h-4 w-4 text-primary absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-wider bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                POLARIS <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 ml-1">AI</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Academic Workspace</span>
            </div>
          </Link>

          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Close Drawer (Esc or Ctrl+B)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Launch Action Tiles */}
        <div className="p-3 border-b border-border/40 grid grid-cols-2 gap-2 bg-muted/10">
          {/* Centered Copilot Launcher */}
          <button
            onClick={() => {
              setIsOpen(false);
              openCopilotModal();
            }}
            className="p-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-left transition-all group flex items-center gap-2.5"
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate flex items-center gap-1">
                Copilot
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">⌘K Centered</p>
            </div>
          </button>

          {/* Study To-Do Launcher */}
          <button
            onClick={() => {
              setIsOpen(false);
              openTodoDrawer();
            }}
            className="p-2.5 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/60 text-left transition-all group flex items-center gap-2.5"
          >
            <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-primary group-hover:scale-105 transition-transform">
              <ListTodo className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate flex items-center gap-1.5">
                Tasks
                {activeTodoCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-primary text-primary-foreground font-bold">
                    {activeTodoCount}
                  </span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">Alt+T</p>
            </div>
          </button>
        </div>

        {/* Grouped Navigation Links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                {group.title}
              </p>

              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href as Parameters<typeof Link>[0]["href"]}
                      onClick={() => setIsOpen(false)}
                      data-agent-target={`nav-item-${item.href.replace('/', '')}`}
                      className={cn(
                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all select-none",
                        isActive
                          ? "bg-primary/10 text-primary font-bold border border-primary/25 shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/60 text-muted-foreground group-hover:text-foreground group-hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs truncate">{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate font-normal">
                          {item.description}
                        </p>
                      </div>

                      <ChevronRight
                        className={cn(
                          "h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0",
                          isActive && "text-primary opacity-100"
                        )}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Account & Session Footer */}
        <div className="p-3 border-t border-border/60 bg-muted/20 space-y-3">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <Link
                  href="/user"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
                  title="View User Profile, Uploads & Community"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs uppercase">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {user.displayName || user.email?.split("@")[0]}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[130px]">
                      {user.email}
                    </p>
                  </div>
                </Link>

                <ThemeToggle />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  signOut();
                }}
                className="w-full justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 rounded-xl"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Guest Session</span>
              <ThemeToggle />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export const NavWheel = NavDrawer;
