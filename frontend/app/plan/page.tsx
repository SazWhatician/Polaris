"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, Clock, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api/client";
import { useGsapEntrance } from "@/lib/use-animation-system";

interface StudyBlock {
  topic_id: string;
  topic_title: string;
  allocated_minutes: number;
  priority: string;
  notes: string;
}

interface DaySchedule {
  date: string;
  available_hours: number;
  blocks: StudyBlock[];
}

interface RevisionPlan {
  plan_id: string;
  exam_date: string;
  daily_hours: number;
  schedules: DaySchedule[];
  total_hours_allocated: number;
  created_at: string;
}

export default function RevisionPlanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const containerRef = useGsapEntrance(".gsap-plan", 0.05);

  const [examDate, setExamDate] = useState("2026-08-15");
  const [dailyHours, setDailyHours] = useState(2.5);
  const [plan, setPlan] = useState<RevisionPlan | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  // Load latest plan
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const latest = await api<RevisionPlan>("/api/agents/planner/latest");
        if (latest) setPlan(latest);
      } catch {
        // No plan generated yet
      }
    })();
  }, [user]);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const res = await api<{ thread_id: string }>("/api/agents/planner/runs", {
        method: "POST",
        body: JSON.stringify({
          exam_date: examDate,
          daily_hours: dailyHours,
          topic_gaps: [
            { topic_id: "t1", topic_title: "Dynamic Programming (Knapsack & LCS)", priority: "high" },
            { topic_id: "t2", topic_title: "Minimum Spanning Trees (Prim / Kruskal)", priority: "medium" },
            { topic_id: "t3", topic_title: "Binary Search Tree Rotation & Balance", priority: "high" },
          ],
        }),
      });

      toast.success("Revision plan task started!");
      
      const interval = setInterval(async () => {
        try {
          const pollRes = await api<RevisionPlan>(`/api/agents/planner/runs/${res.thread_id}`);
          if (pollRes && pollRes.plan_id) {
            setPlan(pollRes);
            setGenerating(false);
            clearInterval(interval);
            toast.success("Revision plan generated successfully!");
          }
        } catch {
          // Still running
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(interval);
        setGenerating(false);
      }, 15000);

    } catch (e) {
      setGenerating(false);
      toast.error("Plan generation failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen text-foreground pb-32 pt-14 sm:pt-16 selection:bg-primary/30 selection:text-foreground">
      <SiteHeader />
      <main ref={containerRef} className="max-w-7xl mx-auto space-y-6 py-4 px-3 sm:px-6 lg:px-8">
        {/* Standardized Page Header */}
        <div className="gsap-plan">
          <PageHeader
            category="STUDY PLANNING // TIMETABLE"
            title="Autonomous Revision Planner"
            description="Constraint-aware study planner producing day-by-day revision schedules with semantic re-plan diffing and exam countdowns."
            icon={Calendar}
            badgeText="LangGraph State Engine"
            badgeVariant="indigo"
          />
        </div>

        {/* Input Configuration Card */}
        <Card className="gsap-plan p-4 sm:p-5 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <h3 className="font-bold text-xs text-foreground tracking-wide font-mono uppercase">
              Configure Revision Constraints
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">YYYY-MM-DD Bounds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground">Target Exam Date</label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                data-agent-target="plan-exam-date"
                className="bg-muted/40 border-border/60 text-foreground text-xs rounded-xl h-8.5"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground">Daily Study Target (Hours)</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value) || 1)}
                data-agent-target="plan-daily-hours"
                className="bg-muted/40 border-border/60 text-foreground text-xs rounded-xl h-8.5"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={generatePlan}
                disabled={generating}
                data-agent-target="generate-plan-btn"
                className="w-full h-8.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground shadow-xs"
              >
                {generating ? (
                  <>
                    <Clock className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Computing Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    <span>Generate Schedule</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Plan Output Schedule */}
        <div className="gsap-plan space-y-3">
          <h2 className="text-sm sm:text-base font-bold text-foreground font-mono uppercase tracking-wider">
            Active Study Schedule
          </h2>

          {plan ? (
            <div className="space-y-3">
              <Card className="p-3.5 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-500 font-bold font-mono">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Schedule Synthesized (Exam Date: {plan.exam_date})</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground font-bold">Allocated: {plan.total_hours_allocated} hrs</span>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.schedules.map((day, idx) => (
                  <Card key={idx} className="p-4 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-primary font-mono">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Date: {day.date}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{day.available_hours} hrs quota</span>
                    </div>

                    <div className="space-y-1.5">
                      {day.blocks.map((block, bIdx) => (
                        <div key={bIdx} className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground text-xs">{block.topic_title}</span>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-primary/10 text-primary border border-primary/20 font-bold">
                              {block.allocated_minutes} mins
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{block.notes}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="p-8 rounded-2xl bg-card/60 border border-border/80 text-center text-muted-foreground text-xs space-y-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto" />
              <p>No revision plan generated yet. Configure your exam date above and click Generate.</p>
            </Card>
          )}
        </div>

      </main>
    </div>
  );
}
