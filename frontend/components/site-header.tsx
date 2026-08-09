"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FileText,
  BookOpen,
  MessageSquare,
  Target,
  Sparkles,
  Calendar,
  Layers,
  LogOut,
  Menu,
  X,
  Activity,
  User as UserIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Course Docs", icon: FileText },
  { href: "/chat", label: "RAG Chat", icon: MessageSquare },
  { href: "/gaps", label: "Gaps & YT", icon: Target },
  { href: "/plan", label: "Revision Plan", icon: Calendar },
  { href: "/graph", label: "Knowledge Graph", icon: Layers },
  { href: "/syllabus", label: "Syllabus", icon: BookOpen },
  { href: "/resources", label: "Resources", icon: Sparkles },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
              <Image
                src="/polaris-logo.png"
                alt="Polaris Logo"
                width={28}
                height={28}
                className="object-contain"
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <Sparkles className="h-4 w-4 text-primary absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-wider bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                POLARIS <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 ml-1">AI</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href as Parameters<typeof Link>[0]["href"]}
                    className={cn(
                      "relative px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all duration-200 select-none",
                      isActive
                        ? "text-primary bg-primary/10 shadow-sm border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Section: Status, Theme Toggle & User Info */}
        <div className="flex items-center gap-3">
          {/* Active RAG Badge */}
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span>RAG Active</span>
          </div>

          <ThemeToggle />

          {user && (
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border/50">
              <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-md bg-muted/50 max-w-[160px] truncate text-muted-foreground">
                <UserIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span className="truncate">{user.email?.split("@")[0] || "User"}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 h-8 px-2.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          )}

          {/* Mobile Hamburger Menu Button */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-b border-border/40 bg-background/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2 pt-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href as Parameters<typeof Link>[0]["href"]}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 font-bold"
                      : "bg-muted/30 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
              {user.email}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
              className="text-xs gap-1.5 h-8"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
