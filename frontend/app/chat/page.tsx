"use client";

import { useState, useRef, useEffect, Suspense, type FormEvent, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Square, Settings2, Sparkles, RefreshCw, Mic } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/lib/auth-context";
import { streamChat, type Citation } from "@/lib/api/chat";
import { useGsapEntrance } from "@/lib/use-animation-system";
import { Button } from "@/components/ui/button";
import { HeroWave } from "@/components/ui/ai-input-hero";
import { ChatMessage } from "@/components/chat-message";

import { getStoredChatSessions, saveChatSession, type ChatSession } from "@/lib/chat-history-store";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: string;
}

function ChatContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sessionId, setSessionId] = useState<string>(() => cryptoId());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [selectedModel, setSelectedModel] = useState("groq-llama3-70b");

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialQueryExecuted = useRef(false);
  const sessionLoaded = useRef(false);
  useGsapEntrance(".chat-msg-reveal", 0.05);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Load session from ?session= param if provided
  useEffect(() => {
    const sParam = searchParams.get("session");
    if (sParam && !sessionLoaded.current) {
      sessionLoaded.current = true;
      const sessions = getStoredChatSessions();
      const match = sessions.find((s) => s.id === sParam);
      if (match) {
        setSessionId(match.id);
        setMessages(match.messages);
        if (match.model) {
          setSelectedModel(match.model.includes("Groq") ? "groq-llama3-70b" : "nvidia-nim-embed");
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam && !initialQueryExecuted.current && !streaming) {
      initialQueryExecuted.current = true;
      sendQuestion(qParam);
    }
  }, [searchParams, streaming]);

  const sendQuestion = async (question: string) => {
    const q = question.trim();
    if (!q || streaming) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = { id: cryptoId(), role: "user", content: q, timestamp: timeStr };
    const assistantMsg: Message = {
      id: cryptoId(),
      role: "assistant",
      content: "",
      timestamp: timeStr,
    };

    const updatedMsgs = [...messages, userMsg, assistantMsg];
    setMessages(updatedMsgs);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulatedCitations: Citation[] = [];
    let accumulatedContent = "";

    try {
      await streamChat(q, {
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === "citations") {
            accumulatedCitations = event.citations;
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantMsg.id ? { ...msg, citations: event.citations } : msg,
              ),
            );
          } else if (event.type === "token") {
            accumulatedContent += event.content;
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantMsg.id ? { ...msg, content: msg.content + event.content } : msg,
              ),
            );
          }
        },
      });

      // Save complete conversation turn to persistent chat history
      const finalAssistantMsg: Message = {
        ...assistantMsg,
        content: accumulatedContent,
        citations: accumulatedCitations,
      };
      const finalMsgs = [...messages, userMsg, finalAssistantMsg];

      const currentSession: ChatSession = {
        id: sessionId,
        userId: user?.uid,
        title: q.slice(0, 50) + (q.length > 50 ? "..." : ""),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: finalMsgs,
        model: selectedModel === "groq-llama3-70b" ? "Groq Llama-3.1 70B" : "NVIDIA NIM Grounded",
        citationCount: finalMsgs.reduce((acc, m) => acc + (m.citations?.length || 0), 0),
      };
      saveChatSession(currentSession);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const errorDesc = err instanceof Error ? err.message : String(err);
        toast.error("Chat streaming failed", {
          description: errorDesc,
        });
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantMsg.id && !msg.content
              ? {
                  ...msg,
                  content:
                    "⚠️ Unable to complete RAG response. Please verify the backend connection and try again.",
                }
              : msg,
          ),
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleNewChat = () => {
    setSessionId(cryptoId());
    setMessages([]);
    router.replace("/chat");
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    await sendQuestion(input);
  };

  const cancel = () => abortRef.current?.abort();

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  if (loading || !user) return null;

  return (
    <div className="relative flex h-screen max-h-screen w-full flex-col overflow-hidden text-foreground">
      <SiteHeader />

      {/* Unified Fullscreen Shader Screen Wrapper */}
      <div className="relative flex h-full min-h-0 w-full flex-1 flex-col">
        <HeroWave
          hideNavbar
          title="Ask Polaris Grounded RAG."
          subtitle="Ask questions cited directly from your uploaded course notes & syllabus"
          placeholder="Describe what you want to ask Polaris..."
          buttonText="Ask Assistant"
          onPromptSubmit={(val) => sendQuestion(val)}
        >
          {messages.length > 0 && (
            <div className="sm:pt-18 z-10 mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col justify-between px-2 pb-2 pt-16 sm:px-4 sm:pb-3">
              {/* Top Settings Bar */}
              <div className="flex shrink-0 items-center justify-between rounded-2xl border border-border/80 bg-white/85 p-2.5 text-xs font-medium text-foreground shadow-md backdrop-blur-xl dark:bg-zinc-900/85 sm:p-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                    <Settings2 className="h-3.5 w-3.5 text-primary" /> Model:
                  </span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="rounded-xl border border-border/60 bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none"
                  >
                    <option value="groq-llama3-70b">Groq Llama-3.1 70B (Fast Free)</option>
                    <option value="nvidia-nim-embed">NVIDIA NIM Grounded</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Qdrant Active
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewChat}
                    className="h-7 gap-1 rounded-xl border-border/80 text-[11px] text-foreground hover:bg-muted/80"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>New Chat</span>
                  </Button>
                </div>
              </div>

              {/* Glassmorphism Full-Screen Chat Stream Container */}
              <div
                ref={scrollRef}
                className="my-2.5 min-h-0 flex-1 space-y-2.5 overflow-y-auto rounded-2xl border border-border/80 bg-card/80 p-3 shadow-xl backdrop-blur-xl sm:p-5"
              >
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={msg.id || idx}
                    role={msg.role}
                    content={msg.content}
                    citations={msg.citations}
                    streaming={streaming && idx === messages.length - 1 && msg.role === "assistant"}
                    timestamp={msg.timestamp}
                    modelName={
                      selectedModel === "groq-llama3-70b"
                        ? "Groq Llama-3.1 70B"
                        : "NVIDIA NIM Grounded"
                    }
                  />
                ))}
              </div>

              {/* Bottom Input Box - Base Pinned with Sleek Glassmorphism */}
              <div className="w-full shrink-0 pb-1 sm:pb-2">
                <form
                  onSubmit={submit}
                  className="relative flex items-center gap-2 rounded-2xl border border-border/80 bg-card/90 p-2 shadow-2xl backdrop-blur-2xl focus-within:ring-2 focus-within:ring-primary/40"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="Ask Polaris RAG a question..."
                    disabled={streaming}
                    data-agent-target="chat-input"
                    rows={2}
                    className="flex-1 resize-none border-none bg-transparent px-3 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
                  />
                  <div className="flex items-center gap-1.5 pr-2">
                    <button
                      type="button"
                      onClick={() => setMicActive(!micActive)}
                      className={`rounded-xl border p-2 transition-colors ${
                        micActive
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                    {streaming ? (
                      <Button
                        type="button"
                        onClick={cancel}
                        size="sm"
                        variant="destructive"
                        className="h-9 gap-1 rounded-xl px-3"
                      >
                        <Square className="h-3.5 w-3.5" />
                        <span>Stop</span>
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={!input.trim()}
                        data-agent-target="chat-send-btn"
                        size="sm"
                        className="h-9 gap-1.5 rounded-xl px-4 font-bold shadow-md"
                      >
                        <span>Send</span>
                        <Sparkles className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
        </HeroWave>
      </div>
    </div>
  );
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background font-mono text-xs text-muted-foreground">
          Loading RAG Chat...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
