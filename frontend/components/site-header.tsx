"use client";

import { LogOut, BookOpen, Target, Sparkles, Calendar, MessageSquare, FileText, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-slate-900 border border-indigo-500/40 p-1 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all flex items-center justify-center">
              <Image
                src="/polaris-standalone.png"
                alt="Polaris Standalone Icon"
                width={36}
                height={36}
                priority
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col">
              <span className="font-sans font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                POLARIS <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">v1.0</span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 -mt-1">
                Academic AI Navigator
              </span>
            </div>
          </Link>

          {/* Workflow Step Navigation */}
          {user && (
            <nav className="hidden lg:flex items-center gap-1.5">
              <NavLink href="/dashboard" current={pathname} icon={<FileText className="h-3.5 w-3.5" />} step="1">
                Upload & Docs
              </NavLink>
              <NavLink href="/syllabus" current={pathname} icon={<BookOpen className="h-3.5 w-3.5" />}>
                Syllabus
              </NavLink>
              <NavLink href="/chat" current={pathname} icon={<MessageSquare className="h-3.5 w-3.5" />} step="2">
                RAG Chat
              </NavLink>
              <NavLink href="/gaps" current={pathname} icon={<Target className="h-3.5 w-3.5" />} step="3">
                Learning Gaps
              </NavLink>
              <NavLink href="/resources" current={pathname} icon={<Sparkles className="h-3.5 w-3.5" />}>
                YT Videos
              </NavLink>
              <NavLink href="/plan" current={pathname} icon={<Calendar className="h-3.5 w-3.5" />} step="4">
                Revision Plan
              </NavLink>
            </nav>
          )}
        </div>

        {/* User Status & Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300 backdrop-blur-md">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-medium max-w-[140px] truncate">{user.displayName || user.email || "Demo Student"}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-xs text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl gap-1.5 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  current,
  icon,
  step,
  children,
}: {
  href: React.ComponentProps<typeof Link>["href"];
  current: string | null;
  icon?: React.ReactNode;
  step?: string;
  children: React.ReactNode;
}) {
  const active = typeof href === "string" && (current?.startsWith(href) ?? false);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200",
        active
          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
      )}
    >
      {step && (
        <span className={cn(
          "w-4 h-4 rounded-full text-[10px] font-mono flex items-center justify-center font-bold",
          active ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"
        )}>
          {step}
        </span>
      )}
      {icon}
      <span>{children}</span>
    </Link>
  );
}

