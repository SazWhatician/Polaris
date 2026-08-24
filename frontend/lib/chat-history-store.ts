import { type Citation } from "@/lib/api/chat";

export interface ChatSessionMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatSessionMessage[];
  documentIds?: string[];
  model?: string;
  citationCount: number;
}

const STORAGE_KEY = "polaris_chat_sessions_v1";

const DEFAULT_DEMO_SESSIONS: ChatSession[] = [
  {
    id: "session-cs101-intro",
    title: "Graph Search & Prerequisite Analysis",
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    citationCount: 4,
    model: "Groq Llama-3.1 70B",
    messages: [
      {
        id: "msg-1",
        role: "user",
        content: "What are the core prerequisites for Dynamic Programming algorithms?",
        timestamp: "02:15 PM",
      },
      {
        id: "msg-2",
        role: "assistant",
        content:
          "Based on your uploaded syllabus and lecture notes (Algorithms_Chapter4.pdf), Dynamic Programming requires mastery of: 1) Recursion and Call Stacks, 2) Optimal Substructure properties, and 3) Overlapping Subproblems with memoization.",
        citations: [
          {
            document_id: "doc-algo-ch4",
            document_filename: "Algorithms_Chapter4.pdf",
            page_number: 12,
            chunk_index: 2,
            text: "Dynamic programming simplifies complex problems by breaking them down into simpler sub-problems in a recursive manner.",
            score: 0.94,
          },
        ],
        timestamp: "02:15 PM",
      },
    ],
  },
  {
    id: "session-quantum-physics",
    title: "Quantum Superposition & Wave Mechanics",
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    citationCount: 3,
    model: "NVIDIA NIM Grounded",
    messages: [
      {
        id: "msg-3",
        role: "user",
        content: "How does Schrödinger's wave equation model particle probability density?",
        timestamp: "Yesterday",
      },
      {
        id: "msg-4",
        role: "assistant",
        content:
          "Schrödinger's equation describes the evolution of a quantum state over time. The squared magnitude of the wave function |ψ(x,t)|² yields the probability density of finding the particle at position x.",
        citations: [
          {
            document_id: "doc-phys-wave",
            document_filename: "Quantum_Mechanics_Notes.pdf",
            page_number: 45,
            chunk_index: 1,
            text: "Born interpretation: probability density P(x) = |ψ(x)|²",
            score: 0.98,
          },
        ],
        timestamp: "Yesterday",
      },
    ],
  },
];

export function getStoredChatSessions(): ChatSession[] {
  if (typeof window === "undefined") return DEFAULT_DEMO_SESSIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_SESSIONS));
      return DEFAULT_DEMO_SESSIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DEMO_SESSIONS;
  } catch {
    return DEFAULT_DEMO_SESSIONS;
  }
}

export function saveChatSession(session: ChatSession): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getStoredChatSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);
    let updated: ChatSession[];
    if (existingIndex >= 0) {
      updated = [...sessions];
      updated[existingIndex] = session;
    } else {
      updated = [session, ...sessions];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("polaris:chat-history-updated", { detail: updated }));
  } catch (err) {
    console.error("Failed to save chat session", err);
  }
}

export function deleteChatSession(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getStoredChatSessions();
    const updated = sessions.filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("polaris:chat-history-updated", { detail: updated }));
  } catch (err) {
    console.error("Failed to delete chat session", err);
  }
}

export function clearAllChatSessions(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("polaris:chat-history-updated", { detail: [] }));
  } catch (err) {
    console.error("Failed to clear chat sessions", err);
  }
}
