"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FileText,
  MessageSquare,
  CheckSquare,
  Target,
  Layers,
  Menu,
  Sun,
  Moon,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { openSideDrawer, openTodoDrawer, getStoredTodos } from "@/lib/todo-store";
import { DesignerCircularNav } from "@/components/designer-circular-nav";
import { DesignerCornerFeatures } from "@/components/designer-corner-features";
import {
  NotchLeftWing,
  NotchRightWing,
} from "@/components/ui/adaptive-notch-navigation-bar";

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTodoCount, setActiveTodoCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateTodos = () => {
      const items = getStoredTodos();
      setActiveTodoCount(items.filter((t) => !t.completed).length);
    };
    updateTodos();

    window.addEventListener("polaris:todos-updated", updateTodos);
    return () => window.removeEventListener("polaris:todos-updated", updateTodos);
  }, []);

  const currentTheme = mounted ? (resolvedTheme || theme) : "dark";

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
  ];

  return (
    <>
      {/* ── Left Circular Navigation Rail & Bottom-Left Card (Untouched) ─ */}
      <DesignerCircularNav />

      {/* ── Bottom-Right Frosted Glass Context Card ────────────────── */}
      <DesignerCornerFeatures />

      {/* ── Top Notch Navigation Bar (Identical to Landing Page Notch) ── */}
      <header
        id="site-notch-navbar"
        data-testid="site-notch-navbar"
        role="navigation"
        aria-label="Main Notch Top Navigation"
        className="fixed top-0 inset-x-0 z-[90] flex justify-center pointer-events-none px-2 sm:px-4 select-none"
      >
        <div className="relative pointer-events-auto flex items-start">
          
          {/* Left Inverted Wing */}
          <NotchLeftWing
            position="top"
            className="text-white dark:text-zinc-900 fill-current drop-shadow-sm hidden md:block"
          />

          {/* Main Notch Body */}
          <div className="flex items-center gap-1.5 sm:gap-3.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-white text-slate-900 dark:bg-zinc-900 dark:text-slate-100 rounded-b-[24px] sm:rounded-b-[30px] shadow-[0_16px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.5)] border-b border-x border-slate-200/90 dark:border-white/10 backdrop-blur-xl">
            
            {/* Left Brand Slot: POLARIS LOGO */}
            <Link
              href="/dashboard"
              id="notch-nav-logo"
              data-testid="notch-nav-logo"
              className="flex items-center pr-2 sm:pr-3 border-r border-slate-200 dark:border-zinc-800 group"
            >
              <Image
                src="/polaris-monochrome.png"
                alt="Polaris Logo"
                width={105}
                height={28}
                priority
                className="h-5 sm:h-6 w-auto object-contain dark:invert group-hover:scale-105 transition-transform"
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
                      "relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 transform active:scale-95",
                      item.isActive
                        ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs scale-102"
                        : "text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/70"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5",
                        item.isActive
                          ? "text-white dark:text-zinc-950 stroke-[2.4]"
                          : "text-slate-500 dark:text-zinc-400"
                      )}
                    />
                    <span className="hidden sm:inline">{item.label}</span>

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
                      {buttonElement}
                    </Link>
                  );
                }

                return <div key={item.label}>{buttonElement}</div>;
              })}
            </div>

            {/* Right Slot: Theme Switcher + Profile / Avatar */}
            <div className="pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 sm:gap-2">
              
              {/* THEME TOGGLE BUTTON */}
              <button
                id="site-theme-toggle"
                data-testid="site-theme-toggle"
                type="button"
                onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
                title={`Switch to ${currentTheme === "dark" ? "Light" : "Dark"} Mode`}
                aria-label="Toggle Theme"
              >
                {currentTheme === "dark" ? (
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 stroke-[2.2] animate-in spin-in-90 duration-300" />
                ) : (
                  <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700 stroke-[2.2] animate-in spin-in-90 duration-300" />
                )}
              </button>

              {/* User Profile Avatar Link */}
              <Link
                href="/profile"
                id="site-nav-profile"
                data-testid="site-nav-profile"
                className={cn(
                  "flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95 group",
                  pathname === "/profile" || pathname === "/user"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                )}
                title="Scholar Profile & Knowledge Hub"
              >
                {user?.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="User Avatar"
                    width={20}
                    height={20}
                    unoptimized
                    className="w-5 h-5 rounded-full object-cover border border-primary/40"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-primary" />
                )}
                <span className="hidden md:inline font-semibold text-[11px]">
                  {user?.displayName ? user.displayName.split(" ")[0] : "Profile"}
                </span>
              </Link>

              {/* Mobile menu trigger */}
              <button
                id="nav-btn-mobile-menu"
                data-testid="nav-btn-mobile-menu"
                type="button"
                onClick={openSideDrawer}
                className="p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 md:hidden"
                aria-label="Open Navigation Menu"
              >
                <Menu className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Right Inverted Wing */}
          <NotchRightWing
            position="top"
            className="text-white dark:text-zinc-900 fill-current drop-shadow-sm hidden md:block"
          />
        </div>
      </header>
    </>
  );
}

