"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Briefcase,
  Target,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Code,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useGsapEntrance } from "@/lib/use-animation-system";
import {
  fetchCareerGoals,
  analyzeCareerPath,
  type CareerGoal,
  type CareerPlan,
} from "@/lib/api/pathfinder";

export default function PathfinderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [plan, setPlan] = useState<CareerPlan | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const containerRef = useGsapEntrance(".gsap-pathfinder", 0.05);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  const loadGoals = useCallback(async () => {
    setLoadingGoals(true);
    try {
      const data = await fetchCareerGoals();
      setGoals(data);
      if (data.length > 0 && !selectedGoalId && data[0]) {
        setSelectedGoalId(data[0].id);
      }
    } catch (err) {
      toast.error("Failed to load career goals", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoadingGoals(false);
    }
  }, [selectedGoalId]);

  useEffect(() => {
    if (user) void loadGoals();
  }, [user, loadGoals]);

  const handleAnalyze = async (goalId?: string) => {
    const targetId = goalId || selectedGoalId;
    if (!targetId) return;

    setAnalyzing(true);
    setPlan(null);
    try {
      const result = await analyzeCareerPath(targetId);
      setPlan(result);
      toast.success(`Generated roadmap for ${result.career_goal.title}`);
    } catch (err) {
      toast.error("Analysis failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen pb-32 pt-14 text-foreground selection:bg-primary/30 selection:text-foreground sm:pt-16">
      <SiteHeader />

      <main ref={containerRef} className="mx-auto max-w-7xl space-y-6 px-3 py-4 sm:px-6 lg:px-8">
        {/* Standardized Page Header */}
        <div className="gsap-pathfinder">
          <PageHeader
            category="ACADEMIC INTELLIGENCE // CAREER PATHFINDER"
            title="Career Pathfinder & Skill Matrix"
            description="Autonomous multi-agent composer that bridges course syllabus concepts to real-world engineering roles and project roadmaps."
            icon={Compass}
            badgeText="Multi-Agent Composer"
            badgeVariant="amber"
          />
        </div>

        {/* Goal Selector Grid */}
        <div className="gsap-pathfinder space-y-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Select Your Target Career Role
          </p>

          {loadingGoals ? (
            <Card className="bento-card flex items-center justify-center gap-3 rounded-2xl border-border/80 bg-card/85 p-8 text-center text-xs text-muted-foreground backdrop-blur-xl">
              <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
              <span>Loading career goals...</span>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {goals.map((g) => {
                const isSelected = selectedGoalId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGoalId(g.id);
                      void handleAnalyze(g.id);
                    }}
                    className={`bento-card shadow-xs group relative overflow-hidden rounded-2xl border p-4 text-left backdrop-blur-xl transition-all sm:p-5 ${
                      isSelected
                        ? "border-amber-500/80 bg-amber-500/10 ring-1 ring-amber-500/30"
                        : "border-border/80 bg-card/85 hover:border-primary/50"
                    }`}
                    data-agent-target={`career-goal-${g.id}`}
                  >
                    <div className="mb-2.5 flex items-center justify-between">
                      <div
                        className={`bento-icon-bounce rounded-xl border p-2 ${isSelected ? "border-amber-500/30 bg-amber-500/20 text-amber-500" : "border-primary/20 bg-primary/10 text-primary"}`}
                      >
                        <Briefcase className="h-4 w-4" />
                      </div>
                      {isSelected && (
                        <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                      )}
                    </div>
                    <h3 className="mb-1 text-xs font-bold text-foreground sm:text-sm">{g.title}</h3>
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {g.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5 font-mono text-[10px] text-muted-foreground">
                      <span>{g.required_skills.length} Required Skills</span>
                      <ArrowRight className="h-3.5 w-3.5 text-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button if no plan auto-loaded */}
        {!plan && !analyzing && selectedGoalId && (
          <div className="gsap-pathfinder py-2 text-center">
            <Button
              onClick={() => handleAnalyze()}
              className="shadow-xs inline-flex items-center gap-2 rounded-xl px-6 py-2 text-xs font-bold"
              data-agent-target="analyze-career-btn"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Analyze Gap for {goals.find((g) => g.id === selectedGoalId)?.title}</span>
            </Button>
          </div>
        )}

        {/* Analysis Loading */}
        {analyzing && (
          <Card className="gsap-pathfinder bento-card flex flex-col items-center justify-center gap-2.5 rounded-2xl border-border/80 bg-card/85 p-8 text-center text-xs backdrop-blur-xl">
            <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
            <span className="text-sm font-bold text-foreground">
              Pathfinder Orchestrating Agent Swarm...
            </span>
            <span className="text-xs text-muted-foreground">
              Combining Digital Twin State + Graph Prerequisites + Skill Taxonomy
            </span>
          </Card>
        )}

        {/* Career Plan Results */}
        {plan && !analyzing && (
          <div className="gsap-pathfinder space-y-4">
            {/* Overview / Score Banner */}
            <Card className="bento-card shadow-xs space-y-3 rounded-2xl border border-border/80 bg-card/85 p-5 backdrop-blur-xl sm:rounded-3xl sm:p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-500">
                    Role Overview
                  </span>
                  <h3 className="mt-1.5 text-lg font-black text-foreground sm:text-xl">
                    {plan.career_goal.title}
                  </h3>
                  <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                    {plan.summary}
                  </p>
                </div>

                {/* Meter */}
                <div className="flex min-w-[200px] items-center gap-3 rounded-xl border border-border/50 bg-muted/40 p-3.5">
                  <div className="shrink-0 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-amber-500">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Readiness Score
                    </p>
                    <p className="font-mono text-xl font-black text-foreground sm:text-2xl">
                      {Math.round(plan.readiness_score * 100)}%
                    </p>
                    <p className="font-mono text-[10px] font-semibold text-emerald-500">
                      {plan.ready_skills.length} of {plan.career_goal.required_skills.length} skills
                      ready
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Skill Matrix Grid */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Ready Skills */}
              <Card className="bento-card shadow-xs space-y-3 rounded-2xl border border-border/80 bg-card/85 p-4 backdrop-blur-xl sm:p-5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-500">
                    Ready Skills ({plan.ready_skills.length})
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {plan.ready_skills.length > 0 ? (
                    plan.ready_skills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                      >
                        <span>{skill}</span>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic text-muted-foreground">
                      No ready skills identified yet.
                    </p>
                  )}
                </div>
              </Card>

              {/* Weak Skills */}
              <Card className="bento-card shadow-xs space-y-3 rounded-2xl border border-border/80 bg-card/85 p-4 backdrop-blur-xl sm:p-5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500">
                    Weak / Reinforce ({plan.skill_gaps.filter((s) => s.status === "weak").length})
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {plan.skill_gaps.filter((s) => s.status === "weak").length > 0 ? (
                    plan.skill_gaps
                      .filter((s) => s.status === "weak")
                      .map((sg) => (
                        <div
                          key={sg.skill}
                          className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400"
                        >
                          <span>{sg.skill}</span>
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        </div>
                      ))
                  ) : (
                    <p className="text-xs italic text-muted-foreground">No weak skills flagged.</p>
                  )}
                </div>
              </Card>

              {/* Missing Skills */}
              <Card className="bento-card shadow-xs space-y-3 rounded-2xl border border-border/80 bg-card/85 p-4 backdrop-blur-xl sm:p-5">
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-500" />
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-rose-500">
                    Missing Skills ({plan.missing_skills.length})
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {plan.missing_skills.length > 0 ? (
                    plan.missing_skills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
                      >
                        <span>{skill}</span>
                        <XCircle className="h-3 w-3 text-rose-500" />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs italic text-muted-foreground">
                      All required skills ready!
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Recommended Projects */}
            <Card className="bento-card shadow-xs space-y-4 rounded-2xl border border-border/80 bg-card/85 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  Recommended Portfolio Projects
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {plan.recommended_projects.map((proj, idx) => (
                  <div
                    key={proj.title}
                    className="space-y-1.5 rounded-xl border border-border/50 bg-muted/40 p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="font-mono text-[9px] font-bold uppercase text-primary">
                      Project #{idx + 1}
                    </span>
                    <h5 className="text-xs font-bold text-foreground sm:text-sm">{proj.title}</h5>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {proj.description}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommended Learning Path Sequence */}
            {plan.learning_path.length > 0 && (
              <Card className="bento-card shadow-xs space-y-3 rounded-2xl border border-border/80 bg-card/85 p-5 backdrop-blur-xl sm:p-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                    Sequenced Learning Roadmap
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {plan.learning_path.map((skill, idx) => (
                    <div key={skill} className="flex items-center gap-1.5">
                      <span className="rounded-xl border border-border/60 bg-muted/50 px-3 py-1.5 font-mono text-xs font-medium text-foreground">
                        <span className="mr-1 font-sans font-bold text-primary">{idx + 1}.</span>
                        {skill}
                      </span>
                      {idx < plan.learning_path.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
