"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Info,
  Mail,
  ArrowUpRight,
  Sparkles,
  Send,
  CheckCircle2,
  Moon,
  Sun,
  Menu,
  X,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { useAuth } from "@/lib/auth-context";
import { NotchLeftWing, NotchRightWing } from "@/components/ui/adaptive-notch-navigation-bar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function NotchNavbar() {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string>("home");
  const [showContact, setShowContact] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [contactSent, setContactSent] = useState<boolean>(false);
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactMessage, setContactMessage] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? resolvedTheme || theme : "dark";

  const handleNavSelect = (id: string) => {
    setActiveId(id);
    if (id === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (id === "about") {
      const el = document.getElementById("features-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
      }
    } else if (id === "contact") {
      setShowContact(true);
    }
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail || !contactMessage) {
      toast.error("Please fill in both email and message");
      return;
    }
    setContactSent(true);
    toast.success("Message transmitted to Polaris Core!");
    setTimeout(() => {
      setShowContact(false);
      setContactSent(false);
      setContactEmail("");
      setContactMessage("");
    }, 1800);
  };

  return (
    <>
      <header
        id="landing-notch-navbar"
        data-testid="landing-notch-navbar"
        className="pointer-events-none fixed inset-x-0 top-0 z-[90] mx-auto flex max-w-[calc(100vw-1rem)] select-none flex-col items-center px-2 sm:px-4"
      >
        <div className="pointer-events-auto relative flex items-start">
          {/* Left Inverted Wing (desktop only) */}
          <NotchLeftWing
            position="top"
            className="hidden fill-current text-white drop-shadow-sm md:block"
          />

          {/* Main White Notch Body */}
          <div className="flex max-w-full items-center gap-2 rounded-b-[20px] border-x border-b border-slate-100 bg-white px-3 py-2 text-slate-900 shadow-[0_16px_50px_rgba(0,0,0,0.35)] sm:gap-4 sm:rounded-b-[32px] sm:px-6 sm:py-2.5">
            {/* Left Brand Slot: POLARIS MONOCHROME LOGO */}
            <Link
              href="/"
              id="landing-nav-logo"
              data-testid="landing-nav-logo"
              onClick={() => setMobileMenuOpen(false)}
              className="group flex items-center border-r border-slate-200 pr-2 sm:pr-3"
            >
              <Image
                src="/polaris-monochrome.png"
                alt="Polaris Logo"
                width={120}
                height={32}
                priority
                className="h-5.5 sm:h-7.5 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Desktop Center Navigation Links (hidden on mobile) */}
            <div className="hidden items-center gap-1 sm:gap-2 md:flex">
              <button
                id="landing-nav-home"
                data-testid="landing-nav-home"
                type="button"
                onClick={() => handleNavSelect("home")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all sm:px-4",
                  activeId === "home"
                    ? "shadow-xs bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </button>

              <button
                id="landing-nav-about"
                data-testid="landing-nav-about"
                type="button"
                onClick={() => handleNavSelect("about")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all sm:px-4",
                  activeId === "about"
                    ? "shadow-xs bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                <Info className="h-3.5 w-3.5" />
                <span>About</span>
              </button>

              <button
                id="landing-nav-contact"
                data-testid="landing-nav-contact"
                type="button"
                onClick={() => handleNavSelect("contact")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all sm:px-4",
                  activeId === "contact"
                    ? "shadow-xs bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Contact us</span>
              </button>
            </div>

            {/* Desktop Right Group: Theme Switcher + Auth CTA */}
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-2 md:flex">
              <button
                id="landing-theme-toggle"
                data-testid="landing-theme-toggle"
                type="button"
                onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-950 active:scale-95"
                title={`Switch to ${currentTheme === "dark" ? "Light" : "Dark"} Mode`}
                aria-label="Toggle Theme"
              >
                {currentTheme === "dark" ? (
                  <Sun className="h-4 w-4 stroke-[2.2] text-amber-500 duration-300 animate-in spin-in-90" />
                ) : (
                  <Moon className="h-4 w-4 stroke-[2.2] text-slate-700 duration-300 animate-in spin-in-90" />
                )}
              </button>

              {user ? (
                <Link
                  href="/dashboard"
                  id="landing-nav-dashboard"
                  data-testid="landing-nav-dashboard"
                  className="group flex items-center gap-1.5 rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-105 hover:bg-slate-800 active:scale-95 sm:px-4"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span className="bg-gradient-to-r from-white via-amber-200 to-white bg-clip-text font-extrabold tracking-wide text-transparent">
                    Dashboard
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-amber-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Link
                    href="/login"
                    id="landing-nav-login"
                    data-testid="landing-nav-login"
                    className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-950 active:scale-95 sm:px-3"
                  >
                    <span>Login</span>
                  </Link>

                  <Link
                    href="/login?mode=signup"
                    id="landing-nav-signup"
                    data-testid="landing-nav-signup"
                    className="group relative flex items-center gap-1.5 overflow-hidden rounded-full border border-slate-800 bg-slate-950 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-md transition-all hover:scale-105 active:scale-95 sm:px-4"
                  >
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-400" />
                    <span className="drop-shadow-xs animate-[shimmer_2.5s_linear_infinite] bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300 bg-[length:200%_auto] bg-clip-text font-black uppercase tracking-wider text-transparent">
                      Sign Up
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-amber-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions: Theme Switcher + Hamburger Button */}
            <div className="flex items-center gap-1 pl-1 md:hidden">
              <button
                id="mobile-theme-toggle"
                data-testid="mobile-theme-toggle"
                type="button"
                onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-950 active:scale-95"
                title={`Switch to ${currentTheme === "dark" ? "Light" : "Dark"} Mode`}
                aria-label="Toggle Theme"
              >
                {currentTheme === "dark" ? (
                  <Sun className="h-4 w-4 stroke-[2.2] text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 stroke-[2.2] text-slate-700" />
                )}
              </button>

              <button
                id="mobile-menu-toggle"
                data-testid="mobile-menu-toggle"
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="shadow-xs flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white transition-all hover:bg-slate-800 active:scale-95"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Right Inverted Wing (desktop only) */}
          <NotchRightWing
            position="top"
            className="hidden fill-current text-white drop-shadow-sm md:block"
          />
        </div>

        {/* MOBILE FLOATING GLASS MENU SHEET */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-dropdown"
            data-testid="mobile-nav-dropdown"
            className="pointer-events-auto mt-2 flex w-full max-w-xs flex-col gap-3 rounded-3xl border border-white/15 bg-card/95 p-4 text-foreground shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl duration-300 animate-in fade-in slide-in-from-top-4 sm:max-w-sm"
          >
            {/* Quick Links List */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  handleNavSelect("home");
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-colors",
                  activeId === "home"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted/60",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </div>
                <span className="font-mono text-[10px] opacity-60">01</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleNavSelect("about");
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-colors",
                  activeId === "about"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted/60",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Info className="h-4 w-4" />
                  <span>About & Architecture</span>
                </div>
                <span className="font-mono text-[10px] opacity-60">02</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleNavSelect("contact");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/60"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4" />
                  <span>Contact Team</span>
                </div>
                <span className="font-mono text-[10px] opacity-60">03</span>
              </button>

              <Link
                href="/demo"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/60"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="h-4 w-4 text-primary" />
                  <span>Interactive Demo</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
              </Link>
            </div>

            {/* Mobile Auth Divider & CTAs */}
            <div className="flex flex-col gap-2 border-t border-border/60 pt-2">
              {user ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-xs font-bold text-black shadow-lg transition-colors hover:bg-slate-200"
                >
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <span>Open Workspace Dashboard</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-2xl border border-border/80 bg-muted/40 py-2.5 text-xs font-bold text-foreground transition-colors hover:bg-muted"
                  >
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-opacity hover:opacity-90"
                  >
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* CONTACT US DIALOG MODAL */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent
          id="dialog-contact-modal"
          data-testid="dialog-contact-modal"
          className="rounded-3xl border-border/80 bg-card/95 p-6 text-foreground shadow-2xl backdrop-blur-2xl sm:max-w-md"
        >
          <DialogHeader>
            <div className="flex items-center gap-2 font-mono text-xs uppercase text-primary">
              <Mail className="h-4 w-4" />
              <span>Direct Comms Channel</span>
            </div>
            <DialogTitle className="pt-1 text-xl font-black">Contact Polaris Team</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Have questions, feedback, or campus deployment requests? Send us a direct dispatch.
            </DialogDescription>
          </DialogHeader>

          {contactSent ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center animate-in fade-in zoom-in-95">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-foreground">Message Transmitted!</h4>
              <p className="max-w-xs text-xs text-muted-foreground">
                Our academic engineers will reach back out to your inbox shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendContact} className="space-y-4 pt-2 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Your Academic Email</label>
                <input
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="focus:outline-hidden w-full rounded-xl border border-border/80 bg-muted/40 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Inquiry or Feedback</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tell us what you'd like to see in Polaris..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="focus:outline-hidden w-full resize-none rounded-xl border border-border/80 bg-muted/40 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContact(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Dispatch</span>
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
