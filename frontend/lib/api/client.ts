import { getIdToken } from "@/lib/firebase";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiOptions extends RequestInit {
  /** If true, attach the Firebase ID token. Default: true. */
  auth?: boolean;
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");
  if (rest.body && !(rest.body instanceof FormData)) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = await getIdToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers: finalHeaders });
  const text = await res.text();
  const body = text ? safeJson(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, body, `${res.status} ${res.statusText} for ${path}`);
  }
  return body as T;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
