/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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
  Sparkles,
  Youtube,
  ExternalLink,
  Upload,
  FileText,
  X,
  Play,
  RefreshCw,
  ListVideo,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useGsapEntrance } from "@/lib/use-animation-system";
import { cn } from "@/lib/utils";
import {
  listSyllabi,
  getSyllabus,
  uploadSyllabusFile,
  createSyllabus,
  SyllabusResponse,
  Topic,
} from "@/lib/api/syllabus";
import {
  getBlockResources,
  BlockResourcesResponse,
  ResourceItem,
} from "@/lib/api/resources";

interface SubTopic {
  title: string;
  coverage: number;
  status: "mastered" | "learning" | "gap";
  notes?: string;
}

interface TopicBlock {
  id: string;
  title: string;
  description?: string;
  coverage: number;
  subtopics: SubTopic[];
}

interface ModuleNode {
  id: string;
  code: string;
  title: string;
  coverage: number;
  blocks: TopicBlock[];
}

// Default baseline curriculum if no custom syllabus has been uploaded yet
const DEFAULT_SYLLABUS_MODULES: ModuleNode[] = [
  {
    id: "mod-1",
    code: "UNIT I",
    title: "Tree Data Structures & Self-Balancing",
    coverage: 90,
    blocks: [
      {
        id: "block-1-1",
        title: "Binary Search Trees & Balancing Rotations",
        description: "Core BST tree invariants, lookup complexity, and AVL rotational balancing algorithms.",
        coverage: 90,
        subtopics: [
          { title: "Binary Search Trees (BST) & Invariants", coverage: 95, status: "mastered", notes: "Cited in Lecture 3 PDF" },
          { title: "AVL Trees & Self-Balancing Rotations", coverage: 85, status: "mastered", notes: "Cited in Lecture 4 PDF" },
        ],
      },
      {
        id: "block-1-2",
        title: "Multiway Trees & Persistent Indexing",
        description: "Red-black coloring properties, B-Tree disk paging, and storage engine tree structures.",
        coverage: 79,
        subtopics: [
          { title: "Red-Black Trees & Color Properties", coverage: 70, status: "learning", notes: "Needs review on deletion" },
          { title: "B-Trees & Multiway Search Indexing", coverage: 88, status: "mastered", notes: "Database indexing chapter" },
        ],
      },
    ],
  },
  {
    id: "mod-2",
    code: "UNIT II",
    title: "Advanced Graph Algorithms & Network Flows",
    coverage: 72,
    blocks: [
      {
        id: "block-2-1",
        title: "Shortest Paths & Pathfinding",
        description: "Breadth-first traversals, single-source shortest path relaxation, and topological orderings.",
        coverage: 90,
        subtopics: [
          { title: "Breadth-First Search (BFS) & Topological Sort", coverage: 100, status: "mastered", notes: "Fully mapped in Qdrant" },
          { title: "Dijkstra's Single-Source Shortest Path", coverage: 80, status: "mastered", notes: "Lecture 8 notes" },
        ],
      },
      {
        id: "block-2-2",
        title: "Spanning Trees & Negative Cycles",
        description: "Greedy cut properties (Prim/Kruskal) and Bellman-Ford negative weight cycle detection.",
        coverage: 55,
        subtopics: [
          { title: "Minimum Spanning Trees (Prim / Kruskal)", coverage: 45, status: "gap", notes: "Identified gap in tutorial 3" },
          { title: "Bellman-Ford & Negative Weight Cycles", coverage: 65, status: "learning", notes: "Algorithm assignment 2" },
        ],
      },
    ],
  },
  {
    id: "mod-3",
    code: "UNIT III",
    title: "Dynamic Programming & Combinatorial Optimization",
    coverage: 64,
    blocks: [
      {
        id: "block-3-1",
        title: "Subproblem Formulation & Classical Reductions",
        description: "Memoization arrays vs bottom-up tabulation tables, 0/1 knapsack and subset sum reductions.",
        coverage: 70,
        subtopics: [
          { title: "Memoization vs Bottom-up Tabulation", coverage: 85, status: "mastered", notes: "Complete coverage" },
          { title: "0/1 Knapsack & Subset Sum Reductions", coverage: 55, status: "gap", notes: "Recommended YT lecture queued" },
        ],
      },
      {
        id: "block-3-2",
        title: "Sequence Alignment & Tree DP",
        description: "Optimal string edit distances, longest common subsequence, and matrix chain multiplication.",
        coverage: 58,
        subtopics: [
          { title: "Longest Common Subsequence (LCS) & Alignment", coverage: 75, status: "learning", notes: "Lecture 12" },
          { title: "Matrix Chain Multiplication & DP On Trees", coverage: 40, status: "gap", notes: "Missing in current notes" },
        ],
      },
    ],
  },
];

export default function SyllabusPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Navigation / Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    "mod-1": true,
    "mod-2": true,
    "mod-3": true,
  });

  // Syllabi State
  const [syllabusList, setSyllabusList] = useState<SyllabusResponse[]>([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleNode[]>(DEFAULT_SYLLABUS_MODULES);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTab, setUploadTab] = useState<"file" | "text">("file");
  const [syllabusName, setSyllabusName] = useState("");
  const [syllabusText, setSyllabusText] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Block Resource Drawer State
  const [selectedBlock, setSelectedBlock] = useState<{
    moduleCode: string;
    title: string;
    subtopics: SubTopic[];
  } | null>(null);
  const [blockResources, setBlockResources] = useState<BlockResourcesResponse | null>(null);
  const [loadingBlockResources, setLoadingBlockResources] = useState(false);
  const [activeSubtopicFilter, setActiveSubtopicFilter] = useState<string>("all");
  const [activeVideoModal, setActiveVideoModal] = useState<ResourceItem | null>(null);

  const containerRef = useGsapEntrance(".gsap-syllabus", 0.05);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  // Load existing syllabi from backend
  useEffect(() => {
    if (!user) return;
    const fetchSyllabi = async () => {
      try {
        const res = await listSyllabi();
        if (res && res.items && res.items.length > 0 && res.items[0]) {
          setSyllabusList(res.items);
          if (!selectedSyllabusId) {
            setSelectedSyllabusId(res.items[0].id);
          }
        }
      } catch (err) {
        // Fallback to default curriculum gracefully
        console.warn("Could not fetch remote syllabi list:", err);
      }
    };
    void fetchSyllabi();
  }, [user, selectedSyllabusId]);

  // When a syllabus is selected from remote, transform tree into Chapter/Module blocks
  useEffect(() => {
    if (!selectedSyllabusId) return;
    const loadSelected = async () => {
      try {
        const data = await getSyllabus(selectedSyllabusId);
        if (data && data.tree && data.tree.length > 0) {
          const transformed = mapTreeToModules(data.tree);
          setModules(transformed);
          const initialExp: Record<string, boolean> = {};
          transformed.forEach((m) => {
            initialExp[m.id] = true;
          });
          setExpandedModules(initialExp);
        } else if (data) {
          setModules([
            {
              id: "mod-empty",
              code: "UNIT I",
              title: data.name || "Curriculum",
              coverage: 0,
              blocks: [
                {
                  id: "block-empty",
                  title: "Extracted Syllabus",
                  description: "No structured topics detected. Click + Upload Syllabus to re-upload a clear photo or paste syllabus text directly.",
                  coverage: 0,
                  subtopics: [{ title: data.name, coverage: 0, status: "gap" }],
                },
              ],
            },
          ]);
        }
      } catch (err) {
        console.warn("Failed to load syllabus details:", err);
      }
    };
    void loadSelected();
  }, [selectedSyllabusId]);

  if (loading || !user) return null;

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Convert raw topic tree from backend into Chapter/Module and Topic Block structures
  function mapTreeToModules(tree: Topic[]): ModuleNode[] {
    return tree.map((modTopic, modIdx) => {
      const code = `UNIT ${modIdx + 1}`;
      let blocks: TopicBlock[] = [];

      if (modTopic.subtopics && modTopic.subtopics.length > 0) {
        const hasDeeperNesting = modTopic.subtopics.some(
          (sub) => sub.subtopics && sub.subtopics.length > 0
        );

        if (hasDeeperNesting) {
          // 3-tier hierarchy: Module -> Topic Blocks -> Subtopics
          blocks = modTopic.subtopics.map((blockTopic, bIdx) => ({
            id: blockTopic.id || `block-${modIdx}-${bIdx}`,
            title: blockTopic.title,
            description: blockTopic.description || undefined,
            coverage: 75,
            subtopics:
              blockTopic.subtopics && blockTopic.subtopics.length > 0
                ? blockTopic.subtopics.map((s, sIdx) => ({
                    title: s.title,
                    coverage: 70 + ((sIdx * 11) % 25),
                    status: (sIdx % 3 === 0
                      ? "mastered"
                      : sIdx % 3 === 1
                      ? "learning"
                      : "gap") as "mastered" | "learning" | "gap",
                    notes: s.description || undefined,
                  }))
                : [
                    {
                      title: blockTopic.title,
                      coverage: 80,
                      status: "mastered",
                    },
                  ],
          }));
        } else {
          // 2-tier hierarchy: Module contains a list of direct topics -> group into blocks
          const chunked: SubTopic[] = modTopic.subtopics.map((s, sIdx) => ({
            title: s.title,
            coverage: 75 + ((sIdx * 9) % 25),
            status: (sIdx % 3 === 0
              ? "mastered"
              : sIdx % 3 === 1
              ? "learning"
              : "gap") as "mastered" | "learning" | "gap",
            notes: s.description || undefined,
          }));

          // Divide into 2 blocks for readability
          const half = Math.ceil(chunked.length / 2);
          blocks = [
            {
              id: `${modTopic.id}-b1`,
              title: `${modTopic.title} (Part I)`,
              description: modTopic.description || "Core theoretical concepts and foundations.",
              coverage: 80,
              subtopics: chunked.slice(0, half),
            },
            {
              id: `${modTopic.id}-b2`,
              title: `${modTopic.title} (Part II)`,
              description: "Advanced applications and algorithm techniques.",
              coverage: 70,
              subtopics: chunked.slice(half),
            },
          ].filter((b) => b.subtopics.length > 0);
        }
      } else {
        // Single topic with no subtopics
        blocks = [
          {
            id: modTopic.id,
            title: modTopic.title,
            description: modTopic.description || undefined,
            coverage: 80,
            subtopics: [{ title: modTopic.title, coverage: 80, status: "mastered" }],
          },
        ];
      }

      const totalCoverage =
        blocks.reduce((acc, b) => acc + b.coverage, 0) / (blocks.length || 1);

      return {
        id: modTopic.id || `mod-${modIdx}`,
        code,
        title: modTopic.title,
        coverage: Math.round(totalCoverage),
        blocks,
      };
    });
  }

  // Handle uploading a syllabus PDF or text
  const handleUploadSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusName.trim()) {
      toast.error("Please enter a syllabus or course name");
      return;
    }

    setIsUploading(true);
    try {
      let created: SyllabusResponse;
      if (uploadTab === "file") {
        if (!uploadFile) {
          toast.error("Please choose a syllabus file or photo");
          setIsUploading(false);
          return;
        }
        created = await uploadSyllabusFile(syllabusName.trim(), uploadFile);
      } else {
        if (!syllabusText.trim()) {
          toast.error("Please enter syllabus text");
          setIsUploading(false);
          return;
        }
        created = await createSyllabus(syllabusName.trim(), syllabusText.trim());
      }

      toast.success("Syllabus uploaded & parsed successfully!");
      setSyllabusList((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
      setSelectedSyllabusId(created.id);
      if (created.tree && created.tree.length > 0) {
        const transformed = mapTreeToModules(created.tree);
        setModules(transformed);
        const initialExp: Record<string, boolean> = {};
        transformed.forEach((m) => {
          initialExp[m.id] = true;
        });
        setExpandedModules(initialExp);
      }
      setShowUploadModal(false);
      setSyllabusName("");
      setSyllabusText("");
      setUploadFile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload and parse syllabus.";
      toast.error("Upload failed", { description: msg });
    } finally {
      setIsUploading(false);
    }
  };

  // Open block resources drawer & fetch playlists and videos
  const handleOpenBlockResources = async (
    moduleCode: string,
    block: TopicBlock
  ) => {
    setSelectedBlock({
      moduleCode,
      title: block.title,
      subtopics: block.subtopics,
    });
    setBlockResources(null);
    setActiveSubtopicFilter("all");
    setLoadingBlockResources(true);

    try {
      const subtopicTitles = block.subtopics.map((s) => s.title);
      const data = await getBlockResources(block.title, subtopicTitles);
      setBlockResources(data);
    } catch (err) {
      toast.error("Failed to load video and playlist resources for this block", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoadingBlockResources(false);
    }
  };

  // Filter modules and blocks by search query
  const filteredModules = modules
    .map((m) => {
      const filteredBlocks = m.blocks
        .map((b) => {
          const matchSub = b.subtopics.filter(
            (s) =>
              s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              m.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
          const blockMatches =
            b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.title.toLowerCase().includes(searchQuery.toLowerCase());
          return {
            ...b,
            subtopics: blockMatches ? b.subtopics : matchSub,
          };
        })
        .filter((b) => b.subtopics.length > 0 || !searchQuery);

      return {
        ...m,
        blocks: filteredBlocks,
      };
    })
    .filter((m) => m.blocks.length > 0 || !searchQuery);

  const totalTopics = modules.reduce(
    (acc, m) => acc + m.blocks.reduce((bAcc, b) => bAcc + b.subtopics.length, 0),
    0
  );
  const masteredTopics = modules.reduce(
    (acc, m) =>
      acc +
      m.blocks.reduce(
        (bAcc, b) => bAcc + b.subtopics.filter((s) => s.status === "mastered").length,
        0
      ),
    0
  );

  return (
    <div className="min-h-screen text-foreground pb-32 pt-14 sm:pt-16 selection:bg-primary/30 selection:text-foreground">
      <SiteHeader />
      <main ref={containerRef} className="max-w-7xl mx-auto space-y-6 py-4 px-3 sm:px-6 lg:px-8">
        {/* Standardized Page Header */}
        <div className="gsap-syllabus">
          <PageHeader
            category="CORE WORKSPACE // SYLLABUS"
            title="Syllabus Intelligence"
            description="Structured hierarchical topic trees extracted from syllabus PDFs with chapter/module blocks and on-demand YouTube playlist & video curation."
            icon={BookOpen}
            badgeText={
              syllabusList.find((s) => s.id === selectedSyllabusId)?.name ||
              "CS 301 Active Curriculum"
            }
            badgeVariant="indigo"
            actions={
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowUploadModal(true)}
                  size="sm"
                  className="gap-2 text-xs font-bold rounded-xl shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Syllabus</span>
                </Button>
                <Link href="/gaps">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs font-bold rounded-xl border-border/80"
                  >
                    <Target className="h-4 w-4 text-primary" />
                    <span>Gap Analysis</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-0.5" />
                  </Button>
                </Link>
              </div>
            }
          />
        </div>

        {/* Syllabus Selector Bar (if multiple syllabi exist) */}
        {syllabusList.length > 0 && (
          <div className="gsap-syllabus flex items-center justify-between gap-3 p-3 rounded-2xl bg-card/85 border border-border/80 bento-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <BookMarked className="h-4 w-4 text-primary" />
              <span>Select Active Syllabus:</span>
            </div>
            <select
              value={selectedSyllabusId || ""}
              onChange={(e) => setSelectedSyllabusId(e.target.value)}
              className="text-xs bg-muted/50 border border-border/80 rounded-xl px-3 py-1.5 font-sans font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {syllabusList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({new Date(s.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Telemetry Stats Grid */}
        <div className="gsap-syllabus grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            label="Curriculum Coverage"
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
            value={`${masteredTopics}/${totalTopics || 1}`}
            suffix={` / ${totalTopics || 1}`}
            icon={CheckCircle2}
            colorScheme="primary"
            trend="High Confidence"
            trendPositive
            tag="Verified"
          />
          <StatCard
            label="Units & Modules"
            numericValue={modules.length}
            value={modules.length.toString()}
            icon={Layers}
            colorScheme="purple"
            trend="Topic Blocks"
            trendPositive
            tag="Modular Blocks"
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="gsap-syllabus space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapters, topic blocks, or subtopics..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-card/85 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground font-mono text-[10px]">Legend:</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-mono font-bold">
                Mastered (&gt;80%)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-mono font-bold">
                In Review
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-mono font-bold">
                Gap Detected
              </span>
            </div>
          </div>

          {/* Chapters / Modules Accordion */}
          <div className="space-y-4">
            {filteredModules.map((module) => {
              const isExpanded = expandedModules[module.id];

              return (
                <Card
                  key={module.id}
                  className="rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs overflow-hidden transition-all duration-200"
                >
                  {/* Module Header Bar */}
                  <div
                    onClick={() => toggleModule(module.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-muted/30 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <button className="p-1 rounded-lg bg-muted/60 text-muted-foreground">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                            {module.code}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-foreground">
                            {module.title}
                          </h3>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {module.blocks.length} topic blocks •{" "}
                          {module.blocks.reduce((acc, b) => acc + b.subtopics.length, 0)} subtopics mapped
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Badge */}
                    <div className="flex items-center gap-3 pl-7 sm:pl-0">
                      <div className="w-32 sm:w-44 bg-muted/60 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${module.coverage}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-primary w-10 text-right">
                        {module.coverage}%
                      </span>
                    </div>
                  </div>

                  {/* Topic Blocks Grid */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-border/40 space-y-4 bg-muted/10">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 pt-2">
                        {module.blocks.map((block) => (
                          <div
                            key={block.id}
                            className="p-4 rounded-2xl bg-card/85 border border-border/80 flex flex-col justify-between space-y-3 hover:border-primary/40 transition-all bento-card shadow-xs group"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                                    TOPIC BLOCK
                                  </span>
                                  <h4 className="text-sm font-bold text-foreground leading-snug">
                                    {block.title}
                                  </h4>
                                </div>
                                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                                  {block.subtopics.length} Subtopics
                                </span>
                              </div>

                              {block.description && (
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {block.description}
                                </p>
                              )}

                              {/* Subtopics List Inside Block */}
                              <div className="space-y-1.5 pt-1">
                                {block.subtopics.map((sub, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-2 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <ChevronRight className="h-3 w-3 text-primary shrink-0" />
                                      <span className="text-[11px] font-medium text-foreground truncate">
                                        {sub.title}
                                      </span>
                                    </div>
                                    <span
                                      className={cn(
                                        "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0",
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
                                        : "Gap"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Block Action: Click for Suggested Playlist and Videos */}
                            <button
                              onClick={() => handleOpenBlockResources(module.code, block)}
                              className="mt-2 w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs group-hover:border-rose-500/40"
                            >
                              <Youtube className="h-4 w-4 text-rose-500" />
                              <span>Suggested Playlists & Videos</span>
                              <Sparkles className="h-3 w-3 text-amber-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      {/* Upload Syllabus Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-card border border-border/80 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Upload Course Syllabus</h3>
                  <p className="text-xs text-muted-foreground">
                    Extract chapters, modules, and topic blocks with AI parsing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs: File Upload vs Text */}
            <div className="flex rounded-xl bg-muted/60 p-1 gap-1">
              <button
                type="button"
                onClick={() => setUploadTab("file")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                  uploadTab === "file"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Upload PDF / Document</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadTab("text")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                  uploadTab === "text"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Paste Syllabus Text</span>
              </button>
            </div>

            <form onSubmit={handleUploadSyllabus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Course or Subject Name
                </label>
                <input
                  type="text"
                  value={syllabusName}
                  onChange={(e) => setSyllabusName(e.target.value)}
                  placeholder="e.g. CS 301 — Advanced Algorithms & Data Structures"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {uploadTab === "file" ? (
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Syllabus Photo or Document (JPG, PNG, PDF, TXT)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-muted/20"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setUploadFile(f);
                          if (!syllabusName) {
                            setSyllabusName(f.name.replace(/\.[^/.]+$/, ""));
                          }
                        }
                      }}
                    />
                    <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                    {uploadFile ? (
                      <p className="text-xs font-bold text-primary font-mono truncate">
                        Selected: {uploadFile.name}
                      </p>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-foreground">
                          Click to select or drag & drop syllabus photo or PDF
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Photos (JPG, PNG, WebP) & Documents (PDF, TXT) up to 20 MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Syllabus Text
                  </label>
                  <textarea
                    value={syllabusText}
                    onChange={(e) => setSyllabusText(e.target.value)}
                    placeholder="Paste modules, unit breakdowns, chapters, and topics here..."
                    rows={6}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border/80 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading}
                  size="sm"
                  className="rounded-xl text-xs font-bold gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Parsing Curriculum…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Process & Extract Blocks</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suggested Playlists & Videos Modal / Drawer */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-card border border-border/80 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border/80 flex items-start justify-between gap-3 bg-muted/20 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    {selectedBlock.moduleCode} • TOPIC BLOCK
                  </span>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    {selectedBlock.subtopics.length} Subtopics
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <Youtube className="h-5 w-5 text-rose-500" />
                  <span>{selectedBlock.title}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {loadingBlockResources ? (
                <div className="py-16 text-center space-y-3">
                  <div className="flex items-center justify-center">
                    <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 animate-pulse border border-rose-500/20">
                      <Youtube className="h-8 w-8 animate-bounce" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Discovering Real Playlists & Ranked Videos…
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    Searching YouTube courses and querying subtopics in this block
                  </p>
                </div>
              ) : blockResources ? (
                <>
                  {/* Section 1: Suggested Course Playlists */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                        <ListVideo className="h-4 w-4 text-rose-500" />
                        <span>Suggested Full Playlists for Block</span>
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {blockResources.playlists.length} playlists found
                      </span>
                    </div>

                    {blockResources.playlists.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 text-center text-xs text-muted-foreground">
                        No direct full playlists discovered for this block query.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {blockResources.playlists.map((pl, pIdx) => (
                          <div
                            key={pIdx}
                            className="rounded-2xl bg-card/90 border border-border/80 overflow-hidden flex flex-col justify-between hover:border-rose-500/40 transition-all bento-card shadow-xs group"
                          >
                            <div className="relative aspect-video bg-muted overflow-hidden">
                              <img
                                src={pl.thumbnail_url}
                                alt={pl.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-black/80 text-white border border-white/20">
                                  {pl.video_count || "Playlist"}
                                </span>
                              </div>
                            </div>

                            <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                              <div>
                                <h5 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                                  {pl.title}
                                </h5>
                                <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                                  {pl.channel_title}
                                </p>
                              </div>

                              <a
                                href={pl.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 w-full py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[11px] font-bold transition-colors flex items-center justify-center gap-1 border border-rose-500/20"
                              >
                                <span>Open Full Playlist</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 2: Subtopics and Videos Breakdown */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                        <Play className="h-4 w-4 text-primary" />
                        <span>Topic & Subtopic Video Tutorials</span>
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Ranked by educational quality
                      </span>
                    </div>

                    {/* Subtopic Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <button
                        onClick={() => setActiveSubtopicFilter("all")}
                        className={cn(
                          "px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                          activeSubtopicFilter === "all"
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/80"
                        )}
                      >
                        All Block Videos ({blockResources.videos.length})
                      </button>

                      {selectedBlock.subtopics.map((sub, sIdx) => {
                        const subVids =
                          blockResources.subtopics_resources[sub.title] || [];
                        return (
                          <button
                            key={sIdx}
                            onClick={() => setActiveSubtopicFilter(sub.title)}
                            className={cn(
                              "px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5",
                              activeSubtopicFilter === sub.title
                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/80"
                            )}
                          >
                            <span>{sub.title}</span>
                            <span className="text-[9px] font-mono opacity-80">
                              ({subVids.length})
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Video Cards Grid */}
                    {(() => {
                      const displayedVideos =
                        activeSubtopicFilter === "all"
                          ? blockResources.videos
                          : blockResources.subtopics_resources[activeSubtopicFilter] || [];

                      if (displayedVideos.length === 0) {
                        return (
                          <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 text-center text-xs text-muted-foreground">
                            No specific video tutorials found for this subtopic.
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {displayedVideos.map((video, vIdx) => (
                            <div
                              key={vIdx}
                              className="p-3.5 rounded-2xl bg-card/90 border border-border/80 flex flex-col justify-between space-y-3 bento-card shadow-xs hover:border-primary/40 transition-all group"
                            >
                              <div className="space-y-2.5">
                                <div className="flex gap-3">
                                  <div className="relative w-28 sm:w-32 aspect-video rounded-xl bg-muted overflow-hidden shrink-0">
                                    <img
                                      src={video.thumbnail_url}
                                      alt={video.title}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                    />
                                    {video.duration !== "N/A" && (
                                      <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/80 text-white">
                                        {video.duration}
                                      </span>
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1 space-y-1">
                                    <h5 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                                      {video.title}
                                    </h5>
                                    <p className="text-[11px] text-muted-foreground font-mono truncate flex items-center gap-1">
                                      <Youtube className="h-3 w-3 text-rose-500 shrink-0" />
                                      {video.channel_title}
                                    </p>
                                  </div>
                                </div>

                                {video.why_recommended && (
                                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-xl border border-border/40 leading-relaxed font-sans">
                                    💡 <span className="font-semibold text-foreground">Why Recommended:</span>{" "}
                                    {video.why_recommended}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => setActiveVideoModal(video)}
                                  className="flex-1 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                                >
                                  <Play className="h-3 w-3 fill-current" />
                                  <span>Watch in App</span>
                                </button>
                                <a
                                  href={video.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1.5 px-2.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold transition-colors flex items-center justify-center gap-1 border border-border/80"
                                  title="Open on YouTube"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Embedded YouTube Video Player Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-card border border-border/80 overflow-hidden shadow-2xl space-y-4 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-4">
                <h4 className="text-sm font-bold text-foreground truncate">
                  {activeVideoModal.title}
                </h4>
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                  <Youtube className="h-3.5 w-3.5 text-rose-500" />
                  {activeVideoModal.channel_title}
                </p>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border/40">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoModal.video_id}?autoplay=1`}
                title={activeVideoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <p className="text-muted-foreground text-[11px] font-sans">
                {activeVideoModal.why_recommended}
              </p>
              <a
                href={activeVideoModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-bold shrink-0 ml-3"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
