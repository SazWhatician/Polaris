"use client";

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Send, Square, Bot, User, Sparkles, Terminal, Copy, Check, Mic, MicOff, Settings2, FileText, ChevronRight, CornerDownLeft } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { streamChat, type Citation } from "@/lib/api/chat";
import { useGsapEntrance } from "@/lib/use-gsap-animations";

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
  const chatContainerRef = useGsapEntrance(".chat-msg-reveal", 0.05);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || streaming) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = { id: cryptoId(), role: "user", content: question, timestamp: timeStr };
    const assistantMsg: Message = { id: cryptoId(), role: "assistant", content: "", timestamp: timeStr };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(question, {
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
      void submit();
    }
  };

  if (loading || !user) return null;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
      <SiteHeader />

      {/* Main Brutalist Chat Workspace */}
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 overflow-hidden">
        
        {/* Telemetry Header */}
        <div className="flex items-center justify-between border-b-2 border-indigo-500/40 pb-3 mb-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-400" />
              <span>TERMINAL_AI_CHAT</span>
            </span>
            <span className="brutal-badge text-[10px]">
              [MODE: GROUNDED_RAG]
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-black/60 border border-slate-700 px-2 py-1">
              <Settings2 className="h-3.5 w-3.5 text-purple-400" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent text-[11px] font-mono text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="groq-llama3-70b">Groq Llama-3-70B</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="litert-on-device">LiteRT.js On-Device</option>
              </select>
            </div>
          </div>
        </div>

        {/* Message Log Container */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 space-y-4 font-mono">
          <div ref={chatContainerRef} className="space-y-4">
            {messages.length === 0 && (
              <div className="brutal-card p-8 bg-black/80 text-center space-y-4 my-6">
                <div className="h-12 w-12 border-2 border-indigo-500 bg-indigo-500/10 flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_#a855f7]">
                  <Bot className="h-6 w-6 text-indigo-300" />
                </div>
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-100">
                  Grounded RAG Intelligence Assistant
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Query your uploaded notes & syllabus PDFs. Answers are synthesized using payload-filtered vector search with page-level citations.
                </p>

                {/* Suggested Prompt Chips */}
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <PromptChip
                    text="What are the main topics in my course syllabus?"
                    onClick={(t) => { setInput(t); }}
                  />
                  <PromptChip
                    text="Explain Binary Trees & AVL rotation algorithm."
                    onClick={(t) => { setInput(t); }}
                  />
                  <PromptChip
                    text="Which concepts have low coverage scores?"
                    onClick={(t) => { setInput(t); }}
                  />
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`chat-msg-reveal brutal-card p-4 space-y-3 ${
                  m.role === "user"
                    ? "bg-slate-900/90 border-indigo-500/60 shadow-[3px_3px_0px_0px_#6366f1]"
                    : "bg-black/90 border-purple-500/60 shadow-[3px_3px_0px_0px_#a855f7]"
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs font-mono">
                  <div className="flex items-center gap-2 font-bold">
                    {m.role === "user" ? (
                      <>
                        <User className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="text-indigo-300">USER</span>
                      </>
                    ) : (
                      <>
                        <Bot className="h-3.5 w-3.5 text-purple-400" />
                        <span className="text-purple-300">POLARIS_AI</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>{m.timestamp}</span>
                    <button
                      onClick={() => handleCopy(m.content, m.id)}
                      className="hover:text-slate-200 transition-colors"
                      title="Copy Message"
                    >
                      {copiedId === m.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {m.content || (m.role === "assistant" && streaming ? "Synthesizing answer from notes…" : "")}
                </div>

                {/* Citations Panel */}
                {m.citations && m.citations.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="text-[10px] font-mono font-bold uppercase text-indigo-400 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span>Retrieved Source Citations ({m.citations.length})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.citations.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="bg-white/5 border border-white/10 p-2 text-xs font-mono rounded-none space-y-1"
                        >
                          <div className="flex items-center justify-between text-indigo-300 font-bold text-[11px]">
                            <span className="truncate">{c.doc_title || "Document"}</span>
                            <span>Page {c.page_number}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2 italic">
                            "{c.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={submit} className="mt-4 pt-3 border-t-2 border-indigo-500/40">
          <div className="brutal-card p-2 bg-slate-950 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMicActive(!micActive)}
              className={`p-2 border border-slate-700 font-mono transition-colors ${
                micActive ? "bg-rose-500/20 text-rose-400 border-rose-500/50" : "bg-black/60 text-slate-400 hover:text-white"
              }`}
              title="Toggle Mic Input"
            >
              {micActive ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Query documents or request study plan (Press Enter to send)..."
              rows={1}
              disabled={streaming}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none min-h-[40px] max-h-32"
            />

            {streaming ? (
              <Button
                type="button"
                onClick={cancel}
                className="bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs px-4 h-10 border border-rose-400 rounded-none flex items-center gap-1.5"
              >
                <Square className="h-3.5 w-3.5" />
                <span>HALT</span>
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim()}
                className="brutal-btn h-10 text-xs px-4 flex items-center gap-1.5"
              >
                <span>SEND</span>
                <CornerDownLeft className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}

function PromptChip({ text, onClick }: { text: string; onClick: (t: string) => void }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="font-mono text-[11px] px-3 py-1.5 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400 transition-all flex items-center gap-1.5"
    >
      <ChevronRight className="h-3 w-3 text-purple-400" />
      <span>"{text}"</span>
    </button>
  );
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
