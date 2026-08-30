"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Mail,
  Calendar,
  HardDrive,
  FileText,
  MessageSquare,
  Users,
  LogOut,
  LogIn,
  Sparkles,
  UploadCloud,
  Search,
  Trash2,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldCheck,
  ThumbsUp,
  MessageCircle,
  Plus,
  Copy,
  Check,
  Database,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { CrystalGlow } from "@/components/ui/crystal-glow";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  listDocuments,
  deleteDocument,
  reprocessDocument,
  type DocumentResponse,
} from "@/lib/api/documents";
import {
  getStoredChatSessions,
  deleteChatSession,
  clearAllChatSessions,
  type ChatSession,
} from "@/lib/chat-history-store";
import { UploadCard } from "@/components/upload-card";
import { useGsapEntrance } from "@/lib/use-animation-system";

interface CommunityPost {
  id: string;
  author: string;
  authorAvatar?: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  downloads: number;
  date: string;
  verified: boolean;
}

const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    author: "Elena Rostova",
    title: "CS189 Introduction to Machine Learning — Master Syllabus & Concept Graph",
    description:
      "Fully annotated syllabus covering Convex Optimization, Support Vector Machines, Backpropagation, and Deep Transformers with 142 citation chunks.",
    category: "Computer Science",
    tags: ["Machine Learning", "Optimization", "Neural Networks"],
    likes: 128,
    comments: 24,
    downloads: 412,
    date: "2 hours ago",
    verified: true,
  },
  {
    id: "post-2",
    author: "Marcus Thorne",
    title: "Organic Chemistry II (CHEM 220) — Complete Reaction Mechanisms & Flash Graph",
    description:
      "Synthesized knowledge topology with complete arrow-pushing mechanisms, prerequisite reactions, and lecture notes citations.",
    category: "Biochemistry",
    tags: ["Organic Chemistry", "Synthesis", "Reaction Topologies"],
    likes: 94,
    comments: 18,
    downloads: 305,
    date: "Yesterday",
    verified: true,
  },
  {
    id: "post-3",
    author: "Sophia Lin",
    title: "Linear Algebra & Spectral Graph Theory — Full Textbooks Index",
    description:
      "Grounded Qdrant-indexed collection covering Eigendecomposition, Singular Value Decomposition, and PageRank with high-res diagram OCR.",
    category: "Mathematics",
    tags: ["Linear Algebra", "Spectral Theory", "SVD"],
    likes: 156,
    comments: 31,
    downloads: 520,
    date: "3 days ago",
    verified: true,
  },
];

function UserProfileContent() {
  const { user, signOut, signInAsDemo } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"uploads" | "history" | "community" | "settings">("uploads");
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docSearch, setDocSearch] = useState("");
  const [docFilter, setDocFilter] = useState<"all" | "ocr_complete" | "processing" | "failed">("all");

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);
  const [communitySearch, setCommunitySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showShareModal, setShowShareModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostDesc, setNewPostDesc] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Computer Science");
  const [newPostTags, setNewPostTags] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const containerRef = useGsapEntrance(".gsap-user", 0.05);

  // Load documents
  const loadDocs = async () => {
    setDocsLoading(true);
    try {
      const items = await listDocuments();
      setDocs(items);
    } catch {
      // Fallback empty if backend unreachable
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  };

  // Load chat history
  const loadSessions = () => {
    const s = getStoredChatSessions();
    setSessions(s);
  };

  useEffect(() => {
    if (user) {
      loadDocs();
      loadSessions();
    }
  }, [user]);

  useEffect(() => {
    const handleUpdate = () => loadSessions();
    window.addEventListener("polaris:chat-history-updated", handleUpdate);
    return () => window.removeEventListener("polaris:chat-history-updated", handleUpdate);
  }, []);

  const handleDeleteDoc = async (id: string, name: string) => {
    try {
      await deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      toast.success(`Deleted ${name}`);
    } catch (e) {
      toast.error("Failed to delete document", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleReprocessDoc = async (id: string) => {
    try {
      await reprocessDocument(id);
      toast.success("Reprocessing document with OCR...");
      loadDocs();
    } catch (e) {
      toast.error("Reprocess request failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleDeleteSession = (id: string) => {
    deleteChatSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.info("Chat session deleted");
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      clearAllChatSessions();
      setSessions([]);
      toast.info("All chat history cleared");
    }
  };

  const handleCopyChat = (session: ChatSession) => {
    const text = session.messages
      .map((m) => `${m.role === "user" ? "User" : "Polaris AI"}: ${m.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopiedId(session.id);
    toast.success("Chat transcript copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLikePost = (id: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setCommunityPosts((posts) =>
          posts.map((p) => (p.id === id ? { ...p, likes: p.likes - 1 } : p))
        );
      } else {
        next.add(id);
        setCommunityPosts((posts) =>
          posts.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
        );
      }
      return next;
    });
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostDesc.trim()) {
      toast.error("Please provide both title and description for community post");
      return;
    }

    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      author: user?.displayName || user?.email?.split("@")[0] || "Scholar Researcher",
      title: newPostTitle,
      description: newPostDesc,
      category: newPostCategory,
      tags: newPostTags.split(",").map((t) => t.trim()).filter(Boolean),
      likes: 1,
      comments: 0,
      downloads: 0,
      date: "Just now",
      verified: true,
    };

    setCommunityPosts((prev) => [post, ...prev]);
    setShowShareModal(false);
    setNewPostTitle("");
    setNewPostDesc("");
    setNewPostTags("");
    toast.success("Published to the Polaris Community Hub!");
  };

  // Filtered docs
  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      const matchSearch = d.filename.toLowerCase().includes(docSearch.toLowerCase());
      const matchFilter = docFilter === "all" || d.status === docFilter;
      return matchSearch && matchFilter;
    });
  }, [docs, docSearch, docFilter]);

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(historySearch.toLowerCase());
      const matchContent = s.messages.some((m) =>
        m.content.toLowerCase().includes(historySearch.toLowerCase())
      );
      return matchTitle || matchContent;
    });
  }, [sessions, historySearch]);

  // Filtered community
  const filteredCommunity = useMemo(() => {
    return communityPosts.filter((p) => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchSearch =
        p.title.toLowerCase().includes(communitySearch.toLowerCase()) ||
        p.description.toLowerCase().includes(communitySearch.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(communitySearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [communityPosts, selectedCategory, communitySearch]);

  const totalBytes = docs.reduce((acc, d) => acc + (d.size_bytes || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const totalPages = docs.reduce((acc, d) => acc + (d.page_count || 0), 0);
  const username = user?.displayName || user?.email?.split("@")[0] || "Scholar";
  const userInitial = username.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen text-foreground pb-32 relative selection:bg-primary/30 selection:text-foreground">
      <SiteHeader />

      <main ref={containerRef} className="max-w-7xl mx-auto space-y-8 py-8 px-4 sm:px-6 lg:px-8">
        
        {/* User Identity Banner Card */}
        <div className="gsap-user relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-card/85 backdrop-blur-2xl border border-border/80 shadow-2xl">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            
            {/* Left Avatar & Info */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-primary/30 via-primary/10 to-white/20 border-2 border-primary/40 flex items-center justify-center text-3xl sm:text-4xl font-black text-primary shadow-2xl overflow-hidden">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="User Avatar"
                      width={96}
                      height={96}
                      unoptimized
                      className="rounded-3xl object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white border-2 border-background shadow-md" title="Active Session">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <CrystalGlow as="h1" fontSize="clamp(1.4rem, 2.5vw, 2rem)" fontWeight={900}>
                    {username}
                  </CrystalGlow>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30 uppercase tracking-wider">
                    Scholar Pro Tier
                  </span>
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-2 font-mono truncate">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span>{user?.email || "student@polaris.edu"}</span>
                </p>

                <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1 flex-wrap font-mono">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary/70" />
                    <span>Member since Fall 2024</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-primary/70" />
                    <span>{totalMB} MB Ingested</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Quick Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/chat")}
                    className="rounded-2xl gap-2 font-bold text-xs border-primary/30 hover:bg-primary/10 text-primary"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Launch RAG Chat</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => signOut()}
                    className="rounded-2xl gap-2 font-bold text-xs shadow-md"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={signInAsDemo}
                    className="rounded-2xl gap-2 font-bold text-xs bg-primary text-primary-foreground shadow-lg"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Demo Mode Sign In</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/login")}
                    className="rounded-2xl gap-2 font-bold text-xs"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Log In</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Telemetry Stat Strip */}
        <div className="gsap-user grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Ingested Files"
            numericValue={docs.length}
            value={docs.length.toString()}
            icon={FileText}
            colorScheme="primary"
            tag="Vectorized"
          />
          <StatCard
            label="Extracted Pages"
            numericValue={totalPages}
            value={totalPages.toString()}
            icon={Layers}
            colorScheme="purple"
            tag="OCR Ready"
          />
          <StatCard
            label="Saved Chat Turns"
            numericValue={sessions.length}
            value={sessions.length.toString()}
            icon={MessageSquare}
            colorScheme="emerald"
            tag="Multi-Turn"
          />
          <StatCard
            label="Community Ready"
            numericValue={communityPosts.length}
            value={communityPosts.length.toString()}
            icon={Users}
            colorScheme="purple"
            tag="Hub Alpha"
          />
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="gsap-user flex items-center gap-2 p-1.5 rounded-2xl bg-card/80 border border-border/80 backdrop-blur-xl shadow-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab("uploads")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === "uploads"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            <span>My Uploads ({docs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat History ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("community")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === "community"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Community Hub</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              NEW
            </span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === "settings"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Preferences & System</span>
          </button>
        </div>

        {/* TAB 1: MY UPLOADS */}
        {activeTab === "uploads" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Direct Upload Dropzone */}
            <UploadCard onUploaded={(d) => setDocs((prev) => [d, ...prev])} />

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card/75 border border-border/80 backdrop-blur-xl">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  placeholder="Search uploaded files..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border/50 text-xs">
                  {(["all", "ocr_complete", "processing", "failed"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDocFilter(mode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        docFilter === mode
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {mode.replace("_", " ")}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDocs}
                  className="h-10 rounded-xl gap-1.5 text-xs font-bold"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${docsLoading ? "animate-spin text-primary" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>

            {/* Document List Cards */}
            {filteredDocs.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-3 bg-card/60 backdrop-blur-xl border-border/80 rounded-3xl">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
                <span className="font-bold text-sm text-foreground">No documents matching your search</span>
                <p className="text-xs text-muted-foreground">Upload course notes or syllabus PDFs above to populate your index.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDocs.map((doc) => {
                  const sizeMb = ((doc.size_bytes || 0) / (1024 * 1024)).toFixed(2);
                  const isReady = doc.status === "ocr_complete";

                  return (
                    <div
                      key={doc.id}
                      className="p-5 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl hover:border-primary/40 transition-all shadow-md flex flex-col justify-between space-y-4 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 group-hover:scale-105 transition-transform">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate" title={doc.filename}>
                              {doc.filename}
                            </h4>
                            <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-2 pt-0.5">
                              <span>{sizeMb} MB</span>
                              <span>•</span>
                              <span>{doc.page_count || 1} pages</span>
                              <span>•</span>
                              <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                            isReady
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : doc.status === "failed"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
                          }`}
                        >
                          {doc.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/chat?q=Summarize%20${encodeURIComponent(doc.filename)}`)}
                            className="h-8 rounded-xl text-xs font-bold gap-1.5 text-primary border-primary/30 hover:bg-primary/10"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Ask in RAG</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReprocessDoc(doc.id)}
                            className="h-8 rounded-xl text-xs text-muted-foreground hover:text-foreground"
                            title="Reprocess OCR"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDoc(doc.id, doc.filename)}
                          className="h-8 rounded-xl text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete Document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHAT HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card/75 border border-border/80 backdrop-blur-xl">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search past questions & citations..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSessions}
                  className="h-10 rounded-xl gap-1.5 text-xs font-bold"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh</span>
                </Button>
                {sessions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                    className="h-10 rounded-xl gap-1.5 text-xs font-bold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear All</span>
                  </Button>
                )}
              </div>
            </div>

            {filteredSessions.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-3 bg-card/60 backdrop-blur-xl border-border/80 rounded-3xl">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                <span className="font-bold text-sm text-foreground">No chat history recorded yet</span>
                <p className="text-xs text-muted-foreground">Ask questions in Grounded RAG Chat to automatically record citations and transcripts.</p>
                <Button
                  size="sm"
                  onClick={() => router.push("/chat")}
                  className="mt-2 rounded-2xl gap-2 font-bold bg-primary text-primary-foreground"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Start New Conversation</span>
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-5 sm:p-6 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-md hover:border-primary/40 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-foreground truncate">{s.title}</h4>
                          <p className="text-[11px] font-mono text-muted-foreground flex items-center gap-2 pt-0.5">
                            <span>{new Date(s.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>{s.messages.length} messages</span>
                            <span>•</span>
                            <span className="text-primary font-bold">{s.citationCount || 0} citations</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyChat(s)}
                          className="h-8 px-2.5 rounded-xl text-xs gap-1"
                          title="Copy Full Q&A"
                        >
                          {copiedId === s.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          <span className="hidden sm:inline">{copiedId === s.id ? "Copied" : "Copy"}</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/chat?session=${s.id}`)}
                          className="h-8 px-3 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-sm"
                        >
                          <span>Resume in Chat</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSession(s.id)}
                          className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete Session"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Preview of latest message */}
                    {s.messages.length > 0 && s.messages[s.messages.length - 1] && (
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground font-sans line-clamp-2">
                        <span className="font-bold text-foreground">
                          {s.messages[s.messages.length - 1]?.role === "user" ? "Q: " : "A: "}
                        </span>
                        {s.messages[s.messages.length - 1]?.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMMUNITY HUB */}
        {activeTab === "community" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Banner & Post Share Button */}
            <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-primary/15 via-purple-500/10 to-transparent border border-primary/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-mono tracking-wider uppercase font-bold">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Polaris Knowledge Exchange</span>
                </div>
                <CrystalGlow as="h2" fontSize="clamp(1.5rem, 2.5vw, 2.2rem)" fontWeight={900}>
                  Community Knowledge Hub
                </CrystalGlow>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Discover peer-reviewed syllabus topologies, vetted lecture notes, and share your own academic indexes with researchers worldwide.
                </p>
              </div>

              <Button
                onClick={() => setShowShareModal(true)}
                className="h-12 px-6 rounded-2xl font-bold text-sm bg-primary text-primary-foreground shadow-xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Share Knowledge Pack</span>
              </Button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card/75 border border-border/80 backdrop-blur-xl">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={communitySearch}
                  onChange={(e) => setCommunitySearch(e.target.value)}
                  placeholder="Search community notes, syllabi, topics..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1">
                {["All", "Computer Science", "Biochemistry", "Mathematics", "Physics"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Community Feed Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommunity.map((post) => {
                const isLiked = likedPosts.has(post.id);

                return (
                  <div
                    key={post.id}
                    className="p-6 rounded-3xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-lg hover:border-primary/40 transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                          {post.category}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">{post.date}</span>
                      </div>

                      <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 font-light">
                        {post.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-muted/60 text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center">
                          {post.author.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground text-xs truncate max-w-[110px]">
                          {post.author}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-1 text-xs font-mono transition-colors ${
                            isLiked ? "text-rose-500 font-bold" : "hover:text-foreground"
                          }`}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>{post.likes}</span>
                        </button>
                        <span className="flex items-center gap-1 text-xs font-mono">
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>{post.comments}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: PREFERENCES & SYSTEM */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Appearance & Themes */}
              <div className="p-6 rounded-3xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Theme & Visual Engine</h3>
                    <p className="text-xs text-muted-foreground">Switch between high-contrast Polaris luxury themes</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Active Palette</span>
                  <ThemeToggle />
                </div>
              </div>

              {/* RAG & Vector Engine Diagnostics */}
              <div className="p-6 rounded-3xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-lg space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">AI & Vector Store Telemetry</h3>
                    <p className="text-xs text-muted-foreground">Connected microservices and inference nodes</p>
                  </div>
                </div>

                <div className="pt-2 space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Vector Database:</span>
                    <span className="text-emerald-400 font-bold">Qdrant Multi-Tenant (Active)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">RAG Inference:</span>
                    <span className="text-primary font-bold">Groq Llama-3.1 70B & NIM</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Auth Provider:</span>
                    <span className="text-foreground font-bold">Supabase / Firebase Multi-Tenant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Share to Community Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-lg w-full rounded-3xl bg-card border border-border/80 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-foreground">Share Knowledge Pack</h2>
              <p className="text-xs text-muted-foreground">
                Publish a study syllabus, course notes collection, or topic topology to the community.
              </p>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Pack Title</label>
                <input
                  type="text"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  placeholder="e.g. CS189 Machine Learning Complete Guide"
                  required
                  className="w-full h-10 px-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Category / Subject</label>
                <select
                  value={newPostCategory}
                  onChange={(e) => setNewPostCategory(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Description & Overview</label>
                <textarea
                  value={newPostDesc}
                  onChange={(e) => setNewPostDesc(e.target.value)}
                  placeholder="Describe the topics covered, textbook citations, and key prerequisites..."
                  rows={3}
                  required
                  className="w-full p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                  placeholder="e.g. AI, Algorithms, ExamPrep"
                  className="w-full h-10 px-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowShareModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl font-bold text-xs bg-primary text-primary-foreground shadow-md"
                >
                  Publish to Community
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-xs font-mono text-muted-foreground">Loading Profile...</div>}>
      <UserProfileContent />
    </Suspense>
  );
}
