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
    <div className="w-full h-[560px] flex items-center justify-center text-xs text-muted-foreground gap-3">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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
        (e) => activeNodeIds.has(e.source_concept_id) && activeNodeIds.has(e.target_concept_id)
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
      ctx.fillStyle = isDimmed
        ? "rgba(100, 116, 139, 0.3)"
        : node.color || "#6366f1";
      ctx.fill();

      // Border outline
      ctx.strokeStyle = isSelected || isHovered
        ? "#ffffff"
        : matchesSearch
        ? "#facc15"
        : isDimmed
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = isSelected ? 2.5 / globalScale : 1.2 / globalScale;
      ctx.stroke();

      // Label (Only show when zoomed in or if selected/hovered/searched)
      const shouldShowLabel = globalScale > 1.2 || isSelected || isHovered || matchesSearch || node.val > 14;
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
          4
        );
        ctx.fill();

        // Label text
        ctx.fillStyle = isDimmed ? "rgba(255, 255, 255, 0.4)" : "#ffffff";
        ctx.fillText(labelText, x, textY);
      }
    },
    [selectedNodeId, hoverNodeId, highlightNodes, searchQuery]
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
    [hoverNodeId, selectedNodeId]
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
    [graph.nodes, onSelectNode]
  );

  const selectedNodeObj = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId) || null,
    [graph, selectedNodeId]
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
    <div className="relative w-full flex flex-col lg:flex-row gap-4 select-none">
      {/* Interactive 2D Physics Force Graph Canvas */}
      <div className="flex-1 glass-card relative overflow-hidden flex flex-col items-center justify-center min-h-[560px] rounded-3xl border border-border/80 bg-black/40 shadow-2xl">
        {/* Top Control Overlay */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Search bar */}
          <div className="flex items-center gap-2 glass-inset p-1.5 pointer-events-auto rounded-2xl bg-card/80 border border-border/80 backdrop-blur-xl shadow-lg">
            <Search className="h-4 w-4 text-muted-foreground ml-1.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts..."
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-36 sm:w-56"
            />
          </div>

          {/* Viewport Control Buttons */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setShowParticles((p) => !p)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                showParticles
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-card/80 border-border/80 text-muted-foreground hover:text-foreground"
              }`}
              title="Toggle Prerequisite Particles"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-[11px]">Flows</span>
            </button>

            <button
              onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.3, 400)}
              className="p-2.5 rounded-xl bg-card/80 border border-border/80 text-foreground hover:bg-muted/80 text-xs shadow-md transition-all"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 0.7, 400)}
              className="p-2.5 rounded-xl bg-card/80 border border-border/80 text-foreground hover:bg-muted/80 text-xs shadow-md transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => fgRef.current?.zoomToFit(600, 50)}
              className="p-2.5 rounded-xl bg-card/80 border border-border/80 text-foreground hover:bg-muted/80 text-xs shadow-md transition-all"
              title="Fit to Screen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Force Graph Renderer */}
        <div className="w-full h-[560px]">
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
              const srcId = typeof link.source === "object" ? (link.source as GraphNode).id : link.source;
              const tgtId = typeof link.target === "object" ? (link.target as GraphNode).id : link.target;
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
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-2 overflow-x-auto pb-1 pointer-events-auto">
          <button
            onClick={() => setActiveCluster(null)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer backdrop-blur-xl ${
              activeCluster === null
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card/80 border-border/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            All Clusters ({graph.nodes.length})
          </button>
          {graph.clusters.map((c) => (
            <button
              key={c.cluster_id}
              onClick={() => setActiveCluster(activeCluster === c.cluster_id ? null : c.cluster_id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border flex items-center gap-2 cursor-pointer transition-all backdrop-blur-xl ${
                activeCluster === c.cluster_id
                  ? "border-primary text-primary ring-2 ring-primary/30 scale-105 bg-card"
                  : "border-border/60 text-muted-foreground hover:text-foreground bg-card/80"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shadow-xs" style={{ backgroundColor: c.color_hex }} />
              <span>{c.name} ({c.node_ids.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Concept Deep-Dive Drawer */}
      {selectedNodeObj && (
        <div className="w-full lg:w-96 rounded-3xl bg-card/95 border border-border/80 p-6 space-y-5 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-right-4 duration-300 text-foreground sleek-bezel">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
              <span>Concept Inspector</span>
            </div>
            <span className="text-[10px] uppercase text-primary font-mono font-bold px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
              {selectedNodeObj.category}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black text-foreground tracking-tight">{selectedNodeObj.name}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">
              {selectedNodeObj.description || "Core academic concept vectorized from course documents."}
            </p>
          </div>

          {/* Importance & Centrality Rating */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span className="uppercase font-bold">Curriculum Centrality</span>
              <span className="font-bold text-foreground">
                {Math.round((selectedNodeObj.importance_score || 0.5) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-indigo-400 to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${(selectedNodeObj.importance_score || 0.5) * 100}%` }}
              />
            </div>
          </div>

          {/* Direct Prerequisites & Dependent Topologies */}
          <div className="space-y-3">
            {connectedEdges.prerequisites.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                  Prerequisite Foundations ({connectedEdges.prerequisites.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {connectedEdges.prerequisites.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleNodeClick(p)}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {connectedEdges.dependents.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  Unlocks Downstream ({connectedEdges.dependents.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {connectedEdges.dependents.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleNodeClick(d)}
                      className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick RAG Chat & Gap Actions */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Link
              href={`/chat?q=${encodeURIComponent(`Explain ${selectedNodeObj.name} in detail with formulas, proofs, and examples from my uploaded course notes.`)}`}
              className="w-full py-3 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-98 transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Query in Grounded RAG Chat</span>
              <ArrowRight className="h-3.5 w-3.5 ml-auto" />
            </Link>

            <Link
              href={`/gaps?concept=${encodeURIComponent(selectedNodeObj.name)}`}
              className="w-full py-2.5 px-4 rounded-2xl bg-muted/60 hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-2 border border-border/80 transition-all"
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
