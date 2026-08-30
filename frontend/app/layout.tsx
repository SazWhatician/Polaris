import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Syncopate } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { ShaderBackground } from "@/components/shader-background";
import { AgentCopilot } from "@/components/agent-copilot";
import { NavDrawer } from "@/components/nav-drawer";
import { TodoDrawer } from "@/components/todo-drawer";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const syncopate = Syncopate({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-syncopate",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Polaris — Grounded AI Academic Platform",
  description: "Autonomous academic intelligence engine powered by Grounded RAG, WebGL Shaders & Vector Indexing.",
  icons: {
    icon: "/polaris-standalone.png",
    shortcut: "/polaris-standalone.png",
    apple: "/polaris-standalone.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${jakarta.variable} ${syncopate.variable} font-sans relative text-foreground min-h-screen antialiased selection:bg-primary/30 selection:text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <ShaderBackground />
            <div className="relative z-10 pointer-events-auto min-h-screen flex flex-col">{children}</div>
            <NavDrawer />
            <TodoDrawer />
            <AgentCopilot />
            <Toaster position="bottom-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
