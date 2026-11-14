"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  MessageSquare,
  CheckSquare,
  Target,
  Layers,
  Menu,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { openSideDrawer, openTodoDrawer, getStoredTodos } from "@/lib/todo-store";
import { DesignerCircularNav } from "@/components/designer-circular-nav";
import { DesignerCornerFeatures } from "@/components/designer-corner-features";
import { NotchLeftWing, NotchRightWing } from "@/components/ui/adaptive-notch-navigation-bar";

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
      id: "nav-btn-dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutGrid,
      isActive: pathname === "/dashboard",
    },
    {
      id: "nav-btn-ingest",
      label: "Ingest",
      href: "/ingest",
      icon: FileText,
      isActive: pathname === "/ingest",
    },
    {
      id: "nav-btn-rag-chat",
      label: "RAG Chat",
      href: "/chat",
      icon: MessageSquare,
      isActive: pathname === "/chat",
    },
    {
      id: "nav-btn-tasks",
      label: "Tasks",
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
    {
      id: "nav-btn-graph",
      label: "Graph",
      href: "/graph",
      icon: Layers,
      isActive: pathname === "/graph",
    },
    {
      id: "nav-btn-community",
      label: "Community",
      href: "/community",
      icon: Users,
      isActive: pathname === "/community",
    },
  ];

  return (
    <>
      {/* ── Left Circular Navigation Rail & Bottom-Left Card ─────────── */}
      <DesignerCircularNav />

      {/* ── Bottom-Right Frosted Glass Context Card ────────────────── */}
      <DesignerCornerFeatures />

      {/* ── Top Notch Navigation Bar (Always Solid Pure White) ──────── */}
      <header
        id="site-notch-navbar"
        data-testid="site-notch-navbar"
        role="navigation"
        aria-label="Main Notch Top Navigation"
        className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex select-none justify-center px-2 sm:px-4"
      >
        <div className="pointer-events-auto relative flex items-start">
          {/* Left Inverted Wing (Always Pure White) */}
          <NotchLeftWing
            position="top"
            className="hidden fill-white text-white drop-shadow-sm md:block"
          />

          {/* Main Notch Body (Always Solid Pure White with Slate/Black Text) */}
          <div className="flex items-center gap-1 rounded-b-[24px] border-x border-b border-slate-200/90 bg-white px-3 py-2 text-slate-900 shadow-[0_16px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:gap-2.5 sm:rounded-b-[30px] sm:px-5 sm:py-2.5">
            {/* Left Brand Slot: POLARIS LOGO */}
            <Link
              href="/dashboard"
              id="notch-nav-logo"
              data-testid="notch-nav-logo"
              className="group flex items-center border-r border-slate-200 pr-2 sm:pr-3"
            >
              <Image
                src="/polaris-monochrome.png"
                alt="Polaris Logo"
                width={105}
                height={28}
                priority
                className="h-5 w-auto object-contain transition-transform group-hover:scale-105 sm:h-6"
              />
            </Link>

            {/* Center Navigation Links */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const buttonElement = (
                  <button
                    id={item.id}
                    data-testid={item.id}
                    type="button"
                    onClick={item.onClick}
                    aria-label={item.label}
                    aria-current={item.isActive ? "page" : undefined}
                    className={cn(
                      "relative flex transform items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 sm:px-3",
                      item.isActive
                        ? "shadow-xs scale-102 bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5",
                        item.isActive ? "stroke-[2.4] text-white" : "text-slate-500",
                      )}
                    />
                    <span className="hidden sm:inline">{item.label}</span>

                    {item.badge && (
                      <span
                        id={`${item.id}-badge`}
                        data-testid={`${item.id}-badge`}
                        className="py-0.2 ml-1 animate-pulse rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold text-white"
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );

                if (item.href) {
                  return (
                    <Link key={item.id} href={item.href as Parameters<typeof Link>[0]["href"]}>
                      {buttonElement}
                    </Link>
                  );
                }

                return <div key={item.id}>{buttonElement}</div>;
              })}
            </div>

            {/* Mobile menu trigger */}
            <button
              id="nav-btn-mobile-menu"
              data-testid="nav-btn-mobile-menu"
              type="button"
              onClick={openSideDrawer}
              className="ml-1 rounded-full bg-slate-100 p-1.5 text-slate-800 transition-colors hover:bg-slate-200 md:hidden"
              aria-label="Open Navigation Menu"
            >
              <Menu className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Right Inverted Wing (Always Pure White) */}
          <NotchRightWing
            position="top"
            className="hidden fill-white text-white drop-shadow-sm md:block"
          />
        </div>
      </header>
    </>
  );
}
