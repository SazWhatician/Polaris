"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  MessageSquare,
  Search,
  School,
  Sparkles,
  Plus,
} from "lucide-react";
import {
  useCommunityStore,
  type Conversation,
} from "@/lib/community-store";
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

  const conversationList = Object.values(conversations).filter((c) =>
    c.peerAlias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.peerUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.peerCollege.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="bg-[#1a1a1b] border border-[#343536] rounded-xl overflow-hidden shadow-lg h-[75vh] min-h-[520px] grid grid-cols-1 md:grid-cols-12">
      {/* ── Left Pane: Reddit Direct Chat Threads ── */}
      <div className="md:col-span-4 border-r border-[#343536] flex flex-col h-full bg-[#151516]">
        {/* Header */}
        <div className="p-3 border-b border-[#343536] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-[#d7dadc]">
              u/{profile.username.replace("@", "")}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowNewChatModal(true)}
            className="h-7 w-7 p-0 rounded-lg text-[#818384] hover:text-[#d7dadc] hover:bg-[#272729]"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-[#343536] shrink-0">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#818384]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat..."
              className="w-full pl-7 pr-2 py-1 text-xs rounded-md bg-[#272729] border border-[#343536] text-[#d7dadc] placeholder:text-[#818384] focus:outline-none"
            />
          </div>
        </div>

        {/* Threads list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#272729]">
          {conversationList.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#818384] space-y-1">
              <MessageSquare className="w-6 h-6 text-[#818384]/40 mx-auto" />
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
                    "p-3 flex items-center gap-2.5 cursor-pointer transition-colors",
                    isSelected ? "bg-[#272729] border-l-2 border-[#ff4500]" : "hover:bg-[#1f1f20]"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs", conv.peerAvatarColor)}>
                      {conv.peerAlias.charAt(0)}
                    </div>
                    {conv.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#151516]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#d7dadc] truncate">{conv.peerAlias}</h4>
                      <span className="text-[10px] text-[#818384] font-mono shrink-0">
                        {conv.lastMessageTime}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-[#818384] truncate">
                      u/{conv.peerUsername.replace("@", "")}
                    </p>
                    <p className="text-[11px] text-[#d7dadc]/70 truncate mt-0.5">
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
      <div className="md:col-span-8 flex flex-col h-full bg-[#1a1a1b]">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="p-3 border-b border-[#343536] flex items-center justify-between bg-[#151516]/60">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs", activeConversation.peerAvatarColor)}>
                    {activeConversation.peerAlias.charAt(0)}
                  </div>
                  {activeConversation.online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#1a1a1b]" />
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-[#d7dadc] flex items-center gap-1.5">
                    <span>{activeConversation.peerAlias}</span>
                    <span className="text-[11px] font-mono font-normal text-[#818384]">
                      u/{activeConversation.peerUsername.replace("@", "")}
                    </span>
                  </h3>
                  <p className="text-[10px] text-[#818384] flex items-center gap-1">
                    <School className="w-3 h-3 text-indigo-400" />
                    <span>{activeConversation.peerCollege}</span>
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#272729] text-[#818384] border border-[#343536]">
                Direct Chat
              </span>
            </div>

            {/* Messages Viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {activeConversation.messages.map((msg) => {
                const isMe = msg.senderUsername === profile.username || msg.senderUsername === "@user";

                return (
                  <div
                    key={msg.id}
                    className={cn("flex flex-col", isMe ? "items-end" : "items-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed",
                        isMe
                          ? "bg-[#ff4500] text-white rounded-br-xs"
                          : "bg-[#272729] text-[#d7dadc] border border-[#343536] rounded-bl-xs"
                      )}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>
                    <span className="text-[9px] font-mono text-[#818384] px-1 mt-0.5">
                      {msg.createdAt}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-3 py-1.5 border-t border-[#343536] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => handleSendPrompt("Have you finished the lecture reading for this week?")}
                className="px-2 py-0.5 rounded-md text-[10px] bg-[#272729] hover:bg-[#343536] text-[#818384] shrink-0"
              >
                📚 Lecture check
              </button>
              <button
                type="button"
                onClick={() => handleSendPrompt("Can we compare our problem set formulas?")}
                className="px-2 py-0.5 rounded-md text-[10px] bg-[#272729] hover:bg-[#343536] text-[#818384] shrink-0"
              >
                📐 Compare formulas
              </button>
              <button
                type="button"
                onClick={() => handleSendPrompt("Are you joining the study circle review tonight?")}
                className="px-2 py-0.5 rounded-md text-[10px] bg-[#272729] hover:bg-[#343536] text-[#818384] shrink-0"
              >
                ⚡ Group review
              </button>
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-2.5 border-t border-[#343536] flex items-center gap-2 bg-[#151516]"
            >
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Message u/${activeConversation.peerUsername.replace("@", "")}...`}
                className="flex-1 px-3 py-2 text-xs rounded-full bg-[#272729] border border-[#343536] text-[#d7dadc] placeholder:text-[#818384] focus:outline-none focus:border-[#d7dadc]"
              />

              <Button
                type="submit"
                size="sm"
                disabled={!messageInput.trim()}
                className="h-8 w-8 p-0 rounded-full bg-[#ff4500] hover:bg-[#e03d00] text-white shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2 text-[#818384]">
            <MessageSquare className="w-10 h-10 text-[#818384]/30" />
            <h3 className="text-xs font-bold text-[#d7dadc]">Your Direct Messages</h3>
            <p className="text-[11px] max-w-xs">
              Chat with connected campus classmates and share problem set notes.
            </p>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
        <DialogContent className="max-w-sm p-5 bg-[#1a1a1b] border border-[#343536] text-[#d7dadc] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-[#d7dadc]">
              Direct Message a Friend
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            {connectedFriends.length === 0 ? (
              <p className="text-xs text-[#818384] text-center py-4">No connected friends yet.</p>
            ) : (
              connectedFriends.map((f) => (
                <div
                  key={f.id}
                  onClick={() => {
                    setActiveDmUsername(f.username);
                    setShowNewChatModal(false);
                    toast.info(`Opened chat with ${f.alias}`);
                  }}
                  className="p-2.5 rounded-lg bg-[#272729] hover:bg-[#343536] flex items-center justify-between cursor-pointer transition-colors text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs", f.avatarColor)}>
                      {f.alias.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-[#d7dadc]">{f.alias}</p>
                      <p className="text-[10px] font-mono text-[#818384]">u/{f.username.replace("@", "")}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#ff4500] font-bold">Chat</span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
