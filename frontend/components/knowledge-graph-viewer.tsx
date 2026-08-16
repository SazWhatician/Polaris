"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Search, ZoomIn, ZoomOut, RefreshCw, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { type KnowledgeGraph, type ConceptNode } from "@/lib/api/graph";

interface Props {
  graph: KnowledgeGraph;
  onSelectNode?: (node: ConceptNode) => void;
}

interface NodePos {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export function KnowledgeGraphViewer({ graph, onSelectNode }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [activeCluster, setActiveCluster] = useState<string | null>(null);

  // Map cluster colors
  const clusterColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    graph.clusters.forEach((c) => {
      c.node_ids.forEach((nid) => {
        map[nid] = c.color_hex;
      });
    });
    return map;
  }, [graph]);

  // Compute node positions with simple force simulation
  const [nodesPos, setNodesPos] = useState<Record<string, NodePos>>({});

  useEffect(() => {
    const initialPos: Record<string, NodePos> = {};
    const count = graph.nodes.length;
    const centerX = 400;
    const centerY = 300;
    const radius = Math.min(centerX, centerY) * 0.65;

    graph.nodes.forEach((node, i) => {
      const angle = (i / count) * 2 * Math.PI;
      initialPos[node.id] = {
        x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
        y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        radius: 22 + (node.importance_score || 0.5) * 12,
        color: clusterColorMap[node.id] || "#6366f1",
      };
    });

    setNodesPos(initialPos);
  }, [graph, clusterColorMap]);

  // Canvas Force Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid Pattern
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      const gridSize = 40 * zoom;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Edges
      graph.edges.forEach((edge) => {
        const src = nodesPos[edge.source_concept_id];
        const tgt = nodesPos[edge.target_concept_id];
        if (!src || !tgt) return;

        const isHighlighted =
          selectedNodeId === edge.source_concept_id || selectedNodeId === edge.target_concept_id;

        ctx.beginPath();
        ctx.moveTo(src.x * zoom, src.y * zoom);
        ctx.lineTo(tgt.x * zoom, tgt.y * zoom);
        ctx.strokeStyle = isHighlighted ? "#6366f1" : "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = isHighlighted ? 3 : 1.5;
        ctx.stroke();

        // Draw relationship arrow
        const midX = (src.x + tgt.x) / 2 * zoom;
        const midY = (src.y + tgt.y) / 2 * zoom;
        ctx.fillStyle = isHighlighted ? "#818cf8" : "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(midX, midY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Nodes
      graph.nodes.forEach((node) => {
        const pos = nodesPos[node.id];
        if (!pos) return;

        const isSelected = selectedNodeId === node.id;
        const matchesSearch = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

        const nx = pos.x * zoom;
        const ny = pos.y * zoom;
        const r = pos.radius * zoom;

        // Outer Glow for Selected / Search Match
        if (isSelected || matchesSearch) {
          ctx.beginPath();
          ctx.arc(nx, ny, r + 8, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? "rgba(99, 102, 241, 0.35)" : "rgba(250, 204, 21, 0.35)";
          ctx.fill();
        }

        // Node Body Circle
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fillStyle = pos.color;
        ctx.fill();
        ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = isSelected ? 3 : 1.5;
        ctx.stroke();

        // Inner Bevel Highlight
        ctx.beginPath();
        ctx.arc(nx - r * 0.3, ny - r * 0.3, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.fill();

        // Node Text Label
        ctx.fillStyle = "#ffffff";
        ctx.font = `${Math.max(10, Math.min(13, 11 * zoom))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(node.name, nx, ny + r + 14);
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [graph, nodesPos, selectedNodeId, searchQuery, zoom]);

  // Handle Canvas Click Selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    let clickedNode: ConceptNode | null = null;
    for (const node of graph.nodes) {
      const pos = nodesPos[node.id];
      if (!pos) continue;
      const dist = Math.hypot(clickX - pos.x, clickY - pos.y);
      if (dist <= pos.radius) {
        clickedNode = node;
        break;
      }
    }

    if (clickedNode) {
      setSelectedNodeId(clickedNode.id);
      if (onSelectNode) onSelectNode(clickedNode);
    } else {
      setSelectedNodeId(null);
    }
  };

  const selectedNodeObj = useMemo(
    () => graph.nodes.find((n) => n.id === selectedNodeId) || null,
    [graph, selectedNodeId]
  );

  return (
    <div className="relative w-full flex flex-col md:flex-row gap-4 select-none">
      {/* Interactive Graph Canvas Area */}
      <div className="flex-1 glass-card p-2 relative overflow-hidden flex flex-col items-center justify-center min-h-[520px] rounded-3xl">
        {/* Top Control Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 glass-inset p-1.5 pointer-events-auto rounded-xl">
            <Search className="h-4 w-4 text-muted-foreground ml-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts..."
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-36 sm:w-48"
            />
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.15, 1.8))}
              className="p-2 rounded-xl bg-card/80 border border-border/80 text-foreground hover:bg-muted/80 text-xs shadow-sm transition-all"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))}
              className="p-2 rounded-xl bg-card/80 border border-border/80 text-foreground hover:bg-muted/80 text-xs shadow-sm transition-all"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-2 rounded-xl bg-card/80 border border-border/80 text-foreground hover:bg-muted/80 text-xs shadow-sm transition-all"
              title="Reset Zoom"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Canvas Element */}
        <canvas
          ref={canvasRef}
          width={820}
          height={520}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-grab active:cursor-grabbing rounded-2xl bg-black/20"
        />

        {/* Bottom Legend Pills */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-2 overflow-x-auto pb-1">
          {graph.clusters.map((c) => (
            <button
              key={c.cluster_id}
              onClick={() => setActiveCluster(activeCluster === c.cluster_id ? null : c.cluster_id)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium border flex items-center gap-1.5 cursor-pointer transition-all bg-card/80 backdrop-blur-md ${
                activeCluster === c.cluster_id ? "border-primary text-primary ring-2 ring-primary/30 scale-105" : "border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color_hex }} />
              <span>{c.name} ({c.node_ids.length})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNodeObj && (
        <div className="w-full md:w-80 rounded-3xl bg-card/90 border border-border/80 p-5 space-y-4 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-right-4 duration-200 text-foreground sleek-bezel">
          <div className="flex items-center justify-between border-b border-border/50 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Concept Inspector</span>
            </div>
            <span className="text-[10px] uppercase text-primary font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              {selectedNodeObj.category}
            </span>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-foreground">{selectedNodeObj.name}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              {selectedNodeObj.description || "Core concept extracted from course materials."}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1.5 text-xs">
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Importance Rating</span>
            <div className="h-2 w-full bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${(selectedNodeObj.importance_score || 0.5) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href={`/chat?q=${encodeURIComponent(selectedNodeObj.name)}`}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition-all"
            >
              <span>Ask AI About {selectedNodeObj.name}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
