"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BookOpen, ChevronRight, Layers } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SyllabusPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <SiteHeader />
      <main className="container max-w-5xl space-y-8 py-10 px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-indigo-400" />
              <span>Syllabus Intelligence</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Extract structured topic trees from uploaded course syllabi & track coverage metrics.
            </p>
          </div>
        </div>

        {/* Syllabus Demo/Mock Tree */}
        <Card className="glass-panel border-white/10 p-6 space-y-6">
          <CardHeader className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">CS 301 — Data Structures & Algorithms</CardTitle>
                <CardDescription className="text-slate-400 text-sm mt-1">
                  Topic hierarchy extracted from syllabus PDF. Overall coverage: 82%
                </CardDescription>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                82% Covered
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4 pt-4">
            <TopicNode
              title="1. Tree Data Structures"
              coverage={90}
              subtopics={[
                { title: "Binary Search Trees (BST)", coverage: 95 },
                { title: "AVL Trees & Self-Balancing", coverage: 85 },
                { title: "Red-Black Trees", coverage: 70 },
              ]}
            />

            <TopicNode
              title="2. Graph Algorithms"
              coverage={75}
              subtopics={[
                { title: "Breadth-First Search (BFS) & DFS", coverage: 100 },
                { title: "Dijkstra's Shortest Path", coverage: 80 },
                { title: "Minimum Spanning Trees (Prim / Kruskal)", coverage: 45 },
              ]}
            />

            <TopicNode
              title="3. Dynamic Programming"
              coverage={60}
              subtopics={[
                { title: "Memoization vs Tabulation", coverage: 80 },
                { title: "0/1 Knapsack Problem", coverage: 50 },
                { title: "Longest Common Subsequence (LCS)", coverage: 50 },
              ]}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function TopicNode({
  title,
  coverage,
  subtopics,
}: {
  title: string;
  coverage: number;
  subtopics: { title: string; coverage: number }[];
}) {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-slate-100">
          <Layers className="h-4 w-4 text-indigo-400" />
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
              style={{ width: `${coverage}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-slate-300 w-10 text-right">{coverage}%</span>
        </div>
      </div>

      <div className="pl-6 space-y-2 border-l border-white/10 pt-2">
        {subtopics.map((sub, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              <span>{sub.title}</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                sub.coverage >= 80
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : sub.coverage >= 60
                  ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {sub.coverage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
