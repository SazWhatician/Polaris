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
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useGsapEntrance } from "@/lib/use-animation-system";
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
      if (result.ready) {
        toast.success(`You are ready to learn ${query.trim()}!`);
      } else {
        toast.info(`Prerequisites needed for ${query.trim()}`);
      }
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
    <div className="min-h-screen text-foreground pb-32">
      <SiteHeader />

      <main ref={containerRef} className="max-w-7xl mx-auto space-y-8 py-8 px-4 sm:px-6 lg:px-8">
        {/* Standardized Page Header */}
        <div className="gsap-twin">
          <PageHeader
            category="ACADEMIC INTELLIGENCE // DIGITAL TWIN"
            title="Academic Digital Twin"
            description="Real-time prerequisite graph mastery model estimating readiness for target topics and analyzing learning velocity."
            icon={Brain}
            badgeText="Bayesian Concept State"
            badgeVariant="emerald"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={loadTwin}
                disabled={fetching}
                className="gap-2 text-xs font-bold rounded-xl border-border/80 hover:bg-muted/80"
                data-agent-target="refresh-twin"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${fetching ? "animate-spin text-primary" : ""}`} />
                <span>{fetching ? "Syncing..." : "Refresh Twin"}</span>
              </Button>
            }
          />
        </div>

        {/* Stats Cards */}
        <div className="gsap-twin grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            label="Known Mastered"
            numericValue={knownCount}
            value={knownCount.toString()}
            icon={CheckCircle2}
            colorScheme="emerald"
            trend="Concepts mastered"
            trendPositive
            tag="Verified"
          />
          <StatCard
            label="Weak Reinforce"
            numericValue={weakCount}
            value={weakCount.toString()}
            icon={AlertTriangle}
            colorScheme="amber"
            trend="Needs review"
            trendPositive={false}
            tag="In progress"
          />
          <StatCard
            label="Missing Topics"
            numericValue={missingCount}
            value={missingCount.toString()}
            icon={XCircle}
            colorScheme="rose"
            trend="Not yet studied"
            trendPositive={false}
            tag="Queued"
          />
          <StatCard
            label="Tracked Signals"
            numericValue={twin?.signals_count ?? 0}
            value={(twin?.signals_count ?? 0).toString()}
            icon={Zap}
            colorScheme="purple"
            trend="Study telemetry"
            trendPositive
            tag="Active"
          />
        </div>

        {/* Knowledge Distribution Bar */}
        {totalCount > 0 && (
          <Card className="gsap-twin p-6 rounded-3xl bg-card/75 border border-border/80 backdrop-blur-2xl shadow-xl space-y-3">
            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
              Knowledge Distribution & Mastery Ratio
            </p>
            <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-muted/60">
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
                className="h-full bg-rose-500/80 transition-all duration-700"
                style={{ width: `${(missingCount / totalCount) * 100}%` }}
                title={`Missing: ${missingCount}`}
              />
            </div>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" />
                <span className="text-foreground font-bold">Known:</span> {Math.round((knownCount / totalCount) * 100)}% ({knownCount})
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs" />
                <span className="text-foreground font-bold">Weak:</span> {Math.round((weakCount / totalCount) * 100)}% ({weakCount})
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-xs" />
                <span className="text-foreground font-bold">Missing:</span> {Math.round((missingCount / totalCount) * 100)}% ({missingCount})
              </span>
            </div>
          </Card>
        )}

        {/* Learning Velocity Sparkline */}
        {velocityData.length > 1 && (
          <Card className="gsap-twin p-6 rounded-3xl bg-card/75 border border-border/80 backdrop-blur-2xl shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                Learning Velocity (Concepts Mastered / Week)
              </p>
            </div>
            <div className="flex items-end gap-2 h-20 pt-2">
              {velocityData.map((point) => (
                <div
                  key={point.week}
                  className="flex-1 bg-gradient-to-t from-primary/60 to-indigo-400 rounded-t-xl transition-all duration-500 hover:from-primary hover:to-indigo-300 shadow-xs"
                  style={{
                    height: `${Math.max(8, (point.concepts_learned / maxVelocity) * 100)}%`,
                  }}
                  title={`${point.week}: ${point.concepts_learned} concepts`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/40">
              <span>{velocityData[0]?.week}</span>
              <span>{velocityData[velocityData.length - 1]?.week}</span>
            </div>
          </Card>
        )}

        {/* Readiness Check */}
        <Card className="gsap-twin p-6 sm:p-8 rounded-3xl bg-card/75 border border-border/80 backdrop-blur-2xl shadow-xl space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Prerequisite Readiness Predictor
              </h3>
              <p className="text-xs text-muted-foreground">
                Check whether you have the foundational concepts mastered before diving into a complex topic.
              </p>
            </div>
          </div>

          <form onSubmit={handleReadinessCheck} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a topic (e.g. Dynamic Programming, AVL Rotations, Dijkstra)..."
              className="flex-1 bg-background border border-border/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
              data-agent-target="readiness-input"
            />
            <Button
              type="submit"
              disabled={checking || !query.trim()}
              className="text-xs font-bold px-6 py-2.5 rounded-xl gap-2 shadow-md"
              data-agent-target="readiness-check-btn"
            >
              {checking ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>{checking ? "Checking..." : "Check Readiness"}</span>
            </Button>
          </form>

          {/* Readiness Result */}
          {readiness && (
            <div
              className={`rounded-2xl p-6 border transition-all ${
                readiness.ready
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/5 text-amber-300"
              }`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                {readiness.ready ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                )}
                <span className="font-bold text-sm text-foreground">
                  {readiness.ready ? "Ready to Learn!" : "Prerequisites Recommended"}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ml-auto ${
                    readiness.ready
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {readiness.ready_prerequisites.length} / {readiness.ready_prerequisites.length + readiness.missing_prerequisites.length} Prerequisites Ready
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {readiness.summary}
              </p>

              {readiness.missing_prerequisites.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                    Missing Foundations:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {readiness.missing_prerequisites.map((p) => (
                      <span
                        key={p.concept_id}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
