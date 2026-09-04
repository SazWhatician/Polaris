"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme();
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/90 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-foreground group-[.toaster]:border-white/15 group-[.toaster]:rounded-2xl group-[.toaster]:shadow-[0_20px_50px_rgba(0,0,0,0.6)] group-[.toaster]:p-4",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:font-light",
          title: "group-[.toast]:text-xs group-[.toast]:font-bold group-[.toast]:tracking-tight",
          actionButton:
            "group-[.toast]:bg-white group-[.toast]:text-black group-[.toast]:font-bold group-[.toast]:rounded-xl group-[.toast]:text-xs hover:group-[.toast]:bg-slate-200 transition-colors",
          cancelButton:
            "group-[.toast]:bg-white/10 group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl group-[.toast]:text-xs hover:group-[.toast]:text-foreground",
          success:
            "group-[.toaster]:border-emerald-500/30 group-[.toaster]:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
          error:
            "group-[.toaster]:border-rose-500/30 group-[.toaster]:shadow-[0_0_30px_rgba(244,63,94,0.15)]",
          info:
            "group-[.toaster]:border-primary/30 group-[.toaster]:shadow-[0_0_30px_rgba(99,102,241,0.15)]",
        },
      }}
      {...props}
    />
  );
}
