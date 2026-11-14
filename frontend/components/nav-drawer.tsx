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
    icon: React.ComponentType<{ className?: string }>;
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm duration-200 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Drawer Panel */}
      <aside
        className={cn(
          "sm:w-88 fixed inset-y-0 left-0 z-50 flex w-80 flex-col border-r border-border/80 bg-card/95 p-0 text-foreground shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navigation Sidebar"
      >
        {/* Drawer Brand Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 p-5">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="group flex items-center gap-3"
          >
            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 shadow-sm transition-transform group-hover:scale-105">
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
              <Sparkles className="absolute inset-0 m-auto h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="flex flex-col">
              <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-sm font-black tracking-wider text-transparent">
                POLARIS{" "}
                <span className="ml-1 rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-primary">
                  AI
                </span>
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                Academic Workspace
              </span>
            </div>
          </Link>

          <button
            onClick={() => setIsOpen(false)}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            title="Close Drawer (Esc or Ctrl+B)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Launch Action Tiles */}
        <div className="grid grid-cols-2 gap-2 border-b border-border/40 bg-muted/10 p-3">
          {/* Centered Copilot Launcher */}
          <button
            onClick={() => {
              setIsOpen(false);
              openCopilotModal();
            }}
            className="group flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-left transition-all hover:bg-primary/10"
          >
            <div className="rounded-lg bg-primary/10 p-2 text-primary transition-transform group-hover:scale-105">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate text-xs font-bold text-foreground">
                Copilot
                <Sparkles className="h-3 w-3 animate-pulse text-primary" />
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">⌘K Centered</p>
            </div>
          </button>

          {/* Study To-Do Launcher */}
          <button
            onClick={() => {
              setIsOpen(false);
              openTodoDrawer();
            }}
            className="group flex items-center gap-2.5 rounded-xl border border-border/80 bg-muted/30 p-2.5 text-left transition-all hover:bg-muted/60"
          >
            <div className="rounded-lg bg-muted p-2 text-muted-foreground transition-transform group-hover:scale-105 group-hover:text-primary">
              <ListTodo className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate text-xs font-bold text-foreground">
                Tasks
                {activeTodoCount > 0 && (
                  <span className="py-0.2 rounded-full bg-primary px-1.5 font-mono text-[9px] font-bold text-primary-foreground">
                    {activeTodoCount}
                  </span>
                )}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">Alt+T</p>
            </div>
          </button>
        </div>

        {/* Grouped Navigation Links */}
        <div className="flex-1 space-y-4 overflow-y-auto p-3 text-xs">
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
                      data-agent-target={`nav-item-${item.href.replace("/", "")}`}
                      className={cn(
                        "group relative flex select-none items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-all",
                        isActive
                          ? "border border-primary/25 bg-primary/10 font-bold text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg p-2 transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/60 text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-xs">{item.label}</span>
                          {item.badge && (
                            <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-400">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[10px] font-normal text-muted-foreground">
                          {item.description}
                        </p>
                      </div>

                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground",
                          isActive && "text-primary opacity-100",
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
        <div className="space-y-3 border-t border-border/60 bg-muted/20 p-3">
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <Link
                  href="/user"
                  onClick={() => setIsOpen(false)}
                  className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-80"
                  title="View User Profile, Uploads & Community"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-bold uppercase text-primary">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-foreground">
                      {user.displayName || user.email?.split("@")[0]}
                    </p>
                    <p className="max-w-[130px] truncate font-mono text-[10px] text-muted-foreground">
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
                className="h-8 w-full justify-center gap-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
