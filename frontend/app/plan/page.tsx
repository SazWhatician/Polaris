"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, Clock, Sparkles, AlertCircle, CheckCircle2, ArrowRight, FileText, MessageSquare, Target } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/lib/auth-context";
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <SiteHeader />
      <main ref={containerRef} className="max-w-5xl mx-auto space-y-8 py-8 px-4 sm:px-8">
        
        {/* Step-by-Step Workflow Banner */}
        <div className="gsap-plan glass-card-glow p-5 text-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Step 4: Date-Bounded Revision Planner</span>
              </div>
              <h2 className="text-base font-bold text-slate-100">Constraint-Aware Revision Schedule & Diff Engine</h2>
            </div>
            <Link
              href="/dashboard"
              className="glass-button text-xs py-2 px-4 font-medium flex items-center gap-1.5 self-start md:self-auto"
            >
              <span>Back to Course Documents</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Link href="/dashboard" className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 flex items-center gap-2 text-xs">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono font-bold text-[10px] flex items-center justify-center">1</span>
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span>Upload Docs</span>
            </Link>
            <Link href="/chat" className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 flex items-center gap-2 text-xs">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono font-bold text-[10px] flex items-center justify-center">2</span>
              <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
              <span>RAG Chat</span>
            </Link>
            <Link href="/gaps" className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 flex items-center gap-2 text-xs">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-mono font-bold text-[10px] flex items-center justify-center">3</span>
              <Target className="h-3.5 w-3.5 text-pink-400" />
              <span>Learning Gaps</span>
            </Link>
            <Link href="/plan" className="p-2.5 rounded-xl border border-cyan-500/40 bg-cyan-600/20 text-cyan-300 font-semibold flex items-center gap-2 text-xs">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-white font-mono font-bold text-[10px] flex items-center justify-center">4</span>
              <Calendar className="h-3.5 w-3.5 text-cyan-400" />
              <span>Revision Plan</span>
            </Link>
          </div>
        </div>

        {/* Header Block */}
        <div className="gsap-plan flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Autonomous Revision Planner
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Constraint-aware LangGraph state machine producing day-by-day revision schedules with semantic re-plan diffing.
            </p>
          </div>

          <div className="glass-badge text-cyan-300 border-cyan-500/30 bg-cyan-500/10">
            Phase 7 Revision Agent
          </div>
        </div>

        {/* Input Configuration Card */}
        <div className="gsap-plan glass-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-semibold text-sm text-slate-100 tracking-wide">
              Configure Revision Constraints
            </h3>
            <span className="text-[11px] text-slate-400">YYYY-MM-DD Date Bounds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Target Exam Date</label>
              <Input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Daily Study Target (Hours)</label>
              <Input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value) || 1)}
                className="bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={generatePlan}
                disabled={generating}
                className="glass-button w-full h-10 text-xs font-semibold"
              >
                {generating ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Computing Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    <span>Generate Revision Schedule</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Plan Output Schedule */}
        <div className="gsap-plan space-y-4">
          <h2 className="text-lg font-bold text-slate-100">
            Active Study Schedule
          </h2>

          {plan ? (
            <div className="space-y-4">
              <div className="glass-card p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Schedule Synthesized (Exam Date: {plan.exam_date})</span>
                </div>
                <span className="text-slate-400">Total Allocated: {plan.total_hours_allocated} hrs</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.schedules.map((day, idx) => (
                  <div key={idx} className="glass-card p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2 font-semibold text-xs text-indigo-300">
                        <Calendar className="h-4 w-4 text-indigo-400" />
                        <span>Date: {day.date}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{day.available_hours} hrs quota</span>
                    </div>

                    <div className="space-y-2">
                      {day.blocks.map((block, bIdx) => (
                        <div key={bIdx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{block.topic_title}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                              {block.allocated_minutes} mins
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{block.notes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center text-slate-400 text-xs space-y-2">
              <AlertCircle className="h-6 w-6 text-slate-500 mx-auto" />
              <p>No revision plan generated yet. Configure your exam date above and click Generate.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
