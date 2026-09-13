"use client";

import { useState } from "react";
import {
  TrendingUp,
  Flame,
  Hash,
  School,
  ArrowBigUp,
  MessageSquare,
  Send,
  Users,
  Check,
  Plus,
} from "lucide-react";
import { useCommunityStore } from "@/lib/community-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  onOpenDmWith: (username: string) => void;
}

export function TrendingTab({ onOpenDmWith }: Props) {
  const {
    trendingTopics,
    communities,
    posts,
    toggleLikePost,
    toggleJoinCommunity,
  } = useCommunityStore();

  const [selectedTag, setSelectedTag] = useState<string>("All");

  const filteredPosts = selectedTag === "All"
    ? posts
    : posts.filter((p) => p.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));

  return (
    <div className="space-y-4">
      {/* ── Trending Tags / Flair Bar ── */}
      <div className="bg-[#1a1a1b] border border-[#343536] rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#d7dadc]">
            <Flame className="w-4 h-4 text-[#ff4500]" />
            <span>Trending Topics & Flairs</span>
          </div>
          <span className="text-[10px] font-mono text-[#818384]">Live Activity</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setSelectedTag("All")}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-colors",
              selectedTag === "All"
                ? "bg-[#d7dadc] text-black"
                : "bg-[#272729] text-[#818384] hover:text-[#d7dadc]"
            )}
          >
            All
          </button>

          {trendingTopics.map((topic) => (
            <button
              key={topic.tag}
              onClick={() => setSelectedTag(topic.tag === selectedTag ? "All" : topic.tag)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-mono font-bold shrink-0 transition-colors flex items-center gap-1",
                selectedTag === topic.tag
                  ? "bg-[#ff4500] text-white"
                  : "bg-[#272729] text-[#818384] hover:text-[#d7dadc]"
              )}
            >
              <Hash className="w-3 h-3 opacity-60" />
              <span>{topic.tag.replace("#", "")}</span>
              <span className="text-[10px] opacity-70 font-sans font-normal">({topic.postsCount})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Popular Sub-Circles Grid ── */}
      <div className="bg-[#1a1a1b] border border-[#343536] rounded-xl p-3.5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#d7dadc]">
          <School className="w-4 h-4 text-indigo-400" />
          <span>Top Campus Circles & Study Hubs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {communities.map((comm, idx) => (
            <div
              key={comm.id}
              className="p-3 rounded-lg bg-[#272729] border border-[#343536] flex items-center justify-between gap-3 hover:border-[#474748] transition-colors"
            >
              <div className="min-w-0 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold font-mono text-[#ff4500]">#{idx + 1}</span>
                  <p className="font-bold text-[#d7dadc] truncate">c/{comm.id.replace("comm-", "")}</p>
                </div>
                <p className="text-[11px] text-[#818384] truncate">{comm.college}</p>
                <p className="text-[10px] text-[#818384] font-mono">{comm.membersCount} members</p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toggleJoinCommunity(comm.id);
                  toast.info(comm.isJoined ? `Left c/${comm.id}` : `Joined c/${comm.id}`);
                }}
                className={cn(
                  "h-7 px-3 rounded-full text-xs font-bold transition-colors shrink-0",
                  comm.isJoined
                    ? "border-[#343536] text-[#818384] hover:text-rose-400"
                    : "bg-[#d7dadc] hover:bg-white text-black border-transparent"
                )}
              >
                {comm.isJoined ? "Joined" : "Join"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Ranked Discussions List ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-[#818384]">
            Ranked Discussions ({filteredPosts.length})
          </h3>
          <span className="text-[#818384] font-mono text-[11px]">Ranked by Upvotes</span>
        </div>

        <div className="space-y-2">
          {filteredPosts.map((post, idx) => (
            <div
              key={post.id}
              className="bg-[#1a1a1b] hover:border-[#474748] border border-[#343536] rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono font-black text-sm text-[#818384] w-5 text-center shrink-0">
                  {idx + 1}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#818384]">
                    <span className="font-bold text-[#d7dadc]">c/{post.communityId.replace("comm-", "")}</span>
                    <span>•</span>
                    <span>u/{post.authorUsername.replace("@", "")}</span>
                    <span>•</span>
                    <span>{post.authorCollege}</span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-[#d7dadc] truncate hover:text-[#ff4500] cursor-pointer">
                    {post.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-xs font-bold text-[#d7dadc]">
                  <ArrowBigUp
                    onClick={() => toggleLikePost(post.id)}
                    className={cn(
                      "w-5 h-5 cursor-pointer",
                      post.likedByUser ? "text-[#ff4500] fill-[#ff4500]" : "text-[#818384] hover:text-[#ff4500]"
                    )}
                  />
                  <span>{post.likes}</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-[#818384]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{post.comments.length}</span>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onOpenDmWith(post.authorUsername);
                    toast.info(`Chatting with ${post.authorAlias}`);
                  }}
                  className="h-7 px-2 text-xs font-bold text-primary hover:bg-[#272729]"
                >
                  <Send className="w-3 h-3 mr-1" />
                  <span>DM</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
