"use client";

import { useState } from "react";
import {
  triggerResourceDiscovery,
  getResourceDiscoveryStatus,
  ResourceDiscoveryResponse,
  ResourceItem,
} from "@/lib/api/resources";

export default function ResourcesPage() {
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
        } catch (err: any) {
          // Status 202 means still processing
          if (err?.status !== 202) {
            setError(err?.message || "Failed to retrieve resources.");
            setLoading(false);
            setStatusMsg("");
            clearInterval(interval);
          }
        }
      }, 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to initiate resource discovery.");
      setLoading(false);
      setStatusMsg("");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
          🎯 AI Resource Discovery Agent
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Discover, filter, and rank top educational tutorials and lectures tailored to your weak syllabus topics.
        </p>
      </div>

      {/* Input Search Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-8">
        <form onSubmit={handleDiscovery} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={topicTitle}
            onChange={(e) => setTopicTitle(e.target.value)}
            placeholder="Enter a syllabus topic (e.g. Binary Search Trees, Dynamic Programming, TCP/IP)..."
            className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !topicTitle.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Discovering...
              </>
            ) : (
              "Discover Resources"
            )}
          </button>
        </form>

        {statusMsg && (
          <div className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 font-medium animate-pulse flex items-center gap-2">
            <span>✨</span> {statusMsg}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-600 dark:text-rose-400">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Results View */}
      {discoveryResult && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Recommended for: <span className="text-indigo-600 dark:text-indigo-400">{discoveryResult.topic_title}</span>
            </h2>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              discoveryResult.from_cache
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            }`}>
              {discoveryResult.from_cache ? "⚡ Cached Response" : "🔍 Freshly Ranked"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {discoveryResult.resources.map((res: ResourceItem, idx: number) => (
              <div
                key={res.video_id || idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={res.thumbnail_url}
                    alt={res.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded font-mono">
                    {res.duration}
                  </span>
                  <span className="absolute top-2 left-2 bg-indigo-600/90 text-white text-xs px-2 py-0.5 rounded font-bold">
                    Rank #{idx + 1} ({Math.round(res.rank_score * 100)}%)
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-1">
                      {res.title}
                    </h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-3">
                      📺 {res.channel_title} {res.view_count ? `• ${res.view_count.toLocaleString()} views` : ""}
                    </p>

                    {/* Why Recommended Blurb */}
                    {res.why_recommended && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800 mb-4">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Why Study This: </span>
                        {res.why_recommended}
                      </div>
                    )}
                  </div>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-medium rounded-lg text-center transition-colors block"
                  >
                    Watch Tutorial ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
