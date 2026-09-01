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
  Copy,
  Check,
  Database,
  Cpu,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { PagesViewer } from "@/components/pages-viewer";
import { useGsapEntrance } from "@/lib/use-animation-system";
import { cn } from "@/lib/utils";
import { CommunityFeed } from "@/components/community/community-feed";
import { CommunityOnboardingModal } from "@/components/community/community-onboarding-modal";
import { FriendsDrawer } from "@/components/community/friends-drawer";
import { useCommunityStore } from "@/lib/community-store";

function UserProfileContent() {
  const { user, signOut, signInAsDemo } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"uploads" | "history" | "community" | "settings">("uploads");
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docSearch, setDocSearch] = useState("");
  const [docFilter, setDocFilter] = useState<"all" | "ocr_complete" | "processing" | "failed">("all");
  const [viewingDoc, setViewingDoc] = useState<DocumentResponse | null>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [friendsDrawerOpen, setFriendsDrawerOpen] = useState(false);

  const { posts: communityPosts } = useCommunityStore();
  const containerRef = useGsapEntrance(".gsap-user", 0.04);

  // Load documents
  const loadDocs = async () => {
    setDocsLoading(true);
    try {
      const items = await listDocuments();
      setDocs(items);
    } catch {
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

  const totalBytes = docs.reduce((acc, d) => acc + (d.size_bytes || 0), 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const totalPages = docs.reduce((acc, d) => acc + (d.page_count || 0), 0);
  const username = user?.displayName || user?.email?.split("@")[0] || "Scholar";
  const userInitial = username.charAt(0).toUpperCase();

  return (
    <div className="relative min-h-screen text-foreground pb-32 pt-14 sm:pt-16 overflow-x-hidden selection:bg-primary/30 selection:text-foreground">
      {/* ── Ambient Fluid Liquid Caustic Spheres (iOS/visionOS Glass Glow) ── */}
      <div className="ambient-liquid-glow -top-24 -left-24 w-[500px] h-[500px] bg-indigo-500/20" />
      <div className="ambient-liquid-glow top-[38%] -right-32 w-[550px] h-[550px] bg-purple-500/15" />
      <div className="ambient-liquid-glow bottom-12 left-[20%] w-[600px] h-[600px] bg-emerald-500/12" />

      <SiteHeader />

      <main ref={containerRef} className="relative z-10 max-w-7xl mx-auto space-y-5 py-4 px-3 sm:px-6 lg:px-8">
        
        {/* ── BENTO HERO: Compact Scholar Hologram ID Banner ────────────── */}
        <div className="gsap-user relative overflow-hidden rounded-3xl p-6 sm:p-7 liquid-glass">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            
            {/* Left: Avatar & Identity details */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-primary/30 via-primary/10 to-indigo-500/20 border-2 border-primary/40 flex items-center justify-center text-2xl font-black text-primary shadow-md overflow-hidden">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="User Avatar"
                      width={64}
                      height={64}
                      unoptimized
                      className="rounded-2xl object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white border-2 border-background shadow-xs" title="Verified Active Session">
                  <ShieldCheck className="h-3 w-3" />
                </div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                    {username}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-primary/15 text-primary border border-primary/30 uppercase tracking-wider">
                    Scholar Pro
                  </span>
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono truncate">
                  <Mail className="h-3 w-3 text-primary shrink-0" />
                  <span>{user?.email || "student@polaris.edu"}</span>
                </p>

                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5 flex-wrap font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-primary/70" />
                    <span>Fall 2024</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3 text-primary/70" />
                    <span>{totalMB} MB Ingested</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
              {user ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => router.push("/chat")}
                    className="h-9 px-4 rounded-2xl gap-1.5 font-bold text-xs bg-primary text-primary-foreground shadow-sm hover:scale-102 active:scale-95 transition-all"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Launch RAG</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                    className="h-9 px-3.5 rounded-2xl gap-1.5 font-bold text-xs text-destructive hover:bg-destructive/10 border-white/20 bg-white/5"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={signInAsDemo}
                    className="h-9 px-4 rounded-2xl gap-1.5 font-bold text-xs bg-primary text-primary-foreground shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Demo Mode</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/login")}
                    className="h-9 px-3.5 rounded-2xl gap-1.5 font-bold text-xs"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Log In</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BENTO TELEMETRY STRIP (4 Liquid Glass Cells) ────────── */}
        <div className="gsap-user grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Bento Stat 1 */}
          <div className="p-4 sm:p-5 rounded-3xl liquid-glass flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Ingested Files
              </span>
              <div className="p-2 rounded-2xl bg-primary/10 text-primary border border-primary/20 bento-icon-bounce">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black text-foreground font-mono">
                {docs.length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totalMB} MB Storage
              </p>
            </div>
          </div>

          {/* Bento Stat 2 */}
          <div className="p-4 sm:p-5 rounded-3xl liquid-glass flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Pages Indexed
              </span>
              <div className="p-2 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 bento-icon-bounce">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black text-foreground font-mono">
                {totalPages}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                OCRv2 Vector Chunks
              </p>
            </div>
          </div>

          {/* Bento Stat 3 */}
          <div className="p-4 sm:p-5 rounded-3xl liquid-glass flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Chat Turns
              </span>
              <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 bento-icon-bounce">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black text-foreground font-mono">
                {sessions.length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Grounded Sessions
              </p>
            </div>
          </div>

          {/* Bento Stat 4 */}
          <div className="p-4 sm:p-5 rounded-3xl liquid-glass flex flex-col justify-between group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                Community Hub
              </span>
              <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 bento-icon-bounce">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black text-foreground font-mono">
                {communityPosts.length}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Knowledge Packs Shared
              </p>
            </div>
          </div>
        </div>

        {/* ── TAB NAVIGATION PILL BAR ──────────────────────────────────── */}
        <div className="gsap-user flex items-center gap-1.5 p-1 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab("uploads")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
              activeTab === "uploads"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>My Uploads ({docs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
              activeTab === "history"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat History ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("community")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
              activeTab === "community"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Community Hub</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
              NEW
            </span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap",
              activeTab === "settings"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Preferences & System</span>
          </button>
        </div>

        {/* ── TAB 1: MY UPLOADS ────────────────────────────────────────── */}
        {activeTab === "uploads" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Direct Upload Dropzone */}
            <UploadCard onUploaded={(d) => setDocs((prev) => [d, ...prev])} />

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  placeholder="Search uploaded files..."
                  className="w-full h-8.5 pl-9 pr-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-muted/40 border border-border/50 text-[11px]">
                  {(["all", "ocr_complete", "processing", "failed"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDocFilter(mode)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-bold capitalize transition-all",
                        docFilter === mode
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {mode === "ocr_complete" ? "Ready" : mode}
                    </button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDocs}
                  className="h-8 rounded-xl gap-1 text-xs font-bold"
                >
                  <RefreshCw className={cn("h-3 w-3", docsLoading ? "animate-spin text-primary" : "")} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {/* Document List Bento Grid */}
            {filteredDocs.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-2.5 bg-card/60 backdrop-blur-xl border-border/80 rounded-2xl">
                <FileText className="h-7 w-7 text-muted-foreground/40" />
                <span className="font-bold text-sm text-foreground">No documents found</span>
                <p className="text-xs text-muted-foreground">Upload course notes or syllabus PDFs above to populate your vector index.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredDocs.map((doc) => {
                  const sizeMb = ((doc.size_bytes || 0) / (1024 * 1024)).toFixed(2);
                  const isReady = doc.status === "ocr_complete";

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl bento-card shadow-xs flex flex-col justify-between space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 bento-icon-bounce">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-foreground truncate" title={doc.filename}>
                              {doc.filename}
                            </h4>
                            <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 pt-0.5">
                              <span>{sizeMb} MB</span>
                              <span>•</span>
                              <span>{doc.page_count || 1} pg</span>
                            </p>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider shrink-0",
                            isReady
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : doc.status === "failed"
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse"
                          )}
                        >
                          {doc.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/chat?q=Summarize%20${encodeURIComponent(doc.filename)}`)}
                            className="h-7 px-2.5 rounded-lg text-[11px] font-bold gap-1 text-primary border-primary/30 hover:bg-primary/10"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Ask RAG</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingDoc(doc)}
                            className="h-7 px-2 rounded-lg text-[11px] text-muted-foreground hover:text-foreground"
                            title="Inspect OCR text"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReprocessDoc(doc.id)}
                            className="h-7 px-2 rounded-lg text-[11px] text-muted-foreground hover:text-foreground"
                            title="Reprocess OCR"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDoc(doc.id, doc.filename)}
                          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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

        {/* ── TAB 2: CHAT HISTORY ──────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search past questions & citations..."
                  className="w-full h-8.5 pl-9 pr-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSessions}
                  className="h-8 rounded-xl gap-1 text-xs font-bold"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Refresh</span>
                </Button>
                {sessions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                    className="h-8 rounded-xl gap-1 text-xs font-bold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All</span>
                  </Button>
                )}
              </div>
            </div>

            {filteredSessions.length === 0 ? (
              <Card className="p-10 text-center text-muted-foreground text-xs flex flex-col items-center justify-center gap-2.5 bg-card/60 backdrop-blur-xl border-border/80 rounded-2xl">
                <MessageSquare className="h-7 w-7 text-muted-foreground/40" />
                <span className="font-bold text-sm text-foreground">No chat history recorded yet</span>
                <p className="text-xs text-muted-foreground">Ask questions in Grounded RAG Chat to automatically record citations and transcripts.</p>
                <Button
                  size="sm"
                  onClick={() => router.push("/chat")}
                  className="mt-1 rounded-xl gap-1.5 font-bold text-xs bg-primary text-primary-foreground"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Start New Conversation</span>
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-xs bento-card space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate">{s.title}</h4>
                          <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-2 pt-0.5">
                            <span>{new Date(s.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>{s.messages.length} messages</span>
                            <span>•</span>
                            <span className="text-primary font-bold">{s.citationCount || 0} citations</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyChat(s)}
                          className="h-7 px-2.5 rounded-lg text-[11px] gap-1"
                          title="Copy Full Q&A"
                        >
                          {copiedId === s.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedId === s.id ? "Copied" : "Copy"}</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/chat?session=${s.id}`)}
                          className="h-7 px-3 rounded-lg text-[11px] font-bold gap-1 bg-primary text-primary-foreground shadow-xs"
                        >
                          <span>Resume</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSession(s.id)}
                          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete Session"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Preview of latest message */}
                    {s.messages.length > 0 && s.messages[s.messages.length - 1] && (
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground font-sans line-clamp-2">
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

        {/* ── TAB 3: COMMUNITY HUB ──────────────────────────────────────── */}
        {activeTab === "community" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <CommunityFeed
              onOpenIdentityModal={() => setOnboardingModalOpen(true)}
              onOpenFriendsDrawer={() => setFriendsDrawerOpen(true)}
            />
          </div>
        )}

        {/* ── TAB 4: PREFERENCES & SYSTEM ──────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Appearance & Themes */}
              <div className="p-5 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-xs bento-card space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Theme & Visual Engine</h3>
                    <p className="text-[11px] text-muted-foreground">Switch between high-contrast Dark and Light Lumina themes</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Active Palette Switcher</span>
                  <ThemeToggle />
                </div>
              </div>

              {/* RAG & Vector Engine Diagnostics */}
              <div className="p-5 rounded-2xl bg-card/85 border border-border/80 backdrop-blur-xl shadow-xs bento-card space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">AI & Vector Store Telemetry</h3>
                    <p className="text-[11px] text-muted-foreground">Connected microservices and vector nodes</p>
                  </div>
                </div>

                <div className="pt-2 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Vector DB:</span>
                    <span className="text-emerald-500 font-bold">Qdrant Active (1536-dim)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">RAG Inference:</span>
                    <span className="text-primary font-bold">Groq Llama-3.1 70B & NIM</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40">
                    <span className="text-muted-foreground">Auth Provider:</span>
                    <span className="text-foreground font-bold">Firebase Multi-Tenant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Community Modals */}
      <CommunityOnboardingModal
        open={onboardingModalOpen}
        onOpenChange={setOnboardingModalOpen}
      />

      <FriendsDrawer
        open={friendsDrawerOpen}
        onOpenChange={setFriendsDrawerOpen}
      />

      {/* Pages OCR Viewer Modal */}
      <PagesViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />
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
