"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Activity, RefreshCw, Sparkles, Target, Calendar, MessageSquare, FileText } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { KnowledgeGraphViewer } from "@/components/knowledge-graph-viewer";
import { ThemeDial, SkeuoScrews } from "@/components/skeuomorphic-controls";
import { useAuth } from "@/lib/auth-context";
import { fetchLatestGraph, extractKnowledgeGraph, type KnowledgeGraph } from "@/lib/api/graph";
import { useGsapEntrance } from "@/lib/use-gsap-animations";

export default function GraphPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [fetching, setFetching] = useState(true);
  const [extracting, setExtracting] = useState(false);

  const containerRef = useGsapEntrance(".gsap-graph", 0.05);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  const loadGraph = async () => {
    setFetching(true);
    try {
      const data = await fetchLatestGraph();
      setGraph(data);
    } catch (err) {
      toast.error("Failed to load Knowledge Graph", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) void loadGraph();
  }, [user]);

  const handleReExtract = async () => {
    setExtracting(true);
    try {
      await extractKnowledgeGraph();
      toast.success("Knowledge Graph Updated!");
      await loadGraph();
    } catch (err) {
      toast.error("Extraction failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setExtracting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen text-foreground pb-16">
      <SiteHeader />

      <main ref={containerRef} className="max-w-7xl mx-auto space-y-8 py-8 px-4 sm:px-8">
        
        {/* Step-by-Step Academic Workflow Header */}
        <div className="gsap-graph skeuo-card p-6 text-xs relative">
          <SkeuoScrews />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-indigo-400 font-bold uppercase tracking-wider mb-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Polaris AI Step 5: Knowledge Graph Engine</span>
              </div>
              <h2 className="text-lg font-extrabold text-foreground">Interactive Concept Map & Prerequisite Graph</h2>
            </div>

            <div className="flex items-center gap-3">
              <ThemeDial />
              <button
                onClick={handleReExtract}
                disabled={extracting}
                className="skeuo-button text-xs py-2 px-4 font-bold flex items-center gap-2"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${extracting ? "animate-spin" : ""}`} />
                <span>{extracting ? "Extracting Graph..." : "Re-Extract Graph"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <WorkflowStep number="1" label="Upload Docs" href="/dashboard" icon={<FileText className="h-3.5 w-3.5 text-indigo-400" />} />
            <WorkflowStep number="2" label="Grounded RAG" href="/chat" icon={<MessageSquare className="h-3.5 w-3.5 text-purple-400" />} />
            <WorkflowStep number="3" label="Gaps & YT" href="/gaps" icon={<Target className="h-3.5 w-3.5 text-pink-400" />} />
            <WorkflowStep number="4" label="Revision Plan" href="/plan" icon={<Calendar className="h-3.5 w-3.5 text-cyan-400" />} />
            <WorkflowStep active number="5" label="Knowledge Graph" href="/graph" icon={<Layers className="h-3.5 w-3.5 text-emerald-400" />} />
          </div>
        </div>

        {/* Header Block & Telemetry Cards */}
        <div className="gsap-graph grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            label="Total Concepts"
            value={graph ? graph.nodes.length.toString() : "0"}
            subText="Extracted Concept Nodes"
            icon={<Layers className="h-5 w-5 text-indigo-400" />}
          />
          <StatTile
            label="Prerequisite Edges"
            value={graph ? graph.edges.length.toString() : "0"}
            subText="Inter-concept Relationships"
            icon={<Activity className="h-5 w-5 text-emerald-400" />}
          />
          <StatTile
            label="Community Clusters"
            value={graph ? graph.clusters.length.toString() : "0"}
            subText="Graph Clusters Formed"
            icon={<Sparkles className="h-5 w-5 text-purple-400" />}
          />
        </div>

        {/* Knowledge Graph Viewer Canvas */}
        <div className="gsap-graph space-y-4">
          {fetching ? (
            <div className="skeuo-card p-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
              <span>Constructing Knowledge Graph Visualization...</span>
            </div>
          ) : graph ? (
            <KnowledgeGraphViewer graph={graph} />
          ) : null}
        </div>
      </main>
    </div>
  );
}

function WorkflowStep({
  number,
  label,
  href,
  icon,
  active = false,
}: {
  number: string;
  label: string;
  href: React.ComponentProps<typeof Link>["href"];
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all text-xs font-semibold select-none ${
        active
          ? "skeuo-button text-white font-bold"
          : "skeuo-inset hover:text-foreground"
      }`}
    >
      <span className={`w-5 h-5 rounded-full text-[11px] font-mono font-bold flex items-center justify-center ${
        active ? "bg-white text-indigo-700" : "bg-white/10 text-muted-foreground"
      }`}>
        {number}
      </span>
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}

function StatTile({
  label,
  value,
  subText,
  icon,
}: {
  label: string;
  value: string;
  subText: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="skeuo-card p-5 flex items-center justify-between relative overflow-hidden">
      <SkeuoScrews />
      <div className="flex items-center gap-3.5">
        <div className="p-3 skeuo-inset">{icon}</div>
        <div>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground">{subText}</p>
        </div>
      </div>
    </div>
  );
}
