"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Heart,
  MessageSquare,
  Share2,
  Users,
  Plus,
  Search,
  School,
  GraduationCap,
  Calendar,
  UserPlus,
  UserCheck,
  Send,
  FileText,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import {
  useCommunityStore,
  type CommunityPost,
} from "@/lib/community-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  onOpenIdentityModal?: () => void;
  onOpenFriendsDrawer?: () => void;
}

export function CommunityFeed({}: Props) {
  const router = useRouter();
  const {
    profile,
    communities,
    posts,
    friends,
    selectedCollegeFilter,
    selectedCourseFilter,
    selectedYearFilter,
    toggleJoinCommunity,
    createPost,
    toggleLikePost,
    addComment,
    sendFriendRequest,
    toggleFriendStatus,
  } = useCommunityStore();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showComposer, setShowComposer] = useState(false);

  // Post Creator Form State
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postCategory, setPostCategory] = useState<CommunityPost["category"]>("Notes & Cheatsheets");
  const [postCommunityId, setPostCommunityId] = useState(communities[0]?.id || "comm-global-cs");
  const [postTags, setPostTags] = useState("");
  const [postAttachment, setPostAttachment] = useState("");

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchCategory = selectedCategory === "All" || p.category === selectedCategory;
      const matchCollege =
        selectedCollegeFilter === "All Colleges" ||
        p.authorCollege.toLowerCase().includes(selectedCollegeFilter.toLowerCase());
      const matchCourse =
        selectedCourseFilter === "All Courses" ||
        p.authorCourse.toLowerCase().includes(selectedCourseFilter.toLowerCase());
      const matchYear =
        selectedYearFilter === "All Years" ||
        p.authorYear.toLowerCase().includes(selectedYearFilter.toLowerCase());

      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authorAlias.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authorUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCategory && matchCollege && matchCourse && matchYear && matchSearch;
    });
  }, [posts, selectedCategory, selectedCollegeFilter, selectedCourseFilter, selectedYearFilter, searchQuery]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postDescription.trim()) {
      toast.error("Please provide both a title and description");
      return;
    }

    const selectedComm =
      communities.find((c) => c.id === postCommunityId) ||
      communities[0] || {
        id: "comm-global-cs",
        name: "Global Algorithms & Systems Nexus",
      };

    const tagsArray = postTags
      .split(",")
      .map((t) => (t.trim().startsWith("#") ? t.trim() : `#${t.trim()}`))
      .filter((t) => t.length > 1);

    createPost({
      communityId: selectedComm.id,
      communityName: selectedComm.name,
      authorAlias: profile.alias,
      authorUsername: profile.username,
      authorCollege: profile.college,
      authorCourse: profile.course,
      authorYear: profile.year,
      title: postTitle.trim(),
      description: postDescription.trim(),
      category: postCategory,
      tags: tagsArray.length > 0 ? tagsArray : ["#StudyNotes", "#Polaris"],
      attachmentName: postAttachment.trim() || undefined,
      attachmentType: postAttachment.trim() ? "Course PDF" : undefined,
    });

    toast.success("Post published to the Scholar Community!");
    setPostTitle("");
    setPostDescription("");
    setPostTags("");
    setPostAttachment("");
    setShowComposer(false);
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    addComment(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    toast.success("Comment posted to thread!");
  };

  const getFriendState = (username: string) => {
    if (username === profile.username) return "self";
    const friend = friends.find((f) => f.username === username);
    return friend ? friend.status : "none";
  };

  const categories: string[] = [
    "All",
    "Notes & Cheatsheets",
    "Study Groups",
    "Exam Prep",
    "Discussions",
    "Q&A",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      
      {/* ══════════════════════════════════════════════════════════════════════
          LEFT COLUMN (Span 3): Scholar Profile Badge, Hubs, & Filters
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="lg:col-span-3 space-y-4">
        
        {/* 1. Scholar Identity Card (Locked from Login) */}
        <div className="liquid-glass p-4 sm:p-5 space-y-3.5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary/30 to-indigo-500/20 border border-primary/40 flex items-center justify-center font-black text-lg text-primary shadow-xs shrink-0">
              {profile.alias.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-foreground truncate">{profile.alias}</h3>
              <p className="text-[11px] font-mono text-primary font-semibold truncate">{profile.username}</p>
            </div>
          </div>

          <div className="pt-2.5 border-t border-border/40 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <School className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="truncate font-medium text-foreground text-[11px]">{profile.college}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span className="truncate font-medium text-foreground text-[11px]">{profile.course}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="truncate font-medium text-foreground text-[11px]">{profile.year}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1 text-emerald-500 font-bold">
              <CheckCircle2 className="h-3 w-3" />
              <span>Verified Scholar</span>
            </span>
            <span>Auth v2</span>
          </div>
        </div>

        {/* 2. University Hubs Switcher */}
        <div className="liquid-glass p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
              University Circles
            </h4>
            <span className="text-[10px] font-mono text-muted-foreground">
              {communities.filter((c) => c.isJoined).length} Joined
            </span>
          </div>

          <div className="space-y-2">
            {communities.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 group",
                  c.isJoined
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50"
                )}
              >
                <div className="min-w-0">
                  <div className="font-bold text-[11px] truncate text-foreground">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">{c.college}</div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleJoinCommunity(c.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all shrink-0",
                    c.isJoined
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {c.isJoined ? "Joined" : "Join"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Category Filter List */}
        <div className="liquid-glass p-4 sm:p-5 space-y-2.5">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            Topic Categories
          </h4>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <span>{cat}</span>
                {selectedCategory === cat && <Sparkles className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          CENTER COLUMN (Span 6): Search, Composer, & Academic Discussion Feed
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="lg:col-span-6 space-y-4">
        
        {/* Search & Composer Trigger Bar */}
        <div className="liquid-glass p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, notes, formulas (#Attention, #Raft)..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setShowComposer(!showComposer)}
            className="h-9 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-md hover:bg-primary/90 gap-1.5 w-full sm:w-auto shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showComposer ? "Close Form" : "Share Knowledge"}</span>
          </Button>
        </div>

        {/* Expandable Liquid Glass Post Composer */}
        {showComposer && (
          <form onSubmit={handleCreatePost} className="liquid-glass p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200 border-primary/30">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Publish Course Notes or Question</span>
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground">Posting as {profile.username}</span>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Title e.g. CS224N Attention & RoPE Derivations"
                required
                className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground font-semibold placeholder:font-normal outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value as CommunityPost["category"])}
                className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground font-semibold outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Notes & Cheatsheets">Notes & Cheatsheets</option>
                <option value="Study Groups">Study Groups</option>
                <option value="Exam Prep">Exam Prep</option>
                <option value="Discussions">Discussions</option>
                <option value="Q&A">Q&A</option>
              </select>

              <select
                value={postCommunityId}
                onChange={(e) => setPostCommunityId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground font-semibold outline-none focus:ring-1 focus:ring-primary"
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <textarea
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                placeholder="Describe key formulas, lecture notes, textbook references, or study questions..."
                rows={3}
                required
                className="w-full p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={postTags}
                onChange={(e) => setPostTags(e.target.value)}
                placeholder="Tags e.g. #Transformers, #Attention"
                className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground font-mono outline-none focus:ring-1 focus:ring-primary"
              />

              <input
                type="text"
                value={postAttachment}
                onChange={(e) => setPostAttachment(e.target.value)}
                placeholder="Attachment e.g. Lecture_Notes_v2.pdf"
                className="w-full h-9 px-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowComposer(false)}
                className="rounded-xl text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl font-bold text-xs h-8 bg-primary text-primary-foreground shadow-sm"
              >
                Publish Note
              </Button>
            </div>
          </form>
        )}

        {/* Stream of Discussion Cards */}
        <div className="space-y-3.5">
          {filteredPosts.length === 0 ? (
            <div className="liquid-glass p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/40 text-muted-foreground flex items-center justify-center mx-auto">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No Discussion Threads Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Be the first scholar to share lecture summaries, formulas, or start a study circle!
              </p>
              <Button
                size="sm"
                onClick={() => setShowComposer(true)}
                className="rounded-xl text-xs font-bold bg-primary text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Create First Note</span>
              </Button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const friendState = getFriendState(post.authorUsername);
              const isCommentsOpen = expandedCommentsPostId === post.id;

              return (
                <div
                  key={post.id}
                  className="liquid-glass p-5 space-y-3.5 transition-all group"
                >
                  {/* Card Header: Author Line & Friend Action */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary/30 to-indigo-500/20 border border-primary/30 flex items-center justify-center font-bold text-xs text-primary shrink-0 shadow-xs">
                        {post.authorAlias.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-foreground truncate">{post.authorAlias}</span>
                          <span className="text-[10px] font-mono text-primary truncate">{post.authorUsername}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono truncate mt-0.5">
                          <span>{post.authorCollege}</span>
                          <span>•</span>
                          <span>{post.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Add Friend Action Toggle */}
                    {friendState !== "self" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (friendState === "none") {
                            sendFriendRequest({
                              alias: post.authorAlias,
                              username: post.authorUsername,
                              college: post.authorCollege,
                              course: post.authorCourse,
                              year: post.authorYear,
                            });
                            toast.success(`Connected with ${post.authorAlias}`);
                          } else {
                            const friendObj = friends.find((f) => f.username === post.authorUsername);
                            if (friendObj) toggleFriendStatus(friendObj.id);
                          }
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all flex items-center gap-1 shrink-0",
                          friendState === "friends"
                            ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            : friendState === "pending_sent"
                            ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                            : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground"
                        )}
                      >
                        {friendState === "friends" ? (
                          <>
                            <UserCheck className="h-3 w-3" />
                            <span>Friends</span>
                          </>
                        ) : friendState === "pending_sent" ? (
                          <span>Pending</span>
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3" />
                            <span>Add Friend</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                        {post.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono truncate">
                        {post.communityName}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {post.description}
                    </p>
                  </div>

                  {/* Attachment Badge */}
                  {post.attachmentName && (
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-mono text-[11px] text-foreground truncate">
                          {post.attachmentName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase shrink-0">
                        {post.attachmentType || "PDF Document"}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-muted/60 text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Bottom Bar: Like, Comments & Actions */}
                  <div className="pt-2.5 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleLikePost(post.id)}
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-mono transition-all py-1 px-2 rounded-lg",
                          post.likedByUser
                            ? "text-rose-500 font-bold bg-rose-500/10"
                            : "hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        <Heart className={cn("h-3.5 w-3.5", post.likedByUser && "fill-rose-500")} />
                        <span>{post.likes}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedCommentsPostId(isCommentsOpen ? null : post.id)}
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-mono transition-all py-1 px-2 rounded-lg",
                          isCommentsOpen
                            ? "text-primary font-bold bg-primary/10"
                            : "hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>{post.comments.length} Comments</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("Community link copied to clipboard!");
                      }}
                      className="hover:text-foreground transition-colors p-1"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Expandable Comments Thread */}
                  {isCommentsOpen && (
                    <div className="pt-3 border-t border-border/30 space-y-2.5 animate-in fade-in duration-150">
                      {post.comments.map((c) => (
                        <div key={c.id} className="p-2.5 rounded-xl bg-muted/30 border border-border/30 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                            <span className="font-bold text-foreground">{c.authorAlias} ({c.authorUsername})</span>
                            <span>{c.createdAt}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{c.content}</p>
                        </div>
                      ))}

                      {/* Comment Input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddComment(post.id);
                          }}
                          placeholder="Write an academic response or explanation..."
                          className="flex-1 h-8 px-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(post.id)}
                          className="h-8 px-3 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-xs shrink-0"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT COLUMN (Span 3): Classmates & Friends Circle + Telemetry Info
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="lg:col-span-3 space-y-4">
        
        {/* 1. Study Circle (Connected Friends) */}
        <div className="liquid-glass p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span>Study Circle</span>
            </h4>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">
              {friends.filter((f) => f.status === "friends").length} Active
            </span>
          </div>

          {friends.length === 0 ? (
            <div className="p-4 rounded-xl bg-muted/20 border border-border/30 text-center space-y-1.5">
              <p className="text-xs font-semibold text-foreground">No Peers Connected Yet</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Click <span className="font-mono text-primary font-bold">Add Friend</span> on any post author to add them to your live study circle.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="p-2.5 rounded-xl bg-muted/30 border border-border/40 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn("w-7 h-7 rounded-lg text-white font-bold text-[10px] flex items-center justify-center shrink-0", f.avatarColor)}>
                      {f.alias.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-foreground truncate">{f.alias}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">{f.college}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/chat")}
                    className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all shrink-0"
                    title="Launch Grounded RAG Chat"
                  >
                    <MessageSquare className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. RAG Study Guidelines & Engine Specs */}
        <div className="liquid-glass p-4 sm:p-5 space-y-3 border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs font-mono">
            <ShieldCheck className="h-4 w-4" />
            <span>Academic Verification</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All shared notes and formulas are validated against grounded syllabus vectors indexed in Qdrant.
          </p>

          <div className="pt-2 border-t border-border/40 space-y-1.5 text-[11px] font-mono">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Vector Store:</span>
              <span className="text-emerald-500 font-bold">Qdrant Active</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Egress:</span>
              <span className="text-primary font-bold">Cloudflare R2</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
