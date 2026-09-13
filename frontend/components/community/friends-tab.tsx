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
  const [customCollege, setCustomCollege] = useState(profile.college || COLLEGES[0] || "Stanford University");
  const [customAlias, setCustomAlias] = useState("");
  const [showCustomModal, setShowCustomModal] = useState(false);

  const pendingReceived = useMemo(() => friends.filter((f) => f.status === "pending_received"), [friends]);
  const connectedFriends = useMemo(() => friends.filter((f) => f.status === "friends"), [friends]);
  const otherScholars = useMemo(
    () => friends.filter((f) => f.status !== "pending_received"),
    [friends]
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
      <div className="bg-[#1a1a1b] border border-[#343536] rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#818384]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scholars by u/handle, name, or campus..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[#272729] border border-[#343536] text-[#d7dadc] placeholder:text-[#818384] focus:outline-none focus:border-[#d7dadc]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCollegeFilter}
              onChange={(e) => setSelectedCollegeFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-[#272729] border border-[#343536] text-[#d7dadc] focus:outline-none"
            >
              <option value="All">All Campuses</option>
              <option value={profile.college}>My Campus ({profile.college.split(" ")[0]})</option>
              {COLLEGES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <Button
              size="sm"
              onClick={() => setShowCustomModal(!showCustomModal)}
              className="h-8 px-3 rounded-full text-xs font-bold gap-1 bg-[#d7dadc] hover:bg-white text-black shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite u/</span>
            </Button>
          </div>
        </div>

        {/* Custom Invite box */}
        {showCustomModal && (
          <form
            onSubmit={handleSendCustomRequest}
            className="p-3 rounded-lg bg-[#272729] border border-[#343536] space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#d7dadc] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Send Friend Request to Scholar</span>
              </span>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="text-[#818384] hover:text-[#d7dadc]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                required
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                placeholder="u/handle"
                className="px-2.5 py-1.5 text-xs font-mono rounded-md bg-[#1a1a1b] border border-[#343536] text-[#d7dadc] focus:outline-none"
              />
              <input
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder="Full Name (Optional)"
                className="px-2.5 py-1.5 text-xs rounded-md bg-[#1a1a1b] border border-[#343536] text-[#d7dadc] focus:outline-none"
              />
              <select
                value={customCollege}
                onChange={(e) => setCustomCollege(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-md bg-[#1a1a1b] border border-[#343536] text-[#d7dadc] focus:outline-none"
              >
                {COLLEGES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="sm" className="h-7 px-3 text-xs font-bold rounded-full bg-[#d7dadc] text-black">
                Send Request
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* ── Pending Requests (If Any) ── */}
      {pendingReceived.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#818384] px-1">
            Pending Received Requests ({pendingReceived.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {pendingReceived.map((req) => (
              <div
                key={req.id}
                className="bg-[#1a1a1b] border border-[#343536] p-3 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0", req.avatarColor)}>
                    {req.alias.charAt(0)}
                  </div>
                  <div className="min-w-0 text-xs">
                    <p className="font-bold text-[#d7dadc] truncate">{req.alias}</p>
                    <p className="text-[10px] font-mono text-[#818384] truncate">u/{req.username.replace("@", "")}</p>
                    <p className="text-[10px] text-[#818384] truncate">{req.college}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => {
                      acceptFriendRequest(req.id);
                      toast.success(`Connected with ${req.alias}!`);
                    }}
                    className="h-7 px-2.5 rounded-full text-xs font-bold bg-[#d7dadc] hover:bg-white text-black"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    <span>Accept</span>
                  </Button>
                  <button
                    onClick={() => {
                      declineFriendRequest(req.id);
                      toast.info("Request declined");
                    }}
                    className="p-1 rounded-md text-[#818384] hover:text-[#d7dadc]"
                  >
                    <X className="w-4 h-4" />
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
          <span className="text-[#818384] font-mono text-[11px]">
            {connectedFriends.length} Connected
          </span>
        </div>

        {filteredScholars.length === 0 ? (
          <div className="bg-[#1a1a1b] border border-[#343536] p-8 text-center rounded-xl text-xs text-[#818384] space-y-2">
            <Users className="w-8 h-8 text-[#818384]/40 mx-auto" />
            <p>No scholars found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredScholars.map((scholar) => {
              const isFriend = scholar.status === "friends";
              const isPending = scholar.status === "pending_sent";

              return (
                <div
                  key={scholar.id}
                  className="bg-[#1a1a1b] hover:border-[#474748] border border-[#343536] rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0", scholar.avatarColor)}>
                          {scholar.alias.charAt(0)}
                        </div>
                        <div className="min-w-0 text-xs">
                          <p className="font-bold text-[#d7dadc] truncate">{scholar.alias}</p>
                          <p className="text-[11px] font-mono text-[#818384] truncate">u/{scholar.username.replace("@", "")}</p>
                        </div>
                      </div>

                      {scholar.college.toLowerCase().includes(profile.college.toLowerCase()) && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                          Campus Peer
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 text-[11px] text-[#818384]">
                      <p className="flex items-center gap-1 truncate text-[#d7dadc]/80">
                        <School className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span>{scholar.college}</span>
                      </p>
                      <p className="flex items-center gap-1 truncate">
                        <GraduationCap className="w-3 h-3 text-purple-400 shrink-0" />
                        <span>{scholar.course}</span>
                      </p>
                    </div>

                    {scholar.bio && (
                      <p className="text-[11px] text-[#818384] italic line-clamp-2">
                        "{scholar.bio}"
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#343536]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toggleFriendStatus(scholar.id);
                        if (!isFriend && !isPending) toast.success(`Request sent to u/${scholar.username.replace("@", "")}`);
                        else if (isPending) toast.info("Request cancelled");
                        else toast.info(`Removed ${scholar.alias}`);
                      }}
                      className={cn(
                        "flex-1 h-7 text-xs font-bold rounded-full transition-colors",
                        isFriend
                          ? "border-[#343536] text-[#818384] hover:text-rose-400"
                          : isPending
                          ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                          : "bg-[#d7dadc] hover:bg-white text-black border-transparent"
                      )}
                    >
                      {isFriend ? (
                        <>
                          <UserCheck className="w-3 h-3 mr-1 text-emerald-400" />
                          <span>Friends</span>
                        </>
                      ) : isPending ? (
                        <>
                          <Clock className="w-3 h-3 mr-1 animate-spin" />
                          <span>Pending</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 mr-1" />
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
                      className="h-7 px-3 text-xs font-bold rounded-full border-[#343536] hover:bg-[#272729] text-[#d7dadc]"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
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
