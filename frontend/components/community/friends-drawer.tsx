"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCommunityStore } from "@/lib/community-store";
import { Users, UserCheck, Clock, Search, School, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendsDrawer({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { friends, toggleFriendStatus, profile } = useCommunityStore();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "requests">("all");

  const filteredFriends = friends.filter((f) => {
    const matchSearch =
      f.alias.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase()) ||
      f.college.toLowerCase().includes(search.toLowerCase()) ||
      f.course.toLowerCase().includes(search.toLowerCase());

    if (activeTab === "all") return matchSearch && f.status === "friends";
    return matchSearch && (f.status === "pending_sent" || f.status === "pending_received");
  });

  const friendsCount = friends.filter((f) => f.status === "friends").length;
  const pendingCount = friends.filter((f) => f.status !== "friends").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="liquid-glass max-w-xl rounded-3xl border-white/20 p-6 dark:border-white/10 sm:p-7">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-2">
                <Users className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-black text-foreground">
                Scholar Study Circle & Friends
              </DialogTitle>
            </div>
            <Badge
              variant="outline"
              className="border-white/20 bg-white/5 font-mono text-[10px] text-foreground"
            >
              {friendsCount} Connected
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Connect with classmates from {profile.college} ({profile.course}) for shared RAG queries
            and group study.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Controls & Search Bar */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center rounded-2xl border border-white/10 bg-white/5 p-1 text-xs">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "rounded-xl px-3 py-1 font-bold transition-all",
                  activeTab === "all"
                    ? "shadow-xs bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Friends ({friendsCount})
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={cn(
                  "rounded-xl px-3 py-1 font-bold transition-all",
                  activeTab === "requests"
                    ? "shadow-xs bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Pending Requests ({pendingCount})
              </button>
            </div>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, college..."
                className="pl-8.5 w-full rounded-xl border border-white/10 bg-white/5 py-1.5 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Friends List */}
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {filteredFriends.length === 0 ? (
              <div className="space-y-2 p-8 text-center text-xs text-muted-foreground">
                <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p>
                  {activeTab === "all"
                    ? "No friends connected yet."
                    : "No pending friend requests."}
                </p>
                <p className="text-[11px]">
                  Discover peers in the Community Feed below and click "Add Friend"!
                </p>
              </div>
            ) : (
              filteredFriends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 transition-colors hover:border-primary/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "shadow-xs flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white",
                          f.avatarColor,
                        )}
                      >
                        {f.alias.charAt(0)}
                      </div>
                      {f.online && (
                        <div
                          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500"
                          title="Online"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-bold text-foreground">
                          {f.alias}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {f.username}
                        </span>
                      </div>
                      <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                        <School className="h-3 w-3 shrink-0 text-indigo-400" />
                        <span>{f.college}</span>
                        <span>•</span>
                        <span>{f.year}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {f.status === "friends" ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onOpenChange(false);
                            router.push(
                              `/chat?q=Collaborate%20with%20${encodeURIComponent(f.alias)}%20on%20coursework`,
                            );
                          }}
                          className="h-8 gap-1 rounded-xl px-2.5 text-xs font-bold text-primary hover:bg-white/10"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Chat</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toggleFriendStatus(f.id);
                            toast.info(`Removed ${f.alias} from friends`);
                          }}
                          className="h-8 rounded-xl border-white/15 px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                        >
                          Friends
                        </Button>
                      </>
                    ) : f.status === "pending_sent" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          toggleFriendStatus(f.id);
                          toast.success(`Connected with ${f.alias}!`);
                        }}
                        className="h-8 gap-1 rounded-xl border-amber-500/30 bg-amber-500/10 px-2.5 text-xs font-bold text-amber-500"
                      >
                        <Clock className="h-3 w-3" />
                        <span>Pending</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          toggleFriendStatus(f.id);
                          toast.success(`Accepted friend request from ${f.alias}!`);
                        }}
                        className="h-8 gap-1 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Accept</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
