"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, Clock, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Terminal } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { useGsapEntrance } from "@/lib/use-gsap-animations";

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

  const handleGeneratePlan = async () => {
    if (!examDate) {
      toast.error("Please enter a valid exam date");
      return;
    }
    setGenerating(true);
    try {
      const res = await api<{ thread_id: string; status: string }>("/api/agents/planner/run", {
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
    <div className="min-h-screen bg-background text-foreground pb-16">
      <SiteHeader />
      <main ref={containerRef} className="container max-w-5xl space-y-8 py-10 px-4 sm:px-8">
        
        {/* Header Block */}
        <div className="gsap-plan flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-indigo-500/40 pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-pink-400 font-bold mb-1">
              <Terminal className="h-4 w-4" />
              <span>[AGENT // REVISION_PLANNER_V1]</span>
            </div>
            <h1 className="text-3xl font-black font-mono tracking-tight uppercase">
              Revision Planner Agent
            </h1>
            <p className="text-slate-400 font-mono text-xs mt-1">
              Constraint-aware LangGraph state machine producing day-by-day revision schedules with semantic re-plan diffing.
            </p>
          </div>

          <div className="brutal-badge text-pink-400 border-pink-500/40 bg-pink-500/10">
            [PHASE_07_ACTIVE]
          </div>
        </div>

        {/* Input Configuration Card */}
        <div className="gsap-plan brutal-card p-6 space-y-6 bg-slate-950">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
              Configure Revision Constraints
            </h3>
            <span className="font-mono text-[10px] text-slate-400">YYYY-MM-DD DATE BOUNDS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5 font-mono">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Target Exam Date</label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="bg-black border-2 border-slate-700 text-slate-100 font-mono text-xs rounded-none"
              />
            </div>

            <div className="space-y-1.5 font-mono">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Daily Hours</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                className="bg-black border-2 border-slate-700 text-slate-100 font-mono text-xs rounded-none"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGeneratePlan}
                disabled={generating}
                className="brutal-btn w-full h-10 text-xs flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin text-white" />
                    <span>PLANNING…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                    <span>GENERATE PLAN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Generated Schedule Output */}
        {plan ? (
          <div className="gsap-plan space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono">
              <h2 className="text-lg font-bold text-slate-100 uppercase">Generated Revision Schedule</h2>
              <span className="text-xs text-indigo-300 bg-indigo-500/10 px-3 py-1 border border-indigo-500/30">
                PLAN: {plan.plan_id} • {plan.total_hours_allocated} TOTAL HOURS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.schedules.slice(0, 6).map((day, idx) => (
                <div key={idx} className="brutal-card p-4 space-y-3 bg-black/80 font-mono">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-indigo-300 text-xs">{day.date}</span>
                    <span className="text-[10px] text-slate-400">{day.available_hours} HRS AVAIL</span>
                  </div>

                  <div className="space-y-2">
                    {day.blocks.length > 0 ? (
                      day.blocks.map((block, bIdx) => (
                        <div key={bIdx} className="bg-white/5 p-3 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-200">{block.topic_title}</span>
                            <span className="text-purple-400">{block.allocated_minutes} MINS</span>
                          </div>
                          {block.notes && <p className="text-[11px] text-slate-400 font-sans">{block.notes}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No study blocks allocated.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
