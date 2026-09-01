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
import {
  useCommunityStore,
  type Friend,
} from "@/lib/community-store";
import {
  Users,
  UserPlus,
  UserCheck,
  Clock,
  Search,
  School,
  GraduationCap,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendsDrawer({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { friends, toggleFriendStatus, profile, sendFriendRequest } = useCommunityStore();
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
      <DialogContent className="max-w-xl liquid-glass border-white/20 dark:border-white/10 p-6 sm:p-7 rounded-3xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Users className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl font-black text-foreground">
                Scholar Study Circle & Friends
              </DialogTitle>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-white/20 bg-white/5 text-foreground">
              {friendsCount} Connected
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Connect with classmates from {profile.college} ({profile.course}) for shared RAG queries and group study.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Controls & Search Bar */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-3 py-1 rounded-xl font-bold transition-all",
                  activeTab === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Friends ({friendsCount})
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={cn(
                  "px-3 py-1 rounded-xl font-bold transition-all",
                  activeTab === "requests"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Pending Requests ({pendingCount})
              </button>
            </div>

            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, college..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Friends List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {filteredFriends.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Users className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p>{activeTab === "all" ? "No friends connected yet." : "No pending friend requests."}</p>
                <p className="text-[11px]">Discover peers in the Community Feed below and click "Add Friend"!</p>
              </div>
            ) : (
              filteredFriends.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs", f.avatarColor)}>
                        {f.alias.charAt(0)}
                      </div>
                      {f.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" title="Online" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground truncate">{f.alias}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{f.username}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                        <School className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>{f.college}</span>
                        <span>•</span>
                        <span>{f.year}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {f.status === "friends" ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onOpenChange(false);
                            router.push(`/chat?q=Collaborate%20with%20${encodeURIComponent(f.alias)}%20on%20coursework`);
                          }}
                          className="h-8 px-2.5 text-xs font-bold text-primary hover:bg-white/10 rounded-xl gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toggleFriendStatus(f.id);
                            toast.info(`Removed ${f.alias} from friends`);
                          }}
                          className="h-8 px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-destructive border-white/15 rounded-xl"
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
                        className="h-8 px-2.5 text-xs font-bold border-amber-500/30 text-amber-500 bg-amber-500/10 rounded-xl gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          toggleFriendStatus(f.id);
                          toast.success(`Accepted friend request from ${f.alias}!`);
                        }}
                        className="h-8 px-3 text-xs font-bold bg-primary text-primary-foreground rounded-xl gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
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
