"use client";

import { LogOut, BookOpen, Target, Sparkles, Calendar, MessageSquare, FileText, Activity } from "lucide-react";
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
    <header className="sticky top-0 z-50 w-full border-b-2 border-indigo-500/40 bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden border border-indigo-500/50 bg-black/40 shadow-[2px_2px_0px_0px_#6366f1] group-hover:scale-105 transition-transform flex items-center justify-center p-1">
              <Image
                src="/polaris-standalone.png"
                alt="Polaris Icon"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>

            <div className="flex flex-col">
              <span className="font-mono font-black text-xl tracking-wider text-white flex items-center gap-1">
                POLARIS <span className="text-xs font-mono text-purple-400 font-normal">[v1.0]</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest -mt-1">
                Academic Navigator
              </span>
            </div>
          </Link>

          {/* Navigation Bar */}
          {user && (
            <nav className="hidden lg:flex items-center gap-1 font-mono text-xs">
              <NavLink href="/dashboard" current={pathname} icon={<FileText className="h-3.5 w-3.5" />}>
                DOCS
              </NavLink>
              <NavLink href="/syllabus" current={pathname} icon={<BookOpen className="h-3.5 w-3.5" />}>
                SYLLABUS
              </NavLink>
              <NavLink href="/gaps" current={pathname} icon={<Target className="h-3.5 w-3.5" />}>
                GAPS
              </NavLink>
              <NavLink href="/resources" current={pathname} icon={<Sparkles className="h-3.5 w-3.5" />}>
                RESOURCES
              </NavLink>
              <NavLink href="/plan" current={pathname} icon={<Calendar className="h-3.5 w-3.5" />}>
                PLAN
              </NavLink>
              <NavLink href="/chat" current={pathname} icon={<MessageSquare className="h-3.5 w-3.5" />}>
                CHAT_AI
              </NavLink>
            </nav>
          )}
        </div>

        {/* User Telemetry & Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 border border-indigo-500/30 bg-indigo-500/10 font-mono text-xs font-bold text-indigo-300">
                <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
                <span>{user.email || user.displayName || "DEMO_USER"}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="font-mono text-xs border-rose-500/40 text-rose-300 hover:bg-rose-500/10 hover:border-rose-400 rounded-none gap-2"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">EXIT</span>
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
  children,
}: {
  href: string;
  current: string | null;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const active = current?.startsWith(href) ?? false;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs font-bold uppercase transition-all tracking-wider border",
        active
          ? "bg-indigo-600 text-white border-indigo-400 shadow-[2px_2px_0px_0px_#a855f7]"
          : "border-transparent text-slate-400 hover:text-white hover:border-slate-700 hover:bg-white/5"
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
