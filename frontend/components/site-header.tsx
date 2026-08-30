"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  MessageSquare,
  CheckSquare,
  Target,
  Menu,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { openSideDrawer, openTodoDrawer, getStoredTodos } from "@/lib/todo-store";
import { DesignerCircularNav } from "@/components/designer-circular-nav";
import { DesignerCornerFeatures } from "@/components/designer-corner-features";

export function SiteHeader() {
  const pathname = usePathname();
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

  const navItems = [
    {
      id: "nav-btn-ingest",
      label: "Ingest",
      href: "/dashboard",
      icon: FileText,
      isActive: pathname === "/dashboard",
    },
    {
      id: "nav-btn-rag-chat",
      label: "Rag Chat",
      href: "/chat",
      icon: MessageSquare,
      isActive: pathname === "/chat",
    },
    {
      id: "nav-btn-tasks",
      label: "Tasks (to-do)",
      onClick: openTodoDrawer,
      icon: CheckSquare,
      badge: activeTodoCount > 0 ? activeTodoCount : null,
      isActive: false,
    },
    {
      id: "nav-btn-gap-detector",
      label: "Gap Detector",
      href: "/gaps",
      icon: Target,
      isActive: pathname === "/gaps",
    },
  ];

  return (
    <>
      {/* ── Left Circular Navigation Rail & Bottom-Left Card ───────── */}
      <DesignerCircularNav />

      {/* ── Bottom-Right Frosted Glass Context Card ────────────────── */}
      <DesignerCornerFeatures />

      {/* ── Top Floating Navigation Capsule ─────────────────────────── */}
      <header
        id="top-nav-capsule"
        data-testid="top-nav-capsule"
        role="navigation"
        aria-label="Main Top Navigation"
        className="sticky top-4 z-40 w-full px-3 sm:px-6 pointer-events-none"
      >
        <div className="max-w-xl mx-auto flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-full bg-white/90 dark:bg-white/95 backdrop-blur-2xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-slate-900 pointer-events-auto transition-all">
          
          {/* Top 4 Navigation Items */}
          <div className="flex items-center gap-1 sm:gap-2 w-full justify-between sm:justify-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const content = (
                <button
                  id={item.id}
                  data-testid={item.id}
                  type="button"
                  onClick={item.onClick}
                  aria-label={item.label}
                  aria-current={item.isActive ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all duration-200 transform active:scale-95",
                    item.isActive
                      ? "bg-white text-[#151c38] shadow-md ring-1 ring-black/5 scale-102"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/70"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", item.isActive ? "text-[#151c38] stroke-[2.5]" : "text-slate-500")} />
                  <span>{item.label}</span>

                  {item.badge && (
                    <span
                      id={`${item.id}-badge`}
                      data-testid={`${item.id}-badge`}
                      className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse"
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );

              if (item.href) {
                return (
                  <Link key={item.label} href={item.href as Parameters<typeof Link>[0]["href"]}>
                    {content}
                  </Link>
                );
              }

              return <div key={item.label}>{content}</div>;
            })}
          </div>

          {/* Mobile menu trigger */}
          <button
            id="nav-btn-mobile-menu"
            data-testid="nav-btn-mobile-menu"
            type="button"
            onClick={openSideDrawer}
            className="p-2 rounded-full bg-slate-100 text-slate-800 md:hidden ml-1"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </header>
    </>
  );
}
