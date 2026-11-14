"use client";

import { useState, useMemo } from "react";
import {
  Search,
  UserPlus,
  UserCheck,
  Clock,
  MessageSquare,
  School,
  Sparkles,
  Users,
  Check,
  X,
  GraduationCap,
} from "lucide-react";
import { useCommunityStore, COLLEGES } from "@/lib/community-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  onOpenDmWith: (username: string) => void;
}

export function FriendsTab({ onOpenDmWith }: Props) {
  const {
    profile,
    friends,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    toggleFriendStatus,
  } = useCommunityStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState("All");

  const [customUsername, setCustomUsername] = useState("");
  const [customCollege, setCustomCollege] = useState(
    profile.college || COLLEGES[0] || "Stanford University",
  );
  const [customAlias, setCustomAlias] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);

  const pendingReceived = useMemo(
    () => friends.filter((f) => f.status === "pending_received"),
    [friends],
  );
  const connectedFriends = useMemo(() => friends.filter((f) => f.status === "friends"), [friends]);
  const otherScholars = useMemo(
    () => friends.filter((f) => f.status !== "pending_received"),
    [friends],
  );

  const filteredScholars = useMemo(() => {
    return otherScholars.filter((s) => {
      const matchSearch =
        s.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.course.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCollege =
        selectedCollegeFilter === "All" ||
        s.college.toLowerCase().includes(selectedCollegeFilter.toLowerCase());

      return matchSearch && matchCollege;
    });
  }, [otherScholars, searchQuery, selectedCollegeFilter]);

  const handleSendCustomRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUsername.trim()) {
      toast.error("Please provide a username");
      return;
    }

    const cleanHandle = `@${customUsername.replace("@", "").toLowerCase().trim()}`;
    sendFriendRequest({
      alias: customAlias.trim() || customUsername.replace("@", ""),
      username: cleanHandle,
      college: customCollege,
    });

    toast.success(`Friend request sent to ${cleanHandle}!`);
    setCustomUsername("");
    setCustomAlias("");
    setShowCustomModal(false);
  };

  return (
    <div className="space-y-4">
      {/* ── Search & Filter Controls ── */}
      <div className="space-y-3 rounded-xl border border-[#343536] bg-[#1a1a1b] p-3.5">
        <div className="flex flex-col items-center gap-2.5 sm:flex-row">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#818384]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scholars by u/handle, name, or campus..."
              className="w-full rounded-lg border border-[#343536] bg-[#272729] py-1.5 pl-8 pr-3 text-xs text-[#d7dadc] placeholder:text-[#818384] focus:border-[#d7dadc] focus:outline-none"
            />
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <select
              value={selectedCollegeFilter}
              onChange={(e) => setSelectedCollegeFilter(e.target.value)}
              className="rounded-lg border border-[#343536] bg-[#272729] px-2.5 py-1.5 text-xs text-[#d7dadc] focus:outline-none"
            >
              <option value="All">All Campuses</option>
              <option value={profile.college}>My Campus ({profile.college.split(" ")[0]})</option>
              {COLLEGES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              onClick={() => setShowCustomModal(!showCustomModal)}
              className="h-8 shrink-0 gap-1 rounded-full bg-[#d7dadc] px-3 text-xs font-bold text-black hover:bg-white"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invite u/</span>
            </Button>
          </div>
        </div>

        {/* Custom Invite box */}
        {showCustomModal && (
          <form
            onSubmit={handleSendCustomRequest}
            className="space-y-2.5 rounded-lg border border-[#343536] bg-[#272729] p-3"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#d7dadc]">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Send Friend Request to Scholar</span>
              </span>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-[#818384] hover:text-[#d7dadc]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                type="text"
                required
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                placeholder="u/handle"
                className="rounded-md border border-[#343536] bg-[#1a1a1b] px-2.5 py-1.5 font-mono text-xs text-[#d7dadc] focus:outline-none"
              />
              <input
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder="Full Name (Optional)"
                className="rounded-md border border-[#343536] bg-[#1a1a1b] px-2.5 py-1.5 text-xs text-[#d7dadc] focus:outline-none"
              />
              <select
                value={customCollege}
                onChange={(e) => setCustomCollege(e.target.value)}
                className="rounded-md border border-[#343536] bg-[#1a1a1b] px-2.5 py-1.5 text-xs text-[#d7dadc] focus:outline-none"
              >
                {COLLEGES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                className="h-7 rounded-full bg-[#d7dadc] px-3 text-xs font-bold text-black"
              >
                Send Request
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* ── Pending Requests (If Any) ── */}
      {pendingReceived.length > 0 && (
        <div className="space-y-2">
          <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-[#818384]">
            Pending Received Requests ({pendingReceived.length})
          </h3>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {pendingReceived.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#343536] bg-[#1a1a1b] p-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                      req.avatarColor,
                    )}
                  >
                    {req.alias.charAt(0)}
                  </div>
                  <div className="min-w-0 text-xs">
                    <p className="truncate font-bold text-[#d7dadc]">{req.alias}</p>
                    <p className="truncate font-mono text-[10px] text-[#818384]">
                      u/{req.username.replace("@", "")}
                    </p>
                    <p className="truncate text-[10px] text-[#818384]">{req.college}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    onClick={() => {
                      acceptFriendRequest(req.id);
                      toast.success(`Connected with ${req.alias}!`);
                    }}
                    className="h-7 rounded-full bg-[#d7dadc] px-2.5 text-xs font-bold text-black hover:bg-white"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    <span>Accept</span>
                  </Button>
                  <button
                    onClick={() => {
                      declineFriendRequest(req.id);
                      toast.info("Request declined");
                    }}
                    className="rounded-md p-1 text-[#818384] hover:text-[#d7dadc]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Scholars Directory ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-[#818384]">
            Campus Scholars ({filteredScholars.length})
          </h3>
          <span className="font-mono text-[11px] text-[#818384]">
            {connectedFriends.length} Connected
          </span>
        </div>

        {filteredScholars.length === 0 ? (
          <div className="space-y-2 rounded-xl border border-[#343536] bg-[#1a1a1b] p-8 text-center text-xs text-[#818384]">
            <Users className="mx-auto h-8 w-8 text-[#818384]/40" />
            <p>No scholars found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filteredScholars.map((scholar) => {
              const isFriend = scholar.status === "friends";
              const isPending = scholar.status === "pending_sent";

              return (
                <div
                  key={scholar.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-[#343536] bg-[#1a1a1b] p-3.5 transition-colors hover:border-[#474748]"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                            scholar.avatarColor,
                          )}
                        >
                          {scholar.alias.charAt(0)}
                        </div>
                        <div className="min-w-0 text-xs">
                          <p className="truncate font-bold text-[#d7dadc]">{scholar.alias}</p>
                          <p className="truncate font-mono text-[11px] text-[#818384]">
                            u/{scholar.username.replace("@", "")}
                          </p>
                        </div>
                      </div>

                      {scholar.college.toLowerCase().includes(profile.college.toLowerCase()) && (
                        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-400">
                          Campus Peer
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 text-[11px] text-[#818384]">
                      <p className="flex items-center gap-1 truncate text-[#d7dadc]/80">
                        <School className="h-3 w-3 shrink-0 text-indigo-400" />
                        <span>{scholar.college}</span>
                      </p>
                      <p className="flex items-center gap-1 truncate">
                        <GraduationCap className="h-3 w-3 shrink-0 text-purple-400" />
                        <span>{scholar.course}</span>
                      </p>
                    </div>

                    {scholar.bio && (
                      <p className="line-clamp-2 text-[11px] italic text-[#818384]">
                        "{scholar.bio}"
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 border-t border-[#343536] pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toggleFriendStatus(scholar.id);
                        if (!isFriend && !isPending)
                          toast.success(`Request sent to u/${scholar.username.replace("@", "")}`);
                        else if (isPending) toast.info("Request cancelled");
                        else toast.info(`Removed ${scholar.alias}`);
                      }}
                      className={cn(
                        "h-7 flex-1 rounded-full text-xs font-bold transition-colors",
                        isFriend
                          ? "border-[#343536] text-[#818384] hover:text-rose-400"
                          : isPending
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            : "border-transparent bg-[#d7dadc] text-black hover:bg-white",
                      )}
                    >
                      {isFriend ? (
                        <>
                          <UserCheck className="mr-1 h-3 w-3 text-emerald-400" />
                          <span>Friends</span>
                        </>
                      ) : isPending ? (
                        <>
                          <Clock className="mr-1 h-3 w-3 animate-spin" />
                          <span>Pending</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-1 h-3 w-3" />
                          <span>Add Friend</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onOpenDmWith(scholar.username);
                        toast.info(`Opening chat with u/${scholar.username.replace("@", "")}`);
                      }}
                      className="h-7 rounded-full border-[#343536] px-3 text-xs font-bold text-[#d7dadc] hover:bg-[#272729]"
                    >
                      <MessageSquare className="mr-1 h-3 w-3" />
                      <span>Chat</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
