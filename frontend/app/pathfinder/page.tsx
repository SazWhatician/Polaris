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
import { SkeuoScrews } from "@/components/skeuomorphic-controls";
import { BorderGlow } from "@/components/border-glow";
import { useAuth } from "@/lib/auth-context";
import { useGsapEntrance } from "@/lib/use-gsap-animations";
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
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [plan, setPlan] = useState<CareerPlan | null>(null);
  const [loadingGoals, setLoadingGoals] = useState(true);
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
      if (data.length > 0 && !selectedGoalId) {
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
      toast.success("Career Path Analysis Complete!");
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
    <div className="min-h-screen text-foreground pb-16">
      <SiteHeader />

      <main ref={containerRef} className="max-w-7xl mx-auto space-y-8 py-8 px-4 sm:px-8">
        {/* Header */}
        <div className="gsap-pathfinder skeuo-card p-6 text-xs relative">
          <SkeuoScrews />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-amber-400 font-bold uppercase tracking-wider mb-1">
                <Compass className="h-3.5 w-3.5 text-amber-400" />
                <span>Polaris AI Step 7: Pathfinder Career Agent</span>
              </div>
              <h2 className="text-lg font-extrabold text-foreground">
                Career Goal Skill-Gap Analysis & Project Roadmap
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-mono">
                Multi-Agent Composer
              </span>
            </div>
          </div>
        </div>

        {/* Goal Selector Grid */}
        <div className="gsap-pathfinder space-y-4">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
            Select Your Target Career Role
          </p>

          {loadingGoals ? (
            <div className="skeuo-card p-8 text-center text-muted-foreground text-xs flex items-center justify-center gap-3">
              <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
              <span>Loading career goals...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {goals.map((g) => {
                const isSelected = selectedGoalId === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGoalId(g.id);
                      void handleAnalyze(g.id);
                    }}
                    className={`skeuo-card p-5 text-left transition-all duration-200 relative group overflow-hidden ${
                      isSelected
                        ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30"
                        : "hover:border-white/20"
                    }`}
                    data-agent-target={`career-goal-${g.id}`}
                  >
                    <SkeuoScrews />
                    <div className="flex items-center justify-between mb-2">
                      <Briefcase className={`h-5 w-5 ${isSelected ? "text-amber-400" : "text-muted-foreground"}`} />
                      {isSelected && <Sparkles className="h-3.5 w-3.5 text-amber-400" />}
                    </div>
                    <h3 className="font-bold text-sm text-foreground mb-1">{g.title}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{g.description}</p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground border-t border-white/5 pt-2">
                      <span>{g.required_skills.length} Required Skills</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Button if no plan auto-loaded */}
        {!plan && !analyzing && selectedGoalId && (
          <div className="gsap-pathfinder text-center py-4">
            <button
              onClick={() => handleAnalyze()}
              className="skeuo-button text-xs py-3 px-6 font-bold inline-flex items-center gap-2"
              data-agent-target="analyze-career-btn"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Analyze Gap for {goals.find((g) => g.id === selectedGoalId)?.title}</span>
            </button>
          </div>
        )}

        {/* Analysis Loading */}
        {analyzing && (
          <div className="gsap-pathfinder skeuo-card p-12 text-center text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-amber-400" />
            <span className="font-bold">Pathfinder Agent Orchestrating Agents...</span>
            <span className="text-muted-foreground text-[11px]">
              Combining Digital Twin State + Knowledge Graph Prerequisites + Skill Taxonomy
            </span>
          </div>
        )}

        {/* Career Plan Results */}
        {plan && !analyzing && (
          <div className="gsap-pathfinder space-y-8">
            {/* Overview / Score Banner */}
            <BorderGlow borderRadius={20} glowRadius={35} colors={["#f59e0b", "#6366f1", "#10b981"]}>
              <div className="skeuo-card p-6 relative">
                <SkeuoScrews />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                      Role Overview
                    </span>
                    <h3 className="text-xl font-extrabold text-foreground mt-1">
                      {plan.career_goal.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
                      {plan.summary}
                    </p>
                  </div>

                  {/* Meter */}
                  <div className="flex items-center gap-4 skeuo-inset p-4 rounded-xl min-w-[200px]">
                    <Target className="h-8 w-8 text-amber-400" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">
                        Readiness Score
                      </p>
                      <p className="text-2xl font-black text-foreground">
                        {Math.round(plan.readiness_score * 100)}%
                      </p>
                      <p className="text-[10px] text-emerald-400">
                        {plan.ready_skills.length} of {plan.career_goal.required_skills.length} skills ready
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </BorderGlow>

            {/* Skill Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Ready Skills */}
              <div className="skeuo-card p-5 relative space-y-3">
                <SkeuoScrews />
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-400">
                    Ready Skills ({plan.ready_skills.length})
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {plan.ready_skills.length > 0 ? (
                    plan.ready_skills.map((skill) => (
                      <div
                        key={skill}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-300 flex items-center justify-between"
                      >
                        <span>{skill}</span>
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      No ready skills identified yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Weak Skills */}
              <div className="skeuo-card p-5 relative space-y-3">
                <SkeuoScrews />
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">
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
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-300 flex items-center justify-between"
                        >
                          <span>{sg.skill}</span>
                          <AlertTriangle className="h-3 w-3 text-amber-400" />
                        </div>
                      ))
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      No weak skills flagged.
                    </p>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              <div className="skeuo-card p-5 relative space-y-3">
                <SkeuoScrews />
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-400" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-rose-400">
                    Missing Skills ({plan.missing_skills.length})
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {plan.missing_skills.length > 0 ? (
                    plan.missing_skills.map((skill) => (
                      <div
                        key={skill}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300 flex items-center justify-between"
                      >
                        <span>{skill}</span>
                        <XCircle className="h-3 w-3 text-rose-400" />
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      All skills ready!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Recommended Projects */}
            <div className="skeuo-card p-6 relative space-y-4">
              <SkeuoScrews />
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-indigo-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                  Recommended Portfolio Projects
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plan.recommended_projects.map((proj, idx) => (
                  <div
                    key={proj.title}
                    className="skeuo-card p-4 space-y-2 border border-white/10 hover:border-indigo-500/40 transition-colors"
                  >
                    <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase">
                      Project #{idx + 1}
                    </span>
                    <h5 className="font-bold text-xs text-foreground">{proj.title}</h5>
                    <p className="text-[11px] text-muted-foreground">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Learning Path Sequence */}
            {plan.learning_path.length > 0 && (
              <div className="skeuo-card p-6 relative space-y-4">
                <SkeuoScrews />
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-foreground">
                    Sequenced Learning Roadmap
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {plan.learning_path.map((skill, idx) => (
                    <div key={skill} className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-foreground font-mono text-[11px]">
                        <span className="text-cyan-400 font-bold mr-1 font-sans">{idx + 1}.</span>
                        {skill}
                      </span>
                      {idx < plan.learning_path.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
