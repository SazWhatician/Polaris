"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogIn, ShieldCheck, Zap, Layers } from "lucide-react";

import { AnimatedShaderHero } from "@/components/ui/animated-shader-hero";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const handlePrimaryClick = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const handleSecondaryClick = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen text-foreground relative flex flex-col justify-between overflow-x-hidden selection:bg-purple-500 selection:text-white">
      {/* Top Floating Glassmorphism Header */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 flex items-center justify-center overflow-hidden shadow-xl group-hover:scale-105 transition-transform">
            <Image
              src="/polaris-logo.png"
              alt="Polaris Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="font-black text-xl tracking-wider text-slate-900 dark:text-white drop-shadow">
            POLARIS
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-purple-500/25 border border-purple-300/30"
            >
              <span>Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md transition-all hover:scale-105 shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In / Register</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Animated Full-Page Shader Section */}
      <main className="flex-1 w-full relative z-10">
        <AnimatedShaderHero
          fullPage
          trustBadge={{
            text: "Multimodal Grounded RAG Platform",
            icons: ["✨", "🚀", "🪐"],
          }}
          title="POLARIS"
          subtitle="Supercharge your academic workflow with grounded vector search, instant PDF citations, automated gap analysis, and interactive knowledge graphs."
          buttons={{
            primary: {
              text: user ? "Enter Workspace" : "Get Started Free",
              onClick: handlePrimaryClick,
            },
            secondary: {
              text: "Sign In / Register",
              onClick: handleSecondaryClick,
            },
          }}
        />

        {/* Feature Grid Below Shader Hero */}
        <section className="relative z-20 py-20 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 p-8 rounded-3xl bg-white/70 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Academic Research & Intelligence Engine
            </h2>
            <p className="text-slate-600 dark:text-gray-300 text-sm sm:text-base font-medium">
              Polaris indexes your course notes, textbooks, and syllabi to provide cited answers, identify learning gaps, and structure automated revision plans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />}
              title="Grounded RAG Search"
              description="Ask complex questions and receive precise, page-level citations from your own uploaded PDF notes and textbooks."
            />
            <FeatureCard
              icon={<Layers className="h-6 w-6 text-purple-500 dark:text-purple-400" />}
              title="Knowledge Graph Indexing"
              description="Automatically extract concept nodes, prerequisite relationships, and community clusters from your syllabus."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-6 w-6 text-pink-500 dark:text-pink-400" />}
              title="Multimodal Gap Analysis"
              description="Detect missing prerequisite concepts in your knowledge base and receive curated educational YouTube recommendations."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-lg py-8 text-center text-xs text-slate-600 dark:text-gray-400 font-mono">
        Polaris Academic RAG Engine • Powered by Next.js, Qdrant & Gemini
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-3xl bg-white/70 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-white/10 shadow-xl backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 group">
      <div className="p-3 w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">{description}</p>
    </div>
  );
}
