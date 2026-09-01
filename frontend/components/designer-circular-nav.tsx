"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  Bell,
  Settings,
  Moon,
  Sun,
  ArrowUpRight,
  Network,
  BookOpen,
  CalendarCheck,
  Compass,
  Cpu,
  Youtube,
  Search,
  Check,
  ChevronDown,
  Lightbulb,
  FileText,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { openCopilotModal } from "@/lib/todo-store";
import { listDocuments } from "@/lib/api/documents";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const ALL_OTHER_FEATURES = [
  {
    id: "dock-tool-scholar-community",
    title: "Scholar Communities",
    description: "Universities, courses, friends & study circles",
    href: "/community",
    icon: Users,
    badge: "Community",
  },
  {
    id: "dock-tool-course-ingest",
    title: "Course Ingestion",
    description: "PDF docs, OCR & Vector indexing",
    href: "/ingest",
    icon: FileText,
    badge: "Ingestion",
  },
  {
    id: "dock-tool-knowledge-graph",
    title: "Knowledge Graph",
    description: "Interactive 3D concept network & topology",
    href: "/graph",
    icon: Network,
    badge: "Concept Map",
  },
  {
    id: "dock-tool-syllabus-intelligence",
    title: "Syllabus Intelligence Tree",
    description: "Multi-level topic breakdown with completion trackers",
    href: "/syllabus",
    icon: BookOpen,
    badge: "Syllabus Tree",
  },
  {
    id: "dock-tool-revision-timetable",
    title: "Revision Timetable",
    description: "Exam countdown & autonomous study planner",
    href: "/plan",
    icon: CalendarCheck,
    badge: "Planner",
  },
  {
    id: "dock-tool-career-pathfinder",
    title: "Career Pathfinder",
    description: "Target role skill gap & course alignment",
    href: "/pathfinder",
    icon: Compass,
    badge: "Career AI",
  },
  {
    id: "dock-tool-academic-digital-twin",
    title: "Academic Digital Twin",
    description: "Mastery velocity & prerequisite confidence",
    href: "/twin",
    icon: Cpu,
    badge: "Twin Mesh",
  },
  {
    id: "dock-tool-youtube-resources",
    title: "YouTube Video Resources",
    description: "AI-curated video lectures for weak concepts",
    href: "/resources",
    icon: Youtube,
    badge: "Video Discovery",
  },
];

export function DesignerCircularNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [featuresFlyoutOpen, setFeaturesFlyoutOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("groq-llama3-70b");
  const [ragGroundedStrict, setRagGroundedStrict] = useState(true);
  const [vectorCount, setVectorCount] = useState("10K+");

  const flyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      const seen = sessionStorage.getItem("polaris_academic_engine_seen");
      if (!seen) {
        setCardOpen(true);
        sessionStorage.setItem("polaris_academic_engine_seen", "true");
      }
    }

    listDocuments()
      .then((docs) => {
        if (docs.length > 0) {
          const totalPages = docs.reduce((acc, d) => acc + (d.page_count || 0), 0);
          setVectorCount(totalPages > 0 ? `${(totalPages * 8).toLocaleString()}+` : "10K+");
        }
      })
      .catch(() => {});
  }, []);

  // Close flyout when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setFeaturesFlyoutOpen(false);
      }
    };
    if (featuresFlyoutOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [featuresFlyoutOpen]);

  const currentTheme = mounted ? (resolvedTheme || theme) : "dark";

  const handleNotificationsClick = () => {
    toast.info("Notifications", {
      description: "Real-time sync and alert system coming in the next update!",
    });
  };

  const isAnyClubbedActive = ALL_OTHER_FEATURES.some((f) => f.href === pathname);

  return (
    <>
      {/* ── UNIFIED BOTTOM-LEFT DESIGNER CORNER ─────────────────────── */}
      <aside
        id="sidebar-circular-dock"
        data-testid="sidebar-circular-dock"
        aria-label="Circular Workspace Navigation"
        className="fixed bottom-4 sm:bottom-6 left-3 sm:left-6 z-50 hidden md:flex items-end gap-3 select-none pointer-events-auto"
      >
        {/* Left Column: Vertical Sidebar Bubbles */}
        <div className="flex flex-col items-center gap-2.5">
          
          {/* Upper Pill: Dashboard, Four-Dot Menu, Notifications, User */}
          <div
            id="dock-upper-pill"
            data-testid="dock-upper-pill"
            className="flex flex-col items-center gap-2 p-1.5 rounded-full bg-[#f4f7fb]/95 dark:bg-[#1a1f33]/95 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
          >
            {/* 1. Dashboard Bubble */}
            <div className="relative group/circle flex items-center justify-center">
              <Link href="/dashboard">
                <button
                  id="dock-btn-dashboard"
                  data-testid="dock-btn-dashboard"
                  type="button"
                  aria-label="Dashboard"
                  aria-current={pathname === "/dashboard" ? "page" : undefined}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 transform active:scale-95",
                    pathname === "/dashboard"
                      ? "bg-white text-[#111633] shadow-[0_4px_14px_rgba(0,0,0,0.1)] scale-105 ring-1 ring-black/5"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10"
                  )}
                >
                  <Home className="w-5 h-5 fill-current" />
                </button>
              </Link>
              <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover/circle:opacity-100 transition-all duration-200 translate-x-1 group-hover/circle:translate-x-0 shadow-xl z-50">
                Dashboard
              </div>
            </div>

            {/* 2. Four Dots (LayoutGrid) -> Clubbed Features Flyout */}
            <div className="relative group/circle flex items-center justify-center" ref={flyoutRef}>
              <button
                id="dock-btn-all-tools"
                data-testid="dock-btn-all-tools"
                type="button"
                onClick={() => setFeaturesFlyoutOpen(!featuresFlyoutOpen)}
                aria-expanded={featuresFlyoutOpen}
                aria-haspopup="menu"
                aria-label="All Tools & Features"
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 transform active:scale-95",
                  featuresFlyoutOpen || isAnyClubbedActive
                    ? "bg-white text-[#111633] shadow-[0_4px_14px_rgba(0,0,0,0.1)] scale-105 ring-1 ring-black/5"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10"
                )}
              >
                <LayoutGrid className="w-5 h-5 stroke-[2]" />
              </button>
              
              {!featuresFlyoutOpen && (
                <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover/circle:opacity-100 transition-all duration-200 translate-x-1 group-hover/circle:translate-x-0 shadow-xl z-50">
                  All Workspace Tools
                </div>
              )}

              {/* Clubbed Features Flyout Menu */}
              {featuresFlyoutOpen && (
                <div
                  id="dock-flyout-tools-menu"
                  data-testid="dock-flyout-tools-menu"
                  role="menu"
                  aria-label="Workspace Tools Menu"
                  className="absolute left-full bottom-0 ml-4 w-72 rounded-3xl bg-white/95 dark:bg-[#15192c]/95 backdrop-blur-2xl p-3 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Workspace Suite
                    </span>
                    <button
                      id="dock-flyout-btn-search"
                      data-testid="dock-flyout-btn-search"
                      type="button"
                      onClick={openCopilotModal}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Search className="w-3 h-3" />
                      <span>⌘K Search</span>
                    </button>
                  </div>

                  <div className="space-y-1 mt-2">
                    {ALL_OTHER_FEATURES.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href as Parameters<typeof Link>[0]["href"]}
                          onClick={() => setFeaturesFlyoutOpen(false)}
                          id={item.id}
                          data-testid={item.id}
                          role="menuitem"
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-2xl transition-colors group/item",
                            isItemActive
                              ? "bg-slate-100 dark:bg-white/10 text-slate-950 dark:text-white font-bold"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-950 dark:hover:text-white"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-xl transition-colors",
                            isItemActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover/item:text-slate-950 dark:group-hover/item:text-white"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate leading-tight">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {item.description}
                            </p>
                          </div>
                          {isItemActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Notifications (Future Update) */}
            <div className="relative group/circle flex items-center justify-center">
              <button
                id="dock-btn-notifications"
                data-testid="dock-btn-notifications"
                type="button"
                onClick={handleNotificationsClick}
                aria-label="Notifications (Future Update)"
                className="relative w-11 h-11 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all active:scale-95"
              >
                <Bell className="w-5 h-5 stroke-[2]" />
              </button>
              <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover/circle:opacity-100 transition-all duration-200 translate-x-1 group-hover/circle:translate-x-0 shadow-xl z-50 flex items-center gap-1.5">
                <span>Notifications</span>
                <span className="px-1.5 py-0.2 rounded bg-white/20 dark:bg-slate-200 text-[10px] font-medium">Future</span>
              </div>
            </div>

            {/* 4. User Icon */}
            <div className="relative group/circle flex items-center justify-center">
              <Link href="/user">
                <button
                  id="dock-btn-user-profile"
                  data-testid="dock-btn-user-profile"
                  type="button"
                  aria-label="User Profile"
                  aria-current={pathname === "/user" ? "page" : undefined}
                  className={cn(
                    "w-11 h-11 rounded-full overflow-hidden border-2 shadow-sm flex items-center justify-center bg-gradient-to-tr from-amber-200 to-indigo-200 hover:scale-105 transition-transform",
                    pathname === "/user" ? "border-primary ring-2 ring-primary/20" : "border-white dark:border-slate-700"
                  )}
                >
                  <img
                    src={user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                    alt="User Profile"
                    className="w-full h-full object-cover"
                  />
                </button>
              </Link>
              <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover/circle:opacity-100 transition-all duration-200 translate-x-1 group-hover/circle:translate-x-0 shadow-xl z-50">
                User Profile
              </div>
            </div>
          </div>

          {/* Lower Pill: Settings Gear + Theme Switcher (Moon / Sun) */}
          <div
            id="dock-lower-pill"
            data-testid="dock-lower-pill"
            className="flex flex-col items-center gap-1.5 p-1.5 rounded-full bg-[#f4f7fb]/95 dark:bg-[#1a1f33]/95 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
          >
            {/* Settings Gear */}
            <div className="relative group/circle flex items-center justify-center">
              <button
                id="dock-btn-settings"
                data-testid="dock-btn-settings"
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Settings"
                className="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all active:scale-95"
              >
                <Settings className="w-5 h-5 stroke-[2]" />
              </button>
              <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover/circle:opacity-100 transition-all duration-200 translate-x-1 group-hover/circle:translate-x-0 shadow-xl z-50">
                Settings
              </div>
            </div>

            {/* Mini-pill Theme Switcher Track (Moon + Sun) */}
            <div
              id="dock-theme-switcher-track"
              data-testid="dock-theme-switcher-track"
              className="flex flex-col items-center p-1 rounded-full bg-slate-200/70 dark:bg-slate-800/80 gap-1"
            >
              <button
                id="dock-btn-theme-dark"
                data-testid="dock-btn-theme-dark"
                type="button"
                onClick={() => setTheme("dark")}
                aria-label="Dark Mode"
                aria-pressed={currentTheme === "dark"}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                  currentTheme === "dark"
                    ? "bg-white text-slate-950 shadow-sm scale-105"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Moon className="w-4 h-4 stroke-[2.2]" />
              </button>

              <button
                id="dock-btn-theme-light"
                data-testid="dock-btn-theme-light"
                type="button"
                onClick={() => setTheme("light")}
                aria-label="Light Mode"
                aria-pressed={currentTheme === "light"}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
                  currentTheme === "light"
                    ? "bg-white text-slate-950 shadow-sm scale-105"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Sun className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Polaris Academic Intelligence Card (Switchable ON / OFF) */}
        {cardOpen ? (
          <section
            id="dock-corner-card-vectors"
            data-testid="dock-corner-card-vectors"
            aria-label="Polaris Academic Intelligence Card"
            className="w-[360px] sm:w-[410px] p-6 sm:p-7 rounded-[42px] bg-[#f8fafc]/95 dark:bg-[#161a2d]/95 backdrop-blur-2xl text-slate-950 dark:text-white border border-white/90 dark:border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.7)] animate-in fade-in slide-in-from-bottom-3 duration-200"
          >
            {/* Header: Title + Switch OFF / Minimize Button */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-[20px] font-bold tracking-tight text-slate-950 dark:text-white leading-tight">
                  Polaris Academic Engine
                </h3>
              </div>

              <button
                id="dock-btn-toggle-card-off"
                data-testid="dock-btn-toggle-card-off"
                type="button"
                onClick={() => setCardOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title="Collapse Polaris Card"
                aria-label="Collapse Polaris Card"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Polaris Description */}
            <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400 font-normal mb-5">
              Autonomous grounded RAG, OCR vector chunks, and real-time concept hierarchy extracted directly from your course materials.
            </p>

            {/* Bottom Row: Active Vectors + 3 Previews + ↗ Button */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-col">
                <span
                  id="dock-stat-vector-count"
                  data-testid="dock-stat-vector-count"
                  className="text-[32px] font-black tracking-tight text-slate-950 dark:text-white font-sans leading-none"
                >
                  {vectorCount}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Active Vectors
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* 3 Overlapping Previews */}
                <div className="flex -space-x-3 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=100&auto=format&fit=crop&q=80"
                    alt="Textbooks"
                    className="inline-block h-11 w-11 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover shadow-sm"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=80"
                    alt="Study Notes"
                    className="inline-block h-11 w-11 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover shadow-sm"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=100&auto=format&fit=crop&q=80"
                    alt="Lectures"
                    className="inline-block h-11 w-11 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover shadow-sm"
                  />
                </div>

                {/* Arrow Action Trigger (Opens Copilot ⌘K) */}
                <button
                  id="dock-btn-explore-vectors"
                  data-testid="dock-btn-explore-vectors"
                  type="button"
                  onClick={openCopilotModal}
                  aria-label="Explore Knowledge Base"
                  className="w-11 h-11 rounded-full bg-[#e8eef8] dark:bg-white/10 text-slate-900 dark:text-white flex items-center justify-center transition-transform hover:scale-108 active:scale-95 shadow-sm group ml-1"
                  title="Explore Knowledge Base (⌘K)"
                >
                  <ArrowUpRight className="h-5 w-5 group-hover:rotate-12 transition-transform stroke-[2.4]" />
                </button>
              </div>
            </div>
          </section>
        ) : (
          /* Minimized Lightbulb Trigger */
          <div className="relative group/bulb flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <button
              id="dock-btn-toggle-card-on"
              data-testid="dock-btn-toggle-card-on"
              type="button"
              onClick={() => setCardOpen(true)}
              aria-label="Expand Polaris Academic Engine"
              title="Expand Polaris Engine"
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[#f4f7fb]/95 dark:bg-[#1a1f33]/95 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-[0_8px_25px_rgba(245,158,11,0.3)] text-amber-500 hover:text-amber-400 hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <Lightbulb className="w-5 h-5 fill-amber-400/20 stroke-[2.2] animate-pulse" />
            </button>
            <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover/bulb:opacity-100 transition-all duration-200 translate-x-1 group-hover/bulb:translate-x-0 shadow-xl z-50">
              Polaris Engine ({vectorCount})
            </div>
          </div>
        )}
      </aside>

      {/* ── Settings Dialog Modal ───────────────────────────────────── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent
          id="dialog-settings-modal"
          data-testid="dialog-settings-modal"
          className="max-w-md bg-card/95 backdrop-blur-2xl border-border/80 rounded-3xl p-6 shadow-2xl text-foreground"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Workspace Intelligence Preferences
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Configure RAG grounding parameters, default inference model, and index caching.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-2">
              <label className="font-semibold text-foreground">AI Inference Model</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "groq-llama3-70b", name: "Groq LLaMA 3.3 70B", desc: "Ultra-Fast (300 t/s)" },
                  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", desc: "High Reasoning RAG" },
                  { id: "claude-3.7-sonnet", name: "Claude 3.7 Sonnet", desc: "Deep Analysis" },
                  { id: "deepseek-r1", name: "DeepSeek R1", desc: "Chain-of-Thought" },
                ].map((m) => (
                  <button
                    key={m.id}
                    id={`settings-model-${m.id}`}
                    data-testid={`settings-model-${m.id}`}
                    type="button"
                    onClick={() => setSelectedModel(m.id)}
                    className={cn(
                      "p-2.5 rounded-2xl border text-left transition-all",
                      selectedModel === m.id
                        ? "border-primary bg-primary/10 text-foreground font-bold shadow-xs"
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/60"
                    )}
                  >
                    <p className="font-semibold text-foreground truncate">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-2xl border border-border/60 bg-muted/20 flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Strict Document Grounding</p>
                <p className="text-[10px] text-muted-foreground">Reject speculative answers without direct PDF citation</p>
              </div>
              <button
                id="settings-toggle-strict-grounding"
                data-testid="settings-toggle-strict-grounding"
                type="button"
                aria-checked={ragGroundedStrict}
                role="switch"
                onClick={() => setRagGroundedStrict(!ragGroundedStrict)}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative p-0.5",
                  ragGroundedStrict ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full bg-white transition-transform shadow-xs",
                    ragGroundedStrict ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                id="settings-btn-save"
                data-testid="settings-btn-save"
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
