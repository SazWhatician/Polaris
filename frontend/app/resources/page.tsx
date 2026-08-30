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

      // Poll until finished
      const interval = setInterval(async () => {
        try {
          const res = await getResourceDiscoveryStatus(threadId);
          setDiscoveryResult(res);
          setLoading(false);
          setStatusMsg("");
          clearInterval(interval);
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
    <div className="min-h-screen text-foreground pb-32">
      <SiteHeader />
      <main ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
        <Card className="gsap-resources p-6 rounded-3xl bg-card/75 border border-border/80 shadow-xl backdrop-blur-2xl">
          <form onSubmit={handleDiscovery} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="Enter a syllabus topic (e.g. Binary Search Trees, Dynamic Programming)..."
              className="flex-1 px-4 py-3 border border-white/10 rounded-lg bg-white/5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topicTitle.trim()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Clock className="animate-spin h-4 w-4 text-white" />
                  <span>Discovering…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Discover Resources</span>
                </>
              )}
            </button>
          </form>

          {statusMsg && (
            <div className="mt-4 text-sm text-indigo-400 font-medium animate-pulse flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> {statusMsg}
            </div>
          )}

          {error && <div className="mt-4 text-sm text-rose-400 font-medium">{error}</div>}
        </Card>

        {/* Discovery Results */}
        {discoveryResult && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Ranked Educational Videos</span>
                {discoveryResult.from_cache && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                    Cached
                  </span>
                )}
              </h2>
              <span className="text-xs text-slate-400">
                Found {discoveryResult.resources.length} videos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {discoveryResult.resources.map((item, idx) => (
                <div
                  key={idx}
                  className="glass-card p-5 flex flex-col justify-between space-y-4 hover:scale-[1.01] transition-transform"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-slate-100 text-base leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {(item.rank_score * 100).toFixed(0)}% Rank
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Youtube className="h-3.5 w-3.5 text-rose-500" />
                        {item.channel_title}
                      </span>
                      {item.duration !== "N/A" && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {item.duration}
                        </span>
                      )}
                    </div>

                    {item.why_recommended && (
                      <p className="text-xs text-slate-300 bg-white/5 p-3 rounded-lg border border-white/5 leading-relaxed">
                        💡 <span className="font-semibold text-indigo-300">Why Recommended:</span> {item.why_recommended}
                      </p>
                    )}
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold transition-colors"
                  >
                    <span>Watch Tutorial on YouTube</span>
                    <ExternalLink className="h-3.5 w-3.5" />
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
