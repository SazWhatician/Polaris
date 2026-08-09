import { api } from "@/lib/api/client";

export type DocumentStatus =
  | "requested"
  | "uploaded"
  | "queued"
  | "processing"
  | "ocr_complete"
  | "failed";

export interface DocumentResponse {
  id: string;
  user_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: DocumentStatus;
  storage_path: string;
  content_hash: string | null;
  page_count: number | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

interface DocumentListResponse {
  items: DocumentResponse[];
  next_cursor: string | null;
}

interface DocumentCreateResponse {
  document_id: string;
  upload_url: string;
  storage_path: string;
  expires_in_seconds: number;
  method: "PUT";
  required_headers: Record<string, string>;
}

export interface PageItem {
  document_id: string;
  page_number: number;
  text: string;
  confidence: number;
  ocr_engine: string;
  processed_at: string;
}

interface PageListResponse {
  items: PageItem[];
}

export async function listDocuments(): Promise<DocumentResponse[]> {
  const res = await api<DocumentListResponse>("/api/documents");
  return res.items;
}

export async function deleteDocument(id: string): Promise<void> {
  await api<void>(`/api/documents/${id}`, { method: "DELETE" });
}

export async function reprocessDocument(id: string): Promise<DocumentResponse> {
  return api<DocumentResponse>(`/api/documents/${id}/reprocess`, { method: "POST" });
}

export async function listPages(id: string): Promise<PageItem[]> {
  const res = await api<PageListResponse>(`/api/documents/${id}/pages`);
  return res.items;
}

/** End-to-end upload: request signed URL → PUT bytes → finalize (with direct upload fallback). */
export async function uploadDocument(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<DocumentResponse> {
  const create = await api<DocumentCreateResponse>("/api/documents", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    }),
  });

  try {
    await putWithProgress(create.upload_url, file, create.required_headers, onProgress);
    return await api<DocumentResponse>(`/api/documents/${create.document_id}/finalize`, {
      method: "POST",
    });
  } catch (err) {
    console.warn("Signed URL upload failed, falling back to direct upload", err);
    return await uploadDirect(create.document_id, file, onProgress);
  }
}

export async function uploadDirect(
  documentId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api<DocumentResponse>(`/api/documents/${documentId}/upload`, {
    method: "POST",
    body: formData,
  });

  if (onProgress) onProgress(100);
  return res;
}

function putWithProgress(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) onProgress((e.loaded / e.total) * 100);
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Storage PUT failed: ${xhr.status} ${xhr.statusText}`));
    });
    xhr.addEventListener("error", () => reject(new Error("Storage PUT network error")));
    xhr.send(file);
  });
}

