"use client";

import { useState } from "react";
import {
  ShieldCheck,
  LogOut,
  School,
  Flame,
  Send,
  UserPlus,
  Compass,
  BookOpen,
  Users,
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
  const { communityUser, profile, logoutCloudflare, setActiveDmUsername, friends, communities } = useCommunityStore();
  const [activeTab, setActiveTab] = useState<CommunityTab>("posts");

  const handleOpenDmWith = (username: string) => {
    setActiveDmUsername(username);
    setActiveTab("dm");
  };

  const pendingRequestsCount = friends.filter((f) => f.status === "pending_received").length;

  return (
    <div className="min-h-screen bg-[#0e1113] text-[#d7dadc] pb-24 pt-14 sm:pt-16 selection:bg-[#ff4500]/30 selection:text-white">
      <SiteHeader />

      <main className="max-w-6xl mx-auto py-4 px-3 sm:px-6">
        {!communityUser ? (
          <CloudflareCommunityLogin />
        ) : (
          <div className="space-y-4">
            {/* ── Reddit-Style Subreddit / Campus Banner ── */}
            <div className="bg-[#1a1a1b] border border-[#343536] rounded-2xl overflow-hidden shadow-md">
              {/* Cover strip */}
              <div className="h-16 sm:h-20 bg-gradient-to-r from-indigo-900/60 via-slate-900 to-orange-950/40 border-b border-[#343536]" />

              <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 -mt-7 sm:-mt-8">
                <div className="flex items-end gap-3.5">
                  <div
                    className={cn(
                      "w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-[#1a1a1b] flex items-center justify-center font-black text-white text-xl shadow-lg shrink-0",
                      profile.avatarColor || "bg-[#ff4500]"
                    )}
                  >
                    {profile.alias.charAt(0)}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-base sm:text-lg font-black text-[#d7dadc]">
                        c/{profile.college.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 16)}
                      </h1>
                      <span className="text-xs font-mono text-[#818384]">
                        • u/{profile.username.replace("@", "")}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#818384]">
                      <span className="flex items-center gap-1 font-semibold text-[#d7dadc]/90">
                        <School className="w-3.5 h-3.5 text-indigo-400" />
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
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff4500]/10 border border-[#ff4500]/30 text-[#ff4500] text-[11px] font-mono font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cloudflare Verified</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      logoutCloudflare();
                      toast.info("Logged out of Cloudflare Community session");
                    }}
                    className="h-7 text-xs font-bold text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729] rounded-lg gap-1"
                    title="Switch Account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Switch</span>
                  </Button>
                </div>
              </div>

              {/* ── Reddit Sub-Navigation Tabs ── */}
              <div className="px-4 border-t border-[#343536] flex items-center gap-1 overflow-x-auto no-scrollbar bg-[#151516]/60 text-xs font-bold">
                <button
                  onClick={() => setActiveTab("posts")}
                  className={cn(
                    "px-4 py-2.5 border-b-2 transition-colors shrink-0 flex items-center gap-1.5",
                    activeTab === "posts"
                      ? "border-[#ff4500] text-[#d7dadc]"
                      : "border-transparent text-[#818384] hover:text-[#d7dadc]"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Posts (Feed)</span>
                </button>

                <button
                  onClick={() => setActiveTab("friends")}
                  className={cn(
                    "px-4 py-2.5 border-b-2 transition-colors shrink-0 flex items-center gap-1.5",
                    activeTab === "friends"
                      ? "border-[#ff4500] text-[#d7dadc]"
                      : "border-transparent text-[#818384] hover:text-[#d7dadc]"
                  )}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Find Scholars</span>
                  {pendingRequestsCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#ff4500] text-white text-[9px] font-mono flex items-center justify-center">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("trending")}
                  className={cn(
                    "px-4 py-2.5 border-b-2 transition-colors shrink-0 flex items-center gap-1.5",
                    activeTab === "trending"
                      ? "border-[#ff4500] text-[#d7dadc]"
                      : "border-transparent text-[#818384] hover:text-[#d7dadc]"
                  )}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Trending Hubs</span>
                </button>

                <button
                  onClick={() => setActiveTab("dm")}
                  className={cn(
                    "px-4 py-2.5 border-b-2 transition-colors shrink-0 flex items-center gap-1.5",
                    activeTab === "dm"
                      ? "border-[#ff4500] text-[#d7dadc]"
                      : "border-transparent text-[#818384] hover:text-[#d7dadc]"
                  )}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Messages (DM)</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </button>
              </div>
            </div>

            {/* ── 2-Column Reddit Layout on Wide Screens ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Active Tab Content (Span 8) */}
              <div className={cn(activeTab === "dm" ? "lg:col-span-12" : "lg:col-span-8")}>
                {activeTab === "posts" && <PostsTab onOpenDmWith={handleOpenDmWith} />}
                {activeTab === "friends" && <FriendsTab onOpenDmWith={handleOpenDmWith} />}
                {activeTab === "trending" && <TrendingTab onOpenDmWith={handleOpenDmWith} />}
                {activeTab === "dm" && <MessagesTab />}
              </div>

              {/* Right Column: Reddit "About Community" Sidebar (Span 4) */}
              {activeTab !== "dm" && (
                <aside className="lg:col-span-4 space-y-4">
                  {/* About Community Box */}
                  <div className="bg-[#1a1a1b] border border-[#343536] rounded-xl p-4 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-[#343536] pb-2.5">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[#818384]">
                        About Community
                      </h2>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        <span>Online</span>
                      </span>
                    </div>

                    <p className="text-xs text-[#d7dadc] leading-relaxed">
                      Verified academic forum for {profile.college}. Share exam prep, study notes, derivations, and collaborate on coursework with peer scholars.
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#343536] text-center">
                      <div className="p-2 rounded-lg bg-[#272729]">
                        <p className="text-sm font-black font-mono text-[#d7dadc]">1.4k</p>
                        <p className="text-[10px] text-[#818384] uppercase">Verified Scholars</p>
                      </div>
                      <div className="p-2 rounded-lg bg-[#272729]">
                        <p className="text-sm font-black font-mono text-emerald-400">84</p>
                        <p className="text-[10px] text-[#818384] uppercase">Active Now</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#343536] text-xs space-y-2 text-[#818384]">
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
                        <span className="font-semibold text-[#d7dadc] truncate max-w-[140px]">{profile.college}</span>
                      </div>
                    </div>
                  </div>

                  {/* Circle Rules */}
                  <div className="bg-[#1a1a1b] border border-[#343536] rounded-xl p-4 space-y-2.5 shadow-xs">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#818384] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span>Circle Rules</span>
                    </h2>

                    <ol className="text-[11px] text-[#d7dadc]/80 space-y-1.5 list-decimal list-inside">
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
