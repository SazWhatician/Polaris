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
import { useCommunityStore, type CommunityPost } from "@/lib/community-store";
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
  const [postCategory, setPostCategory] =
    useState<CommunityPost["category"]>("Notes & Cheatsheets");
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
  }, [
    posts,
    selectedCategory,
    selectedCollegeFilter,
    selectedCourseFilter,
    selectedYearFilter,
    searchQuery,
  ]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postDescription.trim()) {
      toast.error("Please provide both a title and description");
      return;
    }

    const selectedComm = communities.find((c) => c.id === postCommunityId) ||
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
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
      {/* ══════════════════════════════════════════════════════════════════════
          LEFT COLUMN (Span 3): Scholar Profile Badge, Hubs, & Filters
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 lg:col-span-3">
        {/* 1. Scholar Identity Card (Locked from Login) */}
        <div className="liquid-glass space-y-3.5 border-primary/20 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="shadow-xs flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-gradient-to-tr from-primary/30 to-indigo-500/20 text-lg font-black text-primary">
              {profile.alias.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-foreground">{profile.alias}</h3>
              <p className="truncate font-mono text-[11px] font-semibold text-primary">
                {profile.username}
              </p>
            </div>
          </div>

          <div className="space-y-2 border-t border-border/40 pt-2.5 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <School className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
              <span className="truncate text-[11px] font-medium text-foreground">
                {profile.college}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="h-3.5 w-3.5 shrink-0 text-purple-400" />
              <span className="truncate text-[11px] font-medium text-foreground">
                {profile.course}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="truncate text-[11px] font-medium text-foreground">
                {profile.year}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/30 pt-2 font-mono text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 font-bold text-emerald-500">
              <CheckCircle2 className="h-3 w-3" />
              <span>Verified Scholar</span>
            </span>
            <span>Auth v2</span>
          </div>
        </div>

        {/* 2. University Hubs Switcher */}
        <div className="liquid-glass space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              University Circles
            </h4>
            <span className="font-mono text-[10px] text-muted-foreground">
              {communities.filter((c) => c.isJoined).length} Joined
            </span>
          </div>

          <div className="space-y-2">
            {communities.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition-all",
                  c.isJoined
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-border/40 bg-muted/30 text-muted-foreground hover:bg-muted/50",
                )}
              >
                <div className="min-w-0">
                  <div className="truncate text-[11px] font-bold text-foreground">{c.name}</div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">
                    {c.college}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleJoinCommunity(c.id)}
                  className={cn(
                    "shrink-0 rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold transition-all",
                    c.isJoined
                      ? "shadow-xs bg-primary text-primary-foreground"
                      : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {c.isJoined ? "Joined" : "Join"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Category Filter List */}
        <div className="liquid-glass space-y-2.5 p-4 sm:p-5">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            Topic Categories
          </h4>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-xs font-medium transition-all",
                  selectedCategory === cat
                    ? "shadow-xs bg-primary font-bold text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
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
      <div className="space-y-4 lg:col-span-6">
        {/* Search & Composer Trigger Bar */}
        <div className="liquid-glass flex flex-col items-center gap-2.5 p-3.5 sm:flex-row sm:p-4">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, notes, formulas (#Attention, #Raft)..."
              className="shadow-xs h-9 w-full rounded-xl border border-border/60 bg-muted/40 pl-9 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button
            size="sm"
            onClick={() => setShowComposer(!showComposer)}
            className="h-9 w-full shrink-0 gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 sm:w-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{showComposer ? "Close Form" : "Share Knowledge"}</span>
          </Button>
        </div>

        {/* Expandable Liquid Glass Post Composer */}
        {showComposer && (
          <form
            onSubmit={handleCreatePost}
            className="liquid-glass space-y-3.5 border-primary/30 p-5 duration-200 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Publish Course Notes or Question</span>
              </h3>
              <span className="font-mono text-[10px] text-muted-foreground">
                Posting as {profile.username}
              </span>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Title e.g. CS224N Attention & RoPE Derivations"
                required
                className="h-9 w-full rounded-xl border border-border/60 bg-muted/40 px-3 text-xs font-semibold text-foreground outline-none placeholder:font-normal focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <select
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value as CommunityPost["category"])}
                className="h-9 w-full rounded-xl border border-border/60 bg-muted/40 px-3 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
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
                className="h-9 w-full rounded-xl border border-border/60 bg-muted/40 px-3 text-xs font-semibold text-foreground outline-none focus:ring-1 focus:ring-primary"
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
                className="w-full resize-none rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <input
                type="text"
                value={postTags}
                onChange={(e) => setPostTags(e.target.value)}
                placeholder="Tags e.g. #Transformers, #Attention"
                className="h-9 w-full rounded-xl border border-border/60 bg-muted/40 px-3 font-mono text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />

              <input
                type="text"
                value={postAttachment}
                onChange={(e) => setPostAttachment(e.target.value)}
                placeholder="Attachment e.g. Lecture_Notes_v2.pdf"
                className="h-9 w-full rounded-xl border border-border/60 bg-muted/40 px-3 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowComposer(false)}
                className="h-8 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm"
              >
                Publish Note
              </Button>
            </div>
          </form>
        )}

        {/* Stream of Discussion Cards */}
        <div className="space-y-3.5">
          {filteredPosts.length === 0 ? (
            <div className="liquid-glass space-y-3 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground">No Discussion Threads Found</h3>
              <p className="mx-auto max-w-sm text-xs text-muted-foreground">
                Be the first scholar to share lecture summaries, formulas, or start a study circle!
              </p>
              <Button
                size="sm"
                onClick={() => setShowComposer(true)}
                className="rounded-xl bg-primary text-xs font-bold text-primary-foreground"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                <span>Create First Note</span>
              </Button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const friendState = getFriendState(post.authorUsername);
              const isCommentsOpen = expandedCommentsPostId === post.id;

              return (
                <div key={post.id} className="liquid-glass group space-y-3.5 p-5 transition-all">
                  {/* Card Header: Author Line & Friend Action */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="shadow-xs flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-gradient-to-tr from-primary/30 to-indigo-500/20 text-xs font-bold text-primary">
                        {post.authorAlias.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-xs font-bold text-foreground">
                            {post.authorAlias}
                          </span>
                          <span className="truncate font-mono text-[10px] text-primary">
                            {post.authorUsername}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[10px] text-muted-foreground">
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
                            const friendObj = friends.find(
                              (f) => f.username === post.authorUsername,
                            );
                            if (friendObj) toggleFriendStatus(friendObj.id);
                          }
                        }}
                        className={cn(
                          "flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1 font-mono text-[10px] font-bold transition-all",
                          friendState === "friends"
                            ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-500"
                            : friendState === "pending_sent"
                              ? "border border-amber-500/30 bg-amber-500/15 text-amber-500"
                              : "border border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
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
                      <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-bold text-primary">
                        {post.category}
                      </span>
                      <span className="truncate font-mono text-[10px] text-muted-foreground">
                        {post.communityName}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold leading-snug text-foreground">{post.title}</h3>

                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                      {post.description}
                    </p>
                  </div>

                  {/* Attachment Badge */}
                  {post.attachmentName && (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-muted/40 p-2.5 text-xs">
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate font-mono text-[11px] text-foreground">
                          {post.attachmentName}
                        </span>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground">
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
                          className="rounded-md bg-muted/60 px-2 py-0.5 font-mono text-[9px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Bottom Bar: Like, Comments & Actions */}
                  <div className="flex items-center justify-between border-t border-border/40 pt-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleLikePost(post.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-xs transition-all",
                          post.likedByUser
                            ? "bg-rose-500/10 font-bold text-rose-500"
                            : "hover:bg-muted/40 hover:text-foreground",
                        )}
                      >
                        <Heart className={cn("h-3.5 w-3.5", post.likedByUser && "fill-rose-500")} />
                        <span>{post.likes}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedCommentsPostId(isCommentsOpen ? null : post.id)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-xs transition-all",
                          isCommentsOpen
                            ? "bg-primary/10 font-bold text-primary"
                            : "hover:bg-muted/40 hover:text-foreground",
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
                      className="p-1 transition-colors hover:text-foreground"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Expandable Comments Thread */}
                  {isCommentsOpen && (
                    <div className="space-y-2.5 border-t border-border/30 pt-3 duration-150 animate-in fade-in">
                      {post.comments.map((c) => (
                        <div
                          key={c.id}
                          className="space-y-1 rounded-xl border border-border/30 bg-muted/30 p-2.5"
                        >
                          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                            <span className="font-bold text-foreground">
                              {c.authorAlias} ({c.authorUsername})
                            </span>
                            <span>{c.createdAt}</span>
                          </div>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {c.content}
                          </p>
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
                          className="h-8 flex-1 rounded-xl border border-border/60 bg-muted/40 px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(post.id)}
                          className="shadow-xs h-8 shrink-0 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground"
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
      <div className="space-y-4 lg:col-span-3">
        {/* 1. Study Circle (Connected Friends) */}
        <div className="liquid-glass space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span>Study Circle</span>
            </h4>
            <span className="font-mono text-[10px] font-bold text-emerald-500">
              {friends.filter((f) => f.status === "friends").length} Active
            </span>
          </div>

          {friends.length === 0 ? (
            <div className="space-y-1.5 rounded-xl border border-border/30 bg-muted/20 p-4 text-center">
              <p className="text-xs font-semibold text-foreground">No Peers Connected Yet</p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Click <span className="font-mono font-bold text-primary">Add Friend</span> on any
                post author to add them to your live study circle.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-muted/30 p-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white",
                        f.avatarColor,
                      )}
                    >
                      {f.alias.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-foreground">{f.alias}</div>
                      <div className="truncate font-mono text-[10px] text-muted-foreground">
                        {f.college}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/chat")}
                    className="shrink-0 rounded-lg bg-primary/10 p-1.5 text-primary transition-all hover:bg-primary hover:text-primary-foreground"
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
        <div className="liquid-glass space-y-3 border-emerald-500/20 p-4 sm:p-5">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-500">
            <ShieldCheck className="h-4 w-4" />
            <span>Academic Verification</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            All shared notes and formulas are validated against grounded syllabus vectors indexed in
            Qdrant.
          </p>

          <div className="space-y-1.5 border-t border-border/40 pt-2 font-mono text-[11px]">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Vector Store:</span>
              <span className="font-bold text-emerald-500">Qdrant Active</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Egress:</span>
              <span className="font-bold text-primary">Cloudflare R2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
