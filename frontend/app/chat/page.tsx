"use client";

import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Square, Bot, User, Sparkles, Copy, Check, Mic, MicOff, Settings2, FileText, ChevronRight, CornerDownLeft, ArrowRight, MessageSquare, Target, Calendar } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
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
    <div className="min-h-screen text-foreground flex flex-col">
      <SiteHeader />
      
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col px-4 sm:px-8 py-6">
        
        {/* Step-by-Step Pipeline Header */}
        <div className="skeuo-card p-5 text-xs mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3 mb-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Step 2: Grounded RAG AI Assistant</span>
              </div>
              <h2 className="text-base font-bold text-foreground">Ask Questions Cited From Your Notes & Syllabus</h2>
            </div>
            <Link
              href="/gaps"
              className="skeuo-button text-xs py-2 px-3 font-bold flex items-center gap-1 self-start md:self-auto"
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
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-xs font-medium">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
              <Settings2 className="h-3.5 w-3.5 text-indigo-400" /> Model:
            </span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="skeuo-inset px-3 py-1.5 text-xs text-foreground focus:outline-none font-medium"
            >
              <option value="groq-llama3-70b">Groq Llama-3.1 70B (Fast Free)</option>
              <option value="nvidia-nim-embed">NVIDIA NIM Grounded</option>
            </select>
          </div>
          <span className="skeuo-badge text-[10px] text-emerald-400 border-emerald-500/30">
            Qdrant Filter Active
          </span>
        </div>

        {/* Main Chat Stream Container */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[58vh]">
          {messages.length === 0 ? (
            <div className="skeuo-card p-8 text-center space-y-4 max-w-lg mx-auto my-8">
              <div className="w-12 h-12 rounded-2xl skeuo-inset flex items-center justify-center mx-auto text-indigo-400">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Grounded RAG Knowledge Assistant</h3>
                <p className="text-xs text-muted-foreground mt-1">
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
                className={`chat-msg-reveal flex gap-3 p-4 skeuo-card transition-all ${
                  msg.role === "user"
                    ? "ml-8 !bg-indigo-950/30"
                    : "mr-8"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs skeuo-button ${
                  msg.role === "user" ? "!bg-indigo-600" : "!bg-purple-600"
                }`}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className="flex-1 space-y-2 text-xs leading-relaxed">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground border-b border-white/10 pb-1 font-medium">
                    <span className="font-bold text-foreground">{msg.role === "user" ? "You" : "Polaris AI"}</span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      {msg.role === "assistant" && (
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-foreground transition-colors"
                        >
                          {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap text-foreground">{msg.content || (streaming && "Thinking...")}</div>

                  {/* Citations List */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-white/10 space-y-1">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Citations & Snippets:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, idx) => (
                          <span
                            key={idx}
                            className="skeuo-badge text-[10px] text-indigo-300 font-mono"
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
        <form onSubmit={submit} className="mt-4 pt-3 border-t border-white/10">
          <div className="skeuo-card p-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMicActive(!micActive)}
              className={`p-2.5 rounded-xl transition-all text-xs font-bold ${
                micActive ? "skeuo-button bg-rose-600 text-white" : "skeuo-button-secondary"
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
              className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none min-h-[40px] max-h-32"
            />

            {streaming ? (
              <button
                type="button"
                onClick={cancel}
                className="skeuo-button bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 h-10 font-bold flex items-center gap-1.5"
              >
                <Square className="h-3.5 w-3.5" />
                <span>Halt</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="skeuo-button h-10 text-xs px-4 flex items-center gap-1.5 font-bold"
              >
                <span>Send</span>
                <CornerDownLeft className="h-3.5 w-3.5" />
              </button>
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
      className={`p-2 rounded-lg flex items-center gap-2 text-[11px] font-semibold transition-all select-none ${
        active
          ? "skeuo-button text-white font-bold"
          : "skeuo-inset hover:text-foreground"
      }`}
    >
      <span className={`w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center ${
        active ? "bg-white text-indigo-700" : "bg-white/10 text-muted-foreground"
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
      className="skeuo-badge text-xs text-indigo-300 hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer"
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
