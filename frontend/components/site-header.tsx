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
    <header className="sticky top-0 z-50 w-full skeuo-card !rounded-none !border-x-0 !border-t-0 !border-b-white/10 shadow-2xl backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 skeuo-inset p-1.5 flex items-center justify-center transition-all group-hover:scale-105">
              <Image
                src="/polaris-standalone.png"
                alt="Polaris Standalone Icon"
                width={36}
                height={36}
                priority
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </div>

            <div className="flex flex-col">
              <span className="font-sans font-black text-lg tracking-wider skeuo-title flex items-center gap-1.5">
                POLARIS <span className="skeuo-badge font-mono text-[10px] text-indigo-300">v1.0</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase -mt-1 font-semibold">
                Skeuomorphic AI Engine
              </span>
            </div>
          </Link>

          {/* Workflow Step Navigation */}
          {user && (
            <nav className="hidden lg:flex items-center gap-2 skeuo-inset p-1">
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
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 skeuo-inset text-xs font-mono text-slate-200">
                <div className="led-indicator text-emerald-400 animate-pulse" />
                <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-medium max-w-[140px] truncate">{user.displayName || user.email || "Demo Student"}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="skeuo-button-secondary text-xs px-3 py-1.5 gap-1.5 text-rose-300 hover:text-rose-200 hover:bg-rose-950/30"
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
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 select-none",
        active
          ? "skeuo-button bg-indigo-600 text-white font-bold shadow-md"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      )}
    >
      {step && (
        <span className={cn(
          "w-4 h-4 rounded-full text-[10px] font-mono flex items-center justify-center font-bold",
          active ? "bg-white text-indigo-700 shadow-inner" : "bg-slate-800 text-slate-400"
        )}>
          {step}
        </span>
      )}
      {icon}
      <span>{children}</span>
    </Link>
  );
}
