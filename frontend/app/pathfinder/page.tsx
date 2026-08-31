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
    <div className="min-h-screen text-foreground pb-32 pt-14 sm:pt-16 selection:bg-primary/30 selection:text-foreground">
      <SiteHeader />

      <main ref={containerRef} className="max-w-7xl mx-auto space-y-6 py-4 px-3 sm:px-6 lg:px-8">
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
          <p className="text-[10px] font-mono text-muted-foreground font-bold uppercase tracking-wider">
            Select Your Target Career Role
          </p>

          {loadingGoals ? (
            <Card className="p-8 text-center text-muted-foreground text-xs flex items-center justify-center gap-3 bg-card/85 backdrop-blur-xl rounded-2xl border-border/80 bento-card">
              <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
              <span>Loading career goals...</span>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {goals.map((g) => {
                const isSelected = selectedGoalId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGoalId(g.id);
                      void handleAnalyze(g.id);
                    }}
                    className={`p-4 sm:p-5 rounded-2xl text-left bento-card shadow-xs transition-all relative group overflow-hidden border backdrop-blur-xl ${
                      isSelected
                        ? "border-amber-500/80 bg-amber-500/10 ring-1 ring-amber-500/30"
                        : "bg-card/85 border-border/80 hover:border-primary/50"
                    }`}
                    data-agent-target={`career-goal-${g.id}`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`p-2 rounded-xl border bento-icon-bounce ${isSelected ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-primary/10 text-primary border-primary/20"}`}>
                        <Briefcase className="h-4 w-4" />
                      </div>
                      {isSelected && <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />}
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-foreground mb-1">{g.title}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{g.description}</p>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-foreground border-t border-border/40 pt-2.5">
                      <span>{g.required_skills.length} Required Skills</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform text-foreground" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button if no plan auto-loaded */}
        {!plan && !analyzing && selectedGoalId && (
          <div className="gsap-pathfinder text-center py-2">
            <Button
              onClick={() => handleAnalyze()}
              className="text-xs py-2 px-6 font-bold inline-flex items-center gap-2 rounded-xl shadow-xs"
              data-agent-target="analyze-career-btn"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Analyze Gap for {goals.find((g) => g.id === selectedGoalId)?.title}</span>
            </Button>
          </div>
        )}

        {/* Analysis Loading */}
        {analyzing && (
          <Card className="gsap-pathfinder p-8 text-center text-xs flex flex-col items-center justify-center gap-2.5 bg-card/85 backdrop-blur-xl rounded-2xl border-border/80 bento-card">
            <RefreshCw className="h-5 w-5 animate-spin text-amber-500" />
            <span className="font-bold text-sm text-foreground">Pathfinder Orchestrating Agent Swarm...</span>
            <span className="text-muted-foreground text-xs">
              Combining Digital Twin State + Graph Prerequisites + Skill Taxonomy
            </span>
          </Card>
        )}

        {/* Career Plan Results */}
        {plan && !analyzing && (
          <div className="gsap-pathfinder space-y-4">
            {/* Overview / Score Banner */}
            <Card className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                    Role Overview
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-foreground mt-1.5">
                    {plan.career_goal.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                    {plan.summary}
                  </p>
                </div>

                {/* Meter */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50 min-w-[200px]">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-mono font-bold uppercase tracking-wider">
                      Readiness Score
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-foreground font-mono">
                      {Math.round(plan.readiness_score * 100)}%
                    </p>
                    <p className="text-[10px] font-mono text-emerald-500 font-semibold">
                      {plan.ready_skills.length} of {plan.career_goal.required_skills.length} skills ready
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Skill Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Ready Skills */}
              <Card className="p-4 sm:p-5 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs space-y-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-500 font-mono">
                    Ready Skills ({plan.ready_skills.length})
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {plan.ready_skills.length > 0 ? (
                    plan.ready_skills.map((skill) => (
                      <div
                        key={skill}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-between"
                      >
                        <span>{skill}</span>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No ready skills identified yet.
                    </p>
                  )}
                </div>
              </Card>

              {/* Weak Skills */}
              <Card className="p-4 sm:p-5 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs space-y-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-500 font-mono">
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
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center justify-between"
                        >
                          <span>{sg.skill}</span>
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No weak skills flagged.
                    </p>
                  )}
                </div>
              </Card>

              {/* Missing Skills */}
              <Card className="p-4 sm:p-5 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs space-y-3">
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-4 w-4 text-rose-500" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-rose-500 font-mono">
                    Missing Skills ({plan.missing_skills.length})
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {plan.missing_skills.length > 0 ? (
                    plan.missing_skills.map((skill) => (
                      <div
                        key={skill}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center justify-between"
                      >
                        <span>{skill}</span>
                        <XCircle className="h-3 w-3 text-rose-500" />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      All required skills ready!
                    </p>
                  )}
                </div>
              </Card>
            </div>

            {/* Recommended Projects */}
            <Card className="p-5 sm:p-6 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-foreground font-mono">
                  Recommended Portfolio Projects
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plan.recommended_projects.map((proj, idx) => (
                  <div
                    key={proj.title}
                    className="p-4 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/40 transition-colors space-y-1.5"
                  >
                    <span className="text-[9px] font-mono text-primary font-bold uppercase">
                      Project #{idx + 1}
                    </span>
                    <h5 className="font-bold text-xs sm:text-sm text-foreground">{proj.title}</h5>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{proj.description}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommended Learning Path Sequence */}
            {plan.learning_path.length > 0 && (
              <Card className="p-5 sm:p-6 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground font-mono">
                    Sequenced Learning Roadmap
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {plan.learning_path.map((skill, idx) => (
                    <div key={skill} className="flex items-center gap-1.5">
                      <span className="px-3 py-1.5 rounded-xl bg-muted/50 border border-border/60 text-foreground font-mono text-xs font-medium">
                        <span className="text-primary font-bold mr-1 font-sans">{idx + 1}.</span>
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
