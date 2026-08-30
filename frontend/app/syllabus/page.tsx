"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Layers,
  Target,
  CheckCircle2,
  ArrowRight,
  Search,
  BookMarked,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useGsapEntrance } from "@/lib/use-animation-system";
import { cn } from "@/lib/utils";

interface SubTopic {
  title: string;
  coverage: number;
  status: "mastered" | "learning" | "gap";
  notes?: string;
}

interface ModuleNode {
  id: string;
  title: string;
  code: string;
  coverage: number;
  subtopics: SubTopic[];
}

const SYLLABUS_MODULES: ModuleNode[] = [
  {
    id: "mod-1",
    code: "UNIT I",
    title: "Tree Data Structures & Self-Balancing",
    coverage: 90,
    subtopics: [
      { title: "Binary Search Trees (BST) & Invariants", coverage: 95, status: "mastered", notes: "Cited in Lecture 3 PDF" },
      { title: "AVL Trees & Self-Balancing Rotations", coverage: 85, status: "mastered", notes: "Cited in Lecture 4 PDF" },
      { title: "Red-Black Trees & Color Properties", coverage: 70, status: "learning", notes: "Needs review on deletion" },
      { title: "B-Trees & Multiway Search Indexing", coverage: 88, status: "mastered", notes: "Database indexing chapter" },
    ],
  },
  {
    id: "mod-2",
    code: "UNIT II",
    title: "Advanced Graph Algorithms & Network Flows",
    coverage: 75,
    subtopics: [
      { title: "Breadth-First Search (BFS) & Topological Sort", coverage: 100, status: "mastered", notes: "Fully mapped in Qdrant" },
      { title: "Dijkstra's Single-Source Shortest Path", coverage: 80, status: "mastered", notes: "Lecture 8 notes" },
      { title: "Minimum Spanning Trees (Prim / Kruskal)", coverage: 45, status: "gap", notes: "Identified gap in tutorial 3" },
      { title: "Bellman-Ford & Negative Weight Cycles", coverage: 65, status: "learning", notes: "Algorithm assignment 2" },
    ],
  },
  {
    id: "mod-3",
    code: "UNIT III",
    title: "Dynamic Programming & Optimization",
    coverage: 68,
    subtopics: [
      { title: "Memoization vs Bottom-up Tabulation", coverage: 85, status: "mastered", notes: "Complete coverage" },
      { title: "0/1 Knapsack & Subset Sum Reductions", coverage: 55, status: "gap", notes: "Recommended YT lecture queued" },
      { title: "Longest Common Subsequence (LCS) & Alignment", coverage: 75, status: "learning", notes: "Lecture 12" },
      { title: "Matrix Chain Multiplication & DP On Trees", coverage: 40, status: "gap", notes: "Missing in current notes" },
    ],
  },
];

export default function SyllabusPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    "mod-1": true,
    "mod-2": true,
    "mod-3": true,
  });

  const containerRef = useGsapEntrance(".gsap-syllabus", 0.05);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  if (loading || !user) return null;

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredModules = SYLLABUS_MODULES.map((m) => ({
    ...m,
    subtopics: m.subtopics.filter((s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((m) => m.subtopics.length > 0 || !searchQuery);

  const totalTopics = SYLLABUS_MODULES.reduce((acc, m) => acc + m.subtopics.length, 0);
  const masteredTopics = SYLLABUS_MODULES.reduce(
    (acc, m) => acc + m.subtopics.filter((s) => s.status === "mastered").length,
    0
  );

  return (
    <div className="min-h-screen text-foreground pb-32">
      <SiteHeader />
      <main ref={containerRef} className="max-w-7xl mx-auto space-y-8 py-8 px-4 sm:px-6 lg:px-8">
        {/* Standardized Page Header */}
        <div className="gsap-syllabus">
          <PageHeader
            category="CORE WORKSPACE // SYLLABUS"
            title="Syllabus Intelligence"
            description="Structured hierarchical topic trees extracted from syllabus PDFs with vector coverage tracking and automated prerequisite mapping."
            icon={BookOpen}
            badgeText="CS 301 Active Curriculum"
            badgeVariant="indigo"
            actions={
              <Link href="/gaps">
                <Button size="sm" className="gap-2 text-xs font-bold rounded-xl">
                  <Target className="h-4 w-4" />
                  <span>Run Gap Analysis</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            }
          />
        </div>

        {/* Telemetry Stats Grid */}
        <div className="gsap-syllabus grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            label="Overall Curriculum Coverage"
            numericValue={82}
            value="82%"
            suffix="%"
            icon={BookMarked}
            colorScheme="emerald"
            trend="+8% this week"
            trendPositive
            tag="Exam Ready"
          />
          <StatCard
            label="Mastered Topics"
            numericValue={masteredTopics}
            value={`${masteredTopics}/${totalTopics}`}
            suffix={` / ${totalTopics}`}
            icon={CheckCircle2}
            colorScheme="primary"
            trend="High Confidence"
            trendPositive
            tag="Verified in Notes"
          />
          <StatCard
            label="Extracted Units & Modules"
            numericValue={SYLLABUS_MODULES.length}
            value={SYLLABUS_MODULES.length.toString()}
            icon={Layers}
            colorScheme="purple"
            trend="Multi-topic Tree"
            trendPositive
            tag="Vector Chunked"
          />
        </div>

        {/* Search & Tree View Container */}
        <div className="gsap-syllabus space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, algorithms, or concepts..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-card/75 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground font-mono text-[11px]">Legend:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                Mastered (&gt;80%)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                In Review
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                Gap Detected
              </span>
            </div>
          </div>

          {/* Module Nodes Accordion */}
          <div className="space-y-4">
            {filteredModules.map((module) => {
              const isExpanded = expandedModules[module.id];

              return (
                <Card
                  key={module.id}
                  className="rounded-3xl bg-card/75 border border-border/80 backdrop-blur-2xl shadow-xl overflow-hidden transition-all duration-200"
                >
                  {/* Module Header Bar */}
                  <div
                    onClick={() => toggleModule(module.id)}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3.5">
                      <button className="p-1 rounded-lg bg-muted/60 text-muted-foreground">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            {module.code}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-foreground">
                            {module.title}
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {module.subtopics.length} concept nodes mapped
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Badge */}
                    <div className="flex items-center gap-4 pl-8 sm:pl-0">
                      <div className="w-36 sm:w-48 bg-muted/60 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-500"
                          style={{ width: `${module.coverage}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-primary w-12 text-right">
                        {module.coverage}%
                      </span>
                    </div>
                  </div>

                  {/* Subtopics List */}
                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-border/40 space-y-2.5 bg-muted/10">
                      {module.subtopics.map((sub, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-card/60 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {sub.title}
                              </p>
                              {sub.notes && (
                                <p className="text-[10px] text-muted-foreground font-mono truncate">
                                  {sub.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                            <span
                              className={cn(
                                "text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border",
                                sub.status === "mastered"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : sub.status === "learning"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              )}
                            >
                              {sub.status === "mastered"
                                ? "Mastered"
                                : sub.status === "learning"
                                ? "In Review"
                                : "Gap Detected"}
                            </span>

                            <span className="text-xs font-mono font-bold text-muted-foreground w-10 text-right">
                              {sub.coverage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
