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
import { fetchTwin, checkReadiness, type AcademicTwin, type ReadinessResult } from "@/lib/api/twin";

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
    <div className="min-h-screen pb-32 pt-14 text-foreground selection:bg-primary/30 selection:text-foreground sm:pt-16">
      <SiteHeader />

      <main ref={containerRef} className="mx-auto max-w-7xl space-y-6 px-3 py-4 sm:px-6 lg:px-8">
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
                className="gap-2 rounded-xl border-border/80 text-xs font-bold hover:bg-muted/80"
                data-agent-target="refresh-twin"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${fetching ? "animate-spin text-primary" : ""}`}
                />
                <span>{fetching ? "Syncing..." : "Refresh Twin"}</span>
              </Button>
            }
          />
        </div>

        {/* Stats Cards */}
        <div className="gsap-twin grid grid-cols-1 gap-4 sm:grid-cols-4 sm:gap-6">
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

        {/* Mastery Distribution Bar */}
        {totalCount > 0 && (
          <Card className="gsap-twin bento-card shadow-xs space-y-2.5 rounded-2xl border border-border/80 bg-card/85 p-4 backdrop-blur-xl sm:p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
                Knowledge Distribution
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {totalCount} Concepts Tracked
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted/60">
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
                className="h-full bg-rose-500 transition-all duration-700"
                style={{ width: `${(missingCount / totalCount) * 100}%` }}
                title={`Missing: ${missingCount}`}
              />
            </div>
            <div className="flex flex-wrap gap-3 pt-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 text-[11px] font-medium">
                <span className="shadow-xs inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-foreground">Known:</span>{" "}
                {Math.round((knownCount / totalCount) * 100)}% ({knownCount})
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium">
                <span className="shadow-xs inline-block h-2 w-2 rounded-full bg-amber-500" />
                <span className="font-bold text-foreground">Weak:</span>{" "}
                {Math.round((weakCount / totalCount) * 100)}% ({weakCount})
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium">
                <span className="shadow-xs inline-block h-2 w-2 rounded-full bg-rose-500" />
                <span className="font-bold text-foreground">Missing:</span>{" "}
                {Math.round((missingCount / totalCount) * 100)}% ({missingCount})
              </span>
            </div>
          </Card>
        )}

        {/* Learning Velocity Sparkline */}
        {velocityData.length > 1 && (
          <Card className="gsap-twin bento-card shadow-xs space-y-3 rounded-2xl border border-border/80 bg-card/85 p-4 backdrop-blur-xl sm:p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Learning Velocity (Concepts Mastered / Week)
              </p>
            </div>
            <div className="flex h-16 items-end gap-1.5 pt-1">
              {velocityData.map((point) => (
                <div
                  key={point.week}
                  className="shadow-xs flex-1 rounded-t-lg bg-primary/70 transition-all duration-300 hover:bg-primary"
                  style={{
                    height: `${Math.max(10, (point.concepts_learned / maxVelocity) * 100)}%`,
                  }}
                  title={`${point.week}: ${point.concepts_learned} concepts`}
                />
              ))}
            </div>
            <div className="flex justify-between border-t border-border/40 pt-1 font-mono text-[9px] text-muted-foreground">
              <span>{velocityData[0]?.week}</span>
              <span>{velocityData[velocityData.length - 1]?.week}</span>
            </div>
          </Card>
        )}

        {/* Readiness Check */}
        <Card className="gsap-twin bento-card shadow-xs space-y-4 rounded-2xl border border-border/80 bg-card/85 p-4 backdrop-blur-xl sm:p-5">
          <div className="flex items-center gap-2.5">
            <div className="bento-icon-bounce shrink-0 rounded-xl bg-primary/10 p-2 text-primary">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-mono text-xs font-bold uppercase text-foreground sm:text-sm">
                Prerequisite Readiness Predictor
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Check whether you have foundational concepts mastered before diving into a complex
                topic.
              </p>
            </div>
          </div>

          <form onSubmit={handleReadinessCheck} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a topic (e.g. Dynamic Programming, AVL Rotations, Dijkstra)..."
              className="shadow-xs flex-1 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              data-agent-target="readiness-input"
            />
            <Button
              type="submit"
              disabled={checking || !query.trim()}
              className="shadow-xs h-8.5 gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              data-agent-target="readiness-check-btn"
            >
              {checking ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              <span>{checking ? "Checking..." : "Check Readiness"}</span>
            </Button>
          </form>

          {/* Readiness Result */}
          {readiness && (
            <div
              className={`rounded-xl border p-4 transition-all ${
                readiness.ready
                  ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/5 text-amber-300"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                {readiness.ready ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-xs font-bold text-foreground sm:text-sm">
                  {readiness.ready ? "Ready to Learn!" : "Prerequisites Recommended"}
                </span>
                <span
                  className={`ml-auto rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${
                    readiness.ready
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-500"
                  }`}
                >
                  {readiness.ready_prerequisites.length} /{" "}
                  {readiness.ready_prerequisites.length + readiness.missing_prerequisites.length}{" "}
                  Ready
                </span>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">{readiness.summary}</p>

              {readiness.missing_prerequisites.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-border/40 pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                    Missing Foundations:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {readiness.missing_prerequisites.map((p) => (
                      <span
                        key={p.concept_id}
                        className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400"
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
