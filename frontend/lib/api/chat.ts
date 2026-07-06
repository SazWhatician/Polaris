import { getIdToken } from "@/lib/firebase";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export interface Citation {
  document_id: string;
  document_filename: string;
  page_number: number;
  chunk_index: number;
  text: string;
  score: number;
}

export type ChatEvent =
  | { type: "citations"; citations: Citation[] }
  | { type: "token"; content: string }
  | { type: "done" };

/**
 * POST /api/chat/stream and parse the SSE response. Calls `onEvent` for each
 * event. Throws on HTTP error. Use `signal` to cancel.
 *
 * We use fetch + manual SSE parsing (not EventSource) because EventSource:
 *   - can't send custom Authorization headers
 *   - can't POST a body
 */
export async function streamChat(
  question: string,
  options: {
    documentIds?: string[];
    topK?: number;
    onEvent: (event: ChatEvent) => void;
    signal?: AbortSignal;
  },
): Promise<void> {
  const token = await getIdToken();
  if (!token) throw new Error("Not signed in");

  const res = await fetch(`${BASE_URL}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      question,
      document_ids: options.documentIds,
      top_k: options.topK,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line ("\n\n").
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        const dataLine = frame
          .split("\n")
          .find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        const payload = dataLine.slice("data:".length).trim();
        if (!payload) continue;
        try {
          options.onEvent(JSON.parse(payload) as ChatEvent);
        } catch (err) {
          console.warn("Bad SSE payload", err, payload);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
