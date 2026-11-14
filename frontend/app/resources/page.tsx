/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Sparkles, Youtube, ExternalLink, Clock, Play, ListVideo, X } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { useGsapEntrance } from "@/lib/use-animation-system";
import {
  quickDiscoverResources,
  getBlockResources,
  triggerResourceDiscovery,
  getResourceDiscoveryStatus,
  ResourceDiscoveryResponse,
  ResourceItem,
  PlaylistItem,
} from "@/lib/api/resources";

export default function ResourcesPage() {
  const containerRef = useGsapEntrance(".gsap-resources", 0.05);
  const [topicTitle, setTopicTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [discoveryResult, setDiscoveryResult] = useState<ResourceDiscoveryResponse | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<ResourceItem | null>(null);

  const handleDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = topicTitle.trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setDiscoveryResult(null);
    setPlaylists([]);
    setStatusMsg("Searching YouTube educational courses & running AI ranker...");

    try {
      // 1. Concurrently fetch playlists and ranked videos
      const [blockData, quickRes] = await Promise.allSettled([
        getBlockResources(query, []),
        quickDiscoverResources(query),
      ]);

      let gotVideos = false;

      if (blockData.status === "fulfilled" && blockData.value) {
        if (blockData.value.playlists && blockData.value.playlists.length > 0) {
          setPlaylists(blockData.value.playlists);
        }
        if (blockData.value.videos && blockData.value.videos.length > 0) {
          setDiscoveryResult({
            topic_id: `topic-${Date.now()}`,
            topic_title: query,
            resources: blockData.value.videos,
            from_cache: false,
            updated_at: new Date().toISOString(),
          });
          gotVideos = true;
        }
      }

      if (
        quickRes.status === "fulfilled" &&
        quickRes.value &&
        quickRes.value.resources.length > 0
      ) {
        setDiscoveryResult(quickRes.value);
        gotVideos = true;
      }

      if (gotVideos) {
        setLoading(false);
        setStatusMsg("");
        return;
      }

      // Fallback: poll trigger endpoint
      setStatusMsg("Running background discovery pipeline...");
      const run = await triggerResourceDiscovery(`topic-${Date.now()}`, query);
      const threadId = run.thread_id;

      let attempts = 0;
      const maxAttempts = 20;

      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = (await getResourceDiscoveryStatus(threadId)) as ResourceDiscoveryResponse & {
            detail?: string;
          };

          if (res && res.detail === "Resource discovery is still in progress") {
            if (attempts >= maxAttempts) {
              clearInterval(interval);
              setError("Resource discovery timed out. Please try again.");
              setLoading(false);
              setStatusMsg("");
            }
            return;
          }

          if (res && Array.isArray(res.resources) && res.resources.length > 0) {
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
        } catch (pollErr: unknown) {
          const errObj = pollErr as { status?: number; message?: string };
          if (errObj?.status !== 202) {
            setError(errObj?.message || "Failed to retrieve resources.");
            setLoading(false);
            setStatusMsg("");
            clearInterval(interval);
          }
        }
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initiate resource discovery.";
      setError(message);
      setLoading(false);
      setStatusMsg("");
    }
  };

  return (
    <div className="min-h-screen pb-32 pt-14 text-foreground selection:bg-primary/30 selection:text-foreground sm:pt-16">
      <SiteHeader />
      <main ref={containerRef} className="mx-auto max-w-7xl space-y-6 px-3 py-4 sm:px-6 lg:px-8">
        <div className="gsap-resources">
          <PageHeader
            category="STUDY PLANNING // VIDEO RESOURCES"
            title="AI Educational Video Discovery"
            description="Curate top educational YouTube tutorials, prerequisite explainers, and full playlists ranked by educational quality rubrics."
            icon={Sparkles}
            badgeText="YouTube AI Ranker"
            badgeVariant="purple"
          />
        </div>

        {/* Search Card */}
        <Card className="gsap-resources bento-card shadow-xs rounded-2xl border border-border/80 bg-card/85 p-4 backdrop-blur-xl sm:p-5">
          <form onSubmit={handleDiscovery} className="flex flex-col gap-2.5 sm:flex-row">
            <input
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="Enter a syllabus topic (e.g. Binary Search Trees, Dynamic Programming, Dijkstra)..."
              className="flex-1 rounded-xl border border-border/80 bg-muted/40 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !topicTitle.trim()}
              className="shadow-xs h-8.5 flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-spin" />
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
            <div className="mt-3 flex animate-pulse items-center gap-1.5 font-mono text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" /> {statusMsg}
            </div>
          )}

          {error && <div className="mt-3 text-xs font-medium text-rose-500">{error}</div>}
        </Card>

        {/* Playlists Section */}
        {playlists.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-foreground sm:text-base">
                <ListVideo className="h-4 w-4 text-rose-500" />
                <span>Full Course Playlists</span>
              </h2>
              <span className="font-mono text-[10px] text-muted-foreground">
                {playlists.length} playlists
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {playlists.map((pl, pIdx) => (
                <div
                  key={pIdx}
                  className="bento-card shadow-xs group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/90 transition-all hover:border-rose-500/40"
                >
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <img
                      src={pl.thumbnail_url}
                      alt={pl.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-2.5">
                      <span className="rounded border border-white/20 bg-black/80 px-2 py-0.5 font-mono text-[9px] font-bold text-white">
                        {pl.video_count || "Course Series"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between space-y-1.5 p-3">
                    <div>
                      <h4 className="line-clamp-2 text-xs font-bold leading-snug text-foreground">
                        {pl.title}
                      </h4>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                        {pl.channel_title}
                      </p>
                    </div>

                    <a
                      href={pl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 py-1.5 text-[11px] font-bold text-rose-500 transition-colors hover:bg-rose-500/20"
                    >
                      <span>Open Full Playlist</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discovery Results Videos */}
        {discoveryResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-foreground sm:text-base">
                <span>Ranked Educational Videos</span>
                {discoveryResult.from_cache && (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-medium text-emerald-500">
                    Cached
                  </span>
                )}
              </h2>
              <span className="font-mono text-[10px] text-muted-foreground">
                Found {discoveryResult.resources.length} videos
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {discoveryResult.resources.map((item, idx) => (
                <div
                  key={idx}
                  className="bento-card shadow-xs group flex flex-col justify-between space-y-3 rounded-2xl border border-border/80 bg-card/85 p-4 backdrop-blur-xl"
                >
                  <div className="space-y-2.5">
                    <div className="flex gap-3">
                      <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-32">
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        {item.duration !== "N/A" && (
                          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                            {item.duration}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 text-xs font-bold leading-snug text-foreground sm:text-sm">
                            {item.title}
                          </h3>
                          <span className="shrink-0 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold text-primary">
                            {(item.rank_score * 100).toFixed(0)}% Rank
                          </span>
                        </div>
                        <p className="flex items-center gap-1 truncate font-mono text-[11px] text-muted-foreground">
                          <Youtube className="h-3 w-3 shrink-0 text-rose-500" />
                          {item.channel_title}
                        </p>
                      </div>
                    </div>

                    {item.why_recommended && (
                      <p className="rounded-xl border border-border/40 bg-muted/40 p-2.5 font-sans text-[11px] leading-relaxed text-muted-foreground">
                        💡 <span className="font-semibold text-foreground">Why Recommended:</span>{" "}
                        {item.why_recommended}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setActiveVideoModal(item)}
                      className="shadow-xs flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-1.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Watch in App</span>
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-500 transition-colors hover:bg-rose-500/20"
                      title="Open on YouTube"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Embedded YouTube Video Player Modal */}
      {activeVideoModal && (
        <div className="z-60 fixed inset-0 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md duration-200 animate-in fade-in sm:p-6">
          <div className="w-full max-w-3xl space-y-4 overflow-hidden rounded-3xl border border-border/80 bg-card p-4 shadow-2xl sm:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-4">
                <h4 className="truncate text-sm font-bold text-foreground">
                  {activeVideoModal.title}
                </h4>
                <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <Youtube className="h-3.5 w-3.5 text-rose-500" />
                  {activeVideoModal.channel_title}
                </p>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border/40 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoModal.video_id}?autoplay=1`}
                title={activeVideoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <p className="font-sans text-[11px] text-muted-foreground">
                {activeVideoModal.why_recommended}
              </p>
              <a
                href={activeVideoModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3 flex shrink-0 items-center gap-1 font-bold text-primary hover:underline"
              >
                <span>Open in YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
