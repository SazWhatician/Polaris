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
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { useAuth } from "@/lib/auth-context";
import {
  NotchLeftWing,
  NotchRightWing,
} from "@/components/ui/adaptive-notch-navigation-bar";
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
  const [contactSent, setContactSent] = useState<boolean>(false);
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactMessage, setContactMessage] = useState<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (resolvedTheme || theme) : "dark";

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
        className="fixed top-0 inset-x-0 z-[90] flex justify-center pointer-events-none px-2 sm:px-4 select-none"
      >
        <div className="relative pointer-events-auto flex items-start">
          
          {/* Left Inverted Wing */}
          <NotchLeftWing position="top" className="text-white fill-current drop-shadow-sm hidden md:block" />

          {/* Main White Notch Body */}
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-2.5 bg-white text-slate-900 rounded-b-[24px] sm:rounded-b-[32px] shadow-[0_16px_50px_rgba(0,0,0,0.35)] border-b border-x border-slate-100">
            
            {/* Left Brand Slot: POLARIS MONOCHROME LOGO */}
            <Link
              href="/"
              id="landing-nav-logo"
              data-testid="landing-nav-logo"
              className="flex items-center pr-2 sm:pr-3 border-r border-slate-200 group"
            >
              <Image
                src="/polaris-monochrome.png"
                alt="Polaris Logo"
                width={120}
                height={32}
                priority
                className="h-6 sm:h-7.5 w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </Link>

            {/* Center Navigation Links: Home, About, Contact Us */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* 1. Home */}
              <button
                id="landing-nav-home"
                data-testid="landing-nav-home"
                type="button"
                onClick={() => handleNavSelect("home")}
                className={cn(
                  "flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                  activeId === "home"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                )}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>

              {/* 2. About */}
              <button
                id="landing-nav-about"
                data-testid="landing-nav-about"
                type="button"
                onClick={() => handleNavSelect("about")}
                className={cn(
                  "flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                  activeId === "about"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                )}
              >
                <Info className="w-3.5 h-3.5" />
                <span>About</span>
              </button>

              {/* 3. Contact us */}
              <button
                id="landing-nav-contact"
                data-testid="landing-nav-contact"
                type="button"
                onClick={() => handleNavSelect("contact")}
                className={cn(
                  "flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                  activeId === "contact"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
                )}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact us</span>
              </button>
            </div>

            {/* Right Group: Theme Switcher + Login / Dashboard CTA */}
            <div className="pl-2 border-l border-slate-200 flex items-center gap-2">
              
              {/* THEME TOGGLE BUTTON */}
              <button
                id="landing-theme-toggle"
                data-testid="landing-theme-toggle"
                type="button"
                onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-950 hover:bg-slate-100 active:scale-95 transition-all"
                title={`Switch to ${currentTheme === "dark" ? "Light" : "Dark"} Mode`}
                aria-label="Toggle Theme"
              >
                {currentTheme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-500 stroke-[2.2] animate-in spin-in-90 duration-300" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 stroke-[2.2] animate-in spin-in-90 duration-300" />
                )}
              </button>

              {/* Login / Dashboard Action */}
              {user ? (
                <Link
                  href="/dashboard"
                  id="landing-nav-dashboard"
                  data-testid="landing-nav-dashboard"
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-sm group"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="bg-gradient-to-r from-white via-amber-200 to-white bg-clip-text text-transparent font-extrabold tracking-wide">
                    Dashboard
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  id="landing-nav-login"
                  data-testid="landing-nav-login"
                  className="relative group overflow-hidden flex items-center gap-1.5 px-4 sm:px-5 py-1.5 rounded-full bg-slate-950 text-white text-xs font-extrabold transition-all hover:scale-105 active:scale-95 shadow-md border border-slate-800"
                >
                  {/* Shimmer ambient sweep beam */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                  {/* Shimmering Text */}
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-300 bg-[length:200%_auto] animate-[shimmer_2.5s_linear_infinite] bg-clip-text text-transparent font-black tracking-wider uppercase drop-shadow-xs">
                    Login
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>

          {/* Right Inverted Wing */}
          <NotchRightWing position="top" className="text-white fill-current drop-shadow-sm hidden md:block" />
        </div>
      </header>

      {/* CONTACT US DIALOG MODAL */}
      <Dialog open={showContact} onOpenChange={setShowContact}>
        <DialogContent
          id="dialog-contact-modal"
          data-testid="dialog-contact-modal"
          className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border/80 text-foreground rounded-3xl p-6 shadow-2xl"
        >
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase">
              <Mail className="w-4 h-4" />
              <span>Direct Comms Channel</span>
            </div>
            <DialogTitle className="text-xl font-black pt-1">
              Contact Polaris Team
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Have questions, feedback, or campus deployment requests? Send us a direct dispatch.
            </DialogDescription>
          </DialogHeader>

          {contactSent ? (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-foreground">Message Transmitted!</h4>
              <p className="text-xs text-muted-foreground max-w-xs">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-xs"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-xs resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContact(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
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
