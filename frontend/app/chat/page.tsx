"use client";

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Square, Bot, User, Sparkles, Copy, Check, Mic, MicOff, Settings2, FileText, ChevronRight, CornerDownLeft, ArrowRight, MessageSquare, Target, Calendar } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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
  useGsapEntrance(".chat-msg-reveal", 0.05);

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
      submit();
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <SiteHeader />
      
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col px-4 sm:px-8 py-6">
        
        {/* Step-by-Step Pipeline Header */}
        <div className="glass-card-glow p-4 text-xs mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Step 2: Grounded RAG AI Assistant</span>
              </div>
              <h2 className="text-base font-bold text-slate-100">Ask Questions Cited From Your Notes & Syllabus</h2>
            </div>
            <Link
              href="/gaps"
              className="glass-button text-xs py-1.5 px-3 font-medium flex items-center gap-1 self-start md:self-auto"
            >
              <span>Step 3: Analyze Learning Gaps</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <WorkflowStep number="1" label="Upload Docs" href="/dashboard" icon={<FileText className="h-3 w-3 text-indigo-400" />} />
            <WorkflowStep active number="2" label="Grounded RAG Chat" href="/chat" icon={<MessageSquare className="h-3 w-3 text-purple-400" />} />
            <WorkflowStep number="3" label="Gaps & YT Videos" href="/gaps" icon={<Target className="h-3 w-3 text-pink-400" />} />
            <WorkflowStep number="4" label="Revision Planner" href="/plan" icon={<Calendar className="h-3 w-3 text-cyan-400" />} />
          </div>
        </div>

        {/* Settings Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5 text-indigo-400" /> Model:
            </span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              <option value="groq-llama3-70b">Groq Llama-3.1 70B (Fast Free)</option>
              <option value="nvidia-nim-embed">NVIDIA NIM Grounded</option>
            </select>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono">Qdrant Filter Active</span>
        </div>

        {/* Main Chat Stream Container */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[58vh]">
          {messages.length === 0 ? (
            <div className="glass-card p-8 text-center space-y-4 max-w-lg mx-auto my-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto">
                <Bot className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Grounded RAG Knowledge Assistant</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ask questions about your course materials. Every response includes page-level citations from your uploaded PDFs.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <PromptChip text="Summarize Chapter 3 key equations" onClick={(t) => setInput(t)} />
                <PromptChip text="What are the main topics in the syllabus?" onClick={(t) => setInput(t)} />
                <PromptChip text="Explain Fourier Transforms with examples" onClick={(t) => setInput(t)} />
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-msg-reveal flex gap-3 p-4 rounded-2xl border transition-all ${
                  msg.role === "user"
                    ? "bg-indigo-950/40 border-indigo-500/30 ml-8"
                    : "bg-slate-900/60 border-slate-800 mr-8"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                  msg.role === "user" ? "bg-indigo-600" : "bg-purple-600"
                }`}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className="flex-1 space-y-2 text-xs leading-relaxed">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/60 pb-1">
                    <span className="font-semibold text-slate-200">{msg.role === "user" ? "You" : "Polaris AI"}</span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {msg.role === "assistant" && (
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-white transition-colors"
                        >
                          {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap text-slate-200">{msg.content || (streaming && "Thinking...")}</div>

                  {/* Citations List */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Citations & Snippets:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-mono"
                          >
                            [{c.document_id || "Doc"} Pg.{c.page_number}]
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={submit} className="mt-4 pt-3 border-t border-slate-800">
          <div className="glass-card p-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMicActive(!micActive)}
              className={`p-2 rounded-xl transition-colors text-xs ${
                micActive ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "bg-slate-900 text-slate-400 hover:text-white"
              }`}
              title="Toggle Voice Input"
            >
              {micActive ? <Mic className="h-4 w-4 animate-pulse" /> : <MicOff className="h-4 w-4" />}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask questions about uploaded documents (Press Enter to send)..."
              rows={1}
              disabled={streaming}
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none min-h-[40px] max-h-32"
            />

            {streaming ? (
              <Button
                type="button"
                onClick={cancel}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 h-10 rounded-xl flex items-center gap-1.5"
              >
                <Square className="h-3.5 w-3.5" />
                <span>Halt</span>
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim()}
                className="glass-button h-10 text-xs px-4 flex items-center gap-1.5 font-semibold"
              >
                <span>Send</span>
                <CornerDownLeft className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}

function WorkflowStep({
  number,
  label,
  href,
  icon,
  active = false,
}: {
  number: string;
  label: string;
  href: React.ComponentProps<typeof Link>["href"];
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`p-2 rounded-lg border flex items-center gap-2 text-[11px] transition-all ${
        active
          ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 font-semibold"
          : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
      }`}
    >
      <span className={`w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${
        active ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"
      }`}>
        {number}
      </span>
      {icon}
      <span className="truncate">{label}</span>
    </Link>
  );
}

function PromptChip({ text, onClick }: { text: string; onClick: (t: string) => void }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="text-xs px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all flex items-center gap-1.5"
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
