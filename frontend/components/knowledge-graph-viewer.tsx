"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Layers,
  Activity,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { type KnowledgeGraph, type ConceptNode } from "@/lib/api/graph";

// Dynamically import react-force-graph-2d without SSR to avoid canvas/window errors
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] w-full items-center justify-center gap-3 text-xs text-muted-foreground">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span>Loading Physics Concept Graph...</span>
    </div>
  ),
});

interface Props {
  graph: KnowledgeGraph;
  onSelectNode?: (node: ConceptNode) => void;
}

interface GraphNode {
  id: string;
  name: string;
  category: string;
  description?: string;
  importance_score?: number;
  val: number;
  color: string;
  clusterId?: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  relationship_type?: string;
  weight?: number;
}

export function KnowledgeGraphViewer({ graph, onSelectNode }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fgRef = useRef<any>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [showParticles, setShowParticles] = useState(true);

  // Map cluster colors
  const clusterColorMap = useMemo(() => {
    const map: Record<string, { color: string; clusterId: string }> = {};
    graph.clusters.forEach((c) => {
      c.node_ids.forEach((nid) => {
        map[nid] = { color: c.color_hex, clusterId: c.cluster_id };
      });
    });
    return map;
  }, [graph]);

  // Format data for react-force-graph
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = graph.nodes
      .filter((n) => {
        if (!activeCluster) return true;
        const info = clusterColorMap[n.id];
        return info?.clusterId === activeCluster;
      })
      .map((n) => {
        const info = clusterColorMap[n.id];
        const importance = n.importance_score || 0.5;
        return {
          id: n.id,
          name: n.name,
          category: n.category,
          description: n.description,
          importance_score: importance,
          val: 8 + importance * 12,
          color: info?.color || "#6366f1",
          clusterId: info?.clusterId,
        };
      });

    const activeNodeIds = new Set(nodes.map((n) => n.id));

    const links: GraphLink[] = graph.edges
      .filter(
        (e) => activeNodeIds.has(e.source_concept_id) && activeNodeIds.has(e.target_concept_id),
      )
      .map((e) => ({
        source: e.source_concept_id,
        target: e.target_concept_id,
        relationship_type: e.relation_type,
        weight: e.confidence_score || 1,
      }));

    return { nodes, links };
  }, [graph, clusterColorMap, activeCluster]);

  // Find neighbors of the highlighted node
  const highlightNodes = useMemo(() => {
    const set = new Set<string>();
    const focusId = hoverNodeId || selectedNodeId;
    if (!focusId) return set;

    set.add(focusId);
    graph.edges.forEach((edge) => {
      if (edge.source_concept_id === focusId) set.add(edge.target_concept_id);
      if (edge.target_concept_id === focusId) set.add(edge.source_concept_id);
    });
    return set;
  }, [hoverNodeId, selectedNodeId, graph]);

  // Node Canvas Painter for sleek glowing nodes
  const nodeCanvasObject = useCallback(
    (rawNode: unknown, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const node = rawNode as GraphNode;
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoverNodeId === node.id;
      const isNeighbor = highlightNodes.has(node.id);
      const isDimmed = highlightNodes.size > 0 && !isNeighbor;
      const matchesSearch =
        searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

      const r = Math.max(4, node.val * 0.7);
      const x = node.x || 0;
      const y = node.y || 0;

      // Glow effect for selected / searched / hovered nodes
      if (isSelected || isHovered || matchesSearch) {
        ctx.beginPath();
        ctx.arc(x, y, r + 6 / Math.sqrt(globalScale), 0, 2 * Math.PI, false);
        ctx.fillStyle = matchesSearch
          ? "rgba(250, 204, 21, 0.4)"
          : isSelected
            ? "rgba(99, 102, 241, 0.5)"
            : "rgba(168, 85, 247, 0.4)";
        ctx.fill();
      }

      // Outer ring for neighbor nodes
      if (isNeighbor && !isSelected && !isHovered) {
        ctx.beginPath();
        ctx.arc(x, y, r + 3 / Math.sqrt(globalScale), 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.fill();
      }

      // Node Body Circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI, false);
      ctx.fillStyle = isDimmed ? "rgba(100, 116, 139, 0.3)" : node.color || "#6366f1";
      ctx.fill();

      // Border outline
      ctx.strokeStyle =
        isSelected || isHovered
          ? "#ffffff"
          : matchesSearch
            ? "#facc15"
            : isDimmed
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = isSelected ? 2.5 / globalScale : 1.2 / globalScale;
      ctx.stroke();

      // Label (Only show when zoomed in or if selected/hovered/searched)
      const shouldShowLabel =
        globalScale > 1.2 || isSelected || isHovered || matchesSearch || node.val > 14;
      if (shouldShowLabel) {
        const fontSize = Math.max(9, Math.min(13, 11 / Math.sqrt(globalScale)));
        ctx.font = `600 ${fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const labelText = node.name;
        const textY = y + r + fontSize + 2;

        // Label background pill
        const textWidth = ctx.measureText(labelText).width;
        ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
        ctx.beginPath();
        ctx.roundRect(
          x - textWidth / 2 - 4,
          textY - fontSize / 2 - 2,
          textWidth + 8,
          fontSize + 4,
          4,
        );
        ctx.fill();

        // Label text
        ctx.fillStyle = isDimmed ? "rgba(255, 255, 255, 0.4)" : "#ffffff";
        ctx.fillText(labelText, x, textY);
      }
    },
    [selectedNodeId, hoverNodeId, highlightNodes, searchQuery],
  );

  // Link Canvas Painter
  const linkColor = useCallback(
    (rawLink: unknown) => {
      const link = rawLink as GraphLink;
      const srcId = typeof link.source === "object" ? link.source.id : link.source;
      const tgtId = typeof link.target === "object" ? link.target.id : link.target;
      const focusId = hoverNodeId || selectedNodeId;

      if (focusId) {
        if (srcId === focusId || tgtId === focusId) {
          return "#818cf8"; // Highlighted link
        }
        return "rgba(255, 255, 255, 0.04)"; // Dimmed link
      }
      return "rgba(255, 255, 255, 0.15)";
    },
    [hoverNodeId, selectedNodeId],
  );

  const handleNodeClick = useCallback(
    (rawNode: unknown) => {
      const node = rawNode as GraphNode;
      setSelectedNodeId(node.id);
      const originalNode = graph.nodes.find((n) => n.id === node.id);
      if (originalNode && onSelectNode) {
        onSelectNode(originalNode);
      }

      // Smooth zoom to node
      if (fgRef.current && node.x !== undefined && node.y !== undefined) {
        fgRef.current.centerAt(node.x, node.y, 600);
        fgRef.current.zoom(2.2, 600);
      }
    },
    [graph.nodes, onSelectNode],
  );

  const selectedNodeObj = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId) || null,
    [graph, selectedNodeId],
  );

  // Connected prerequisites and dependents of the selected node
  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return { prerequisites: [], dependents: [] };
    const prerequisites = graph.edges
      .filter((e) => e.target_concept_id === selectedNodeId)
      .map((e) => graph.nodes.find((n) => n.id === e.source_concept_id))
      .filter(Boolean) as ConceptNode[];

    const dependents = graph.edges
      .filter((e) => e.source_concept_id === selectedNodeId)
      .map((e) => graph.nodes.find((n) => n.id === e.target_concept_id))
      .filter(Boolean) as ConceptNode[];

    return { prerequisites, dependents };
  }, [selectedNodeId, graph]);

  return (
    <div className="relative flex w-full select-none flex-col gap-4 lg:flex-row">
      {/* Interactive 2D Physics Force Graph Canvas */}
      <div className="glass-card relative flex min-h-[560px] flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/80 bg-black/40 shadow-2xl">
        {/* Top Control Overlay */}
        <div className="pointer-events-none absolute left-4 right-4 top-4 z-20 flex flex-wrap items-center justify-between gap-3">
          {/* Search bar */}
          <div className="glass-inset pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/80 bg-card/80 p-1.5 shadow-lg backdrop-blur-xl">
            <Search className="ml-1.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts..."
              className="w-36 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none sm:w-56"
            />
          </div>

          {/* Viewport Control Buttons */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => setShowParticles((p) => !p)}
              className={`flex items-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold shadow-md transition-all ${
                showParticles
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border/80 bg-card/80 text-muted-foreground hover:text-foreground"
              }`}
              title="Toggle Prerequisite Particles"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden text-[11px] sm:inline">Flows</span>
            </button>

            <button
              onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 400)}
              className="rounded-xl border border-border/80 bg-card/80 p-2.5 text-xs text-foreground shadow-md transition-all hover:bg-muted/80"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 0.7, 400)}
              className="rounded-xl border border-border/80 bg-card/80 p-2.5 text-xs text-foreground shadow-md transition-all hover:bg-muted/80"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => fgRef.current?.zoomToFit(600, 50)}
              className="rounded-xl border border-border/80 bg-card/80 p-2.5 text-xs text-foreground shadow-md transition-all hover:bg-muted/80"
              title="Fit to Screen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Force Graph Renderer */}
        <div className="h-[560px] w-full">
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeId="id"
            nodeVal="val"
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(rawNode, color, ctx) => {
              const n = rawNode as GraphNode;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(n.x || 0, n.y || 0, Math.max(8, n.val * 0.8), 0, 2 * Math.PI, false);
              ctx.fill();
            }}
            linkColor={linkColor}
            linkWidth={(link) => {
              const srcId =
                typeof link.source === "object" ? (link.source as GraphNode).id : link.source;
              const tgtId =
                typeof link.target === "object" ? (link.target as GraphNode).id : link.target;
              return hoverNodeId === srcId || hoverNodeId === tgtId ? 2.5 : 1.2;
            }}
            linkDirectionalArrowLength={4.5}
            linkDirectionalArrowRelPos={1}
            linkDirectionalParticles={showParticles ? 3 : 0}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.006}
            linkDirectionalParticleColor={() => "#818cf8"}
            onNodeClick={handleNodeClick}
            onNodeHover={(rawNode) => {
              const n = rawNode as GraphNode | null;
              setHoverNodeId(n ? n.id : null);
            }}
            onBackgroundClick={() => setSelectedNodeId(null)}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            cooldownTicks={120}
            backgroundColor="transparent"
          />
        </div>

        {/* Bottom Cluster Filter Pills */}
        <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-20 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCluster(null)}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-bold backdrop-blur-xl transition-all ${
              activeCluster === null
                ? "border-primary bg-primary text-primary-foreground shadow-md"
                : "border-border/80 bg-card/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            All Clusters ({graph.nodes.length})
          </button>
          {graph.clusters.map((c) => (
            <button
              key={c.cluster_id}
              onClick={() => setActiveCluster(activeCluster === c.cluster_id ? null : c.cluster_id)}
              className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium backdrop-blur-xl transition-all ${
                activeCluster === c.cluster_id
                  ? "scale-105 border-primary bg-card text-primary ring-2 ring-primary/30"
                  : "border-border/60 bg-card/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className="shadow-xs h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: c.color_hex }}
              />
              <span>
                {c.name} ({c.node_ids.length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Concept Deep-Dive Drawer */}
      {selectedNodeObj && (
        <div className="sleek-bezel w-full space-y-5 rounded-3xl border border-border/80 bg-card/95 p-6 text-foreground shadow-2xl backdrop-blur-2xl duration-300 animate-in fade-in slide-in-from-right-4 lg:w-96">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Sparkles className="h-4.5 w-4.5 animate-pulse text-primary" />
              <span>Concept Inspector</span>
            </div>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-primary">
              {selectedNodeObj.category}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black tracking-tight text-foreground">
              {selectedNodeObj.name}
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {selectedNodeObj.description ||
                "Core academic concept vectorized from course documents."}
            </p>
          </div>

          {/* Importance & Centrality Rating */}
          <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/40 p-4 text-xs">
            <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
              <span className="font-bold uppercase">Curriculum Centrality</span>
              <span className="font-bold text-foreground">
                {Math.round((selectedNodeObj.importance_score || 0.5) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-indigo-400 to-purple-400 transition-all duration-500"
                style={{ width: `${(selectedNodeObj.importance_score || 0.5) * 100}%` }}
              />
            </div>
          </div>

          {/* Direct Prerequisites & Dependent Topologies */}
          <div className="space-y-3">
            {connectedEdges.prerequisites.length > 0 && (
              <div className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                  Prerequisite Foundations ({connectedEdges.prerequisites.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {connectedEdges.prerequisites.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleNodeClick(p)}
                      className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-500/20"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {connectedEdges.dependents.length > 0 && (
              <div className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  Unlocks Downstream ({connectedEdges.dependents.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {connectedEdges.dependents.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleNodeClick(d)}
                      className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick RAG Chat & Gap Actions */}
          <div className="space-y-2 border-t border-border/50 pt-2">
            <Link
              href={`/chat?q=${encodeURIComponent(`Explain ${selectedNodeObj.name} in detail with formulas, proofs, and examples from my uploaded course notes.`)}`}
              className="active:scale-98 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-lg transition-all hover:opacity-90"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Query in Grounded RAG Chat</span>
              <ArrowRight className="ml-auto h-3.5 w-3.5" />
            </Link>

            <Link
              href={`/gaps?concept=${encodeURIComponent(selectedNodeObj.name)}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/80 bg-muted/60 px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Check Prerequisite Gaps</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
