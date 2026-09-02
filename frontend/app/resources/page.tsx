/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import {
  Sparkles,
  Youtube,
  ExternalLink,
  Clock,
  Play,
  ListVideo,
  X,
} from "lucide-react";

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

      if (quickRes.status === "fulfilled" && quickRes.value && quickRes.value.resources.length > 0) {
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
    <div className="min-h-screen text-foreground pb-32 pt-14 sm:pt-16 selection:bg-primary/30 selection:text-foreground">
      <SiteHeader />
      <main ref={containerRef} className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-6">
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
        <Card className="gsap-resources p-4 sm:p-5 rounded-2xl bg-card/85 border border-border/80 bento-card shadow-xs backdrop-blur-xl">
          <form onSubmit={handleDiscovery} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="Enter a syllabus topic (e.g. Binary Search Trees, Dynamic Programming, Dijkstra)..."
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

        {/* Playlists Section */}
        {playlists.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2 font-mono uppercase tracking-wider">
                <ListVideo className="h-4 w-4 text-rose-500" />
                <span>Full Course Playlists</span>
              </h2>
              <span className="text-[10px] text-muted-foreground font-mono">
                {playlists.length} playlists
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {playlists.map((pl, pIdx) => (
                <div
                  key={pIdx}
                  className="rounded-2xl bg-card/90 border border-border/80 overflow-hidden flex flex-col justify-between hover:border-rose-500/40 transition-all bento-card shadow-xs group"
                >
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <img
                      src={pl.thumbnail_url}
                      alt={pl.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-black/80 text-white border border-white/20">
                        {pl.video_count || "Course Series"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                        {pl.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                        {pl.channel_title}
                      </p>
                    </div>

                    <a
                      href={pl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 w-full py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[11px] font-bold transition-colors flex items-center justify-center gap-1 border border-rose-500/20"
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
                    <div className="flex gap-3">
                      <div className="relative w-28 sm:w-32 aspect-video rounded-xl bg-muted overflow-hidden shrink-0">
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        {item.duration !== "N/A" && (
                          <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/80 text-white">
                            {item.duration}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-foreground text-xs sm:text-sm leading-snug line-clamp-2">
                            {item.title}
                          </h3>
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                            {(item.rank_score * 100).toFixed(0)}% Rank
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono truncate flex items-center gap-1">
                          <Youtube className="h-3 w-3 text-rose-500 shrink-0" />
                          {item.channel_title}
                        </p>
                      </div>
                    </div>

                    {item.why_recommended && (
                      <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/40 leading-relaxed font-sans">
                        💡 <span className="font-semibold text-foreground">Why Recommended:</span>{" "}
                        {item.why_recommended}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setActiveVideoModal(item)}
                      className="flex-1 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Watch in App</span>
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 text-xs font-bold transition-colors flex items-center justify-center gap-1"
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
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-3xl bg-card border border-border/80 overflow-hidden shadow-2xl space-y-4 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-4">
                <h4 className="text-sm font-bold text-foreground truncate">
                  {activeVideoModal.title}
                </h4>
                <p className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                  <Youtube className="h-3.5 w-3.5 text-rose-500" />
                  {activeVideoModal.channel_title}
                </p>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border/40">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoModal.video_id}?autoplay=1`}
                title={activeVideoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <p className="text-muted-foreground text-[11px] font-sans">
                {activeVideoModal.why_recommended}
              </p>
              <a
                href={activeVideoModal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-bold shrink-0 ml-3"
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
