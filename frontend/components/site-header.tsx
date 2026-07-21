"use client";

import { LogOut } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold tracking-tight">
            Polaris
          </Link>
          {user && (
            <nav className="flex items-center gap-1 text-sm">
              <NavLink href="/dashboard" current={pathname}>
                Documents
              </NavLink>
              <NavLink href="/gaps" current={pathname}>
                Learning Gaps
              </NavLink>
              <NavLink href="/chat" current={pathname}>
                Chat
              </NavLink>

            </nav>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
              <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: string | null;
  children: React.ReactNode;
}) {
  const active = current?.startsWith(href) ?? false;
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-2.5 py-1.5 transition-colors",
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
