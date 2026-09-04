import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Syncopate } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { AgentCopilot } from "@/components/agent-copilot";
import { NavDrawer } from "@/components/nav-drawer";
import { TodoDrawer } from "@/components/todo-drawer";

import { SmoothScrollProvider } from "@/components/smooth-scroll-provider";

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
  title: {
    default: "Polaris — Grounded AI Academic Platform",
    template: "%s | Polaris Academic",
  },
  description:
    "Autonomous academic intelligence engine powered by Grounded RAG, WebGL Shaders, and Knowledge Graph vector indexing for verified citations and prerequisite gap analysis.",
  keywords: [
    "Polaris",
    "Academic Intelligence",
    "Grounded RAG",
    "Prerequisite Gap Analysis",
    "Knowledge Graph",
    "Autonomous Study Plans",
    "Citation Verification",
    "Interactive Syllabus",
  ],
  authors: [{ name: "Polaris Core Intelligence" }],
  creator: "Polaris Intelligence Labs",
  publisher: "Polaris",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/polaris-standalone.png",
    shortcut: "/polaris-standalone.png",
    apple: "/polaris-standalone.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://polaris.academy",
    title: "Polaris — Grounded AI Academic Platform",
    description:
      "Autonomous academic intelligence engine powered by Grounded RAG, WebGL Shaders, and Knowledge Graph vector indexing.",
    siteName: "Polaris",
    images: [
      {
        url: "/polaris-standalone.png",
        width: 1200,
        height: 630,
        alt: "Polaris Academic Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Polaris — Grounded AI Academic Platform",
    description:
      "Autonomous academic intelligence engine powered by Grounded RAG, WebGL Shaders, and Knowledge Graph vector indexing.",
    images: ["/polaris-standalone.png"],
    creator: "@PolarisAcademic",
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
            <SmoothScrollProvider>
              <div className="relative z-10 pointer-events-auto min-h-screen flex flex-col">{children}</div>
              <NavDrawer />
              <TodoDrawer />
              <AgentCopilot />
              <Toaster position="bottom-right" />
            </SmoothScrollProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
