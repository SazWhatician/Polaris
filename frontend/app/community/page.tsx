"use client";

import { useState } from "react";
import {
  ShieldCheck,
  LogOut,
  School,
  Flame,
  Send,
  UserPlus,
  Shield,
  FileText,
  Radio,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useCommunityStore } from "@/lib/community-store";
import { CloudflareCommunityLogin } from "@/components/community/cloudflare-community-login";
import { PostsTab } from "@/components/community/posts-tab";
import { FriendsTab } from "@/components/community/friends-tab";
import { TrendingTab } from "@/components/community/trending-tab";
import { MessagesTab } from "@/components/community/messages-tab";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CommunityTab = "posts" | "friends" | "trending" | "dm";

export default function CommunityPage() {
  const { communityUser, profile, logoutCloudflare, setActiveDmUsername, friends } =
    useCommunityStore();
  const [activeTab, setActiveTab] = useState<CommunityTab>("posts");

  const handleOpenDmWith = (username: string) => {
    setActiveDmUsername(username);
    setActiveTab("dm");
  };

  const pendingRequestsCount = friends.filter((f) => f.status === "pending_received").length;

  return (
    <div className="min-h-screen bg-[#0e1113] pb-24 pt-14 text-[#d7dadc] selection:bg-[#ff4500]/30 selection:text-white sm:pt-16">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-6">
        {!communityUser ? (
          <CloudflareCommunityLogin />
        ) : (
          <div className="space-y-4">
            {/* ── Reddit-Style Subreddit / Campus Banner ── */}
            <div className="overflow-hidden rounded-2xl border border-[#343536] bg-[#1a1a1b] shadow-md">
              {/* Cover strip */}
              <div className="h-16 border-b border-[#343536] bg-gradient-to-r from-indigo-900/60 via-slate-900 to-orange-950/40 sm:h-20" />

              <div className="-mt-7 flex flex-col items-start justify-between gap-4 p-4 sm:-mt-8 sm:flex-row sm:items-center sm:p-5">
                <div className="flex items-end gap-3.5">
                  <div
                    className={cn(
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-[#1a1a1b] text-xl font-black text-white shadow-lg sm:h-16 sm:w-16",
                      profile.avatarColor || "bg-[#ff4500]",
                    )}
                  >
                    {profile.alias.charAt(0)}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-base font-black text-[#d7dadc] sm:text-lg">
                        c/
                        {profile.college
                          .replace(/[^a-zA-Z0-9]/g, "")
                          .toLowerCase()
                          .slice(0, 16)}
                      </h1>
                      <span className="font-mono text-xs text-[#818384]">
                        • u/{profile.username.replace("@", "")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#818384]">
                      <span className="flex items-center gap-1 font-semibold text-[#d7dadc]/90">
                        <School className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{profile.college}</span>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">{profile.course}</span>
                      <span>•</span>
                      <span>{profile.year}</span>
                    </div>
                  </div>
                </div>

                {/* Cloudflare Verified Badge & Switch Account */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 rounded-full border border-[#ff4500]/30 bg-[#ff4500]/10 px-3 py-1 font-mono text-[11px] font-bold text-[#ff4500]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Cloudflare Verified</span>
                    <span className="ml-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      logoutCloudflare();
                      toast.info("Logged out of Cloudflare Community session");
                    }}
                    className="h-7 gap-1 rounded-lg text-xs font-bold text-[#818384] hover:bg-[#272729] hover:text-[#d7dadc]"
                    title="Switch Account"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Switch</span>
                  </Button>
                </div>
              </div>

              {/* ── Reddit Sub-Navigation Tabs ── */}
              <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-[#343536] bg-[#151516]/60 px-4 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("posts")}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 transition-colors",
                    activeTab === "posts"
                      ? "border-[#ff4500] text-[#d7dadc]"
                      : "border-transparent text-[#818384] hover:text-[#d7dadc]",
                  )}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Posts (Feed)</span>
                </button>

                <button
                  onClick={() => setActiveTab("friends")}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 transition-colors",
                    activeTab === "friends"
                      ? "border-[#ff4500] text-[#d7dadc]"
                      : "border-transparent text-[#818384] hover:text-[#d7dadc]",
                  )}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Find Scholars</span>
                  {pendingRequestsCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#ff4500] font-mono text-[9px] text-white">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("trending")}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 transition-colors",
                    activeTab === "trending"
                      ? "border-[#ff4500] text-[#d7dadc]"
                      : "border-transparent text-[#818384] hover:text-[#d7dadc]",
                  )}
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span>Trending Hubs</span>
                </button>

                <button
                  onClick={() => setActiveTab("dm")}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 transition-colors",
                    activeTab === "dm"
                      ? "border-[#ff4500] text-[#d7dadc]"
                      : "border-transparent text-[#818384] hover:text-[#d7dadc]",
                  )}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Messages (DM)</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </button>
              </div>
            </div>

            {/* ── 2-Column Reddit Layout on Wide Screens ── */}
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
              {/* Left Column: Active Tab Content (Span 8) */}
              <div className={cn(activeTab === "dm" ? "lg:col-span-12" : "lg:col-span-8")}>
                {activeTab === "posts" && <PostsTab onOpenDmWith={handleOpenDmWith} />}
                {activeTab === "friends" && <FriendsTab onOpenDmWith={handleOpenDmWith} />}
                {activeTab === "trending" && <TrendingTab onOpenDmWith={handleOpenDmWith} />}
                {activeTab === "dm" && <MessagesTab />}
              </div>

              {/* Right Column: Reddit "About Community" Sidebar (Span 4) */}
              {activeTab !== "dm" && (
                <aside className="space-y-4 lg:col-span-4">
                  {/* About Community Box */}
                  <div className="shadow-xs space-y-3.5 rounded-xl border border-[#343536] bg-[#1a1a1b] p-4">
                    <div className="flex items-center justify-between border-b border-[#343536] pb-2.5">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#818384]">
                        About Community
                      </h2>
                      <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-400">
                        <Radio className="h-2.5 w-2.5 animate-pulse" />
                        <span>Online</span>
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-[#d7dadc]">
                      Verified academic forum for {profile.college}. Share exam prep, study notes,
                      derivations, and collaborate on coursework with peer scholars.
                    </p>

                    <div className="grid grid-cols-2 gap-2 border-t border-[#343536] pt-1 text-center">
                      <div className="rounded-lg bg-[#272729] p-2">
                        <p className="font-mono text-sm font-black text-[#d7dadc]">1.4k</p>
                        <p className="text-[10px] uppercase text-[#818384]">Verified Scholars</p>
                      </div>
                      <div className="rounded-lg bg-[#272729] p-2">
                        <p className="font-mono text-sm font-black text-emerald-400">84</p>
                        <p className="text-[10px] uppercase text-[#818384]">Active Now</p>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-[#343536] pt-2 text-xs text-[#818384]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Created:</span>
                        <span className="font-mono text-[#d7dadc]">Fall 2024</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Security Gate:</span>
                        <span className="font-mono text-[#ff4500]">Cloudflare Zero Trust</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Your University:</span>
                        <span className="max-w-[140px] truncate font-semibold text-[#d7dadc]">
                          {profile.college}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Circle Rules */}
                  <div className="shadow-xs space-y-2.5 rounded-xl border border-[#343536] bg-[#1a1a1b] p-4">
                    <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#818384]">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      <span>Circle Rules</span>
                    </h2>

                    <ol className="list-inside list-decimal space-y-1.5 text-[11px] text-[#d7dadc]/80">
                      <li>Cite problem sets & lecture references.</li>
                      <li>Be respectful & collaborative.</li>
                      <li>No plagiarism or unauthorized test leaks.</li>
                      <li>Use descriptive titles and relevant flairs.</li>
                    </ol>
                  </div>
                </aside>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
