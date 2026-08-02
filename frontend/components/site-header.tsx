"use client";

import { LogOut, BookOpen, Target, Sparkles, Calendar, MessageSquare, FileText, Layers, User as UserIcon } from "lucide-react";
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-xl skeuo-inset flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
              <Image
                src="/polaris-logo.png"
                alt="Polaris Logo"
                width={32}
                height={32}
                className="object-contain drop-shadow"
              />
            </div>
            <div className="flex flex-col">
              <span className="skeuo-title text-base tracking-tight leading-none">POLARIS</span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                AI Engine
              </span>
            </div>
          </Link>

          {/* Streamlined De-congested Header Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 skeuo-inset p-1 ml-2">
              <NavLink href="/dashboard" current={pathname} icon={<FileText className="h-3.5 w-3.5" />} step="1">
                Docs
              </NavLink>
              <NavLink href="/syllabus" current={pathname} icon={<BookOpen className="h-3.5 w-3.5" />}>
                Syllabus
              </NavLink>
              <NavLink href="/chat" current={pathname} icon={<MessageSquare className="h-3.5 w-3.5" />} step="2">
                Chat
              </NavLink>
              <NavLink href="/gaps" current={pathname} icon={<Target className="h-3.5 w-3.5" />} step="3">
                Gaps
              </NavLink>
              <NavLink href="/resources" current={pathname} icon={<Sparkles className="h-3.5 w-3.5" />}>
                Videos
              </NavLink>
              <NavLink href="/plan" current={pathname} icon={<Calendar className="h-3.5 w-3.5" />} step="4">
                Plan
              </NavLink>
              <NavLink href="/graph" current={pathname} icon={<Layers className="h-3.5 w-3.5" />} step="5">
                Graph
              </NavLink>
            </nav>
          )}
        </div>

        {/* User Status & Theme Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 skeuo-inset text-xs font-mono">
                <div className="led-indicator text-emerald-400 animate-pulse" />
                <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-medium max-w-[110px] truncate">{user.displayName || user.email || "Student"}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="skeuo-button-secondary text-xs px-2.5 py-1 gap-1.5 text-rose-300 hover:text-rose-200"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Exit</span>
              </Button>
            </div>
          ) : null}

          {/* Unified Radio Knob Theme Toggle */}
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
        "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150 select-none",
        active
          ? "skeuo-button text-white font-bold shadow-md"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      )}
    >
      {step && (
        <span
          className={cn(
            "w-3.5 h-3.5 rounded-full text-[9px] font-mono flex items-center justify-center font-bold",
            active ? "bg-white text-indigo-700 shadow-inner" : "bg-black/40 text-muted-foreground"
          )}
        >
          {step}
        </span>
      )}
      {icon}
      <span>{children}</span>
    </Link>
  );
}
