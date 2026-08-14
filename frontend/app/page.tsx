"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogIn, ShieldCheck, Zap, Layers } from "lucide-react";

import { AnimatedShaderHero } from "@/components/ui/animated-shader-hero";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card } from "@/components/ui/card";

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
    <div className="min-h-screen text-foreground relative flex flex-col justify-between overflow-x-hidden selection:bg-primary/30 selection:text-foreground">
      {/* Top Floating Glassmorphism Header */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/80 flex items-center justify-center overflow-hidden shadow-xl group-hover:scale-105 transition-transform">
            <Image
              src="/polaris-logo.png"
              alt="Polaris Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="font-black text-xl tracking-wider text-foreground drop-shadow">
            POLARIS
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20 border border-primary/30"
            >
              <span>Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-full bg-card/80 hover:bg-card border border-border/80 text-foreground font-bold text-xs flex items-center gap-2 backdrop-blur-xl transition-all hover:scale-105 shadow-sm"
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
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 p-8 rounded-3xl bg-card/75 border border-border/80 backdrop-blur-2xl shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Academic Research & Intelligence Engine
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base font-medium">
              Polaris indexes your course notes, textbooks, and syllabi to provide cited answers, identify learning gaps, and structure automated revision plans.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-primary" />}
              title="Grounded RAG Search"
              description="Ask complex questions and receive precise, page-level citations from your own uploaded PDF notes and textbooks."
            />
            <FeatureCard
              icon={<Layers className="h-6 w-6 text-primary" />}
              title="Knowledge Graph Indexing"
              description="Automatically extract concept nodes, prerequisite relationships, and community clusters from your syllabus."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-6 w-6 text-primary" />}
              title="Multimodal Gap Analysis"
              description="Detect missing prerequisite concepts in your knowledge base and receive curated educational YouTube recommendations."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-border/80 bg-card/60 backdrop-blur-xl py-8 text-center text-xs text-muted-foreground font-mono">
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
    <Card className="relative p-7 rounded-2xl bg-card/75 border border-border/80 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-primary/50 group overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="p-3 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-extrabold text-foreground tracking-tight mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed font-normal">
        {description}
      </p>
    </Card>
  );
}
