"use client";

import { useState } from "react";
import { Sparkles, Youtube, ExternalLink, Clock } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { useGsapEntrance } from "@/lib/use-animation-system";
import {
  triggerResourceDiscovery,
  getResourceDiscoveryStatus,
  ResourceDiscoveryResponse,
} from "@/lib/api/resources";

export default function ResourcesPage() {
  const containerRef = useGsapEntrance(".gsap-resources", 0.05);
  const [topicTitle, setTopicTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [discoveryResult, setDiscoveryResult] = useState<ResourceDiscoveryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim()) return;

    setLoading(true);
    setError(null);
    setDiscoveryResult(null);
    setStatusMsg("Searching educational sources & running AI ranker...");

    try {
      const run = await triggerResourceDiscovery(`topic-${Date.now()}`, topicTitle.trim());
      const threadId = run.thread_id;

      let attempts = 0;
      const maxAttempts = 30; // 60 seconds max

      // Poll until finished
      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await getResourceDiscoveryStatus(threadId) as (ResourceDiscoveryResponse & { detail?: string });
          
          if (res && res.detail === "Resource discovery is still in progress") {
            if (attempts >= maxAttempts) {
              clearInterval(interval);
              setError("Resource discovery timed out. Please try again.");
              setLoading(false);
              setStatusMsg("");
            }
            return;
          }

          if (res && Array.isArray(res.resources)) {
            setDiscoveryResult(res);
            setLoading(false);
            setStatusMsg("");
            clearInterval(interval);
            return;
          }

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            setError("No resources found for this topic.");
            setLoading(false);
            setStatusMsg("");
          }
        } catch (err: unknown) {
          const errObj = err as { status?: number; message?: string };
          if (errObj?.status !== 202) {
            setError(errObj?.message || "Failed to retrieve resources.");
            setLoading(false);
            setStatusMsg("");
            clearInterval(interval);
          }
        }
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initiate resource discovery.";
      setError(message);
      setLoading(false);
      setStatusMsg("");
    }
  };

  return (
    <div className="min-h-screen text-foreground pb-32 pt-14 sm:pt-16 selection:bg-primary/30 selection:text-foreground">
      <SiteHeader />
      <main ref={containerRef} className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-6">
        <div className="gsap-resources">
          <PageHeader
            category="STUDY PLANNING // VIDEO RESOURCES"
            title="AI Educational Video Discovery"
            description="Curate top educational YouTube tutorials, prerequisite explainers, and academic lectures ranked by LLM quality rubrics."
            icon={Sparkles}
            badgeText="YouTube AI Ranker"
            badgeVariant="purple"
          />
        </div>

        {/* Search Card */}
        <Card className="gsap-resources p-4 sm:p-5 rounded-2xl bg-card/85 border border-border/80 bento-card shadow-xs backdrop-blur-xl">
          <form onSubmit={handleDiscovery} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="Enter a syllabus topic (e.g. Binary Search Trees, Dynamic Programming)..."
              className="flex-1 px-3.5 py-2 border border-border/80 rounded-xl bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topicTitle.trim()}
              className="px-5 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 text-xs h-8.5"
            >
              {loading ? (
                <>
                  <Clock className="animate-spin h-3.5 w-3.5" />
                  <span>Discovering…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Discover Resources</span>
                </>
              )}
            </button>
          </form>

          {statusMsg && (
            <div className="mt-3 text-xs font-mono text-primary font-medium animate-pulse flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> {statusMsg}
            </div>
          )}

          {error && <div className="mt-3 text-xs text-rose-500 font-medium">{error}</div>}
        </Card>

        {/* Discovery Results */}
        {discoveryResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                <span>Ranked Educational Videos</span>
                {discoveryResult.from_cache && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-mono font-medium">
                    Cached
                  </span>
                )}
              </h2>
              <span className="text-[10px] text-muted-foreground font-mono">
                Found {discoveryResult.resources.length} videos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {discoveryResult.resources.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-foreground text-xs sm:text-sm leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                        {(item.rank_score * 100).toFixed(0)}% Rank
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center gap-1.5">
                        <Youtube className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-foreground font-semibold text-[11px]">{item.channel_title}</span>
                      </span>
                      {item.duration !== "N/A" && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {item.duration}
                        </span>
                      )}
                    </div>

                    {item.why_recommended && (
                      <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/40 leading-relaxed font-sans">
                        💡 <span className="font-semibold text-foreground">Why Recommended:</span> {item.why_recommended}
                      </p>
                    )}
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 text-xs font-bold transition-colors h-8"
                  >
                    <span>Watch Tutorial on YouTube</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
