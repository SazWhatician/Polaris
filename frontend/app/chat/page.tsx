"use client";

import { Send, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { ChatMessage } from "@/components/chat-message";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { streamChat, type Citation } from "@/lib/api/chat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || streaming) return;

    const userMsg: Message = { id: cryptoId(), role: "user", content: question };
    const assistantMsg: Message = { id: cryptoId(), role: "assistant", content: "" };
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
                msg.id === assistantMsg.id ? { ...msg, citations: event.citations } : msg,
              ),
            );
          } else if (event.type === "token") {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantMsg.id
                  ? { ...msg, content: msg.content + event.content }
                  : msg,
              ),
            );
          }
        },
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Chat failed", {
          description: err instanceof Error ? err.message : String(err),
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const cancel = () => abortRef.current?.abort();

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  if (loading || !user) return null;

  return (
    <div className="flex h-screen flex-col">
      <SiteHeader />
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl space-y-4 py-6">
          {messages.length === 0 && (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Ask anything about your indexed notes. Try: <em>“What is ARP?”</em>
            </div>
          )}
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              role={m.role}
              content={m.content}
              citations={m.citations}
              streaming={streaming && m.id === messages[messages.length - 1]?.id && m.role === "assistant"}
            />
          ))}
        </div>
      </div>
      <form
        onSubmit={submit}
        className="border-t bg-background/95 px-4 py-3 backdrop-blur"
      >
        <div className="container flex max-w-3xl items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Ask a question about your notes…"
            rows={1}
            disabled={streaming}
            className="flex max-h-40 min-h-[40px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
          {streaming ? (
            <Button type="button" variant="outline" size="icon" onClick={cancel} aria-label="Stop">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function cryptoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}
