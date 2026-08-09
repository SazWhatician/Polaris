"use client";

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Square, Bot, User, Copy, Check, Settings2, Sparkles, RefreshCw, Mic } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { useAuth } from "@/lib/auth-context";
import { streamChat, type Citation } from "@/lib/api/chat";
import { useGsapEntrance } from "@/lib/use-gsap-animations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeroWave } from "@/components/ui/ai-input-hero";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: string;
}

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [selectedModel, setSelectedModel] = useState("groq-llama3-70b");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useGsapEntrance(".chat-msg-reveal", 0.05);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendQuestion = async (question: string) => {
    const q = question.trim();
    if (!q || streaming) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = { id: cryptoId(), role: "user", content: q, timestamp: timeStr };
    const assistantMsg: Message = { id: cryptoId(), role: "assistant", content: "", timestamp: timeStr };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(q, {
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === "citations") {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantMsg.id ? { ...msg, citations: event.citations } : msg
              )
            );
          } else if (event.type === "token") {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantMsg.id
                  ? { ...msg, content: msg.content + event.content }
                  : msg
              )
            );
          }
        },
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Chat streaming failed", {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    await sendQuestion(input);
  };

  const cancel = () => abortRef.current?.abort();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen text-foreground flex flex-col relative overflow-x-hidden">
      <SiteHeader />

      {/* Unified Shader Screen Wrapper - stays mounted during whole chat */}
      <div className="flex-1 relative w-full flex flex-col">
        <HeroWave
          hideNavbar
          title="Ask Polaris Grounded RAG."
          subtitle="Ask questions cited directly from your uploaded course notes & syllabus"
          placeholder="Describe what you want to ask Polaris..."
          buttonText="Ask Assistant"
          onPromptSubmit={(val) => sendQuestion(val)}
        >
          {messages.length > 0 && (
            <div className="w-full h-full max-w-5xl mx-auto flex flex-col justify-between p-4 sm:p-6 z-10">
              
              {/* Top Settings Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-lg text-xs font-medium text-slate-900 dark:text-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                    <Settings2 className="h-3.5 w-3.5 text-primary" /> Model:
                  </span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 text-xs rounded-md text-slate-900 dark:text-slate-100 focus:outline-none font-medium border border-slate-300 dark:border-zinc-700"
                  >
                    <option value="groq-llama3-70b">Groq Llama-3.1 70B (Fast Free)</option>
                    <option value="nvidia-nim-embed">NVIDIA NIM Grounded</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 bg-emerald-500/10">
                    Qdrant RAG Active
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessages([])}
                    className="h-7 text-[11px] gap-1 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>New Chat</span>
                  </Button>
                </div>
              </div>

              {/* Glassmorphism Chat Stream Container */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-4 my-4 p-4 rounded-2xl bg-white/75 dark:bg-zinc-950/75 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-2xl max-h-[62vh]"
              >
                {messages.map((msg) => (
                  <Card
                    key={msg.id}
                    className={`chat-msg-reveal flex gap-3.5 p-4 transition-all shadow-md ${
                      msg.role === "user"
                        ? "ml-8 sm:ml-16 bg-primary/15 border-primary/30 text-slate-900 dark:text-slate-100 font-medium"
                        : "mr-8 sm:mr-16 bg-white/90 dark:bg-zinc-900/90 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-sm ${
                        msg.role === "user" ? "bg-primary" : "bg-purple-600"
                      }`}
                    >
                      {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    <div className="flex-1 space-y-2 text-xs sm:text-sm leading-relaxed">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-zinc-800 pb-1 font-semibold">
                        <span>{msg.role === "user" ? "You" : "Polaris RAG AI"}</span>
                        <div className="flex items-center gap-2">
                          <span>{msg.timestamp}</span>
                          {msg.role === "assistant" && (
                            <button
                              onClick={() => handleCopy(msg.content, msg.id)}
                              className="hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="whitespace-pre-wrap text-slate-900 dark:text-slate-100 font-normal">
                        {msg.content || (streaming && (
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-xs">
                            <Sparkles className="h-3.5 w-3.5 text-primary animate-spin" />
                            <span>Retrieving cited answer...</span>
                          </div>
                        ))}
                      </div>

                      {/* Citations List */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1">
                          <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Citations & References:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((c, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-primary/10 text-primary font-mono border border-primary/20"
                              >
                                [{c.document_id || "Doc"} Pg.{c.page_number}]
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Bottom Input Box - Hugging the Base with High-Contrast Glassmorphism */}
              <div className="w-full pb-2">
                <form
                  onSubmit={submit}
                  className="relative flex items-center gap-2 p-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-slate-300 dark:border-white/15 shadow-2xl backdrop-blur-xl focus-within:ring-2 focus-within:ring-primary/50"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="Ask Polaris RAG a question..."
                    disabled={streaming}
                    rows={2}
                    className="flex-1 bg-transparent border-none outline-none resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm px-3 py-2"
                  />
                  <div className="flex items-center gap-2 pr-2">
                    <button
                      type="button"
                      onClick={() => setMicActive(!micActive)}
                      className={`p-2 rounded-xl border transition-colors ${
                        micActive
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                          : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border-transparent"
                      }`}
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                    {streaming ? (
                      <Button type="button" onClick={cancel} size="sm" variant="destructive" className="h-9 px-3 gap-1">
                        <Square className="h-3.5 w-3.5" />
                        <span>Stop</span>
                      </Button>
                    ) : (
                      <Button type="submit" disabled={!input.trim()} size="sm" className="h-9 px-4 gap-1 font-bold">
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
