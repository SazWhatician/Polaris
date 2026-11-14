"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Activity, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KnowledgeGraphViewer } from "@/components/knowledge-graph-viewer";
import { useAuth } from "@/lib/auth-context";
import { fetchLatestGraph, extractKnowledgeGraph, type KnowledgeGraph } from "@/lib/api/graph";
import { useGsapEntrance } from "@/lib/use-animation-system";

export default function GraphPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [fetching, setFetching] = useState(true);
  const [extracting, setExtracting] = useState(false);

  const containerRef = useGsapEntrance(".gsap-graph", 0.05);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
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
    <div className="min-h-screen pb-32 pt-14 text-foreground selection:bg-primary/30 selection:text-foreground sm:pt-16">
      <SiteHeader />

      <main ref={containerRef} className="mx-auto max-w-7xl space-y-6 px-3 py-4 sm:px-6 lg:px-8">
        {/* Standardized Page Header */}
        <div className="gsap-graph">
          <PageHeader
            category="ACADEMIC INTELLIGENCE // KNOWLEDGE GRAPH"
            title="Interactive Concept Map & Graph"
            description="Extract concept nodes, prerequisite hierarchies, and community clusters directly from indexed course documents."
            icon={Layers}
            badgeText="Network Graph Engine"
            badgeVariant="indigo"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={handleReExtract}
                disabled={extracting}
                className="gap-2 rounded-xl border-border/80 text-xs font-bold hover:bg-muted/80"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${extracting ? "animate-spin text-primary" : ""}`}
                />
                <span>{extracting ? "Extracting Graph..." : "Re-Extract Graph"}</span>
              </Button>
            }
          />
        </div>

        {/* Header Block & Telemetry Cards */}
        <div className="gsap-graph grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <StatCard
            label="Total Concepts"
            numericValue={graph ? graph.nodes.length : 0}
            value={graph ? graph.nodes.length.toString() : "0"}
            icon={Layers}
            colorScheme="primary"
            trend="Active Nodes"
            trendPositive
            tag="Vectorized"
          />
          <StatCard
            label="Prerequisite Edges"
            numericValue={graph ? graph.edges.length : 0}
            value={graph ? graph.edges.length.toString() : "0"}
            icon={Activity}
            colorScheme="emerald"
            trend="Directed Links"
            trendPositive
            tag="DAG Tree"
          />
          <StatCard
            label="Community Clusters"
            numericValue={graph ? graph.clusters.length : 0}
            value={graph ? graph.clusters.length.toString() : "0"}
            icon={Sparkles}
            colorScheme="purple"
            trend="Louvain Partition"
            trendPositive
            tag="Clustered"
          />
        </div>

        {/* Knowledge Graph Viewer Canvas */}
        <div className="gsap-graph space-y-4">
          {fetching ? (
            <Card className="flex items-center justify-center gap-3 rounded-3xl border-border/80 bg-card/75 p-12 text-center text-xs text-muted-foreground shadow-xl backdrop-blur-2xl">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              <span>Constructing Knowledge Graph Visualization...</span>
            </Card>
          ) : graph ? (
            <div className="sleek-bezel overflow-hidden rounded-3xl border border-border/80 bg-card/75 shadow-2xl backdrop-blur-2xl">
              <KnowledgeGraphViewer graph={graph} />
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
