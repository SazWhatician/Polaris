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

  const [activeTab, setActiveTab] = useState<"uploads" | "history" | "community" | "settings">(
    "uploads",
  );
  const [docs, setDocs] = useState<DocumentResponse[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docSearch, setDocSearch] = useState("");
  const [docFilter, setDocFilter] = useState<"all" | "ocr_complete" | "processing" | "failed">(
    "all",
  );
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
    router.prefetch("/chat");
    if (user) {
      loadDocs();
      loadSessions();
    }
  }, [user, router]);

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
        m.content.toLowerCase().includes(historySearch.toLowerCase()),
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
    <div className="relative min-h-screen overflow-x-hidden pb-32 pt-14 text-foreground selection:bg-primary/30 selection:text-foreground sm:pt-16">
      {/* ── Ambient Fluid Liquid Caustic Spheres (iOS/visionOS Glass Glow) ── */}
      <div className="ambient-liquid-glow -left-24 -top-24 h-[500px] w-[500px] bg-indigo-500/20" />
      <div className="ambient-liquid-glow -right-32 top-[38%] h-[550px] w-[550px] bg-purple-500/15" />
      <div className="ambient-liquid-glow bg-emerald-500/12 bottom-12 left-[20%] h-[600px] w-[600px]" />

      <SiteHeader />

      <main
        ref={containerRef}
        className="relative z-10 mx-auto max-w-7xl space-y-5 px-3 py-4 sm:px-6 lg:px-8"
      >
        {/* ── BENTO HERO: Compact Scholar Hologram ID Banner ────────────── */}
        <div className="gsap-user liquid-glass relative overflow-hidden rounded-3xl p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Avatar & Identity details */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border-2 border-primary/40 bg-gradient-to-tr from-primary/30 via-primary/10 to-indigo-500/20 text-2xl font-black text-primary shadow-md sm:h-16 sm:w-16">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="User Avatar"
                      width={64}
                      height={64}
                      unoptimized
                      className="h-full w-full rounded-2xl object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div
                  className="shadow-xs absolute -bottom-1 -right-1 rounded-full border-2 border-background bg-emerald-500 p-1 text-white"
                  title="Verified Active Session"
                >
                  <ShieldCheck className="h-3 w-3" />
                </div>
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-foreground sm:text-xl">
                    {username}
                  </h1>
                  <span className="rounded-full border border-primary/30 bg-primary/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary">
                    Scholar Pro
                  </span>
                </div>

                <p className="flex items-center gap-1.5 truncate font-mono text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0 text-primary" />
                  <span>{user?.email || "student@polaris.edu"}</span>
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-0.5 font-mono text-[10px] text-muted-foreground">
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
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
              {user ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => router.push("/chat")}
                    className="hover:scale-102 h-9 gap-1.5 rounded-2xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition-all active:scale-95"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Launch RAG</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut()}
                    className="h-9 gap-1.5 rounded-2xl border-white/20 bg-white/5 px-3.5 text-xs font-bold text-destructive hover:bg-destructive/10"
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
                    className="h-9 gap-1.5 rounded-2xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Demo Mode</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/login")}
                    className="h-9 gap-1.5 rounded-2xl px-3.5 text-xs font-bold"
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
        <div className="gsap-user grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {/* Bento Stat 1 */}
          <div className="liquid-glass group flex flex-col justify-between rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Ingested Files
              </span>
              <div className="bento-icon-bounce rounded-2xl border border-primary/20 bg-primary/10 p-2 text-primary">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="font-mono text-xl font-black text-foreground sm:text-2xl">
                {docs.length}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{totalMB} MB Storage</p>
            </div>
          </div>

          {/* Bento Stat 2 */}
          <div className="liquid-glass group flex flex-col justify-between rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Pages Indexed
              </span>
              <div className="bento-icon-bounce rounded-2xl border border-purple-500/20 bg-purple-500/10 p-2 text-purple-500">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="font-mono text-xl font-black text-foreground sm:text-2xl">
                {totalPages}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">OCRv2 Vector Chunks</p>
            </div>
          </div>

          {/* Bento Stat 3 */}
          <div className="liquid-glass group flex flex-col justify-between rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Chat Turns
              </span>
              <div className="bento-icon-bounce rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-500">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="font-mono text-xl font-black text-foreground sm:text-2xl">
                {sessions.length}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Grounded Sessions</p>
            </div>
          </div>

          {/* Bento Stat 4 */}
          <div className="liquid-glass group flex flex-col justify-between rounded-3xl p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Community Hub
              </span>
              <div className="bento-icon-bounce rounded-2xl border border-amber-500/20 bg-amber-500/10 p-2 text-amber-500">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div
                className="font-mono text-xl font-black text-foreground sm:text-2xl"
                suppressHydrationWarning
              >
                {communityPosts.length}
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Knowledge Packs Shared</p>
            </div>
          </div>
        </div>

        {/* ── TAB NAVIGATION PILL BAR ──────────────────────────────────── */}
        <div className="gsap-user shadow-xs flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-border/80 bg-card/85 p-1 backdrop-blur-xl">
          <button
            onClick={() => setActiveTab("uploads")}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
              activeTab === "uploads"
                ? "shadow-xs bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>My Uploads ({docs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
              activeTab === "history"
                ? "shadow-xs bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat History ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("community")}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
              activeTab === "community"
                ? "shadow-xs bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Community Hub</span>
            <span className="py-0.2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-1.5 font-mono text-[9px] text-emerald-500">
              NEW
            </span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
              activeTab === "settings"
                ? "shadow-xs bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Preferences & System</span>
          </button>
        </div>

        {/* ── TAB 1: MY UPLOADS ────────────────────────────────────────── */}
        {activeTab === "uploads" && (
          <div className="space-y-4 duration-200 animate-in fade-in">
            {/* Direct Upload Dropzone */}
            <UploadCard onUploaded={(d) => setDocs((prev) => [d, ...prev])} />

            {/* Filter & Search Bar */}
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/85 p-3.5 backdrop-blur-xl sm:flex-row">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  placeholder="Search uploaded files..."
                  className="h-8.5 shadow-xs w-full rounded-xl border border-border/60 bg-muted/40 pl-9 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                <div className="flex items-center gap-0.5 rounded-xl border border-border/50 bg-muted/40 p-0.5 text-[11px]">
                  {(["all", "ocr_complete", "processing", "failed"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setDocFilter(mode)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 font-bold capitalize transition-all",
                        docFilter === mode
                          ? "shadow-xs bg-background text-foreground"
                          : "text-muted-foreground hover:text-foreground",
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
                  className="h-8 gap-1 rounded-xl text-xs font-bold"
                >
                  <RefreshCw
                    className={cn("h-3 w-3", docsLoading ? "animate-spin text-primary" : "")}
                  />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {/* Document List Bento Grid */}
            {filteredDocs.length === 0 ? (
              <Card className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border-border/80 bg-card/60 p-10 text-center text-xs text-muted-foreground backdrop-blur-xl">
                <FileText className="h-7 w-7 text-muted-foreground/40" />
                <span className="text-sm font-bold text-foreground">No documents found</span>
                <p className="text-xs text-muted-foreground">
                  Upload course notes or syllabus PDFs above to populate your vector index.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocs.map((doc) => {
                  const sizeMb = ((doc.size_bytes || 0) / (1024 * 1024)).toFixed(2);
                  const isReady = doc.status === "ocr_complete" || doc.status === "indexed";

                  return (
                    <div
                      key={doc.id}
                      className="bento-card shadow-xs group flex flex-col justify-between space-y-3 rounded-2xl border border-border/80 bg-card/85 p-4 backdrop-blur-xl"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="bento-icon-bounce shrink-0 rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h4
                              className="truncate text-xs font-bold text-foreground"
                              title={doc.filename}
                            >
                              {doc.filename}
                            </h4>
                            <p className="flex items-center gap-1.5 pt-0.5 font-mono text-[10px] text-muted-foreground">
                              <span>{sizeMb} MB</span>
                              <span>•</span>
                              <span>{doc.page_count || 1} pg</span>
                            </p>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "shrink-0 rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
                            isReady
                              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                              : doc.status === "failed"
                                ? "border border-rose-500/20 bg-rose-500/10 text-rose-500"
                                : "animate-pulse border border-amber-500/20 bg-amber-500/10 text-amber-500",
                          )}
                        >
                          {doc.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 border-t border-border/40 pt-2">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/chat?q=Summarize%20${encodeURIComponent(doc.filename)}`)
                            }
                            className="h-7 gap-1 rounded-lg border-primary/30 px-2.5 text-[11px] font-bold text-primary hover:bg-primary/10"
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span>Ask RAG</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingDoc(doc)}
                            className="h-7 rounded-lg px-2 text-[11px] text-muted-foreground hover:text-foreground"
                            title="Inspect OCR text"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReprocessDoc(doc.id)}
                            className="h-7 rounded-lg px-2 text-[11px] text-muted-foreground hover:text-foreground"
                            title="Reprocess OCR"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDoc(doc.id, doc.filename)}
                          className="h-7 w-7 rounded-lg p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
          <div className="space-y-4 duration-200 animate-in fade-in">
            {/* Search & Actions Bar */}
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/85 p-3.5 backdrop-blur-xl sm:flex-row">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search past questions & citations..."
                  className="h-8.5 shadow-xs w-full rounded-xl border border-border/60 bg-muted/40 pl-9 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSessions}
                  className="h-8 gap-1 rounded-xl text-xs font-bold"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Refresh</span>
                </Button>
                {sessions.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                    className="h-8 gap-1 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear All</span>
                  </Button>
                )}
              </div>
            </div>

            {filteredSessions.length === 0 ? (
              <Card className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border-border/80 bg-card/60 p-10 text-center text-xs text-muted-foreground backdrop-blur-xl">
                <MessageSquare className="h-7 w-7 text-muted-foreground/40" />
                <span className="text-sm font-bold text-foreground">
                  No chat history recorded yet
                </span>
                <p className="text-xs text-muted-foreground">
                  Ask questions in Grounded RAG Chat to automatically record citations and
                  transcripts.
                </p>
                <Button
                  size="sm"
                  onClick={() => router.push("/chat")}
                  className="mt-1 gap-1.5 rounded-xl bg-primary text-xs font-bold text-primary-foreground"
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
                    className="shadow-xs bento-card space-y-2.5 rounded-2xl border border-border/80 bg-card/85 p-4 backdrop-blur-xl"
                  >
                    <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-bold text-foreground">{s.title}</h4>
                          <p className="flex items-center gap-2 pt-0.5 font-mono text-[10px] text-muted-foreground">
                            <span>{new Date(s.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>{s.messages.length} messages</span>
                            <span>•</span>
                            <span className="font-bold text-primary">
                              {s.citationCount || 0} citations
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyChat(s)}
                          className="h-7 gap-1 rounded-lg px-2.5 text-[11px]"
                          title="Copy Full Q&A"
                        >
                          {copiedId === s.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedId === s.id ? "Copied" : "Copy"}</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/chat?session=${s.id}`)}
                          className="shadow-xs h-7 gap-1 rounded-lg bg-primary px-3 text-[11px] font-bold text-primary-foreground"
                        >
                          <span>Resume</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSession(s.id)}
                          className="h-7 w-7 rounded-lg p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Delete Session"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Preview of latest message */}
                    {s.messages.length > 0 && s.messages[s.messages.length - 1] && (
                      <div className="line-clamp-2 rounded-xl border border-border/40 bg-muted/40 p-2.5 font-sans text-[11px] text-muted-foreground">
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
          <div className="space-y-4 duration-200 animate-in fade-in">
            <CommunityFeed
              onOpenIdentityModal={() => setOnboardingModalOpen(true)}
              onOpenFriendsDrawer={() => setFriendsDrawerOpen(true)}
            />
          </div>
        )}

        {/* ── TAB 4: PREFERENCES & SYSTEM ──────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="space-y-4 duration-200 animate-in fade-in">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Appearance & Themes */}
              <div className="shadow-xs bento-card space-y-3 rounded-2xl border border-border/80 bg-card/85 p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Theme & Visual Engine</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Switch between high-contrast Dark and Light Lumina themes
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-2">
                  <span className="text-xs font-bold text-foreground">Active Palette Switcher</span>
                  <ThemeToggle />
                </div>
              </div>

              {/* RAG & Vector Engine Diagnostics */}
              <div className="shadow-xs bento-card space-y-3 rounded-2xl border border-border/80 bg-card/85 p-5 backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-500">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      AI & Vector Store Telemetry
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Connected microservices and vector nodes
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 font-mono text-xs">
                  <div className="flex items-center justify-between rounded-xl bg-muted/40 p-2">
                    <span className="text-muted-foreground">Vector DB:</span>
                    <span className="font-bold text-emerald-500">Qdrant Active (1536-dim)</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/40 p-2">
                    <span className="text-muted-foreground">RAG Inference:</span>
                    <span className="font-bold text-primary">Groq Llama-3.1 70B & NIM</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/40 p-2">
                    <span className="text-muted-foreground">Auth Provider:</span>
                    <span className="font-bold text-foreground">Firebase Multi-Tenant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Community Modals */}
      <CommunityOnboardingModal open={onboardingModalOpen} onOpenChange={setOnboardingModalOpen} />

      <FriendsDrawer open={friendsDrawerOpen} onOpenChange={setFriendsDrawerOpen} />

      {/* Pages OCR Viewer Modal */}
      <PagesViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />
    </div>
  );
}

export default function UserPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background font-mono text-xs text-muted-foreground">
          Loading Profile...
        </div>
      }
    >
      <UserProfileContent />
    </Suspense>
  );
}
