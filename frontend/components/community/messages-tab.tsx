"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Search, School, Plus } from "lucide-react";
import { useCommunityStore, type Conversation } from "@/lib/community-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  initialPeerUsername?: string;
}

export function MessagesTab({ initialPeerUsername }: Props) {
  const {
    profile,
    friends,
    conversations,
    activeDmUsername,
    setActiveDmUsername,
    sendDirectMessage,
  } = useCommunityStore();

  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const effectivePeer = initialPeerUsername || activeDmUsername || "@elena_ml";
  const activeConversation: Conversation | undefined = conversations[effectivePeer];
  const connectedFriends = friends.filter((f) => f.status === "friends");

  const conversationList = Object.values(conversations).filter(
    (c) =>
      c.peerAlias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.peerUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.peerCollege.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    sendDirectMessage(effectivePeer, messageInput.trim());
    setMessageInput("");
  };

  const handleSendPrompt = (promptText: string) => {
    sendDirectMessage(effectivePeer, promptText);
  };

  return (
    <div className="grid h-[75vh] min-h-[520px] grid-cols-1 overflow-hidden rounded-xl border border-[#343536] bg-[#1a1a1b] shadow-lg md:grid-cols-12">
      {/* ── Left Pane: Reddit Direct Chat Threads ── */}
      <div className="flex h-full flex-col border-r border-[#343536] bg-[#151516] md:col-span-4">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#343536] p-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#d7dadc]">
              u/{profile.username.replace("@", "")}
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNewChatModal(true)}
            className="h-7 w-7 rounded-lg p-0 text-[#818384] hover:bg-[#272729] hover:text-[#d7dadc]"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-[#343536] p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#818384]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat..."
              className="w-full rounded-md border border-[#343536] bg-[#272729] py-1 pl-7 pr-2 text-xs text-[#d7dadc] placeholder:text-[#818384] focus:outline-none"
            />
          </div>
        </div>

        {/* Threads list */}
        <div className="flex-1 divide-y divide-[#272729] overflow-y-auto">
          {conversationList.length === 0 ? (
            <div className="space-y-1 p-6 text-center text-xs text-[#818384]">
              <MessageSquare className="mx-auto h-6 w-6 text-[#818384]/40" />
              <p>No chat threads yet.</p>
            </div>
          ) : (
            conversationList.map((conv) => {
              const isSelected = conv.peerUsername.toLowerCase() === effectivePeer.toLowerCase();

              return (
                <div
                  key={conv.peerUsername}
                  onClick={() => setActiveDmUsername(conv.peerUsername)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 p-3 transition-colors",
                    isSelected ? "border-l-2 border-[#ff4500] bg-[#272729]" : "hover:bg-[#1f1f20]",
                  )}
                >
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white",
                        conv.peerAvatarColor,
                      )}
                    >
                      {conv.peerAlias.charAt(0)}
                    </div>
                    {conv.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#151516] bg-emerald-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="truncate font-bold text-[#d7dadc]">{conv.peerAlias}</h4>
                      <span className="shrink-0 font-mono text-[10px] text-[#818384]">
                        {conv.lastMessageTime}
                      </span>
                    </div>
                    <p className="truncate font-mono text-[10px] text-[#818384]">
                      u/{conv.peerUsername.replace("@", "")}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#d7dadc]/70">
                      {conv.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Pane: Reddit Chat View ── */}
      <div className="flex h-full flex-col bg-[#1a1a1b] md:col-span-8">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#343536] bg-[#151516]/60 p-3">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white",
                      activeConversation.peerAvatarColor,
                    )}
                  >
                    {activeConversation.peerAlias.charAt(0)}
                  </div>
                  {activeConversation.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[#1a1a1b] bg-emerald-500" />
                  )}
                </div>

                <div>
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-[#d7dadc]">
                    <span>{activeConversation.peerAlias}</span>
                    <span className="font-mono text-[11px] font-normal text-[#818384]">
                      u/{activeConversation.peerUsername.replace("@", "")}
                    </span>
                  </h3>
                  <p className="flex items-center gap-1 text-[10px] text-[#818384]">
                    <School className="h-3 w-3 text-indigo-400" />
                    <span>{activeConversation.peerCollege}</span>
                  </p>
                </div>
              </div>

              <span className="rounded-md border border-[#343536] bg-[#272729] px-2 py-0.5 font-mono text-[10px] text-[#818384]">
                Direct Chat
              </span>
            </div>

            {/* Messages Viewport */}
            <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
              {activeConversation.messages.map((msg) => {
                const isMe =
                  msg.senderUsername === profile.username || msg.senderUsername === "@user";

                return (
                  <div
                    key={msg.id}
                    className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                        isMe
                          ? "rounded-br-xs bg-[#ff4500] text-white"
                          : "rounded-bl-xs border border-[#343536] bg-[#272729] text-[#d7dadc]",
                      )}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                    <span className="mt-0.5 px-1 font-mono text-[9px] text-[#818384]">
                      {msg.createdAt}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-t border-[#343536] px-3 py-1.5">
              <button
                type="button"
                onClick={() =>
                  handleSendPrompt("Have you finished the lecture reading for this week?")
                }
                className="shrink-0 rounded-md bg-[#272729] px-2 py-0.5 text-[10px] text-[#818384] hover:bg-[#343536]"
              >
                📚 Lecture check
              </button>
              <button
                type="button"
                onClick={() => handleSendPrompt("Can we compare our problem set formulas?")}
                className="shrink-0 rounded-md bg-[#272729] px-2 py-0.5 text-[10px] text-[#818384] hover:bg-[#343536]"
              >
                📐 Compare formulas
              </button>
              <button
                type="button"
                onClick={() => handleSendPrompt("Are you joining the study circle review tonight?")}
                className="shrink-0 rounded-md bg-[#272729] px-2 py-0.5 text-[10px] text-[#818384] hover:bg-[#343536]"
              >
                ⚡ Group review
              </button>
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="flex items-center gap-2 border-t border-[#343536] bg-[#151516] p-2.5"
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message u/${activeConversation.peerUsername.replace("@", "")}...`}
                className="flex-1 rounded-full border border-[#343536] bg-[#272729] px-3 py-2 text-xs text-[#d7dadc] placeholder:text-[#818384] focus:border-[#d7dadc] focus:outline-none"
              />

              <Button
                type="submit"
                size="sm"
                disabled={!messageInput.trim()}
                className="h-8 w-8 shrink-0 rounded-full bg-[#ff4500] p-0 text-white hover:bg-[#e03d00]"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center space-y-2 p-6 text-center text-[#818384]">
            <MessageSquare className="h-10 w-10 text-[#818384]/30" />
            <h3 className="text-xs font-bold text-[#d7dadc]">Your Direct Messages</h3>
            <p className="max-w-xs text-[11px]">
              Chat with connected campus classmates and share problem set notes.
            </p>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
        <DialogContent className="max-w-sm rounded-xl border border-[#343536] bg-[#1a1a1b] p-5 text-[#d7dadc]">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#d7dadc]">
              Direct Message a Friend
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            {connectedFriends.length === 0 ? (
              <p className="py-4 text-center text-xs text-[#818384]">No connected friends yet.</p>
            ) : (
              connectedFriends.map((f) => (
                <div
                  key={f.id}
                  onClick={() => {
                    setActiveDmUsername(f.username);
                    setShowNewChatModal(false);
                    toast.info(`Opened chat with ${f.alias}`);
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-lg bg-[#272729] p-2.5 text-xs transition-colors hover:bg-[#343536]"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white",
                        f.avatarColor,
                      )}
                    >
                      {f.alias.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-[#d7dadc]">{f.alias}</p>
                      <p className="font-mono text-[10px] text-[#818384]">
                        u/{f.username.replace("@", "")}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#ff4500]">Chat</span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
