"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Search,
  Sparkles,
  RefreshCw,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { SkeuoScrews } from "@/components/skeuomorphic-controls";
import { BorderGlow } from "@/components/border-glow";
import { useAuth } from "@/lib/auth-context";
import { useGsapEntrance } from "@/lib/use-gsap-animations";
import {
  fetchTwin,
  checkReadiness,
  type AcademicTwin,
  type ReadinessResult,
} from "@/lib/api/twin";

export default function TwinPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [twin, setTwin] = useState<AcademicTwin | null>(null);
  const [fetching, setFetching] = useState(true);
  const [query, setQuery] = useState("");
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [checking, setChecking] = useState(false);

  const containerRef = useGsapEntrance(".gsap-twin", 0.05);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  const loadTwin = useCallback(async () => {
    setFetching(true);
    try {
      const data = await fetchTwin();
      setTwin(data);
    } catch (err) {
      toast.error("Failed to load Academic Twin", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user) void loadTwin();
  }, [user, loadTwin]);

  const handleReadinessCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setChecking(true);
    setReadiness(null);
    try {
      const result = await checkReadiness(query.trim());
      setReadiness(result);
    } catch (err) {
      toast.error("Readiness check failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setChecking(false);
    }
  };

  if (loading || !user) return null;

  const knownCount = twin?.known_concepts.length ?? 0;
  const weakCount = twin?.weak_concepts.length ?? 0;
  const missingCount = twin?.missing_concepts.length ?? 0;
  const totalCount = knownCount + weakCount + missingCount;

  // Sparkline data for velocity
  const velocityData = twin?.velocity ?? [];
  const maxVelocity = Math.max(1, ...velocityData.map((v) => v.concepts_learned));

  return (
    <div className="min-h-screen text-foreground pb-16">
      <SiteHeader />

      <main ref={containerRef} className="max-w-7xl mx-auto space-y-8 py-8 px-4 sm:px-8">
        {/* Header */}
        <div className="gsap-twin skeuo-card p-6 text-xs relative">
          <SkeuoScrews />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-400 font-bold uppercase tracking-wider mb-1">
                <Brain className="h-3.5 w-3.5 text-cyan-400" />
                <span>Polaris AI Step 6: Academic Digital Twin</span>
              </div>
              <h2 className="text-lg font-extrabold text-foreground">
                Your Learning Profile & Readiness Check
              </h2>
            </div>
            <button
              onClick={loadTwin}
              disabled={fetching}
              className="skeuo-button text-xs py-2 px-4 font-bold flex items-center gap-2"
              data-agent-target="refresh-twin"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${fetching ? "animate-spin" : ""}`} />
              <span>{fetching ? "Syncing..." : "Refresh Twin"}</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="gsap-twin grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatTile
            label="Known"
            value={knownCount.toString()}
            subText="Concepts mastered"
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            color="emerald"
          />
          <StatTile
            label="Weak"
            value={weakCount.toString()}
            subText="Needs reinforcement"
            icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
            color="amber"
          />
          <StatTile
            label="Missing"
            value={missingCount.toString()}
            subText="Not yet studied"
            icon={<XCircle className="h-5 w-5 text-rose-400" />}
            color="rose"
          />
          <StatTile
            label="Signals"
            value={(twin?.signals_count ?? 0).toString()}
            subText="Study events tracked"
            icon={<Zap className="h-5 w-5 text-purple-400" />}
            color="purple"
          />
        </div>

        {/* Knowledge Distribution Bar */}
        {totalCount > 0 && (
          <div className="gsap-twin skeuo-card p-5 relative">
            <SkeuoScrews />
            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-3">
              Knowledge Distribution
            </p>
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-white/5">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${(knownCount / totalCount) * 100}%` }}
                title={`Known: ${knownCount}`}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-700"
                style={{ width: `${(weakCount / totalCount) * 100}%` }}
                title={`Weak: ${weakCount}`}
              />
              <div
                className="h-full bg-rose-500/60 transition-all duration-700"
                style={{ width: `${(missingCount / totalCount) * 100}%` }}
                title={`Missing: ${missingCount}`}
              />
            </div>
            <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Known {Math.round((knownCount / totalCount) * 100)}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Weak {Math.round((weakCount / totalCount) * 100)}%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Missing {Math.round((missingCount / totalCount) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Learning Velocity Sparkline */}
        {velocityData.length > 1 && (
          <div className="gsap-twin skeuo-card p-5 relative">
            <SkeuoScrews />
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                Learning Velocity (Concepts / Week)
              </p>
            </div>
            <div className="flex items-end gap-1 h-16">
              {velocityData.map((point, i) => (
                <div
                  key={point.week}
                  className="flex-1 bg-gradient-to-t from-cyan-500/80 to-indigo-500/80 rounded-t transition-all duration-500 hover:from-cyan-400 hover:to-indigo-400"
                  style={{
                    height: `${Math.max(4, (point.concepts_learned / maxVelocity) * 100)}%`,
                  }}
                  title={`${point.week}: ${point.concepts_learned} concepts`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
              <span>{velocityData[0]?.week}</span>
              <span>{velocityData[velocityData.length - 1]?.week}</span>
            </div>
          </div>
        )}

        {/* Readiness Check */}
        <div className="gsap-twin">
          <BorderGlow borderRadius={20} glowRadius={30} colors={["#06b6d4", "#6366f1", "#a855f7"]}>
            <div className="skeuo-card p-6 relative">
              <SkeuoScrews />
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-cyan-400" />
                <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                  Can I Learn This?
                </p>
              </div>

              <form onSubmit={handleReadinessCheck} className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. Transformers, Gradient Descent, RAG..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  data-agent-target="readiness-input"
                />
                <button
                  type="submit"
                  disabled={checking || !query.trim()}
                  className="skeuo-button text-xs py-2.5 px-5 font-bold flex items-center gap-2"
                  data-agent-target="readiness-check-btn"
                >
                  {checking ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>{checking ? "Checking..." : "Check Readiness"}</span>
                </button>
              </form>

              {/* Readiness Result */}
              {readiness && (
                <div
                  className={`rounded-xl p-5 border ${
                    readiness.ready
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-amber-500/30 bg-amber-500/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {readiness.ready ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                    )}
                    <span className="font-bold text-sm">
                      {readiness.ready ? "Ready!" : "Not Ready Yet"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{readiness.summary}</p>

                  {readiness.ready_prerequisites.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">
                        ✓ Prerequisites Met ({readiness.ready_prerequisites.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {readiness.ready_prerequisites.map((p) => (
                          <span
                            key={p.concept_id}
                            className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-medium"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {readiness.missing_prerequisites.length > 0 && (
                    <div>
                      <p className="text-[10px] text-rose-400 font-bold uppercase mb-1">
                        ✗ Missing Prerequisites ({readiness.missing_prerequisites.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {readiness.missing_prerequisites.map((p) => (
                          <span
                            key={p.concept_id}
                            className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[10px] font-medium"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </BorderGlow>
        </div>
      </main>
    </div>
  );
}

function StatTile({
  label,
  value,
  subText,
  icon,
  color,
}: {
  label: string;
  value: string;
  subText: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="skeuo-card p-5 flex items-center justify-between relative overflow-hidden">
      <SkeuoScrews />
      <div className="flex items-center gap-3.5">
        <div className="p-3 skeuo-inset">{icon}</div>
        <div>
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
            {label}
          </p>
          <p className="text-2xl font-black text-foreground">{value}</p>
          <p className="text-[10px] text-muted-foreground">{subText}</p>
        </div>
      </div>
    </div>
  );
}
