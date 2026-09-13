"use client";

import { useState } from "react";
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Bookmark,
  Send,
  Plus,
  FileText,
  Flame,
  Sparkles,
  Trophy,
  Tag,
  Paperclip,
} from "lucide-react";
import { useCommunityStore, type CommunityPost } from "@/lib/community-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  onOpenDmWith?: (username: string) => void;
}

export function PostsTab({ onOpenDmWith }: Props) {
  const {
    profile,
    posts,
    createPost,
    toggleLikePost,
    addComment,
    communities,
  } = useCommunityStore();

  const [sortBy, setSortBy] = useState<"hot" | "new" | "top">("hot");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [downvotedPosts, setDownvotedPosts] = useState<Record<string, boolean>>({});
  const [showComposer, setShowComposer] = useState(false);

  // Composer State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CommunityPost["category"]>("Notes & Cheatsheets");
  const [communityId, setCommunityId] = useState(communities[0]?.id || "comm-stanford-ai");
  const [tags, setTags] = useState("");
  const [attachment, setAttachment] = useState("");

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please provide both title and content");
      return;
    }

    const comm = communities.find((c) => c.id === communityId) || communities[0];
    const tagsArr = tags
      .split(",")
      .map((t) => (t.trim().startsWith("#") ? t.trim() : `#${t.trim()}`))
      .filter((t) => t.length > 1);

    createPost({
      communityId: comm?.id || "comm-stanford-ai",
      communityName: comm?.name || "Stanford CS224N & CS229 AI Circle",
      authorAlias: profile.alias,
      authorUsername: profile.username,
      authorCollege: profile.college,
      authorCourse: profile.course,
      authorYear: profile.year,
      title: title.trim(),
      description: description.trim(),
      category,
      tags: tagsArr.length > 0 ? tagsArr : ["#CourseNotes", `#${profile.college.split(" ")[0]}`],
      attachmentName: attachment.trim() || undefined,
      attachmentType: attachment.trim() ? "Course PDF" : undefined,
    });

    toast.success("Post published to the community!");
    setTitle("");
    setDescription("");
    setTags("");
    setAttachment("");
    setShowComposer(false);
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    addComment(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    toast.success("Comment posted to thread");
  };

  const toggleDownvote = (postId: string) => {
    setDownvotedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Sort logic
  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "top") return b.likes - a.likes;
    if (sortBy === "new") return b.id.localeCompare(a.id);
    return (b.likes + b.comments.length) - (a.likes + a.comments.length);
  });

  return (
    <div className="space-y-4">
      {/* ── Reddit-Style Create Post Bar ── */}
      <div className="bg-[#1a1a1b] border border-[#343536] rounded-xl p-3 flex items-center gap-3 shadow-xs">
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0",
            profile.avatarColor || "bg-indigo-600"
          )}
        >
          {profile.alias.charAt(0)}
        </div>
        <input
          type="text"
          onClick={() => setShowComposer(true)}
          placeholder="Create Post in your university circle..."
          readOnly
          className="flex-1 bg-[#272729] hover:bg-[#2e2e30] border border-[#343536] text-xs text-foreground placeholder:text-[#818384] rounded-lg px-4 py-2 cursor-pointer transition-colors"
        />
        <Button
          size="sm"
          onClick={() => setShowComposer(true)}
          className="bg-[#d7dadc] hover:bg-white text-black font-bold text-xs rounded-full px-4 gap-1.5 h-8"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Post</span>
        </Button>
      </div>

      {/* ── Reddit-Style Sorting Bar (Hot, New, Top) ── */}
      <div className="bg-[#1a1a1b] border border-[#343536] rounded-xl p-1.5 flex items-center gap-1 text-xs">
        <button
          onClick={() => setSortBy("hot")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors",
            sortBy === "hot"
              ? "bg-[#272729] text-[#ff4500]"
              : "text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729]/60"
          )}
        >
          <Flame className="w-4 h-4" />
          <span>Hot</span>
        </button>

        <button
          onClick={() => setSortBy("new")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors",
            sortBy === "new"
              ? "bg-[#272729] text-primary"
              : "text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729]/60"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>New</span>
        </button>

        <button
          onClick={() => setSortBy("top")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors",
            sortBy === "top"
              ? "bg-[#272729] text-amber-400"
              : "text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729]/60"
          )}
        >
          <Trophy className="w-4 h-4" />
          <span>Top</span>
        </button>
      </div>

      {/* ── Reddit-Style Posts List ── */}
      <div className="space-y-3">
        {sortedPosts.map((post) => {
          const isUpvoted = post.likedByUser;
          const isDownvoted = !!downvotedPosts[post.id];
          const isSaved = !!savedPosts[post.id];
          const commentsOpen = !!expandedComments[post.id];
          const effectiveScore = post.likes - (isDownvoted ? 1 : 0);

          return (
            <article
              key={post.id}
              className="bg-[#1a1a1b] hover:border-[#474748] border border-[#343536] rounded-xl flex overflow-hidden transition-colors"
            >
              {/* Left Column: Reddit Upvote / Downvote Gutter */}
              <div className="w-11 sm:w-12 bg-[#151516] flex flex-col items-center py-3 select-none shrink-0">
                <button
                  type="button"
                  onClick={() => toggleLikePost(post.id)}
                  className={cn(
                    "p-1 rounded-md transition-colors",
                    isUpvoted ? "text-[#ff4500]" : "text-[#818384] hover:text-[#ff4500] hover:bg-[#272729]"
                  )}
                  title="Upvote"
                >
                  <ArrowBigUp className={cn("w-6 h-6", isUpvoted && "fill-[#ff4500]")} />
                </button>

                <span
                  className={cn(
                    "text-xs font-bold font-mono my-0.5",
                    isUpvoted
                      ? "text-[#ff4500]"
                      : isDownvoted
                      ? "text-[#7193ff]"
                      : "text-[#d7dadc]"
                  )}
                >
                  {effectiveScore}
                </span>

                <button
                  type="button"
                  onClick={() => toggleDownvote(post.id)}
                  className={cn(
                    "p-1 rounded-md transition-colors",
                    isDownvoted ? "text-[#7193ff]" : "text-[#818384] hover:text-[#7193ff] hover:bg-[#272729]"
                  )}
                  title="Downvote"
                >
                  <ArrowBigDown className={cn("w-6 h-6", isDownvoted && "fill-[#7193ff]")} />
                </button>
              </div>

              {/* Main Post Body */}
              <div className="flex-1 p-3 sm:p-4 space-y-2.5 min-w-0">
                {/* Meta Header */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#818384]">
                  <span className="font-bold text-[#d7dadc] hover:underline cursor-pointer">
                    c/{post.communityId.replace("comm-", "")}
                  </span>
                  <span>•</span>
                  <span>Posted by</span>
                  <span className="font-mono text-[#d7dadc] hover:underline cursor-pointer">
                    u/{post.authorUsername.replace("@", "")}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-[#272729] text-[#d7dadc] border border-[#343536]">
                    {post.authorCollege}
                  </span>
                  <span>•</span>
                  <span>{post.createdAt}</span>
                </div>

                {/* Title & Flair */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-[#d7dadc] leading-snug">
                      {post.title}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                      {post.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#d7dadc]/80 whitespace-pre-line leading-relaxed">
                    {post.description}
                  </p>
                </div>

                {/* Attachment Box if available */}
                {post.attachmentName && (
                  <div className="p-2.5 rounded-lg bg-[#272729] border border-[#343536] flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-mono font-semibold text-[#d7dadc] truncate">
                        {post.attachmentName}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.success(`Downloaded ${post.attachmentName}`)}
                      className="h-7 text-[11px] font-bold rounded-md border-[#474748] bg-transparent text-[#d7dadc] hover:bg-[#343536]"
                    >
                      Download Note
                    </Button>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono text-[#4fbcff] hover:underline cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Reddit-Style Bottom Action Bar */}
                <div className="pt-2 border-t border-[#343536]/60 flex flex-wrap items-center gap-1 sm:gap-2 text-xs font-bold text-[#818384]">
                  {/* Comments Button */}
                  <button
                    onClick={() =>
                      setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#272729] hover:text-[#d7dadc] transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments.length} Comments</span>
                  </button>

                  {/* Direct Message Author */}
                  <button
                    onClick={() => {
                      onOpenDmWith?.(post.authorUsername);
                      toast.info(`Opening DM with ${post.authorAlias}`);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#272729] hover:text-[#d7dadc] transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-primary" />
                    <span>DM Author</span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={() => toast.success("Post link copied to clipboard")}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#272729] hover:text-[#d7dadc] transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Share</span>
                  </button>

                  {/* Save */}
                  <button
                    onClick={() => {
                      setSavedPosts((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                      toast.info(isSaved ? "Post unsaved" : "Post saved to your profile");
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-[#272729] transition-colors",
                      isSaved ? "text-amber-400" : "hover:text-[#d7dadc]"
                    )}
                  >
                    <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-amber-400")} />
                    <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
                  </button>
                </div>

                {/* Expandable Reddit-Style Comments Thread */}
                {commentsOpen && (
                  <div className="pt-3 border-t border-[#343536] space-y-3">
                    {/* Add comment box */}
                    <div className="space-y-1.5">
                      <textarea
                        rows={2}
                        value={commentInputs[post.id] || ""}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        placeholder="What are your thoughts on this study note?"
                        className="w-full text-xs p-2.5 rounded-lg bg-[#272729] border border-[#343536] text-[#d7dadc] placeholder:text-[#818384] focus:outline-none focus:border-[#d7dadc] resize-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(post.id)}
                          disabled={!commentInputs[post.id]?.trim()}
                          className="h-7 px-3 text-xs font-bold rounded-full bg-[#d7dadc] hover:bg-white text-black"
                        >
                          Comment
                        </Button>
                      </div>
                    </div>

                    {/* Comments list */}
                    <div className="space-y-2 divide-y divide-[#272729]">
                      {post.comments.length === 0 ? (
                        <p className="text-[11px] text-[#818384] py-2 text-center">
                          No comments yet. Be the first to start the discussion!
                        </p>
                      ) : (
                        post.comments.map((comm) => (
                          <div key={comm.id} className="pt-2 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] text-[#818384]">
                              <span className="font-bold text-[#d7dadc] font-mono">
                                u/{comm.authorUsername.replace("@", "")}
                              </span>
                              <span>•</span>
                              <span>{comm.authorCollege}</span>
                              <span>•</span>
                              <span>{comm.createdAt}</span>
                            </div>
                            <p className="text-[#d7dadc] text-xs pl-2 border-l-2 border-[#343536]">
                              {comm.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Create Post Dialog ── */}
      <Dialog open={showComposer} onOpenChange={setShowComposer}>
        <DialogContent className="max-w-lg p-6 bg-[#1a1a1b] border border-[#343536] text-[#d7dadc] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#d7dadc] flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <span>Create a Post in Circle</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreatePost} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-[#818384] uppercase">
                Post Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title of notes, discussion, or question..."
                className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-[#272729] border border-[#343536] text-[#d7dadc] focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[#818384] uppercase">
                  Flair / Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CommunityPost["category"])}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#272729] border border-[#343536] text-[#d7dadc] focus:outline-none"
                >
                  <option value="Notes & Cheatsheets">Notes & Cheatsheets</option>
                  <option value="Study Groups">Study Groups</option>
                  <option value="Exam Prep">Exam Prep</option>
                  <option value="Discussions">Discussions</option>
                  <option value="Q&A">Q&A</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[#818384] uppercase">
                  Community Hub
                </label>
                <select
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#272729] border border-[#343536] text-[#d7dadc] focus:outline-none"
                >
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      c/{c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-[#818384] uppercase">
                Text Content
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the problem, derivations, or context..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-[#272729] border border-[#343536] text-[#d7dadc] focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[#818384] uppercase flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>Tags</span>
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="#RoPE, #CS229"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#272729] border border-[#343536] text-[#d7dadc] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono font-bold text-[#818384] uppercase flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  <span>Attachment</span>
                </label>
                <input
                  type="text"
                  value={attachment}
                  onChange={(e) => setAttachment(e.target.value)}
                  placeholder="Notes.pdf"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-[#272729] border border-[#343536] text-[#d7dadc] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowComposer(false)}
                className="text-xs text-[#818384] hover:text-[#d7dadc]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold px-4 rounded-full bg-[#d7dadc] hover:bg-white text-black"
              >
                Post
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
