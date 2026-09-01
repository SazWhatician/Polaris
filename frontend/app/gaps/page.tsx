"use client";

import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  FileText,
  GripVertical,
  Info,
  Loader2,
  Play,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { listDocuments, type DocumentResponse } from "@/lib/api/documents";
import {
  createSyllabus,
  listSyllabi,
  deleteSyllabus,
  computeSyllabusCoverage,
  getSyllabusCoverage,
  type SyllabusResponse,
  type SyllabusCoverage,
  type Topic,
} from "@/lib/api/syllabus";
import {
  triggerGapAnalysis,
  getGapAnalysisStatus,
  updateGapRecommendations,
  type GapRecommendation,
} from "@/lib/api/agents";
import { ApiError } from "@/lib/api/client";

export default function GapsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Core data states
  const [syllabi, setSyllabi] = useState<SyllabusResponse[]>([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<string>("");
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [coverage, setCoverage] = useState<SyllabusCoverage | null>(null);
  const [recommendations, setRecommendations] = useState<GapRecommendation[]>([]);
  const [gapsMap, setGapsMap] = useState<Record<string, "known" | "weak" | "missing">>({});

  // Loading/action states
  const [loadingSyllabi, setLoadingSyllabi] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [computingCoverage, setComputingCoverage] = useState(false);
  const [agentStatus, setAgentStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [saving, setSaving] = useState(false);
  const [deletingSyllabusId, setDeletingSyllabusId] = useState<string | null>(null);

  // Modal / form states for creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSyllabusName, setNewSyllabusName] = useState("");
  const [newSyllabusText, setNewSyllabusText] = useState("");
  const [newSyllabusDocId, setNewSyllabusDocId] = useState("");
  const [creatingSyllabus, setCreatingSyllabus] = useState(false);

  // Detail viewer modal
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Drag and drop index
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  // Fetch initial list of syllabi
  const fetchSyllabi = async (selectNewId?: string) => {
    try {
      setLoadingSyllabi(true);
      const res = await listSyllabi();
      setSyllabi(res.items);
      if (res.items.length > 0) {
        if (selectNewId) {
          setSelectedSyllabusId(selectNewId);
        } else if (!selectedSyllabusId) {
          setSelectedSyllabusId(res.items[0]!.id);
        }
      } else {
        setSelectedSyllabusId("");
      }
    } catch (e) {
      toast.error("Failed to load syllabi", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoadingSyllabi(false);
    }
  };

  useEffect(() => {
    if (user) {
      void fetchSyllabi();
    }
  }, [user]);

  // Load documents when the creation modal opens
  useEffect(() => {
    if (showCreateModal && user) {
      const fetchDocs = async () => {
        try {
          setLoadingDocs(true);
          const docsList = await listDocuments();
          setDocuments(docsList);
        } catch (e) {
          toast.error("Failed to load documents", {
            description: e instanceof Error ? e.message : String(e),
          });
        } finally {
          setLoadingDocs(false);
        }
      };
      void fetchDocs();
    }
  }, [showCreateModal, user]);

  const selectedSyllabus = useMemo(() => {
    return syllabi.find((s) => s.id === selectedSyllabusId) || null;
  }, [syllabi, selectedSyllabusId]);

  // Flatten the syllabus tree to map IDs to Topic titles and descriptions
  const topicMap = useMemo(() => {
    const map = new Map<string, Topic>();
    if (!selectedSyllabus) return map;
    const traverse = (t: Topic) => {
      map.set(t.id, t);
      t.subtopics?.forEach(traverse);
    };
    selectedSyllabus.tree.forEach(traverse);
    return map;
  }, [selectedSyllabus]);

  // Load coverage and agent runs when syllabus changes
  useEffect(() => {
    if (!selectedSyllabusId || !user) {
      setCoverage(null);
      setRecommendations([]);
      setGapsMap({});
      setAgentStatus("idle");
      return;
    }

    let isSubscribed = true;

    const loadData = async () => {
      // First, get coverage
      try {
        const cov = await getSyllabusCoverage(selectedSyllabusId);
        if (isSubscribed) setCoverage(cov);
      } catch {
        if (isSubscribed) setCoverage(null);
      }

      // Next, check gap agent run status
      const threadId = `${user.uid}:${selectedSyllabusId}`;
      try {
        const runState = await getGapAnalysisStatus(threadId);
        if (!isSubscribed) return;

        if (runState && ("detail" in runState) && (runState as Record<string, unknown>).detail === "Gap analysis is still running") {
          setAgentStatus("running");
        } else {
          setAgentStatus("completed");
          setRecommendations(runState.recommendations || []);
          setGapsMap(runState.gaps || {});
        }
      } catch (err) {
        if (isSubscribed) {
          if (err instanceof ApiError && err.status === 404) {
            setAgentStatus("idle");
          } else {
            setAgentStatus("failed");
          }
          setRecommendations([]);
          setGapsMap({});
        }
      }
    };

    void loadData();

    return () => {
      isSubscribed = false;
    };
  }, [selectedSyllabusId, user]);

  // Background polling for running agent
  useEffect(() => {
    if (agentStatus !== "running" || !selectedSyllabusId || !user) return;

    const threadId = `${user.uid}:${selectedSyllabusId}`;

    const poll = async () => {
      try {
        const runState = await getGapAnalysisStatus(threadId);
        if (runState && ("detail" in runState) && (runState as Record<string, unknown>).detail === "Gap analysis is still running") {
          return;
        }

        setAgentStatus("completed");
        setRecommendations(runState.recommendations || []);
        setGapsMap(runState.gaps || {});
        try {
          const cov = await getSyllabusCoverage(selectedSyllabusId);
          setCoverage(cov);
        } catch {
          // Ignore
        }
        toast.success("Learning gaps analysis finished!");
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setAgentStatus("idle");
        } else if (err instanceof ApiError && err.status >= 500) {
          setAgentStatus("failed");
          toast.error("Learning gap analysis failed", {
            description: err.message,
          });
        }
      }
    };

    const intervalId = setInterval(poll, 3000);
    return () => clearInterval(intervalId);
  }, [agentStatus, selectedSyllabusId, user]);

  // Handlers
  const handleCreateSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSyllabusName.trim()) return;

    try {
      setCreatingSyllabus(true);
      const res = await createSyllabus(
        newSyllabusName,
        newSyllabusText || undefined,
        newSyllabusDocId || undefined,
      );
      toast.success("Syllabus created!");
      setShowCreateModal(false);
      setNewSyllabusName("");
      setNewSyllabusText("");
      setNewSyllabusDocId("");
      await fetchSyllabi(res.id);
    } catch (e) {
      toast.error("Failed to create syllabus", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setCreatingSyllabus(false);
    }
  };

  const handleDeleteSyllabus = async (id: string) => {
    try {
      setDeletingSyllabusId(id);
      await deleteSyllabus(id);
      toast.success("Syllabus deleted");
      await fetchSyllabi();
    } catch (e) {
      toast.error("Failed to delete syllabus", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setDeletingSyllabusId(null);
    }
  };

  const handleComputeCoverage = async () => {
    if (!selectedSyllabusId) return;
    try {
      setComputingCoverage(true);
      const res = await computeSyllabusCoverage(selectedSyllabusId);
      setCoverage(res);
      toast.success("Syllabus coverage computed!");
    } catch (e) {
      toast.error("Failed to compute coverage", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setComputingCoverage(false);
    }
  };

  const handleRunAgent = async () => {
    if (!selectedSyllabusId) return;
    try {
      setAgentStatus("running");
      await triggerGapAnalysis(selectedSyllabusId);
      toast.info("Learning Gap Agent started", {
        description: "Assessing notes against syllabus coverage...",
      });
    } catch (e) {
      setAgentStatus("idle");
      toast.error("Failed to run agent", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  // Drag and drop reordering handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex || !selectedSyllabusId || !user) {
      return;
    }

    const list = [...recommendations];
    const [removed] = list.splice(draggedIndex, 1);
    if (!removed) return;
    list.splice(targetIndex, 0, removed);
    setRecommendations(list);
    setDraggedIndex(null);

    const threadId = `${user.uid}:${selectedSyllabusId}`;
    try {
      setSaving(true);
      await updateGapRecommendations(threadId, list);
      toast.success("Study plan order updated!");
    } catch (err) {
      toast.error("Failed to save reordered recommendations", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  // Actionable steps checker
  const toggleStep = async (recIndex: number, stepIndex: number) => {
    if (!selectedSyllabusId || !user) return;
    const list = [...recommendations];
    const rec = list[recIndex];
    if (!rec) return;
    const steps = [...rec.actionable_steps];
    let step = steps[stepIndex];
    if (!step) return;

    if (step.startsWith("[x] ")) {
      step = "[ ] " + step.slice(4);
    } else if (step.startsWith("[ ] ")) {
      step = "[x] " + step.slice(4);
    } else {
      step = "[x] " + step;
    }

    steps[stepIndex] = step;
    rec.actionable_steps = steps;
    list[recIndex] = rec;
    setRecommendations(list);

    const threadId = `${user.uid}:${selectedSyllabusId}`;
    try {
      await updateGapRecommendations(threadId, list);
    } catch (err) {
      toast.error("Failed to save progress check", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  // Compute three status columns based on gapsMap or topic coverage
  const columns = useMemo(() => {
    const known: { id: string; title: string; score: number }[] = [];
    const weak: { id: string; title: string; score: number }[] = [];
    const missing: { id: string; title: string; score: number }[] = [];

    if (!selectedSyllabus) return { known, weak, missing };

    // Traverse map or keys
    topicMap.forEach((topic, topicId) => {
      // Find coverage details
      const cov = coverage?.topics[topicId];
      const score = cov?.score ?? 0;
      const status = gapsMap[topicId] || (cov ? (cov.status === "good" ? "known" : cov.status === "partial" ? "weak" : "missing") : "missing");

      const item = { id: topicId, title: topic.title, score };
      if (status === "known") {
        known.push(item);
      } else if (status === "weak") {
        weak.push(item);
      } else {
        missing.push(item);
      }
    });

    return { known, weak, missing };
  }, [selectedSyllabus, topicMap, coverage, gapsMap]);

  // Topic detail details
  const selectedTopicDetails = useMemo(() => {
    if (!selectedTopicId) return null;
    const topic = topicMap.get(selectedTopicId);
    const cov = coverage?.topics[selectedTopicId];
    return {
      topic,
      cov,
    };
  }, [selectedTopicId, topicMap, coverage]);

  if (loading || !user) return null;

  return (
    <div className="relative min-h-screen text-foreground pb-32 pt-14 sm:pt-16 overflow-x-hidden selection:bg-primary/30 selection:text-foreground">
      {/* ── Ambient Fluid Liquid Caustic Spheres (iOS/visionOS Glass Glow) ── */}
      <div className="ambient-liquid-glow -top-24 -left-24 w-[500px] h-[500px] bg-indigo-500/20" />
      <div className="ambient-liquid-glow top-[38%] -right-32 w-[550px] h-[550px] bg-purple-500/15" />
      <div className="ambient-liquid-glow bottom-12 left-[20%] w-[600px] h-[600px] bg-emerald-500/12" />

      <SiteHeader />
      <main className="relative z-10 max-w-7xl mx-auto space-y-6 py-4 px-3 sm:px-6 lg:px-8">
        {/* Standardized Page Header */}
        <PageHeader
          category="ACADEMIC INTELLIGENCE // GAP DETECTOR"
          title="Learning Gaps & Coverage Scoring"
          description="Analyze class notes and vector chunks against your course syllabus to target weak concepts and get recommended YouTube resources."
          icon={Target}
          badgeText="Syllabus Evaluator"
          badgeVariant="purple"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                className="gap-1.5 text-xs font-bold rounded-2xl border-white/20 bg-white/10 dark:bg-white/5 hover:bg-white/15 backdrop-blur-xl"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Syllabus</span>
              </Button>

              {selectedSyllabusId && (
                <Button
                  variant="outline"
                  size="icon"
                  disabled={deletingSyllabusId === selectedSyllabusId}
                  onClick={() => void handleDeleteSyllabus(selectedSyllabusId)}
                  title="Delete current syllabus"
                  className="h-9 w-9 rounded-2xl text-destructive hover:bg-destructive/10 border-white/20 bg-white/5"
                >
                  {deletingSyllabusId === selectedSyllabusId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          }
        />

        {/* Empty State */}
        {syllabi.length === 0 && !loadingSyllabi && (
          <div className="flex flex-col items-center justify-center p-12 text-center border-dashed rounded-3xl liquid-glass">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>No syllabi added yet</CardTitle>
            <CardDescription className="max-w-md mt-2">
              Create a syllabus first by pasting your syllabus outline or linking an uploaded PDF notes document to map coverage.
            </CardDescription>
            <Button onClick={() => setShowCreateModal(true)} className="mt-6 gap-2 rounded-2xl bg-primary text-primary-foreground">
              <Plus className="h-4 w-4" />
              Create First Syllabus
            </Button>
          </div>
        )}

        {selectedSyllabus && (
          <div className="space-y-6">
            
            {/* Overview & Action Bar */}
            <div className="grid gap-3.5 md:grid-cols-3">
              <div className="liquid-glass p-5 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    Syllabus Coverage Score
                  </div>
                  <div className="space-y-2 mt-2">
                    {coverage ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono tracking-tight text-primary">
                          {coverage.overall_score.toFixed(0)}%
                        </span>
                        <span className="text-xs text-muted-foreground">
                          covered by notes
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not calculated yet</p>
                    )}
                    
                    {coverage && (
                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${coverage.overall_score}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-3">
                  <Button
                    onClick={handleComputeCoverage}
                    disabled={computingCoverage}
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 h-8 text-xs font-bold rounded-xl"
                  >
                    {computingCoverage ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Computing...</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-3 w-3" />
                        <span>Analyze Notes Coverage</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="liquid-glass p-5 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    Study Recommendations
                  </div>
                  <div className="mt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono tracking-tight text-primary">
                        {recommendations.length}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        gaps to address
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Ranked by prerequisite dependencies.
                    </p>
                  </div>
                </div>
                <div className="pt-3">
                  <Button
                    onClick={handleRunAgent}
                    disabled={agentStatus === "running" || !coverage}
                    data-agent-target="run-gap-agent-btn"
                    size="sm"
                    className="w-full gap-1.5 h-8.5 text-xs font-bold rounded-2xl bg-primary text-primary-foreground shadow-xs"
                  >
                    {agentStatus === "running" ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Assessing Gaps...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        <span>{recommendations.length > 0 ? "Re-Run Gap Agent" : "Run Gap Agent"}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="liquid-glass p-5 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    Total Estimated Study Time
                  </div>
                  <div className="mt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono tracking-tight text-primary">
                        {recommendations.reduce((sum, r) => sum + r.estimated_hours, 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        hours of focused study
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Calculated from conceptual complexity.
                    </p>
                  </div>
                </div>
                <div className="pt-3">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 h-8.5">
                    <Info className="h-3 w-3 text-primary shrink-0" />
                    <span>Drag cards below to customize order.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Layout */}
            <div className="grid gap-6 lg:grid-cols-12">
              
              {/* Left Column: Topics Board (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-500" />
                    Syllabus Topics Board
                  </h2>
                  <span className="text-xs text-muted-foreground">Click card for matched notes and context</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Known Column */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Known ({columns.known.length})
                      </span>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2 min-h-[300px] space-y-2 border border-muted/60">
                      {columns.known.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">None yet</p>
                      ) : (
                        columns.known.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTopicId(t.id)}
                            className="bg-card hover:bg-accent/40 border border-muted rounded-md p-3 shadow-sm cursor-pointer transition duration-150 ease-in-out group flex flex-col justify-between"
                          >
                            <span className="text-xs font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                              {t.title}
                            </span>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted/50">
                              <span className="text-[10px] text-muted-foreground">ID: {t.id}</span>
                              <Badge className="text-[10px] bg-green-500/10 text-green-600 hover:bg-green-500/10 border-0">
                                {t.score.toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Weak Column */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Weak ({columns.weak.length})
                      </span>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2 min-h-[300px] space-y-2 border border-muted/60">
                      {columns.weak.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">None yet</p>
                      ) : (
                        columns.weak.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTopicId(t.id)}
                            className="bg-card hover:bg-accent/40 border border-muted rounded-md p-3 shadow-sm cursor-pointer transition duration-150 ease-in-out group flex flex-col justify-between"
                          >
                            <span className="text-xs font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                              {t.title}
                            </span>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted/50">
                              <span className="text-[10px] text-muted-foreground">ID: {t.id}</span>
                              <Badge className="text-[10px] bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 border-0">
                                {t.score.toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Missing Column */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" />
                        Missing ({columns.missing.length})
                      </span>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2 min-h-[300px] space-y-2 border border-muted/60">
                      {columns.missing.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">None yet</p>
                      ) : (
                        columns.missing.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTopicId(t.id)}
                            className="bg-card hover:bg-accent/40 border border-muted rounded-md p-3 shadow-sm cursor-pointer transition duration-150 ease-in-out group flex flex-col justify-between"
                          >
                            <span className="text-xs font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                              {t.title}
                            </span>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted/50">
                              <span className="text-[10px] text-muted-foreground">ID: {t.id}</span>
                              <Badge className="text-[10px] bg-red-500/10 text-red-600 hover:bg-red-500/10 border-0">
                                {t.score.toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Ordered Study Path / Recommendations (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    Personalized Study Path
                  </h2>
                  {saving && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Saving cloud order...
                    </span>
                  )}
                </div>

                {recommendations.length === 0 ? (
                  <Card className="flex flex-col items-center justify-center p-8 text-center bg-card/30 backdrop-blur-sm border-dashed">
                    <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
                    <CardTitle className="text-sm">No study path generated yet</CardTitle>
                    <CardDescription className="max-w-xs mt-1">
                      Ensure syllabus coverage has been calculated, then trigger the Learning Gap Agent to get started.
                    </CardDescription>
                    <Button
                      onClick={handleRunAgent}
                      disabled={agentStatus === "running" || !coverage}
                      size="sm"
                      className="mt-4 gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5" /> Start Analysis
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => {
                      const isWeak = rec.status === "weak";
                      return (
                        <div
                          key={rec.topic_id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`bg-card border rounded-lg p-4 shadow-sm select-none relative transition duration-200 group ${
                            draggedIndex === index
                              ? "opacity-40 border-dashed border-primary"
                              : "hover:shadow-md hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* Drag handle */}
                            <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary mt-1 p-0.5 rounded transition">
                              <GripVertical className="h-4 w-4" />
                            </div>

                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-semibold text-sm leading-tight text-primary">
                                  {rec.title}
                                </h3>
                                <Badge
                                  className={`text-[10px] py-0.5 border-0 ${
                                    isWeak
                                      ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10"
                                      : "bg-red-500/10 text-red-600 hover:bg-red-500/10"
                                  }`}
                                >
                                  {rec.status}
                                </Badge>
                              </div>

                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {rec.reason}
                              </p>

                              {/* Checklist */}
                              {rec.actionable_steps && rec.actionable_steps.length > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-muted/50">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Actionable study tasks
                                  </span>
                                  <div className="space-y-1">
                                    {rec.actionable_steps.map((step, sIdx) => {
                                      const isChecked = step.startsWith("[x] ");
                                      const text = step.startsWith("[x] ") || step.startsWith("[ ] ") ? step.slice(4) : step;
                                      return (
                                        <div
                                          key={sIdx}
                                          onClick={() => toggleStep(index, sIdx)}
                                          className="flex items-start gap-2 cursor-pointer group/item py-0.5"
                                        >
                                          <div className={`mt-0.5 h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors ${
                                            isChecked
                                              ? "bg-primary border-primary text-primary-foreground"
                                              : "border-muted-foreground/30 hover:border-primary"
                                          }`}>
                                            {isChecked && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                                          </div>
                                          <span className={`text-xs ${isChecked ? "text-muted-foreground line-through decoration-muted-foreground/60" : "text-primary/95"}`}>
                                            {text}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                                <span>Topic ID: {rec.topic_id}</span>
                                <span className="font-semibold text-primary/80">
                                  ~{rec.estimated_hours.toFixed(1)} hrs
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Creation Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Syllabus</DialogTitle>
            <DialogDescription>
              Add a new course syllabus to map your notes and find learning gaps.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSyllabus} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="syllabusName">Syllabus Name</Label>
              <Input
                id="syllabusName"
                placeholder="e.g. CS 101: Introduction to Computer Science"
                value={newSyllabusName}
                onChange={(e) => setNewSyllabusName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="syllabusText">Option A: Paste Syllabus text</Label>
                <textarea
                  id="syllabusText"
                  placeholder="Paste syllabus, topics outline, or course content details here..."
                  value={newSyllabusText}
                  onChange={(e) => setNewSyllabusText(e.target.value)}
                  className="flex-1 min-h-[150px] max-h-[250px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <Label htmlFor="syllabusDoc">Option B: Select Syllabus Document</Label>
                {loadingDocs ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading uploaded notes...
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No documents uploaded. Go to Documents tab to upload a file first.
                  </p>
                ) : (
                  <select
                    id="syllabusDoc"
                    value={newSyllabusDocId}
                    onChange={(e) => setNewSyllabusDocId(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">-- Select document --</option>
                    {documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.filename}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-muted-foreground mt-auto pt-2">
                  Linking an uploaded document parses its OCR text directly into the syllabus mapping system.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creatingSyllabus || !newSyllabusName.trim()}>
                {creatingSyllabus ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Creating...
                  </>
                ) : (
                  "Create Syllabus"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Topic Detail Dialog */}
      <Dialog open={selectedTopicId !== null} onOpenChange={(open) => !open && setSelectedTopicId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedTopicDetails && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3 pr-6">
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    {selectedTopicDetails.topic?.title}
                  </DialogTitle>
                  <Badge
                    className={`text-xs py-0.5 border-0 ${
                      selectedTopicDetails.cov?.status === "good"
                        ? "bg-green-500/10 text-green-600 hover:bg-green-500/10"
                        : selectedTopicDetails.cov?.status === "partial"
                        ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/10"
                        : "bg-red-500/10 text-red-600 hover:bg-red-500/10"
                    }`}
                  >
                    {selectedTopicDetails.cov?.status === "good"
                      ? "Known"
                      : selectedTopicDetails.cov?.status === "partial"
                      ? "Weak"
                      : "Missing"}
                  </Badge>
                </div>
                <DialogDescription className="text-xs">
                  Topic ID: {selectedTopicDetails.topic?.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                
                {/* Score & Explanation */}
                <div className="space-y-2 bg-muted/30 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Confidence Assessment
                    </span>
                    <span className="text-sm font-bold text-primary">
                      Coverage Score: {selectedTopicDetails.cov?.score.toFixed(0) ?? 0}%
                    </span>
                  </div>
                  <p className="text-sm text-primary/90 leading-relaxed pt-1">
                    {selectedTopicDetails.cov?.explanation || "This topic has not been computed or matched yet."}
                  </p>
                </div>

                {/* Subtopics */}
                {selectedTopicDetails.topic?.subtopics && selectedTopicDetails.topic.subtopics.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Subtopics ({selectedTopicDetails.topic.subtopics.length})
                    </span>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedTopicDetails.topic.subtopics.map((sub) => (
                        <div key={sub.id} className="border rounded p-2.5 bg-card text-xs flex justify-between items-center">
                          <span>{sub.title}</span>
                          <span className="text-[10px] text-muted-foreground">ID: {sub.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matched Documents (Citations) */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    Source Notes References ({selectedTopicDetails.cov?.matched_chunks?.length ?? 0})
                  </span>
                  
                  {!selectedTopicDetails.cov?.matched_chunks || selectedTopicDetails.cov.matched_chunks.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-lg bg-card text-xs text-muted-foreground">
                      No matching documents found in your notes.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTopicDetails.cov.matched_chunks.map((chunkItem, idx) => {
                        const chunk = chunkItem as Record<string, unknown>;
                        const meta = (chunk.metadata || {}) as Record<string, unknown>;
                        const docName = String(chunk.document_name || meta.document_name || "Document Link");
                        const pageNum = String(chunk.page_number || meta.page_number || "N/A");
                        const scoreVal = typeof chunk.score === "number" ? chunk.score : 0;
                        const snippet = String(chunk.text || chunk.content || "Snippet unavailable.");
                        return (
                          <div key={idx} className="border rounded-lg p-3 bg-card space-y-2 shadow-sm">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b pb-1.5">
                              <span className="font-semibold text-primary/80 flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {docName}
                              </span>
                              <span>
                                Page {pageNum} (score: {(scoreVal * 100).toFixed(0)}%)
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground italic leading-relaxed bg-muted/20 p-2 rounded border border-muted/40">
                              &ldquo;{snippet}&rdquo;
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
